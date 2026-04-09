import { z } from "zod";

import { FuelType } from "../../prisma/generated/prisma/client";

export const stationIdParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

export const stationRadiusQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().positive().max(200),
  limit: z.coerce.number().int().positive().max(500).optional()
});

export const stationPriceHistoryQuerySchema = z.object({
  fuelType: z.nativeEnum(FuelType).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional()
});
