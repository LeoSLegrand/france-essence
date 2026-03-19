import { z } from "zod";

export const stationIdParamSchema = z.object({
  id: z.coerce.number().int().positive()
});
