const request = require("supertest");
const { app } = require("../server");

describe("Task Endpoints (/api/tasks & /api/projects/:projectId/tasks)", () => {
  let token;
  let userId;
  let projectId;

  beforeEach(async () => {
    // Register user
    const signupRes = await request(app)
      .post("/api/auth/signup")
      .send({
        name: "Dev Lead",
        email: "lead@projectflow.test",
        password: "LeadPassword123!",
      });

    token = signupRes.body.token;
    userId = signupRes.body.user.id;

    // Create project
    const projRes = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Sprint 1 Work",
        description: "Sprint tasks and features",
        startDate: new Date().toISOString(),
      });

    projectId = projRes.body._id;
  });

  describe("POST /api/projects/:projectId/tasks", () => {
    it("should allow project creator to create a task", async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/tasks`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Implement Auth Middleware",
          description: "Verify JWT headers and role claims",
          priority: "High",
          status: "To Do",
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("_id");
      expect(res.body.title).toBe("Implement Auth Middleware");
      expect(res.body.priority).toBe("High");
      expect(res.body.status).toBe("To Do");
      expect(res.body.project.toString()).toBe(projectId);
    });

    it("should reject task creation with missing title", async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/tasks`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          description: "No title provided",
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("GET /api/projects/:projectId/tasks", () => {
    beforeEach(async () => {
      await request(app)
        .post(`/api/projects/${projectId}/tasks`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Task 1", priority: "Low", status: "To Do" });

      await request(app)
        .post(`/api/projects/${projectId}/tasks`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Task 2", priority: "High", status: "Completed" });
    });

    it("should fetch all tasks for the project", async () => {
      const res = await request(app)
        .get(`/api/projects/${projectId}/tasks`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.tasks.length).toBe(2);
    });

    it("should filter tasks by status", async () => {
      const res = await request(app)
        .get(`/api/projects/${projectId}/tasks?status=Completed`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.tasks.length).toBe(1);
      expect(res.body.tasks[0].title).toBe("Task 2");
    });
  });

  describe("PUT /api/tasks/:taskId/status", () => {
    it("should update task status", async () => {
      const taskRes = await request(app)
        .post(`/api/projects/${projectId}/tasks`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Status Change Task", status: "To Do" });

      const taskId = taskRes.body._id;

      const updateRes = await request(app)
        .put(`/api/tasks/${taskId}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "In Progress" });

      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.status).toBe("In Progress");
    });
  });
});
