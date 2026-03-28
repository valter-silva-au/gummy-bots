package api

import (
	"net/http"
	"sync"
	"time"
)

// IPRateLimiter tracks request rates per IP address.
type IPRateLimiter struct {
	mu       sync.Mutex
	visitors map[string]*visitor
	limit    int
	window   time.Duration
}

type visitor struct {
	timestamps []time.Time
}

// NewIPRateLimiter creates a rate limiter allowing 'limit' requests per 'window'.
func NewIPRateLimiter(limit int, window time.Duration) *IPRateLimiter {
	limiter := &IPRateLimiter{
		visitors: make(map[string]*visitor),
		limit:    limit,
		window:   window,
	}
	// Cleanup stale visitors every minute
	go limiter.cleanupLoop()
	return limiter
}

func (rl *IPRateLimiter) cleanupLoop() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		rl.mu.Lock()
		cutoff := time.Now().Add(-rl.window)
		for ip, v := range rl.visitors {
			// Remove visitor if all timestamps are stale
			if len(v.timestamps) == 0 || v.timestamps[len(v.timestamps)-1].Before(cutoff) {
				delete(rl.visitors, ip)
			}
		}
		rl.mu.Unlock()
	}
}

func (rl *IPRateLimiter) allow(ip string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	v, exists := rl.visitors[ip]
	if !exists {
		v = &visitor{}
		rl.visitors[ip] = v
	}

	// Prune old timestamps
	cutoff := now.Add(-rl.window)
	var valid []time.Time
	for _, ts := range v.timestamps {
		if ts.After(cutoff) {
			valid = append(valid, ts)
		}
	}
	v.timestamps = valid

	// Check if under limit
	if len(v.timestamps) >= rl.limit {
		return false
	}

	// Record this request
	v.timestamps = append(v.timestamps, now)
	return true
}

// RateLimitMiddleware returns middleware that rate limits by IP.
func RateLimitMiddleware(limiter *IPRateLimiter) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := r.RemoteAddr
			// Extract IP without port if present
			if idx := len(ip) - 1; idx >= 0 {
				for i := idx; i >= 0; i-- {
					if ip[i] == ':' {
						ip = ip[:i]
						break
					}
				}
			}

			if !limiter.allow(ip) {
				writeJSON(w, http.StatusTooManyRequests, map[string]string{
					"error": "rate limit exceeded",
				})
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
