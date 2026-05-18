-- CreateTable
CREATE TABLE "cities" (
    "code_insee" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "zip_code" TEXT NOT NULL,
    "latitude" DECIMAL NOT NULL,
    "longitude" DECIMAL NOT NULL
);

-- CreateTable
CREATE TABLE "city_postal_codes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "normalized_code" TEXT NOT NULL,
    "city_code" TEXT NOT NULL,
    "is_cedex" BOOLEAN NOT NULL DEFAULT false,
    "label" TEXT,
    CONSTRAINT "city_postal_codes_city_code_fkey" FOREIGN KEY ("city_code") REFERENCES "cities" ("code_insee") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "address" TEXT NOT NULL,
    "city_code" TEXT,
    "postal_code_raw" TEXT,
    "postal_code_normalized" TEXT,
    "latitude" DECIMAL NOT NULL,
    "longitude" DECIMAL NOT NULL,
    "services" JSONB NOT NULL,
    "horaires" JSONB NOT NULL,
    CONSTRAINT "stations_city_code_fkey" FOREIGN KEY ("city_code") REFERENCES "cities" ("code_insee") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "current_prices" (
    "station_id" INTEGER NOT NULL,
    "fuel_type" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    "updated_at" DATETIME NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY ("station_id", "fuel_type"),
    CONSTRAINT "current_prices_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "price_history" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "station_id" INTEGER NOT NULL,
    "fuel_type" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    "recorded_at" DATETIME NOT NULL,
    CONSTRAINT "price_history_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "preferred_fuel" TEXT NOT NULL,
    CONSTRAINT "vehicles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fill_ups" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vehicle_id" INTEGER NOT NULL,
    "station_id" INTEGER NOT NULL,
    "fuel_type" TEXT NOT NULL,
    "kilometers" INTEGER NOT NULL,
    "liters" DECIMAL NOT NULL,
    "total_price" DECIMAL NOT NULL,
    "date" DATETIME NOT NULL,
    CONSTRAINT "fill_ups_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "fill_ups_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "city_postal_codes_code_idx" ON "city_postal_codes"("code");

-- CreateIndex
CREATE INDEX "city_postal_codes_normalized_code_idx" ON "city_postal_codes"("normalized_code");

-- CreateIndex
CREATE INDEX "city_postal_codes_city_code_idx" ON "city_postal_codes"("city_code");

-- CreateIndex
CREATE UNIQUE INDEX "city_postal_codes_normalized_code_city_code_key" ON "city_postal_codes"("normalized_code", "city_code");

-- CreateIndex
CREATE INDEX "stations_latitude_longitude_idx" ON "stations"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "stations_city_code_idx" ON "stations"("city_code");

-- CreateIndex
CREATE INDEX "stations_postal_code_normalized_idx" ON "stations"("postal_code_normalized");

-- CreateIndex
CREATE INDEX "current_prices_station_id_fuel_type_idx" ON "current_prices"("station_id", "fuel_type");

-- CreateIndex
CREATE UNIQUE INDEX "price_history_station_id_fuel_type_recorded_at_key" ON "price_history"("station_id", "fuel_type", "recorded_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
