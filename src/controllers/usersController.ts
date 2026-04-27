import { Request, Response } from "express";

import { getAuthUserId } from "../middlewares/auth";
import UserService from "../services/UserService";

const userService = new UserService();

export const getMyProfile = async (_req: Request, res: Response) => {
  const userId = getAuthUserId(res);
  if (!userId) {
    return res.status(401).json({ error: "unauthorized", message: "Authentication required" });
  }

  const profile = await userService.getProfile(userId);
  if (!profile) {
    return res.status(404).json({ error: "not_found", message: "User not found" });
  }

  return res.status(200).json({ data: profile });
};

export const getMyStats = async (req: Request, res: Response) => {
  const userId = getAuthUserId(res);
  if (!userId) {
    return res.status(401).json({ error: "unauthorized", message: "Authentication required" });
  }

  const query = (res.locals.query ?? req.query) as { dateFrom?: Date; dateTo?: Date };
  const stats = await userService.getStats(userId, {
    dateFrom: query.dateFrom,
    dateTo: query.dateTo
  });

  return res.status(200).json({ data: stats });
};
