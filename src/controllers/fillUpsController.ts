import { Request, Response } from "express";

import { FuelType } from "../../prisma/generated/prisma/client";

import { AppDependencies } from "../config/dependencies";
import { getAuthUserId } from "../middlewares/auth";
import FillUpService from "../services/FillUpService";

type FillUpsControllerDependencies = Pick<AppDependencies, "fillUpService"> & {
  getAuthUserId: (res: Response) => number | null;
};

export const createFillUpsController = ({ fillUpService, getAuthUserId }: FillUpsControllerDependencies) => {
  const getVehicleFillUps = async (req: Request, res: Response) => {
    const userId = getAuthUserId(res);
    if (!userId) {
      return res.status(401).json({ error: "unauthorized", message: "Authentication required" });
    }

    const vehicleId = Number(req.params.vehicleId);
    const query = (res.locals.query ?? req.query) as { dateFrom?: Date; dateTo?: Date; limit?: number };

    const result = await fillUpService.listForVehicle(userId, vehicleId, {
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      limit: query.limit
    });

    if (result.status === "vehicle_not_found") {
      return res.status(404).json({ error: "not_found", message: "Vehicle not found" });
    }

    return res.status(200).json({ data: result.fillUps });
  };

  const createVehicleFillUp = async (req: Request, res: Response) => {
    const userId = getAuthUserId(res);
    if (!userId) {
      return res.status(401).json({ error: "unauthorized", message: "Authentication required" });
    }

    const vehicleId = Number(req.params.vehicleId);
    const body = (res.locals.body ?? req.body) as {
      stationId: number;
      fuelType: FuelType;
      kilometers: number;
      liters: number;
      totalPrice?: number;
      date?: Date;
    };

    const result = await fillUpService.createForVehicle(userId, {
      vehicleId,
      stationId: body.stationId,
      fuelType: body.fuelType,
      kilometers: body.kilometers,
      liters: body.liters,
      totalPrice: body.totalPrice,
      date: body.date
    });

    if (result.status === "vehicle_not_found") {
      return res.status(404).json({ error: "not_found", message: "Vehicle not found" });
    }

    if (result.status === "station_not_found") {
      return res.status(404).json({ error: "not_found", message: "Station not found" });
    }

    if (result.status === "manual_price_required") {
      return res.status(400).json({
        error: "validation_error",
        message: "totalPrice is required when no current station price is available"
      });
    }

    return res.status(201).json({
      data: result.fillUp,
      meta: {
        pricingMode: result.pricingMode
      }
    });
  };

  return {
    getVehicleFillUps,
    createVehicleFillUp
  };
};

const defaultController = createFillUpsController({
  fillUpService: new FillUpService(),
  getAuthUserId
});

export const getVehicleFillUps = defaultController.getVehicleFillUps;
export const createVehicleFillUp = defaultController.createVehicleFillUp;
