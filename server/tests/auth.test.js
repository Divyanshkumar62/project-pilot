const request = require("supertest");
const { app } = require("../server");
const User = require("../models/User");

describe("Auth Endpoints (/api/auth)", () => {
  const testUser = {
    name: "Alex Dev",
    email: "alex.dev@projectpilot.test",
    password: "Password123!",
  };

  describe("POST /api/auth/signup", () => {
    it("should register a new user successfully", async () => {
      const res = await request(app)
        .post("/api/auth/signup")
        .send(testUser);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("token");
      expect(res.body.user).toHaveProperty("email", testUser.email);
      expect(res.body.user).toHaveProperty("name", testUser.name);
      expect(res.body.user).not.toHaveProperty("password");

      // Verify password hashed in database
      const dbUser = await User.findOne({ email: testUser.email });
      expect(dbUser).not.toBeNull();
      expect(dbUser.password).not.toBe(testUser.password);
    });

    it("should reject registration with duplicate email", async () => {
      // First registration
      await request(app).post("/api/auth/signup").send(testUser);

      // Attempt duplicate
      const res = await request(app).post("/api/auth/signup").send(testUser);
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it("should reject signup when required fields are missing", async () => {
      const res = await request(app)
        .post("/api/auth/signup")
        .send({ email: "incomplete@test.com" });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty("errors");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await request(app).post("/api/auth/signup").send(testUser);
    });

    it("should login successfully with valid credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body.user).toHaveProperty("email", testUser.email);
    });

    it("should reject login with wrong password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: "WrongPassword!",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("message");
    });

    it("should reject login for unregistered email", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "unknown@nowhere.test",
          password: "Password123!",
        });

      expect(res.statusCode).toBe(400);
    });
  });
});
