import { describe, expect, it, vi } from "vitest";

import { createUsersController } from "../../../controllers/usersController";
import { createMockRequest, createMockResponse } from "../../helpers/httpMocks";

describe("usersController", () => {
  it("returns 401 when auth user is missing", async () => {
    const userService = {
      getProfile: vi.fn(),
      getStats: vi.fn()
    };
    const getAuthUserId = vi.fn().mockReturnValue(null);
    const { getMyProfile } = createUsersController({ userService, getAuthUserId });

    const req = createMockRequest();
    const res = createMockResponse();

    await getMyProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(userService.getProfile).not.toHaveBeenCalled();
  });

  it("returns 404 when profile does not exist", async () => {
    const userService = {
      getProfile: vi.fn().mockResolvedValue(null),
      getStats: vi.fn()
    };
    const getAuthUserId = vi.fn().mockReturnValue(42);
    const { getMyProfile } = createUsersController({ userService, getAuthUserId });

    const req = createMockRequest();
    const res = createMockResponse();

    await getMyProfile(req, res);

    expect(userService.getProfile).toHaveBeenCalledWith(42);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns stats for authenticated user", async () => {
    const statsPayload = {
      period: { dateFrom: null, dateTo: null },
      totals: { fillUps: 0, totalLiters: 0, totalSpend: 0, averagePricePerLiter: null, averageConsumptionLPer100Km: null },
      byFuel: [],
      byVehicle: []
    };
    const userService = {
      getProfile: vi.fn(),
      getStats: vi.fn().mockResolvedValue(statsPayload)
    };
    const getAuthUserId = vi.fn().mockReturnValue(7);
    const { getMyStats } = createUsersController({ userService, getAuthUserId });

    const req = createMockRequest({ query: { dateFrom: "2026-04-01T00:00:00.000Z" } });
    const res = createMockResponse({ query: { dateFrom: new Date("2026-04-01T00:00:00.000Z") } });

    await getMyStats(req, res);

    expect(userService.getStats).toHaveBeenCalledWith(7, {
      dateFrom: new Date("2026-04-01T00:00:00.000Z"),
      dateTo: undefined
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ data: statsPayload });
  });
});
