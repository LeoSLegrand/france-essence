import { Router } from "express";

import { searchCities } from "../controllers/citiesController";
import { validateQuery } from "../middlewares/validate";
import { citySearchQuerySchema } from "../validators/stations";

const router = Router();

router.get("/search", validateQuery(citySearchQuerySchema), searchCities);

export default router;
