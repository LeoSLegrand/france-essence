import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    $queryRaw: vi.fn()
  }
}));

vi.mock("../../../config/prisma", () => ({
  default: prismaMock
}));

import StatisticsService from "../../../services/StatisticsService";

describe("StatisticsService", () => {
  const service = new StatisticsService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns rounded averages and keeps national scope", async () => {
    const from = new Date("2026-04-01T00:00:00.000Z");
    const to = new Date("2026-04-27T23:59:59.000Z");

    prismaMock.$queryRaw.mockResolvedValue([
      { fuelType: "E10", averagePrice: 1.81245, samples: 12 },
      { fuelType: "SP95", averagePrice: 1.94567, samples: 7 }
    ]);

    const result = await service.getPublicPriceStatistics({
      level: "national",
      dateFrom: from,
      dateTo: to
    });

    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);
    expect(result.level).toBe("national");
    expect(result.departmentCode).toBeUndefined();
    expect(result.fuelType).toBeNull();
    expect(result.averages).toEqual([
      { fuelType: "E10", averagePrice: 1.812, samples: 12 },
      { fuelType: "SP95", averagePrice: 1.946, samples: 7 }
    ]);
  });

  it("returns department and fuel filter metadata", async () => {
    const from = new Date("2026-03-01T00:00:00.000Z");
    const to = new Date("2026-03-31T23:59:59.000Z");

    prismaMock.$queryRaw.mockResolvedValue([{ fuelType: "Gazole", averagePrice: 1.70123, samples: 40 }]);

    const result = await service.getPublicPriceStatistics({
      level: "department",
      departmentCode: "75",
      fuelType: "Gazole",
      dateFrom: from,
      dateTo: to
    });

    expect(result.level).toBe("department");
    expect(result.departmentCode).toBe("75");
    expect(result.fuelType).toBe("Gazole");
    expect(result.averages).toEqual([{ fuelType: "Gazole", averagePrice: 1.701, samples: 40 }]);
  });
});
