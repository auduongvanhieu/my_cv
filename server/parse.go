package main

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/anthropics/anthropic-sdk-go/v2"
)

// CV parsing: upload a PDF / DOCX / image / text file, Claude extracts a resume
// JSON that matches the frontend schema (src/types.ts) via structured outputs.

const (
	parseModel      = "claude-opus-5-5"
	parseMaxUpload  = 12 << 20
	parseDailyLimit = 20
)

var parseSchema = map[string]any{
	"type":                 "object",
	"additionalProperties": false,
	"required":             []string{"profile", "summary", "experience", "education", "skillGroups", "projects", "certificates", "languages", "activities", "awards"},
	"properties": map[string]any{
		"profile": obj(map[string]any{
			"fullName": str("Full name as written on the CV"),
			"title":    str("Current or target job title"),
			"email":    str(""), "phone": str(""),
			"birthday": str("Date of birth as YYYY-MM-DD, empty if unknown"),
			"address":  str("City / address"),
			"website":  str(""), "linkedin": str("LinkedIn URL or handle"), "github": str("GitHub URL or handle"),
		}),
		"summary": str("Professional summary / objective. Keep the original language. Use '- ' bullet lines when the CV lists points."),
		"experience": arr(obj(map[string]any{
			"company": str(""), "position": str(""),
			"start": str("YYYY-MM or empty"), "end": str("YYYY-MM or empty"),
			"current":     map[string]any{"type": "boolean", "description": "true if this is the current job"},
			"description": str("Responsibilities and achievements as '- ' bullet lines"),
		})),
		"education": arr(obj(map[string]any{
			"school": str(""), "degree": str("e.g. Bachelor, Cử nhân, Master"), "major": str(""),
			"start": str("YYYY-MM or empty"), "end": str("YYYY-MM or empty"), "description": str("GPA, honors, notes"),
		})),
		"skillGroups": arr(obj(map[string]any{
			"name": str("Group name, e.g. Backend, Mobile, Core skills, Soft skills"),
			"skills": arr(obj(map[string]any{
				"name":  str(""),
				"level": map[string]any{"type": "integer", "description": "0 when unknown, otherwise 1-5"},
				"years": str("Years of experience as written, e.g. '3 năm' or '3 years', empty if unknown"),
			})),
		})),
		"projects": arr(obj(map[string]any{
			"name": str(""), "company": str("Company or client, empty if none"), "role": str("Role / responsibilities in the project"),
			"start": str("YYYY-MM or empty"), "end": str("YYYY-MM or empty"), "link": str(""),
			"description": str("Project description, technologies, results as '- ' bullet lines"),
		})),
		"certificates": arr(obj(map[string]any{"name": str(""), "issuer": str(""), "date": str("YYYY-MM or empty"), "link": str("")})),
		"languages":    arr(obj(map[string]any{"name": str(""), "level": str("Proficiency, e.g. IELTS 6.5, Fluent, Native")})),
		"activities":   arr(obj(map[string]any{"title": str(""), "organization": str(""), "start": str("YYYY-MM or empty"), "end": str("YYYY-MM or empty"), "description": str("")})),
		"awards":       arr(obj(map[string]any{"title": str(""), "issuer": str(""), "date": str("YYYY-MM or empty"), "description": str("")})),
	},
}

func str(desc string) map[string]any {
	m := map[string]any{"type": "string"}
	if desc != "" {
		m["description"] = desc
	}
	return m
}
func arr(items map[string]any) map[string]any { return map[string]any{"type": "array", "items": items} }
func obj(props map[string]any) map[string]any {
	req := make([]string, 0, len(props))
	for k := range props {
		req = append(req, k)
	}
	return map[string]any{"type": "object", "additionalProperties": false, "required": req, "properties": props}
}

const parseSystem = `You extract structured data from a candidate's CV / résumé so it can be loaded into a CV editor.
Rules:
- Copy facts faithfully; never invent data. Leave a field empty ("" / [] / 0) when the CV does not provide it.
- Keep the CV's original language for free text (Vietnamese stays Vietnamese, English stays English).
- Dates: use YYYY-MM for months (e.g. 04/2024 -> "2024-04"), YYYY-MM-DD for the birthday. Words like "Present", "Hiện tại", "Now" mean current = true and end = "".
- Multi-line descriptions become bullet lines starting with "- ".
- Group skills sensibly; if the CV already groups them, keep its groups. Set level to 0 unless the CV states a level.
- Projects go into "projects", jobs into "experience"; do not duplicate a project as a job.`

type parseLimiter struct {
	mu    sync.Mutex
	count map[string]int // userID|day -> count
}

var limiter = parseLimiter{count: map[string]int{}}

func (l *parseLimiter) allow(userID int64) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	key := fmt.Sprintf("%d|%s", userID, time.Now().Format("2006-01-02"))
	if l.count[key] >= parseDailyLimit {
		return false
	}
	l.count[key]++
	return true
}

func (s *server) aiEnabled() bool { return os.Getenv("ANTHROPIC_API_KEY") != "" }

