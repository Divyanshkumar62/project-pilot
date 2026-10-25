import React, { useEffect, useMemo } from "react";
import { useDashboard } from "../../context/DashboardContext";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  LuListTodo,
  LuClock,
  LuCircleCheck,
  LuTrendingUp,
  LuTriangleAlert,
  LuCalendar,
  LuUsers,
  LuActivity,
  LuRefreshCw,
  LuArrowUpRight,
} from "react-icons/lu";

const STATUS_CONFIG = {
  Completed: { color: "#10B981", label: "Completed", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  "In Progress": { color: "#3B82F6", label: "In Progress", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  "To Do": { color: "#F59E0B", label: "To Do", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  Overdue: { color: "#EF4444", label: "Overdue", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
};

function formatDeadlineDate(dateStr) {
  if (!dateStr) return "No date";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getDeadlineCountdown(dueDateStr) {
  if (!dueDateStr) return null;
  const now = new Date();
  const due = new Date(dueDateStr);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: `${Math.abs(diffDays)}d overdue`, isOverdue: true };
  } else if (diffDays === 0) {
    return { text: "Due today", isToday: true };
  } else if (diffDays === 1) {
    return { text: "Due tomorrow", isSoon: true };
  } else {
    return { text: `${diffDays}d left`, isNormal: true };
  }
}

// Custom Tooltip for Recharts Donut
const CustomChartTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs shadow-lg border border-slate-700">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
          <span className="font-semibold">{data.name}</span>
        </div>
        <p className="text-slate-300">
          <span className="font-bold text-white">{data.value}</span> tasks ({data.percentage}%)
        </p>
      </div>
    );
  }
  return null;
};

