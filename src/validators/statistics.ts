import { z } from "zod";

import { FuelType } from "../../prisma/generated/prisma/client";

const levelEnum = z.enum(["national", "department"]);

export const publicPriceStatisticsQuerySchema = z
  .object({
    level: levelEnum,
    departmentCode: z
      .string()
      .trim()
      .regex(/^\d{2}$/)
      .optional(),
    fuelType: z.nativeEnum(FuelType).optional(),
    dateFrom: z.coerce.date(),
    dateTo: z.coerce.date()
  })
  .superRefine((value, ctx) => {
    if (value.level === "department" && !value.departmentCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "departmentCode is required when level=department",
        path: ["departmentCode"]
      });
    }

    if (value.dateFrom > value.dateTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "dateFrom must be before or equal to dateTo",
        path: ["dateFrom"]
      });
    }
  });
