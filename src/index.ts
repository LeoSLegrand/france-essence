import "dotenv/config";

import app from "./app";
import prisma, { ensureSqlitePragmas } from "./config/prisma";
import { startFuelImportScheduler } from "./services/FuelImportScheduler";

const port = Number(process.env.PORT) || 3000;
const enableFuelImport = process.env.ENABLE_FUEL_IMPORT === "true";

const start = async () => {
  await prisma.$connect();
  await ensureSqlitePragmas();

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });

  if (enableFuelImport) {
    startFuelImportScheduler();
  } else {
    console.log("Fuel import scheduler disabled (set ENABLE_FUEL_IMPORT=true to enable)");
  }
};

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
