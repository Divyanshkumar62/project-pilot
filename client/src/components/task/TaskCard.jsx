import React, { useState } from "react";
import { motion } from "framer-motion";
import { useFeedback } from "../../context/FeedbackContext";
import {
  LuSquarePen,
  LuTrash2,
  LuCalendar,
  LuUser,
  LuClock,
  LuGripVertical,
  LuMessageSquare,
  LuCheck,
} from "react-icons/lu";

const TaskCard = ({
  task,
  projectId,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const { showSuccess } = useFeedback();

  const priorityConfig = {
    High: {
      border: "border-l-rose-500",
      badge: "bg-rose-50 text-rose-700 border-rose-200",
    },
    Medium: {
      border: "border-l-amber-500",
      badge: "bg-amber-50 text-amber-800 border-amber-200",
    },
    Low: {
      border: "border-l-emerald-500",
      badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
  };

  const priorityStyle = priorityConfig[task.priority] || priorityConfig.Medium;

  const statusOptions = ["To Do", "In Progress", "Completed"];

  const getDaysUntilDue = () => {
    if (!task.dueDate) return null;
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const diffTime = dueDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0)
      return {
        text: `${Math.abs(diffDays)}d overdue`,
        color: "text-rose-600 bg-rose-50 border-rose-200",
      };
    if (diffDays === 0)
      return {
        text: "Due today",
        color: "text-amber-700 bg-amber-50 border-amber-200",
      };
    if (diffDays <= 3)
      return {
        text: `${diffDays}d left`,
        color: "text-amber-700 bg-amber-50 border-amber-200",
      };
    return {
      text: `${diffDays}d left`,
      color: "text-slate-600 bg-slate-50 border-slate-200",
    };
  };

  const dueDateInfo = getDaysUntilDue();

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.setData("text/plain", task._id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <motion.div
      layout
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs hover:shadow-md transition-shadow duration-150 border-l-4 ${
        priorityStyle.border
      } ${
        isDragging
          ? "opacity-50 scale-95 ring-2 ring-blue-500 shadow-xl rotate-1 cursor-grabbing"
          : "cursor-grab active:cursor-grabbing"
      } ${task.status === "Completed" ? "bg-slate-50/60" : ""}`}
    >
      {/* Top Header: Title, Priority, Actions */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-start gap-1.5 flex-1 min-w-0">
          <LuGripVertical
            size={16}
            className="text-slate-300 hover:text-slate-500 shrink-0 mt-0.5 cursor-grab"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4
                className={`font-bold text-sm leading-snug line-clamp-2 transition-all ${
                  task.status === "Completed"
                    ? "line-through text-slate-500"
                    : "text-slate-900"
                }`}
              >
                {task.title}
              </h4>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider shrink-0 ${
                  priorityStyle.badge
                }`}
              >
                {task.priority || "Medium"}
              </span>
              {task.status === "Completed" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <LuCheck size={11} className="stroke-[3]" />
                  Done
                </span>
              )}
            </div>
            {task.description && (
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Action buttons (Comments, Edit & Delete) */}
        <div className="flex items-center gap-1 shrink-0 ml-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onEdit) onEdit(task, "comments");
            }}
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all cursor-pointer border ${
              task.commentsCount > 0
                ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 shadow-2xs"
                : "text-slate-400 hover:text-blue-600 hover:bg-blue-50 border-transparent"
            }`}
            title={`${task.commentsCount || 0} Comments - Click to open discussion`}
            aria-label="Comments & Discussion"
          >
            <LuMessageSquare
              size={14}
              className={task.commentsCount > 0 ? "text-blue-600" : ""}
            />
            {task.commentsCount > 0 && (
              <span className="text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-blue-600 text-white leading-none">
                {task.commentsCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onEdit) onEdit(task, "details");
            }}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            title="Edit task"
            aria-label="Edit task"
          >
            <LuSquarePen size={14} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onDelete) onDelete(task);
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Delete task"
            aria-label="Delete task"
          >
            <LuTrash2 size={14} />
          </button>
        </div>
      </div>

      {/* Meta: Assignee and Due Date */}
      <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          {task.assignedTo?.name ? (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center">
                {task.assignedTo.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium text-slate-700 text-xs truncate max-w-[110px]">
                {task.assignedTo.name}
              </span>
            </div>
          ) : (
            <span className="text-slate-400 text-[11px] flex items-center gap-1">
              <LuUser size={12} />
              Unassigned
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {task.commentsCount > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onEdit) onEdit(task, "comments");
              }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200 transition-colors cursor-pointer"
              title="View comments discussion"
            >
              <LuMessageSquare size={11} />
              <span>
                {task.commentsCount}{" "}
                {task.commentsCount === 1 ? "comment" : "comments"}
              </span>
            </button>
          )}

          {dueDateInfo && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${dueDateInfo.color}`}
            >
              <LuClock size={11} />
              {dueDateInfo.text}
            </span>
          )}
        </div>
      </div>

      {/* Status Picker Selector */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Status
          </span>
          <select
            value={task.status || "To Do"}
            onChange={(e) => {
              e.stopPropagation();
              const newStatus = e.target.value;
              if (onStatusChange) {
                onStatusChange(task._id, newStatus);
              }
              if (newStatus === "Completed") {
                showSuccess(`Task "${task.title}" completed!`, {
                  description: "Sprint velocity updated.",
                });
              }
            }}
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg border cursor-pointer outline-none transition-colors ${
              task.status === "Completed"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : task.status === "In Progress"
                ? "bg-blue-50 text-blue-800 border-blue-200"
                : "bg-slate-100 text-slate-700 border-slate-300"
            }`}
          >
            {statusOptions.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <span className="text-[10px] text-slate-400">
          {task.createdAt &&
            new Date(task.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
        </span>
      </div>
    </motion.div>
  );
};

export default TaskCard;
