const Webhook = require("../models/Webhook");
const Project = require("../models/Project");
const { isProjectMember, isProjectOwner } = require("../utils/rbac");
const { dispatchWebhookEvent } = require("../utils/webhookDispatcher");
const { isSafeWebhookUrl } = require("../utils/ssrfValidator");

const listWebhooks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (!isProjectMember(req.user.id, project)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const webhooks = await Webhook.find({ project: projectId }).sort({ createdAt: -1 });
    res.json(webhooks);
  } catch (err) {
    console.error("List webhooks error:", err);
    res.status(500).json({ message: "Failed to list webhooks" });
  }
};

const createWebhook = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { targetUrl, events, secret } = req.body;

    if (!targetUrl || !targetUrl.startsWith("http")) {
      return res.status(400).json({ message: "A valid HTTP/HTTPS webhook target URL is required" });
    }

    if (!isSafeWebhookUrl(targetUrl)) {
      return res.status(400).json({
        message: "Invalid webhook target URL. Private, loopback, and local network addresses are prohibited.",
      });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (!isProjectOwner(req.user.id, project)) {
      return res.status(403).json({ message: "Only workspace owners or managers can register webhooks" });
    }

    // Limit webhooks per project to 3 in demo preview mode
    const existingWebhooksCount = await Webhook.countDocuments({ project: projectId });
    if (existingWebhooksCount >= 3) {
      return res.status(400).json({
        message: "Webhook limit reached. Maximum 3 webhooks per project in demo preview.",
      });
    }

    const webhook = await Webhook.create({
      project: projectId,
      targetUrl: targetUrl.trim(),
      secret: (secret || "").trim(),
      events: Array.isArray(events) && events.length > 0 ? events : ["task.created", "task.completed"],
    });

    res.status(201).json(webhook);
  } catch (err) {
    console.error("Create webhook error:", err);
    res.status(500).json({ message: "Failed to create webhook" });
  }
};

const deleteWebhook = async (req, res) => {
  try {
    const { projectId, webhookId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (!isProjectOwner(req.user.id, project)) {
      return res.status(403).json({ message: "Only workspace owners can remove webhooks" });
    }

    await Webhook.findOneAndDelete({ _id: webhookId, project: projectId });
    res.json({ message: "Webhook deleted successfully" });
  } catch (err) {
    console.error("Delete webhook error:", err);
    res.status(500).json({ message: "Failed to delete webhook" });
  }
};

const testWebhook = async (req, res) => {
  try {
    const { projectId, webhookId } = req.params;
    const webhook = await Webhook.findOne({ _id: webhookId, project: projectId });
    if (!webhook) return res.status(404).json({ message: "Webhook not found" });

    if (!isSafeWebhookUrl(webhook.targetUrl)) {
      return res.status(400).json({
        message: "Prohibited target URL. Webhook dispatch blocked by security policy.",
      });
    }

    const testPayload = {
      action: "test.ping",
      message: "Project Pilot Webhook Test Ping",
      projectId,
      timestamp: new Date().toISOString(),
    };

    let deliveredStatus = 200;
    try {
      const response = await fetch(webhook.targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testPayload),
      });
      deliveredStatus = response.status;
    } catch (e) {
      deliveredStatus = 502;
    }

    webhook.lastTriggeredAt = new Date();
    webhook.lastResponseStatus = deliveredStatus;
    await webhook.save();

    res.json({
      success: deliveredStatus >= 200 && deliveredStatus < 300,
      statusCode: deliveredStatus,
      message: `Ping dispatched to ${webhook.targetUrl}. HTTP status: ${deliveredStatus}`,
    });
  } catch (err) {
    console.error("Test webhook error:", err);
    res.status(500).json({ message: "Failed to test webhook" });
  }
};

const listAllUserWebhooks = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { createdBy: req.user.id },
        { "teamMembers.user": req.user.id }
      ]
    }).select("_id title status");

    const projectIds = projects.map(p => p._id);
    const projectMap = new Map(projects.map(p => [p._id.toString(), p.title]));

    const webhooks = await Webhook.find({ project: { $in: projectIds } }).sort({ createdAt: -1 });

    const enriched = webhooks.map(w => ({
      _id: w._id,
      targetUrl: w.targetUrl,
      events: w.events,
      active: w.active,
      project: w.project,
      projectTitle: projectMap.get(w.project.toString()) || "Workspace Project",
      lastTriggeredAt: w.lastTriggeredAt,
      lastResponseStatus: w.lastResponseStatus,
      createdAt: w.createdAt,
    }));

    res.json(enriched);
  } catch (err) {
    console.error("List all user webhooks error:", err);
    res.status(500).json({ message: "Failed to list webhooks" });
  }
};

const testGlobalWebhook = async (req, res) => {
  try {
    const { webhookId } = req.params;
    const webhook = await Webhook.findById(webhookId);
    if (!webhook) return res.status(404).json({ message: "Webhook not found" });

    if (!isSafeWebhookUrl(webhook.targetUrl)) {
      return res.status(400).json({
        message: "Prohibited target URL. Webhook dispatch blocked by security policy.",
      });
    }

    const project = await Project.findById(webhook.project);
    if (!project || !isProjectMember(req.user.id, project)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const testPayload = {
      action: "test.ping",
      message: "Project Pilot Webhook Test Ping",
      projectId: webhook.project,
      timestamp: new Date().toISOString(),
    };

    let deliveredStatus = 200;
    try {
      const response = await fetch(webhook.targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testPayload),
      });
      deliveredStatus = response.status;
    } catch (e) {
      deliveredStatus = 502;
    }

    webhook.lastTriggeredAt = new Date();
    webhook.lastResponseStatus = deliveredStatus;
    await webhook.save();

    res.json({
      success: deliveredStatus >= 200 && deliveredStatus < 300,
      statusCode: deliveredStatus,
      message: `Ping dispatched to ${webhook.targetUrl}. HTTP status: ${deliveredStatus}`,
    });
  } catch (err) {
    console.error("Test global webhook error:", err);
    res.status(500).json({ message: "Failed to test webhook" });
  }
};

module.exports = {
  listWebhooks,
  createWebhook,
  deleteWebhook,
  testWebhook,
  listAllUserWebhooks,
  testGlobalWebhook,
};
