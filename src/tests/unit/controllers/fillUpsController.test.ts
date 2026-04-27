import { describe, expect, it, vi } from "vitest";

import { createFillUpsController } from "../../../controllers/fillUpsController";
import { createMockRequest, createMockResponse } from "../../helpers/httpMocks";

describe("fillUpsController", () => {
  it("returns 404 when vehicle is not owned/found", async () => {
    const fillUpService = {
      listForVehicle: vi.fn().mockResolvedValue({ status: "vehicle_not_found" as const }),
      createForVehicle: vi.fn()
    };
    const getAuthUserId = vi.fn().mockReturnValue(1);
    const { getVehicleFillUps } = createFillUpsController({ fillUpService, getAuthUserId });

    const req = createMockRequest({ params: { vehicleId: "10" } });
    const res = createMockResponse();

    await getVehicleFillUps(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "not_found", message: "Vehicle not found" });
  });

  it("returns 400 when manual price is required", async () => {
    const fillUpService = {
      listForVehicle: vi.fn(),
      createForVehicle: vi.fn().mockResolvedValue({ status: "manual_price_required" as const })
    };
    const getAuthUserId = vi.fn().mockReturnValue(2);
    const { createVehicleFillUp } = createFillUpsController({ fillUpService, getAuthUserId });

    const req = createMockRequest({
      params: { vehicleId: "4" },
      body: {
        stationId: 100,
        fuelType: "E10",
        kilometers: 12000,
        liters: 30
      }
    });
    const res = createMockResponse();

    await createVehicleFillUp(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 201 with pricing mode on fill-up creation", async () => {
    const created = {
      id: 1,
      vehicleId: 4,
      stationId: 100,
      fuelType: "E10",
      kilometers: 12000,
      liters: "30.000",
      totalPrice: "55.90",
      date: new Date("2026-04-27T10:00:00.000Z")
    };
    const fillUpService = {
      listForVehicle: vi.fn(),
      createForVehicle: vi.fn().mockResolvedValue({
        status: "created" as const,
        pricingMode: "manual" as const,
        fillUp: created
      })
    };
    const getAuthUserId = vi.fn().mockReturnValue(2);
    const { createVehicleFillUp } = createFillUpsController({ fillUpService, getAuthUserId });

    const req = createMockRequest({
      params: { vehicleId: "4" },
      body: {
        stationId: 100,
        fuelType: "E10",
        kilometers: 12000,
        liters: 30,
        totalPrice: 55.9
      }
    });
    const res = createMockResponse();

    await createVehicleFillUp(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      data: created,
      meta: {
        pricingMode: "manual"
      }
    });
  });
});
