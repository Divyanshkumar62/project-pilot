import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Sidebar from "../../components/dashboard/Sidebar";
import { ProjectContext } from "../../context/ProjectContext";
import {
  predefinedTemplates,
  getPredefinedTemplateById,
  getCategoryBadgeClass,
} from "../../data/templatesData";
import * as templateService from "../../services/templateService";
import * as projectService from "../../services/projectService";
import * as taskService from "../../services/taskService";
import {
  LuArrowLeft,
  LuSparkles,
  LuClock,
  LuListChecks,
  LuUsers,
  LuLayers,
  LuCircleAlert,
  LuCalendar,
  LuShieldCheck,
} from "react-icons/lu";

const TemplateDetailsSkeleton = () => (
  <div className="flex h-screen bg-slate-50 overflow-hidden">
    <Sidebar />
    <div className="flex-1 overflow-auto p-6 md:p-8 animate-pulse">
      {/* Back button skeleton */}
      <div className="h-5 w-32 bg-slate-200 rounded-md mb-6" />

      {/* Hero Header Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 mb-8 shadow-xs">
        <div className="flex justify-between items-start gap-6">
          <div className="space-y-3 flex-1">
            <div className="h-6 w-24 bg-slate-100 rounded-full" />
            <div className="h-9 w-72 md:w-96 bg-slate-200 rounded-lg" />
            <div className="h-4 w-full max-w-2xl bg-slate-100 rounded" />
            <div className="flex flex-wrap gap-3 pt-2">
              <div className="h-8 w-32 bg-slate-100 rounded-xl" />
              <div className="h-8 w-32 bg-slate-100 rounded-xl" />
              <div className="h-8 w-32 bg-slate-100 rounded-xl" />
            </div>
          </div>
          <div className="h-12 w-40 bg-slate-200 rounded-xl hidden md:block" />
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-6 w-48 bg-slate-200 rounded mb-4" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              <div className="flex justify-between">
                <div className="h-5 w-48 bg-slate-200 rounded" />
                <div className="h-5 w-16 bg-slate-100 rounded-full" />
              </div>
              <div className="h-4 w-3/4 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="h-6 w-40 bg-slate-200 rounded" />
            <div className="h-4 w-full bg-slate-100 rounded" />
            <div className="h-4 w-3/4 bg-slate-100 rounded" />
            <div className="h-12 w-full bg-slate-200 rounded-xl pt-2" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const TemplateDetails = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { loadProjects } = useContext(ProjectContext);

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    // 1. Check predefined templates first
    const foundPredefined = getPredefinedTemplateById(templateId);
    if (foundPredefined) {
      setTemplate(foundPredefined);
      setLoading(false);
      return;
    }

    // 2. Fetch from backend templates API
    templateService
      .getTemplates()
      .then((templatesList) => {
        if (!isMounted) return;
        const found = templatesList?.find((t) => t._id === templateId);
        if (found) {
          setTemplate(found);
        } else {
          setError("Template not found");
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Error fetching template details:", err);
        setError("Failed to load template details");
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [templateId]);

  const handleUseTemplate = async () => {
    if (!template || isCreating) return;
    setIsCreating(true);

    try {
      if (template._id.startsWith("predefined")) {
        const projectData = {
          title: `${template.name} Workspace`,
          description: template.description,
          startDate: new Date().toISOString().split("T")[0],
          endDate: new Date(
            Date.now() + template.defaultDuration * 24 * 60 * 60 * 1000
          )
            .toISOString()
            .split("T")[0],
        };

        const project = await projectService.createProject(projectData);

        // Populate tasks from template
        if (Array.isArray(template.tasks) && template.tasks.length > 0) {
          const taskPromises = template.tasks.map(async (templateTask, index) => {
            const taskStartDate = new Date(projectData.startDate);
            taskStartDate.setDate(taskStartDate.getDate() + index * 2);

            const taskData = {
              title: templateTask.title,
              description: templateTask.description,
              priority: templateTask.priority || "Medium",
              dueDate: new Date(
                taskStartDate.getTime() +
                  (templateTask.estimatedDays || 3) * 24 * 60 * 60 * 1000
              )
                .toISOString()
                .split("T")[0],
            };

            return taskService.createTask(project._id, taskData);
          });

          await Promise.all(taskPromises);
        }

        queryClient.invalidateQueries(["projects"]);
        if (typeof loadProjects === "function") {
          loadProjects();
        }
        navigate(`/projects/${project._id}`);
      } else {
        // Backend template
        const projectData = {
          title: `${template.name} Workspace`,
          description: template.description,
          startDate: new Date().toISOString().split("T")[0],
          endDate: new Date(
            Date.now() + (template.defaultDuration || 30) * 24 * 60 * 60 * 1000
          )
            .toISOString()
            .split("T")[0],
        };

        const project = await templateService.createProjectFromTemplate(
          template._id,
          projectData
        );

        queryClient.invalidateQueries(["projects"]);
        if (typeof loadProjects === "function") {
          loadProjects();
        }
        navigate(`/projects/${project._id}`);
      }
    } catch (err) {
      console.error("Error creating project from template:", err);
      alert(
        err?.message ||
          "Unable to create workspace from template. Please try again."
      );
    } finally {
      setIsCreating(false);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "medium":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "low":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  if (loading) {
    return <TemplateDetailsSkeleton />;
  }

  if (error || !template) {
    return (
      <div className="flex h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs text-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <LuCircleAlert size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Template Not Found</h2>
            <p className="text-slate-500 text-sm mb-6">
              The requested agile template could not be found or may have been deleted.
            </p>
            <button
              onClick={() => navigate("/templates")}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer"
            >
              Back to Template Library
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
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {/* Top-Left Back Button */}
          <button
            onClick={() => navigate("/templates")}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold text-sm mb-6 transition-colors group cursor-pointer"
          >
            <LuArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Template Library</span>
          </button>

          {/* Hero Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 mb-8 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-md font-semibold border ${getCategoryBadgeClass(
                      template.category
                    )}`}
                  >
                    {template.category}
                  </span>
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                    <LuShieldCheck size={14} className="text-blue-600" />
                    Verified Agile Specification
                  </span>
                </div>

                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {template.name}
                </h1>

                <p className="text-slate-600 text-sm md:text-base max-w-3xl leading-relaxed">
                  {template.description}
                </p>

                {/* Metadata Chips */}
                <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold text-slate-600">
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
                    <LuClock size={14} className="text-slate-500" />
                    <span>{template.defaultDuration} Days Sprint Cycle</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
                    <LuListChecks size={14} className="text-blue-600" />
                    <span>{template.tasks?.length || 0} Pre-configured Tasks</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
                    <LuUsers size={14} className="text-emerald-600" />
                    <span>{template.usageCount || 0} Workspaces Deployed</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
                    <LuLayers size={14} className="text-purple-600" />
                    <span>{template.createdBy?.name || "System"}</span>
                  </div>
                </div>
              </div>

              {/* Primary Action Button */}
              <div className="shrink-0">
                <button
                  onClick={handleUseTemplate}
                  disabled={isCreating}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 px-6 rounded-xl shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <LuSparkles size={18} />
                  <span>{isCreating ? "Creating Workspace..." : "Use Template"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2-Column Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Columns: Task Breakdown */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    Sprint Backlog & Task Breakdown
                  </h2>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    {template.tasks?.length || 0} Work Items
                  </span>
                </div>

                <div className="space-y-3">
                  {template.tasks?.map((task, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <h3 className="font-bold text-slate-900 text-sm md:text-base">
                            {task.title}
                          </h3>
                        </div>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border shrink-0 ${getPriorityBadge(
                            task.priority
                          )}`}
                        >
                          {task.priority || "Medium"}
                        </span>
                      </div>

                      <p className="text-slate-600 text-xs md:text-sm pl-9 leading-relaxed">
                        {task.description || "Sprint deliverable task item."}
                      </p>

                      <div className="mt-3 pt-3 border-t border-slate-100 pl-9 flex items-center gap-4 text-xs font-medium text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <LuClock size={13} />
                          Est. Duration: {task.estimatedDays || 3} days
                        </span>
                        <span>•</span>
                        <span>Sequence Offset: +{index * 2} days</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Template Specifications & Quick Actions */}
            <div className="space-y-6">
              {/* Specification Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                  Template Specifications
                </h3>

                <dl className="space-y-4 text-xs">
                  <div>
                    <dt className="text-slate-500 font-medium">Methodology</dt>
                    <dd className="font-semibold text-slate-900 mt-0.5">
                      Agile Scrum / Sprint Kanban
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 font-medium">Sprint Duration</dt>
                    <dd className="font-semibold text-slate-900 mt-0.5">
                      {template.defaultDuration} Calendar Days
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 font-medium">Included Tasks</dt>
                    <dd className="font-semibold text-slate-900 mt-0.5">
                      {template.tasks?.length || 0} Staggered Backlog Items
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 font-medium">Target Team</dt>
                    <dd className="font-semibold text-slate-900 mt-0.5">
                      Product & Engineering Workspaces
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 font-medium">Automation</dt>
                    <dd className="font-semibold text-slate-900 mt-0.5">
                      Auto-populates due dates, priorities, and project roles
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Ready to Launch Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4 border border-blue-400/20">
                  <LuSparkles size={20} />
                </div>
                <h3 className="text-base font-bold mb-2">Launch Workspace</h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-5">
                  Clicking Use Template will immediately create an active agile project with these pre-populated tasks, dates, and sprint board.
                </p>
                <button
                  onClick={handleUseTemplate}
                  disabled={isCreating}
                  className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <LuSparkles size={16} />
                  <span>{isCreating ? "Creating Workspace..." : "Use Template"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateDetails;
