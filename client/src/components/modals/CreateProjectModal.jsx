import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useCreateProject } from "../../hooks/useProjects";
import { searchUsers } from "../../services/authService";
import { useFeedback } from "../../context/FeedbackContext";
import {
  LuFolderPlus,
  LuX,
  LuCalendar,
  LuSearch,
  LuUsers,
  LuCheck,
  LuSparkles,
  LuCircleAlert,
} from "react-icons/lu";

const CreateProjectModal = ({ closeModal }) => {
  const navigate = useNavigate();
  const { showSuccess } = useFeedback();
  const createProjectMutation = useCreateProject();
  const modalRef = useRef(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("Planning");
  const [priority, setPriority] = useState("Medium");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

  const handleAddMember = (user) => {
    if (!selectedMembers.some((member) => member._id === user._id)) {
      setSelectedMembers([...selectedMembers, user]);
    }
    setSearchTerm("");
    setSearchResults([]);
  };

  const handleRemoveMember = (userId) => {
    setSelectedMembers(
      selectedMembers.filter((member) => member._id !== userId)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!title.trim()) {
      setErrorMessage("Project Title is required.");
      return;
    }

    if (!startDate) {
      setErrorMessage("Start Date is required.");
      return;
    }

    try {
      const created = await createProjectMutation.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        startDate,
        endDate: endDate || null,
        priority,
        teamMembers: selectedMembers.map((member) => member._id),
        status,
      });

      showSuccess(`Project "${title.trim()}" created successfully!`, {
        description: "Sprint workspace initialized with team access.",
        actionLabel: "Open Board",
        onAction: () => {
          if (created?._id) navigate(`/projects/${created._id}`);
        },
      });

      closeModal();
    } catch (err) {
      console.error("Project Creation Failed:", err);
      setErrorMessage(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create project workspace. Please try again."
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
      <motion.div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
              <LuFolderPlus size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Create New Project
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Initialize an agile workspace with sprint timelines and team access.
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

        {/* Modal Form Body */}
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
              placeholder="e.g. Platform Modernization Sprint"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm shadow-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400"
              required
            />
          </div>

          {/* Project Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Project Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              placeholder="Outline project objectives, key sprint deliverables, and architectural scope..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm shadow-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400 leading-relaxed resize-none"
              required
            />
          </div>

          {/* Date Range Section with Clear Labels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Start Date (Kickoff) <span className="text-rose-500">*</span>
              </label>
              <p className="text-[11px] text-slate-500 mb-1.5">
                When does development or sprint planning start?
              </p>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm shadow-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Target Delivery Date
              </label>
              <p className="text-[11px] text-slate-500 mb-1.5">
                Expected sprint delivery / launch deadline
              </p>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm shadow-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Status & Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Initial Workflow Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium shadow-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
              >
                <option value="Planning">Planning (Backlog Refinement)</option>
                <option value="Active">Active (In Sprint)</option>
                <option value="In Progress">In Progress (Execution)</option>
                <option value="On Hold">On Hold (Blocked)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Project Priority
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
          </div>

          {/* Team Collaboration Section */}
          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Assign Team Collaborators
              </label>
              <span className="text-[11px] font-semibold text-slate-400">
                {selectedMembers.length} added
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
              Search registered workspace members by <strong>full name</strong> or <strong>email address</strong> (e.g., alex.dev@projectpilot.test).
            </p>

            <div className="relative">
              <input
                type="text"
                placeholder="Type member name or email address..."
                value={searchTerm}
                onChange={handleSearch}
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

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto divide-y divide-slate-100">
                {searchResults.map((user) => {
                  const isAlreadySelected = selectedMembers.some(
                    (m) => m._id === user._id
                  );
                  return (
                    <div
                      key={user._id}
                      onClick={() => !isAlreadySelected && handleAddMember(user)}
                      className={`p-2.5 flex items-center justify-between transition-colors ${
                        isAlreadySelected
                          ? "bg-slate-50 cursor-not-allowed opacity-60"
                          : "hover:bg-blue-50/60 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {user.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900">
                            {user.name}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      {isAlreadySelected ? (
                        <span className="text-[11px] font-semibold text-slate-400">
                          Added
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-blue-600 hover:underline">
                          + Add
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Selected Members Chips */}
            {selectedMembers.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedMembers.map((member) => (
                  <div
                    key={member._id}
                    className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200/90 rounded-xl px-2.5 py-1 text-xs"
                  >
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                      {member.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <span className="font-semibold text-slate-800">
                      {member.name}
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      ({member.email})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member._id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors ml-1 p-0.5 rounded cursor-pointer"
                      aria-label="Remove collaborator"
                    >
                      <LuX size={13} />
                    </button>
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
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createProjectMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <LuSparkles size={16} />
              <span>
                {createProjectMutation.isPending
                  ? "Creating Workspace..."
                  : "Create Project"}
              </span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default CreateProjectModal;
