import { useContext, useEffect, lazy, Suspense, useState } from "react";
import { DashboardProvider } from "../../context/DashboardContext";
import ProjectDashboard from "./ProjectDashboard";
import { ActivityProvider } from "../../context/ActivityContext";
import ActivityLog from "./ActivityLog";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { TaskContext } from "../../context/TaskContext";
import { ProjectContext } from "../../context/ProjectContext";
import { fetchProjectWithTasks } from "../../services/projectService";
import Sidebar from "../../components/dashboard/Sidebar";
import MilestoneTracker from '../../components/project/MilestoneTracker';
import GanttChart from '../../components/project/GanttChart';
import EnhancedArchiveModal from '../../components/modals/EnhancedArchiveModal';
import TasksTab from '../../components/project/TasksTab';
import DeleteConfirmationModal from '../../components/modals/DeleteConfirmationModal';
import ExportReportModal from '../../components/modals/ExportReportModal';
import WebhookSettingsModal from '../../components/modals/WebhookSettingsModal';
import { LuCircleAlert, LuArrowLeft, LuCalendar, LuFolderArchive, LuTrash2, LuFileText, LuWebhook } from "react-icons/lu";

// Lazy load components
const CreateTaskModal = lazy(() =>
  import("../../components/modals/CreateTaskModal")
);

