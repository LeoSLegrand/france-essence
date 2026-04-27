import { FuelType } from "../../prisma/generated/prisma/client";
import AuthService from "../services/AuthService";
import FillUpService from "../services/FillUpService";
import StationService from "../services/StationService";
import StatisticsService from "../services/StatisticsService";
import UserService from "../services/UserService";
import VehicleService from "../services/VehicleService";

export type DateRangeQuery = {
  dateFrom?: Date;
  dateTo?: Date;
};

export type AuthServiceContract = {
  signup: (email: string, password: string) => Promise<unknown | null>;
  login: (email: string, password: string) => Promise<unknown | null>;
};

export type UserServiceContract = {
  getProfile: (userId: number) => Promise<unknown | null>;
  getStats: (userId: number, query: DateRangeQuery) => Promise<unknown>;
};

export type VehicleServiceContract = {
  listForUser: (userId: number) => Promise<unknown>;
  createForUser: (userId: number, input: { name: string; preferredFuel: FuelType }) => Promise<unknown>;
  getByIdForUser: (userId: number, id: number) => Promise<unknown | null>;
  updateForUser: (userId: number, id: number, input: { name?: string; preferredFuel?: FuelType }) => Promise<unknown | null>;
  deleteForUser: (userId: number, id: number) => Promise<boolean>;
};

export type FillUpServiceContract = {
  listForVehicle: (
    userId: number,
    vehicleId: number,
    filters: { dateFrom?: Date; dateTo?: Date; limit?: number }
  ) => Promise<{ status: "ok"; fillUps: unknown } | { status: "vehicle_not_found" }>;
  createForVehicle: (
    userId: number,
    input: {
      vehicleId: number;
      stationId: number;
      fuelType: FuelType;
      kilometers: number;
      liters: number;
      totalPrice?: number;
      date?: Date;
    }
  ) => Promise<
    | { status: "created"; pricingMode: "auto" | "manual"; fillUp: unknown }
    | { status: "vehicle_not_found" }
    | { status: "station_not_found" }
    | { status: "manual_price_required" }
  >;
};

export type StationServiceContract = {
  searchCities: (query: string, limit?: number) => Promise<unknown>;
  stationExists: (id: number) => Promise<boolean>;
  getStationById: (id: number) => Promise<unknown | null>;
  getStationPriceHistory: (params: {
    stationId: number;
    fuelType?: FuelType;
    dateFrom: Date;
    dateTo: Date;
  }) => Promise<unknown>;
  getStationsByRadius: (params: {
    lat: number;
    lng: number;
    radius: number;
    limit: number;
  }) => Promise<unknown>;
};

export type StatisticsServiceContract = {
  getPublicPriceStatistics: (params: {
    level: "national" | "department";
    departmentCode?: string;
    fuelType?: FuelType;
    dateFrom: Date;
    dateTo: Date;
  }) => Promise<unknown>;
};

export type AppDependencies = {
  authService: AuthServiceContract;
  userService: UserServiceContract;
  vehicleService: VehicleServiceContract;
  fillUpService: FillUpServiceContract;
  stationService: StationServiceContract;
  statisticsService: StatisticsServiceContract;
};

export const createAppDependencies = (): AppDependencies => ({
  authService: new AuthService(),
  userService: new UserService(),
  vehicleService: new VehicleService(),
  fillUpService: new FillUpService(),
  stationService: new StationService(),
  statisticsService: new StatisticsService()
});

export const appDependencies = createAppDependencies();
