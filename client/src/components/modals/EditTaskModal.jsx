import React, { useState, useEffect, useContext } from "react";
import ReactDOM from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useUpdateTask } from "../../hooks/useTasks";
import { searchUsers } from "../../services/authService";
import {
  getTaskComments,
  createComment,
  deleteComment,
} from "../../services/commentService";
import { AuthContext } from "../../context/AuthContext";
import {
  LuX,
  LuSquarePen,
  LuType,
  LuAlignLeft,
  LuCalendar,
  LuFlag,
  LuUsers,
  LuCheck,
  LuSearch,
  LuLoader,
  LuCircleAlert,
  LuMessageSquare,
  LuSend,
  LuTrash2,
  LuShieldCheck,
} from "react-icons/lu";

const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Urgent"];
const STATUS_OPTIONS = ["To Do", "In Progress", "Completed"];

const EditTaskModal = ({
  task,
  projectId,
  onTaskUpdated,
  closeModal,
  initialTab = "details",
}) => {
  const { auth } = useContext(AuthContext);
  const updateTaskMutation = useUpdateTask();
  const queryClient = useQueryClient();

  const effectiveProjectId = projectId || task?.project?._id || task?.project;

  const [activeTab, setActiveTab] = useState(initialTab);

  // Task Details Form State
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [status, setStatus] = useState(task?.status || "To Do");
  const [priority, setPriority] = useState(task?.priority || "Medium");
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [assignedTo, setAssignedTo] = useState(task?.assignedTo || null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Comments State
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [commentError, setCommentError] = useState("");

  // Load comments
  const loadComments = async () => {
    if (!task?._id) return;
    setIsCommentsLoading(true);
    setCommentError("");
    try {
      const data = await getTaskComments(task._id);
      const list = Array.isArray(data?.comments)
        ? data.comments
        : Array.isArray(data)
        ? data
        : [];
      setComments(list);
    } catch (err) {
      console.error("Failed to load task comments:", err);
      setCommentError(err.message || "Failed to load comments");
    } finally {
      setIsCommentsLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [task?._id]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeModal]);

  const handleSearchUsers = async (e) => {
    const query = e.target.value;
    setSearchTerm(query);

    if (query.trim().length >= 2) {
      setIsSearching(true);
      try {
        const results = await searchUsers(query.trim());
        setSearchResults(Array.isArray(results) ? results : []);
      } catch (err) {
        console.error("User search failed:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const handleSelectUser = (user) => {
    setAssignedTo(user);
    setSearchTerm("");
    setSearchResults([]);
  };

  const handleRemoveUser = () => {
    setAssignedTo(null);
    setSearchTerm("");
    setSearchResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage("Task title is required.");
      return;
    }

    setErrorMessage("");

    try {
      const taskData = {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        assignedTo: assignedTo
          ? assignedTo._id || assignedTo.id || assignedTo
          : null,
      };

      const res = await updateTaskMutation.mutateAsync({
        projectId: effectiveProjectId,
        taskId: task._id,
        taskData,
      });

      const updatedPayload = res?.task || {
        ...task,
        ...taskData,
        assignedTo: assignedTo,
      };

      if (onTaskUpdated) {
        onTaskUpdated(updatedPayload);
      }

      setIsSuccess(true);
      setTimeout(() => {
        closeModal();
      }, 400);
    } catch (err) {
      console.error("Task update error:", err);
      setErrorMessage(err.message || "Failed to update task.");
    }
  };

  // Post new comment
  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentInput.trim() || isPostingComment) return;

    setIsPostingComment(true);
    setCommentError("");

    try {
      const newComment = await createComment(task._id, {
        content: commentInput.trim(),
      });
      setComments((prev) => [newComment, ...prev]);
      setCommentInput("");

      const nextCount = (task.commentsCount || 0) + 1;
      task.commentsCount = nextCount;
      if (onTaskUpdated) {
        onTaskUpdated({
          ...task,
          commentsCount: nextCount,
        });
      }
      queryClient.invalidateQueries(["tasks", effectiveProjectId]);
      queryClient.invalidateQueries(["projectTasks"]);
    } catch (err) {
      console.error("Failed to post comment:", err);
      setCommentError(err.message || "Could not post comment.");
    } finally {
      setIsPostingComment(false);
    }
  };

  // Delete comment (Author or Workspace Owner)
  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));

      const nextCount = Math.max(0, (task.commentsCount || 1) - 1);
      task.commentsCount = nextCount;
      if (onTaskUpdated) {
        onTaskUpdated({
          ...task,
          commentsCount: nextCount,
        });
      }
      queryClient.invalidateQueries(["tasks", effectiveProjectId]);
      queryClient.invalidateQueries(["projectTasks"]);
    } catch (err) {
      console.error("Failed to delete comment:", err);
      setCommentError(err.message || "Failed to delete comment.");
    }
  };

  const currentUserId = auth.user?._id || auth.user?.id;
  const isOwner = auth.user?.role === "Owner" || auth.user?.role === "Admin";

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={closeModal}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl w-full max-w-xl overflow-hidden transition-all scale-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <LuSquarePen size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {title || "Sprint Task"}
              </h2>
              <p className="text-xs text-slate-500">
                Workflow status: <span className="font-semibold text-slate-700">{status}</span>
              </p>
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

        {/* Tab Strip */}
        <div className="flex items-center gap-4 px-6 border-b border-slate-100 shrink-0 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={`py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "details"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <LuAlignLeft size={14} />
            Task Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("comments")}
            className={`py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "comments"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <LuMessageSquare size={14} />
            Comments & Discussion
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "comments"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {comments.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Task Details Form */}
        {activeTab === "details" && (
          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-4 overflow-y-auto flex-1"
          >
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <LuCircleAlert size={16} className="shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {isSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
                <LuCheck size={16} className="shrink-0 text-emerald-500" />
                <span>Task updated successfully.</span>
              </div>
            )}

            {/* Task Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Task Title <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Implement user authentication flow"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  required
                />
                <LuType
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
              </div>
            </div>

            {/* Task Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Description
              </label>
              <div className="relative">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide task requirements or acceptance criteria..."
                  rows={3}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                />
                <LuAlignLeft
                  className="absolute left-3 top-3.5 text-slate-400"
                  size={16}
                />
              </div>
            </div>

            {/* Status & Priority Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Workflow Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Priority
                </label>
                <div className="relative">
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer"
                  >
                    {PRIORITY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt} Priority
                      </option>
                    ))}
                  </select>
                  <LuFlag
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={15}
                  />
                </div>
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Due Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer"
                />
                <LuCalendar
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={15}
                />
              </div>
            </div>

            {/* Assignee Search & Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Assignee
              </label>

              {assignedTo && (
                <div className="flex items-center justify-between p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl mb-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                      {assignedTo.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold text-blue-900 truncate block">
                        {assignedTo.name || assignedTo.email || "Assigned User"}
                      </span>
                      {assignedTo.email && (
                        <span className="text-[11px] text-blue-700/80 truncate block">
                          {assignedTo.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveUser}
                    className="text-blue-500 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                    title="Remove assignee"
                  >
                    <LuX size={15} />
                  </button>
                </div>
              )}

              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchUsers}
                  placeholder="Search teammates by name or email..."
                  className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
                <LuSearch
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={15}
                />
                {isSearching && (
                  <LuLoader
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 animate-spin"
                    size={15}
                  />
                )}
              </div>

              {searchResults.length > 0 && (
                <div className="mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto divide-y divide-slate-100 z-10 relative">
                  {searchResults.map((user) => (
                    <div
                      key={user._id || user.id}
                      onClick={() => handleSelectUser(user)}
                      className="p-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{user.name}</p>
                        <p className="text-[11px] text-slate-500">{user.email}</p>
                      </div>
                      <span className="text-[11px] font-semibold text-blue-600">
                        Select
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={closeModal}
                disabled={updateTaskMutation.isPending}
                className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-semibold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateTaskMutation.isPending || !title.trim()}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {updateTaskMutation.isPending ? (
                  <>
                    <LuLoader size={14} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <LuCheck size={14} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Comments & Discussion */}
        {activeTab === "comments" && (
          <div className="p-6 flex flex-col flex-1 overflow-hidden space-y-4">
            {commentError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 shrink-0">
                <LuCircleAlert size={16} className="shrink-0 text-rose-500" />
                <span>{commentError}</span>
              </div>
            )}

            {/* Comment Thread */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {isCommentsLoading ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <LuLoader className="animate-spin mx-auto mb-2 text-blue-600" size={20} />
                  Loading discussion thread...
                </div>
              ) : comments.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl">
                  <LuMessageSquare size={28} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-700">No comments yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Post questions, sprint updates, or blockers here.
                  </p>
                </div>
              ) : (
                comments.map((c) => {
                  const authorName = c.author?.name || "Teammate";
                  const initial = authorName.charAt(0)?.toUpperCase() || "U";
                  const isAuthor =
                    c.author?._id === currentUserId || c.author === currentUserId;
                  const canDelete = isAuthor || isOwner;

                  return (
                    <div
                      key={c._id}
                      className="p-3.5 bg-slate-50/80 border border-slate-200/70 rounded-xl text-xs space-y-2 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                            {initial}
                          </div>
                          <span className="font-bold text-slate-900">
                            {authorName}
                          </span>
                          {c.isEdited && (
                            <span className="text-[10px] text-slate-400 italic">
                              (edited)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">
                            {c.createdAt
                              ? formatDistanceToNow(new Date(c.createdAt), {
                                  addSuffix: true,
                                })
                              : "just now"}
                          </span>

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(c._id)}
                              className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                              title="Delete comment"
                            >
                              <LuTrash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-slate-800 leading-relaxed pl-8">
                        {c.content}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Post Comment Input */}
            <form onSubmit={handlePostComment} className="shrink-0 pt-2 border-t border-slate-100">
              <div className="relative">
                <textarea
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Write a comment or update (supports @mentions)..."
                  rows={2}
                  className="w-full pl-3 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handlePostComment(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={isPostingComment || !commentInput.trim()}
                  className="absolute right-2.5 bottom-3 w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
                  title="Send comment (Enter)"
                >
                  {isPostingComment ? (
                    <LuLoader size={14} className="animate-spin" />
                  ) : (
                    <LuSend size={14} />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 pl-1">
                Press Enter to post, Shift+Enter for new line.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default EditTaskModal;
