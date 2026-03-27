# Sprint 2 Contract: Bedrock LLM Integration

## What Will Be Built
Amazon Bedrock client with two agent modes — Monitor (Sonnet, fast triage) and Executor (Opus, complex tasks). Uses Bearer token auth via API Key.

## Acceptance Criteria
1. Bedrock client configured for us-west-2 with API Key auth
2. Monitor agent: takes task description, returns category + priority + suggested action
3. Executor agent: takes authorized task, returns execution result (e.g. draft email text)
4. Agent types and request/response structs defined
5. Rate limiting (10 req/min for monitor, 5 req/min for executor)
6. Graceful error handling when Bedrock is unavailable
7. Integration endpoint: `POST /api/agent/triage` and `POST /api/agent/execute`

## Verification
- Agent structs compile and are well-typed
- HTTP endpoints return proper errors when Bedrock token not set
- Rate limiter correctly throttles excess requests
