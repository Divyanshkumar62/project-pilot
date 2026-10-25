const mongoose = require("mongoose");

const webhookSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    targetUrl: {
      type: String,
      required: true,
      trim: true,
    },
    secret: {
      type: String,
      trim: true,
      default: "",
    },
    events: {
      type: [String],
      enum: [
        "task.created",
        "task.updated",
        "task.completed",
        "milestone.created",
        "milestone.updated",
        "milestone.completed",
        "project.archived",
      ],
      default: ["task.created", "task.completed"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastTriggeredAt: {
      type: Date,
    },
    lastResponseStatus: {
      type: Number,
    },
  },
  { timestamps: true }
);

webhookSchema.index({ project: 1 });

module.exports = mongoose.model("Webhook", webhookSchema);
