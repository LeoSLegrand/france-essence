import { Router } from "express";

import { getStationById, getStationsByRadius } from "../controllers/stationsController";
import { validateParams, validateQuery } from "../middlewares/validate";
import { stationIdParamSchema, stationRadiusQuerySchema } from "../validators/stations";

const router = Router();

router.get("/:id", validateParams(stationIdParamSchema), getStationById);
router.get("/", validateQuery(stationRadiusQuerySchema), getStationsByRadius);

export default router;
