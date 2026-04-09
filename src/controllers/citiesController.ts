import { Request, Response } from "express";

import StationService from "../services/StationService";

const stationService = new StationService();

export const searchCities = async (req: Request, res: Response) => {
  const query = (res.locals.query ?? req.query) as { q: string; limit?: number };
  const cities = await stationService.searchCities(query.q, query.limit ?? 10);
  return res.status(200).json({ data: cities });
};
