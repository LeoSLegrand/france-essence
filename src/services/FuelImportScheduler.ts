import fs from "node:fs";
import path from "node:path";

import AdmZip from "adm-zip";
import axios from "axios";

import ImportService from "./ImportService";

const DOWNLOAD_URL = "https://donnees.roulez-eco.fr/opendata/instantane_ruptures";
const DATA_DIR = path.join(__dirname, "../../data");
const ZIP_PATH = path.join(DATA_DIR, "instantane_ruptures.zip");
const XML_PATH = path.join(DATA_DIR, "PrixCarburants_instantane_ruptures.xml");

const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

const extractXmlFromZip = (zipPath: string, xmlPath: string) => {
  const zip = new AdmZip(zipPath);
  const xmlEntry = zip.getEntries().find((entry) => entry.entryName.endsWith(".xml"));
  if (!xmlEntry) {
    throw new Error("Fuel download: XML entry not found in zip");
  }

  if (fs.existsSync(xmlPath)) {
    fs.rmSync(xmlPath);
  }

  fs.writeFileSync(xmlPath, xmlEntry.getData());
};

export const downloadLatestFuelFile = async () => {
  ensureDataDir();

  const response = await axios.get(DOWNLOAD_URL, { responseType: "arraybuffer" });
  fs.writeFileSync(ZIP_PATH, response.data);
  extractXmlFromZip(ZIP_PATH, XML_PATH);

  if (fs.existsSync(ZIP_PATH)) {
    fs.rmSync(ZIP_PATH);
  }

  return XML_PATH;
};

export const downloadAndImportFuel = async () => {
  const xmlPath = await downloadLatestFuelFile();
  const importService = new ImportService();
  await importService.processFuelData(xmlPath);
};

export const startFuelImportScheduler = (intervalMs = 60 * 60 * 1000) => {
  const run = async () => {
    try {
      await downloadAndImportFuel();
    } catch (error) {
      console.error("Fuel scheduler: failed to download/import", error);
    }
  };

  void run();
  return setInterval(() => void run(), intervalMs);
};
