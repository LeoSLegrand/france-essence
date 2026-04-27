import { FuelType } from "../../prisma/generated/prisma/client";

import prisma from "../config/prisma";

export default class VehicleService {
  async listForUser(userId: number) {
    return prisma.vehicle.findMany({
      where: { userId },
      orderBy: { id: "desc" },
      select: {
        id: true,
        name: true,
        preferredFuel: true,
        _count: {
          select: {
            fillUps: true
          }
        }
      }
    });
  }

  async createForUser(userId: number, input: { name: string; preferredFuel: FuelType }) {
    return prisma.vehicle.create({
      data: {
        userId,
        name: input.name,
        preferredFuel: input.preferredFuel
      },
      select: {
        id: true,
        name: true,
        preferredFuel: true,
        userId: true
      }
    });
  }

  async getByIdForUser(userId: number, id: number) {
    return prisma.vehicle.findFirst({
      where: {
        id,
        userId
      },
      include: {
        _count: {
          select: {
            fillUps: true
          }
        },
        fillUps: {
          orderBy: {
            date: "desc"
          },
          take: 30,
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
        }
      }
    });
  }

  async updateForUser(
    userId: number,
    id: number,
    input: { name?: string; preferredFuel?: FuelType }
  ) {
    const existing = await prisma.vehicle.findFirst({
      where: {
        id,
        userId
      },
      select: {
        id: true
      }
    });

    if (!existing) {
      return null;
    }

    return prisma.vehicle.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.preferredFuel !== undefined ? { preferredFuel: input.preferredFuel } : {})
      },
      select: {
        id: true,
        name: true,
        preferredFuel: true,
        userId: true
      }
    });
  }

  async deleteForUser(userId: number, id: number) {
    const existing = await prisma.vehicle.findFirst({
      where: {
        id,
        userId
      },
      select: {
        id: true
      }
    });

    if (!existing) {
      return false;
    }

    await prisma.$transaction([
      prisma.fillUp.deleteMany({
        where: {
          vehicleId: id
        }
      }),
      prisma.vehicle.delete({
        where: {
          id
        }
      })
    ]);

    return true;
  }
}
