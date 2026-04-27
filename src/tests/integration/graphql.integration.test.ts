import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import app from "../../app";
import prisma from "../../config/prisma";

const PASSWORD = "Password123";

type AuthSession = {
  userId: number;
  token: string;
};

describe("graphql integration", () => {
  const createdUserIds: number[] = [];
  const createdVehicleIds: number[] = [];
  const stationId = 1800000000 + Math.floor(Math.random() * 100000);

  const createUserSession = async (): Promise<AuthSession> => {
    const email = `graphql.${Date.now()}.${Math.floor(Math.random() * 10000)}@example.com`;

    const signup = await request(app)
      .post("/api/v1/auth/signup")
      .send({ email, password: PASSWORD, name: "GraphQL User" });

    expect(signup.status).toBe(201);
    createdUserIds.push(signup.body.data.user.id);

    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password: PASSWORD });

    expect(login.status).toBe(200);

    return {
      userId: signup.body.data.user.id,
      token: login.body.data.token
    };
  };

  beforeAll(async () => {
    await prisma.$connect();

    await prisma.station.create({
      data: {
        id: stationId,
        address: "GraphQL Test Station",
        cityCode: null,
        postalCode: "75000",
        latitude: 48.8566,
        longitude: 2.3522,
        services: [],
        horaires: {}
      }
    });

    await prisma.priceHistory.createMany({
      data: [
        {
          stationId,
          fuelType: "E10",
          price: 1.72,
          recordedAt: new Date("2026-04-01T10:00:00.000Z")
        },
        {
          stationId,
          fuelType: "E10",
          price: 1.82,
          recordedAt: new Date("2026-04-01T18:00:00.000Z")
        }
      ]
    });
  });

  afterAll(async () => {
    if (createdVehicleIds.length > 0) {
      await prisma.fillUp.deleteMany({
        where: {
          vehicleId: {
            in: createdVehicleIds
          }
        }
      });

      await prisma.vehicle.deleteMany({
        where: {
          id: {
            in: createdVehicleIds
          }
        }
      });
    }

    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: {
          id: {
            in: createdUserIds
          }
        }
      });
    }

    await prisma.priceHistory.deleteMany({ where: { stationId } });
    await prisma.station.deleteMany({ where: { id: stationId } });

    await prisma.$disconnect();
  });

  it("returns station price series", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
          query StationSeries($stationId: Int!, $dateFrom: String!, $dateTo: String!) {
            stationPriceSeries(
              stationId: $stationId
              dateFrom: $dateFrom
              dateTo: $dateTo
              interval: DAY
            ) {
              timestamp
              fuelType
              price
              samples
            }
          }
        `,
        variables: {
          stationId,
          dateFrom: "2026-04-01T00:00:00.000Z",
          dateTo: "2026-04-02T00:00:00.000Z"
        }
      });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.stationPriceSeries).toEqual([
      {
        timestamp: "2026-04-01T00:00:00.000Z",
        fuelType: "E10",
        price: 1.77,
        samples: 2
      }
    ]);
  });

  it("returns an error for private query when token is missing", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
          query UserSeries($dateFrom: String!, $dateTo: String!) {
            userFuelSpendSeries(dateFrom: $dateFrom, dateTo: $dateTo) {
              timestamp
              fuelType
              totalSpend
            }
          }
        `,
        variables: {
          dateFrom: "2026-04-01T00:00:00.000Z",
          dateTo: "2026-04-30T23:59:59.999Z"
        }
      });

    expect(response.status).toBe(200);
    expect(response.body.errors?.[0]?.message).toContain("Unauthorized");
  });

  it("returns user fuel spend series with a valid token", async () => {
    const session = await createUserSession();

    const vehicle = await prisma.vehicle.create({
      data: {
        userId: session.userId,
        name: "GraphQL Car",
        preferredFuel: "E10"
      }
    });
    createdVehicleIds.push(vehicle.id);

    await prisma.fillUp.createMany({
      data: [
        {
          vehicleId: vehicle.id,
          stationId,
          fuelType: "E10",
          kilometers: 10000,
          liters: 30,
          totalPrice: 50,
          date: new Date("2026-04-05T08:00:00.000Z")
        },
        {
          vehicleId: vehicle.id,
          stationId,
          fuelType: "E10",
          kilometers: 10400,
          liters: 20,
          totalPrice: 36,
          date: new Date("2026-04-05T18:00:00.000Z")
        }
      ]
    });

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${session.token}`)
      .send({
        query: `
          query UserSeries($dateFrom: String!, $dateTo: String!) {
            userFuelSpendSeries(dateFrom: $dateFrom, dateTo: $dateTo, interval: DAY) {
              timestamp
              fuelType
              totalSpend
              totalLiters
              fillUps
              averagePricePerLiter
            }
          }
        `,
        variables: {
          dateFrom: "2026-04-01T00:00:00.000Z",
          dateTo: "2026-04-30T23:59:59.999Z"
        }
      });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.userFuelSpendSeries).toEqual([
      {
        timestamp: "2026-04-05T00:00:00.000Z",
        fuelType: "E10",
        totalSpend: 86,
        totalLiters: 50,
        fillUps: 2,
        averagePricePerLiter: 1.72
      }
    ]);
  });
});
