import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import app from "../../app";
import prisma from "../../config/prisma";

const PASSWORD = "Password123";

type AuthSession = {
  userId: number;
  email: string;
  token: string;
};

describe("private routes integration", () => {
  const createdUserIds: number[] = [];
  const createdVehicleIds: number[] = [];

  let stationId: number;

  const createUserSession = async (label: string): Promise<AuthSession> => {
    const email = `integration.${label}.${Date.now()}.${Math.floor(Math.random() * 10000)}@example.com`;

    const signupResponse = await request(app)
      .post("/api/v1/auth/signup")
      .send({ email, password: PASSWORD, name: "Integration User" });

    expect(signupResponse.status).toBe(201);
    createdUserIds.push(signupResponse.body.data.user.id);

    const loginResponse = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password: PASSWORD });

    expect(loginResponse.status).toBe(200);

    return {
      userId: signupResponse.body.data.user.id,
      email,
      token: loginResponse.body.data.token
    };
  };

  beforeAll(async () => {
    await prisma.$connect();

    // Use a high synthetic station id to avoid colliding with imported public dataset.
    stationId = 1900000000 + Math.floor(Math.random() * 100000);

    await prisma.station.create({
      data: {
        id: stationId,
        address: "Integration Test Station",
        cityCode: null,
        postalCode: "75000",
        latitude: 48.8566,
        longitude: 2.3522,
        services: [],
        horaires: {}
      }
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

    await prisma.station.deleteMany({
      where: {
        id: stationId
      }
    });

    await prisma.$disconnect();
  });

  it("returns JWT on login and preserves token format", async () => {
    const session = await createUserSession("auth");

    expect(session.email).toContain("integration.auth");
    expect(typeof session.token).toBe("string");
    expect(session.token.split(".")).toHaveLength(3);
  });

  it("returns 401 on private endpoint without token", async () => {
    const response = await request(app)
      .get("/api/v1/users/me");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("unauthorized");
  });

  it("enforces ownership isolation with 404 for foreign vehicle", async () => {
    const owner = await createUserSession("owner");
    const other = await createUserSession("other");

    const vehicleResponse = await request(app)
      .post("/api/v1/vehicles")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ name: "Owner Car", preferredFuel: "E10" });

    expect(vehicleResponse.status).toBe(201);
    const vehicleId = Number(vehicleResponse.body.data.id);
    createdVehicleIds.push(vehicleId);

    const forbiddenView = await request(app)
      .get(`/api/v1/vehicles/${vehicleId}`)
      .set("Authorization", `Bearer ${other.token}`);

    expect(forbiddenView.status).toBe(404);
    expect(forbiddenView.body.error).toBe("not_found");
  });

  it("supports vehicle lifecycle create, read, patch, delete", async () => {
    const session = await createUserSession("vehicle-lifecycle");

    const created = await request(app)
      .post("/api/v1/vehicles")
      .set("Authorization", `Bearer ${session.token}`)
      .send({ name: "Lifecycle Car", preferredFuel: "E10" });

    expect(created.status).toBe(201);
    const vehicleId = Number(created.body.data.id);
    createdVehicleIds.push(vehicleId);

    const fetched = await request(app)
      .get(`/api/v1/vehicles/${vehicleId}`)
      .set("Authorization", `Bearer ${session.token}`);

    expect(fetched.status).toBe(200);
    expect(fetched.body.data.id).toBe(vehicleId);

    const updated = await request(app)
      .patch(`/api/v1/vehicles/${vehicleId}`)
      .set("Authorization", `Bearer ${session.token}`)
      .send({ name: "Lifecycle Car Updated", preferredFuel: "SP95" });

    expect(updated.status).toBe(200);
    expect(updated.body.data.name).toBe("Lifecycle Car Updated");
    expect(updated.body.data.preferredFuel).toBe("SP95");

    const deleted = await request(app)
      .delete(`/api/v1/vehicles/${vehicleId}`)
      .set("Authorization", `Bearer ${session.token}`);

    expect(deleted.status).toBe(204);

    const afterDelete = await request(app)
      .get(`/api/v1/vehicles/${vehicleId}`)
      .set("Authorization", `Bearer ${session.token}`);

    expect(afterDelete.status).toBe(404);
  });

  it("supports fill-up creation and listing for owned vehicle", async () => {
    const session = await createUserSession("fillup-lifecycle");

    const vehicleResponse = await request(app)
      .post("/api/v1/vehicles")
      .set("Authorization", `Bearer ${session.token}`)
      .send({ name: "Fillup Car", preferredFuel: "E10" });

    expect(vehicleResponse.status).toBe(201);
    const vehicleId = Number(vehicleResponse.body.data.id);
    createdVehicleIds.push(vehicleId);

    const createdFillUp = await request(app)
      .post(`/api/v1/vehicles/${vehicleId}/fill-ups`)
      .set("Authorization", `Bearer ${session.token}`)
      .send({
        stationId,
        fuelType: "E10",
        kilometers: 15200,
        liters: 34.5,
        totalPrice: 63.95,
        date: "2026-04-27T12:00:00.000Z"
      });

    expect(createdFillUp.status).toBe(201);
    expect(createdFillUp.body.meta.pricingMode).toBe("manual");

    const listed = await request(app)
      .get(`/api/v1/vehicles/${vehicleId}/fill-ups?limit=20`)
      .set("Authorization", `Bearer ${session.token}`);

    expect(listed.status).toBe(200);
    expect(Array.isArray(listed.body.data)).toBe(true);
    expect(listed.body.data.length).toBeGreaterThan(0);
    expect(listed.body.data[0].vehicleId).toBe(vehicleId);
  });
});
