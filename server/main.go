// MyCV API: Google sign-in + per-user resume storage (SQLite).
//
// Env:
//   MYCV_LISTEN            default 127.0.0.1:7801
//   MYCV_DB                default ./mycv.db
//   MYCV_GOOGLE_CLIENT_ID  OAuth 2.0 Web client ID; login is disabled when empty
//   MYCV_INSECURE_COOKIE   set to 1 for plain-http local development
//   ANTHROPIC_API_KEY      enables POST /api/parse-cv (AI extraction of uploaded CVs)
package main

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	_ "modernc.org/sqlite"
)

const (
	sessionCookie = "mycv_session"
	sessionTTL    = 30 * 24 * time.Hour
	maxBody       = 4 << 20
)

type server struct {
	db       *sql.DB
	clientID string
	insecure bool
}

type user struct {
	ID      int64  `json:"id"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

func main() {
	listen := envOr("MYCV_LISTEN", "127.0.0.1:7801")
	dbPath := envOr("MYCV_DB", "./mycv.db")
	s := &server{clientID: strings.TrimSpace(os.Getenv("MYCV_GOOGLE_CLIENT_ID")), insecure: os.Getenv("MYCV_INSECURE_COOKIE") == "1"}

	db, err := sql.Open("sqlite", dbPath+"?_pragma=journal_mode(WAL)&_pragma=busy_timeout(5000)&_pragma=foreign_keys(1)")
	if err != nil {
		log.Fatal(err)
	}
	db.SetMaxOpenConns(1)
	s.db = db
	if err := s.migrate(); err != nil {
		log.Fatal(err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/healthz", func(w http.ResponseWriter, _ *http.Request) { writeJSON(w, 200, map[string]bool{"ok": true}) })
	mux.HandleFunc("GET /api/config", s.handleConfig)
	mux.HandleFunc("POST /api/auth/google", s.handleGoogleLogin)
	mux.HandleFunc("GET /api/auth/me", s.handleMe)
	mux.HandleFunc("POST /api/auth/logout", s.handleLogout)
	mux.HandleFunc("GET /api/resumes", s.auth(s.handleListResumes))
	mux.HandleFunc("PUT /api/resumes/{id}", s.auth(s.handlePutResume))
	mux.HandleFunc("DELETE /api/resumes/{id}", s.auth(s.handleDeleteResume))
	mux.HandleFunc("POST /api/parse-cv", s.auth(s.handleParseCV))

	go s.cleanupLoop()

	onOff := map[bool]string{true: "enabled", false: "DISABLED"}
	log.Printf("mycv-server listening on %s (db=%s, google login %s, ai parse %s)", listen, dbPath, onOff[s.clientID != ""], onOff[s.aiEnabled()])
	srv := &http.Server{Addr: listen, Handler: logRequests(mux), ReadHeaderTimeout: 10 * time.Second}
	log.Fatal(srv.ListenAndServe())
}

func (s *server) migrate() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  google_sub TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  picture TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  last_login INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS resumes (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS resumes_user ON resumes(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS sessions_exp ON sessions(expires_at);`)
	return err
}

/* ---------------- auth ---------------- */

func (s *server) handleConfig(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, 200, map[string]any{"googleClientId": s.clientID, "aiParse": s.aiEnabled()})
}

