import { Router } from "express";

import { getPublicPriceStatistics } from "../controllers/statisticsController";
import { validateQuery } from "../middlewares/validate";
import { publicPriceStatisticsQuerySchema } from "../validators/statistics";

const router = Router();

router.get("/prices", validateQuery(publicPriceStatisticsQuerySchema), getPublicPriceStatistics);

export default router;
