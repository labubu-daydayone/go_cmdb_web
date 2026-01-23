package cloudflare

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const (
	BaseURL = "https://api.cloudflare.com/client/v4"
)

// Client represents a Cloudflare API client
type Client struct {
	baseURL    string
	token      string
	httpClient *http.Client
}

// CloudflareResponse represents the standard Cloudflare API response
type CloudflareResponse struct {
	Success  bool                     `json:"success"`
	Errors   []map[string]interface{} `json:"errors"`
	Messages []string                 `json:"messages"`
	Result   interface{}              `json:"result"`
}

// DNSRecord represents a Cloudflare DNS record
type DNSRecord struct {
	ID      string `json:"id"`
	Type    string `json:"type"`
	Name    string `json:"name"`
	Content string `json:"content"`
	TTL     int    `json:"ttl"`
	Proxied bool   `json:"proxied"`
}

// NewClient creates a new Cloudflare API client
func NewClient() *Client {
	return &Client{
		baseURL: BaseURL,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// WithToken returns a new client with the specified API token
func (c *Client) WithToken(token string) *Client {
	return &Client{
		baseURL:    c.baseURL,
		token:      token,
		httpClient: c.httpClient,
	}
}

// CreateDNSRecord creates a new DNS record in Cloudflare
func (c *Client) CreateDNSRecord(zoneID, recordType, name, content string, ttl int, proxied bool) (string, error) {
	url := fmt.Sprintf("%s/zones/%s/dns_records", c.baseURL, zoneID)

	payload := map[string]interface{}{
		"type":    recordType,
		"name":    name,
		"content": content,
		"ttl":     ttl,
		"proxied": proxied,
	}

	resp, err := c.post(url, payload)
	if err != nil {
		return "", err
	}

	if !resp.Success {
		return "", fmt.Errorf("cloudflare API error: %v", resp.Errors)
	}

	// Extract record ID from result
	result, ok := resp.Result.(map[string]interface{})
	if !ok {
		return "", fmt.Errorf("invalid response format")
	}

	recordID, ok := result["id"].(string)
	if !ok {
		return "", fmt.Errorf("record ID not found in response")
	}

	return recordID, nil
}

// UpdateDNSRecord updates an existing DNS record in Cloudflare
func (c *Client) UpdateDNSRecord(zoneID, recordID, recordType, name, content string, ttl int, proxied bool) (string, error) {
	url := fmt.Sprintf("%s/zones/%s/dns_records/%s", c.baseURL, zoneID, recordID)

	payload := map[string]interface{}{
		"type":    recordType,
		"name":    name,
		"content": content,
		"ttl":     ttl,
		"proxied": proxied,
	}

	resp, err := c.put(url, payload)
	if err != nil {
		return "", err
	}

	if !resp.Success {
		return "", fmt.Errorf("cloudflare API error: %v", resp.Errors)
	}

	return recordID, nil
}

// DeleteDNSRecord deletes a DNS record from Cloudflare
func (c *Client) DeleteDNSRecord(zoneID, recordID string) error {
	url := fmt.Sprintf("%s/zones/%s/dns_records/%s", c.baseURL, zoneID, recordID)

	resp, err := c.delete(url)
	if err != nil {
		return err
	}

	if !resp.Success {
		return fmt.Errorf("cloudflare API error: %v", resp.Errors)
	}

	return nil
}

// GetDNSRecord retrieves a DNS record from Cloudflare
func (c *Client) GetDNSRecord(zoneID, recordID string) (*DNSRecord, error) {
	url := fmt.Sprintf("%s/zones/%s/dns_records/%s", c.baseURL, zoneID, recordID)

	resp, err := c.get(url)
	if err != nil {
		return nil, err
	}

	if !resp.Success {
		return nil, fmt.Errorf("cloudflare API error: %v", resp.Errors)
	}

	// Parse result
	resultBytes, err := json.Marshal(resp.Result)
	if err != nil {
		return nil, err
	}

	var record DNSRecord
	if err := json.Unmarshal(resultBytes, &record); err != nil {
		return nil, err
	}

	return &record, nil
}

// ListDNSRecords lists all DNS records for a zone
func (c *Client) ListDNSRecords(zoneID string) ([]DNSRecord, error) {
	url := fmt.Sprintf("%s/zones/%s/dns_records", c.baseURL, zoneID)

	resp, err := c.get(url)
	if err != nil {
		return nil, err
	}

	if !resp.Success {
		return nil, fmt.Errorf("cloudflare API error: %v", resp.Errors)
	}

	// Parse result
	resultBytes, err := json.Marshal(resp.Result)
	if err != nil {
		return nil, err
	}

	var records []DNSRecord
	if err := json.Unmarshal(resultBytes, &records); err != nil {
		return nil, err
	}

	return records, nil
}

// HTTP helper methods

func (c *Client) get(url string) (*CloudflareResponse, error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	return c.doRequest(req)
}

func (c *Client) post(url string, payload interface{}) (*CloudflareResponse, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	return c.doRequest(req)
}

func (c *Client) put(url string, payload interface{}) (*CloudflareResponse, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("PUT", url, bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	return c.doRequest(req)
}

func (c *Client) delete(url string) (*CloudflareResponse, error) {
	req, err := http.NewRequest("DELETE", url, nil)
	if err != nil {
		return nil, err
	}

	return c.doRequest(req)
}

func (c *Client) doRequest(req *http.Request) (*CloudflareResponse, error) {
	// Add authorization header
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.token))

	// Execute request
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	// Parse response
	var cfResp CloudflareResponse
	if err := json.Unmarshal(body, &cfResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w, body: %s", err, string(body))
	}

	return &cfResp, nil
}
