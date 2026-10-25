const Project = require("../models/Project");
const Task = require("../models/Task");
const Comment = require("../models/Comment");
const Webhook = require("../models/Webhook");
const Invitation = require("../models/Invitation");
const Activity = require("../models/Activity");
const TimeEntry = require("../models/TimeEntry");
const Notification = require("../models/Notification");
const User = require("../models/User");

const IMMUNE_EMAILS = [
  "alex.dev@projectpilot.test",
  "alex.dev@projectflow.test",
];

/**
 * Executes a 24-hour rolling cleanup job.
 * Deletes user-generated projects, tasks, comments, activities, and accounts
 * older than the retention window while protecting seed baseline demo data.
 *
 * @param {number} retentionHours - Retention period in hours (default: 24)
 * @returns {Promise<Object>} Statistics on deleted records
 */
async function runCleanupJob(retentionHours = 24) {
  try {
    const threshold = new Date(Date.now() - retentionHours * 60 * 60 * 1000);
    console.log(`[CleanupService] Initiating rolling cleanup for records older than ${threshold.toISOString()}...`);

    // 1. Locate all expired non-seed projects
    const expiredProjects = await Project.find({
      isSeed: false,
      createdAt: { $lt: threshold },
    }).select("_id");

    const expiredProjectIds = expiredProjects.map((p) => p._id);

    let purgedTasksCount = 0;
    let purgedCommentsCount = 0;
    let purgedWebhooksCount = 0;
    let purgedProjectsCount = 0;

    if (expiredProjectIds.length > 0) {
      // Delete tasks in expired projects
      const taskRes = await Task.deleteMany({ project: { $in: expiredProjectIds } });
      purgedTasksCount += taskRes.deletedCount || 0;

      // Delete comments in expired projects
      const commentRes = await Comment.deleteMany({ project: { $in: expiredProjectIds } });
      purgedCommentsCount += commentRes.deletedCount || 0;

      // Delete webhooks in expired projects
      const webhookRes = await Webhook.deleteMany({ project: { $in: expiredProjectIds } });
      purgedWebhooksCount += webhookRes.deletedCount || 0;

      // Delete invitations, activities, time entries
      await Invitation.deleteMany({ project: { $in: expiredProjectIds } });
      await Activity.deleteMany({ project: { $in: expiredProjectIds } });
      await TimeEntry.deleteMany({ project: { $in: expiredProjectIds } });

      // Delete the expired projects
      const projectRes = await Project.deleteMany({ _id: { $in: expiredProjectIds } });
      purgedProjectsCount += projectRes.deletedCount || 0;
    }

    // 2. Delete non-seed tasks older than retention threshold created inside surviving projects (e.g. seed project)
    const expiredStandaloneTasks = await Task.find({
      isSeed: false,
      createdAt: { $lt: threshold },
    }).select("_id project");

    if (expiredStandaloneTasks.length > 0) {
      const taskIds = expiredStandaloneTasks.map((t) => t._id);
      await Comment.deleteMany({ task: { $in: taskIds } });
      const delTasks = await Task.deleteMany({ _id: { $in: taskIds } });
      purgedTasksCount += delTasks.deletedCount || 0;

      // Remove deleted task references from project tasks arrays
      for (const t of expiredStandaloneTasks) {
        await Project.updateOne({ _id: t.project }, { $pull: { tasks: t._id } }).catch(() => {});
      }
    }

    // 3. Purge expired non-seed users older than retention threshold (excluding immune demo accounts)
    const purgedUsersRes = await User.deleteMany({
      isSeed: false,
      createdAt: { $lt: threshold },
      email: { $nin: IMMUNE_EMAILS },
    });
    const purgedUsersCount = purgedUsersRes.deletedCount || 0;

    // 4. Purge expired notifications older than retention threshold
    await Notification.deleteMany({ createdAt: { $lt: threshold } }).catch(() => {});

    console.log(
      `[CleanupService] Purge complete: ${purgedProjectsCount} projects, ${purgedTasksCount} tasks, ` +
      `${purgedCommentsCount} comments, ${purgedWebhooksCount} webhooks, ${purgedUsersCount} users purged.`
    );

    return {
      success: true,
      threshold: threshold.toISOString(),
      purgedProjectsCount,
      purgedTasksCount,
      purgedCommentsCount,
      purgedWebhooksCount,
      purgedUsersCount,
    };
  } catch (err) {
    console.error("[CleanupService] Error during rolling cleanup:", err.message);
    return { success: false, error: err.message };
  }
}

let cleanupInterval = null;

function startCleanupScheduler(intervalMs = 60 * 60 * 1000) {
  if (cleanupInterval) return;

  // Initial run after a short warm-up delay (10 seconds)
  setTimeout(() => {
    runCleanupJob().catch((e) => console.error("[CleanupService] Initial run failed:", e));
  }, 10000);

  // Periodic recurring run (defaults to every 60 minutes)
  cleanupInterval = setInterval(() => {
    runCleanupJob().catch((e) => console.error("[CleanupService] Scheduled run failed:", e));
  }, intervalMs);

  console.log("[CleanupService] 24-hour rolling cleanup scheduler active (checks every 60m)");
}

function stopCleanupScheduler() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

module.exports = {
  runCleanupJob,
  startCleanupScheduler,
  stopCleanupScheduler,
};
