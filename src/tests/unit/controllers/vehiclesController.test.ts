import { describe, expect, it, vi } from "vitest";

import { createVehiclesController } from "../../../controllers/vehiclesController";
import { createMockRequest, createMockResponse } from "../../helpers/httpMocks";

describe("vehiclesController", () => {
  it("returns 401 when listing vehicles without auth", async () => {
    const vehicleService = {
      listForUser: vi.fn(),
      createForUser: vi.fn(),
      getByIdForUser: vi.fn(),
      updateForUser: vi.fn(),
      deleteForUser: vi.fn()
    };
    const getAuthUserId = vi.fn().mockReturnValue(null);
    const { getMyVehicles } = createVehiclesController({ vehicleService, getAuthUserId });

    await getMyVehicles(createMockRequest(), createMockResponse());

    expect(vehicleService.listForUser).not.toHaveBeenCalled();
  });

  it("returns 404 when vehicle is not found", async () => {
    const vehicleService = {
      listForUser: vi.fn(),
      createForUser: vi.fn(),
      getByIdForUser: vi.fn().mockResolvedValue(null),
      updateForUser: vi.fn(),
      deleteForUser: vi.fn()
    };
    const getAuthUserId = vi.fn().mockReturnValue(1);
    const { getVehicleById } = createVehiclesController({ vehicleService, getAuthUserId });

    const req = createMockRequest({ params: { id: "99" } });
    const res = createMockResponse();

    await getVehicleById(req, res);

    expect(vehicleService.getByIdForUser).toHaveBeenCalledWith(1, 99);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("creates a vehicle for authenticated user", async () => {
    const payload = { id: 1, userId: 5, name: "Clio", preferredFuel: "E10" };
    const vehicleService = {
      listForUser: vi.fn(),
      createForUser: vi.fn().mockResolvedValue(payload),
      getByIdForUser: vi.fn(),
      updateForUser: vi.fn(),
      deleteForUser: vi.fn()
    };
    const getAuthUserId = vi.fn().mockReturnValue(5);
    const { createVehicle } = createVehiclesController({ vehicleService, getAuthUserId });

    const req = createMockRequest({ body: { name: "Clio", preferredFuel: "E10" } });
    const res = createMockResponse();

    await createVehicle(req, res);

    expect(vehicleService.createForUser).toHaveBeenCalledWith(5, {
      name: "Clio",
      preferredFuel: "E10"
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
