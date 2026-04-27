import { Router } from "express";

import { AppDependencies, appDependencies } from "../config/dependencies";
import { createUsersController } from "../controllers/usersController";
import { getAuthUserId, requireAuth } from "../middlewares/auth";
import { validateQuery } from "../middlewares/validate";
import { userStatsQuerySchema } from "../validators/users";

type UsersRouteDependencies = Pick<AppDependencies, "userService">;

export const createUsersRouter = (dependencies: UsersRouteDependencies) => {
	const router = Router();
	const { getMyProfile, getMyStats } = createUsersController({
		userService: dependencies.userService,
		getAuthUserId
	});

	router.use(requireAuth);

	router.get("/me", getMyProfile);
	router.get("/me/stats", validateQuery(userStatsQuerySchema), getMyStats);

	return router;
};

export default createUsersRouter({ userService: appDependencies.userService });
