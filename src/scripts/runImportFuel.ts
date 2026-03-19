import "dotenv/config";

import path from "node:path";

import ImportService from "../services/ImportService";

async function run() {
  const service = new ImportService();
  const dataDir = path.join(__dirname, "../../data");

  console.log("🚀 Lancement de l'import carburants...");
  await service.processFuelData(path.join(dataDir, "PrixCarburants_instantane_ruptures.xml"));
  console.log("✅ Import carburants terminé.");
}

run().catch(console.error);
