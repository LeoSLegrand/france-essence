import { Router } from "express";

import {
  createVehicleFillUp,
  getVehicleFillUps
} from "../controllers/fillUpsController";
import {
  createVehicle,
  deleteVehicle,
  getMyVehicles,
  getVehicleById,
  updateVehicle
} from "../controllers/vehiclesController";
import { requireAuth } from "../middlewares/auth";
import { validateBody, validateParams, validateQuery } from "../middlewares/validate";
import { createFillUpBodySchema, fillUpsListQuerySchema } from "../validators/fillUps";
import {
  createVehicleBodySchema,
  updateVehicleBodySchema,
  vehicleFillUpsParamsSchema,
  vehicleIdParamSchema
} from "../validators/vehicles";

const router = Router();

router.use(requireAuth);

router.get("/", getMyVehicles);
router.post("/", validateBody(createVehicleBodySchema), createVehicle);

router.get(
  "/:vehicleId/fill-ups",
  validateParams(vehicleFillUpsParamsSchema),
  validateQuery(fillUpsListQuerySchema),
  getVehicleFillUps
);
router.post(
  "/:vehicleId/fill-ups",
  validateParams(vehicleFillUpsParamsSchema),
  validateBody(createFillUpBodySchema),
  createVehicleFillUp
);

router.get("/:id", validateParams(vehicleIdParamSchema), getVehicleById);
router.patch("/:id", validateParams(vehicleIdParamSchema), validateBody(updateVehicleBodySchema), updateVehicle);
router.delete("/:id", validateParams(vehicleIdParamSchema), deleteVehicle);

export default router;
