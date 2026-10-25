import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LuCircleCheck, LuTrash2, LuInfo, LuX, LuArrowRight } from "react-icons/lu";

const FeedbackContext = createContext(null);

export const FeedbackProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = "success", title, description = "", actionLabel = "", onAction = null, duration = 4500 }) => {
      const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const newToast = { id, type, title, description, actionLabel, onAction };

      setToasts((prev) => [...prev.slice(-3), newToast]); // keep max 4 toasts

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }

      return id;
    },
    [dismissToast]
  );

  const showSuccess = useCallback(
    (title, opts = {}) => showToast({ type: "success", title, ...opts }),
    [showToast]
  );

  const showDelete = useCallback(
    (title, opts = {}) => showToast({ type: "delete", title, ...opts }),
    [showToast]
  );

  const showInfo = useCallback(
    (title, opts = {}) => showToast({ type: "info", title, ...opts }),
    [showToast]
  );

  return (
    <FeedbackContext.Provider value={{ showToast, showSuccess, showDelete, showInfo, dismissToast }}>
      {children}

      {/* Animated Bottom Notification / Modal Dock */}
      <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[9999999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-3 sm:px-0">
        <AnimatePresence>
          {toasts.map((toast) => {
            const isSuccess = toast.type === "success";
            const isDelete = toast.type === "delete";

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 50, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.92, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                className={`pointer-events-auto w-full p-4 rounded-2xl shadow-2xl border backdrop-blur-md flex items-start gap-3.5 ${
                  isSuccess
                    ? "bg-white/95 border-emerald-300 text-slate-900 shadow-emerald-500/10 ring-1 ring-emerald-500/20"
                    : isDelete
                    ? "bg-white/95 border-rose-300 text-slate-900 shadow-rose-500/10 ring-1 ring-rose-500/20"
                    : "bg-white/95 border-blue-300 text-slate-900 shadow-blue-500/10 ring-1 ring-blue-500/20"
                }`}
              >
                {/* Visual Status Icon */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isSuccess
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      : isDelete
                      ? "bg-rose-50 text-rose-600 border border-rose-200"
                      : "bg-blue-50 text-blue-600 border border-blue-200"
                  }`}
                >
                  {isSuccess && <LuCircleCheck size={20} className="stroke-[2.5]" />}
                  {isDelete && <LuTrash2 size={20} className="stroke-[2.5]" />}
                  {!isSuccess && !isDelete && <LuInfo size={20} className="stroke-[2.5]" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">
                      {toast.title}
                    </h4>
                  </div>
                  {toast.description && (
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {toast.description}
                    </p>
                  )}

                  {toast.actionLabel && toast.onAction && (
                    <button
                      type="button"
                      onClick={() => {
                        toast.onAction();
                        dismissToast(toast.id);
                      }}
                      className={`mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        isSuccess
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : isDelete
                          ? "bg-rose-600 text-white hover:bg-rose-700"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      <span>{toast.actionLabel}</span>
                      <LuArrowRight size={13} />
                    </button>
                  )}
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
                  aria-label="Dismiss notification"
                >
                  <LuX size={16} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </FeedbackContext.Provider>
  );
};

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    // Fallback safe dummy functions so components don't crash if unmounted from provider
    return {
      showToast: () => {},
      showSuccess: () => {},
      showDelete: () => {},
      showInfo: () => {},
      dismissToast: () => {},
    };
  }
  return context;
};
