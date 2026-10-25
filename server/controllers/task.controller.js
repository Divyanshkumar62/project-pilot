const { validationResult } = require("express-validator");
const Task = require("../models/Task");
const Project = require("../models/Project");
const User = require("../models/User");
const Comment = require("../models/Comment");
const { createNotification } = require("./notification.controller");
const { logActivity } = require("./activity.controller");
const { dispatchWebhookEvent } = require("../utils/webhookDispatcher");

// Helper function to emit real-time updates
const emitTaskUpdate = (event, projectId, taskData) => {
  if (global.io) {
    global.io.to(`project_${projectId}`).emit(`task_${event}`, taskData);
  }
};

const createTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, dueDate, priority, assignedTo, status } = req.body;

  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({
        err: "Project not found!",
      });
    }

    // Check if user is project creator or team member
    const isCreator = project.createdBy.toString() === req.user.id;
    const isTeamMember = project.teamMembers && project.teamMembers.some(
      (member) => member.user.toString() === req.user.id
    );

    if (!isCreator && !isTeamMember) {
      return res.status(403).json({
        msg: "Not authorized to create tasks for this project!",
      });
    }

    // Enforce task creation limit per project in demo preview (max 50 tasks)
    const existingTaskCount = await Task.countDocuments({ project: req.params.projectId });
    if (existingTaskCount >= 50) {
      return res.status(400).json({
        err: "Task limit reached. Maximum 50 tasks per project in demo preview.",
      });
    }

    const task = new Task({
      title,
      description,
      dueDate: dueDate || new Date(),
      priority: priority || "Medium",
      status: status || "To Do",
      assignedTo: assignedTo || req.user.id,
      project: req.params.projectId,
    });

    await task.save();

    // Maintain tasks array on project
    if (!project.tasks) project.tasks = [];
    project.tasks.push(task._id);
    await project.save();

    // Notify assigned user if not self
    if (assignedTo && assignedTo !== req.user.id) {
      const assignedUser = await User.findById(assignedTo);
      if (assignedUser) {
        await createNotification({
          user: assignedUser._id,
          type: "TASK_ASSIGNED",
          message: `You have been assigned a new task '${title}' in project '${project.title}'.`,
          project: project._id,
        });
      }
    }

    // Log activity: task created
    await logActivity(
      project._id,
      req.user.id,
      "TASK_CREATED",
      `Task '${title}' created by ${req.user.id}`
    );

    // Emit real-time update
    emitTaskUpdate('created', project._id, task);

    // Dispatch webhook trigger
    dispatchWebhookEvent(project._id, "task.created", {
      taskId: task._id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignedTo,
    });

    res.status(201).json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Internal Server Error!" });
  }
};

const fetchTasks = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ err: "Project not found!" });
    }

    const isCreator = project.createdBy.toString() === req.user.id;
    const isTeamMember = project.teamMembers && project.teamMembers.some(
      (member) => member.user.toString() === req.user.id
    );

    if (!isCreator && !isTeamMember) {
      return res
        .status(403)
        .json({ msg: "Not authorized to view tasks for this project!" });
    }

    const {
      status,
      priority,
      assignee,
      dueBefore,
      q,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = { project: req.params.projectId };
    if (status && ["To Do", "In Progress", "Completed"].includes(status)) {
      filter.status = status;
    }
    if (priority && ["Low", "Medium", "High"].includes(priority)) {
      filter.priority = priority;
    }
    if (assignee) {
      filter.assignedTo = assignee;
    }
    if (dueBefore) {
      const date = new Date(dueBefore);
      if (!isNaN(date.getTime())) {
        filter.dueDate = { $lte: date };
      }
    }
    if (q && typeof q === "string" && q.trim().length > 0) {
      const keyword = q.replace(/[\$\^\*\(\)\[\]\{\}\|]/g, "");
      filter.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const tasks = await Task.find(filter)
      .populate("assignedTo", "name email")
      .skip(skip)
      .limit(parseInt(limit));

    const taskIds = tasks.map((t) => t._id);
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

    const tasksWithComments = tasks.map((t) => {
      const obj = t.toObject ? t.toObject() : { ...t };
      obj.commentsCount = countMap[t._id.toString()] || 0;
      return obj;
    });

    const total = await Task.countDocuments(filter);
    res.status(200).json({
      tasks: tasksWithComments,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error("❌ Error fetching tasks:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const fetchUserTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user.id }).populate(
      "project"
    );

    const taskIds = tasks.map((t) => t._id);
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

    const tasksWithComments = tasks.map((t) => {
      const obj = t.toObject ? t.toObject() : { ...t };
      obj.commentsCount = countMap[t._id.toString()] || 0;
      return obj;
    });

    res.status(200).json(tasksWithComments);
  } catch (err) {
    console.error("❌ Error fetching user tasks:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId).populate("assignedTo", "name email");
    if (!task) {
      return res.status(404).json({ msg: "Task not Found!" });
    }

    const projectId = req.params.projectId || task.project;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        err: "Project not found!",
      });
    }

    const isCreator = project.createdBy.toString() === req.user.id;
    const isTeamMember = project.teamMembers && project.teamMembers.some(
      (member) => member.user.toString() === req.user.id
    );

    if (!isCreator && !isTeamMember) {
      return res.status(403).json({
        msg: "Not authorized to view tasks for this project!",
      });
    }

    const count = await Comment.countDocuments({
      task: task._id,
      isDeleted: { $ne: true },
    });
    const taskObj = task.toObject ? task.toObject() : { ...task };
    taskObj.commentsCount = count;

    res.status(200).json(taskObj);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Internal Server Error!" });
  }
};

