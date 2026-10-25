const express = require("express");
const router = express.Router({ mergeParams: true });
const auth = require("../middleware/auth");
const { webhookLimiter } = require("../middleware/rateLimiter");
const {
  listWebhooks,
  createWebhook,
  deleteWebhook,
  testWebhook,
} = require("../controllers/webhook.controller");

router.get("/", auth, listWebhooks);
router.post("/", auth, createWebhook);
router.delete("/:webhookId", auth, deleteWebhook);
router.post("/:webhookId/test", auth, webhookLimiter, testWebhook);

module.exports = router;
