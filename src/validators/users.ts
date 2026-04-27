import { z } from "zod";

export const userStatsQuerySchema = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional()
}).superRefine((value, ctx) => {
  if (value.dateFrom && value.dateTo && value.dateFrom > value.dateTo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["dateFrom"],
      message: "dateFrom must be before or equal to dateTo"
    });
  }
});
