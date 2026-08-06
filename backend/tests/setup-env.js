// Runs before any test file is imported so the Express app and JWT helpers
// have deterministic values regardless of the developer's .env or shell.
// NODE_ENV is pinned so cookie flags (secure/sameSite) stay stable.
process.env.NODE_ENV = "test"
process.env.ACCESS_TOKEN_SECRET = "test-access-token-secret"
process.env.REFRESH_TOKEN_SECRET = "test-refresh-token-secret"
process.env.ACCESS_TOKEN_EXPIRY = "15m"
process.env.REFRESH_TOKEN_EXPIRY = "10d"
process.env.CORS_ORIGIN = "http://localhost:5173"
