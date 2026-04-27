import { Request } from "express";
import { z } from "zod";
import { describe, expect, it, vi } from "vitest";

import { validateBody, validateParams, validateQuery } from "../../../middlewares/validate";
import { createMockResponse } from "../../helpers/httpMocks";

describe("validate middleware", () => {
  it("validateBody sets parsed body and calls next", () => {
    const middleware = validateBody(z.object({ email: z.string().email() }));
    const req = { body: { email: "john@example.com" } } as Request;
    const res = createMockResponse();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.locals.body).toEqual({ email: "john@example.com" });
  });

  it("validateQuery returns 400 on invalid query", () => {
    const middleware = validateQuery(z.object({ limit: z.coerce.number().int().positive() }));
    const req = { query: { limit: "0" } } as unknown as Request;
    const res = createMockResponse();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("validateParams mutates req.params when valid", () => {
    const middleware = validateParams(z.object({ id: z.coerce.number().int().positive() }));
    const req = { params: { id: "5" } } as unknown as Request;
    const res = createMockResponse();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.params).toEqual({ id: 5 });
  });
});
