const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Task = require("../models/Task");
const Comment = require("../models/Comment");
const Project = require("../models/Project");

// Default upload directory relative to server root
const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(__dirname, "../uploads");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_"));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Allowed: jpeg, jpg, png, pdf, doc, docx"), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter,
}).single("file");

// Helper to verify user access to project
const verifyProjectAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return false;
  const isCreator = project.createdBy.toString() === userId;
  const isMember = project.teamMembers && project.teamMembers.some(
    (member) => member.user.toString() === userId
  );
  return isCreator || isMember;
};

const uploadTaskAttachment = (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    try {
      const task = await Task.findById(req.params.taskId);
      if (!task) return res.status(404).json({ error: "Task not found" });

      const hasAccess = await verifyProjectAccess(task.project, req.user.id);
      if (!hasAccess) {
        // Clean up uploaded file if unauthorized
        const uploadedPath = path.join(UPLOAD_DIR, req.file.filename);
        if (fs.existsSync(uploadedPath)) fs.unlinkSync(uploadedPath);
        return res.status(403).json({ error: "Not authorized to modify tasks for this project" });
      }

      const attachment = {
        filename: req.file.filename,
        url: `/uploads/${req.file.filename}`,
        uploadedBy: req.user.id,
        createdAt: new Date(),
      };

      task.attachments.push(attachment);
      await task.save();
      res.status(201).json(attachment);
    } catch (e) {
      console.error("Upload task attachment error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });
};

const uploadCommentAttachment = (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    try {
      const comment = await Comment.findById(req.params.commentId);
      if (!comment) return res.status(404).json({ error: "Comment not found" });

      const task = await Task.findById(comment.task);
      if (!task) return res.status(404).json({ error: "Associated task not found" });

      const hasAccess = await verifyProjectAccess(task.project, req.user.id);
      if (!hasAccess) {
        const uploadedPath = path.join(UPLOAD_DIR, req.file.filename);
        if (fs.existsSync(uploadedPath)) fs.unlinkSync(uploadedPath);
        return res.status(403).json({ error: "Not authorized to comment or attach files on this project" });
      }

      const attachment = {
        filename: req.file.filename,
        url: `/uploads/${req.file.filename}`,
        uploadedBy: req.user.id,
        createdAt: new Date(),
      };

      comment.attachments.push(attachment);
      await comment.save();
      res.status(201).json(attachment);
    } catch (e) {
      console.error("Upload comment attachment error:", e);
      res.status(500).json({ error: "Server error" });
    }
  });
};

const deleteAttachment = async (req, res) => {
  try {
    const { attachmentId } = req.params;

    // 1. Try finding attachment inside Task
    const task = await Task.findOne({
      "attachments._id": attachmentId,
    });

    if (task) {
      const att = task.attachments.id(attachmentId);
      if (!att) return res.status(404).json({ error: "Attachment not found" });

      // Only uploader or project owner can delete
      if (att.uploadedBy.toString() !== req.user.id) {
        const project = await Project.findById(task.project);
        if (!project || project.createdBy.toString() !== req.user.id) {
          return res.status(403).json({ error: "Not authorized to delete this attachment" });
        }
      }

      // Delete file from filesystem
      const filePath = path.join(UPLOAD_DIR, att.filename);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (err) { /* ignore ENOENT */ }
      }

      // Mongoose 8 compatible pull
      task.attachments.pull({ _id: attachmentId });
      await task.save();
      return res.json({ success: true, message: "Attachment deleted successfully" });
    }

    // 2. Try finding attachment inside Comment
    const comment = await Comment.findOne({
      "attachments._id": attachmentId,
    });

    if (comment) {
      const att = comment.attachments.id(attachmentId);
      if (!att) return res.status(404).json({ error: "Attachment not found" });

      if (att.uploadedBy.toString() !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to delete this attachment" });
      }

      // Delete file from filesystem
      const filePath = path.join(UPLOAD_DIR, att.filename);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (err) { /* ignore ENOENT */ }
      }

      // Mongoose 8 compatible pull
      comment.attachments.pull({ _id: attachmentId });
      await comment.save();
      return res.json({ success: true, message: "Attachment deleted successfully" });
    }

    return res.status(404).json({ error: "Attachment not found" });
  } catch (e) {
    console.error("Delete attachment error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  uploadTaskAttachment,
  uploadCommentAttachment,
  deleteAttachment,
};
