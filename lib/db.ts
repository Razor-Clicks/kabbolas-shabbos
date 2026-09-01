import { PrismaClient } from '@prisma/client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

if (!process.env.DATABASE_URL) {
  throw new Error("CRITICAL: DATABASE_URL is missing!");
}

// Configures global serverless web sockets for Prisma
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaNeon(pool);

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

import { PrismaClient } from '@prisma/client';

// This forces a clear error in the Vercel logs if the variable is missing,
// instead of letting Prisma crash on the cryptic '.getTime()' method
if (!process.env.DATABASE_URL) {
  throw new Error("CRITICAL_BREAK: DATABASE_URL is missing from Vercel Environment Variables!");
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['query', 'error', 'warn'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Add this check directly before initializing Neon
if (!process.env.DATABASE_URL) {
  throw new Error("CRITICAL: The production environment variable is missing or undefined!");
}

// Your existing Neon initialization below it...

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
