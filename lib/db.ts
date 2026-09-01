import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  throw new Error("CRITICAL: DATABASE_URL environment string is missing!");
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Uses standard Prisma engine configuration
export const prisma = globalForPrisma.prisma || new PrismaClient(); 

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
