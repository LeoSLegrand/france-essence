import "dotenv/config";

import path from "node:path";

import ImportService from "../services/ImportService";
import { downloadLatestFuelFile } from "../services/FuelImportScheduler";

async function run() {
  const service = new ImportService();
  const dataDir = path.join(__dirname, "../../data");
  const argPath = process.argv[2];

  const xmlPath = argPath
    ? path.resolve(process.cwd(), argPath)
    : await downloadLatestFuelFile();

  console.log("Starting fuel import from file...", { xmlPath, dataDir });
  await service.processFuelData(xmlPath);
  console.log("Fuel import finished.");
}

run().catch(console.error);
