import "dotenv/config";

import app from "./app";
import prisma from "./config/prisma";
import { startFuelImportScheduler } from "./services/FuelImportScheduler";

const port = Number(process.env.PORT) || 3000;

const start = async () => {
  await prisma.$connect();

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });

  startFuelImportScheduler();
};

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
