import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LuPlus,
  LuCalendar,
  LuCircleCheck,
  LuClock,
  LuTriangleAlert,
  LuTrash2,
  LuX,
  LuLoader,
  LuFlag,
} from "react-icons/lu";
import * as milestoneService from "../../services/milestoneService";

const MilestoneTracker = ({ project, tasks = [] }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    title: "",
    description: "",
    dueDate: "",
  });
  const [formError, setFormError] = useState("");
  const queryClient = useQueryClient();

  // Fetch milestones
  const {
    data: milestones = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["milestones", project?._id],
    queryFn: () => milestoneService.getMilestones(project._id),
    enabled: !!project?._id,
  });

  // Create milestone mutation
  const createMilestoneMutation = useMutation({
    mutationFn: (data) => milestoneService.createMilestone(project._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["milestones", project._id]);
      setNewMilestone({ title: "", description: "", dueDate: "" });
      setShowAddModal(false);
      setFormError("");
    },
    onError: (err) => {
      console.error("Error creating milestone:", err);
      setFormError(err?.message || "Failed to create milestone.");
    },
  });

  // Update milestone mutation
  const updateMilestoneMutation = useMutation({
    mutationFn: ({ milestoneId, status }) =>
      milestoneService.updateMilestone(project._id, milestoneId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(["milestones", project._id]);
    },
    onError: (err) => {
      console.error("Error updating milestone:", err);
    },
  });

  // Delete milestone mutation
  const deleteMilestoneMutation = useMutation({
    mutationFn: (milestoneId) =>
      milestoneService.deleteMilestone(project._id, milestoneId),
    onSuccess: () => {
      queryClient.invalidateQueries(["milestones", project._id]);
    },
    onError: (err) => {
      console.error("Error deleting milestone:", err);
    },
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newMilestone.title.trim() || !newMilestone.dueDate) {
      setFormError("Title and Due Date are required.");
      return;
    }

    createMilestoneMutation.mutate({
      title: newMilestone.title.trim(),
      description: newMilestone.description.trim(),
      dueDate: new Date(newMilestone.dueDate).toISOString(),
      tasks: [],
    });
  };

  const completedCount = milestones.filter((m) => m.status === "Completed").length;
  const progressPercent =
    milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  const sortedMilestones = [...milestones].sort(
    (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <LuFlag size={16} />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Project Milestones</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track major deliverables and schedule deadlines for this workspace
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
        >
          <LuPlus size={14} />
          Add Milestone
        </button>
      </div>

      {/* Progress Bar Card */}
      <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          <span className="text-slate-700">Milestone Completion</span>
          <span className="text-slate-900">
            {completedCount} of {milestones.length} delivered ({progressPercent}%)
          </span>
        </div>
        <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Milestones List */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading milestones...</div>
      ) : sortedMilestones.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-slate-200 rounded-2xl">
          <LuFlag size={32} className="mx-auto text-slate-300 mb-2" />
          <h4 className="text-xs font-bold text-slate-700">No milestones defined</h4>
          <p className="text-[11px] text-slate-400 mt-0.5 mb-3">
            Set key target dates to measure sprint progress.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
          >
            <LuPlus size={13} />
            Create First Milestone
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedMilestones.map((milestone) => {
            const isCompleted = milestone.status === "Completed";
            const isOverdue =
              new Date(milestone.dueDate) < new Date() && !isCompleted;

            return (
              <div
                key={milestone._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-white shadow-2xs transition-all"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    onClick={() =>
                      updateMilestoneMutation.mutate({
                        milestoneId: milestone._id,
                        status: isCompleted ? "Pending" : "Completed",
                      })
                    }
                    className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                      isCompleted
                        ? "bg-emerald-500 border-emerald-600 text-white"
                        : "border-slate-300 hover:border-blue-500 text-transparent"
                    }`}
                    title={isCompleted ? "Mark incomplete" : "Mark completed"}
                  >
                    <LuCircleCheck size={14} />
                  </button>

                  <div className="min-w-0">
                    <h4
                      className={`text-sm font-bold truncate ${
                        isCompleted
                          ? "line-through text-slate-400"
                          : "text-slate-900"
                      }`}
                    >
                      {milestone.title}
                    </h4>
                    {milestone.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                        {milestone.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="flex items-center gap-1 text-slate-500">
                        <LuCalendar size={13} className="text-slate-400" />
                        Target: {new Date(milestone.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                      isCompleted
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : isOverdue
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {isCompleted ? "Completed" : isOverdue ? "Overdue" : "Pending"}
                  </span>

                  <button
                    onClick={() => {
                      if (window.confirm(`Delete milestone "${milestone.title}"?`)) {
                        deleteMilestoneMutation.mutate(milestone._id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete milestone"
                  >
                    <LuTrash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Milestone Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Milestone</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <LuX size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Milestone Title *
                </label>
                <input
                  type="text"
                  value={newMilestone.title}
                  onChange={(e) =>
                    setNewMilestone({ ...newMilestone, title: e.target.value })
                  }
                  placeholder="e.g. Beta MVP Release"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  value={newMilestone.description}
                  onChange={(e) =>
                    setNewMilestone({
                      ...newMilestone,
                      description: e.target.value,
                    })
                  }
                  placeholder="Key deliverables included in this milestone..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Target Due Date *
                </label>
                <input
                  type="date"
                  value={newMilestone.dueDate}
                  onChange={(e) =>
                    setNewMilestone({
                      ...newMilestone,
                      dueDate: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMilestoneMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {createMilestoneMutation.isPending ? (
                    <>
                      <LuLoader size={13} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Milestone"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilestoneTracker;
