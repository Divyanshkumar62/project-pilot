import React from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LuTrash2, LuX, LuTriangleAlert } from 'react-icons/lu';

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Project Workspace",
  projectName,
  message,
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  const content = (
    <AnimatePresence>
      <motion.div
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-[999999] p-4"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.93, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 15 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="bg-white rounded-2xl shadow-2xl border-2 border-rose-300 w-full max-w-md p-6 overflow-hidden relative"
        >
          {/* Red warning top bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-red-600 to-rose-700" />

          {/* Top Header with Icon and Close Button */}
          <div className="flex items-start justify-between mb-4 mt-1">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-sm shadow-rose-200">
              <LuTrash2 size={24} className="stroke-[2.5]" />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <LuX size={18} />
            </button>
          </div>

          {/* Modal Text Content */}
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {title}
          </h3>

          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            {projectName ? (
              <>
                Are you sure you want to permanently delete{" "}
                <span className="font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">"{projectName}"</span>?
              </>
            ) : (
              message || "Are you sure you want to permanently delete this project workspace?"
            )}
          </p>

          {/* Permanent Deletion Alert Banner */}
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 mb-6">
            <div className="flex items-start gap-2.5">
              <LuTriangleAlert size={18} className="text-rose-600 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-900 leading-relaxed font-semibold">
                This action cannot be undone. All tasks, sprint boards, milestone history, and comments associated with this workspace will be permanently removed.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              disabled={isDeleting}
              className="flex-1 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all cursor-pointer border border-slate-200/80 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onConfirm();
              }}
              disabled={isDeleting}
              className="flex-1 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold py-2.5 px-4 rounded-xl text-sm shadow-md shadow-rose-600/25 hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <LuTrash2 size={16} />
              <span>{isDeleting ? "Deleting..." : "Permanently Delete"}</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default DeleteConfirmationModal;
