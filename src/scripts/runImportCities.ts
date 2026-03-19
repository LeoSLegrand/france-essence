import "dotenv/config";

import path from "node:path";

import ImportService from "../services/ImportService";

async function run() {
  const service = new ImportService();
  const dataDir = path.join(__dirname, "../../data");

  console.log("🚀 Lancement de l'import des villes...");
  await service.processCityData(path.join(dataDir, "communes-france-2025.csv"));
  console.log("✅ Import des villes terminé.");
}

run().catch(console.error);
