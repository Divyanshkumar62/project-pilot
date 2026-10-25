import React, { useState, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ProjectList from "../../pages/Projects/ProjectList";
import CreateProjectModal from "../modals/CreateProjectModal";
import { useDebounce } from "../../hooks/useDebounce";
import { AuthContext } from "../../context/AuthContext";
import { useProjects } from "../../hooks/useProjects";
import { useUserTasks } from "../../hooks/useTasks";
import {
  LuSearch,
  LuPlus,
  LuFolderKanban,
  LuListTodo,
  LuCircleCheck,
  LuClock,
  LuLayoutTemplate,
  LuSquareCheck,
  LuArrowUpRight,
} from "react-icons/lu";

const MainContent = () => {
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const debouncedSearch = useDebounce(search, 300);

  const { data: projects = [] } = useProjects();
  const { data: userTasks = [] } = useUserTasks();

  // Aggregate executive metrics
  const metrics = useMemo(() => {
    const activeProjects = projects.filter((p) => !p.archived);
    const totalProjects = activeProjects.length;

    const totalTasks = userTasks.length;
    const completedTasks = userTasks.filter(
      (t) => t.status?.toLowerCase() === "completed"
    ).length;
    const inProgressTasks = userTasks.filter(
      (t) => t.status?.toLowerCase() === "in progress"
    ).length;
    const todoTasks = userTasks.filter(
      (t) => t.status?.toLowerCase() === "to do"
    ).length;

    const velocity =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      velocity,
    };
  }, [projects, userTasks]);

  const userName = auth.user?.name || "Engineer";

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-full space-y-6">
      {/* Executive Welcome & Context Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Workspace Overview
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {auth.user?.role || "Team Member"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {userName}
          </h1>
          <p className="text-slate-600 text-sm mt-1 max-w-2xl">
            Executive view of active sprint backlogs, team velocity, and managed agile workspaces.
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => navigate("/templates")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <LuLayoutTemplate size={14} className="text-slate-500" />
            <span>Templates</span>
          </button>
          <button
            onClick={() => navigate("/my-tasks")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <LuSquareCheck size={14} className="text-slate-500" />
            <span>My Tasks</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <LuPlus size={16} />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Workspaces */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Workspaces
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <LuFolderKanban size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {metrics.totalProjects}
            </span>
            <span className="text-xs text-slate-500 font-medium">active boards</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Active engineering projects</p>
        </div>

        {/* Backlog Volume */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Sprint Tasks
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <LuListTodo size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {metrics.totalTasks}
            </span>
            <span className="text-xs text-slate-500 font-medium">total backlog</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Assigned sprint work items</p>
        </div>

        {/* Tasks Delivered */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Completed
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <LuCircleCheck size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {metrics.completedTasks}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">
              {metrics.velocity}% velocity
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(metrics.velocity, 100)}%` }}
            />
          </div>
        </div>

        {/* In-Flight Work */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              In Progress
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <LuClock size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {metrics.inProgressTasks}
            </span>
            <span className="text-xs text-blue-600 font-semibold">in motion</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Active development items</p>
        </div>
      </div>

      {/* Workspaces Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Workspaces & Sprint Boards
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Launch sprint boards, manage milestones, and track agile execution
            </p>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="Search workspaces..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400"
              />
              <LuSearch
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 text-slate-700 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
              >
                <option value="createdAt">Date Created</option>
                <option value="updatedAt">Last Updated</option>
                <option value="title">Workspace Name</option>
                <option value="status">Status</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="bg-slate-50 text-slate-700 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Project Cards Grid */}
        <ProjectList
          searchQuery={debouncedSearch}
          sortBy={sortBy}
          sortOrder={sortOrder}
        />
      </div>

      {/* Create Project Modal */}
      {isModalOpen && (
        <CreateProjectModal closeModal={() => setIsModalOpen(false)} />
      )}
    </main>
  );
};

export default MainContent;
