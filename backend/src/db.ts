import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: __dirname + '/../../.env' });

/**
 * Database Connection Manager with Role-Based Access Control
 * 
 * This module provides two Prisma clients:
 * 1. prismaAdmin - Full CRUD access (for admin users)
 * 2. prismaReadOnly - Read-only access (for regular users)
 */

// Admin client - Full access (INSERT, UPDATE, DELETE, SELECT)
export const prismaAdmin = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL, // Uses admin_user connection
        },
    },
});

// Read-only client - SELECT only access
export const prismaReadOnly = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL_READONLY || process.env.DATABASE_URL, // Fallback to admin if not set
        },
    },
});

// Default export for backward compatibility (admin access)
export const prisma = prismaAdmin;

/**
 * Get the appropriate Prisma client based on user role
 * @param userRole - 'admin' or 'user'
 * @returns Prisma client with appropriate permissions
 */
export function getPrismaClient(userRole: 'admin' | 'user' = 'admin'): PrismaClient {
    return userRole === 'admin' ? prismaAdmin : prismaReadOnly;
}

export default prisma;
