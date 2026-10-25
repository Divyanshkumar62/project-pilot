import React, { useState, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';
import CreateTemplateModal from '../../components/modals/CreateTemplateModal';
import { useDebounce } from '../../hooks/useDebounce';
import { ProjectContext } from '../../context/ProjectContext';
import * as templateService from '../../services/templateService';
import * as projectService from '../../services/projectService';
import * as taskService from '../../services/taskService';
import {
  predefinedTemplates,
  TEMPLATE_CATEGORIES,
  getCategoryBadgeClass,
} from '../../data/templatesData';
import { LuSearch, LuPlus, LuClock, LuListChecks, LuSparkles, LuArrowRight } from 'react-icons/lu';

const TemplateLibrary = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingTemplateId, setCreatingTemplateId] = useState(null);
  const debouncedSearch = useDebounce(search, 300);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { loadProjects } = useContext(ProjectContext);

  // Fetch templates from API
  const { data: apiTemplates = [], isLoading } = useQuery({
    queryKey: ['templates', debouncedSearch, category],
    queryFn: () =>
      templateService.getTemplates({
        search: debouncedSearch,
        category: category,
      }),
  });

  // Create project from backend template
  const createProjectMutation = useMutation({
    mutationFn: ({ templateId, projectData }) =>
      templateService.createProjectFromTemplate(templateId, projectData),
    onSuccess: (project) => {
      queryClient.invalidateQueries(['projects']);
      queryClient.invalidateQueries(['templates']);
      if (typeof loadProjects === 'function') {
        loadProjects();
      }
      setCreatingTemplateId(null);
      navigate(`/projects/${project._id}`);
    },
    onError: (err) => {
      setCreatingTemplateId(null);
      alert(err?.message || 'Failed to create workspace from template.');
    },
  });

  const handleUseTemplate = (template) => {
    setCreatingTemplateId(template._id);
    const projectData = {
      title: `${template.name} Workspace`,
      description: template.description,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(
        Date.now() + (template.defaultDuration || 30) * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split('T')[0],
    };

    createProjectMutation.mutate({ templateId: template._id, projectData });
  };

  const handleUsePredefinedTemplate = async (template) => {
    setCreatingTemplateId(template._id);
    try {
      const projectData = {
        title: `${template.name} Workspace`,
        description: template.description,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(
          Date.now() + template.defaultDuration * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .split('T')[0],
      };

      const project = await projectService.createProject(projectData);

      if (Array.isArray(template.tasks) && template.tasks.length > 0) {
        const taskPromises = template.tasks.map(async (templateTask, index) => {
          const taskStartDate = new Date(projectData.startDate);
          taskStartDate.setDate(taskStartDate.getDate() + index * 2);

          const taskData = {
            title: templateTask.title,
            description: templateTask.description,
            priority: templateTask.priority || 'Medium',
            dueDate: new Date(
              taskStartDate.getTime() +
                (templateTask.estimatedDays || 3) * 24 * 60 * 60 * 1000
            )
              .toISOString()
              .split('T')[0],
          };

          return taskService.createTask(project._id, taskData);
        });

        await Promise.all(taskPromises);
      }

      queryClient.invalidateQueries(['projects']);
      if (typeof loadProjects === 'function') {
        loadProjects();
      }
      setCreatingTemplateId(null);
      navigate(`/projects/${project._id}`);
    } catch (error) {
      console.error('Error creating project from template:', error);
      setCreatingTemplateId(null);
      alert(error?.message || 'Failed to create workspace from template.');
    }
  };

  // Filter templates
  const filteredPredefined = predefinedTemplates.filter((t) => {
    const matchesSearch =
      !debouncedSearch ||
      t.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      t.description.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesCategory =
      !category || t.category.toLowerCase() === category.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const displayTemplates =
    apiTemplates.length > 0 ? apiTemplates : filteredPredefined;

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Project Templates
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Select a template to view details or launch an agile workspace immediately.
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2.5 rounded-xl shadow-xs hover:shadow transition-all font-semibold text-sm cursor-pointer"
            >
              <LuPlus size={18} />
              <span>Create Template</span>
            </button>
          </div>

          {/* Search and Filters Bar with explicit white background */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search templates by name or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white text-slate-800 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm shadow-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400"
              />
              <LuSearch
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-white text-slate-800 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium shadow-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer sm:w-48"
            >
              <option value="">All Categories</option>
              {TEMPLATE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Templates Grid with pixel-perfect row alignment */}
          {isLoading ? (
            <div className="text-center py-16 text-slate-500 text-sm">
              Loading templates...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {displayTemplates.map((template) => {
                const isCurrentlyCreating = creatingTemplateId === template._id;

                return (
                  <div
                    key={template._id}
                    onClick={() => navigate(`/templates/${template._id}`)}
                    className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-400/80 shadow-xs hover:shadow-lg transition-all duration-200 p-6 flex flex-col justify-between h-full group cursor-pointer"
                  >
                    <div>
                      {/* Top Row: Category tag and usage count */}
                      <div className="flex justify-between items-center gap-2 mb-3">
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(
                            template.category
                          )}`}
                        >
                          {template.category}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {template.usageCount || 0} uses
                        </span>
                      </div>

                      {/* Template Title */}
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {template.name}
                        </h3>
                        <LuArrowRight
                          size={16}
                          className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0"
                        />
                      </div>

                      {/* Standardized 2-line description with uniform minimum height */}
                      <p className="text-xs sm:text-sm text-slate-500 mt-2 min-h-[42px] line-clamp-2 leading-relaxed">
                        {template.description}
                      </p>

                      {/* Metadata Section */}
                      <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mt-4 pt-3 border-t border-slate-100">
                        <span className="inline-flex items-center gap-1.5">
                          <LuListChecks size={15} className="text-slate-400" />
                          {template.tasks?.length || 0} tasks
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <LuClock size={15} className="text-slate-400" />
                          {template.defaultDuration || 30} days
                        </span>
                      </div>
                    </div>

                    {/* Pinned Bottom Button Section */}
                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevents navigating to details page
                          template._id.startsWith('predefined')
                            ? handleUsePredefinedTemplate(template)
                            : handleUseTemplate(template);
                        }}
                        disabled={isCurrentlyCreating || creatingTemplateId !== null}
                        className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-2.5 px-4 rounded-xl shadow-xs hover:shadow transition-all font-semibold text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <LuSparkles size={16} />
                        <span>
                          {isCurrentlyCreating
                            ? 'Creating Workspace...'
                            : 'Use Template'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Template Modal */}
      {showCreateModal && (
        <CreateTemplateModal closeModal={() => setShowCreateModal(false)} />
      )}
    </div>
  );
};

export default TemplateLibrary;
