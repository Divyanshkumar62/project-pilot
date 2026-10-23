const request = require("supertest");
const { app } = require("../server");

describe("Health & Root API Endpoints", () => {
  it("GET /api/health should return 200 OK with service status", async () => {
    const res = await request(app).get("/api/health");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("status", "OK");
    expect(res.body).toHaveProperty("service", "ProjectFlow API");
    expect(res.body).toHaveProperty("timestamp");
  });

  it("GET /api/nonexistent-route should return 404", async () => {
    const res = await request(app).get("/api/nonexistent-route");
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message", "API endpoint not found");
  });
});
