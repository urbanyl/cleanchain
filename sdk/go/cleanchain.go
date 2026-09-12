// Package cleanchain fournit le client officiel CleanChain :
// scoring de sécurité et conformité blockchain (Bitcoin, Ethereum, Solana).
package cleanchain

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"time"
)

const defaultBaseURL = "https://api.cleanchain.io"

// Client phone vers l'API CleanChain.
type Client struct {
	baseURL string
	apiKey  string
	http    *http.Client
}

// Option configure le client.
type Option func(*Client)

// WithAPIKey définit la clef d'API (en-tête Authorization: Bearer).
func WithAPIKey(key string) Option {
	return func(c *Client) { c.apiKey = key }
}

// WithBaseURL surcharge l'hôte de l'API (défaut : https://api.cleanchain.io).
func WithBaseURL(u string) Option {
	return func(c *Client) { c.baseURL = u }
}

// WithHTTPClient remplace le client HTTP (mTLS, proxy, timeouts).
func WithHTTPClient(h *http.Client) Option {
	return func(c *Client) { c.http = h }
}

// NewClient construit un client. L'hôte par défaut est surchargé par
// CLEANCHAIN_BASE_URL puis par les options.
func NewClient(options ...Option) *Client {
	c := &Client{
		baseURL: defaultBaseURL,
		http:    &http.Client{Timeout: 30 * time.Second},
	}
	if env := os.Getenv("CLEANCHAIN_BASE_URL"); env != "" {
		c.baseURL = env
	}
	for _, o := range options {
		o(c)
	}
	return c
}

// Analysis représente une réponse d'analyse (score, verdict, risques…).
type Analysis map[string]any

func (c *Client) newRequest(
	ctx context.Context,
	method, apiPath string,
	query url.Values,
	body any,
) (*http.Request, error) {
	var rd io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		rd = bytes.NewReader(b)
	}

	target := c.baseURL + apiPath
	if len(query) > 0 {
		target += "?" + query.Encode()
	}

	req, err := http.NewRequestWithContext(ctx, method, target, rd)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/json")
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if c.apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+c.apiKey)
	}
	return req, nil
}

func (c *Client) do(
	ctx context.Context,
	method, apiPath string,
	query url.Values,
	body, out any,
) error {
	req, err := c.newRequest(ctx, method, apiPath, query, body)
	if err != nil {
		return err
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		sb, _ := io.ReadAll(io.LimitReader(resp.Body, 256))
		return fmt.Errorf("cleanchain: %s: %s", resp.Status, string(sb))
	}
	if out == nil {
		return nil
	}
	return json.NewDecoder(resp.Body).Decode(out)
}

// Analyze retourne le rapport d'analyse complet d'une adresse.
func (c *Client) Analyze(ctx context.Context, address, network string) (Analysis, error) {
	var out Analysis
	q := url.Values{}
	if network != "" {
		q.Set("network", network)
	}
	err := c.do(ctx, http.MethodGet, "/v1/address/"+address, q, nil, &out)
	return out, err
}

// AnalyzeBatch soumet un lot d'adresses (max 100) pour scoring asynchrone.
func (c *Client) AnalyzeBatch(
	ctx context.Context,
	batch []string,
	webhook string,
	profondeur int,
) (Analysis, error) {
	var out Analysis
	if profondeur == 0 {
		profondeur = 2
	}
	err := c.do(ctx, http.MethodPost, "/v1/address/analyze", nil,
		map[string]any{"batch": batch, "webhook": webhook, "profondeur": profondeur}, &out)
	return out, err
}

// LatestReports liste les signalements vérifiés les plus récents.
func (c *Client) LatestReports(ctx context.Context, limit int, cursor string) (Analysis, error) {
	var out Analysis
	q := url.Values{}
	if limit > 0 {
		q.Set("limit", fmt.Sprint(limit))
	}
	if cursor != "" {
		q.Set("cursor", cursor)
	}
	err := c.do(ctx, http.MethodGet, "/v1/reports/latest", q, nil, &out)
	return out, err
}