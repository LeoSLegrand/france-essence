import { Router } from "express";

import {
	getStationById,
	getStationPriceHistory,
	getStationsByRadius
} from "../controllers/stationsController";
import { validateParams, validateQuery } from "../middlewares/validate";
import {
	stationIdParamSchema,
	stationPriceHistoryQuerySchema,
	stationRadiusQuerySchema
} from "../validators/stations";

const router = Router();

router.get("/:id", validateParams(stationIdParamSchema), getStationById);
router.get(
	"/:id/prices/history",
	validateParams(stationIdParamSchema),
	validateQuery(stationPriceHistoryQuerySchema),
	getStationPriceHistory
);
router.get("/", validateQuery(stationRadiusQuerySchema), getStationsByRadius);

export default router;
