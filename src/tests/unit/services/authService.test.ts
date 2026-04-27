import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, bcryptMock, jwtMock } = vi.hoisted(() => ({
  prismaMock: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn()
    }
  },
  bcryptMock: {
    hash: vi.fn(),
    compare: vi.fn()
  },
  jwtMock: {
    sign: vi.fn()
  }
}));

vi.mock("../../../config/prisma", () => ({
  default: prismaMock
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: bcryptMock.hash,
    compare: bcryptMock.compare
  }
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: jwtMock.sign
  }
}));

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import AuthService from "../../../services/AuthService";

describe("AuthService", () => {
  const service = new AuthService();

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "unit-test-secret";
  });

  it("returns null on signup when email already exists", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 1, email: "existing@example.com" });

    const result = await service.signup("existing@example.com", "Password123");

    expect(result).toBeNull();
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("creates user and returns token on signup", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    vi.mocked(bcrypt.hash).mockResolvedValue("hashed-password" as never);
    prismaMock.user.create.mockResolvedValue({ id: 10, email: "new@example.com" });
    vi.mocked(jwt.sign).mockReturnValue("jwt-token" as never);

    const result = await service.signup("new@example.com", "Password123");

    expect(prismaMock.user.create).toHaveBeenCalled();
    expect(jwt.sign).toHaveBeenCalled();
    expect(result).toEqual({
      user: { id: 10, email: "new@example.com" },
      token: "jwt-token"
    });
  });

  it("returns null on login when user is missing", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const result = await service.login("unknown@example.com", "Password123");

    expect(result).toBeNull();
  });

  it("returns null on login when password is invalid", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 2,
      email: "john@example.com",
      passwordHash: "hash"
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const result = await service.login("john@example.com", "wrong");

    expect(result).toBeNull();
  });

  it("returns user and token on successful login", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 2,
      email: "john@example.com",
      passwordHash: "hash"
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(jwt.sign).mockReturnValue("jwt-login-token" as never);

    const result = await service.login("john@example.com", "Password123");

    expect(result).toEqual({
      user: {
        id: 2,
        email: "john@example.com"
      },
      token: "jwt-login-token"
    });
  });
});
