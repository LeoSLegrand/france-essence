import { FuelType } from "../../prisma/generated/prisma/client";

import prisma from "../config/prisma";

type CreateFillUpInput = {
  vehicleId: number;
  stationId: number;
  fuelType: FuelType;
  kilometers: number;
  liters: number;
  totalPrice?: number;
  date?: Date;
};

type FillUpsFilters = {
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
};

export default class FillUpService {
  private async belongsToUser(vehicleId: number, userId: number) {
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        userId
      },
      select: {
        id: true
      }
    });

    return Boolean(vehicle);
  }

  async listForVehicle(userId: number, vehicleId: number, filters: FillUpsFilters) {
    const isOwner = await this.belongsToUser(vehicleId, userId);
    if (!isOwner) {
      return { status: "vehicle_not_found" as const };
    }

    const limit = Math.min(Math.max(filters.limit ?? 100, 1), 500);

    const fillUps = await prisma.fillUp.findMany({
      where: {
        vehicleId,
        date: {
          gte: filters.dateFrom,
          lte: filters.dateTo
        }
      },
      orderBy: {
        date: "desc"
      },
      take: limit,
      include: {
        station: {
          select: {
            id: true,
            address: true,
            postalCode: true,
            city: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    return {
      status: "ok" as const,
      fillUps
    };
  }

  async createForVehicle(userId: number, input: CreateFillUpInput) {
    const isOwner = await this.belongsToUser(input.vehicleId, userId);
    if (!isOwner) {
      return { status: "vehicle_not_found" as const };
    }

    const station = await prisma.station.findUnique({
      where: {
        id: input.stationId
      },
      select: {
        id: true
      }
    });
    if (!station) {
      return { status: "station_not_found" as const };
    }

    const currentPrice = await prisma.currentPrice.findUnique({
      where: {
        stationId_fuelType: {
          stationId: input.stationId,
          fuelType: input.fuelType
        }
      },
      select: {
        price: true,
        isAvailable: true
      }
    });

    let totalPrice: number;
    let pricingMode: "auto" | "manual";

    if (currentPrice?.isAvailable) {
      totalPrice = Number(currentPrice.price) * input.liters;
      pricingMode = "auto";
    } else {
      if (input.totalPrice === undefined) {
        return { status: "manual_price_required" as const };
      }
      totalPrice = input.totalPrice;
      pricingMode = "manual";
    }

    const createdFillUp = await prisma.fillUp.create({
      data: {
        vehicleId: input.vehicleId,
        stationId: input.stationId,
        fuelType: input.fuelType,
        kilometers: input.kilometers,
        liters: input.liters,
        totalPrice: Number(totalPrice.toFixed(2)),
        date: input.date ?? new Date()
      },
      include: {
        station: {
          select: {
            id: true,
            address: true,
            postalCode: true,
            city: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    return {
      status: "created" as const,
      pricingMode,
      fillUp: createdFillUp
    };
  }
}
