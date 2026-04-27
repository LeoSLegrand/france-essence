import { FuelType } from "../../prisma/generated/prisma/client";
import { AppDependencies } from "../config/dependencies";
import { GraphQLContext } from "./context";

type SeriesInterval = "HOUR" | "DAY" | "WEEK";

type StationPriceSeriesArgs = {
  stationId: number;
  fuelType?: FuelType;
  dateFrom: string;
  dateTo: string;
  interval?: SeriesInterval;
};

type UserFuelSpendSeriesArgs = {
  dateFrom: string;
  dateTo: string;
  interval?: SeriesInterval;
};

type PriceHistoryEntry = {
  fuelType: FuelType;
  price: number;
  recordedAt: Date;
};

type StationPricePoint = {
  timestamp: string;
  fuelType: FuelType;
  price: number;
  samples: number;
};

type RootDependencies = Pick<AppDependencies, "stationService" | "userService">;

const parseDate = (value: string, fieldName: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${fieldName} must be a valid ISO date`);
  }

  return parsed;
};

const assertDateRange = (dateFrom: Date, dateTo: Date) => {
  if (dateFrom > dateTo) {
    throw new Error("dateFrom must be before or equal to dateTo");
  }
};

const toIntervalStart = (date: Date, interval: SeriesInterval) => {
  const normalized = new Date(date);

  if (interval === "HOUR") {
    normalized.setUTCMinutes(0, 0, 0);
    return normalized;
  }

  if (interval === "DAY") {
    normalized.setUTCHours(0, 0, 0, 0);
    return normalized;
  }

  normalized.setUTCHours(0, 0, 0, 0);
  const day = normalized.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  normalized.setUTCDate(normalized.getUTCDate() - diffToMonday);
  return normalized;
};

const round = (value: number, decimals = 3) => Number(value.toFixed(decimals));

const aggregatePricePoints = (entries: PriceHistoryEntry[], interval: SeriesInterval) => {
  const buckets = new Map<string, {
    timestamp: Date;
    fuelType: FuelType;
    totalPrice: number;
    samples: number;
  }>();

  for (const entry of entries) {
    const timestamp = toIntervalStart(new Date(entry.recordedAt), interval);
    const key = `${timestamp.toISOString()}|${entry.fuelType}`;

    const current = buckets.get(key) ?? {
      timestamp,
      fuelType: entry.fuelType,
      totalPrice: 0,
      samples: 0
    };

    current.totalPrice += Number(entry.price);
    current.samples += 1;
    buckets.set(key, current);
  }

  return [...buckets.values()]
    .sort((a, b) => {
      const dateDiff = a.timestamp.getTime() - b.timestamp.getTime();
      if (dateDiff !== 0) {
        return dateDiff;
      }

      return a.fuelType.localeCompare(b.fuelType);
    })
    .map<StationPricePoint>((entry) => ({
      timestamp: entry.timestamp.toISOString(),
      fuelType: entry.fuelType,
      price: round(entry.totalPrice / entry.samples),
      samples: entry.samples
    }));
};

export const createGraphQLRoot = (dependencies: RootDependencies) => ({
  stationPriceSeries: async (args: StationPriceSeriesArgs) => {
    const dateFrom = parseDate(args.dateFrom, "dateFrom");
    const dateTo = parseDate(args.dateTo, "dateTo");
    assertDateRange(dateFrom, dateTo);

    const stationHistory = await dependencies.stationService.getStationPriceHistory({
      stationId: args.stationId,
      fuelType: args.fuelType,
      dateFrom,
      dateTo
    }) as Record<string, PriceHistoryEntry[]>;

    const entries = Object.values(stationHistory).flat();
    const interval = args.interval ?? "DAY";

    return aggregatePricePoints(entries, interval);
  },

  userFuelSpendSeries: async (args: UserFuelSpendSeriesArgs, context: GraphQLContext) => {
    if (!context?.userId) {
      throw new Error("Unauthorized");
    }

    const dateFrom = parseDate(args.dateFrom, "dateFrom");
    const dateTo = parseDate(args.dateTo, "dateTo");
    assertDateRange(dateFrom, dateTo);

    const series = await dependencies.userService.getFuelSpendSeries(context.userId, {
      dateFrom,
      dateTo,
      interval: args.interval ?? "DAY"
    }) as Array<{
      timestamp: Date;
      fuelType: FuelType;
      totalSpend: number;
      totalLiters: number;
      fillUps: number;
      averagePricePerLiter: number | null;
    }>;

    return series.map((entry) => ({
      ...entry,
      timestamp: new Date(entry.timestamp).toISOString()
    }));
  }
});
