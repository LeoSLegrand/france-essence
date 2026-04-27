import { Router } from "express";

import { AppDependencies, appDependencies } from "../config/dependencies";
import { createCitiesController } from "../controllers/citiesController";
import { validateQuery } from "../middlewares/validate";
import { citySearchQuerySchema } from "../validators/stations";

type CitiesRouteDependencies = Pick<AppDependencies, "stationService">;

export const createCitiesRouter = (dependencies: CitiesRouteDependencies) => {
	const router = Router();
	const { searchCities } = createCitiesController({ stationService: dependencies.stationService });

	router.get("/search", validateQuery(citySearchQuerySchema), searchCities);

	return router;
};

export default createCitiesRouter({ stationService: appDependencies.stationService });
