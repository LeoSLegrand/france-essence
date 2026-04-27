import { Router } from "express";

import { AppDependencies, appDependencies } from "../config/dependencies";
import { createStationsController } from "../controllers/stationsController";
import { validateParams, validateQuery } from "../middlewares/validate";
import {
	stationIdParamSchema,
	stationPriceHistoryQuerySchema,
	stationRadiusQuerySchema
} from "../validators/stations";

type StationsRouteDependencies = Pick<AppDependencies, "stationService">;

export const createStationsRouter = (dependencies: StationsRouteDependencies) => {
	const router = Router();
	const {
		getStationById,
		getStationPriceHistory,
		getStationsByRadius
	} = createStationsController({ stationService: dependencies.stationService });

	router.get("/:id", validateParams(stationIdParamSchema), getStationById);
	router.get(
		"/:id/prices/history",
		validateParams(stationIdParamSchema),
		validateQuery(stationPriceHistoryQuerySchema),
		getStationPriceHistory
	);
	router.get("/", validateQuery(stationRadiusQuerySchema), getStationsByRadius);

	return router;
};

export default createStationsRouter({ stationService: appDependencies.stationService });
