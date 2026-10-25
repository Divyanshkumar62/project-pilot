import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "../../hooks/useProjects";
import { useUserTasks } from "../../hooks/useTasks";
import { SkeletonStats } from "../ui/SkeletonCard";
import { on, joinProjectRoom } from "../../socket/socketClient";
import {
  LuTrendingUp,
  LuCircleCheck,
  LuClock,
  LuFolderKanban,
  LuActivity,
  LuRefreshCw,
  LuChevronRight,
  LuFlag,
} from "react-icons/lu";

const PRIORITY_BADGES = {
  high: "bg-rose-50 text-rose-700 border-rose-200",
  urgent: "bg-rose-50 text-rose-700 border-rose-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-blue-50 text-blue-700 border-blue-200",
};

const ProjectStats = () => {
  const navigate = useNavigate();
  const {
    data: projects = [],
    isLoading: projectsLoading,
    error: projectsError,
  } = useProjects();

  const {
    data: userTasks = [],
    isLoading: tasksLoading,
    error: tasksError,
  } = useUserTasks();

  const [recentActivities, setRecentActivities] = useState([]);

  // Socket room subscription for real-time task updates
  useEffect(() => {
    if (projects.length > 0) {
      projects.forEach((project) => {
        if (project?._id) joinProjectRoom(project._id);
      });
    }

    const handleTaskActivity = (action) => {
      const timestamp = new Date().toISOString();
      const getProjectName = (projectId) => {
        return (
          projects.find((p) => p._id === projectId)?.title || "Workspace"
        );
      };

      setRecentActivities((prev) => [
        {
          id: `${action.type}_${Date.now()}_${Math.random()}`,
          message:
            action.message ||
            `${action.type?.toLowerCase().replace("_", " ")} updated`,
          project: getProjectName(action.project),
          timestamp,
          type: action.type,
        },
        ...prev.slice(0, 5),
      ]);
    };

    const eventHandlers = [
      on("created", handleTaskActivity),
      on("updated", handleTaskActivity),
      on("deleted", handleTaskActivity),
    ];

    return () => {
      eventHandlers.forEach((unsubscribe) => unsubscribe && unsubscribe());
    };
  }, [projects]);

  // Accurate Case-Insensitive Calculations
  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const completedProjects = projects.filter(
      (p) => p.status?.toLowerCase() === "completed"
    ).length;

    const totalTasks = userTasks.length;
    const completedTasks = userTasks.filter(
      (t) => t.status?.toLowerCase() === "completed"
    ).length;
    const inProgressTasks = userTasks.filter(
      (t) => t.status?.toLowerCase() === "in progress"
    ).length;

    // The primary sprint velocity is task-based completion rate
    const sprintPercentage =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Filter active items (To Do or In Progress)
    const activeTasks = userTasks
      .filter((t) => t.status?.toLowerCase() !== "completed")
      .slice(0, 5);

    return {
      totalProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      sprintPercentage,
      activeTasks,
    };
  }, [projects, userTasks]);

  if (projectsLoading || tasksLoading) {
    return (
      <aside className="p-4 sm:p-6">
        <SkeletonStats />
      </aside>
    );
  }

  // SVG Circular Gauge parameters
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (stats.sprintPercentage / 100) * circumference;

  return (
    <aside className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-slate-200/90 flex flex-col space-y-6 m-4 xl:m-0 xl:mr-6 xl:my-6">
      {/* Widget Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Sprint Progress
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Live delivery velocity</p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <LuTrendingUp size={16} />
        </div>
      </div>

      {/* Error Banners */}
      {projectsError && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
          Projects Sync: {projectsError.message}
        </div>
      )}
      {tasksError && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
          Tasks Sync: {tasksError.message}
        </div>
      )}

      {/* Radial Progress Gauge */}
      <div className="flex flex-col items-center justify-center py-1">
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
            {/* Background Track */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              className="text-slate-100"
              strokeWidth="10"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Progress Bar */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              className="text-blue-600 transition-all duration-700 ease-out"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          {/* Center Metric */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.sprintPercentage}%
            </span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              Completed
            </span>
          </div>
        </div>

        {/* Quantified Subtext */}
        <div className="mt-4 text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
            <LuCircleCheck size={13} className="text-emerald-600" />
            <span>
              {stats.completedTasks} of {stats.totalTasks} Tasks Delivered
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {stats.completedProjects} of {stats.totalProjects} Workspaces Finalized
          </p>
        </div>
      </div>

      {/* Active Tasks List */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            In-Flight Tasks ({stats.activeTasks.length})
          </h3>
          <button
            onClick={() => navigate("/my-tasks")}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
          >
            View All
          </button>
        </div>

        <div className="space-y-2">
          {stats.activeTasks.length > 0 ? (
            stats.activeTasks.map((task) => {
              const priorityKey = task.priority?.toLowerCase() || "medium";
              const priorityClass =
                PRIORITY_BADGES[priorityKey] || PRIORITY_BADGES.medium;
              const targetProjectId = task.project?._id || task.project;

              return (
                <div
                  key={task._id}
                  onClick={() => {
                    if (targetProjectId) {
                      navigate(`/projects/${targetProjectId}`);
                    }
                  }}
                  className="p-3 bg-slate-50/70 hover:bg-slate-100/80 border border-slate-200/70 rounded-xl transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {task.title}
                    </p>
                    <LuChevronRight
                      size={14}
                      className="text-slate-400 group-hover:text-blue-600 shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5"
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[11px]">
                    <span
                      className={`px-2 py-0.5 rounded-md font-semibold border ${priorityClass}`}
                    >
                      {task.priority || "Medium"}
                    </span>
                    <span className="text-slate-500 flex items-center gap-1 font-medium">
                      <LuClock size={11} className="text-slate-400" />
                      {task.status}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-6 text-center border border-dashed border-slate-200 rounded-xl">
              <LuCircleCheck
                size={22}
                className="mx-auto text-emerald-500 mb-1"
              />
              <p className="text-xs font-semibold text-slate-700">
                All assigned tasks completed
              </p>
              <p className="text-[11px] text-slate-400">
                Create new tasks to plan next sprint.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Real-Time Recent Activity */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Workspace Activity
          </h3>
          <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>

        <div className="space-y-2">
          {recentActivities.length > 0 ? (
            recentActivities.map((act) => (
              <div
                key={act.id}
                className="p-2.5 bg-slate-50/60 border border-slate-200/60 rounded-xl text-xs space-y-1"
              >
                <p className="font-semibold text-slate-800 line-clamp-1">
                  {act.message}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="truncate max-w-[120px]">{act.project}</span>
                  <span>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-4 text-center text-slate-400 space-y-1">
              <LuActivity size={20} className="mx-auto text-slate-300" />
              <p className="text-[11px] font-medium text-slate-500">
                Sprint audit feed active
              </p>
              <p className="text-[10px] text-slate-400">
                Task events will stream in real-time.
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default ProjectStats;
