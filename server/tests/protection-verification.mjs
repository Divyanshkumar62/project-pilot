import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { isSafeWebhookUrl } from "../utils/ssrfValidator.js";
import User from "../models/User.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import Webhook from "../models/Webhook.js";
import Comment from "../models/Comment.js";
import { runCleanupJob } from "../services/cleanupService.js";

console.log("==================================================");
console.log("RUNNING SECURITY & CLEANUP VERIFICATION SUITE");
console.log("==================================================");

// 1. SSRF Validator Tests
console.log("\n[TEST 1] Testing SSRF and Loopback Target Filtering...");
assert.equal(isSafeWebhookUrl("http://localhost:5001/api"), false, "localhost must be blocked");
assert.equal(isSafeWebhookUrl("http://127.0.0.1:8080"), false, "127.0.0.1 must be blocked");
assert.equal(isSafeWebhookUrl("http://0.0.0.0:3000"), false, "0.0.0.0 must be blocked");
assert.equal(isSafeWebhookUrl("http://169.254.169.254/latest/meta-data/"), false, "AWS metadata 169.254.x.x must be blocked");
assert.equal(isSafeWebhookUrl("http://10.0.1.5:8000/hook"), false, "10.0.0.0/8 private network must be blocked");
assert.equal(isSafeWebhookUrl("http://192.168.1.100/webhook"), false, "192.168.0.0/16 private network must be blocked");
assert.equal(isSafeWebhookUrl("http://172.20.0.10:4000"), false, "172.16-31.x private network must be blocked");
assert.equal(isSafeWebhookUrl("http://internal.service.local/callback"), false, ".local domains must be blocked");
assert.equal(isSafeWebhookUrl("http://metadata.google.internal/computeMetadata/v1/"), false, ".internal domains must be blocked");
assert.equal(isSafeWebhookUrl("ftp://webhook.site/my-test"), false, "Non-HTTP/HTTPS protocol must be blocked");
assert.equal(isSafeWebhookUrl("https://webhook.site/a84c9820-2b10-449e-9e79-bc076e474514"), true, "Public HTTPS URL must be allowed");
assert.equal(isSafeWebhookUrl("https://discord.com/api/webhooks/123/xyz"), true, "Public Discord webhook URL must be allowed");
console.log("PASSED: All 12 SSRF test vectors validated successfully.");

// 2. Database & Seed Immunity Cleanup Tests
console.log("\n[TEST 2] Testing 24-Hour Rolling Cleanup with Seed Immunity...");
const mongo = await MongoMemoryServer.create();
await mongoose.connect(mongo.getUri());

// Seed data (immune)
const seedUser = await User.create({
  name: "Alex Dev",
  email: "alex.dev@projectpilot.test",
  password: "Password123!",
  role: "owner",
  isSeed: true,
});

const seedProject = await Project.create({
  title: "Engineering Platform Modernization",
  description: "Seed demo project",
  startDate: new Date(),
  createdBy: seedUser._id,
  isSeed: true,
});

const seedTask = await Task.create({
  title: "Permanent Seed Task",
  assignedTo: seedUser._id,
  project: seedProject._id,
  isSeed: true,
});

// Ephemeral user data (simulating created 25 hours ago)
const pastDate = new Date(Date.now() - 26 * 60 * 60 * 1000);

const expiredUser = await User.create({
  name: "Spam User",
  email: "spam.user@temporary.test",
  password: "Password123!",
  role: "member",
  isSeed: false,
  createdAt: pastDate,
});

const expiredProject = await Project.create({
  title: "Ephemeral Test Project",
  description: "To be cleaned up",
  startDate: pastDate,
  createdBy: expiredUser._id,
  isSeed: false,
  createdAt: pastDate,
});

const expiredTask = await Task.create({
  title: "Ephemeral Task",
  assignedTo: expiredUser._id,
  project: expiredProject._id,
  isSeed: false,
  createdAt: pastDate,
});

const expiredWebhook = await Webhook.create({
  project: expiredProject._id,
  targetUrl: "https://webhook.site/temp-test",
  events: ["task.created"],
  createdAt: pastDate,
});

// Add an expired non-seed task inside the seed project
const expiredTaskInSeedProject = await Task.create({
  title: "Temporary User Task in Seed Project",
  assignedTo: seedUser._id,
  project: seedProject._id,
  isSeed: false,
  createdAt: pastDate,
});

console.log("Initial state before cleanup:");
console.log(`Users: ${await User.countDocuments()}`);
console.log(`Projects: ${await Project.countDocuments()}`);
console.log(`Tasks: ${await Task.countDocuments()}`);
console.log(`Webhooks: ${await Webhook.countDocuments()}`);

assert.equal(await User.countDocuments(), 2);
assert.equal(await Project.countDocuments(), 2);
assert.equal(await Task.countDocuments(), 3);
assert.equal(await Webhook.countDocuments(), 1);

// Run rolling cleanup
const cleanupResult = await runCleanupJob(24);
console.log("Cleanup execution result:", cleanupResult);

assert.equal(cleanupResult.purgedProjectsCount, 1, "Expired project must be deleted");
assert.equal(cleanupResult.purgedTasksCount, 2, "Both expired tasks must be deleted");
assert.equal(cleanupResult.purgedWebhooksCount, 1, "Expired webhook must be deleted");
assert.equal(cleanupResult.purgedUsersCount, 1, "Expired spam user must be deleted");

// Verify Seed entities still exist intact
const survivingSeedUser = await User.findById(seedUser._id);
const survivingSeedProject = await Project.findById(seedProject._id);
const survivingSeedTask = await Task.findById(seedTask._id);

assert.ok(survivingSeedUser, "Seed user must be preserved");
assert.ok(survivingSeedProject, "Seed project must be preserved");
assert.ok(survivingSeedTask, "Seed task must be preserved");

// Verify expired entities are truly gone
const deadUser = await User.findById(expiredUser._id);
const deadProject = await Project.findById(expiredProject._id);
const deadTask = await Task.findById(expiredTask._id);
const deadWebhook = await Webhook.findById(expiredWebhook._id);

assert.equal(deadUser, null, "Expired user must be gone");
assert.equal(deadProject, null, "Expired project must be gone");
assert.equal(deadTask, null, "Expired task must be gone");
assert.equal(deadWebhook, null, "Expired webhook must be gone");

console.log("PASSED: 24-hour cleanup successfully purged expired records while granting full immunity to seed resources.");

await mongoose.disconnect();
await mongo.stop();

console.log("\n==================================================");
console.log("ALL PROTECTION & CLEANUP TESTS PASSED (100% GREEN)");
console.log("==================================================");
process.exit(0);
