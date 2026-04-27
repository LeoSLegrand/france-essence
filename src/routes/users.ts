import { Router } from "express";

import { getMyProfile, getMyStats } from "../controllers/usersController";
import { requireAuth } from "../middlewares/auth";
import { validateQuery } from "../middlewares/validate";
import { userStatsQuerySchema } from "../validators/users";

const router = Router();

router.use(requireAuth);

router.get("/me", getMyProfile);
router.get("/me/stats", validateQuery(userStatsQuerySchema), getMyStats);

export default router;
