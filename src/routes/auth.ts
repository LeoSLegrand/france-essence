import { Router } from "express";

import { login, signup } from "../controllers/authController";
import { validateBody } from "../middlewares/validate";
import { loginSchema, signupSchema } from "../validators/auth";

const router = Router();

router.post("/signup", validateBody(signupSchema), signup);
router.post("/login", validateBody(loginSchema), login);

export default router;
