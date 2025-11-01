import request from 'supertest'
import { vi, describe, it, beforeEach, expect } from 'vitest'

// Provide a mock implementation directly in the factory so vitest's hoisting
// doesn't encounter an uninitialized variable.
vi.mock('../src/db', () => {
  const prisma = {
    $queryRawUnsafe: vi.fn(),
    agent: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  }
  return { prisma }
})

import app from '../src/index'
import { prisma } from '../src/db'

describe('API endpoints (mocked prisma)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('GET /api/meta/tables returns table list', async () => {
    ;(prisma.$queryRawUnsafe as any).mockResolvedValue([
      { table_name: 'agent' },
      { table_name: 'user' },
    ])
    const res = await request(app).get('/api/meta/tables')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ tables: ['agent', 'user'] })
  })

  it('GET /api/agent returns paginated list', async () => {
    ;(prisma.agent.findMany as any).mockResolvedValue([{ AgentID: 1, Name: 'A' }])
    ;(prisma.agent.count as any).mockResolvedValue(1)
    const res = await request(app).get('/api/agent')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.meta.total).toBe(1)
  })

  it('POST /api/agent creates a record', async () => {
    const payload = { Name: 'New Agent' }
    ;(prisma.agent.create as any).mockResolvedValue({ AgentID: 42, ...payload })
    const res = await request(app).post('/api/agent').send(payload)
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.data.AgentID).toBe(42)
  })

  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })
})
