import request from 'supertest'
import { vi, describe, it, beforeEach, expect } from 'vitest'

vi.mock('../src/db', () => {
  const prisma = {
    runstep: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      create: vi.fn(),
    },
  }
  return { prisma }
})

import app from '../src/index'
import { prisma } from '../src/db'

describe('runstep composite PK endpoints', () => {
  beforeEach(() => { vi.resetAllMocks() })

  it('GET /api/runstep/:id with composite key', async () => {
    ;(prisma.runstep.findUnique as any).mockResolvedValue({ RunID: BigInt(1), Step_No: 1, Name: 's' })
    const res = await request(app).get('/api/runstep/1-1')
    expect(res.status).toBe(200)
    expect(res.body.data).toBeTruthy()
  })

  it('PUT /api/runstep/:id updates composite key row', async () => {
    ;(prisma.runstep.update as any).mockResolvedValue({ RunID: BigInt(1), Step_No: 1, Name: 'updated' })
    const res = await request(app).put('/api/runstep/1-1').send({ Name: 'updated' })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  it('DELETE /api/runstep/:id deletes composite key row', async () => {
    ;(prisma.runstep.delete as any).mockResolvedValue({ RunID: BigInt(1), Step_No: 1 })
    const res = await request(app).delete('/api/runstep/1-1')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })
})
