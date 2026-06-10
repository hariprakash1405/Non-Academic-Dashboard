package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

// ─── Log Levels ──────────────────────────────────────────────────────────────

const (
	LevelINFO  = "INFO "
	LevelWARN  = "WARN "
	LevelERROR = "ERROR"
	LevelHTTP  = "HTTP "
)

// ─── Core Write ───────────────────────────────────────────────────────────────

func writeLog(level, subsystem, msg string) {
	now := time.Now().Format("15:04:05.000")
	fmt.Printf("[%s] [%s] [%s] %s\n", now, level, subsystem, msg)
}

// ─── Public Helpers ───────────────────────────────────────────────────────────

// LogInfo logs an informational message to the terminal.
func LogInfo(subsystem, format string, args ...interface{}) {
	writeLog(LevelINFO, subsystem, fmt.Sprintf(format, args...))
}

// LogWarn logs a warning to the terminal.
func LogWarn(subsystem, format string, args ...interface{}) {
	writeLog(LevelWARN, subsystem, fmt.Sprintf(format, args...))
}

// LogError logs an error with file:line context to the terminal.
func LogError(subsystem, format string, args ...interface{}) {
	_, file, line, _ := runtime.Caller(1)
	file = filepath.Base(file)
	msg := fmt.Sprintf(format, args...)
	writeLog(LevelERROR, subsystem, fmt.Sprintf("%s (at %s:%d)", msg, file, line))
}

// ─── Body Pretty-printer ─────────────────────────────────────────────────────

// prettyBody reads the request body, pretty-prints it as JSON (if possible),
// restores the body so the actual handler can still read it, and returns a
// short summary string for logging.
func prettyBody(r *http.Request) string {
	if r.Body == nil {
		return ""
	}
	raw, err := io.ReadAll(r.Body)
	// Restore the body for the downstream handler
	r.Body = io.NopCloser(bytes.NewBuffer(raw))
	if err != nil || len(raw) == 0 {
		return ""
	}

	// Try to pretty-print as JSON map so keys are readable
	var obj map[string]interface{}
	if err := json.Unmarshal(raw, &obj); err == nil {
		parts := make([]string, 0, len(obj))
		for k, v := range obj {
			parts = append(parts, fmt.Sprintf("%s=%v", k, v))
		}
		return strings.Join(parts, "  ")
	}

	// Fallback: just show the raw body (truncated to 300 chars)
	s := strings.TrimSpace(string(raw))
	if len(s) > 300 {
		s = s[:300] + "..."
	}
	return s
}

// ─── HTTP Middleware ──────────────────────────────────────────────────────────

// responseWriter wraps http.ResponseWriter to capture status code and bytes written.
type responseWriter struct {
	http.ResponseWriter
	status int
	size   int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
}

func (rw *responseWriter) Write(b []byte) (int, error) {
	n, err := rw.ResponseWriter.Write(b)
	rw.size += n
	return n, err
}

// LoggingMiddleware wraps every HTTP handler and logs method, path, status,
// duration, remote IP, and (for mutating methods) the request body fields.
func LoggingMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Skip OPTIONS pre-flight noise
		if r.Method == "OPTIONS" {
			next(w, r)
			return
		}

		// Read body before handler runs (only for mutating methods)
		var bodyLog string
		if r.Method == "POST" || r.Method == "PUT" || r.Method == "DELETE" {
			bodyLog = prettyBody(r)
		}

		start := time.Now()
		wrapped := &responseWriter{ResponseWriter: w, status: http.StatusOK}
		next(wrapped, r)
		duration := time.Since(start)

		ip := r.RemoteAddr
		if fwd := r.Header.Get("X-Forwarded-For"); fwd != "" {
			ip = strings.Split(fwd, ",")[0]
		}

		level := LevelHTTP
		if wrapped.status >= 500 {
			level = LevelERROR
		} else if wrapped.status >= 400 {
			level = LevelWARN
		}

		// First line: method + path + status + timing
		writeLog(level, "HTTP", fmt.Sprintf(
			"%-6s %-45s | %d | %.3fms | %s",
			r.Method,
			r.URL.Path,
			wrapped.status,
			float64(duration.Nanoseconds())/1e6,
			ip,
		))

		// Second line: request body fields (only when present)
		if bodyLog != "" {
			writeLog(level, "BODY", "  └─ "+bodyLog)
		}
	}
}
