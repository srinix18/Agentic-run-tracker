// Simple DB connectivity check script. Loads backend .env and runs a lightweight query.
const dotenv = require('dotenv')
dotenv.config({ path: __dirname + '/../../.env' })

const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  try {
    await prisma.$connect()
    console.log('Connected to DB, running test query...')
    const rows = await prisma.$queryRawUnsafe('SELECT TABLE_NAME as table_name FROM information_schema.tables WHERE table_schema = DATABASE() LIMIT 5')
    console.log('Sample tables:', rows)
  } catch (e) {
    console.error('DB connection or query failed:', e.message || e)
    process.exitCode = 2
  } finally {
    try { await prisma.$disconnect() } catch(e){}
  }
}

main()
