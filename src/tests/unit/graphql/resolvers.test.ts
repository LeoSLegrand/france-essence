import { describe, expect, it, vi } from "vitest";

import { createGraphQLRoot } from "../../../graphql/resolvers";

describe("graphql resolvers", () => {
  it("aggregates station price series by interval", async () => {
    const stationService = {
      getStationPriceHistory: vi.fn().mockResolvedValue({
        SP95: [
          {
            fuelType: "SP95",
            price: 1.8,
            recordedAt: new Date("2026-04-01T10:00:00.000Z")
          },
          {
            fuelType: "SP95",
            price: 1.9,
            recordedAt: new Date("2026-04-01T18:00:00.000Z")
          }
        ]
      })
    };

    const userService = {
      getFuelSpendSeries: vi.fn()
    };

    const root = createGraphQLRoot({
      stationService: stationService as never,
      userService: userService as never
    });

    const result = await root.stationPriceSeries({
      stationId: 100,
      dateFrom: "2026-04-01T00:00:00.000Z",
      dateTo: "2026-04-02T00:00:00.000Z",
      interval: "DAY"
    });

    expect(stationService.getStationPriceHistory).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      {
        timestamp: "2026-04-01T00:00:00.000Z",
        fuelType: "SP95",
        price: 1.85,
        samples: 2
      }
    ]);
  });

  it("rejects user series when context has no authenticated user", async () => {
    const root = createGraphQLRoot({
      stationService: { getStationPriceHistory: vi.fn() } as never,
      userService: { getFuelSpendSeries: vi.fn() } as never
    });

    await expect(
      root.userFuelSpendSeries(
        {
          dateFrom: "2026-04-01T00:00:00.000Z",
          dateTo: "2026-04-02T00:00:00.000Z"
        },
        { userId: null }
      )
    ).rejects.toThrow("Unauthorized");
  });

  it("returns user spend series from service", async () => {
    const userService = {
      getFuelSpendSeries: vi.fn().mockResolvedValue([
        {
          timestamp: new Date("2026-04-01T00:00:00.000Z"),
          fuelType: "E10",
          totalSpend: 64.5,
          totalLiters: 35,
          fillUps: 1,
          averagePricePerLiter: 1.843
        }
      ])
    };

    const root = createGraphQLRoot({
      stationService: { getStationPriceHistory: vi.fn() } as never,
      userService: userService as never
    });

    const result = await root.userFuelSpendSeries(
      {
        dateFrom: "2026-04-01T00:00:00.000Z",
        dateTo: "2026-04-30T23:59:59.999Z",
        interval: "DAY"
      },
      { userId: 99 }
    );

    expect(userService.getFuelSpendSeries).toHaveBeenCalledWith(99, {
      dateFrom: new Date("2026-04-01T00:00:00.000Z"),
      dateTo: new Date("2026-04-30T23:59:59.999Z"),
      interval: "DAY"
    });
    expect(result[0].timestamp).toBe("2026-04-01T00:00:00.000Z");
    expect(result[0].fuelType).toBe("E10");
  });
});
