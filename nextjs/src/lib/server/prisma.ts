/* istanbul ignore file */

import { PrismaClient } from "@prisma/client";

declare global {
  // Prevent multiple instances of Prisma Client in development
  // This keeps the Prisma Client instance cached across hot reloads
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: [], // Prevent query logs
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
