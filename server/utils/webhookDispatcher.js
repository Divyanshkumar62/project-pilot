const crypto = require("crypto");
const Webhook = require("../models/Webhook");
const { isSafeWebhookUrl } = require("./ssrfValidator");

async function dispatchWebhookEvent(projectId, eventName, data) {
  try {
    const webhooks = await Webhook.find({
      project: projectId,
      isActive: true,
      events: eventName,
    });

    if (!webhooks || webhooks.length === 0) return;

    for (const hook of webhooks) {
      try {
        if (!isSafeWebhookUrl(hook.targetUrl)) {
          console.warn(`[Webhook Dispatcher] Target URL prohibited by SSRF security policy: ${hook.targetUrl}`);
          continue;
        }

        const timestamp = new Date().toISOString();
        const basePayload = {
          event: eventName,
          projectId: projectId.toString(),
          timestamp,
          data,
        };

        const jsonString = JSON.stringify(basePayload);
        const headers = {
          "Content-Type": "application/json",
          "User-Agent": "ProjectPilot-Webhook-Dispatcher/1.0",
        };

        // HMAC-SHA256 signature if secret is configured
        if (hook.secret) {
          const hmac = crypto
            .createHmac("sha256", hook.secret)
            .update(jsonString)
            .digest("hex");
          headers["X-ProjectPilot-Signature"] = hmac;
        }

        // Format body for Discord or Slack if target is a known webhook URL
        let bodyPayload = jsonString;
        const url = hook.targetUrl.toLowerCase();
        if (url.includes("discord.com/api/webhooks")) {
          bodyPayload = JSON.stringify({
            content: `**[Project Pilot Alert]** Event \`${eventName}\` triggered in project \`${projectId}\`:\n${JSON.stringify(data, null, 2).slice(0, 500)}`,
          });
        } else if (url.includes("hooks.slack.com")) {
          bodyPayload = JSON.stringify({
            text: `*[Project Pilot Alert]* Event \`${eventName}\` in project \`${projectId}\`\n\`\`\`${JSON.stringify(data, null, 2).slice(0, 500)}\`\`\``,
          });
        }

        // Non-blocking fetch dispatch
        const response = await fetch(hook.targetUrl, {
          method: "POST",
          headers,
          body: bodyPayload,
        }).catch((e) => {
          console.error(`Webhook delivery network error to ${hook.targetUrl}:`, e.message);
          return { status: 500 };
        });

        console.log(`[Webhook Dispatcher] Event '${eventName}' dispatched to ${hook.targetUrl} - HTTP ${response?.status}`);

        hook.lastTriggeredAt = new Date();
        hook.lastResponseStatus = response?.status || 500;
        await hook.save().catch(() => {});
      } catch (hookErr) {
        console.error("Single webhook delivery error:", hookErr.message);
      }
    }
  } catch (err) {
    console.error("Webhook dispatch engine error:", err.message);
  }
}

module.exports = { dispatchWebhookEvent };
