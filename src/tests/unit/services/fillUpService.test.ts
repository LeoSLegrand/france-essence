import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    vehicle: {
      findFirst: vi.fn()
    },
    station: {
      findUnique: vi.fn()
    },
    currentPrice: {
      findUnique: vi.fn()
    },
    fillUp: {
      findMany: vi.fn(),
      create: vi.fn()
    }
  }
}));

vi.mock("../../../config/prisma", () => ({
  default: prismaMock
}));

import FillUpService from "../../../services/FillUpService";

describe("FillUpService", () => {
  const service = new FillUpService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns vehicle_not_found when vehicle is not owned", async () => {
    prismaMock.vehicle.findFirst.mockResolvedValue(null);

    const result = await service.listForVehicle(1, 10, {});

    expect(result).toEqual({ status: "vehicle_not_found" });
    expect(prismaMock.fillUp.findMany).not.toHaveBeenCalled();
  });

  it("lists fill-ups with capped limit", async () => {
    prismaMock.vehicle.findFirst.mockResolvedValue({ id: 10 });
    prismaMock.fillUp.findMany.mockResolvedValue([{ id: 1 }]);

    const result = await service.listForVehicle(1, 10, { limit: 1000 });

    expect(prismaMock.fillUp.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 500
      })
    );
    expect(result).toEqual({ status: "ok", fillUps: [{ id: 1 }] });
  });

  it("returns station_not_found when station does not exist", async () => {
    prismaMock.vehicle.findFirst.mockResolvedValue({ id: 10 });
    prismaMock.station.findUnique.mockResolvedValue(null);

    const result = await service.createForVehicle(1, {
      vehicleId: 10,
      stationId: 999,
      fuelType: "E10",
      kilometers: 10000,
      liters: 30
    });

    expect(result).toEqual({ status: "station_not_found" });
  });

  it("returns manual_price_required when no current price and totalPrice missing", async () => {
    prismaMock.vehicle.findFirst.mockResolvedValue({ id: 10 });
    prismaMock.station.findUnique.mockResolvedValue({ id: 999 });
    prismaMock.currentPrice.findUnique.mockResolvedValue(null);

    const result = await service.createForVehicle(1, {
      vehicleId: 10,
      stationId: 999,
      fuelType: "E10",
      kilometers: 10000,
      liters: 30
    });

    expect(result).toEqual({ status: "manual_price_required" });
  });

  it("creates fill-up in auto pricing mode", async () => {
    prismaMock.vehicle.findFirst.mockResolvedValue({ id: 10 });
    prismaMock.station.findUnique.mockResolvedValue({ id: 999 });
    prismaMock.currentPrice.findUnique.mockResolvedValue({ price: "1.82", isAvailable: true });
    prismaMock.fillUp.create.mockResolvedValue({ id: 5, liters: "30.0", totalPrice: "54.60" });

    const result = await service.createForVehicle(1, {
      vehicleId: 10,
      stationId: 999,
      fuelType: "E10",
      kilometers: 10000,
      liters: 30
    });

    expect(prismaMock.fillUp.create).toHaveBeenCalled();
    expect(result).toEqual({
      status: "created",
      pricingMode: "auto",
      fillUp: { id: 5, liters: "30.0", totalPrice: "54.60" }
    });
  });
});
