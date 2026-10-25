import React, { useState } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { archiveProject } from "../../services/projectService";
import {
  LuFolderArchive,
  LuX,
  LuTriangleAlert,
  LuCheck,
  LuLoader,
} from "react-icons/lu";

const REASON_OPTIONS = [
  "Sprint milestone completed",
  "Scope delivered successfully",
  "Merged with another workspace",
  "Cancelled or deprioritized",
  "Archived for historical reference",
];

const EnhancedArchiveModal = ({ project, closeModal }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [reason, setReason] = useState("");
  const [completionSummary, setCompletionSummary] = useState("");
  const [lessonsLearned, setLessonsLearned] = useState("");
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      setError("Please select an archive reason.");
      return;
    }

    setIsArchiving(true);
    setError("");

    try {
      await archiveProject(project._id, true);
      // Invalidate queries so projects list updates
      await queryClient.invalidateQueries(["projects"]);
      await queryClient.invalidateQueries(["project", project._id]);

      setIsSuccess(true);
      setTimeout(() => {
        closeModal();
        navigate("/projects");
      }, 1000);
    } catch (err) {
      console.error("Archive error:", err);
      setError(err?.message || err?.error || "Failed to archive project. Please try again.");
      setIsArchiving(false);
    }
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={closeModal}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl w-full max-w-lg overflow-hidden transition-all scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <LuFolderArchive size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Archive Workspace</h2>
              <p className="text-xs text-slate-500">Move project out of active views</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <LuX size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(85vh-80px)] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <LuTriangleAlert size={16} className="shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {isSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
              <LuCheck size={16} className="shrink-0 text-emerald-500" />
              <span>Workspace archived. Redirecting to projects...</span>
            </div>
          )}

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-900">Target Workspace: {project?.title}</p>
            <p className="text-slate-500">
              Archiving preserves all tasks, milestones, and audit trails while removing this workspace from active boards.
            </p>
          </div>

          {/* Reason Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Archive Reason <span className="text-rose-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer"
              required
            >
              <option value="">Select an archive reason</option>
              {REASON_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Completion Summary */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Summary / Deliverables Note
            </label>
            <textarea
              value={completionSummary}
              onChange={(e) => setCompletionSummary(e.target.value)}
              placeholder="Brief summary of deliverables, outcomes, or current sprint state..."
              rows={3}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
            />
          </div>

          {/* Lessons Learned */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Retrospective Notes
            </label>
            <textarea
              value={lessonsLearned}
              onChange={(e) => setLessonsLearned(e.target.value)}
              placeholder="Key learnings, retrospective takeaways, or handoff notes..."
              rows={2}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={closeModal}
              disabled={isArchiving}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-semibold text-xs rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isArchiving || !reason || isSuccess}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isArchiving ? (
                <>
                  <LuLoader size={14} className="animate-spin" />
                  Archiving...
                </>
              ) : (
                <>
                  <LuFolderArchive size={14} />
                  Confirm Archive
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default EnhancedArchiveModal;
