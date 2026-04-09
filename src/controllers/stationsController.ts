import { Request, Response } from "express";

import { FuelType } from "../../prisma/generated/prisma/client";

import StationService from "../services/StationService";

const stationService = new StationService();

export const getStationById = async (req: Request, res: Response) => {
  const stationId = Number(req.params.id);
  const station = await stationService.getStationById(stationId);

  if (!station) {
    return res.status(404).json({ error: "not_found", message: "Station not found" });
  }

  return res.status(200).json({ data: station });
};

export const getStationsByRadius = async (req: Request, res: Response) => {
  const query = (res.locals.query ?? req.query) as typeof req.query;
  const lat = Number(query.lat);
  const lng = Number(query.lng);
  const radius = Number(query.radius);
  const limit = query.limit ? Number(query.limit) : 100;

  const stations = await stationService.getStationsByRadius({ lat, lng, radius, limit });
  return res.status(200).json({ data: stations });
};

export const getStationPriceHistory = async (req: Request, res: Response) => {
  const stationId = Number(req.params.id);
  const query = (res.locals.query ?? req.query) as {
    fuelType?: FuelType;
    dateFrom?: Date;
    dateTo?: Date;
  };

  const exists = await stationService.stationExists(stationId);
  if (!exists) {
    return res.status(404).json({ error: "not_found", message: "Station not found" });
  }

  const now = new Date();
  const defaultFrom = new Date(now);
  defaultFrom.setDate(defaultFrom.getDate() - 7);

  const dateFrom = query.dateFrom ?? defaultFrom;
  const dateTo = query.dateTo ?? now;

  const historyByFuel = await stationService.getStationPriceHistory({
    stationId,
    fuelType: query.fuelType,
    dateFrom,
    dateTo
  });

  return res.status(200).json({
    data: {
      stationId,
      dateFrom,
      dateTo,
      historyByFuel
    }
  });
};
