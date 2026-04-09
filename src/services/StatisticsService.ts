import { Prisma, FuelType } from "../../prisma/generated/prisma/client";
import prisma from "../config/prisma";

type StatisticsLevel = "national" | "department";

type PriceStatisticsParams = {
  level: StatisticsLevel;
  departmentCode?: string;
  fuelType?: FuelType;
  dateFrom: Date;
  dateTo: Date;
};

type AggregatedRow = {
  fuelType: FuelType;
  averagePrice: number;
  samples: number;
};

export default class StatisticsService {
  async getPublicPriceStatistics(params: PriceStatisticsParams) {
    const { level, departmentCode, fuelType, dateFrom, dateTo } = params;

    const conditions: Prisma.Sql[] = [
      Prisma.sql`ph.recorded_at >= ${dateFrom}`,
      Prisma.sql`ph.recorded_at <= ${dateTo}`
    ];

    if (fuelType) {
      conditions.push(Prisma.sql`ph.fuel_type = ${fuelType}`);
    }

    if (level === "department" && departmentCode) {
      conditions.push(Prisma.sql`s.postal_code LIKE ${`${departmentCode}%`}`);
    }

    const rows = await prisma.$queryRaw<Array<{ fuelType: FuelType; averagePrice: number; samples: number }>>(
      Prisma.sql`
        SELECT
          ph.fuel_type as fuelType,
          AVG(CAST(ph.price AS REAL)) as averagePrice,
          COUNT(*) as samples
        FROM price_history ph
        JOIN stations s ON s.id = ph.station_id
        WHERE ${Prisma.join(conditions, " AND ")}
        GROUP BY ph.fuel_type
        ORDER BY ph.fuel_type ASC
      `
    );

    const averages: AggregatedRow[] = rows.map((row) => ({
      fuelType: row.fuelType,
      averagePrice: Number(Number(row.averagePrice).toFixed(3)),
      samples: Number(row.samples)
    }));

    return {
      level,
      departmentCode: level === "department" ? departmentCode : undefined,
      fuelType: fuelType ?? null,
      dateFrom,
      dateTo,
      averages
    };
  }
}