// handleGoogleLogin verifies a Google Identity Services ID token and opens a session.
func (s *server) handleGoogleLogin(w http.ResponseWriter, r *http.Request) {
	if s.clientID == "" {
		writeErr(w, 503, "google login is not configured")
		return
	}
	var body struct {
		Credential string `json:"credential"`
	}
	if err := json.NewDecoder(io.LimitReader(r.Body, 64<<10)).Decode(&body); err != nil || body.Credential == "" {
		writeErr(w, 400, "credential required")
		return
	}
	info, err := verifyGoogleIDToken(r.Context(), body.Credential, s.clientID)
	if err != nil {
		log.Printf("google token rejected: %v", err)
		writeErr(w, 401, "invalid google token")
		return
	}
	now := time.Now().Unix()
	_, err = s.db.Exec(`INSERT INTO users (google_sub, email, name, picture, created_at, last_login) VALUES (?,?,?,?,?,?)
		ON CONFLICT(google_sub) DO UPDATE SET email=excluded.email, name=excluded.name, picture=excluded.picture, last_login=excluded.last_login`,
		info.Sub, info.Email, info.Name, info.Picture, now, now)
	if err != nil {
		writeErr(w, 500, "db error")
		return
	}
	var u user
	if err := s.db.QueryRow(`SELECT id, email, name, picture FROM users WHERE google_sub = ?`, info.Sub).Scan(&u.ID, &u.Email, &u.Name, &u.Picture); err != nil {
		writeErr(w, 500, "db error")
		return
	}
	tok, err := randomToken()
	if err != nil {
		writeErr(w, 500, "token error")
		return
	}
	exp := time.Now().Add(sessionTTL)
	if _, err := s.db.Exec(`INSERT INTO sessions (token, user_id, expires_at) VALUES (?,?,?)`, tok, u.ID, exp.Unix()); err != nil {
		writeErr(w, 500, "db error")
		return
	}
	http.SetCookie(w, &http.Cookie{Name: sessionCookie, Value: tok, Path: "/", HttpOnly: true, Secure: !s.insecure, SameSite: http.SameSiteLaxMode, Expires: exp})
	writeJSON(w, 200, map[string]any{"user": u})
}

type googleInfo struct {
	Sub, Email, Name, Picture string
}

// verifyGoogleIDToken uses Google's tokeninfo endpoint, which validates signature and expiry.
func verifyGoogleIDToken(ctx context.Context, idToken, clientID string) (*googleInfo, error) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	req, _ := http.NewRequestWithContext(ctx, "GET", "https://oauth2.googleapis.com/tokeninfo?id_token="+url.QueryEscape(idToken), nil)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		b, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		return nil, fmt.Errorf("tokeninfo %d: %s", resp.StatusCode, strings.TrimSpace(string(b)))
	}
	var t struct {
		Aud, Iss, Sub, Email, EmailVerified, Name, Picture, Exp string `json:",omitempty"`
	}
	raw := map[string]string{}
	if err := json.NewDecoder(resp.Body).Decode(&raw); err != nil {
		return nil, err
	}
	t.Aud, t.Iss, t.Sub, t.Email, t.EmailVerified, t.Name, t.Picture, t.Exp = raw["aud"], raw["iss"], raw["sub"], raw["email"], raw["email_verified"], raw["name"], raw["picture"], raw["exp"]
	if t.Aud != clientID {
		return nil, errors.New("audience mismatch")
	}
	if t.Iss != "https://accounts.google.com" && t.Iss != "accounts.google.com" {
		return nil, errors.New("bad issuer")
	}
	if t.Sub == "" || t.Email == "" || t.EmailVerified != "true" {
		return nil, errors.New("email not verified")
	}
	if exp, _ := strconv.ParseInt(t.Exp, 10, 64); exp < time.Now().Unix() {
		return nil, errors.New("token expired")
	}
	return &googleInfo{Sub: t.Sub, Email: t.Email, Name: t.Name, Picture: t.Picture}, nil
}

func (s *server) currentUser(r *http.Request) (*user, error) {
	c, err := r.Cookie(sessionCookie)
	if err != nil || c.Value == "" {
		return nil, errors.New("no session")
	}
	var u user
	err = s.db.QueryRow(`SELECT u.id, u.email, u.name, u.picture FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > ?`, c.Value, time.Now().Unix()).
		Scan(&u.ID, &u.Email, &u.Name, &u.Picture)
	if err != nil {
		return nil, errors.New("invalid session")
	}
	return &u, nil
}

func (s *server) handleMe(w http.ResponseWriter, r *http.Request) {
	u, err := s.currentUser(r)
	if err != nil {
		writeJSON(w, 200, map[string]any{"user": nil})
		return
	}
	writeJSON(w, 200, map[string]any{"user": u})
}

