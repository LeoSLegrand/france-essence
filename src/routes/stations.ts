import { Router } from "express";

import { getStationById } from "../controllers/stationsController";
import { validateParams } from "../middlewares/validate";
import { stationIdParamSchema } from "../validators/stations";

const router = Router();

router.get("/:id", validateParams(stationIdParamSchema), getStationById);

export default router;
