import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { AuthContext } from "./AuthContext";
import {
  createProject,
  deleteProject,
  fetchProjects,
  updateProject as updateProjectAPI,
} from "../services/projectService";

export const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
  const { auth, logoutUser } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & filter projects
  const searchProjects = useCallback(
    async (params = {}) => {
      if (!auth.token) return { projects: [], total: 0, page: 1, limit: 10 };
      try {
        setLoading(true);
        const data = await import("../services/projectService").then((mod) =>
          mod.getProjects(params)
        );
        const arr = Array.isArray(data?.projects)
          ? data.projects
          : Array.isArray(data)
          ? data
          : [];
        setProjects(arr);
        return {
          projects: arr,
          total: arr.length,
          page: 1,
          limit: arr.length || 10,
        };
      } catch (err) {
        if (err?.response?.status === 401) {
          logoutUser();
        }
        console.error("Error searching projects:", err);
        setProjects([]);
        return { projects: [], total: 0, page: 1, limit: 10 };
      } finally {
        setLoading(false);
      }
    },
    [auth.token, logoutUser]
  );

  const loadProjects = async () => {
    if (!auth.token) {
      setProjects([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await fetchProjects(auth.token);
      const arr = Array.isArray(data?.projects)
        ? data.projects
        : Array.isArray(data)
        ? data
        : [];
      setProjects(arr);
    } catch (err) {
      if (err?.response?.status === 401) {
        logoutUser();
      }
      console.error("Error Fetching projects", err);
      setProjects([]); // fallback to empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth.token) {
      loadProjects();
    }
  }, [auth.token]);

  const addProject = async (projectData) => {
    try {
      if (!auth || !auth.token) {
        console.error("Error: User is not authenticated");
        return;
      }

      const newProject = await createProject(projectData);
      setProjects([...(Array.isArray(projects) ? projects : []), newProject]);
    } catch (err) {
      console.error("Error creating project", err);
    }
  };

  const updateProject = async (projectId, updatedData) => {
    try {
      const updatedProject = await updateProjectAPI(

        projectId,
        updatedData
      );
      setProjects((prevProjects) =>
        prevProjects.map((proj) =>
          proj._id === projectId ? { ...proj, ...updatedProject } : proj
        )
      );
    } catch (err) {
      console.error("Error updating project: ", err);
    }
  };

  const removeProject = async (projectId) => {
    try {
      await deleteProject(projectId);
      setProjects((prevProject) =>
        prevProject.filter((proj) => proj._id !== projectId)
      );
    } catch (err) {
      console.error("Error deleting Project: ", err);
    }
  };

  // Helper function to get user role in a project
  const getUserRole = (projectId) => {
    const project = projects.find((p) => p._id === projectId);
    if (!project) return null;

    // Check if user is the project creator
    if (String(project.createdBy) === String(auth.user?.id)) {
      return "owner";
    }

    // Check if user is a team member (case-insensitive role)
    const member = project.teamMembers?.find(
      (member) => String(member.user) === String(auth.user?.id)
    );
    return member && member.role ? member.role.toLowerCase() : null;
  };

  // Helper function to check if user can perform an action
  const canPerformAction = (projectId, requiredRole = "Owner") => {
    const userRole = getUserRole(projectId);
    if (!userRole) return false;
    if (requiredRole === "Owner") {
      return userRole === "owner";
    }
    if (requiredRole === "Manager") {
      // Only allow Manager role (case-insensitive)
      return userRole === "manager";
    }
    return false;
  };

  // Helper function to check if user is project owner
  const isProjectOwner = (projectId) => {
    return canPerformAction(projectId, "Owner");
  };

  // Helper function to check if user is project manager (for task creation)
  const isProjectManager = (projectId) => {
    return canPerformAction(projectId, "Manager");
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        loading,
        addProject,
        updateProject,
        removeProject,
        getUserRole,
        canPerformAction,
        isProjectOwner,
        isProjectManager,
        searchProjects,
        loadProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};
