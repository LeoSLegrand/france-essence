/*
  Warnings:

  - You are about to drop the column `is_cedex` on the `city_postal_codes` table. All the data in the column will be lost.
  - You are about to drop the column `label` on the `city_postal_codes` table. All the data in the column will be lost.
  - You are about to drop the column `normalized_code` on the `city_postal_codes` table. All the data in the column will be lost.
  - You are about to drop the column `postal_code_normalized` on the `stations` table. All the data in the column will be lost.
  - You are about to drop the column `postal_code_raw` on the `stations` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_city_postal_codes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "city_code" TEXT NOT NULL,
    CONSTRAINT "city_postal_codes_city_code_fkey" FOREIGN KEY ("city_code") REFERENCES "cities" ("code_insee") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_city_postal_codes" ("city_code", "code", "id") SELECT "city_code", "code", "id" FROM "city_postal_codes";
DROP TABLE "city_postal_codes";
ALTER TABLE "new_city_postal_codes" RENAME TO "city_postal_codes";
CREATE INDEX "city_postal_codes_code_idx" ON "city_postal_codes"("code");
CREATE INDEX "city_postal_codes_city_code_idx" ON "city_postal_codes"("city_code");
CREATE UNIQUE INDEX "city_postal_codes_code_city_code_key" ON "city_postal_codes"("code", "city_code");
CREATE TABLE "new_stations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "address" TEXT NOT NULL,
    "city_code" TEXT,
    "postal_code" TEXT,
    "latitude" DECIMAL NOT NULL,
    "longitude" DECIMAL NOT NULL,
    "services" JSONB NOT NULL,
    "horaires" JSONB NOT NULL,
    CONSTRAINT "stations_city_code_fkey" FOREIGN KEY ("city_code") REFERENCES "cities" ("code_insee") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_stations" ("address", "city_code", "horaires", "id", "latitude", "longitude", "services") SELECT "address", "city_code", "horaires", "id", "latitude", "longitude", "services" FROM "stations";
DROP TABLE "stations";
ALTER TABLE "new_stations" RENAME TO "stations";
CREATE INDEX "stations_latitude_longitude_idx" ON "stations"("latitude", "longitude");
CREATE INDEX "stations_city_code_idx" ON "stations"("city_code");
CREATE INDEX "stations_postal_code_idx" ON "stations"("postal_code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
