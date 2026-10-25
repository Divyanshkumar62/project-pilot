const { validationResult } = require("express-validator");
const Project = require("../models/Project");
const Task = require("../models/Task");
const Comment = require("../models/Comment");
const { createNotification } = require("./notification.controller");
const { logActivity } = require("./activity.controller");
const User = require("../models/User");
const { dispatchWebhookEvent } = require("../utils/webhookDispatcher");

// Rename project (Owner only)
const renameProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { newName } = req.body;
    if (!newName || !newName.trim()) {
      return res.status(400).json({ error: "New name required" });
    }
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (project.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only owner can rename" });
    }
    project.title = newName.trim();
    await project.save();
    res.json({ success: true, title: project.title });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Archive/unarchive project (Owner only)
const archiveProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { archived, reason, completionSummary, lessonsLearned } = req.body;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (project.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only owner can archive" });
    }
    project.archived = archived !== undefined ? !!archived : true;
    if (project.archived) {
      project.archivedAt = new Date();
      project.archivedBy = req.user.id;
      if (reason) project.archiveReason = reason;
      if (completionSummary || lessonsLearned) {
        project.archiveData = {
          completionSummary: completionSummary || "",
          lessonsLearned: lessonsLearned || "",
        };
      }
    }
    await project.save();
    if (project.archived) {
      dispatchWebhookEvent(project._id, "project.archived", {
        projectId: project._id,
        title: project.title,
        archiveReason: project.archiveReason,
      });
    }
    res.json({ success: true, archived: project.archived });
  } catch (err) {
    console.error("Archive project error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Transfer ownership (Owner only)
const transferOwnership = async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (project.createdBy.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Only owner can transfer ownership" });
    }
    // Check if userId is a team member
    const member = project.teamMembers.find(
      (m) => m.user.toString() === userId
    );
    if (!member)
      return res.status(400).json({ error: "User is not a team member" });
    // Set previous owner to Member
    const prevOwner = project.teamMembers.find(
      (m) => m.user.toString() === req.user.id
    );
    if (prevOwner) prevOwner.role = "Member";
    // Set new owner
    member.role = "Owner";
    project.createdBy = userId;
    await project.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};


// Rename project (Owner only)
exports.renameProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { newName } = req.body;
    if (!newName || !newName.trim()) {
      return res.status(400).json({ error: "New name required" });
    }
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (project.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only owner can rename" });
    }
    project.title = newName.trim();
    await project.save();
    res.json({ success: true, title: project.title });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Archive/unarchive project (Owner only)
exports.archiveProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { archived } = req.body;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (project.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only owner can archive" });
    }
    project.archived = !!archived;
    await project.save();
    res.json({ success: true, archived: project.archived });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Transfer ownership (Owner only)
exports.transferOwnership = async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (project.createdBy.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Only owner can transfer ownership" });
    }
    // Check if userId is a team member
    const member = project.teamMembers.find(
      (m) => m.user.toString() === userId
    );
    if (!member)
      return res.status(400).json({ error: "User is not a team member" });
    // Set previous owner to Member
    const prevOwner = project.teamMembers.find(
      (m) => m.user.toString() === req.user.id
    );
    if (prevOwner) prevOwner.role = "Member";
    // Set new owner
    member.role = "Owner";
    project.createdBy = userId;
    await project.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};


const createProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { title, description, startDate, endDate, teamMembers } = req.body;
  try {
    // Enforce project creation limit in preview mode (max 10 projects per user)
    const existingCount = await Project.countDocuments({ createdBy: req.user.id });
    if (existingCount >= 10) {
      return res.status(400).json({
        error: "Project limit reached. Maximum 10 projects per user in demo preview.",
      });
    }

    // Convert teamMembers array to include role structure
    const formattedTeamMembers = teamMembers
      ? teamMembers.map((memberId) => ({
          user: memberId,
          role: "Member",
        }))
      : [];

    const project = new Project({
      title,
      description,
      startDate,
      endDate,
      teamMembers: formattedTeamMembers,
      createdBy: req.user.id,
    });
    await project.save();

    // Log activity: project created
    await logActivity(
      project._id,
      req.user.id,
      "PROJECT_CREATED",
      `Project '${title}' created by ${req.user.id}`
    );

    // Populate team members for response
    await project.populate("teamMembers.user", "name email");
    res.status(201).json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      err: "Internal Server Error",
    });
  }
};

