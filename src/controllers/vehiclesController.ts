import { Request, Response } from "express";

import { FuelType } from "../../prisma/generated/prisma/client";

import { getAuthUserId } from "../middlewares/auth";
import VehicleService from "../services/VehicleService";

const vehicleService = new VehicleService();

export const getMyVehicles = async (_req: Request, res: Response) => {
  const userId = getAuthUserId(res);
  if (!userId) {
    return res.status(401).json({ error: "unauthorized", message: "Authentication required" });
  }

  const vehicles = await vehicleService.listForUser(userId);
  return res.status(200).json({ data: vehicles });
};

export const createVehicle = async (req: Request, res: Response) => {
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

export const getVehicleById = async (req: Request, res: Response) => {
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

export const updateVehicle = async (req: Request, res: Response) => {
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

export const deleteVehicle = async (req: Request, res: Response) => {
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
