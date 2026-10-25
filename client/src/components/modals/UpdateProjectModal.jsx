import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { useUpdateProject } from "../../hooks/useProjects";
import {
  LuSquarePen,
  LuX,
  LuCalendar,
  LuSparkles,
  LuCircleAlert,
  LuCheck,
} from "react-icons/lu";

const UpdateProjectModal = ({ project, closeModal, onUpdate }) => {
  const updateProjectMutation = useUpdateProject();
  const [formData, setFormData] = useState({
    title: project.title || "",
    description: project.description || "",
    startDate: project.startDate ? project.startDate.split("T")[0] : "",
    endDate: project.endDate ? project.endDate.split("T")[0] : "",
    status: project.status || "Planning",
    priority: project.priority || "Medium",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        closeModal();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeModal]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setErrorMessage("");

    if (!formData.title.trim()) {
      setErrorMessage("Project Title is required.");
      return;
    }

    try {
      await updateProjectMutation.mutateAsync({
        projectId: project._id,
        data: {
          title: formData.title.trim(),
          description: formData.description.trim(),
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
          status: formData.status,
          priority: formData.priority,
        },
      });

      if (typeof onUpdate === "function") {
        onUpdate();
      }
      closeModal();
    } catch (err) {
      console.error("Error updating project:", err);
      setErrorMessage(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update workspace. Please try again."
      );
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
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
              <LuSquarePen size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Edit Project Workspace
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Update project details, sprint timeline, and workflow status.
              </p>
            </div>
          </div>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3 flex items-start gap-2">
              <LuCircleAlert size={16} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Project Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Project Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              placeholder="e.g. Platform Modernization"
              value={formData.title}
              onChange={handleChange}
              className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm shadow-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400"
              required
            />
          </div>

          {/* Project Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Project Description
            </label>
            <textarea
              name="description"
              placeholder="Project goals, deliverable scope, and sprint objectives..."
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm shadow-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400 leading-relaxed resize-none"
            />
          </div>

          {/* Dates Section with Clear Explanations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Start Date (Kickoff)
              </label>
              <p className="text-[11px] text-slate-500 mb-1.5">
                Sprint kickoff date
              </p>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm shadow-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Target Delivery Date
              </label>
              <p className="text-[11px] text-slate-500 mb-1.5">
                Expected sprint delivery deadline
              </p>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm shadow-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
            </div>
          </div>

          {/* Status & Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Workflow Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium shadow-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
              >
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Priority Level
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium shadow-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                closeModal();
              }}
              className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer border border-slate-200/80"
              disabled={updateProjectMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateProjectMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <LuSparkles size={16} />
              <span>
                {updateProjectMutation.isPending
                  ? "Saving Changes..."
                  : "Update Project"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default UpdateProjectModal;
