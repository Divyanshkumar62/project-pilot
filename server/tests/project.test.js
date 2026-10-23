const request = require("supertest");
const { app } = require("../server");

describe("Project Endpoints (/api/projects)", () => {
  let token;
  let userId;

  beforeEach(async () => {
    const signupRes = await request(app)
      .post("/api/auth/signup")
      .send({
        name: "Project Owner",
        email: "owner@projectflow.test",
        password: "SecurePassword123!",
      });

    token = signupRes.body.token;
    userId = signupRes.body.user.id;
  });

  describe("POST /api/projects", () => {
    it("should create a new project when authenticated", async () => {
      const res = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Core Platform Modernization",
          description: "Refactoring legacy endpoints and adding automated test suites",
          startDate: new Date().toISOString(),
          priority: "High",
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("_id");
      expect(res.body.title).toBe("Core Platform Modernization");
      expect(res.body.createdBy.toString()).toBe(userId);
    });

    it("should reject project creation without authentication", async () => {
      const res = await request(app)
        .post("/api/projects")
        .send({
          title: "Unauthorized Project",
          description: "Should fail",
          startDate: new Date().toISOString(),
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe("GET /api/projects", () => {
    it("should list projects for authenticated user", async () => {
      await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Project Alpha",
          description: "First project description",
          startDate: new Date().toISOString(),
        });

      const res = await request(app)
        .get("/api/projects")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.projects)).toBe(true);
      expect(res.body.projects.length).toBe(1);
      expect(res.body.projects[0].title).toBe("Project Alpha");
    });
  });

  describe("PUT /api/projects/:projectId/rename", () => {
    it("should allow project owner to rename project", async () => {
      const createRes = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Initial Name",
          description: "Initial description",
          startDate: new Date().toISOString(),
        });

      const projectId = createRes.body._id;

      const renameRes = await request(app)
        .put(`/api/projects/${projectId}/rename`)
        .set("Authorization", `Bearer ${token}`)
        .send({ newName: "Renamed Project" });

      expect(renameRes.statusCode).toBe(200);
      expect(renameRes.body.title).toBe("Renamed Project");
    });
  });
});
