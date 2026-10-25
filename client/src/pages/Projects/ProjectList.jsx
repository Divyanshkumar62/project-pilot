import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import ProjectCard from "../../components/project/ProjectCard";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal";
import { useProjects, useDeleteProject } from "../../hooks/useProjects";
import Sidebar from "../../components/dashboard/Sidebar";
import { useLocation } from "react-router-dom";
import { useDebounce } from "../../hooks/useDebounce";
import { SkeletonProjectCard } from "../../components/ui/SkeletonCard";
import { useFeedback } from "../../context/FeedbackContext";

const ProjectList = ({ searchQuery, sortBy: propSortBy, sortOrder: propSortOrder }) => {
  const location = useLocation();
  const [localSearch, setLocalSearch] = useState("");
  const [localSortBy, setLocalSortBy] = useState("createdAt");
  const [localSortOrder, setLocalSortOrder] = useState("desc");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const debouncedLocalSearch = useDebounce(localSearch, 300);
  const { showDelete } = useFeedback();
  
  useEffect(() => {
    console.log('ProjectList re-rendered with showDeleteModal:', showDeleteModal);
  }, [showDeleteModal]);
  
  // Use props from dashboard or local state for direct access
  const finalSearchQuery = searchQuery !== undefined ? searchQuery : debouncedLocalSearch;
  const finalSortBy = propSortBy !== undefined ? propSortBy : localSortBy;
  const finalSortOrder = propSortOrder !== undefined ? propSortOrder : localSortOrder;
  
  const { data: projects = [], isLoading: loading, error } = useProjects({ 
    q: finalSearchQuery,
    sortBy: finalSortBy,
    sortOrder: finalSortOrder
  });
  const deleteProjectMutation = useDeleteProject();

  const isInDashboard = location.pathname === '/dashboard';

  // Client-side sorting as fallback
  const sortedProjects = [...projects].sort((a, b) => {
    let aValue, bValue;
    
    switch (finalSortBy) {
      case 'title':
        aValue = a.title?.toLowerCase() || '';
        bValue = b.title?.toLowerCase() || '';
        break;
      case 'status':
        aValue = a.status || '';
        bValue = b.status || '';
        break;
      case 'updatedAt':
        aValue = new Date(a.updatedAt || a.createdAt);
        bValue = new Date(b.updatedAt || b.createdAt);
        break;
      default: // createdAt
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
    }

    if (finalSortBy === 'title' || finalSortBy === 'status') {
      return finalSortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    } else {
      return finalSortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }
  });

  const handleDeleteProject = (projectId) => {
    console.log('handleDeleteProject called with:', projectId);
    setProjectToDelete(projectId);
    setShowDeleteModal(true);
    console.log('Modal state set:', { projectToDelete: projectId, showDeleteModal: true });
  };

  const confirmDelete = () => {
    console.log('confirmDelete called with projectToDelete:', projectToDelete);
    if (projectToDelete) {
      deleteProjectMutation.mutate(projectToDelete);
      showDelete("Project permanently deleted", {
        description: "Workspace and associated tasks have been removed.",
      });
      setShowDeleteModal(false);
      setProjectToDelete(null);
    }
  };

  const targetProject = projects.find((p) => p._id === projectToDelete);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading projects...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">Error loading projects: {error.message}</div>
      </div>
    );
  }

  if (isInDashboard) {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonProjectCard key={i} />
          ))}
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {sortedProjects.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              {finalSearchQuery ? "No projects found matching your search." : "No projects yet. Create your first project!"}
            </div>
          ) : (
            sortedProjects.map((project) => (
              <ProjectCard
                key={project._id}
                project={project}
                onDelete={() => handleDeleteProject(project._id)}
                onUpdate={() => {}}
              />
            ))
          )}
        </div>
        
        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setProjectToDelete(null);
          }}
          onConfirm={confirmDelete}
          projectName={targetProject?.title}
          isDeleting={deleteProjectMutation.isPending}
        />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <div className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6">
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">My Projects</h1>
            
            {/* Search and Sort Controls */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-6">
              <input
                type="text"
                placeholder="Search projects..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="flex-1 min-w-0 sm:min-w-64 px-4 py-2 bg-white text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base shadow-xs placeholder:text-slate-400"
              />
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <select
                  value={localSortBy}
                  onChange={(e) => setLocalSortBy(e.target.value)}
                  className="px-3 py-2 bg-white text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base shadow-xs cursor-pointer"
                >
                  <option value="createdAt">Date Created</option>
                  <option value="updatedAt">Last Updated</option>
                  <option value="title">Project Name</option>
                  <option value="status">Status</option>
                </select>
                
                <select
                  value={localSortOrder}
                  onChange={(e) => setLocalSortOrder(e.target.value)}
                  className="px-3 py-2 bg-white text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base shadow-xs cursor-pointer"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {sortedProjects.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                {finalSearchQuery ? "No projects found matching your search." : "No projects yet. Create your first project!"}
              </div>
            ) : (
              sortedProjects.map((project) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  onDelete={() => handleDeleteProject(project._id)}
                  onUpdate={() => {}}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setProjectToDelete(null);
        }}
        onConfirm={confirmDelete}
        projectName={targetProject?.title}
        isDeleting={deleteProjectMutation.isPending}
      />

    </div>
  );
};

export default ProjectList;
