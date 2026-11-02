package main

import (
	"archive/zip"
	"bytes"
	"strings"
	"testing"
)

func makeDocx(t *testing.T, paragraphs ...string) []byte {
	t.Helper()
	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)
	w, _ := zw.Create("word/document.xml")
	w.Write([]byte("<w:document><w:body>"))
	for _, p := range paragraphs {
		w.Write([]byte("<w:p><w:r><w:t>" + p + "</w:t></w:r></w:p>"))
	}
	w.Write([]byte("</w:body></w:document>"))
	zw.Close()
	return buf.Bytes()
}

func TestDocxText(t *testing.T) {
	txt, err := docxText(makeDocx(t, "NGUYEN VAN A", "Backend Developer &amp; DevOps"))
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(txt, "NGUYEN VAN A") || !strings.Contains(txt, "Backend Developer & DevOps") {
		t.Fatalf("unexpected text: %q", txt)
	}
	if strings.Count(txt, "\n") < 1 {
		t.Fatalf("paragraphs not separated: %q", txt)
	}
}

func TestContentBlockFor(t *testing.T) {
	if _, err := contentBlockFor("x.bin", []byte("hello")); err == nil {
		t.Fatal("expected unsupported type error")
	}
	for name, data := range map[string][]byte{
		"cv.pdf":  []byte("%PDF-1.4 ..."),
		"cv.png":  {0x89, 'P', 'N', 'G', 0, 0},
		"cv.jpg":  {0xFF, 0xD8, 0xFF},
		"cv.docx": makeDocx(t, "x"),
		"cv.txt":  []byte("plain"),
	} {
		if _, err := contentBlockFor(name, data); err != nil {
			t.Fatalf("%s: %v", name, err)
		}
	}
}
