// Add this check directly before initializing Neon
if (!process.env.DATABASE_URL) {
  throw new Error("CRITICAL: The production environment variable is missing or undefined!");
}

// Your existing Neon initialization below it...

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
