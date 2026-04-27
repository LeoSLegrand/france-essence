import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: {
      findUnique: vi.fn()
    },
    fillUp: {
      count: vi.fn(),
      findMany: vi.fn()
    }
  }
}));

vi.mock("../../../config/prisma", () => ({
  default: prismaMock
}));

import UserService from "../../../services/UserService";

describe("UserService", () => {
  const service = new UserService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null profile when user does not exist", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const result = await service.getProfile(999);

    expect(result).toBeNull();
  });

  it("returns profile with vehicle and fill-up counts", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      email: "test@example.com",
      _count: { vehicles: 2 }
    });
    prismaMock.fillUp.count.mockResolvedValue(7);

    const result = await service.getProfile(1);

    expect(result).toEqual({
      id: 1,
      email: "test@example.com",
      vehiclesCount: 2,
      fillUpsCount: 7
    });
  });

  it("aggregates stats including consumption", async () => {
    prismaMock.fillUp.findMany.mockResolvedValue([
      {
        vehicleId: 1,
        fuelType: "E10",
        liters: "30.0",
        totalPrice: "54.0",
        kilometers: 10000,
        date: new Date("2026-01-01T00:00:00.000Z"),
        vehicle: { id: 1, name: "Car A" }
      },
      {
        vehicleId: 1,
        fuelType: "E10",
        liters: "32.0",
        totalPrice: "60.8",
        kilometers: 10400,
        date: new Date("2026-01-10T00:00:00.000Z"),
        vehicle: { id: 1, name: "Car A" }
      },
      {
        vehicleId: 2,
        fuelType: "SP95",
        liters: "20.0",
        totalPrice: "38.0",
        kilometers: 5000,
        date: new Date("2026-01-05T00:00:00.000Z"),
        vehicle: { id: 2, name: "Car B" }
      },
      {
        vehicleId: 2,
        fuelType: "SP95",
        liters: "21.0",
        totalPrice: "40.95",
        kilometers: 5300,
        date: new Date("2026-01-20T00:00:00.000Z"),
        vehicle: { id: 2, name: "Car B" }
      }
    ]);

    const result = await service.getStats(1, {});

    expect(result.totals.fillUps).toBe(4);
    expect(result.totals.totalLiters).toBe(103);
    expect(result.totals.totalSpend).toBe(193.75);
    expect(result.totals.averagePricePerLiter).toBe(1.881);
    expect(result.totals.averageConsumptionLPer100Km).toBe(7.571);
    expect(result.byFuel).toHaveLength(2);
    expect(result.byVehicle).toHaveLength(2);
  });
});
