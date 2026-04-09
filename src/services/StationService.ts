import prisma from "../config/prisma";

import { FuelType } from "../../prisma/generated/prisma/client";

export default class StationService {
  async searchCities(query: string, limit = 10) {
    const trimmed = query.trim();
    const normalizedLimit = Math.min(Math.max(limit, 1), 20);
    const startsWith = `${trimmed}%`;
    const contains = `%${trimmed}%`;

    const cities = await prisma.$queryRaw<Array<{
      codeInsee: string;
      name: string;
      zipCode: string;
      latitude: number;
      longitude: number;
    }>>`
      SELECT
        c.code_insee as codeInsee,
        c.name as name,
        c.zip_code as zipCode,
        CAST(c.latitude AS REAL) as latitude,
        CAST(c.longitude AS REAL) as longitude
      FROM cities c
      WHERE c.name LIKE ${contains} COLLATE NOCASE
      ORDER BY
        CASE WHEN c.name LIKE ${startsWith} COLLATE NOCASE THEN 0 ELSE 1 END,
        LENGTH(c.name) ASC,
        c.name ASC
      LIMIT ${normalizedLimit}
    `;

    return cities;
  }

  async stationExists(id: number) {
    const station = await prisma.station.findUnique({
      where: { id },
      select: { id: true }
    });

    return Boolean(station);
  }

  async getStationById(id: number) {
    return prisma.station.findUnique({
      where: { id },
      include: {
        city: true,
        currentPrices: true
      }
    });
  }

  async getStationPriceHistory(params: {
    stationId: number;
    fuelType?: FuelType;
    dateFrom: Date;
    dateTo: Date;
  }) {
    const { stationId, fuelType, dateFrom, dateTo } = params;

    const entries = await prisma.priceHistory.findMany({
      where: {
        stationId,
        fuelType,
        recordedAt: {
          gte: dateFrom,
          lte: dateTo
        }
      },
      orderBy: {
        recordedAt: "desc"
      }
    });

    return entries.reduce<Record<FuelType, typeof entries>>((acc, entry) => {
      if (!acc[entry.fuelType]) {
        acc[entry.fuelType] = [];
      }
      acc[entry.fuelType].push(entry);
      return acc;
    }, {} as Record<FuelType, typeof entries>);
  }

  async getStationsByRadius(params: { lat: number; lng: number; radius: number; limit: number }) {
    const { lat, lng, radius, limit } = params;
    const radiusKm = radius;

    const latDelta = radiusKm / 111.32;
    const lngDelta = radiusKm / (111.32 * Math.cos(this.degToRad(lat)));

    const minLat = lat - latDelta;
    const maxLat = lat + latDelta;
    const minLng = lng - lngDelta;
    const maxLng = lng + lngDelta;

    const candidates = await prisma.station.findMany({
      where: {
        latitude: { gte: minLat, lte: maxLat },
        longitude: { gte: minLng, lte: maxLng }
      },
      select: {
        id: true,
        address: true,
        cityCode: true,
        postalCode: true,
        latitude: true,
        longitude: true,
        services: true,
        horaires: true,
        city: true,
        currentPrices: true
      }
    });

    return candidates
      .map((station) => {
        const distance = this.haversineKm(
          lat,
          lng,
          station.latitude.toNumber(),
          station.longitude.toNumber()
        );
        return { ...station, distance };
      })
        .filter((station) => station.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit);
  }

  private degToRad(deg: number) {
    return (deg * Math.PI) / 180;
  }

  private haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
    const dLat = this.degToRad(lat2 - lat1);
    const dLng = this.degToRad(lng2 - lng1);
    const radLat1 = this.degToRad(lat1);
    const radLat2 = this.degToRad(lat2);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return 6371 * c;
  }
}
