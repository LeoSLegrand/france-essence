import { Request, Response } from "express";
import { vi } from "vitest";

export const createMockRequest = (overrides: Partial<Request> = {}) => ({
  params: {},
  query: {},
  body: {},
  ...overrides
}) as Request;

export const createMockResponse = (locals: Record<string, unknown> = {}) => {
  const response = {
    locals,
    status: vi.fn(),
    json: vi.fn(),
    send: vi.fn()
  } as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
    send: ReturnType<typeof vi.fn>;
  };

  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);
  response.send.mockReturnValue(response);

  return response;
};
