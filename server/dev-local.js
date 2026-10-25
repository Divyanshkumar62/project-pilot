const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Project = require("./models/Project");
const Task = require("./models/Task");
const { startCleanupScheduler } = require("./services/cleanupService");
const { app, server } = require("./server");

const PORT = process.env.PORT || 5001;
process.env.JWT_SECRET = process.env.JWT_SECRET || "projectpilot_dev_jwt_secret_key_123456789";

async function startLocalDev() {
  console.log("⏳ Starting embedded local MongoDB engine...");
  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  console.log(`✅ MongoDB running in-memory at: ${mongoUri}`);

  await mongoose.connect(mongoUri);
  console.log("✅ Mongoose connected successfully");

  // Seed initial demo data
  console.log("🌱 Seeding initial demo data for local testing...");

  const demoUser = await User.create({
    name: "Alex Dev",
    email: "alex.dev@projectpilot.test",
    password: "Password123!",
    role: "owner",
    isSeed: true,
  });

  // Alias user for backwards compatibility with any active test sessions
  await User.create({
    name: "Alex Dev (Legacy)",
    email: "alex.dev@projectflow.test",
    password: "Password123!",
    role: "owner",
    isSeed: true,
  });

  const demoProject = await Project.create({
    title: "Engineering Platform Modernization",
    description: "Migrating legacy services, adding automated testing, and enhancing real-time Socket.io pipelines.",
    startDate: new Date(),
    status: "Active",
    priority: "High",
    createdBy: demoUser._id,
    teamMembers: [{ user: demoUser._id, role: "Owner" }],
    isSeed: true,
  });

  await Task.create([
    {
      title: "Implement Idempotency Filter for Payment Webhooks",
      description: "Enforce distributed Redis locking and unique request hash check",
      status: "To Do",
      priority: "High",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      assignedTo: demoUser._id,
      project: demoProject._id,
      isSeed: true,
    },
    {
      title: "Optimize MongoDB aggregation pipelines and compound indexes",
      description: "Analyze slow query execution plans and add compound indexes",
      status: "In Progress",
      priority: "High",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      assignedTo: demoUser._id,
      project: demoProject._id,
      isSeed: true,
    },
    {
      title: "Configure Helmet HTTP headers & express-rate-limit",
      description: "Hardened security posture against brute force and XSS attacks",
      status: "Completed",
      priority: "Medium",
      dueDate: new Date(),
      assignedTo: demoUser._id,
      project: demoProject._id,
      isSeed: true,
    },
    {
      title: "Automate CI/CD pipeline with GitHub Actions",
      description: "Run automated Jest suites and Vite client builds on pull requests",
      status: "Completed",
      priority: "Medium",
      dueDate: new Date(),
      assignedTo: demoUser._id,
      project: demoProject._id,
      isSeed: true,
    },
  ]);

  console.log("--------------------------------------------------");
  console.log("🎉 Local Demo Environment Ready!");
  console.log("👤 Demo Credentials:");
  console.log("   Email:    alex.dev@projectpilot.test");
  console.log("   Password: Password123!");
  console.log("--------------------------------------------------");

  server.listen(PORT, () => {
    console.log(`🚀 Project Pilot Server running at http://localhost:${PORT}`);
    console.log(`🔌 Socket.IO enabled on port ${PORT}`);
    console.log("--------------------------------------------------");
    startCleanupScheduler();
  });
}

startLocalDev().catch((err) => {
  console.error("❌ Failed to start local development server:", err);
  process.exit(1);
});
