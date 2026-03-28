package agent

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

const (
	bedrockRegion     = "us-west-2"
	monitorModel      = "us.anthropic.claude-haiku-4-5-20251001-v1:0"
	executorModel     = "us.anthropic.claude-opus-4-6-v1"
	bedrockAPIVersion = "bedrock-2023-05-31"
	maxTokens         = 1024
)

// BedrockClient communicates with Amazon Bedrock via API Key auth.
type BedrockClient struct {
	httpClient    *http.Client
	baseURL       string
	token         string
	monitorLimit  *RateLimiter
	executorLimit *RateLimiter
}

// NewBedrockClient creates a new Bedrock client.
func NewBedrockClient() *BedrockClient {
	token := os.Getenv("AWS_BEARER_TOKEN_BEDROCK")
	return &BedrockClient{
		httpClient: &http.Client{
			Timeout: 60 * time.Second,
		},
		baseURL:       fmt.Sprintf("https://bedrock-runtime.%s.amazonaws.com", bedrockRegion),
		token:         token,
		monitorLimit:  NewRateLimiter(10, time.Minute),
		executorLimit: NewRateLimiter(5, time.Minute),
	}
}

// IsConfigured returns true if the Bedrock token is set.
func (c *BedrockClient) IsConfigured() bool {
	return c.token != ""
}

// bedrockRequest is the Anthropic Messages API format for Bedrock.
type bedrockRequest struct {
	AnthropicVersion string    `json:"anthropic_version"`
	MaxTokens        int       `json:"max_tokens"`
	System           string    `json:"system,omitempty"`
	Messages         []Message `json:"messages"`
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type bedrockResponse struct {
	Content []struct {
		Type string `json:"type"`
		Text string `json:"text"`
	} `json:"content"`
	StopReason string `json:"stop_reason"`
	Usage      struct {
		InputTokens  int `json:"input_tokens"`
		OutputTokens int `json:"output_tokens"`
	} `json:"usage"`
}

// extractJSON strips markdown code fences from LLM output.
func extractJSON(text string) string {
	// Strip ```json ... ``` wrapping
	if idx := strings.Index(text, "```json"); idx >= 0 {
		text = text[idx+7:]
	} else if idx := strings.Index(text, "```"); idx >= 0 {
		text = text[idx+3:]
	}
	if idx := strings.LastIndex(text, "```"); idx >= 0 {
		text = text[:idx]
	}
	return strings.TrimSpace(text)
}

func (c *BedrockClient) invoke(model string, system string, messages []Message, limiter *RateLimiter) (string, error) {
	if !c.IsConfigured() {
		return "", fmt.Errorf("AWS_BEARER_TOKEN_BEDROCK not set")
	}

	if !limiter.Allow() {
		return "", fmt.Errorf("rate limit exceeded")
	}

	reqBody := bedrockRequest{
		AnthropicVersion: bedrockAPIVersion,
		MaxTokens:        maxTokens,
		System:           system,
		Messages:         messages,
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("marshal request: %w", err)
	}

	url := fmt.Sprintf("%s/model/%s/invoke", c.baseURL, model)
	req, err := http.NewRequest("POST", url, bytes.NewReader(bodyBytes))
	if err != nil {
		return "", fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.token)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("bedrock request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return "", fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("bedrock error (status %d): %s", resp.StatusCode, string(respBody))
	}

	var result bedrockResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", fmt.Errorf("unmarshal response: %w", err)
	}

	if len(result.Content) == 0 {
		return "", fmt.Errorf("empty response from bedrock")
	}

	return result.Content[0].Text, nil
}

// TriageRequest is input to the monitor agent.
type TriageRequest struct {
	TaskTitle   string `json:"taskTitle"`
	TaskContent string `json:"taskContent"`
	Context     string `json:"context,omitempty"`
}

// TriageResult is the monitor agent's output.
type TriageResult struct {
	Category       string `json:"category"`
	Priority       int    `json:"priority"`
	Complexity     int    `json:"complexity"`
	SuggestedAction string `json:"suggestedAction"`
	Summary        string `json:"summary"`
}

