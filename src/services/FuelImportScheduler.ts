import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

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

const spawnImportProcess = () => {
  const distScript = path.join(__dirname, "../scripts/runImportFile.js");
  const srcScript = path.join(__dirname, "../scripts/runImportFile.ts");

  const useDist = fs.existsSync(distScript);
  const command = process.execPath;
  const args = useDist
    ? [distScript]
    : ["-r", "ts-node/register", srcScript];

  const child = spawn(command, args, {
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"]
  });

  child.stdout.on("data", (data) => {
    process.stdout.write(`[fuel-import] ${data}`);
  });

  child.stderr.on("data", (data) => {
    process.stderr.write(`[fuel-import] ${data}`);
  });

  child.on("exit", (code) => {
    console.log(`Fuel import process exited with code ${code ?? "unknown"}`);
  });
};

export const startFuelImportScheduler = (intervalMs = 60 * 60 * 1000) => {
  console.log(`Fuel import scheduler started (interval ${intervalMs}ms)`);
  const run = async () => {
    console.log("Auto import started");
    spawnImportProcess();
  };

  void run();
  return setInterval(() => void run(), intervalMs);
};
