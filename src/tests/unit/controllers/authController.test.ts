import { describe, expect, it, vi } from "vitest";

import { createAuthController } from "../../../controllers/authController";
import { createMockRequest, createMockResponse } from "../../helpers/httpMocks";

describe("authController", () => {
  it("returns 201 on signup success", async () => {
    const authService = {
      signup: vi.fn().mockResolvedValue({ user: { id: 1, email: "john@example.com" }, token: "jwt" }),
      login: vi.fn()
    };
    const { signup } = createAuthController({ authService });

    const req = createMockRequest({ body: { email: "john@example.com", password: "Password123" } });
    const res = createMockResponse();

    await signup(req, res);

    expect(authService.signup).toHaveBeenCalledWith("john@example.com", "Password123");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      data: { user: { id: 1, email: "john@example.com" }, token: "jwt" }
    });
  });

  it("returns 409 on signup conflict", async () => {
    const authService = {
      signup: vi.fn().mockResolvedValue(null),
      login: vi.fn()
    };
    const { signup } = createAuthController({ authService });

    const req = createMockRequest({ body: { email: "existing@example.com", password: "Password123" } });
    const res = createMockResponse();

    await signup(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: "conflict",
      message: "Email already in use"
    });
  });

  it("returns 401 on login failure", async () => {
    const authService = {
      signup: vi.fn(),
      login: vi.fn().mockResolvedValue(null)
    };
    const { login } = createAuthController({ authService });

    const req = createMockRequest({ body: { email: "john@example.com", password: "bad" } });
    const res = createMockResponse();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "unauthorized",
      message: "Invalid email or password"
    });
  });
});
