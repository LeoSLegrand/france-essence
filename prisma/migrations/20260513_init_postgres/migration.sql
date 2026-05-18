-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('SP95', 'Gazole', 'E85', 'GPLc', 'E10', 'SP98');

-- CreateTable
CREATE TABLE "cities" (
    "code_insee" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "zip_code" TEXT NOT NULL,
    "latitude" DECIMAL NOT NULL,
    "longitude" DECIMAL NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("code_insee")
);

-- CreateTable
CREATE TABLE "city_postal_codes" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "city_code" TEXT NOT NULL,

    CONSTRAINT "city_postal_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stations" (
    "id" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "city_code" TEXT,
    "postal_code" TEXT,
    "latitude" DECIMAL NOT NULL,
    "longitude" DECIMAL NOT NULL,
    "services" JSONB NOT NULL,
    "horaires" JSONB NOT NULL,

    CONSTRAINT "stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "current_prices" (
    "station_id" INTEGER NOT NULL,
    "fuel_type" "FuelType" NOT NULL,
    "price" DECIMAL NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "current_prices_pkey" PRIMARY KEY ("station_id", "fuel_type")
);

-- CreateTable
CREATE TABLE "price_history" (
    "id" SERIAL NOT NULL,
    "station_id" INTEGER NOT NULL,
    "fuel_type" "FuelType" NOT NULL,
    "price" DECIMAL NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "preferred_fuel" TEXT NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fill_ups" (
    "id" SERIAL NOT NULL,
    "vehicle_id" INTEGER NOT NULL,
    "station_id" INTEGER NOT NULL,
    "fuel_type" "FuelType" NOT NULL,
    "kilometers" INTEGER NOT NULL,
    "liters" DECIMAL NOT NULL,
    "total_price" DECIMAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fill_ups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "city_postal_codes_code_idx" ON "city_postal_codes"("code");

-- CreateIndex
CREATE INDEX "city_postal_codes_city_code_idx" ON "city_postal_codes"("city_code");

-- CreateIndex
CREATE UNIQUE INDEX "city_postal_codes_code_city_code_key" ON "city_postal_codes"("code", "city_code");

-- CreateIndex
CREATE INDEX "stations_latitude_longitude_idx" ON "stations"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "stations_city_code_idx" ON "stations"("city_code");

-- CreateIndex
CREATE INDEX "stations_postal_code_idx" ON "stations"("postal_code");

-- CreateIndex
CREATE INDEX "current_prices_station_id_fuel_type_idx" ON "current_prices"("station_id", "fuel_type");

-- CreateIndex
CREATE UNIQUE INDEX "price_history_station_id_fuel_type_recorded_at_key" ON "price_history"("station_id", "fuel_type", "recorded_at");

-- CreateIndex
CREATE INDEX "price_history_recorded_at_idx" ON "price_history"("recorded_at");

-- CreateIndex
CREATE INDEX "price_history_fuel_type_recorded_at_idx" ON "price_history"("fuel_type", "recorded_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "city_postal_codes" ADD CONSTRAINT "city_postal_codes_city_code_fkey" FOREIGN KEY ("city_code") REFERENCES "cities"("code_insee") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stations" ADD CONSTRAINT "stations_city_code_fkey" FOREIGN KEY ("city_code") REFERENCES "cities"("code_insee") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "current_prices" ADD CONSTRAINT "current_prices_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fill_ups" ADD CONSTRAINT "fill_ups_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fill_ups" ADD CONSTRAINT "fill_ups_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
