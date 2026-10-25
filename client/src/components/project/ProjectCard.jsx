import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LuEllipsisVertical, LuArrowRight, LuKanban, LuClock } from "react-icons/lu";
import CreateTaskModal from "../../components/modals/CreateTaskModal";
import UpdateProjectModal from "../../components/modals/UpdateProjectModal";
import ProjectDetailsModal from "../../components/modals/ProjectDetailsModal";
import { useTasks } from "../../hooks/useTasks";

const ProjectCard = ({ project, onDelete, onUpdate }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const menuRef = useRef(null);

  // Fetch tasks using React Query
  const { data: projectTasks = [], isLoading: tasksLoading } = useTasks(project._id);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalTasks = projectTasks.length;
  const completedTasks = projectTasks.filter(
    (t) => (t.status || "").toLowerCase() === "completed"
  ).length;
  const inProgressTasks = projectTasks.filter(
    (t) => (t.status || "").toLowerCase() === "in progress"
  ).length;
  const toDoTasks = projectTasks.filter(
    (t) => (t.status || "").toLowerCase() === "to do"
  ).length;

  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleCardClick = (e) => {
    // If click originated from or targeted inside the action menu, do not navigate
    if (menuRef.current && menuRef.current.contains(e.target)) return;
    // If any modal or action menu is currently open on this card, suppress navigation
    if (isTaskModalOpen || isUpdateModalOpen || isDetailsModalOpen || isMenuOpen) return;
    navigate(`/projects/${project._id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-400/80 shadow-xs hover:shadow-lg transition-all duration-200 p-5 flex flex-col justify-between group cursor-pointer relative"
    >
      <div>
        {/* Top bar with tags and action dropdown */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                project.status === "Completed"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : project.status === "In Progress"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {project.status || "Active"}
            </span>

            {project.priority && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                {project.priority}
              </span>
            )}
          </div>

          {/* Action menu */}
          <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Project actions"
            >
              <LuEllipsisVertical size={18} />
            </button>

            {isMenuOpen && (
              <div
                className="absolute right-0 mt-1 w-44 bg-white shadow-xl rounded-xl p-1.5 z-40 border border-slate-200 text-xs font-medium text-slate-700 animate-fadeIn"
              >
                <button
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                  onClick={() => {
                    navigate(`/projects/${project._id}`);
                    setIsMenuOpen(false);
                  }}
                >
                  Open Sprint Board
                </button>
                <button
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  onClick={() => {
                    setIsDetailsModalOpen(true);
                    setIsMenuOpen(false);
                  }}
                >
                  View Details
                </button>
                <button
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  onClick={() => {
                    setIsTaskModalOpen(true);
                    setIsMenuOpen(false);
                  }}
                >
                  Create Task
                </button>
                <button
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  onClick={() => {
                    setIsUpdateModalOpen(true);
                    setIsMenuOpen(false);
                  }}
                >
                  Edit Project
                </button>
                <div className="my-1 border-t border-slate-100" />
                <button
                  className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  onClick={() => {
                    onDelete();
                    setIsMenuOpen(false);
                  }}
                >
                  Delete Project
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Title and Description */}
        <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
          {project.title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
          {project.description || "No project description provided."}
        </p>

        {/* Sprint Progress Section */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
            <span>Sprint Progress</span>
            <span className="text-slate-500 font-mono">
              {tasksLoading ? "..." : `${completedTasks}/${totalTasks} done (${completionPercent}%)`}
            </span>
          </div>

          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${completionPercent}%` }}
            />
          </div>

          {/* Quick status counters */}
          <div className="flex items-center gap-2 mt-3 text-[11px] font-medium">
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80">
              {toDoTasks} To Do
            </span>
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80">
              {inProgressTasks} In Progress
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80">
              {completedTasks} Done
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5 text-slate-400">
          <LuClock size={13} />
          <span>Active Sprint</span>
        </span>

        <span className="inline-flex items-center gap-1 text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform">
          <span>Open Board</span>
          <LuArrowRight size={13} />
        </span>
      </div>

      {/* Modals with isolated click propagation */}
      <div onClick={(e) => e.stopPropagation()}>
        {isTaskModalOpen && (
          <CreateTaskModal
            projectId={project._id}
            closeModal={() => setIsTaskModalOpen(false)}
          />
        )}
        {isUpdateModalOpen && (
          <UpdateProjectModal
            project={project}
            closeModal={() => setIsUpdateModalOpen(false)}
            onUpdate={onUpdate}
          />
        )}
        {isDetailsModalOpen && (
          <ProjectDetailsModal
            project={project}
            closeModal={() => setIsDetailsModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