func (s *server) handleLogout(w http.ResponseWriter, r *http.Request) {
	if c, err := r.Cookie(sessionCookie); err == nil {
		_, _ = s.db.Exec(`DELETE FROM sessions WHERE token = ?`, c.Value)
	}
	http.SetCookie(w, &http.Cookie{Name: sessionCookie, Value: "", Path: "/", HttpOnly: true, Secure: !s.insecure, SameSite: http.SameSiteLaxMode, MaxAge: -1})
	writeJSON(w, 200, map[string]bool{"ok": true})
}

type ctxKey struct{}

func (s *server) auth(next func(http.ResponseWriter, *http.Request, *user)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u, err := s.currentUser(r)
		if err != nil {
			writeErr(w, 401, "unauthorized")
			return
		}
		next(w, r, u)
	}
}

/* ---------------- resumes ---------------- */

func (s *server) handleListResumes(w http.ResponseWriter, _ *http.Request, u *user) {
	rows, err := s.db.Query(`SELECT data FROM resumes WHERE user_id = ? ORDER BY updated_at DESC`, u.ID)
	if err != nil {
		writeErr(w, 500, "db error")
		return
	}
	defer rows.Close()
	out := []json.RawMessage{}
	for rows.Next() {
		var d string
		if err := rows.Scan(&d); err == nil {
			out = append(out, json.RawMessage(d))
		}
	}
	writeJSON(w, 200, out)
}

func (s *server) handlePutResume(w http.ResponseWriter, r *http.Request, u *user) {
	id := r.PathValue("id")
	if len(id) < 4 || len(id) > 64 {
		writeErr(w, 400, "bad id")
		return
	}
	raw, err := io.ReadAll(io.LimitReader(r.Body, maxBody+1))
	if err != nil || len(raw) > maxBody {
		writeErr(w, 413, "resume too large")
		return
	}
	var meta struct {
		ID        string `json:"id"`
		Name      string `json:"name"`
		UpdatedAt int64  `json:"updatedAt"`
	}
	if err := json.Unmarshal(raw, &meta); err != nil || meta.ID != id {
		writeErr(w, 400, "invalid resume json")
		return
	}
	var owner int64
	switch err := s.db.QueryRow(`SELECT user_id FROM resumes WHERE id = ?`, id).Scan(&owner); {
	case err == nil && owner != u.ID:
		writeErr(w, 409, "id belongs to another user")
		return
	case err != nil && !errors.Is(err, sql.ErrNoRows):
		writeErr(w, 500, "db error")
		return
	}
	if meta.UpdatedAt == 0 {
		meta.UpdatedAt = time.Now().UnixMilli()
	}
	_, err = s.db.Exec(`INSERT INTO resumes (id, user_id, name, data, updated_at) VALUES (?,?,?,?,?)
		ON CONFLICT(id) DO UPDATE SET name=excluded.name, data=excluded.data, updated_at=excluded.updated_at`,
		id, u.ID, meta.Name, string(raw), meta.UpdatedAt)
	if err != nil {
		writeErr(w, 500, "db error")
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true, "updatedAt": meta.UpdatedAt})
}

func (s *server) handleDeleteResume(w http.ResponseWriter, r *http.Request, u *user) {
	_, err := s.db.Exec(`DELETE FROM resumes WHERE id = ? AND user_id = ?`, r.PathValue("id"), u.ID)
	if err != nil {
		writeErr(w, 500, "db error")
		return
	}
	writeJSON(w, 200, map[string]bool{"ok": true})
}

/* ---------------- helpers ---------------- */

func (s *server) cleanupLoop() {
	for {
		_, _ = s.db.Exec(`DELETE FROM sessions WHERE expires_at < ?`, time.Now().Unix())
		time.Sleep(time.Hour)
	}
}

func randomToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func envOr(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}

func writeErr(w http.ResponseWriter, code int, msg string) {
	writeJSON(w, code, map[string]string{"error": msg})
}

func logRequests(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		h.ServeHTTP(w, r)
		log.Printf("%s %s %s", r.Method, r.URL.Path, time.Since(start).Round(time.Millisecond))
	})
}
