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
import { prisma, getPrismaClient } from './db';

dotenv.config({ path: __dirname + '/../../.env' });

const app = express();
// Prefer PORT from env; use 4000 as the local default. For production deployments
// you should set PORT explicitly (e.g., via systemd, Docker, or the hosting
// provider).
const port = process.env.PORT || 4000;

// Extend Express Request type to include userRole and dbClient
declare global {
  namespace Express {
    interface Request {
      userRole?: 'admin' | 'user';
      dbClient?: any;
    }
  }
}

app.use(cors());
app.use(bodyParser.json());

// Middleware: Extract user role from request headers and attach appropriate DB client
app.use((req: any, res: any, next: any) => {
  // Extract user role from custom header (set by frontend after login)
  const userRole = req.headers['x-user-role'] as 'admin' | 'user' || 'user';
  req.userRole = userRole;

  // Attach appropriate Prisma client based on role
  req.dbClient = getPrismaClient(userRole);

  next();
});

// Middleware: sanitize responses by converting BigInt and Date values to strings so
// express/res.json doesn't throw when serializing mocked or real DB rows.
function sanitizeBigInt(value: any): any {
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString();
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
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT TABLE_NAME as table_name FROM information_schema.tables WHERE table_schema = DATABASE()`
    );
    const tables = rows.map((r: any) => r.table_name);
    res.json({ tables });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to list tables' });
  }
});

// Get table schema with column details including default values
app.get('/api/meta/schema/:table', async (req: Request, res: Response) => {
  const table = req.params.table;
  try {
    const columns = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        COLUMN_NAME as name,
        DATA_TYPE as type,
        IS_NULLABLE as nullable,
        COLUMN_DEFAULT as defaultValue,
        COLUMN_KEY as key,
        EXTRA as extra
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION`,
      table
    );
    res.json({ columns });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to fetch schema' });
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
app.get('/api/:table', async (req: any, res: Response) => {
  const table = req.params.table;
  const page = Math.max(1, parseInt((req.query.page as string) || '1'));
  const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '20')));
  if (!validateTable(table)) return res.status(400).json({ error: 'Unknown table' });
  const offset = (page - 1) * limit;
  try {
    const map = modelMap[table];
    // Use role-based database client
    const db = req.dbClient || prisma;
    const data = await (db as any)[map.name].findMany({ skip: offset, take: limit });
    const total = await (db as any)[map.name].count();
    res.json({ data, meta: { page, limit, total } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to fetch table rows' });
  }
});

// POST /api/:table -> create (body is object of column -> value)
app.post('/api/:table', async (req: any, res: Response) => {
  const table = req.params.table;
  const payload = req.body;
  if (!validateTable(table)) return res.status(400).json({ error: 'Unknown table' });

  // Check if user has admin privileges for write operations
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin privileges required for this operation' });
  }

  try {
    const map = modelMap[table];
    // Use role-based database client
    const db = req.dbClient || prisma;
    const created = await (db as any)[map.name].create({ data: payload });
    res.json({ ok: true, data: created });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || 'failed to insert row' });
  }
});

// GET /api/:table/:id -> fetch by PK
app.get('/api/:table/:id', async (req: any, res: Response) => {
  const table = req.params.table;
  const id = req.params.id;
  if (!validateTable(table)) return res.status(400).json({ error: 'Unknown table' });
  try {
    const map = modelMap[table];
    // Use role-based database client
    const db = req.dbClient || prisma;
    // handle composite PK for runstep where id will be 'RunID-Step_No'
    if (Array.isArray(map.pk)) {
      const [runId, stepNo] = id.split('-');
      const row = await (db as any)[map.name].findUnique({ where: { RunID_Step_No: { RunID: BigInt(runId), Step_No: parseInt(stepNo) } } });
      return res.json({ data: row || null });
    }
    const where: any = {};
    // prisma BigInt fields expect JS BigInt or string depending on client config
    where[map.pk] = id;
    const row = await (db as any)[map.name].findUnique({ where });
    res.json({ data: row || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to fetch row' });
  }
});

// PUT /api/:table/:id -> update by PK
app.put('/api/:table/:id', async (req: any, res: Response) => {
  const table = req.params.table;
  const id = req.params.id;
  const payload = req.body;
  if (!validateTable(table)) return res.status(400).json({ error: 'Unknown table' });

  // Check if user has admin privileges for write operations
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin privileges required for this operation' });
  }

  try {
    const map = modelMap[table];
    // Use role-based database client
    const db = req.dbClient || prisma;
    if (Array.isArray(map.pk)) {
      const [runId, stepNo] = id.split('-');
      const updated = await (db as any)[map.name].update({ where: { RunID_Step_No: { RunID: BigInt(runId), Step_No: parseInt(stepNo) } }, data: payload });
      return res.json({ ok: true, data: updated });
    }
    const where: any = {};
    where[map.pk] = id;
    const updated = await (db as any)[map.name].update({ where, data: payload });
    res.json({ ok: true, data: updated });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || 'failed to update row' });
  }
});

