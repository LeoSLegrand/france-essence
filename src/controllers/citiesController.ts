import { Request, Response } from "express";

import { AppDependencies } from "../config/dependencies";

type CitiesControllerDependencies = Pick<AppDependencies, "stationService">;

export const createCitiesController = ({ stationService }: CitiesControllerDependencies) => {
  const searchCities = async (req: Request, res: Response) => {
    const query = (res.locals.query ?? req.query) as { q: string; limit?: number };
    const cities = await stationService.searchCities(query.q, query.limit ?? 10);
    return res.status(200).json({ data: cities });
  };

  return {
    searchCities
  };
};
