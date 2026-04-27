import { FuelType } from "../../prisma/generated/prisma/client";

import prisma from "../config/prisma";

type StatsQuery = {
  dateFrom?: Date;
  dateTo?: Date;
};

export default class UserService {
  async getProfile(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        _count: {
          select: {
            vehicles: true
          }
        }
      }
    });

    if (!user) {
      return null;
    }

    const fillUpsCount = await prisma.fillUp.count({
      where: {
        vehicle: {
          userId
        }
      }
    });

    return {
      id: user.id,
      email: user.email,
      vehiclesCount: user._count.vehicles,
      fillUpsCount
    };
  }

  async getStats(userId: number, query: StatsQuery) {
    const fillUps = await prisma.fillUp.findMany({
      where: {
        vehicle: {
          userId
        },
        date: {
          gte: query.dateFrom,
          lte: query.dateTo
        }
      },
      orderBy: {
        date: "asc"
      },
      include: {
        vehicle: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    const byFuelMap = new Map<FuelType, { fuelType: FuelType; fillUps: number; totalLiters: number; totalSpend: number }>();
    const byVehicleMap = new Map<number, { vehicleId: number; vehicleName: string; fillUps: number; totalLiters: number; totalSpend: number }>();
    const byVehicleEntries = new Map<number, typeof fillUps>();

    let totalLiters = 0;
    let totalSpend = 0;

    for (const fillUp of fillUps) {
      const liters = Number(fillUp.liters);
      const spend = Number(fillUp.totalPrice);

      totalLiters += liters;
      totalSpend += spend;

      const existingFuel = byFuelMap.get(fillUp.fuelType) ?? {
        fuelType: fillUp.fuelType,
        fillUps: 0,
        totalLiters: 0,
        totalSpend: 0
      };
      existingFuel.fillUps += 1;
      existingFuel.totalLiters += liters;
      existingFuel.totalSpend += spend;
      byFuelMap.set(fillUp.fuelType, existingFuel);

      const existingVehicle = byVehicleMap.get(fillUp.vehicleId) ?? {
        vehicleId: fillUp.vehicleId,
        vehicleName: fillUp.vehicle.name,
        fillUps: 0,
        totalLiters: 0,
        totalSpend: 0
      };
      existingVehicle.fillUps += 1;
      existingVehicle.totalLiters += liters;
      existingVehicle.totalSpend += spend;
      byVehicleMap.set(fillUp.vehicleId, existingVehicle);

      const entries = byVehicleEntries.get(fillUp.vehicleId) ?? [];
      entries.push(fillUp);
      byVehicleEntries.set(fillUp.vehicleId, entries);
    }

    let litersForConsumption = 0;
    let kilometersForConsumption = 0;

    for (const entries of byVehicleEntries.values()) {
      const sorted = [...entries].sort((a, b) => a.date.getTime() - b.date.getTime());
      for (let i = 1; i < sorted.length; i += 1) {
        const previous = sorted[i - 1];
        const current = sorted[i];
        const deltaKm = current.kilometers - previous.kilometers;

        if (deltaKm > 0) {
          kilometersForConsumption += deltaKm;
          litersForConsumption += Number(current.liters);
        }
      }
    }

    return {
      period: {
        dateFrom: query.dateFrom ?? null,
        dateTo: query.dateTo ?? null
      },
      totals: {
        fillUps: fillUps.length,
        totalLiters: this.round(totalLiters),
        totalSpend: this.round(totalSpend, 2),
        averagePricePerLiter: totalLiters > 0 ? this.round(totalSpend / totalLiters) : null,
        averageConsumptionLPer100Km:
          kilometersForConsumption > 0
            ? this.round((litersForConsumption / kilometersForConsumption) * 100)
            : null
      },
      byFuel: [...byFuelMap.values()].map((entry) => ({
        ...entry,
        totalLiters: this.round(entry.totalLiters),
        totalSpend: this.round(entry.totalSpend, 2),
        averagePricePerLiter: entry.totalLiters > 0 ? this.round(entry.totalSpend / entry.totalLiters) : null
      })),
      byVehicle: [...byVehicleMap.values()].map((entry) => ({
        ...entry,
        totalLiters: this.round(entry.totalLiters),
        totalSpend: this.round(entry.totalSpend, 2),
        averagePricePerLiter: entry.totalLiters > 0 ? this.round(entry.totalSpend / entry.totalLiters) : null
      }))
    };
  }

  private round(value: number, decimals = 3) {
    return Number(value.toFixed(decimals));
  }
}
