import React, { useMemo } from "react";
import {
  LuCalendar,
  LuListTodo,
  LuClock,
  LuCircleCheck,
} from "react-icons/lu";

const GanttChart = ({ tasks = [], project }) => {
  // Calculate timeline data
  const timelineData = useMemo(() => {
    if (!tasks.length || !project) return null;

    const projectStart = new Date(project.startDate || project.createdAt);
    const projectEnd = project.endDate ? new Date(project.endDate) : new Date();

    // If no project end date, calculate based on tasks or default to 60 days
    const calculatedEnd =
      tasks.length > 0
        ? new Date(
            Math.max(
              ...tasks.map((t) =>
                new Date(t.dueDate || t.createdAt).getTime()
              )
            )
          )
        : new Date(projectStart.getTime() + 60 * 24 * 60 * 60 * 1000);

    const endDate = projectEnd > calculatedEnd ? projectEnd : calculatedEnd;
    const totalDays = Math.max(
      1,
      Math.ceil((endDate - projectStart) / (1000 * 60 * 60 * 24))
    );

    // Generate date range markers for header
    const dateRange = [];
    const step = Math.max(1, Math.floor(totalDays / 6));
    for (let i = 0; i <= totalDays; i += step) {
      const date = new Date(projectStart.getTime() + i * 24 * 60 * 60 * 1000);
      dateRange.push(date);
    }

    return {
      projectStart,
      projectEnd: endDate,
      totalDays,
      dateRange,
    };
  }, [tasks, project]);

  const getStatusBg = (status) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-500";
      case "In Progress":
        return "bg-blue-600";
      default:
        return "bg-amber-500";
    }
  };

  const getTaskPosition = (task) => {
    if (!timelineData) return { left: "0%", width: "10%" };

    const taskStart = new Date(task.createdAt);
    const taskEnd = new Date(task.dueDate || task.updatedAt || task.createdAt);

    const startDate =
      taskStart < timelineData.projectStart
        ? timelineData.projectStart
        : taskStart;
    const endDate =
      taskEnd > timelineData.projectEnd ? timelineData.projectEnd : taskEnd;

    const startOffset = Math.max(
      0,
      (startDate - timelineData.projectStart) / (1000 * 60 * 60 * 24)
    );
    const duration = Math.max(
      1,
      (endDate - startDate) / (1000 * 60 * 60 * 24)
    );

    const leftPercent = (startOffset / timelineData.totalDays) * 100;
    const widthPercent = (duration / timelineData.totalDays) * 100;

    return {
      left: `${Math.min(leftPercent, 90)}%`,
      width: `${Math.max(Math.min(widthPercent, 100 - leftPercent), 6)}%`,
    };
  };

  const getPriorityBorder = (priority) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
      case "critical":
      case "high":
        return "border-l-rose-500";
      case "medium":
        return "border-l-amber-500";
      case "low":
        return "border-l-blue-500";
      default:
        return "border-l-slate-400";
    }
  };

  if (!timelineData || tasks.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-10 text-center">
        <LuListTodo size={40} className="mx-auto text-slate-300 mb-3" />
        <h4 className="text-sm font-bold text-slate-800 mb-1">
          No Timeline Schedule Available
        </h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Add tasks with due dates to this workspace to view the visual Gantt timeline.
        </p>
      </div>
    );
  }

  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress").length;
  const todoTasks = tasks.filter((t) => t.status === "To Do").length;
  const progressPercent = Math.round((completedTasks / tasks.length) * 100);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <LuCalendar size={16} />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Project Gantt Timeline</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {timelineData.projectStart.toLocaleDateString()} to{" "}
            {timelineData.projectEnd.toLocaleDateString()} ({timelineData.totalDays} days span)
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-600">To Do ({todoTasks})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span className="text-slate-600">In Progress ({inProgressTasks})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-600">Completed ({completedTasks})</span>
          </div>
        </div>
      </div>

      {/* Timeline Board */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[720px]">
          {/* Timeline Date Header */}
          <div className="flex border-b border-slate-200 pb-2 mb-4">
            <div className="w-64 shrink-0 text-xs font-bold text-slate-500 uppercase tracking-wider">
              Task Item
            </div>
            <div className="flex-1 relative">
              <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                {timelineData.dateRange.map((date, index) => (
                  <span key={index}>
                    {date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Task Rows */}
          <div className="space-y-3">
            {tasks.map((task) => {
              const position = getTaskPosition(task);
              return (
                <div key={task._id} className="flex items-center group">
                  {/* Task Info Column */}
                  <div className="w-64 shrink-0 pr-4">
                    <div
                      className={`border-l-3 pl-3 py-0.5 ${getPriorityBorder(
                        task.priority
                      )}`}
                    >
                      <h4 className="font-bold text-slate-900 text-xs truncate">
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          {task.status === "Completed" ? (
                            <LuCircleCheck className="text-emerald-500" size={11} />
                          ) : (
                            <LuClock className="text-slate-400" size={11} />
                          )}
                          {task.status}
                        </span>
                        {task.priority && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            {task.priority}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Task Bar Track */}
                  <div className="flex-1 relative h-7 bg-slate-100/70 rounded-lg">
                    <div
                      className={`absolute top-1 bottom-1 rounded-md ${getStatusBg(
                        task.status
                      )} shadow-2xs hover:brightness-105 transition-all cursor-pointer`}
                      style={{
                        left: position.left,
                        width: position.width,
                      }}
                      title={`${task.title} (${task.status})`}
                    >
                      <div className="h-full flex items-center px-2 text-white text-[10px] font-semibold truncate">
                        {task.title}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Progress Footer */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700">Sprint Timeline Progress</span>
        <span className="font-bold text-slate-900">{progressPercent}% Completed</span>
      </div>
    </div>
  );
};

export default GanttChart;
