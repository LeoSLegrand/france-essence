import { Request, Response } from "express";

import { FuelType } from "../../prisma/generated/prisma/client";

import { AppDependencies } from "../config/dependencies";
import { getAuthUserId } from "../middlewares/auth";
import VehicleService from "../services/VehicleService";

type VehiclesControllerDependencies = Pick<AppDependencies, "vehicleService"> & {
  getAuthUserId: (res: Response) => number | null;
};

export const createVehiclesController = ({ vehicleService, getAuthUserId }: VehiclesControllerDependencies) => {
  const getMyVehicles = async (_req: Request, res: Response) => {
    const userId = getAuthUserId(res);
    if (!userId) {
      return res.status(401).json({ error: "unauthorized", message: "Authentication required" });
    }

    const vehicles = await vehicleService.listForUser(userId);
    return res.status(200).json({ data: vehicles });
  };

  const createVehicle = async (req: Request, res: Response) => {
    const userId = getAuthUserId(res);
    if (!userId) {
      return res.status(401).json({ error: "unauthorized", message: "Authentication required" });
    }

    const body = (res.locals.body ?? req.body) as { name: string; preferredFuel: FuelType };

    const vehicle = await vehicleService.createForUser(userId, {
      name: body.name,
      preferredFuel: body.preferredFuel
    });

    return res.status(201).json({ data: vehicle });
  };

  const getVehicleById = async (req: Request, res: Response) => {
    const userId = getAuthUserId(res);
    if (!userId) {
      return res.status(401).json({ error: "unauthorized", message: "Authentication required" });
    }

    const vehicleId = Number(req.params.id);
    const vehicle = await vehicleService.getByIdForUser(userId, vehicleId);

    if (!vehicle) {
      return res.status(404).json({ error: "not_found", message: "Vehicle not found" });
    }

    return res.status(200).json({ data: vehicle });
  };

  const updateVehicle = async (req: Request, res: Response) => {
    const userId = getAuthUserId(res);
    if (!userId) {
      return res.status(401).json({ error: "unauthorized", message: "Authentication required" });
    }

    const vehicleId = Number(req.params.id);
    const body = (res.locals.body ?? req.body) as { name?: string; preferredFuel?: FuelType };

    const vehicle = await vehicleService.updateForUser(userId, vehicleId, {
      name: body.name,
      preferredFuel: body.preferredFuel
    });

    if (!vehicle) {
      return res.status(404).json({ error: "not_found", message: "Vehicle not found" });
    }

    return res.status(200).json({ data: vehicle });
  };

  const deleteVehicle = async (req: Request, res: Response) => {
    const userId = getAuthUserId(res);
    if (!userId) {
      return res.status(401).json({ error: "unauthorized", message: "Authentication required" });
    }

    const vehicleId = Number(req.params.id);
    const deleted = await vehicleService.deleteForUser(userId, vehicleId);

    if (!deleted) {
      return res.status(404).json({ error: "not_found", message: "Vehicle not found" });
    }

    return res.status(204).send();
  };

  return {
    getMyVehicles,
    createVehicle,
    getVehicleById,
    updateVehicle,
    deleteVehicle
  };
};

const defaultController = createVehiclesController({
  vehicleService: new VehicleService(),
  getAuthUserId
});

export const getMyVehicles = defaultController.getMyVehicles;
export const createVehicle = defaultController.createVehicle;
export const getVehicleById = defaultController.getVehicleById;
export const updateVehicle = defaultController.updateVehicle;
export const deleteVehicle = defaultController.deleteVehicle;
