import { describe, it, expect, vi } from 'vitest'

// The rate limiters are intentionally disabled when NODE_ENV === 'test', so this
// suite re-imports the app with a non-test env to prove the 429 path works.
// No database is opened: mongoose buffering is turned off so the first attempts
// fail fast at the controller (500), while the excess attempts are rejected by
// the limiter before any controller runs.
describe('Rate limiting', () => {
    it('rejects excess login attempts with 429', async () => {
        vi.resetModules()
        vi.stubEnv('NODE_ENV', 'development')

        // importing mongoose here (after the cache reset) returns the same
        // instance the freshly re-imported app will use
        const { default: mongoose } = await import('mongoose')
        mongoose.set('bufferCommands', false)

        const { default: app } = await import('../src/app.js')
        const server = app.listen(0)
        const port = server.address().port

        try {
            let last
            // max is 20 per window; the 22nd attempt must be rate limited
            for (let i = 0; i < 22; i++) {
                last = await fetch(`http://localhost:${port}/api/v1/user/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: 'x', password: 'y' })
                })
            }
            expect(last.status).toBe(429)
            expect(last.headers.get('ratelimit-remaining')).toBe('0')
        } finally {
            server.close()
            vi.unstubAllEnvs()
        }
    })
})
