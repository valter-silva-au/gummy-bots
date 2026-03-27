# Staff Engineer Code Review — Gummy Bots

**Reviewer:** Staff Engineer (code quality audit)
**Date:** 2026-03-27
**Scope:** All source code in `server/`, `web/src/`, `gummy-bots-app/src/`
**Severity Levels:** CRITICAL (will break in prod) / HIGH (significant risk) / MEDIUM (should fix) / LOW (nice-to-have)

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 4 |
| HIGH     | 9 |
| MEDIUM   | 12 |
| LOW      | 8 |

The codebase is a functional prototype with solid architecture separation. The main risks are: WebSocket security, race conditions in the combo tracker, unchecked error returns in the Go backend, and missing input validation across all API endpoints.

---

## CRITICAL Findings

### C1. WebSocket accepts all origins — open to CSRF/hijack attacks

**File:** `server/internal/api/ws.go:15-17`

```go
CheckOrigin: func(r *http.Request) bool {
    return true // Allow all origins for local dev
},
```

**Impact:** Any website can open a WebSocket connection to the server and broadcast messages to all clients. An attacker could inject fake gummies, trigger XP gains, or impersonate server events. Even in local-first mode, if the port is exposed (e.g., via ngrok, Docker, or a misconfigured firewall), this is exploitable.

**Fix:** Validate origin against the same allowlist used in the CORS middleware (`localhost:3000`, `localhost:5173`, etc.). In production, validate against the actual app origin.

---

### C2. WebSocket readPump broadcasts raw client messages to all clients

**File:** `server/internal/api/ws.go:149-151`

```go
// Broadcast to all clients
c.hub.broadcast <- message
```

**Impact:** Any connected client can send arbitrary JSON that gets broadcast to every other client. A malicious client could send fake `gummy:executed`, `xp:gained`, or `achievement:unlocked` messages that all other clients will render as real. This is a message injection vulnerability.

**Fix:** The server should never re-broadcast raw client messages. Client messages should be routed to handler functions that validate the message type and payload, then broadcast a server-constructed response. Unknown message types should be dropped.

---

### C3. ExecuteGummy hardcodes user ID 1 — multi-user will clobber data

**File:** `server/internal/api/router.go:409`

```go
// Update user 1 (default user for now)
user, _ := h.db.GetUser(1)
```

**Impact:** Every gummy execution awards XP to user ID 1 regardless of who made the request. When multi-user support is added, all users will modify the same user record. The `_ ` on the error return also swallows "user not found" errors.

**Fix:** Accept a `userId` from the request (either via auth context or request body). Never hardcode user IDs. Always check the error return.

---

### C4. Agent error messages leak to HTTP response

**File:** `server/internal/api/router.go:270-271`

```go
writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
```

Also at line 297.

**Impact:** Bedrock API errors (including auth failures, rate limit details, and internal error messages) are returned directly to the client. This leaks infrastructure details (AWS region, model IDs, authentication scheme) to any caller.

**Fix:** Log the full error server-side. Return a generic error message to the client: `{"error": "agent processing failed"}`.

---

## HIGH Findings

### H1. ComboTracker has no mutex — race condition under concurrent requests

**File:** `server/internal/physics/xp.go:149-163`

```go
func (c *ComboTracker) Record() int {
    now := time.Now()
    c.timestamps = append(c.timestamps, now)
    // ...
    c.timestamps = valid
    return len(c.timestamps)
}
```

**Impact:** `ComboTracker` is shared across all HTTP handlers via the `Handler` struct but has no synchronization. Concurrent `ExecuteGummy` requests will cause a data race on the `timestamps` slice (concurrent append + filter = slice corruption or panic).

**Fix:** Add a `sync.Mutex` to `ComboTracker` and lock/unlock in `Record()`.

---

### H2. Background goroutine in ExecuteGummy has no context or timeout

**File:** `server/internal/api/router.go:444-457`

```go
go func() {
    result, err := h.bedrock.Execute(agent.ExecuteRequest{
        TaskTitle: "Gummy task",
        TaskContent: "Execute the flicked task",
    })
    // ...
}()
```

**Impact:** The goroutine has no context, no timeout, and no way to cancel. If Bedrock is slow (60s timeout in the HTTP client), goroutines accumulate. Under load, this is a goroutine leak. The generic "Gummy task" title also means the agent has no idea what task to execute.