// Triage uses the monitor agent (Sonnet) for fast task categorization.
func (c *BedrockClient) Triage(req TriageRequest) (*TriageResult, error) {
	system := `You are a task triage agent for Gummy Bots. Categorize tasks and assess priority.
Respond with ONLY valid JSON in this exact format:
{
  "category": "comms|calendar|info|urgent|automation",
  "priority": 1-10,
  "complexity": 1-5,
  "suggestedAction": "brief description of what to do",
  "summary": "one-line summary"
}`

	userMsg := fmt.Sprintf("Task: %s\nDetails: %s", req.TaskTitle, req.TaskContent)
	if req.Context != "" {
		userMsg += fmt.Sprintf("\nContext: %s", req.Context)
	}

	text, err := c.invoke(monitorModel, system, []Message{{Role: "user", Content: userMsg}}, c.monitorLimit)
	if err != nil {
		return nil, fmt.Errorf("triage: %w", err)
	}

	cleaned := extractJSON(text)
	var result TriageResult
	if err := json.Unmarshal([]byte(cleaned), &result); err != nil {
		return &TriageResult{
			Category:       "info",
			Priority:       5,
			Complexity:     1,
			SuggestedAction: text,
			Summary:        req.TaskTitle,
		}, nil
	}

	return &result, nil
}

// ExecuteRequest is input to the executor agent.
type ExecuteRequest struct {
	TaskTitle       string `json:"taskTitle"`
	TaskContent     string `json:"taskContent"`
	SuggestedAction string `json:"suggestedAction"`
	Context         string `json:"context,omitempty"`
}

// ExecuteResult is the executor agent's output.
type ExecuteResult struct {
	Action    string `json:"action"`
	Result    string `json:"result"`
	Completed bool   `json:"completed"`
}

// Execute uses the executor agent (Opus) for complex task execution.
func (c *BedrockClient) Execute(req ExecuteRequest) (*ExecuteResult, error) {
	system := `You are a task execution agent for Gummy Bots. Execute the authorized task.
The user has physically flicked this task to authorize execution.
Respond with ONLY valid JSON in this exact format:
{
  "action": "what you did",
  "result": "the output (e.g. drafted email text, scheduled event details)",
  "completed": true
}`

	userMsg := fmt.Sprintf("Task: %s\nDetails: %s\nSuggested approach: %s",
		req.TaskTitle, req.TaskContent, req.SuggestedAction)
	if req.Context != "" {
		userMsg += fmt.Sprintf("\nContext: %s", req.Context)
	}

	text, err := c.invoke(executorModel, system, []Message{{Role: "user", Content: userMsg}}, c.executorLimit)
	if err != nil {
		return nil, fmt.Errorf("execute: %w", err)
	}

	cleaned := extractJSON(text)
	var result ExecuteResult
	if err := json.Unmarshal([]byte(cleaned), &result); err != nil {
		return &ExecuteResult{
			Action:    "processed",
			Result:    text,
			Completed: true,
		}, nil
	}

	return &result, nil
}

// RateLimiter is a simple token-bucket rate limiter.
type RateLimiter struct {
	mu       sync.Mutex
	tokens   int
	maxRate  int
	window   time.Duration
	lastFill time.Time
}

func NewRateLimiter(maxRate int, window time.Duration) *RateLimiter {
	return &RateLimiter{
		tokens:   maxRate,
		maxRate:  maxRate,
		window:   window,
		lastFill: time.Now(),
	}
}

func (r *RateLimiter) Allow() bool {
	r.mu.Lock()
	defer r.mu.Unlock()

	now := time.Now()
	elapsed := now.Sub(r.lastFill)
	if elapsed >= r.window {
		r.tokens = r.maxRate
		r.lastFill = now
	}

	if r.tokens <= 0 {
		return false
	}

	r.tokens--
	return true
}
