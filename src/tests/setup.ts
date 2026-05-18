import "dotenv/config";

process.env.NODE_ENV ??= "test";
process.env.JWT_SECRET ??= "test-jwt-secret";
process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/france_essence_test?schema=public";