const getProject = async (req, res) => {
  try {
    // Query params
    const { q, page = 1, limit = 10 } = req.query;
    const query = {
      $or: [{ createdBy: req.user.id }, { "teamMembers.user": req.user.id }],
    };
    if (q && typeof q === "string" && q.trim().length > 0) {
      // Sanitize input
      const keyword = q.replace(/[\$\^\*\(\)\[\]\{\}\|]/g, "");
      query.$and = [
        {
          $or: [
            { title: { $regex: keyword, $options: "i" } },
            { description: { $regex: keyword, $options: "i" } },
          ],
        },
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const projects = await Project.find(query)
      .populate("teamMembers.user", "name email")
      .skip(skip)
      .limit(parseInt(limit));
    const total = await Project.countDocuments(query);
    res.status(200).json({
      projects,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      err: "Internal Server Error",
    });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("teamMembers.user", "name email");
    if (!project) {
      return res.status(404).json({ msg: "Project not found" });
    }

    // Check if user is creator or team member
    const isCreator = project.createdBy.toString() === req.user.id;
    const isTeamMember = project.teamMembers.some(
      (member) => member.user._id.toString() === req.user.id
    );

    if (!isCreator && !isTeamMember) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    // Load all tasks directly belonging to this project
    const projectTasks = await Task.find({ project: project._id })
      .populate("assignedTo", "name email");

    const projectObj = project.toObject();
    const taskIds = projectTasks.map((t) => t._id);
    const commentCounts = await Comment.aggregate([
      {
        $match: {
          task: { $in: taskIds },
          isDeleted: { $ne: true },
        },
      },
      {
        $group: {
          _id: "$task",
          count: { $sum: 1 },
        },
      },
    ]);
    const countMap = {};
    commentCounts.forEach((c) => {
      countMap[c._id.toString()] = c.count;
    });

    projectObj.tasks = projectTasks.map((t) => {
      const obj = t.toObject ? t.toObject() : { ...t };
      obj.commentsCount = countMap[t._id.toString()] || 0;
      return obj;
    });

    res.json(projectObj);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Project not found" });
    }
    res.status(500).json("Internal Server Error");
  }
};

const updateProject = async (req, res) => {
  const { title, description, startDate, endDate, teamMembers, status } =
    req.body;
  const projectFields = {};
  if (title) projectFields.title = title;
  if (description) projectFields.description = description;
  if (startDate) projectFields.startDate = startDate;
  if (endDate) projectFields.endDate = endDate;
  if (status) projectFields.status = status;
  if (teamMembers) {
    // Convert teamMembers array to include role structure
    projectFields.teamMembers = teamMembers.map((memberId) => ({
      user: memberId,
      role: "Member",
    }));
  }

  try {
    let project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ msg: "Project not found!" });
    }

    // Only Owner can update project
    if (project.createdBy.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ msg: "Only project owner can update this project" });
    }

    // Detect role changes and notify affected users
    const prevMembers = project.teamMembers.map((m) => m.user.toString());
    const newMembers = teamMembers
      ? teamMembers.map((id) => id.toString())
      : prevMembers;
    // Notify new members
    for (const memberId of newMembers) {
      if (!prevMembers.includes(memberId)) {
        await createNotification({
          user: memberId,
          type: "ROLE_UPDATED",
          message: `Your role or membership in project '${project.title}' has been updated.`,
          project: project._id,
        });
      }
    }
    project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: projectFields },
      { new: true }
    ).populate("teamMembers.user", "name email");

    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Internal Server Error");
  }
};

const deleteProject = async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ msg: "Project not found!" });
    }

    // Only Owner can delete project
    if (project.createdBy.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ msg: "Only project owner can delete this project" });
    }

    // Delete all tasks associated with this project
    const Task = require("../models/Task");
    await Task.deleteMany({ projectId: req.params.id });

    await Project.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      msg: "Project removed",
    });
  } catch (err) {
    console.error(`deletion error: `, err.message);
    res.status(500).json("Internal Server Error");
  }
};

// Dashboard analytics controller
const Activity = require("../models/Activity");

