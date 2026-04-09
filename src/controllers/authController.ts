import { Request, Response } from "express";

import AuthService from "../services/AuthService";

const authService = new AuthService();

export const signup = async (req: Request, res: Response) => {
  const body = (res.locals.body ?? req.body) as { email: string; password: string };

  const result = await authService.signup(body.email, body.password);
  if (!result) {
    return res.status(409).json({
      error: "conflict",
      message: "Email already in use"
    });
  }

  return res.status(201).json({ data: result });
};

export const login = async (req: Request, res: Response) => {
  const body = (res.locals.body ?? req.body) as { email: string; password: string };

  const result = await authService.login(body.email, body.password);
  if (!result) {
    return res.status(401).json({
      error: "unauthorized",
      message: "Invalid email or password"
    });
  }

  return res.status(200).json({ data: result });
};
