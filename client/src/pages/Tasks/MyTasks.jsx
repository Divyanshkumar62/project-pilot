import React, { useState, useMemo } from "react";
import { useUserTasks, useUpdateTaskStatus } from "../../hooks/useTasks";
import Sidebar from "../../components/dashboard/Sidebar";
import { useDebounce } from "../../hooks/useDebounce";
import {
  LuSearch,
  LuFolder,
  LuCalendar,
  LuCircleCheck,
  LuCircle,
  LuRotateCcw,
  LuFilter,
  LuChevronDown,
  LuMessageSquare,
} from "react-icons/lu";

const MyTasks = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const debouncedSearch = useDebounce(search, 300);

  // Fetch all user tasks
  const { data: allTasks = [], isLoading, error } = useUserTasks();
  const updateTaskStatusMutation = useUpdateTaskStatus();

  // Status counts for filter chips
  const counts = useMemo(() => {
    return {
      all: allTasks.length,
      todo: allTasks.filter((t) => (t.status || "").toLowerCase() === "to do").length,
      inProgress: allTasks.filter((t) => (t.status || "").toLowerCase() === "in progress").length,
      completed: allTasks.filter((t) => (t.status || "").toLowerCase() === "completed").length,
    };
  }, [allTasks]);

  // Apply filters and sorting client-side
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...allTasks];

    // Search filter
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title?.toLowerCase().includes(q) ||
          task.description?.toLowerCase().includes(q) ||
          (typeof task.project === "object" && task.project?.title?.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (status) {
      filtered = filtered.filter((task) => (task.status || "").toLowerCase() === status.toLowerCase());
    }

    // Priority filter
    if (priority) {
      filtered = filtered.filter((task) => (task.priority || "").toLowerCase() === priority.toLowerCase());
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "title":
          aValue = a.title?.toLowerCase() || "";
          bValue = b.title?.toLowerCase() || "";
          return sortOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);

        case "status": {
          const statusOrder = { "to do": 1, "in progress": 2, completed: 3 };
          aValue = statusOrder[(a.status || "").toLowerCase()] || 0;
          bValue = statusOrder[(b.status || "").toLowerCase()] || 0;
          return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
        }

        case "priority": {
          const priorityOrder = { low: 1, medium: 2, high: 3 };
          aValue = priorityOrder[(a.priority || "").toLowerCase()] || 0;
          bValue = priorityOrder[(b.priority || "").toLowerCase()] || 0;
          return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
        }

        case "dueDate":
          aValue = a.dueDate ? new Date(a.dueDate).getTime() : 9999999999999;
          bValue = b.dueDate ? new Date(b.dueDate).getTime() : 9999999999999;
          return sortOrder === "asc" ? aValue - bValue : bValue - aValue;

        case "updatedAt":
          aValue = new Date(a.updatedAt || a.createdAt).getTime();
          bValue = new Date(b.updatedAt || b.createdAt).getTime();
          return sortOrder === "asc" ? aValue - bValue : bValue - aValue;

        default: // createdAt
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }
    });

    return filtered;
  }, [allTasks, debouncedSearch, status, priority, sortBy, sortOrder]);

  const handleStatusChange = (task, newStatus) => {
    const projectId = typeof task.project === "object" ? task.project?._id : task.project;
    updateTaskStatusMutation.mutate({
      projectId: projectId || task.projectId,
      taskId: task._id,
      status: newStatus,
    });
  };

  const handleToggleComplete = (task) => {
    const isCompleted = (task.status || "").toLowerCase() === "completed";
    const nextStatus = isCompleted ? "To Do" : "Completed";
    handleStatusChange(task, nextStatus);
  };

  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setPriority("");
    setSortBy("createdAt");
    setSortOrder("desc");
  };

  const hasActiveFilters = search || status || priority || sortBy !== "createdAt" || sortOrder !== "desc";

  const getPriorityBadge = (p) => {
    switch ((p || "").toLowerCase()) {
      case "high":
        return "bg-red-50 text-red-700 border-red-200";
      case "medium":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "low":
        return "bg-slate-50 text-slate-700 border-slate-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getStatusBadge = (s) => {
    switch ((s || "").toLowerCase()) {
      case "completed":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "in progress":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "to do":
        return "bg-amber-50 text-amber-800 border-amber-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const formatDueDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const isOverdue = d.getTime() < Date.now() && !d.toDateString().includes(new Date().toDateString());
    return {
      text: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      isOverdue,
    };
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex justify-center items-center text-slate-500 text-sm">
          Loading tasks...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex justify-center items-center text-red-500 text-sm">
          Error loading tasks: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                My Tasks
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage, prioritize, and track sprint deliverables
              </p>
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 p-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <LuRotateCcw size={13} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Status Quick Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <button
              onClick={() => setStatus("")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                status === ""
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-700 border border-slate-200 hover:border-blue-300"
              }`}
            >
              All Tasks ({counts.all})
            </button>
            <button
              onClick={() => setStatus("To Do")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                status === "To Do"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-white text-slate-700 border border-slate-200 hover:border-amber-300"
              }`}
            >
              To Do ({counts.todo})
            </button>
            <button
              onClick={() => setStatus("In Progress")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                status === "In Progress"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-700 border border-slate-200 hover:border-blue-300"
              }`}
            >
              In Progress ({counts.inProgress})
            </button>
            <button
              onClick={() => setStatus("Completed")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                status === "Completed"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-slate-700 border border-slate-200 hover:border-emerald-300"
              }`}
            >
              Completed ({counts.completed})
            </button>
          </div>

          {/* Search and Secondary Filter Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-6 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-lg">
              <input
                type="text"
                placeholder="Search tasks by title or project..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white text-slate-800 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-sm shadow-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400"
              />
              <LuSearch
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            {/* Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Priority */}
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="bg-white text-slate-800 border border-slate-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium shadow-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
              >
                <option value="">All Priorities</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>

              {/* Sort By */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">
                  Sort:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white text-slate-800 border border-slate-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium shadow-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
                >
                  <option value="createdAt">Date Created</option>
                  <option value="dueDate">Due Date</option>
                  <option value="priority">Priority</option>
                  <option value="status">Status</option>
                  <option value="title">Title</option>
                </select>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="bg-white text-slate-800 border border-slate-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium shadow-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>
          </div>

          {/* Task Cards List */}
          {filteredAndSortedTasks.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <p className="text-slate-500 text-sm">
                {search || status || priority
                  ? "No tasks found matching your filters."
                  : "No tasks assigned to your workspace yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAndSortedTasks.map((task) => {
                const isCompleted = (task.status || "").toLowerCase() === "completed";
                const dueDateInfo = formatDueDate(task.dueDate);
                const projectTitle =
                  typeof task.project === "object"
                    ? task.project?.title || "Engineering Workspace"
                    : "Engineering Workspace";

                return (
                  <div
                    key={task._id}
                    className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-300/90 shadow-xs hover:shadow-md transition-all p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                  >
                    {/* Left: Checkmark + Task Info */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      {/* One-click toggle completion */}
                      <button
                        type="button"
                        onClick={() => handleToggleComplete(task)}
                        className={`mt-0.5 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer flex-shrink-0 ${
                          isCompleted ? "text-emerald-600" : ""
                        }`}
                        title={isCompleted ? "Re-open task" : "Mark completed"}
                      >
                        {isCompleted ? (
                          <LuCircleCheck size={22} className="text-emerald-600" />
                        ) : (
                          <LuCircle size={22} className="hover:text-blue-600" />
                        )}
                      </button>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3
                            className={`text-sm sm:text-base font-bold text-slate-900 truncate ${
                              isCompleted ? "line-through text-slate-400 font-medium" : ""
                            }`}
                          >
                            {task.title}
                          </h3>

                          {task.priority && (
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getPriorityBadge(
                                task.priority
                              )}`}
                            >
                              {task.priority}
                            </span>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-xs text-slate-500 line-clamp-1 mb-2">
                            {task.description}
                          </p>
                        )}

                        {/* Metadata: Project & Due Date */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-medium">
                          <span className="inline-flex items-center gap-1.5 text-slate-600">
                            <LuFolder size={13} className="text-slate-400" />
                            <span className="truncate max-w-[200px]">{projectTitle}</span>
                          </span>

                          {dueDateInfo && (
                            <span
                              className={`inline-flex items-center gap-1.5 ${
                                dueDateInfo.isOverdue && !isCompleted
                                  ? "text-red-600 font-semibold"
                                  : "text-slate-500"
                              }`}
                            >
                              <LuCalendar size={13} />
                              <span>Due {dueDateInfo.text}</span>
                            </span>
                          )}

                          {task.commentsCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                              <LuMessageSquare size={12} />
                              <span>
                                {task.commentsCount}{" "}
                                {task.commentsCount === 1 ? "comment" : "comments"}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Interactive Status Updater */}
                    <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                      <div className="relative">
                        <select
                          value={task.status || "To Do"}
                          onChange={(e) => handleStatusChange(task, e.target.value)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-xl border appearance-none pr-7 transition-all cursor-pointer shadow-2xs outline-none focus:ring-2 focus:ring-blue-100 ${getStatusBadge(
                            task.status
                          )}`}
                        >
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                        <LuChevronDown
                          size={13}
                          className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyTasks;
