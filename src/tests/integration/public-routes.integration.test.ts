import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../app";

describe("public routes integration", () => {
  it("returns ok on health endpoint", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  it("returns stations list for a valid radius query", async () => {
    const response = await request(app)
      .get("/api/v1/stations")
      .query({ lat: 48.8566, lng: 2.3522, radius: 5, limit: 5 });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