**Fix:** Pass `r.Context()` or a derived context with timeout. Pass the actual task title and content from the gummy's associated task record.

---

### H3. No request body size limits on any endpoint

**Files:** All JSON decode handlers in `router.go`

```go
json.NewDecoder(r.Body).Decode(&req)
```

**Impact:** An attacker can POST a multi-GB JSON body to any endpoint, consuming server memory until OOM. The `json.NewDecoder` reads the entire body into memory.

**Fix:** Wrap `r.Body` with `http.MaxBytesReader(w, r.Body, maxBytes)` or add a global middleware that limits request body size (e.g., 1MB for API endpoints).

---

### H4. SQLite database file created in working directory with no path validation

**File:** `server/main.go:27`

```go
db, err := store.Open("gummy.db")
```

**Impact:** The database is created relative to the working directory. If the server is started from different directories, different databases will be used, causing data loss. The path is also not configurable — it can't be changed without modifying source code.

**Fix:** Use an environment variable (`GUMMY_DB_PATH`) with a sensible default (e.g., `~/.gummy-bots/gummy.db`). Create the parent directory if it doesn't exist.

---

### H5. No authentication on any API endpoint

**Files:** All routes in `router.go`

**Impact:** Every endpoint is publicly accessible. Anyone who can reach the server can create users, execute gummies, trigger LLM calls (burning Bedrock tokens), and read all data. The `AgentExecute` endpoint directly calls Bedrock, which costs money.

**Fix:** For local-first, add a simple shared secret (API key in an env var checked via middleware). For hosted mode, implement proper auth (JWT, session cookies, etc.).

---

### H6. Web app WebSocket URL hardcoded to port 8088, server defaults to 8080

**File:** `web/src/hooks/useWebSocket.ts:8`

```typescript
const WS_URL = 'ws://localhost:8088/ws';
```

**File:** `server/main.go:19-22`

```go
port := os.Getenv("PORT")
if port == "" {
    port = "8080"
}
```

**Impact:** The web app connects to port 8088 but the server defaults to 8080. They will never connect unless the user manually sets `PORT=8088`. The mobile app's `useWebSocket.ts` also hardcodes `ws://localhost:8088/ws`.

**Fix:** Either align the default ports, or make the WebSocket URL configurable via environment variable (`VITE_WS_URL` for web, config for mobile).

---

### H7. `indexOf`/`lastIndexOf` reimplemented instead of using `strings.Index`/`strings.LastIndex`

**File:** `server/internal/agent/bedrock.go:90-106`

```go
func indexOf(s, substr string) int {
    for i := 0; i <= len(s)-len(substr); i++ {
        if s[i:i+len(substr)] == substr {
            return i
        }
    }
    return -1
}
```

**Impact:** This is a byte-level reimplementation that will panic on multi-byte UTF-8 strings if `len(s) < len(substr)` (the loop condition `len(s)-len(substr)` underflows to a huge positive number for unsigned arithmetic). Also, `strings.Index` uses the Rabin-Karp algorithm and is faster for large inputs.

**Fix:** Replace with `strings.Index(s, substr)` and `strings.LastIndex(s, substr)`.

---

### H8. Mobile app ignores `label` field from WebSocket gummy:new payload

**File:** `gummy-bots-app/App.tsx:88`

```typescript
label: `Task #${p.taskId}`,
```

**Impact:** The server sends a `label` field in the `gummy:new` payload (e.g., "Email from Sarah: Project update"), but the mobile app ignores it and shows "Task #42" instead. Users see meaningless task IDs instead of real task descriptions.

**Fix:** Use `p.label || \`Task #${p.taskId}\`` (the web app already does this correctly at `GameCanvas.tsx:27`).

---

### H9. Bedrock response body read into memory without size limit

**File:** `server/internal/agent/bedrock.go:144`

```go
respBody, err := io.ReadAll(resp.Body)
```

**Impact:** If Bedrock returns a malformed or unexpectedly large response, this reads the entire body into memory. A misbehaving proxy or man-in-the-middle could exploit this.

**Fix:** Use `io.LimitReader(resp.Body, maxResponseSize)` with a reasonable limit (e.g., 1MB).

---

## MEDIUM Findings

### M1. Error returns silently ignored in multiple places

**Files:** Various

