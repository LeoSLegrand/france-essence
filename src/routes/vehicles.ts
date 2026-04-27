import { Router } from "express";

import { AppDependencies, appDependencies } from "../config/dependencies";
import { createFillUpsController } from "../controllers/fillUpsController";
import { createVehiclesController } from "../controllers/vehiclesController";
import { getAuthUserId, requireAuth } from "../middlewares/auth";
import { validateBody, validateParams, validateQuery } from "../middlewares/validate";
import { createFillUpBodySchema, fillUpsListQuerySchema } from "../validators/fillUps";
import {
  createVehicleBodySchema,
  updateVehicleBodySchema,
  vehicleFillUpsParamsSchema,
  vehicleIdParamSchema
} from "../validators/vehicles";

type VehiclesRouteDependencies = Pick<AppDependencies, "vehicleService" | "fillUpService">;

export const createVehiclesRouter = (dependencies: VehiclesRouteDependencies) => {
  const router = Router();
  const {
    createVehicle,
    deleteVehicle,
    getMyVehicles,
    getVehicleById,
    updateVehicle
  } = createVehiclesController({
    vehicleService: dependencies.vehicleService,
    getAuthUserId
  });
  const { createVehicleFillUp, getVehicleFillUps } = createFillUpsController({
    fillUpService: dependencies.fillUpService,
    getAuthUserId
  });

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

  return router;
};
export default createVehiclesRouter({
  vehicleService: appDependencies.vehicleService,
  fillUpService: appDependencies.fillUpService
});
