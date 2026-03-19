import { Request, Response } from "express";

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
