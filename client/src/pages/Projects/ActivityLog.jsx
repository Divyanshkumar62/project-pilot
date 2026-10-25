import React, { useEffect } from "react";
import { useActivity } from "../../context/ActivityContext";
import { formatDistanceToNow } from "date-fns";
import {
  LuFolderPlus,
  LuUsers,
  LuUserCheck,
  LuListPlus,
  LuSquarePen,
  LuTrash2,
  LuKey,
  LuActivity,
  LuRefreshCw,
  LuCircleCheck,
} from "react-icons/lu";

const TYPE_CONFIG = {
  PROJECT_CREATED: {
    icon: LuFolderPlus,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    label: "Project Created",
  },
  INVITE_SENT: {
    icon: LuUsers,
    color: "text-indigo-600 bg-indigo-50 border-indigo-200",
    label: "Invitation Sent",
  },
  INVITE_ACCEPTED: {
    icon: LuUserCheck,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    label: "Invitation Accepted",
  },
  TASK_CREATED: {
    icon: LuListPlus,
    color: "text-amber-600 bg-amber-50 border-amber-200",
    label: "Task Created",
  },
  TASK_UPDATED: {
    icon: LuSquarePen,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    label: "Task Updated",
  },
  TASK_DELETED: {
    icon: LuTrash2,
    color: "text-rose-600 bg-rose-50 border-rose-200",
    label: "Task Deleted",
  },
  ROLE_UPDATED: {
    icon: LuKey,
    color: "text-purple-600 bg-purple-50 border-purple-200",
    label: "Role Updated",
  },
  DEFAULT: {
    icon: LuActivity,
    color: "text-slate-600 bg-slate-50 border-slate-200",
    label: "Activity",
  },
};

const ActivityLog = ({ projectId }) => {
  const { activities, loading, error, loadActivity } = useActivity();

  useEffect(() => {
    if (projectId) loadActivity(projectId);
  }, [projectId, loadActivity]);

  if (loading && (!activities || activities.length === 0)) {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="w-8 h-8 mx-auto border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium text-slate-500">Loading workspace activity logs...</p>
      </div>
    );
  }

  if (error && (!activities || activities.length === 0)) {
    return (
      <div className="p-6 text-center bg-rose-50 border border-rose-200 rounded-2xl">
        <p className="text-xs font-bold text-rose-800 mb-1">Failed to load activity log</p>
        <p className="text-xs text-rose-600 mb-3">{error}</p>
        <button
          onClick={() => loadActivity(projectId)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition-all cursor-pointer"
        >
          <LuRefreshCw size={12} />
          Retry
        </button>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="py-12 text-center border border-dashed border-slate-200 rounded-2xl">
        <LuActivity size={32} className="mx-auto text-slate-300 mb-2" />
        <h4 className="text-xs font-bold text-slate-700">No activity recorded yet</h4>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Workspace actions, status updates, and team changes will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Audit Trail & Activity</h3>
          <p className="text-xs text-slate-500 mt-0.5">Chronological record of team actions</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
          {activities.length} events
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {activities.map((act) => {
          const cfg = TYPE_CONFIG[act.type] || TYPE_CONFIG.DEFAULT;
          const IconComponent = cfg.icon;
          const userInitial = act.user?.name?.charAt(0)?.toUpperCase() || "U";
          const userName = act.user?.name || act.user?.email || "Team member";

          return (
            <div key={act._id} className="relative group">
              {/* Event Dot Icon on line */}
              <div
                className={`absolute -left-6 top-0 w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${cfg.color} shadow-2xs`}
              >
                <IconComponent size={12} />
              </div>

              {/* Event Content Card */}
              <div className="bg-slate-50/60 hover:bg-slate-50 border border-slate-200/70 rounded-xl p-3.5 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                      {userInitial}
                    </div>
                    <span className="text-xs font-bold text-slate-900 truncate">{userName}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                      {cfg.label}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 shrink-0">
                    {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-medium mt-1.5 leading-relaxed pl-7">
                  {act.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityLog;
