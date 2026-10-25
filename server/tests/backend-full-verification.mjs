import assert from "node:assert/strict";

const BASE_URL = "http://localhost:5001/api";

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const config = {
    method: options.method || "GET",
    headers,
  };
  if (options.body) {
    config.body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
  }
  const res = await fetch(url, config);
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, ok: res.ok, headers: res.headers, data };
}

async function runBackendVerification() {
  console.log("==================================================");
  console.log("PROJECT PILOT - BACKEND LOGIC VERIFICATION SUITE");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  async function check(name, fn) {
    try {
      process.stdout.write(`Testing: ${name}... `);
      await fn();
      console.log("PASSED");
      passed++;
    } catch (err) {
      console.log(`FAILED\n  Error: ${err.message}`);
      failed++;
    }
  }

  // 1. Health check
  await check("GET /health returns Project Pilot API service status", async () => {
    const res = await request("/health");
    assert.equal(res.status, 200);
    assert.equal(res.data.status, "OK");
    assert.equal(res.data.service, "Project Pilot API");
  });

  // 2. Demo User Login
  let alexToken;
  let alexUser;
  await check("POST /auth/login with primary demo user (alex.dev@projectpilot.test)", async () => {
    const res = await request("/auth/login", {
      method: "POST",
      body: {
        email: "alex.dev@projectpilot.test",
        password: "Password123!",
      },
    });
    assert.equal(res.status, 200);
    assert(res.data.token, "Expected token in login response");
    assert.equal(res.data.user.email, "alex.dev@projectpilot.test");
    alexToken = res.data.token;
    alexUser = res.data.user;
  });

  // 3. Legacy Demo User Alias Login
  await check("POST /auth/login with backwards-compatible alias (alex.dev@projectflow.test)", async () => {
    const res = await request("/auth/login", {
      method: "POST",
      body: {
        email: "alex.dev@projectflow.test",
        password: "Password123!",
      },
    });
    assert.equal(res.status, 200);
    assert(res.data.token, "Expected token in alias login response");
  });

  // 4. Invalid Password Rejection
  await check("POST /auth/login rejects wrong password with 400", async () => {
    const res = await request("/auth/login", {
      method: "POST",
      body: {
        email: "alex.dev@projectpilot.test",
        password: "WrongPassword999!",
      },
    });
    assert.equal(res.status, 400);
    assert(!res.data.token, "Should not return token on wrong password");
  });

  // 5. New User Account Registration (User 1 - Sarah Connor)
  const user1Email = `sarah.connor.${Date.now()}@testcorp.com`;
  let user1Token;
  let user1Id;
  await check("POST /auth/signup registers a brand new user account", async () => {
    const res = await request("/auth/signup", {
      method: "POST",
      body: {
        name: "Sarah Connor",
        email: user1Email,
        password: "Cyberdyne1234!",
      },
    });
    assert.equal(res.status, 201);
    assert(res.data.token, "Expected token for new signup");
    assert.equal(res.data.user.email, user1Email);
    assert.equal(res.data.user.name, "Sarah Connor");
    assert.equal(res.data.user.password, undefined, "Password must not be returned");
    user1Token = res.data.token;
    user1Id = res.data.user.id || res.data.user._id;
  });

  // 6. Duplicate Registration Prevention
  await check("POST /auth/signup rejects duplicate email registration", async () => {
    const res = await request("/auth/signup", {
      method: "POST",
      body: {
        name: "Sarah Clone",
        email: user1Email,
        password: "AnotherPassword123!",
      },
    });
    assert.equal(res.status, 400);
    assert.match(res.data.message || res.data.msg || "", /already registered|exists/i);
  });

  // 7. Login with newly registered user
  await check("POST /auth/login succeeds for newly registered user", async () => {
    const res = await request("/auth/login", {
      method: "POST",
      body: {
        email: user1Email,
        password: "Cyberdyne1234!",
      },
    });
    assert.equal(res.status, 200);
    assert(res.data.token);
    assert.equal(res.data.user.email, user1Email);
  });

  // 8. Register User 2 (John Reese)
  const user2Email = `john.reese.${Date.now()}@security.test`;
  let user2Token;
  let user2Id;
  await check("POST /auth/signup registers second independent user", async () => {
    const res = await request("/auth/signup", {
      method: "POST",
      body: {
        name: "John Reese",
        email: user2Email,
        password: "MachinePassword123!",
      },
    });
    assert.equal(res.status, 201);
    user2Token = res.data.token;
    user2Id = res.data.user.id || res.data.user._id;
  });

  // 9. Unauthorized request rejection without token
  await check("GET /projects rejects unauthenticated request with 401", async () => {
    const res = await request("/projects");
    assert.equal(res.status, 401);
  });

  // 10. Malformed token rejection
  await check("GET /projects rejects malformed authorization token with 401", async () => {
    const res = await request("/projects", {
      headers: { Authorization: "Bearer malformed.invalid.token123" },
    });
    assert.equal(res.status, 401);
  });

  // 11. User 1 creates a project
  let user1ProjectId;
  await check("POST /projects: User 1 creates Project Alpha", async () => {
    const res = await request("/projects", {
      method: "POST",
      headers: { Authorization: `Bearer ${user1Token}` },
      body: {
        title: "Project Alpha: AI Telemetry Core",
        description: "Autonomous pipeline monitoring and real-time sprint execution",
        startDate: new Date().toISOString(),
        priority: "High",
      },
    });
    assert.equal(res.status, 201);
    assert.equal(res.data.title, "Project Alpha: AI Telemetry Core");
    user1ProjectId = res.data._id;
  });

  // 12. User 2 cannot access User 1's project (Tenant & Workspace Isolation)
  await check("GET /projects/:id: User 2 is denied access to User 1's project", async () => {
    const res = await request(`/projects/${user1ProjectId}`, {
      headers: { Authorization: `Bearer ${user2Token}` },
    });
    assert([401, 403].includes(res.status), `Expected 401 or 403, got ${res.status}`);
  });

  // 13. User 1 adds User 2 as a team member
  await check("PUT /projects/:id: User 1 adds User 2 as Member", async () => {
    const res = await request(`/projects/${user1ProjectId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${user1Token}` },
      body: {
        teamMembers: [user2Id],
      },
    });
    assert.equal(res.status, 200);
  });

  // 14. User 2 can now access the project
  await check("GET /projects/:id: User 2 can access Project Alpha after addition", async () => {
    const res = await request(`/projects/${user1ProjectId}`, {
      headers: { Authorization: `Bearer ${user2Token}` },
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.title, "Project Alpha: AI Telemetry Core");
  });

  // 15. User 1 creates a task
  let taskId;
  await check("POST /projects/:id/tasks: User 1 creates task", async () => {
    const res = await request(`/projects/${user1ProjectId}/tasks`, {
      method: "POST",
      headers: { Authorization: `Bearer ${user1Token}` },
      body: {
        title: "Implement High-Frequency Socket Heartbeat",
        description: "Zero-latency connection recovery across browser tabs",
        priority: "High",
        status: "To Do",
      },
    });
    assert.equal(res.status, 201);
    taskId = res.data._id;
  });

  // 16. User 2 adds a comment to the task
  let commentId;
  await check("POST /tasks/:taskId/comments: User 2 comments on task", async () => {
    const res = await request(`/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { Authorization: `Bearer ${user2Token}` },
      body: {
        content: "Heartbeat protocol verified on edge nodes. Ready for staging review.",
      },
    });
    assert.equal(res.status, 201);
    assert.equal(res.data.content, "Heartbeat protocol verified on edge nodes. Ready for staging review.");
    commentId = res.data._id;
  });

  // 17. Comment counter aggregation
  await check("GET /projects/:id/tasks: Task reflects commentsCount === 1", async () => {
    const res = await request(`/projects/${user1ProjectId}/tasks`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    assert.equal(res.status, 200);
    const task = res.data.tasks.find((t) => t._id === taskId);
    assert.equal(task?.commentsCount, 1);
  });

  // 18. Task status transition via PUT /status
  await check("PUT /projects/:id/tasks/:taskId/status: Updates status to In Progress", async () => {
    const res = await request(`/projects/${user1ProjectId}/tasks/${taskId}/status`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${user2Token}` },
      body: { status: "In Progress" },
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.status, "In Progress");
  });

  // 19. Task status transition to Completed
  await check("PUT /projects/:id/tasks/:taskId/status: Updates status to Completed", async () => {
    const res = await request(`/projects/${user1ProjectId}/tasks/${taskId}/status`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${user2Token}` },
      body: { status: "Completed" },
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.status, "Completed");
  });

  // 20. RBAC: User 2 (Member) cannot delete the task (Only Owner allowed)
  await check("DELETE /projects/:id/tasks/:taskId: User 2 is forbidden from deleting task", async () => {
    const res = await request(`/projects/${user1ProjectId}/tasks/${taskId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${user2Token}` },
    });
    assert([401, 403].includes(res.status), `Expected 401 or 403, got ${res.status}`);
  });

  // 21. User 1 (Owner) can delete the task
  await check("DELETE /projects/:id/tasks/:taskId: User 1 (Owner) deletes task", async () => {
    const res = await request(`/projects/${user1ProjectId}/tasks/${taskId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    assert.equal(res.status, 200);
  });

  console.log("==================================================");
  console.log(`TOTAL CHECKS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runBackendVerification().catch((err) => {
  console.error("FATAL VERIFICATION RUNNER ERROR:", err);
  process.exit(1);
});
