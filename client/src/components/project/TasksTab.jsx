import React, { useState, useEffect } from "react";
import {
  LuPlus,
  LuSearch,
  LuListChecks,
  LuClock,
  LuCircleCheck,
  LuCircleDot,
  LuLayers,
} from "react-icons/lu";
import TaskCard from "../task/TaskCard";
import SkeletonTask from "../ui/SkeltonTask";
import EditTaskModal from "../modals/EditTaskModal";
import DeleteConfirmationModal from "../modals/DeleteConfirmationModal";
import { useDeleteTask } from "../../hooks/useTasks";
import { useQueryClient } from "@tanstack/react-query";
import { useFeedback } from "../../context/FeedbackContext";

const TasksTab = ({
  tasks = [],
  isLoading,
  projectId,
  onTaskUpdate,
  onCreateTask,
}) => {
  const [localTasks, setLocalTasks] = useState(tasks);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [taskModalTab, setTaskModalTab] = useState("details");
  const [taskToDelete, setTaskToDelete] = useState(null);

  const queryClient = useQueryClient();
  const deleteTaskMutation = useDeleteTask();
  const { showSuccess, showDelete } = useFeedback();

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  // Filter tasks based on status and search query
  const filteredTasks = localTasks.filter((task) => {
    const matchesFilter = filter === "all" || task.status === filter;
    const matchesSearch =
      !searchTerm ||
      task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Group tasks by status
  const getTasksByStatus = (status) => {
    return filteredTasks.filter((task) => task.status === status);
  };

  const statusColumns = [
    {
      id: "To Do",
      title: "To Do",
      icon: LuCircleDot,
      badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
      columnBorder: "border-slate-200",
      hoverBg: "bg-slate-100/70",
    },
    {
      id: "In Progress",
      title: "In Progress",
      icon: LuClock,
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      columnBorder: "border-blue-200",
      hoverBg: "bg-blue-50/50",
    },
    {
      id: "Completed",
      title: "Completed",
      icon: LuCircleCheck,
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      columnBorder: "border-emerald-200",
      hoverBg: "bg-emerald-50/50",
    },
  ];

  // Drag and drop handlers
  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = (e, columnId) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setDragOverColumn(null);
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;

    const task = localTasks.find((t) => t._id === taskId);
    if (!task || task.status === targetStatus) return;

    // Optimistically update local tasks array immediately
    setLocalTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: targetStatus } : t))
    );

    // Call update handler
    if (onTaskUpdate) {
      onTaskUpdate(taskId, { status: targetStatus });
    }

    if (targetStatus === "Completed") {
      showSuccess(`Task "${task.title}" completed!`, {
        description: "Sprint velocity updated.",
      });
    }
  };

  // Status dropdown change handler from card
  const handleStatusChange = (taskId, newStatus) => {
    setLocalTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
    );

    if (onTaskUpdate) {
      onTaskUpdate(taskId, { status: newStatus });
    }
  };

  // Delete task confirmation handler
  const handleConfirmDeleteTask = async () => {
    if (!taskToDelete) return;
    const deletedId = taskToDelete._id;

    try {
      await deleteTaskMutation.mutateAsync({
        projectId,
        taskId: deletedId,
      });

      // Remove from local tasks immediately
      setLocalTasks((prev) => prev.filter((t) => t._id !== deletedId));
      queryClient.invalidateQueries(["tasks", projectId]);
      showDelete(`Task "${taskToDelete.title}" permanently deleted`, {
        description: "Sprint backlog updated.",
      });
      setTaskToDelete(null);
    } catch (err) {
      console.error("Failed to delete task:", err);
      alert(err?.message || "Failed to delete task. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              {[1, 2].map((j) => (
                <SkeletonTask key={j} />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const completedCount = localTasks.filter(
    (t) => t.status === "Completed"
  ).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Sprint Board & Tasks
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {localTasks.length} total work items • {completedCount} completed
          </p>
        </div>

        <button
          onClick={onCreateTask}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow-xs hover:shadow transition-all cursor-pointer"
        >
          <LuPlus size={18} />
          <span>Add Task</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search tasks by title or specifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm shadow-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400"
          />
          <LuSearch
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-white text-slate-900 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium shadow-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer sm:w-48"
        >
          <option value="all">All Statuses ({localTasks.length})</option>
          <option value="To Do">
            To Do ({getTasksByStatus("To Do").length})
          </option>
          <option value="In Progress">
            In Progress ({getTasksByStatus("In Progress").length})
          </option>
          <option value="Completed">
            Completed ({getTasksByStatus("Completed").length})
          </option>
        </select>
      </div>

      {/* Interactive Kanban Board with Native Drag & Drop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {statusColumns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          const isOverThisColumn = dragOverColumn === column.id;

          return (
            <div
              key={column.id}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={(e) => handleDragLeave(e, column.id)}
              onDrop={(e) => handleDrop(e, column.id)}
              className={`rounded-2xl p-4 transition-all duration-200 border-2 min-h-[460px] flex flex-col ${
                isOverThisColumn
                  ? `border-blue-500 bg-blue-50/60 ring-2 ring-blue-300 shadow-md`
                  : `border-slate-200/80 bg-slate-50/70`
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <column.icon size={16} className="text-slate-500" />
                  <h3 className="font-bold text-slate-800 text-sm">
                    {column.title}
                  </h3>
                </div>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${column.badgeColor}`}
                >
                  {columnTasks.length}
                </span>
              </div>

              {/* Tasks List / Drop Target */}
              <div className="space-y-3 flex-1">
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    projectId={projectId}
                    onEdit={(t, tab = "details") => {
                      setTaskToEdit(t);
                      setTaskModalTab(tab);
                    }}
                    onDelete={(t) => setTaskToDelete(t)}
                    onStatusChange={handleStatusChange}
                  />
                ))}

                {columnTasks.length === 0 && (
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors flex flex-col items-center justify-center min-h-[180px] ${
                      isOverThisColumn
                        ? "border-blue-400 bg-blue-100/40 text-blue-700"
                        : "border-slate-200 text-slate-400"
                    }`}
                  >
                    <p className="text-xs font-medium">
                      {isOverThisColumn
                        ? `Release to move to ${column.title}`
                        : `No ${column.title.toLowerCase()} tasks`}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Drag tasks here to update workflow
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Task Modal */}
      {taskToEdit && (
        <EditTaskModal
          task={taskToEdit}
          projectId={projectId}
          initialTab={taskModalTab}
          onTaskUpdated={(updatedTask) => {
            setLocalTasks((prev) =>
              prev.map((t) => (t._id === updatedTask._id ? { ...t, ...updatedTask } : t))
            );
            if (onTaskUpdate) {
              onTaskUpdate(updatedTask._id, updatedTask);
            }
          }}
          closeModal={() => {
            setTaskToEdit(null);
            queryClient.invalidateQueries(["tasks", projectId]);
          }}
        />
      )}

      {/* Delete Task Confirmation Modal */}
      {taskToDelete && (
        <DeleteConfirmationModal
          isOpen={true}
          onClose={() => setTaskToDelete(null)}
          onConfirm={handleConfirmDeleteTask}
          title="Delete Sprint Task"
          projectName={taskToDelete.title}
          message="Are you sure you want to permanently delete this task?"
          isDeleting={deleteTaskMutation.isPending}
        />
      )}
    </div>
  );
};

export default TasksTab;
