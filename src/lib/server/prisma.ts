import { PrismaClient } from '@prisma/client';
import { dev } from '$app/environment';

// Vite reloads this module on every save in dev, which would otherwise leak a
// new connection pool each time. Stash the client on globalThis to reuse it.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (dev) globalForPrisma.prisma = prisma;
