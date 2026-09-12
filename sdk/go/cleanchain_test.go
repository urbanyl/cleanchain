package cleanchain

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
)

func handlerFor(t *testing.T, check func(*http.Request) string) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if msg := check(r); msg != "" {
			t.Errorf(msg)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = fmt.Fprint(w, `{"score_securite":97,"verdict":"Sécurisé"}`)
	}))
}

func TestAnalyze(t *testing.T) {
	srv := handlerFor(t, func(r *http.Request) string {
		if r.URL.Path != "/v1/address/0xabc" {
			return "mauvais chemin"
		}
		if r.Header.Get("Authorization") != "Bearer key" {
			return "Authorization absente"
		}
		if r.Header.Get("Accept") != "application/json" {
			return "Accept incorrect"
		}
		if got := r.URL.Query().Get("network"); got != "ETH" {
			return "network manquant"
		}
		return ""
	})
	defer srv.Close()

	c := NewClient(WithAPIKey("key"), WithBaseURL(srv.URL))
	out, err := c.Analyze(context.Background(), "0xabc", "ETH")
	if err != nil {
		t.Fatal(err)
	}
	if out["score_securite"].(float64) != 97 {
		t.Errorf("score inattendu: %v", out["score_securite"])
	}
}

func TestAnalyzeBatch(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Errorf("méthode inattendue: %s", r.Method)
		}
		var payload map[string]any
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			t.Errorf("corps invalide: %v", err)
		}
		if got := payload["profondeur"].(float64); got != 3 {
			t.Errorf("profondeur: %v", got)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = fmt.Fprint(w, `{"accepte":true}`)
	}))
	defer srv.Close()

	c := NewClient(WithBaseURL(srv.URL))
	out, err := c.AnalyzeBatch(context.Background(), []string{"0xabc"}, "", 3)
	if err != nil {
		t.Fatal(err)
	}
	if out["accepte"].(bool) != true {
		t.Errorf("réponse inattendue: %v", out)
	}
}

func TestHTTPError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
		_, _ = fmt.Fprint(w, "not found")
	}))
	defer srv.Close()

	c := NewClient(WithBaseURL(srv.URL))
	_, err := c.Analyze(context.Background(), "0xzzz", "")
	if err == nil {
		t.Fatal("erreur attendue")
	}
}