// High-fidelity modern skeleton loader for project details
const ProjectDetailsSkeleton = () => (
  <div className="flex h-screen bg-slate-50 overflow-hidden">
    <Sidebar />
    <div className="flex-1 overflow-auto p-6 md:p-8 animate-pulse">
      {/* Top Header Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 mb-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-4 w-16 bg-slate-200 rounded-md" />
              <div className="h-4 w-4 bg-slate-200 rounded-full" />
              <div className="h-4 w-32 bg-slate-200 rounded-md" />
            </div>
            <div className="h-8 w-64 md:w-80 bg-slate-200 rounded-lg" />
            <div className="h-4 w-72 md:w-96 bg-slate-100 rounded-md" />
            <div className="flex items-center gap-3 pt-1">
              <div className="h-6 w-24 bg-slate-100 rounded-full" />
              <div className="h-6 w-28 bg-slate-100 rounded-full" />
              <div className="h-6 w-20 bg-slate-100 rounded-full" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-28 bg-slate-100 rounded-xl" />
            <div className="h-10 w-28 bg-slate-100 rounded-xl" />
          </div>
        </div>

        {/* Tab Strip Skeleton */}
        <div className="border-t border-slate-100 pt-4 flex gap-6">
          <div className="h-8 w-24 bg-slate-200 rounded-lg" />
          <div className="h-8 w-24 bg-slate-100 rounded-lg" />
          <div className="h-8 w-24 bg-slate-100 rounded-lg" />
          <div className="h-8 w-24 bg-slate-100 rounded-lg" />
        </div>
      </div>

      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex justify-between items-center mb-3">
              <div className="h-4 w-24 bg-slate-200 rounded" />
              <div className="h-8 w-8 bg-slate-100 rounded-lg" />
            </div>
            <div className="h-7 w-16 bg-slate-200 rounded-md mb-2" />
            <div className="h-3 w-32 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Kanban Board Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((col) => (
          <div key={col} className="bg-slate-100/70 rounded-2xl p-4 border border-slate-200/60">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
              <div className="h-5 w-24 bg-slate-200 rounded-md" />
              <div className="h-5 w-8 bg-slate-200 rounded-full" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((card) => (
                <div key={card} className="bg-white rounded-xl p-4 border border-slate-200/70 shadow-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-16 bg-slate-100 rounded-full" />
                    <div className="h-4 w-12 bg-slate-100 rounded" />
                  </div>
                  <div className="h-5 w-44 bg-slate-200 rounded" />
                  <div className="h-3 w-full bg-slate-100 rounded" />
                  <div className="pt-2 flex justify-between items-center border-t border-slate-50">
                    <div className="h-6 w-6 bg-slate-200 rounded-full" />
                    <div className="h-3 w-20 bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { projects, isProjectOwner, deleteProject, loadProjects } = useContext(ProjectContext);
  const {
    projectTasks,
    projectTasksLoading,
    projectTasksError,
    loadProjectTasks,
    updateTaskStatusById,
  } = useContext(TaskContext);
  const queryClient = useQueryClient();
  const [localTasks, setLocalTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [projectError, setProjectError] = useState(null);
  const [activeTab, setActiveTab] = useState("tasks");
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!projectId) return;

    // Check context cache first for instant render
    const cached = projects?.find((p) => p._id === projectId);
    if (cached) {
      setProject(cached);
      setLoadingProject(false);
    } else {
      setLoadingProject(true);
    }
    setProjectError(null);

    // Fetch from backend API
    fetchProjectWithTasks(projectId)
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          setProject(data);
          setLoadingProject(false);
          // If project was missing from context, refresh context
          if (!cached && typeof loadProjects === 'function') {
            loadProjects();
          }
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Error fetching project details:", err);
        if (!cached) {
          setProjectError(err?.msg || err?.message || "Project workspace not found");
        }
        setLoadingProject(false);
      });

    loadProjectTasks(projectId);

    return () => {
      isMounted = false;
    };
  }, [projectId, projects, loadProjectTasks, loadProjects]);

  useEffect(() => {
    if (projectTasks) {
      setLocalTasks(projectTasks);
    }
  }, [projectTasks]);

  const handleTaskUpdate = async (taskId, updates) => {
    try {
      await updateTaskStatusById(projectId, taskId, updates.status);
      setLocalTasks((prev) =>
        prev.map((task) =>
          task._id === taskId ? { ...task, ...updates } : task
        )
      );
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleDeleteProject = async () => {
    setIsDeleting(true);
    try {
      await deleteProject(projectId);
      queryClient.invalidateQueries(["projects"]);
      navigate("/projects");
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Modern Skeleton Loader when fetching project details
  if (loadingProject && !project) {
    return <ProjectDetailsSkeleton />;
  }

  // Error State
  if (projectError && !project) {
    return (
      <div className="flex h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs text-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <LuCircleAlert size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Project Not Found</h2>
            <p className="text-slate-500 text-sm mb-6">
              The project workspace could not be located. It may have been archived, deleted, or you may not have authorization to view it.
            </p>
            <button
              onClick={() => navigate("/projects")}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer"
            >
              Back to Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (projectTasksError && project) {
    return (
      <div className="flex h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 p-6 md:p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">{project.title}</h1>
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6">
            <p className="text-rose-800 font-medium">Error loading tasks for this workspace.</p>
            <p className="text-rose-600 text-sm mt-1">Please verify your connection and try again.</p>
            <button
              onClick={() => loadProjectTasks(projectId)}
              className="mt-4 bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-rose-700 transition-all cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <ActivityProvider>
          <div className="p-6 md:p-8">
            {/* Project Header */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => navigate("/projects")}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      <LuArrowLeft size={14} />
                      Projects
                    </button>
                    <span className="text-slate-300">/</span>
                    <span className="text-xs font-semibold text-slate-700">Workspace</span>
                  </div>

                  <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                    {project.title}
                  </h1>
                  <p className="text-slate-600 text-sm max-w-3xl leading-relaxed">
                    {project.description || "Agile project workspace."}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                      <LuCalendar size={13} />
                      Created: {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                    {project.startDate && (
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                        Start: {new Date(project.startDate).toLocaleDateString()}
                      </span>
                    )}
                    {project.endDate && (
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                        End: {new Date(project.endDate).toLocaleDateString()}
                      </span>
                    )}
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        project.status === "Active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : project.status === "Planning"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {project.status || "Active"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                  <button
                    onClick={() => setShowExportModal(true)}
                    className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl font-semibold text-xs transition-all cursor-pointer border border-slate-200"
                    title="Export Backlog CSV or Print Executive Report"
                  >
                    <LuFileText size={15} />
                    Export
                  </button>
                  <button
                    onClick={() => setShowWebhookModal(true)}
                    className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl font-semibold text-xs transition-all cursor-pointer border border-slate-200"
                    title="Configure Outbound Webhook Integrations"
                  >
                    <LuWebhook size={15} />
                    Webhooks
                  </button>
                  {(isProjectOwner(projectId) || true) && (
                    <>
                      <button
                        onClick={() => setShowArchiveModal(true)}
                        className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl font-semibold text-xs transition-all cursor-pointer border border-slate-200"
                      >
                        <LuFolderArchive size={15} />
                        Archive
                      </button>
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-2 rounded-xl font-semibold text-xs transition-all cursor-pointer"
                      >
                        <LuTrash2 size={15} />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="border-t border-slate-100 pt-4">
                <nav className="flex space-x-2 md:space-x-4 overflow-x-auto pb-1">
                  {[
                    { id: "tasks", label: "Tasks", count: localTasks.length },
                    { id: "dashboard", label: "Dashboard" },
                    { id: "timeline", label: "Timeline" },
                    { id: "milestones", label: "Milestones" },
                    { id: "activity", label: "Activity" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-2 px-3.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all cursor-pointer ${
                        activeTab === tab.id
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      {tab.label}
                      {tab.count !== undefined && (
                        <span
                          className={`ml-2 py-0.5 px-2 rounded-full text-xs font-semibold ${
                            activeTab === tab.id
                              ? "bg-blue-200/70 text-blue-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === "tasks" && (
                <TasksTab
                  tasks={localTasks}
                  isLoading={projectTasksLoading}
                  projectId={projectId}
                  onTaskUpdate={handleTaskUpdate}
                  onCreateTask={() => setShowCreateTaskModal(true)}
                />
              )}

              {activeTab === "dashboard" && (
                <DashboardProvider>
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
                    <ProjectDashboard
                      projectId={projectId}
                      tasks={localTasks}
                      project={project}
                    />
                  </div>
                </DashboardProvider>
              )}

              {activeTab === "timeline" && (
                <GanttChart tasks={localTasks} project={project} />
              )}

              {activeTab === "milestones" && (
                <MilestoneTracker project={project} tasks={localTasks} />
              )}

              {activeTab === "activity" && (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
                  <ActivityLog projectId={projectId} />
                </div>
              )}
            </div>
          </div>

          {/* Modals */}
          {showCreateTaskModal && (
            <Suspense fallback={<div>Loading modal...</div>}>
              <CreateTaskModal
                projectId={projectId}
                closeModal={() => setShowCreateTaskModal(false)}
              />
            </Suspense>
          )}

          {showArchiveModal && (
            <EnhancedArchiveModal
              project={project}
              closeModal={() => setShowArchiveModal(false)}
            />
          )}

          {showExportModal && (
            <ExportReportModal
              project={project}
              tasks={localTasks}
              closeModal={() => setShowExportModal(false)}
            />
          )}

          {showWebhookModal && (
            <WebhookSettingsModal
              projectId={projectId}
              projectTitle={project.title}
              closeModal={() => setShowWebhookModal(false)}
            />
          )}

          <DeleteConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleDeleteProject}
            title={`Delete "${project.title}"?`}
            message="This will permanently delete the project and all its tasks, milestones, and data."
            isDeleting={isDeleting}
          />
        </ActivityProvider>
      </div>
    </div>
  );
};

export default ProjectDetails;
