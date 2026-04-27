import { z } from "zod";

import { FuelType } from "../../prisma/generated/prisma/client";

export const vehicleIdParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

export const vehicleFillUpsParamsSchema = z.object({
  vehicleId: z.coerce.number().int().positive()
});

export const createVehicleBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  preferredFuel: z.nativeEnum(FuelType)
});

export const updateVehicleBodySchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  preferredFuel: z.nativeEnum(FuelType).optional()
}).refine((value) => value.name !== undefined || value.preferredFuel !== undefined, {
  message: "At least one field must be provided"
});
