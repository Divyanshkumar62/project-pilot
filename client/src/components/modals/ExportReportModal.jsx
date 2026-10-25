import React, { useRef } from "react";
import ReactDOM from "react-dom";
import { exportBacklogToCSV } from "../../utils/exportUtils";
import {
  LuDownload,
  LuPrinter,
  LuFileText,
  LuX,
  LuCalendar,
  LuFolderKanban,
  LuCircleCheck,
  LuClock,
  LuListTodo,
} from "react-icons/lu";

const ExportReportModal = ({ project, tasks = [], closeModal }) => {
  const reportRef = useRef(null);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (t) => t.status?.toLowerCase() === "completed"
  ).length;
  const inProgressTasks = tasks.filter(
    (t) => t.status?.toLowerCase() === "in progress"
  ).length;
  const todoTasks = tasks.filter(
    (t) => t.status?.toLowerCase() === "to do"
  ).length;
  const velocity =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    exportBacklogToCSV(project, tasks);
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 print:p-0 print:bg-white"
      onClick={closeModal}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl w-full max-w-3xl overflow-hidden transition-all scale-100 flex flex-col max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header (Hidden during Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <LuFileText size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Executive Sprint Report & Export
              </h2>
              <p className="text-xs text-slate-500">
                Download CSV dataset or print official executive summary
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer border border-slate-200"
              title="Download RFC 4180 CSV Backlog"
            >
              <LuDownload size={14} />
              Export CSV
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
              title="Print or Save as PDF"
            >
              <LuPrinter size={14} />
              Print / Save PDF
            </button>
            <button
              onClick={closeModal}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer ml-2"
              aria-label="Close modal"
            >
              <LuX size={18} />
            </button>
          </div>
        </div>

        {/* Printable Report Body */}
        <div
          ref={reportRef}
          className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 print:p-0 print:overflow-visible"
        >
          {/* Executive Header */}
          <div className="border-b border-slate-200 pb-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest block mb-1">
                  Project Pilot Sprint Audit
                </span>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {project?.title || "Workspace"}
                </h1>
                <p className="text-xs text-slate-600 mt-1 max-w-xl">
                  {project?.description || "Agile sprint backlog and deliverable report."}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                  {project?.status || "Active"}
                </span>
                <p className="text-[10px] text-slate-400 mt-1.5">
                  Generated {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Dates row */}
            <div className="flex items-center gap-6 mt-4 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <LuCalendar size={13} className="text-slate-400" />
                Kickoff: {project?.startDate ? new Date(project.startDate).toLocaleDateString() : "Scheduled"}
              </span>
              {project?.endDate && (
                <span className="flex items-center gap-1.5">
                  <LuCalendar size={13} className="text-slate-400" />
                  Target Delivery: {new Date(project.endDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Velocity KPI Strip */}
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Backlog</span>
              <p className="text-xl font-extrabold text-slate-900 mt-0.5">{totalTasks}</p>
            </div>
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
              <span className="text-[11px] font-bold text-emerald-700 uppercase">Delivered</span>
              <p className="text-xl font-extrabold text-emerald-800 mt-0.5">{completedTasks}</p>
            </div>
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-center">
              <span className="text-[11px] font-bold text-blue-700 uppercase">In Flight</span>
              <p className="text-xl font-extrabold text-blue-800 mt-0.5">{inProgressTasks}</p>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Velocity</span>
              <p className="text-xl font-extrabold text-blue-600 mt-0.5">{velocity}%</p>
            </div>
          </div>

          {/* Detailed Task Backlog Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Sprint Deliverables ({tasks.length})
            </h3>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">Assignee</th>
                    <th className="py-2.5 px-3">Target Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tasks.map((task) => (
                    <tr key={task._id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-semibold text-slate-900 max-w-[200px] truncate">
                        {task.title}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            task.status === "Completed"
                              ? "bg-emerald-100 text-emerald-800"
                              : task.status === "In Progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {task.status || "To Do"}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-600">
                        {task.priority || "Medium"}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {task.assignedTo?.name || "Unassigned"}
                      </td>
                      <td className="py-2 px-3 text-slate-500">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Signature Note */}
          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Project Pilot Agile Platform · Confidential & Proprietary</span>
            <span>Page 1 of 1</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ExportReportModal;
