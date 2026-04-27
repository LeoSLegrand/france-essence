import { Router } from "express";

import { AppDependencies, appDependencies } from "../config/dependencies";
import { createAuthController } from "../controllers/authController";
import { validateBody } from "../middlewares/validate";
import { loginSchema, signupSchema } from "../validators/auth";

type AuthRouteDependencies = Pick<AppDependencies, "authService">;

export const createAuthRouter = (dependencies: AuthRouteDependencies) => {
	const router = Router();
	const { login, signup } = createAuthController(dependencies);

	router.post("/signup", validateBody(signupSchema), signup);
	router.post("/login", validateBody(loginSchema), login);

	return router;
};

export default createAuthRouter({ authService: appDependencies.authService });
