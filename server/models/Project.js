const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ["Planning", "Active", "Completed", "On Hold"],
    default: "Planning",
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Medium",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  teamMembers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["Owner", "Member"],
      default: "Member",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  tasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
  }],
  milestones: [{
    title: {
      type: String,
      required: true,
      maxlength: 100
    },
    description: {
      type: String,
      maxlength: 500
    },
    dueDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Overdue"],
      default: "Pending"
    },
    tasks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task"
    }],
    completedAt: Date,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  }],
  archived: {
    type: Boolean,
    default: false,
  },
  archivedAt: Date,
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  archiveReason: String,
  archiveData: {
    finalStats: {
      totalTasks: Number,
      completedTasks: Number,
      totalDays: Number,
      actualDays: Number
    },
    completionSummary: String,
    lessonsLearned: String
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Template"
  },
  isSeed: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true,
});

projectSchema.index({ createdBy: 1, archived: 1 });
projectSchema.index({ "teamMembers.user": 1, archived: 1 });
projectSchema.index({ status: 1, archived: 1 });

module.exports = mongoose.model("Project", projectSchema);