// DELETE /api/:table/:id -> delete by PK
app.delete('/api/:table/:id', async (req: any, res: Response) => {
  const table = req.params.table;
  const id = req.params.id;
  if (!validateTable(table)) return res.status(400).json({ error: 'Unknown table' });

  // Check if user has admin privileges for write operations
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin privileges required for this operation' });
  }

  try {
    const map = modelMap[table];
    // Use role-based database client
    const db = req.dbClient || prisma;
    if (Array.isArray(map.pk)) {
      const [runId, stepNo] = id.split('-');
      const deleted = await (db as any)[map.name].delete({ where: { RunID_Step_No: { RunID: BigInt(runId), Step_No: parseInt(stepNo) } } });
      return res.json({ ok: true, data: deleted });
    }
    const where: any = {};
    where[map.pk] = id;
    const deleted = await (db as any)[map.name].delete({ where });
    res.json({ ok: true, data: deleted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to delete row' });
  }
});

// POST /api/query/execute -> execute custom SQL query
app.post('/api/query/execute', async (req: any, res: Response) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query string is required' });
  }

  // Trim and validate query
  const trimmedQuery = query.trim();
  if (trimmedQuery.length === 0) {
    return res.status(400).json({ error: 'Query cannot be empty' });
  }

  try {
    // Detect if it's a SELECT query or a procedure call
    const isSelect = /^\s*SELECT/i.test(trimmedQuery);
    const isCall = /^\s*CALL/i.test(trimmedQuery);

    // Use role-based database client
    const db = req.dbClient || prisma;

    if (isSelect || isCall) {
      // For SELECT and CALL, return results (both admin and user can read)
      const results = await db.$queryRawUnsafe(trimmedQuery);
      res.json({
        ok: true,
        data: results,
        rowCount: Array.isArray(results) ? results.length : 0,
        queryType: isCall ? 'PROCEDURE' : 'SELECT'
      });
    } else {
      // For other queries (INSERT, UPDATE, DELETE, etc.)
      // Check if user has admin privileges
      if (req.userRole !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admin privileges required for write operations' });
      }

      const result = await db.$executeRawUnsafe(trimmedQuery);
      res.json({
        ok: true,
        affectedRows: result,
        queryType: 'MUTATION'
      });
    }
  } catch (err: any) {
    console.error('Query execution error:', err);
    res.status(500).json({
      error: err.message || 'Failed to execute query',
      details: err.code || 'Unknown error'
    });
  }
});

// Authentication endpoints
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { Email: email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Simple password check (in production, use bcrypt)
    if (user.Password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Return user info (exclude password)
    res.json({
      ok: true,
      user: {
        userID: user.userID.toString(),
        fname: user.Fname,
        lname: user.Lname,
        email: user.Email,
        role: user.Role,
        createdAt: user.CreatedAt
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user info (for session validation)
app.post('/api/auth/me', async (req: Request, res: Response) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { userID: BigInt(userId) }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      ok: true,
      user: {
        userID: user.userID.toString(),
        fname: user.Fname,
        lname: user.Lname,
        email: user.Email,
        role: user.Role,
        createdAt: user.CreatedAt
      }
    });
  } catch (err) {
    console.error('Auth check error:', err);
    res.status(500).json({ error: 'Failed to get user info' });
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