export default function ProjectDashboard({ projectId, tasks = [], project }) {
  const { dashboardData, loading, error, loadDashboard } = useDashboard();

  useEffect(() => {
    if (projectId) loadDashboard(projectId);
  }, [projectId, loadDashboard]);

  // Aggregate stats from direct tasks prop if available, or fall back to dashboardData
  const stats = useMemo(() => {
    const now = new Date();
    if (tasks && tasks.length > 0) {
      const total = tasks.length;
      const completed = tasks.filter((t) => t.status === "Completed").length;
      const inProgress = tasks.filter((t) => t.status === "In Progress").length;
      const todo = tasks.filter((t) => t.status === "To Do").length;
      const overdue = tasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "Completed"
      ).length;

      // Priority counts
      const priorityCounts = {
        Urgent: tasks.filter((t) => t.priority === "Urgent" || t.priority === "Critical").length,
        High: tasks.filter((t) => t.priority === "High").length,
        Medium: tasks.filter((t) => t.priority === "Medium").length,
        Low: tasks.filter((t) => t.priority === "Low").length,
      };

      return {
        total,
        completed,
        inProgress,
        todo,
        overdue,
        rate: total > 0 ? Math.round((completed / total) * 100) : 0,
        priorityCounts,
      };
    }

    if (dashboardData?.taskStats) {
      const ts = dashboardData.taskStats;
      const total = ts.total || 0;
      const completed = ts.completed || 0;
      const inProgress = ts.inProgress || 0;
      const todo = ts.todo ?? ts.toDo ?? 0;
      const overdue = ts.overdue || 0;
      return {
        total,
        completed,
        inProgress,
        todo,
        overdue,
        rate: total > 0 ? Math.round((completed / total) * 100) : 0,
        priorityCounts: { Urgent: 0, High: 0, Medium: 0, Low: 0 },
      };
    }

    return { total: 0, completed: 0, inProgress: 0, todo: 0, overdue: 0, rate: 0, priorityCounts: {} };
  }, [tasks, dashboardData]);

  // Upcoming deadlines from live tasks or backend dashboardData
  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    if (tasks && tasks.length > 0) {
      return tasks
        .filter((t) => t.dueDate && t.status !== "Completed")
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5)
        .map((t) => ({
          title: t.title,
          dueDate: t.dueDate,
          status: t.status,
          priority: t.priority,
        }));
    }
    return dashboardData?.upcomingDeadlines || [];
  }, [tasks, dashboardData]);

  // Recent activity from dashboardData
  const recentActivity = useMemo(() => {
    return Array.isArray(dashboardData?.recentActivity) ? dashboardData.recentActivity : [];
  }, [dashboardData]);

  // Donut chart dataset
  const chartData = useMemo(() => {
    const items = [
      { name: "Completed", value: stats.completed, color: STATUS_CONFIG.Completed.color },
      { name: "In Progress", value: stats.inProgress, color: STATUS_CONFIG["In Progress"].color },
      { name: "To Do", value: stats.todo, color: STATUS_CONFIG["To Do"].color },
    ];
    if (stats.overdue > 0) {
      items.push({ name: "Overdue", value: stats.overdue, color: STATUS_CONFIG.Overdue.color });
    }

    const grandTotal = stats.total || 1;
    return items.map((item) => ({
      ...item,
      percentage: Math.round((item.value / grandTotal) * 100),
    }));
  }, [stats]);

  if (loading && !dashboardData && tasks.length === 0) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-100 h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-100 h-80 rounded-2xl" />
          <div className="bg-slate-100 h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error && !dashboardData && tasks.length === 0) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
        <LuTriangleAlert className="mx-auto text-rose-500 mb-2" size={28} />
        <h3 className="font-bold text-rose-900 text-base">Unable to load dashboard analytics</h3>
        <p className="text-rose-600 text-sm mt-1 mb-4">{error}</p>
        <button
          onClick={() => loadDashboard(projectId)}
          className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-xs"
        >
          <LuRefreshCw size={14} />
          Retry loading
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Metrics 4-Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Tasks</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <LuListTodo size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.total}</span>
            <span className="text-xs text-slate-500 font-medium">in backlog</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Active workspace sprint scope</p>
        </div>

        {/* In Progress */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">In Progress</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <LuClock size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.inProgress}</span>
            <span className="text-xs text-blue-600 font-semibold">active</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Currently being implemented</p>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Completed</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <LuCircleCheck size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.completed}</span>
            <span className="text-xs text-emerald-600 font-semibold">delivered</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Verified and finished tasks</p>
        </div>

        {/* Sprint Completion Rate */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sprint Velocity</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <LuTrendingUp size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.rate}%</span>
            <span className="text-xs text-slate-500 font-medium">completion</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(stats.rate, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Middle Row: Donut Chart & Priority Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart: Task Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Task Distribution</h3>
              <p className="text-xs text-slate-500 mt-0.5">Workflow status breakdown for this sprint</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
              {stats.total} total
            </span>
          </div>

          {stats.total === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
              <LuListTodo size={32} className="mb-2 text-slate-300" />
              <p className="text-xs font-medium">No tasks recorded in this project yet.</p>
            </div>
          ) : (
            <div>
              <div className="h-60 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={88}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Center Label in Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-extrabold text-slate-900 leading-tight">
                    {stats.completed}/{stats.total}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Done</span>
                </div>
              </div>

              {/* Status Chips Legend */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                {chartData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50/80">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <div className="truncate">
                      <p className="text-[11px] font-medium text-slate-500 truncate">{item.name}</p>
                      <p className="text-xs font-bold text-slate-900">
                        {item.value} <span className="text-slate-400 font-normal">({item.percentage}%)</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Priority Breakdown & Health Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Priority Breakdown</h3>
                <p className="text-xs text-slate-500 mt-0.5">Task urgency distribution across backlog</p>
              </div>
              {stats.overdue > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                  <LuTriangleAlert size={12} />
                  {stats.overdue} overdue
                </span>
              )}
            </div>

            {/* Priority Progress Bars */}
            <div className="space-y-4 pt-1">
              {[
                { label: "High / Urgent", count: (stats.priorityCounts?.Urgent || 0) + (stats.priorityCounts?.High || 0), color: "bg-rose-500", text: "text-rose-700" },
                { label: "Medium", count: stats.priorityCounts?.Medium || 0, color: "bg-amber-500", text: "text-amber-700" },
                { label: "Low", count: stats.priorityCounts?.Low || 0, color: "bg-blue-500", text: "text-blue-700" },
              ].map((p) => {
                const pct = stats.total > 0 ? Math.round((p.count / stats.total) * 100) : 0;
                return (
                  <div key={p.label}>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-semibold text-slate-700">{p.label}</span>
                      <span className="font-bold text-slate-900">
                        {p.count} <span className="text-slate-400 font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className={`h-2 rounded-full ${p.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sprint Health Banner */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100/70 text-blue-700 flex items-center justify-center shrink-0">
                  <LuUsers size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Project Collaboration
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {project?.teamMembers?.length ? `${project.teamMembers.length} team members assigned` : "Direct owner managed"}
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-700">
                {project?.status || "Active"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Upcoming Deadlines & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Upcoming Deadlines</h3>
              <p className="text-xs text-slate-500 mt-0.5">Tasks approaching target delivery dates</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <LuCalendar size={16} />
            </div>
          </div>

          {upcomingDeadlines.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-slate-200 rounded-xl">
              <LuCircleCheck size={28} className="mx-auto text-emerald-500 mb-1.5" />
              <p className="text-xs font-semibold text-slate-700">No pending deadlines</p>
              <p className="text-[11px] text-slate-400 mt-0.5">All scheduled tasks are completed or open-ended.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingDeadlines.map((task, idx) => {
                const countdown = getDeadlineCountdown(task.dueDate);
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 transition-all"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="text-xs font-bold text-slate-900 truncate">{task.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <LuCalendar size={11} className="text-slate-400" />
                        {formatDeadlineDate(task.dueDate)}
                      </p>
                    </div>
                    {countdown && (
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg shrink-0 border ${
                          countdown.isOverdue
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : countdown.isToday || countdown.isSoon
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {countdown.text}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Recent Sprint Activity</h3>
              <p className="text-xs text-slate-500 mt-0.5">Latest actions recorded in this workspace</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <LuActivity size={16} />
            </div>
          </div>

          {recentActivity.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-slate-200 rounded-xl">
              <LuActivity size={28} className="mx-auto text-slate-300 mb-1.5" />
              <p className="text-xs font-semibold text-slate-700">No recent activity</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Team events and task changes will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.slice(0, 5).map((act, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {act.user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-800 font-medium leading-relaxed truncate">{act.message}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      by <span className="font-semibold text-slate-600">{act.user?.name || "Team member"}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
