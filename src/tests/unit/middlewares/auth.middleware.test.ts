import { NextFunction, Request } from "express";
import jwt from "jsonwebtoken";
import { describe, expect, it, vi } from "vitest";

import { createRequireAuth, getAuthUserId } from "../../../middlewares/auth";
import { createMockResponse } from "../../helpers/httpMocks";

describe("auth middleware", () => {
  const secret = "unit-test-secret";

  it("returns 401 when header is missing", () => {
    const requireAuth = createRequireAuth(secret);
    const req = { header: vi.fn().mockReturnValue(undefined) } as unknown as Request;
    const res = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when token is invalid", () => {
    const requireAuth = createRequireAuth(secret);
    const req = { header: vi.fn().mockReturnValue("Bearer bad-token") } as unknown as Request;
    const res = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("stores auth locals and calls next on valid token", () => {
    const token = jwt.sign({ sub: 12, email: "john@example.com" }, secret, { expiresIn: "1h" });
    const requireAuth = createRequireAuth(secret);

    const req = { header: vi.fn().mockReturnValue(`Bearer ${token}`) } as unknown as Request;
    const res = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(getAuthUserId(res)).toBe(12);
  });
});
