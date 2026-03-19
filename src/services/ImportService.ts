import fs from "node:fs";
import path from "node:path";

import AdmZip from "adm-zip";
import csvParser from "csv-parser";
import { XMLParser } from "fast-xml-parser";
import iconv from "iconv-lite";

import { Prisma, FuelType } from "../../prisma/generated/prisma/client";
import prisma from "../config/prisma";

type RawPdv = {
  id?: string;
  latitude?: string;
  longitude?: string;
  cp?: string;
  adresse?: string;
  ville?: string;
  code_insee?: string;
  services?: { service?: string | string[] } | string[];
  horaires?: unknown;
  prix?: RawPrix | RawPrix[];
  rupture?: RawRupture | RawRupture[];
};

type RawPrix = {
  nom?: string;
  valeur?: string;
  maj?: string;
};

type RawRupture = {
  nom?: string;
};

const FUEL_MAP: Record<string, FuelType> = {
  Gazole: FuelType.Gazole,
  SP95: FuelType.SP95,
  SP98: FuelType.SP98,
  E10: FuelType.E10,
  "SP95-E10": FuelType.E10,
  E85: FuelType.E85,
  GPLc: FuelType.GPLc
};

export default class ImportService {
  private postalCodeIndex = new Map<string, Set<string>>();
  private cityNameIndex = new Map<string, Set<string>>();
  private cityLocationIndex = new Map<string, { lat: number; lng: number; names: Set<string> }>();

