-- CreateIndex
CREATE INDEX "price_history_recorded_at_idx" ON "price_history"("recorded_at");

-- CreateIndex
CREATE INDEX "price_history_fuel_type_recorded_at_idx" ON "price_history"("fuel_type", "recorded_at");
