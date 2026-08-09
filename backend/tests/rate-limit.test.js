import { describe, it, expect, vi } from 'vitest'






describe('Rate limiting', () => {
    it('rejects excess login attempts with 429', async () => {
        vi.resetModules()
        vi.stubEnv('NODE_ENV', 'development')

        
        
        const { default: mongoose } = await import('mongoose')
        mongoose.set('bufferCommands', false)

        const { default: app } = await import('../src/app.js')
        const server = app.listen(0)
        const port = server.address().port

        try {
            let last
            
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
