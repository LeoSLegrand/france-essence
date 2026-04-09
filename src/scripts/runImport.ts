import "dotenv/config";

import path from "node:path";

import ImportService from "../services/ImportService";

async function run() {
  const service = new ImportService();
  const dataDir = path.join(__dirname, "../../data");

  console.log("Lancement de l'import complet...");
  
  // 1. Import des Villes
  await service.processCityData(path.join(dataDir, "communes-france-2025.csv"));
  
  // 2. Import du flux carburant
  await service.processFuelData(path.join(dataDir, "PrixCarburants_instantane_ruptures.xml"));

  console.log("✅ Import terminé avec succès.");
}

run().catch(console.error);