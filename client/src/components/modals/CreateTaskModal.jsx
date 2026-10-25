import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { useCreateTask } from "../../hooks/useTasks";
import { searchUsers } from "../../services/authService";
import {
  LuPlus,
  LuX,
  LuCalendar,
  LuSearch,
  LuSparkles,
  LuCircleAlert,
  LuCircleCheck,
} from "react-icons/lu";

const CreateTaskModal = ({ projectId, closeModal }) => {
  const createTaskMutation = useCreateTask();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [assignedTo, setAssignedTo] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
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

  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim().length >= 2) {
      setIsSearching(true);
      try {
        const results = await searchUsers(value.trim());
        setSearchResults(results || []);
      } catch (err) {
        console.error("Error searching users:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const handleAssignUser = (user) => {
    setAssignedTo(user);
    setSearchTerm("");
    setSearchResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!title.trim()) {
      setFeedback({ type: "error", message: "Task title is required." });
      return;
    }

    setIsSubmitting(true);
    setFeedback({ type: "", message: "" });

    try {
      await createTaskMutation.mutateAsync({
        projectId,
        taskData: {
          title: title.trim(),
          description: description.trim(),
          priority,
          dueDate: dueDate || undefined,
          assignedTo: assignedTo ? assignedTo._id : null,
        },
      });

      setFeedback({
        type: "success",
        message: "Sprint task created successfully!",
      });

      setTimeout(() => {
        closeModal();
      }, 700);
    } catch (err) {
      console.error("Task Creation Failed:", err);
      setFeedback({
        type: "error",
        message:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to create task. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
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
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
              <LuPlus size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Create New Task
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Add a new work item to this sprint backlog.
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {feedback.message && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
                feedback.type === "error"
                  ? "bg-rose-50 border-rose-200 text-rose-700"
                  : "bg-emerald-50 border-emerald-200 text-emerald-800"
              }`}
            >
              {feedback.type === "error" ? (
                <LuCircleAlert size={16} className="shrink-0 mt-0.5" />
              ) : (
                <LuCircleCheck size={16} className="shrink-0 mt-0.5" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Task Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement webhook retry with exponential backoff"
              className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm shadow-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Provide technical specifications, acceptance criteria, and edge cases..."
              className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm shadow-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400 resize-none leading-relaxed"
            />
          </div>

          {/* Priority & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium shadow-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm shadow-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
            </div>
          </div>

          {/* Assign Teammate */}
          <div className="border-t border-slate-100 pt-4">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Assign Teammate
            </label>
            <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
              Search by <strong>full name</strong> or <strong>email address</strong>.
            </p>

            {assignedTo ? (
              <div className="flex items-center justify-between p-2.5 bg-blue-50/70 border border-blue-200/80 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                    {assignedTo.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {assignedTo.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {assignedTo.email}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAssignedTo(null)}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearch}
                  placeholder="Type name or email address..."
                  className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm shadow-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400"
                />
                <LuSearch
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                {isSearching && (
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    Searching...
                  </span>
                )}
              </div>
            )}

            {searchResults.length > 0 && !assignedTo && (
              <div className="mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-36 overflow-y-auto divide-y divide-slate-100">
                {searchResults.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => handleAssignUser(user)}
                    className="p-2.5 flex items-center justify-between hover:bg-blue-50/60 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {user.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-slate-500">{user.email}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-blue-600">
                      Assign
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                closeModal();
              }}
              className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer border border-slate-200/80"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <LuSparkles size={16} />
              <span>{isSubmitting ? "Creating..." : "Create Task"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default CreateTaskModal;