const updateTask = async (req, res) => {
  const { title, description, dueDate, status, priority, assignedTo } = req.body;
  const taskFields = {};
  if (title) taskFields.title = title;
  if (description) taskFields.description = description;
  if (dueDate) taskFields.dueDate = dueDate;
  if (status) taskFields.status = status;
  if (priority) taskFields.priority = priority;
  if (assignedTo) taskFields.assignedTo = assignedTo;

  try {
    let task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ msg: "Task not Found!" });
    }

    const projectId = req.params.projectId || task.project;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ err: "Project not found!" });
    }

    const isCreator = project.createdBy.toString() === req.user.id;
    const isTeamMember = project.teamMembers && project.teamMembers.some(
      (member) => member.user.toString() === req.user.id
    );

    if (!isCreator && !isTeamMember) {
      return res.status(403).json({
        msg: "Not authorized to update tasks for this project!",
      });
    }

    task = await Task.findByIdAndUpdate(
      req.params.taskId,
      { $set: taskFields },
      { new: true }
    );

    await logActivity(
      project._id,
      req.user.id,
      "TASK_UPDATED",
      `Task '${task.title}' updated by ${req.user.id}`
    );

    emitTaskUpdate('updated', project._id, task);

    // Dispatch webhook trigger
    if (task.status === "Completed") {
      dispatchWebhookEvent(project._id, "task.completed", {
        taskId: task._id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        projectId: project._id,
      });
    }

    dispatchWebhookEvent(project._id, "task.updated", {
      taskId: task._id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      projectId: project._id,
    });

    const count = await Comment.countDocuments({
      task: task._id,
      isDeleted: { $ne: true },
    });
    const taskObj = task.toObject ? task.toObject() : { ...task };
    taskObj.commentsCount = count;

    res.status(200).json(taskObj);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Internal Server Error!" });
  }
};

const deleteTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ msg: "Task not Found!" });
    }

    const projectId = req.params.projectId || task.project;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ err: "Project not found!" });
    }

    if (project.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        msg: "Only project owners can delete tasks!",
      });
    }

    await Task.findByIdAndDelete(req.params.taskId);

    // Remove task reference from project
    if (project.tasks && project.tasks.length > 0) {
      project.tasks.pull(task._id);
      await project.save();
    }

    await logActivity(
      project._id,
      req.user.id,
      "TASK_DELETED",
      `Task '${task.title}' deleted by ${req.user.id}`
    );

    emitTaskUpdate('deleted', project._id, { id: req.params.taskId });

    res.status(200).json({ msg: "Task Deleted!" });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Internal Server Error!" });
  }
};

const updateTaskStatus = async (req, res) => {
  const { status } = req.body;
  try {
    let task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ msg: "Task not Found!" });
    }

    const projectId = req.params.projectId || task.project;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ err: "Project not found!" });
    }

    const isCreator = project.createdBy.toString() === req.user.id;
    const isTeamMember = project.teamMembers && project.teamMembers.some(
      (member) => member.user.toString() === req.user.id
    );

    if (!isCreator && !isTeamMember) {
      return res.status(403).json({
        msg: "Not authorized to update tasks for this project!",
      });
    }

    const previousStatus = task.status;
    task.status = status;
    await task.save();

    await logActivity(
      project._id,
      req.user.id,
      "TASK_UPDATED",
      `Task '${task.title}' status changed from '${previousStatus}' to '${task.status}' by ${req.user.id}`
    );

    emitTaskUpdate('updated', project._id, task);

    // Dispatch webhook trigger
    if (task.status === "Completed") {
      dispatchWebhookEvent(project._id, "task.completed", {
        taskId: task._id,
        title: task.title,
        status: task.status,
        previousStatus,
        priority: task.priority,
        projectId: project._id,
      });
    }

    dispatchWebhookEvent(project._id, "task.updated", {
      taskId: task._id,
      title: task.title,
      status: task.status,
      previousStatus,
      priority: task.priority,
      projectId: project._id,
    });

    const count = await Comment.countDocuments({
      task: task._id,
      isDeleted: { $ne: true },
    });
    const taskObj = task.toObject ? task.toObject() : { ...task };
    taskObj.commentsCount = count;

    res.status(200).json(taskObj);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: "Internal Server Error!" });
  }
};

module.exports = {
  createTask,
  fetchTasks,
  fetchUserTasks,
  getTaskById,
  updateTask,
  deleteTask,
  updateTaskStatus,
};
