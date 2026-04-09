import { Request, Response } from "express";

import { FuelType } from "../../prisma/generated/prisma/client";
import StatisticsService from "../services/StatisticsService";

const statisticsService = new StatisticsService();

type StatisticsQuery = {
  level: "national" | "department";
  departmentCode?: string;
  fuelType?: FuelType;
  dateFrom: Date;
  dateTo: Date;
};

export const getPublicPriceStatistics = async (req: Request, res: Response) => {
  const query = (res.locals.query ?? req.query) as StatisticsQuery;

  const data = await statisticsService.getPublicPriceStatistics({
    level: query.level,
    departmentCode: query.departmentCode,
    fuelType: query.fuelType,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo
  });

  return res.status(200).json({ data });
};