const getProjectDashboard = async (req, res) => {
  try {
    const { projectId } = req.params;
    // 1. Project info
    const project = await Project.findById(projectId)
      .populate("teamMembers.user", "name email")
      .lean();
    if (!project) return res.status(404).json({ msg: "Project not found" });

    // 2. Task stats
    const tasks = await Task.find({ project: projectId }).lean();
    const now = new Date();
    const taskStats = {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === "Completed").length,
      inProgress: tasks.filter((t) => t.status === "In Progress").length,
      todo: tasks.filter((t) => t.status === "To Do").length,
      overdue: tasks.filter(
        (t) => t.dueDate && t.dueDate < now && t.status !== "Completed"
      ).length,
    };

    // 3. Member stats
    const totalMembers = project.teamMembers.length;
    const roles = { owner: 0, members: 0 };
    project.teamMembers.forEach((m) => {
      if (m.role === "Owner") roles.owner += 1;
      else roles.members += 1;
    });

    // 4. Recent activity (limit 5)
    const recentActivity = await Activity.find({ project: projectId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name")
      .lean();
    const recentActivityFormatted = recentActivity.map((a) => ({
      message: a.message,
      user: { name: a.user?.name || "Unknown" },
      type: a.type,
      createdAt: a.createdAt,
    }));

    // 5. Upcoming deadlines (limit 3, not completed, sorted by dueDate)
    const upcomingDeadlines = tasks
      .filter((t) => t.dueDate && t.status !== "Completed" && t.dueDate > now)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 3)
      .map((t) => ({
        title: t.title,
        dueDate: t.dueDate,
        status: t.status,
      }));

    res.json({
      projectInfo: {
        name: project.title,
        description: project.description,
        createdAt: project.createdAt,
      },
      taskStats,
      memberStats: {
        totalMembers,
        roles,
      },
      recentActivity: recentActivityFormatted,
      upcomingDeadlines,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};



// Add milestone management
const addMilestone = async (req, res) => {
  try {
    const { title, description, dueDate, tasks } = req.body;
    const project = await Project.findById(req.params.projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isMember = project.teamMembers && project.teamMembers.some(member => 
      member.user.toString() === req.user.id
    );
    const isCreator = project.createdBy.toString() === req.user.id;

    if (!isMember && !isCreator) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    project.milestones.push({
      title,
      description,
      dueDate,
      tasks: tasks || []
    });

    await project.save();
    res.json(project.milestones[project.milestones.length - 1]);
  } catch (error) {
    console.error('Add milestone error:', error);
    res.status(500).json({ message: 'Error adding milestone' });
  }
};

const updateMilestone = async (req, res) => {
  try {
    const { projectId, milestoneId } = req.params;
    const { status } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isMember = project.teamMembers && project.teamMembers.some(member => 
      member.user.toString() === req.user.id
    );
    const isCreator = project.createdBy.toString() === req.user.id;

    if (!isMember && !isCreator) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const milestone = project.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    if (status === 'Completed') {
      milestone.status = 'Completed';
      milestone.completedAt = new Date();
      milestone.completedBy = req.user.id;
    } else {
      milestone.status = status;
    }

    await project.save();
    if (status === 'Completed') {
      dispatchWebhookEvent(project._id, "milestone.completed", {
        milestoneId,
        title: milestone.title,
        dueDate: milestone.dueDate,
      });
    }
    res.json(milestone);
  } catch (error) {
    console.error('Update milestone error:', error);
    res.status(500).json({ message: 'Error updating milestone' });
  }
};

// Delete milestone
const deleteMilestone = async (req, res) => {
  try {
    const { projectId, milestoneId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isMember = project.teamMembers && project.teamMembers.some(member => 
      member.user.toString() === req.user.id
    );
    const isCreator = project.createdBy.toString() === req.user.id;

    if (!isMember && !isCreator) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const milestone = project.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    project.milestones.pull(milestoneId);
    await project.save();
    res.json({ message: 'Milestone deleted successfully' });
  } catch (error) {
    console.error('Delete milestone error:', error);
    res.status(500).json({ message: 'Error deleting milestone' });
  }
};

module.exports = {
  createProject,
  getProject,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectDashboard,
  renameProject,
  archiveProject,
  transferOwnership,
  addMilestone,
  updateMilestone,
  deleteMilestone
};
