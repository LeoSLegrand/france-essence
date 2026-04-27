import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

type AuthLocals = {
  userId: number;
  email?: string;
};

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }

  return secret;
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.header("authorization");
  if (!header) {
    return res.status(401).json({
      error: "unauthorized",
      message: "Authentication required"
    });
  }

  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      error: "unauthorized",
      message: "Invalid authorization header"
    });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (typeof decoded === "string") {
      return res.status(401).json({
        error: "unauthorized",
        message: "Invalid token payload"
      });
    }

    const payload = decoded as JwtPayload;
    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        error: "unauthorized",
        message: "Invalid token payload"
      });
    }

    const authLocals: AuthLocals = {
      userId,
      email: typeof payload.email === "string" ? payload.email : undefined
    };
    res.locals.auth = authLocals;

    return next();
  } catch {
    return res.status(401).json({
      error: "unauthorized",
      message: "Invalid or expired token"
    });
  }
};

export const getAuthUserId = (res: Response) => {
  const auth = res.locals.auth as AuthLocals | undefined;
  if (!auth?.userId) {
    return null;
  }

  return auth.userId;
};