| Location | Ignored Error |
|----------|---------------|
| `router.go:413` | `h.db.UpdateUserXP(...)` |
| `router.go:417` | `h.db.UpdateUserStreak(...)` |
| `router.go:358` | `h.db.CountExecutedGummies()` |
| `router.go:359` | `h.db.CountActiveGummies()` |
| `store/db.go:136` | `res.LastInsertId()` |
| `store/db.go:185` | `res.LastInsertId()` |
| `store/db.go:230` | `res.LastInsertId()` |

**Impact:** Database write failures are silently swallowed. XP could be lost, streaks could fail to update, and gummy IDs could be 0 (breaking foreign key relationships if SQLite returns an error).

**Fix:** Check all error returns. At minimum, log errors. For critical paths (XP, streaks), return errors to the caller.

---

### M2. No input validation on CreateGummy endpoint

**File:** `server/internal/api/router.go:219-234`

```go
func (h *Handler) CreateGummy(w http.ResponseWriter, r *http.Request) {
    var gummy store.Gummy
    if err := json.NewDecoder(r.Body).Decode(&gummy); err != nil {
        // ...
    }
    // No validation — any color, size, orbit values accepted
    if err := h.db.CreateGummy(&gummy); err != nil {
```

**Impact:** A client can create gummies with arbitrary colors (including XSS payloads in the color string if rendered unsafely), negative sizes, zero orbit radius (which would render at the bot center), or invalid task IDs (which would violate the foreign key constraint and error).

**Fix:** Validate: `TaskID > 0`, `Color` matches hex pattern, `Size` within `[0.5, 3.0]`, `OrbitRadius` within `[80, 250]`, `OrbitSpeed` within `[3000, 20000]`.

---

### M3. `WriteTimeout` of 10s will kill WebSocket connections

**File:** `server/main.go:77`

```go
WriteTimeout: 10 * time.Second,
```

**Impact:** Go's `http.Server.WriteTimeout` applies to all connections, including upgraded WebSocket connections. If no message is sent for 10 seconds, the connection will be terminated. The WebSocket hub doesn't send pings, so idle connections will die.

**Fix:** Either set `WriteTimeout: 0` (and implement your own deadline management), or add a periodic ping from the server to keep connections alive. The `gorilla/websocket` library supports `SetWriteDeadline` per-message, which is the proper approach.

---

### M4. Web canvas DPR scaling applied twice on resize

**File:** `web/src/components/GameCanvas.tsx:91-92`

```typescript
ctx.scale(dpr, dpr);
```

Then at line 126:
```typescript
ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
```

**Impact:** On the first resize, `ctx.scale(dpr, dpr)` sets the transform. On subsequent resizes, `ctx.scale` compounds with the existing transform (scale is multiplicative). The `setTransform` in the render loop resets it, so the visual output is correct, but the resize handler accumulates transforms unnecessarily.

**Fix:** Use `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` in the resize handler instead of `ctx.scale(dpr, dpr)`.

---

### M5. Web app `useEffect` for callbacks runs once with empty deps, misses state changes

**File:** `web/src/components/GameCanvas.tsx:67-76`

```typescript
useEffect(() => {
    if (stateRef.current) {
        stateRef.current.onCatch = (gummyId: string) => {
            fetch(`${API_BASE}/api/gummies/${gummyId}/execute`, { method: 'POST' })
                .catch(() => { /* Server may be offline */ });
        };
        // ...
    }
}, []);
```

