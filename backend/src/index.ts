/**
 * Minimal Express + Prisma backend scaffold.
 *
 * This server exposes:
 *  - GET /api/meta/tables          => list tables in the current schema
 *  - Generic CRUD endpoints for tables:
 *      GET /api/:table
 *      POST /api/:table
 *      GET /api/:table/:id
 *      PUT /api/:table/:id
 *      DELETE /api/:table/:id
 *
 * Notes:
 *  - This scaffold uses raw SQL for dynamic table access but validates table names
 *    against information_schema to avoid injection. For production, prefer generated
 *    Prisma models (run `npx prisma db pull && npx prisma generate`) and use the
 *    typed client.
 */

import express, { Request, Response } from 'express';

import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { prisma } from './db';

dotenv.config({ path: __dirname + '/../../.env' });

const app = express();
// Prefer PORT from env; use 4000 as the local default. For production deployments
// you should set PORT explicitly (e.g., via systemd, Docker, or the hosting
// provider).
const port = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

// Middleware: sanitize responses by converting BigInt values to strings so
// express/res.json doesn't throw when serializing mocked or real DB rows.
function sanitizeBigInt(value: any): any {
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(sanitizeBigInt);
  if (value && typeof value === 'object') {
    const out: any = {};
    for (const k of Object.keys(value)) {
      out[k] = sanitizeBigInt(value[k]);
    }
    return out;
  }
  return value;
}

app.use((req: any, res: any, next: any) => {
  const origJson = res.json.bind(res)
  // @ts-ignore - we override res.json to sanitize BigInt values
  res.json = (body: any) => origJson(sanitizeBigInt(body))
  next()
})

// Helper: list tables in the current database/schema
app.get('/api/meta/tables', async (req: Request, res: Response) => {
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT TABLE_NAME as table_name FROM information_schema.tables WHERE table_schema = DATABASE()`
    );
    const tables = rows.map((r: any) => r.table_name);
    res.json({ tables });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to list tables' });
  }
});

// Mapping of table -> prisma model accessor and primary key info
const modelMap: Record<string, { name: string; pk: string | string[] }> = {
  agent: { name: 'agent', pk: 'AgentID' },
  artifact: { name: 'artifact', pk: 'ArtifactID' },
  dataset: { name: 'dataset', pk: 'DatasetID' },
  environment: { name: 'environment', pk: 'EnvironmentID' },
  project: { name: 'project', pk: 'ProjectID' },
  run: { name: 'run', pk: 'RunID' },
  runmetric: { name: 'runmetric', pk: 'ID' },
  runstep: { name: 'runstep', pk: ['RunID', 'Step_No'] },
  user: { name: 'user', pk: 'userID' },
};

function validateTable(table: string) {
  return Object.prototype.hasOwnProperty.call(modelMap, table);
}

// GET /api/:table  -> list, with pagination query ?page=1&limit=20
app.get('/api/:table', async (req: Request, res: Response) => {
  const table = req.params.table;
  const page = Math.max(1, parseInt((req.query.page as string) || '1'));
  const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '20')));
  if (!validateTable(table)) return res.status(400).json({ error: 'Unknown table' });
  const offset = (page - 1) * limit;
  try {
    const map = modelMap[table];
    const data = await (prisma as any)[map.name].findMany({ skip: offset, take: limit });
    const total = await (prisma as any)[map.name].count();
    res.json({ data, meta: { page, limit, total } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to fetch table rows' });
  }
});

// POST /api/:table -> create (body is object of column -> value)
app.post('/api/:table', async (req: Request, res: Response) => {
  const table = req.params.table;
  const payload = req.body;
  if (!validateTable(table)) return res.status(400).json({ error: 'Unknown table' });
  try {
    const map = modelMap[table];
    const created = await (prisma as any)[map.name].create({ data: payload });
    res.json({ ok: true, data: created });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || 'failed to insert row' });
  }
});

// GET /api/:table/:id -> fetch by PK
app.get('/api/:table/:id', async (req: Request, res: Response) => {
  const table = req.params.table;
  const id = req.params.id;
  if (!validateTable(table)) return res.status(400).json({ error: 'Unknown table' });
  try {
    const map = modelMap[table];
    // handle composite PK for runstep where id will be 'RunID-Step_No'
    if (Array.isArray(map.pk)) {
      const [runId, stepNo] = id.split('-');
      const row = await (prisma as any)[map.name].findUnique({ where: { RunID_Step_No: { RunID: BigInt(runId), Step_No: parseInt(stepNo) } } });
      return res.json({ data: row || null });
    }
    const where: any = {};
    // prisma BigInt fields expect JS BigInt or string depending on client config
    where[map.pk] = id;
    const row = await (prisma as any)[map.name].findUnique({ where });
    res.json({ data: row || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to fetch row' });
  }
});

// PUT /api/:table/:id -> update by PK
app.put('/api/:table/:id', async (req: Request, res: Response) => {
  const table = req.params.table;
  const id = req.params.id;
  const payload = req.body;
  if (!validateTable(table)) return res.status(400).json({ error: 'Unknown table' });
  try {
    const map = modelMap[table];
    if (Array.isArray(map.pk)) {
      const [runId, stepNo] = id.split('-');
      const updated = await (prisma as any)[map.name].update({ where: { RunID_Step_No: { RunID: BigInt(runId), Step_No: parseInt(stepNo) } }, data: payload });
      return res.json({ ok: true, data: updated });
    }
    const where: any = {};
    where[map.pk] = id;
    const updated = await (prisma as any)[map.name].update({ where, data: payload });
    res.json({ ok: true, data: updated });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || 'failed to update row' });
  }
});

// DELETE /api/:table/:id -> delete by PK
app.delete('/api/:table/:id', async (req: Request, res: Response) => {
  const table = req.params.table;
  const id = req.params.id;
  if (!validateTable(table)) return res.status(400).json({ error: 'Unknown table' });
  try {
    const map = modelMap[table];
    if (Array.isArray(map.pk)) {
      const [runId, stepNo] = id.split('-');
      const deleted = await (prisma as any)[map.name].delete({ where: { RunID_Step_No: { RunID: BigInt(runId), Step_No: parseInt(stepNo) } } });
      return res.json({ ok: true, data: deleted });
    }
    const where: any = {};
    where[map.pk] = id;
    const deleted = await (prisma as any)[map.name].delete({ where });
    res.json({ ok: true, data: deleted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to delete row' });
  }
});

// Health
app.get('/health', (req: Request, res: Response) => res.json({ ok: true }));

// Start server only when run directly. Export `app` for tests to import.
if (require.main === module) {
  // Robust startup: if the chosen port is already in use, try the next one
  // up to a few times to avoid hard failures in developer environments.
  const maxRetries = 5
  let attempt = 0
  let listenPort = parseInt(String(port), 10)

  const tryListen = () => {
    const server = app.listen(listenPort, () => {
      console.log(`Backend listening on http://localhost:${listenPort}`)
    })

    server.on('error', (err: any) => {
      if (err && err.code === 'EADDRINUSE' && attempt < maxRetries) {
        console.warn(`Port ${listenPort} in use, trying ${listenPort + 1}`)
        attempt += 1
        listenPort += 1
        setTimeout(tryListen, 200)
        return
      }
      console.error('Failed to start server:', err)
      process.exit(1)
    })
  }

  tryListen()
}

export default app;
