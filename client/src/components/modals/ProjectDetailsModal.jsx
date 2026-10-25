import React, { useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import {
  LuX,
  LuCalendar,
  LuUsers,
  LuListChecks,
  LuArrowRight,
  LuClock,
  LuExternalLink,
} from "react-icons/lu";
import { useTasks } from "../../hooks/useTasks";
import { useNavigate } from "react-router-dom";

const ProjectDetailsModal = ({ project, closeModal }) => {
  const modalRef = useRef(null);
  const navigate = useNavigate();

  const { data: projectTasks = [], isLoading: tasksLoading } = useTasks(
    project._id
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        closeModal();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeModal]);

  const handleOpenBoard = (e) => {
    e.stopPropagation();
    closeModal();
    navigate(`/projects/${project._id}`);
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "in progress":
      case "active":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "medium":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "low":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const modalContent = (
    <div
      onClick={(e) => {
        e.stopPropagation();
        closeModal();
      }}
      className="fixed inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs z-[999999] p-4"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getStatusBadge(
                  project.status
                )}`}
              >
                {project.status || "Active"}
              </span>
              {project.priority && (
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider border ${getPriorityBadge(
                    project.priority
                  )}`}
                >
                  {project.priority} Priority
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {project.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenBoard}
              className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <LuExternalLink size={14} />
              <span>Open Board</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                closeModal();
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <LuX size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 border border-slate-200/70 p-3.5 rounded-xl">
              {project.description || "No project description provided."}
            </p>
          </div>

          {/* Dates & Timeline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200/70 p-3.5 rounded-xl">
              <span className="text-xs font-medium text-slate-500 block mb-1">
                Kickoff / Start Date
              </span>
              <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <LuCalendar size={15} className="text-blue-600" />
                {project.startDate
                  ? new Date(project.startDate).toLocaleDateString()
                  : "Not set"}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/70 p-3.5 rounded-xl">
              <span className="text-xs font-medium text-slate-500 block mb-1">
                Target Delivery Date
              </span>
              <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <LuClock size={15} className="text-amber-600" />
                {project.endDate
                  ? new Date(project.endDate).toLocaleDateString()
                  : "Open-ended sprint"}
              </span>
            </div>
          </div>

          {/* Tasks Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Sprint Tasks ({projectTasks.length})
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {projectTasks.filter((t) => (t.status || "").toLowerCase() === "completed").length}{" "}
                completed
              </span>
            </div>

            {tasksLoading ? (
              <div className="text-xs text-slate-400 py-4 text-center">
                Loading tasks...
              </div>
            ) : projectTasks.length === 0 ? (
              <div className="text-xs text-slate-500 p-4 bg-slate-50 rounded-xl text-center border border-slate-100">
                No tasks logged for this workspace yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {projectTasks.map((task) => (
                  <div
                    key={task._id}
                    className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {task.title}
                      </p>
                      {task.dueDate && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getPriorityBadge(
                          task.priority
                        )}`}
                      >
                        {task.priority || "Medium"}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700">
                        {task.status || "To Do"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs text-slate-500 font-medium">
            Created: {new Date(project.createdAt).toLocaleDateString()}
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                closeModal();
              }}
              className="bg-white hover:bg-slate-100 text-slate-700 font-semibold px-4 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleOpenBoard}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold px-4 py-2 rounded-xl text-xs sm:text-sm shadow-xs hover:shadow transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Go to Sprint Board</span>
              <LuArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default ProjectDetailsModal;
