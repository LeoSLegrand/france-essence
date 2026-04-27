import { Router } from "express";

import { AppDependencies, appDependencies } from "../config/dependencies";
import { createStatisticsController } from "../controllers/statisticsController";
import { validateQuery } from "../middlewares/validate";
import { publicPriceStatisticsQuerySchema } from "../validators/statistics";

type StatisticsRouteDependencies = Pick<AppDependencies, "statisticsService">;

export const createStatisticsRouter = (dependencies: StatisticsRouteDependencies) => {
	const router = Router();
	const { getPublicPriceStatistics } = createStatisticsController({
		statisticsService: dependencies.statisticsService
	});

	router.get("/prices", validateQuery(publicPriceStatisticsQuerySchema), getPublicPriceStatistics);

	return router;
};

export default createStatisticsRouter({ statisticsService: appDependencies.statisticsService });