// POST /api/parse-cv  (multipart: file)  -> resume-like JSON
func (s *server) handleParseCV(w http.ResponseWriter, r *http.Request, u *user) {
	if !s.aiEnabled() {
		writeErr(w, 503, "ai parsing is not configured")
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, parseMaxUpload)
	if err := r.ParseMultipartForm(parseMaxUpload); err != nil {
		writeErr(w, 413, "file too large (max 12 MB)")
		return
	}
	f, hdr, err := r.FormFile("file")
	if err != nil {
		writeErr(w, 400, "file required")
		return
	}
	defer f.Close()
	data, err := io.ReadAll(f)
	if err != nil {
		writeErr(w, 400, "cannot read file")
		return
	}
	block, err := contentBlockFor(hdr.Filename, data)
	if err != nil {
		writeErr(w, 415, err.Error())
		return
	}
	if !limiter.allow(u.ID) {
		writeErr(w, 429, "daily parse limit reached")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 4*time.Minute)
	defer cancel()
	client := anthropic.NewClient()
	resp, err := client.Messages.New(ctx, anthropic.MessageNewParams{
		Model:     parseModel,
		MaxTokens: 16000,
		System:    []anthropic.TextBlockParam{{Text: parseSystem, CacheControl: anthropic.NewCacheControlEphemeralParam()}},
		OutputConfig: anthropic.OutputConfigParam{
			Effort: anthropic.OutputConfigEffortMedium,
			Format: anthropic.JSONOutputFormatParam{Schema: parseSchema},
		},
		Messages: []anthropic.MessageParam{
			anthropic.NewUserMessage(block, anthropic.NewTextBlock("Extract this CV into the JSON schema.")),
		},
	})
	if err != nil {
		var apierr *anthropic.Error
		if errors.As(err, &apierr) {
			log.Printf("anthropic error %d: %v", apierr.StatusCode, apierr)
			switch apierr.StatusCode {
			case 429:
				writeErr(w, 503, "ai service busy, try again shortly")
			case 400:
				writeErr(w, 422, "the file could not be read as a CV")
			default:
				writeErr(w, 502, "ai service error")
			}
			return
		}
		log.Printf("anthropic request failed: %v", err)
		writeErr(w, 502, "ai service unreachable")
		return
	}
	if resp.StopReason == anthropic.StopReasonRefusal {
		writeErr(w, 422, "the ai declined to process this file")
		return
	}
	if resp.StopReason == anthropic.StopReasonMaxTokens {
		writeErr(w, 422, "cv too long to extract")
		return
	}
	var text string
	for _, b := range resp.Content {
		if t, ok := b.AsAny().(anthropic.TextBlock); ok {
			text += t.Text
		}
	}
	var parsed map[string]any
	if err := json.Unmarshal([]byte(text), &parsed); err != nil {
		log.Printf("unparseable structured output: %v", err)
		writeErr(w, 502, "ai returned invalid data")
		return
	}
	log.Printf("parse-cv user=%d file=%q in=%d out=%d cache_read=%d", u.ID, hdr.Filename, resp.Usage.InputTokens, resp.Usage.OutputTokens, resp.Usage.CacheReadInputTokens)
	writeJSON(w, 200, parsed)
}

// contentBlockFor turns the uploaded file into a Claude content block.
func contentBlockFor(name string, data []byte) (anthropic.ContentBlockParamUnion, error) {
	lower := strings.ToLower(name)
	switch {
	case bytes.HasPrefix(data, []byte("%PDF")):
		return anthropic.NewDocumentBlock(anthropic.Base64PDFSourceParam{Data: base64.StdEncoding.EncodeToString(data)}), nil
	case strings.HasSuffix(lower, ".docx"):
		txt, err := docxText(data)
		if err != nil || strings.TrimSpace(txt) == "" {
			return anthropic.ContentBlockParamUnion{}, errors.New("cannot read docx")
		}
		return anthropic.NewDocumentBlock(anthropic.PlainTextSourceParam{Data: txt}), nil
	case bytes.HasPrefix(data, []byte{0xFF, 0xD8}):
		return anthropic.NewImageBlockBase64("image/jpeg", base64.StdEncoding.EncodeToString(data)), nil
	case bytes.HasPrefix(data, []byte{0x89, 'P', 'N', 'G'}):
		return anthropic.NewImageBlockBase64("image/png", base64.StdEncoding.EncodeToString(data)), nil
	case bytes.HasPrefix(data, []byte("RIFF")) && bytes.Contains(data[:16], []byte("WEBP")):
		return anthropic.NewImageBlockBase64("image/webp", base64.StdEncoding.EncodeToString(data)), nil
	case strings.HasSuffix(lower, ".txt") || strings.HasSuffix(lower, ".md"):
		return anthropic.NewDocumentBlock(anthropic.PlainTextSourceParam{Data: string(data)}), nil
	}
	return anthropic.ContentBlockParamUnion{}, errors.New("unsupported file type: use PDF, DOCX, PNG, JPG or TXT")
}

var (
	reParaEnd = regexp.MustCompile(`</w:p>|<w:br/>|<w:br />|<w:tab/>`)
	reTags    = regexp.MustCompile(`<[^>]+>`)
)

// docxText extracts the plain text of word/document.xml (paragraphs become lines).
func docxText(data []byte) (string, error) {
	zr, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return "", err
	}
	for _, f := range zr.File {
		if f.Name != "word/document.xml" {
			continue
		}
		rc, err := f.Open()
		if err != nil {
			return "", err
		}
		defer rc.Close()
		xmlb, err := io.ReadAll(io.LimitReader(rc, 20<<20))
		if err != nil {
			return "", err
		}
		s := reParaEnd.ReplaceAllString(string(xmlb), "\n")
		s = reTags.ReplaceAllString(s, "")
		s = strings.NewReplacer("&amp;", "&", "&lt;", "<", "&gt;", ">", "&quot;", `"`, "&apos;", "'").Replace(s)
		return s, nil
	}
	return "", errors.New("document.xml missing")
}
