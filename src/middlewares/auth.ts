import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export type AuthLocals = {
  userId: number;
  email?: string;
};

export const resolveJwtSecretFromEnv = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }

  return secret;
};

export const tryExtractAuthLocalsFromAuthorizationHeader = (
  header: string | undefined,
  jwtSecret: string
): AuthLocals | null => {
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    if (typeof decoded === "string") {
      return null;
    }

    const payload = decoded as JwtPayload;
    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      return null;
    }

    return {
      userId,
      email: typeof payload.email === "string" ? payload.email : undefined
    };
  } catch {
    return null;
  }
};

export const createRequireAuth = (jwtSecret: string) =>
  (req: Request, res: Response, next: NextFunction) => {
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

    const authLocals = tryExtractAuthLocalsFromAuthorizationHeader(header, jwtSecret);
    if (!authLocals) {
      return res.status(401).json({
        error: "unauthorized",
        message: "Invalid or expired token"
      });
    }

    const payload = jwt.decode(token) as JwtPayload | null;
    const payloadUserId = Number(payload?.sub);
    if (!Number.isInteger(payloadUserId) || payloadUserId <= 0) {
      return res.status(401).json({
        error: "unauthorized",
        message: "Invalid token payload"
      });
    }

    try {
      res.locals.auth = authLocals;

      return next();
    } catch {
      return res.status(401).json({
        error: "unauthorized",
        message: "Invalid or expired token"
      });
    }
  };

export const requireAuth = createRequireAuth(resolveJwtSecretFromEnv());

export const getAuthUserId = (res: Response) => {
  const auth = res.locals.auth as AuthLocals | undefined;
  if (!auth?.userId) {
    return null;
  }

  return auth.userId;
};
