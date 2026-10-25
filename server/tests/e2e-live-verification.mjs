import assert from "node:assert/strict";

const BASE_URL = "http://localhost:5001/api";

async function runLiveVerification() {
  console.log("==================================================");
  console.log("RUNNING LIVE END-TO-END SECURITY VERIFICATION");
  console.log("==================================================");

  // 1. Health check
  console.log("\n[STEP 1] Verifying /api/health endpoint...");
  const healthRes = await fetch(`${BASE_URL}/health`);
  assert.equal(healthRes.status, 200, "Health check must return 200");
  const healthData = await healthRes.json();
  assert.equal(healthData.service, "Project Pilot API");
  console.log("PASSED: Health check returned 200 OK.");

  // 2. Demo User Login
  console.log("\n[STEP 2] Authenticating as demo user alex.dev@projectpilot.test...");
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "alex.dev@projectpilot.test",
      password: "Password123!",
    }),
  });
  assert.equal(loginRes.status, 200, "Login must return 200");
  const loginData = await loginRes.json();
  const token = loginData.token;
  assert.ok(token, "JWT token must be present");
  console.log("PASSED: Demo user authenticated successfully.");

  // 3. Demo Account Lockdown - Attempt Password Change
  console.log("\n[STEP 3] Attempting password change on demo account...");
  const pwdRes = await fetch(`${BASE_URL}/users/me/password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      currentPassword: "Password123!",
      newPassword: "HackedPassword999!",
    }),
  });
  assert.equal(pwdRes.status, 403, "Demo user password update must return HTTP 403 Forbidden");
  const pwdData = await pwdRes.json();
  assert.equal(
    pwdData.message,
    "Demo account credentials are read-only in public preview mode."
  );
  console.log("PASSED: Demo account password modification rejected with HTTP 403 Forbidden.");

  // Get demo project
  const projectsRes = await fetch(`${BASE_URL}/projects`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const projectsData = await projectsRes.json();
  const demoProjectId = projectsData.projects[0]._id;
  console.log(`Targeting demo project: ${demoProjectId}`);

  // 4. SSRF Target Filtration - Localhost
  console.log("\n[STEP 4] Attempting to create webhook with localhost target URL...");
  const ssrf1 = await fetch(`${BASE_URL}/projects/${demoProjectId}/webhooks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      targetUrl: "http://localhost:5001/api/health",
      events: ["task.created"],
    }),
  });
  assert.equal(ssrf1.status, 400, "Localhost target must return 400");
  const ssrf1Data = await ssrf1.json();
  console.log("PASSED: Localhost target blocked with message:", ssrf1Data.message);

  // 5. SSRF Target Filtration - Cloud Metadata IP
  console.log("\n[STEP 5] Attempting to create webhook with AWS metadata IP (169.254.169.254)...");
  const ssrf2 = await fetch(`${BASE_URL}/projects/${demoProjectId}/webhooks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      targetUrl: "http://169.254.169.254/latest/meta-data/",
      events: ["task.created"],
    }),
  });
  assert.equal(ssrf2.status, 400, "Metadata IP target must return 400");
  const ssrf2Data = await ssrf2.json();
  console.log("PASSED: Cloud metadata IP blocked with message:", ssrf2Data.message);

  // 6. Legitimate Webhooks and Cap of 3
  console.log("\n[STEP 6] Testing valid webhook creation and maximum 3 webhooks cap...");
  const validHooks = [];
  for (let i = 1; i <= 3; i++) {
    const res = await fetch(`${BASE_URL}/projects/${demoProjectId}/webhooks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        targetUrl: `https://webhook.site/test-hook-${i}-${Date.now()}`,
        events: ["task.created", "task.completed"],
        secret: `secret_${i}`,
      }),
    });
    assert.equal(res.status, 201, `Webhook ${i} must be created with 201`);
    const hook = await res.json();
    validHooks.push(hook);
  }
  console.log("Created 3 legitimate webhooks.");

  // Attempt 4th webhook - must fail with 400
  const overflowRes = await fetch(`${BASE_URL}/projects/${demoProjectId}/webhooks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      targetUrl: "https://webhook.site/overflow-hook",
      events: ["task.created"],
    }),
  });
  assert.equal(overflowRes.status, 400, "4th webhook must be rejected with 400");
  const overflowData = await overflowRes.json();
  assert.equal(
    overflowData.message,
    "Webhook limit reached. Maximum 3 webhooks per project in demo preview."
  );
  console.log("PASSED: 4th webhook rejected with message:", overflowData.message);

  // 7. Verify global webhook listing
  console.log("\n[STEP 7] Verifying aggregated webhooks for Settings view...");
  const listRes = await fetch(`${BASE_URL}/webhooks`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(listRes.status, 200);
  const allHooks = await listRes.json();
  assert.equal(allHooks.length, 3, "All 3 active webhooks must be returned in settings");
  console.log("PASSED: Settings view retrieves exactly 3 configured webhooks.");

  console.log("\n==================================================");
  console.log("ALL LIVE END-TO-END VERIFICATION CHECKS PASSED!");
  console.log("==================================================");
  process.exit(0);
}

runLiveVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