  async processFuelData(xmlZipPath: string): Promise<void> {
    await this.preloadCityIndexes();

    const xmlContent = this.readXmlFromZip(xmlZipPath);
    if (!xmlContent) {
      console.warn("Fuel import: no XML content found", { xmlZipPath });
      return;
    }

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
      parseAttributeValue: false
    });

    let parsed: { pdv_liste?: { pdv?: RawPdv | RawPdv[] } };
    try {
      parsed = parser.parse(xmlContent);
    } catch (error) {
      console.error("Fuel import: failed to parse XML", error);
      return;
    }

    const pdvList = parsed.pdv_liste?.pdv;
    const stations = this.toArray(pdvList);

    for (const pdv of stations) {
      try {
        await this.importPdv(pdv);
      } catch (error) {
        console.error("Fuel import: failed to import station", {
          stationId: pdv.id,
          error
        });
      }
    }
  }

  async processCityData(csvPath: string): Promise<void> {
    if (!fs.existsSync(csvPath)) {
      console.warn("City import: CSV not found", { csvPath });
      return;
    }

    const operations: Array<Prisma.PrismaPromise<unknown>> = [];

    await new Promise<void>((resolve, reject) => {
      const stream = fs
        .createReadStream(csvPath)
        .pipe(iconv.decodeStream("latin1"))
        .pipe(
          csvParser({
            separator: ",",
            mapHeaders: ({ header }) => (header && header.trim() ? header.trim() : null)
          })
        );

      stream
        .on("data", async (row) => {
          stream.pause();

          try {
            const codeInsee = this.readString(row, "code_insee");
            const name = this.cleanText(this.readString(row, "nom_standard"));
            const latitude =
              this.readDecimal(row, "latitude_centre") ??
              this.readDecimal(row, "latitude_mairie");
            const longitude =
              this.readDecimal(row, "longitude_centre") ??
              this.readDecimal(row, "longitude_mairie");
            const zipCode =
              this.readString(row, "code_postal") ||
              this.firstPostalCode(this.readString(row, "codes_postaux")) ||
              this.readString(row, "code_postal_min") ||
              this.readString(row, "cp") ||
              "";
            const allPostalCodes = this.readString(row, "codes_postaux");

            if (!codeInsee || !name || !latitude || !longitude) {
              return;
            }

            operations.push(
              prisma.city.upsert({
                where: { codeInsee },
                update: { name, zipCode, latitude, longitude },
                create: { codeInsee, name, zipCode, latitude, longitude }
              })
            );

            const nameVariants = this.collectCityNameVariants(row);
            this.indexCityNames(codeInsee, nameVariants);
            this.indexCityLocation(codeInsee, latitude.toNumber(), longitude.toNumber(), nameVariants);

            const postalCodes = this.collectPostalCodes(codeInsee, zipCode, allPostalCodes);
            for (const postalCode of postalCodes) {
              const normalizedCode = this.normalizePostalCode(postalCode);
              if (!normalizedCode) {
                continue;
              }

              this.indexPostalCode(codeInsee, normalizedCode);
              operations.push(
                prisma.cityPostalCode.upsert({
                  where: {
                    code_cityCode: {
                      code: postalCode,
                      cityCode: codeInsee
                    }
                  },
                  update: { code: postalCode },
                  create: { code: postalCode, cityCode: codeInsee }
                })
              );
            }

            if (operations.length >= 200) {
              const batch = operations.splice(0, operations.length);
              await prisma.$transaction(batch);
            }
          } catch (error) {
            console.error("City import: row parse error", error);
          } finally {
            stream.resume();
          }
        })
        .on("error", (error) => reject(error))
        .on("end", () => resolve());
    });

    if (operations.length > 0) {
      await prisma.$transaction(operations);
    }
  }

  private readXmlFromZip(xmlZipPath: string): string | null {
    if (!fs.existsSync(xmlZipPath)) {
      console.warn("Fuel import: XML/ZIP not found", { xmlZipPath });
      return null;
    }

    const ext = path.extname(xmlZipPath).toLowerCase();
    if (ext === ".xml") {
      return iconv.decode(fs.readFileSync(xmlZipPath), "latin1");
    }

    const zip = new AdmZip(xmlZipPath);
    const xmlEntry = zip
      .getEntries()
      .find((entry) => entry.entryName.endsWith(".xml"));

    if (!xmlEntry) {
      return null;
    }

    return iconv.decode(xmlEntry.getData(), "latin1");
  }

  private async preloadCityIndexes(): Promise<void> {
    if (this.postalCodeIndex.size > 0 || this.cityNameIndex.size > 0) {
      return;
    }

    const cities = await prisma.city.findMany({
      select: {
        codeInsee: true,
        name: true,
        latitude: true,
        longitude: true
      }
    });

    for (const city of cities) {
      const nameVariant = this.normalizeCityName(city.name);
      if (nameVariant) {
        this.indexCityNames(city.codeInsee, new Set([nameVariant]));
      }
      this.indexCityLocation(
        city.codeInsee,
        city.latitude.toNumber(),
        city.longitude.toNumber(),
        nameVariant ? new Set([nameVariant]) : new Set()
      );
    }

    const postalCodes = await prisma.cityPostalCode.findMany({
      select: {
        code: true,
        cityCode: true
      }
    });

    for (const postalCode of postalCodes) {
      const normalizedCode = this.normalizePostalCode(postalCode.code);
      if (normalizedCode) {
        this.indexPostalCode(postalCode.cityCode, normalizedCode);
      }
    }
  }

  private async importPdv(pdv: RawPdv): Promise<void> {
    const stationId = this.toInt(pdv.id);
    if (!stationId) {
      return;
    }

    const latitude = this.normalizeCoordinate(pdv.latitude);
    const longitude = this.normalizeCoordinate(pdv.longitude);

    if (!latitude || !longitude) {
      return;
    }

    const address = this.cleanText(pdv.adresse ?? "");
    const cityCode = (pdv.code_insee ?? "").trim();
    const postalCodeRaw = (pdv.cp ?? "").trim();
    const postalCodeNormalized = this.normalizePostalCode(postalCodeRaw);
    const cityNameNormalized = this.normalizeCityName(this.cleanText(pdv.ville ?? ""));
    const services = this.normalizeServices(pdv.services);
    const horaires = pdv.horaires ?? {};

    let resolvedCityCode = cityCode;

    if (!resolvedCityCode && postalCodeNormalized) {
      resolvedCityCode = this.resolveCityByPostalAndName(
        postalCodeNormalized,
        cityNameNormalized,
        latitude.toNumber(),
        longitude.toNumber()
      );
    }

    if (!resolvedCityCode && cityNameNormalized) {
      resolvedCityCode = this.resolveCityByName(
        cityNameNormalized,
        latitude.toNumber(),
        longitude.toNumber()
      );
    }

    if (!resolvedCityCode) {
      console.warn("Fuel import: city not found", {
        stationId,
        cityCode,
        postalCode: postalCodeRaw,
        cityName: pdv.ville ?? ""
      });
    }

    const rawPrices = this.toArray(pdv.prix);
    const rawRuptures = this.toArray(pdv.rupture);

    const ruptures = new Set<FuelType>();
    for (const rupture of rawRuptures) {
      const fuelType = this.mapFuelType(rupture?.nom);
      if (fuelType) {
        ruptures.add(fuelType);
      }
    }

    await this.withRetry(async () => {
      await prisma.$transaction(async (tx) => {
        await tx.station.upsert({
          where: { id: stationId },
          update: {
            address,
            cityCode: resolvedCityCode || null,
            postalCode: postalCodeNormalized || null,
            latitude,
            longitude,
            services,
            horaires
          },
          create: {
            id: stationId,
            address,
            cityCode: resolvedCityCode || null,
            postalCode: postalCodeNormalized || null,
            latitude,
            longitude,
            services,
            horaires
          }
        });
        const seenFuelTypes = new Set<FuelType>();

        for (const price of rawPrices) {
          const fuelType = this.mapFuelType(price?.nom);
          if (!fuelType) {
            continue;
          }

          const priceValue = this.toDecimal(price?.valeur);
          const recordedAt = this.parseDate(price?.maj);

          if (!priceValue || !recordedAt) {
            continue;
          }

          seenFuelTypes.add(fuelType);

          try {
            await tx.priceHistory.create({
              data: {
                stationId,
                fuelType,
                price: priceValue,
                recordedAt
              }
            });
          } catch (error) {
            if (!this.isUniqueViolation(error)) {
              throw error;
            }
          }

          await tx.currentPrice.upsert({
            where: {
              stationId_fuelType: {
                stationId,
                fuelType
              }
            },
            update: {
              price: priceValue,
              updatedAt: recordedAt,
              isAvailable: !ruptures.has(fuelType)
            },
            create: {
              stationId,
              fuelType,
              price: priceValue,
              updatedAt: recordedAt,
              isAvailable: !ruptures.has(fuelType)
            }
          });
        }

        for (const ruptureFuel of ruptures) {
          if (seenFuelTypes.has(ruptureFuel)) {
            continue;
          }

          try {
            await tx.currentPrice.update({
              where: {
                stationId_fuelType: {
                  stationId,
                  fuelType: ruptureFuel
                }
              },
              data: { isAvailable: false }
            });
          } catch (error) {
            if (!this.isNotFound(error)) {
              throw error;
            }
          }
        }
      });
    });
  }

  private normalizeCoordinate(value?: string): Prisma.Decimal | null {
    const numeric = this.toInt(value);
    if (!numeric) {
      return null;
    }

    const normalized = numeric / 100000;
    return new Prisma.Decimal(normalized);
  }

  private mapFuelType(name?: string): FuelType | null {
    if (!name) {
      return null;
    }

    return FUEL_MAP[name] ?? null;
  }

  private parseDate(value?: string): Date | null {
    if (!value) {
      return null;
    }

    const normalized = value.includes("T") ? value : value.replace(" ", "T");
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  }

  private normalizeServices(services?: RawPdv["services"]): string[] {
    if (!services) {
      return [];
    }

    if (Array.isArray(services)) {
      return services
        .filter((service) => typeof service === "string")
        .map((service) => this.cleanText(service));
    }

    if (Array.isArray(services.service)) {
      return services.service
        .filter((service) => typeof service === "string")
        .map((service) => this.cleanText(service));
    }

    if (typeof services.service === "string") {
      return [this.cleanText(services.service)];
    }

    return [];
  }

  private toArray<T>(value?: T | T[]): T[] {
    if (!value) {
      return [];
    }

    return Array.isArray(value) ? value : [value];
  }

  private toInt(value?: string): number | null {
    if (!value) {
      return null;
    }

    const numeric = Number.parseInt(value, 10);
    return Number.isNaN(numeric) ? null : numeric;
  }

  private toDecimal(value?: string): Prisma.Decimal | null {
    if (!value) {
      return null;
    }

    const numeric = Number.parseFloat(value.replace(",", "."));
    if (Number.isNaN(numeric)) {
      return null;
    }

    return new Prisma.Decimal(numeric);
  }

  private readString(row: Record<string, unknown>, key: string): string {
    const value = row[key];
    return typeof value === "string" ? value.trim() : "";
  }

  private readDecimal(row: Record<string, unknown>, key: string): Prisma.Decimal | null {
    const value = this.readString(row, key);
    return this.toDecimal(value);
  }

  private firstPostalCode(value: string): string {
    if (!value) {
      return "";
    }

    const parts = value.split(/[,|]/).map((part) => part.trim());
    return parts.find((part) => part.length > 0) ?? "";
  }

  private collectCityNameVariants(row: Record<string, unknown>): Set<string> {
    const variants = new Set<string>();
    const fields = [
      "nom_standard",
      "nom_sans_pronom",
      "nom_sans_accent",
      "nom_standard_majuscule"
    ];

    for (const field of fields) {
      const value = this.readString(row, field);
      const normalized = this.normalizeCityName(value);
      if (normalized) {
        variants.add(normalized);
      }
    }

    return variants;
  }

  private indexCityNames(codeInsee: string, variants: Set<string>): void {
    for (const variant of variants) {
      const cityCodes = this.cityNameIndex.get(variant);
      if (cityCodes) {
        cityCodes.add(codeInsee);
      } else {
        this.cityNameIndex.set(variant, new Set([codeInsee]));
      }
    }
  }

  private indexCityLocation(
    codeInsee: string,
    latitude: number,
    longitude: number,
    variants: Set<string>
  ): void {
    this.cityLocationIndex.set(codeInsee, { lat: latitude, lng: longitude, names: variants });
  }

  private collectPostalCodes(
    codeInsee: string,
    zipCode: string,
    allPostalCodes: string
  ): string[] {
    const codes = new Set<string>();

    const pushCode = (code: string) => {
      const normalized = this.normalizePostalCode(code);
      if (normalized) {
        codes.add(normalized);
      }
    };

    if (zipCode) {
      pushCode(zipCode);
    }

    if (allPostalCodes) {
      const parts = allPostalCodes.split(/[,|]/).map((part) => part.trim());
      for (const part of parts) {
        if (part) {
          pushCode(part);
        }
      }
    }

    this.addMajorCityPostalCodes(codeInsee, pushCode);
    return Array.from(codes.values());
  }

  private addMajorCityPostalCodes(
    codeInsee: string,
    pushCode: (code: string) => void
  ): void {
    const addRange = (start: number, end: number) => {
      for (let code = start; code <= end; code += 1) {
        pushCode(code.toString().padStart(5, "0"));
      }
    };

    if (codeInsee === "75056") {
      addRange(75001, 75020);
      pushCode("75116");
    }

    if (codeInsee === "13055") {
      addRange(13001, 13016);
    }

    if (codeInsee === "69123") {
      addRange(69001, 69009);
    }
  }

  private indexPostalCode(codeInsee: string, normalizedCode: string): void {
    const cityCodes = this.postalCodeIndex.get(normalizedCode);
    if (cityCodes) {
      cityCodes.add(codeInsee);
    } else {
      this.postalCodeIndex.set(normalizedCode, new Set([codeInsee]));
    }
  }

  private resolveCityByPostalAndName(
    normalizedPostalCode: string,
    cityNameNormalized: string,
    latitude: number,
    longitude: number
  ): string {
    const candidates = this.postalCodeIndex.get(normalizedPostalCode);
    if (!candidates || candidates.size === 0) {
      return "";
    }

    if (candidates.size === 1) {
      return Array.from(candidates)[0];
    }

    if (cityNameNormalized) {
      const matches = Array.from(candidates).filter((code) => {
        const city = this.cityLocationIndex.get(code);
        return city ? city.names.has(cityNameNormalized) : false;
      });

      if (matches.length === 1) {
        return matches[0];
      }

      if (matches.length > 1) {
        return this.findClosestCity(matches, latitude, longitude);
      }
    }

    return this.findClosestCity(Array.from(candidates), latitude, longitude);
  }

  private resolveCityByName(
    cityNameNormalized: string,
    latitude: number,
    longitude: number
  ): string {
    const candidates = this.cityNameIndex.get(cityNameNormalized);
    if (!candidates || candidates.size === 0) {
      return "";
    }

    if (candidates.size === 1) {
      return Array.from(candidates)[0];
    }

    return this.findClosestCity(Array.from(candidates), latitude, longitude);
  }

  private findClosestCity(candidates: string[], latitude: number, longitude: number): string {
    let bestCityCode = candidates[0] ?? "";
    let bestScore = Number.POSITIVE_INFINITY;

    for (const code of candidates) {
      const city = this.cityLocationIndex.get(code);
      if (!city) {
        continue;
      }
      const score = (city.lat - latitude) ** 2 + (city.lng - longitude) ** 2;
      if (score < bestScore) {
        bestScore = score;
        bestCityCode = code;
      }
    }

    return bestCityCode;
  }

  private normalizePostalCode(value: string): string {
    if (!value) {
      return "";
    }

    const digits = value.replace(/\D/g, "");
    if (digits.length < 5) {
      return "";
    }

    return digits.slice(0, 5);
  }

  private normalizeCityName(value: string): string {
    if (!value) {
      return "";
    }

    const normalized = value
      .normalize("NFD")
      .replace(/\p{Diacritic}+/gu, "")
      .toUpperCase();

    return normalized.replace(/[^A-Z0-9]+/g, " ").trim();
  }

  private cleanText(value: string): string {
    if (!value) {
      return value;
    }

    const normalized = value.normalize("NFC");
    if (!normalized.includes("Ã") && !normalized.includes("Â")) {
      return normalized;
    }

    try {
      return iconv.decode(iconv.encode(normalized, "latin1"), "utf8");
    } catch {
      return normalized;
    }
  }

  private async withRetry<T>(operation: () => Promise<T>, attempts = 2): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt === attempts || !this.isRetryable(error)) {
          throw error;
        }
      }
    }

    throw lastError;
  }

  private isRetryable(error: unknown): boolean {
    if (error instanceof Error && error.message.includes("SocketTimeout")) {
      return true;
    }

    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "SQLITE_ERROR"
    );
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    );
  }

  private isNotFound(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    );
  }
}
