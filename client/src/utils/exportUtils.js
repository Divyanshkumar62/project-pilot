// RFC 4180 compliant CSV Export for Project Backlogs
export function exportBacklogToCSV(project, tasks = []) {
  if (!project) return;

  const headers = [
    "Task ID",
    "Title",
    "Description",
    "Status",
    "Priority",
    "Assignee Name",
    "Assignee Email",
    "Due Date",
    "Created Date",
  ];

  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = tasks.map((t) => [
    escapeCSV(t._id),
    escapeCSV(t.title),
    escapeCSV(t.description || ""),
    escapeCSV(t.status || "To Do"),
    escapeCSV(t.priority || "Medium"),
    escapeCSV(t.assignedTo?.name || "Unassigned"),
    escapeCSV(t.assignedTo?.email || ""),
    escapeCSV(t.dueDate ? new Date(t.dueDate).toISOString().split("T")[0] : ""),
    escapeCSV(t.createdAt ? new Date(t.createdAt).toISOString().split("T")[0] : ""),
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const sanitizedTitle = (project.title || "project").toLowerCase().replace(/[^a-z0-9]/gi, "_");
  const dateStr = new Date().toISOString().split("T")[0];

  link.setAttribute("href", url);
  link.setAttribute("download", `${sanitizedTitle}_sprint_backlog_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
