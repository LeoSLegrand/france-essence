import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    vehicle: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    fillUp: {
      deleteMany: vi.fn()
    },
    $transaction: vi.fn()
  }
}));

vi.mock("../../../config/prisma", () => ({
  default: prismaMock
}));

import VehicleService from "../../../services/VehicleService";

describe("VehicleService", () => {
  const service = new VehicleService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists vehicles for user", async () => {
    prismaMock.vehicle.findMany.mockResolvedValue([{ id: 1, name: "Car" }]);

    const result = await service.listForUser(1);

    expect(prismaMock.vehicle.findMany).toHaveBeenCalled();
    expect(result).toEqual([{ id: 1, name: "Car" }]);
  });

  it("returns null when updating non-existing vehicle", async () => {
    prismaMock.vehicle.findFirst.mockResolvedValue(null);

    const result = await service.updateForUser(1, 999, { name: "Updated" });

    expect(result).toBeNull();
    expect(prismaMock.vehicle.update).not.toHaveBeenCalled();
  });

  it("updates vehicle when ownership is valid", async () => {
    prismaMock.vehicle.findFirst.mockResolvedValue({ id: 4 });
    prismaMock.vehicle.update.mockResolvedValue({ id: 4, name: "Updated", preferredFuel: "E10", userId: 1 });

    const result = await service.updateForUser(1, 4, { name: "Updated" });

    expect(prismaMock.vehicle.update).toHaveBeenCalled();
    expect(result).toEqual({ id: 4, name: "Updated", preferredFuel: "E10", userId: 1 });
  });

  it("returns false when deleting non-existing vehicle", async () => {
    prismaMock.vehicle.findFirst.mockResolvedValue(null);

    const result = await service.deleteForUser(1, 5);

    expect(result).toBe(false);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("deletes fill-ups and vehicle in a transaction", async () => {
    prismaMock.vehicle.findFirst.mockResolvedValue({ id: 5 });
    prismaMock.fillUp.deleteMany.mockReturnValue("deleteManyOp");
    prismaMock.vehicle.delete.mockReturnValue("deleteVehicleOp");
    prismaMock.$transaction.mockResolvedValue([]);

    const result = await service.deleteForUser(1, 5);

    expect(prismaMock.$transaction).toHaveBeenCalledWith(["deleteManyOp", "deleteVehicleOp"]);
    expect(result).toBe(true);
  });
});
