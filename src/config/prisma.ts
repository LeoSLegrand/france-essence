import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../../prisma/generated/prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = globalThis.prisma ?? new PrismaClient({ adapter });
let pragmasApplied = false;

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export const ensureSqlitePragmas = async () => {
  if (pragmasApplied) {
    return;
  }

  await prisma.$executeRawUnsafe("PRAGMA journal_mode=WAL;");
  await prisma.$executeRawUnsafe("PRAGMA busy_timeout = 5000;");
  pragmasApplied = true;
};

export default prisma;
