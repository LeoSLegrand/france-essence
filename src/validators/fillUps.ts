import { z } from "zod";

import { FuelType } from "../../prisma/generated/prisma/client";

export const createFillUpBodySchema = z.object({
  stationId: z.coerce.number().int().positive(),
  fuelType: z.nativeEnum(FuelType),
  kilometers: z.coerce.number().int().nonnegative(),
  liters: z.coerce.number().positive(),
  totalPrice: z.coerce.number().positive().optional(),
  date: z.coerce.date().optional()
});

export const fillUpsListQuerySchema = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  limit: z.coerce.number().int().positive().max(500).optional()
}).superRefine((value, ctx) => {
  if (value.dateFrom && value.dateTo && value.dateFrom > value.dateTo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["dateFrom"],
      message: "dateFrom must be before or equal to dateTo"
    });
  }
});
