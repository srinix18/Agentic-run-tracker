import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: __dirname + '/../../.env' });

// Export a singleton Prisma client. After running `npx prisma generate` this
// client will be ready to use to query your existing database.
export const prisma = new PrismaClient();

export default prisma;
