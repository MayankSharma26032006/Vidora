import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import app from '../src/app.js'

let mongo

beforeAll(async () => {
    mongo = await MongoMemoryServer.create()
    await mongoose.connect(mongo.getUri())
})

afterAll(async () => {
    await mongoose.disconnect()
    await mongo.stop()
})



const firstAllowedOrigin = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')[0]
    .trim()

describe('Security hardening', () => {
    it('serves helmet security headers on API responses', async () => {
        const res = await request(app).get('/api/v1/videos')
        expect(res.headers['x-content-type-options']).toBe('nosniff')
        expect(res.headers['x-frame-options']).toBe('SAMEORIGIN')
        expect(res.headers['x-dns-prefetch-control']).toBe('off')
    })

    it('reflects allowed CORS origins with credentials', async () => {
        const res = await request(app)
            .get('/api/v1/videos')
            .set('Origin', firstAllowedOrigin)
        expect(res.headers['access-control-allow-origin']).toBe(firstAllowedOrigin)
        expect(res.headers['access-control-allow-credentials']).toBe('true')
    })

    it('sends no CORS headers to unknown origins', async () => {
        const res = await request(app)
            .get('/api/v1/videos')
            .set('Origin', 'http://evil.example.com')
        expect(res.headers['access-control-allow-origin']).toBeUndefined()
    })
})
