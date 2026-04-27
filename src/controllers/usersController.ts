import { Request, Response } from "express";

import { AppDependencies, DateRangeQuery } from "../config/dependencies";
import { getAuthUserId } from "../middlewares/auth";
import UserService from "../services/UserService";

type UsersControllerDependencies = Pick<AppDependencies, "userService"> & {
  getAuthUserId: (res: Response) => number | null;
};

export const createUsersController = ({ userService, getAuthUserId }: UsersControllerDependencies) => {
  const getMyProfile = async (_req: Request, res: Response) => {
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

  const getMyStats = async (req: Request, res: Response) => {
    const userId = getAuthUserId(res);
    if (!userId) {
      return res.status(401).json({ error: "unauthorized", message: "Authentication required" });
    }

    const query = (res.locals.query ?? req.query) as DateRangeQuery;
    const stats = await userService.getStats(userId, {
      dateFrom: query.dateFrom,
      dateTo: query.dateTo
    });

    return res.status(200).json({ data: stats });
  };

  return {
    getMyProfile,
    getMyStats
  };
};

const defaultController = createUsersController({
  userService: new UserService(),
  getAuthUserId
});

export const getMyProfile = defaultController.getMyProfile;
export const getMyStats = defaultController.getMyStats;