**Impact:** This `useEffect` runs once on mount. But `stateRef.current` is `null` on mount (it's created inside the resize handler). The callbacks are never set, meaning catches don't trigger server calls, pop sounds don't play, and dismiss sounds don't play.

**Fix:** Move callback assignment into the resize handler after `createInitialState()`, or use a separate effect that watches for `stateRef.current` becoming non-null.

---

### M6. Mobile `useEffect` has missing dependency array items

**File:** `gummy-bots-app/src/components/GummyField.tsx:77-95`

```typescript
useEffect(() => {
    angle.value = withRepeat(/* ... */);
    wobble.value = withRepeat(/* ... */);
}, []);
```

**Impact:** The orbit animation is set up once with the initial `gummy.startAngle` and `gummy.orbitSpeed` values. If these props change (e.g., due to a state update in the parent), the animation won't update. React's exhaustive-deps lint rule would flag `gummy.startAngle` and `gummy.orbitSpeed` as missing dependencies.

**Fix:** Add `gummy.startAngle` and `gummy.orbitSpeed` to the dependency array, and cancel previous animations when they change.

---

### M7. `performance.now()` used inside physics update — couples to wall clock

**File:** `web/src/engine/physics.ts:123`

```typescript
const entryAge = performance.now() - g.entryTime;
```

**Impact:** The physics update function receives a `dt` parameter for deterministic updates but also reads `performance.now()` internally. This creates a dependency on wall-clock time that makes the physics non-deterministic and untestable. If you ever want to write tests or replay physics, this will break.

**Fix:** Track entry time as cumulative `dt` rather than wall-clock timestamps. Add an `age` field to gummies and increment it each frame.

---

### M8. Mock connectors use `math/rand` without seeding (Go < 1.20 behavior)

**File:** `server/internal/connector/mock.go:51`

```go
duration := time.Duration(20+rand.Intn(21)) * time.Second
```

**Impact:** In Go 1.20+, `math/rand` auto-seeds from the runtime, so this is fine. But your `go.mod` specifies Go 1.22.2, and the code uses the top-level `rand` functions. If someone backports to an older Go version, all mock connectors would generate the same sequence.

**Fix:** Minor — add a comment noting Go 1.20+ auto-seeding, or use `rand.New(rand.NewSource(time.Now().UnixNano()))` for explicitness.

---

### M9. Server shutdown timeout (5s) may not be enough for in-flight Bedrock calls

**File:** `server/main.go:102`

```go
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
```

**Impact:** The Bedrock HTTP client has a 60s timeout. If a Bedrock call is in-flight during shutdown, the server will force-close after 5 seconds, potentially leaving the goroutine orphaned and the response undelivered.

**Fix:** Either track in-flight Bedrock calls with a `sync.WaitGroup` and wait for them during shutdown, or propagate the shutdown context to Bedrock calls so they cancel cleanly.

---

### M10. Web app `onMouseLeave` triggers `handlePointerUp` with stale event

**File:** `web/src/components/GameCanvas.tsx:205`

```typescript
onMouseLeave={handlePointerUp}
```

**Impact:** When the mouse leaves the canvas, `handlePointerUp` is called with the leave event. But `getPos` for `MouseEvent` reads `e.clientX`/`e.clientY`, which for a `mouseleave` event will be the exit position. The velocity calculation uses the delta from drag start to exit point, which could trigger an unintended catch or dismiss if the cursor exits fast toward the bot center.

**Fix:** On mouse leave, cancel the drag and snap the gummy back to orbit instead of processing it as a flick.

---

### M11. No rate limiting on HTTP API endpoints

**Files:** All routes in `router.go`

**Impact:** While the Bedrock client has internal rate limiting (10/min monitor, 5/min executor), the HTTP endpoints themselves have no rate limiting. An attacker could spam `POST /api/tasks` to fill the database, or `POST /api/users` to create thousands of users.

**Fix:** Add per-IP rate limiting middleware (e.g., `go-chi/httprate` or a simple token bucket).

---

### M12. CSS anti-aliasing property non-standard

**File:** `web/src/index.css:10`

```css
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

**Impact:** These are WebKit/Firefox vendor prefixes that have no effect on Chrome (Blink), Edge, or non-Apple platforms. They're harmless but provide false confidence about text rendering consistency.

**Fix:** Low priority. Keep them for Safari/Firefox but note they're not a universal fix.

---

## LOW Findings

### L1. No test files anywhere in the codebase

**Files:** None found matching `*_test.go`, `*.test.ts`, `*.test.tsx`, `*.spec.ts`

**Impact:** Zero automated tests across all three platforms. The physics engine, XP calculations, achievement checking, streak logic, and API handlers are all untested. Any refactoring risks silent regressions.

**Fix:** Start with the highest-value tests:
1. `physics/xp_test.go` — `LevelForXP`, `CalculateXP`, `ComboMultiplier`, `UpdateStreak`
2. `physics/achievements_test.go` — `CheckAchievements` with various contexts
3. `web/src/engine/physics.test.ts` — catch detection logic (`endDrag` conditions)

---

### L2. `extractJSON` in bedrock.go doesn't handle nested code fences

**File:** `server/internal/agent/bedrock.go:77-88`

**Impact:** If the LLM response contains multiple code fences (e.g., explanation + JSON), the `lastIndexOf` for the closing fence might strip the wrong content. For example: `` ```json\n{...}\n```\n\nHere's another block:\n```\ncode\n``` `` would extract incorrectly.

**Fix:** Use a more robust extraction: find the first `\`\`\`json` and its matching closing fence, not the last fence in the document.

---

### L3. Hardcoded "Level 7" and "5-day streak" in mobile StatusHeader

**File:** `gummy-bots-app/src/components/StatusHeader.tsx`

**Impact:** The status header always shows "Level 7" and "5-day streak" regardless of actual user stats. The component doesn't accept props for dynamic values.

**Fix:** Accept `level` and `streakDays` as props from the parent, connected to the real user stats from the WebSocket `xp:gained` events.

---

### L4. ConnectorDock icons are decorative only

**File:** `gummy-bots-app/src/components/ConnectorDock.tsx`

**Impact:** The connector icons (Gmail, Cal, Chat, Tasks, Alerts) have no `onPress` handlers. They're purely visual. Users might tap them expecting an action.

**Fix:** Either add press handlers (navigate to connector settings) or add a visual cue that they're display-only (e.g., reduced opacity, "Coming soon" tooltip).

---

### L5. `go.mod` uses `go 1.22.2` directive — version includes patch number

**File:** `server/go.mod`

**Impact:** The `go` directive in `go.mod` should typically use the minor version (e.g., `go 1.22`), not the patch version. Using `1.22.2` can cause issues when building with a different patch version of Go 1.22.

**Fix:** Change to `go 1.22`.

---

### L6. Web app API_BASE hardcoded

**File:** `web/src/components/GameCanvas.tsx:9`

```typescript
const API_BASE = 'http://localhost:8088';
```

**Impact:** Like the WebSocket URL, the API base is hardcoded. This makes deployment configuration impossible without code changes.

**Fix:** Use `import.meta.env.VITE_API_BASE || 'http://localhost:8080'`.

---

### L7. Achievement overlay timer (4s) is long — may overlap with next achievement

**File:** `web/src/components/GameCanvas.tsx:60`

```typescript
stateRef.current.achievementOverlay = { name: p.name, icon: p.icon, timer: 4 };
```

**Impact:** If two achievements unlock simultaneously (e.g., `first_catch` and `speed_demon`), the second one overwrites the first overlay. The first achievement notification is lost.

**Fix:** Use a queue (array) of pending achievement notifications, showing them sequentially with a short gap.

---

### L8. Mobile app `Dimensions.get('window')` called at module level

**File:** `gummy-bots-app/App.tsx:13`

```typescript
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
```

**Impact:** This captures dimensions once at module load time. If the device rotates or the window resizes (split-screen on Android), the layout values are stale. The `app.json` locks to portrait orientation, so this is currently safe, but it's fragile.

**Fix:** Use `useWindowDimensions()` hook inside the component for reactive dimensions.

---

## Architecture Notes (Not Bugs)

1. **Clean separation of concerns in Go backend.** The `api/`, `agent/`, `connector/`, `store/`, `physics/` packages are well-structured with clear responsibilities. This is good architecture for the project's size.

2. **Dual physics implementation.** The web app (`engine/physics.ts`) and mobile app (`GummyField.tsx`) implement physics independently with different approaches (imperative loop vs. Reanimated shared values). This is correct given the different rendering paradigms, but catch thresholds should be synchronized as constants.

3. **The `Hub` pattern in ws.go is solid.** Channel-based broadcast with select + default for non-blocking send is idiomatic Go. The `RWMutex` protects the client map correctly.

4. **The Bedrock client's fallback on JSON parse failure is smart.** Returning a default result with the raw text as `suggestedAction` (triage) or `result` (execute) means the system degrades gracefully when the LLM doesn't follow format instructions.

---

## Recommended Priority Order

1. **Fix C1 + C2** (WebSocket security) — 1 hour
2. **Fix H1** (ComboTracker race condition) — 15 minutes
3. **Fix H3** (request body size limits) — 30 minutes
4. **Fix C4** (error message leakage) — 15 minutes
5. **Fix H6** (port mismatch) — 10 minutes
6. **Fix M3** (WriteTimeout killing WebSocket) — 30 minutes
7. **Fix H8** (mobile ignoring label) — 5 minutes
8. **Fix M5** (web callback setup timing) — 20 minutes
9. **Add tests for physics/xp.go** — 2 hours
10. **Fix remaining items** in severity order

**Estimated total time to address all CRITICAL + HIGH:** ~4 hours.

---

*Review conducted 2026-03-27 by staff engineer code audit.*
