import React, { useContext, useState, useEffect, useRef } from "react";
import { TaskContext } from "../../context/TaskContext";
import TaskCard from "../../components/task/TaskCard";
import { SkeletonTaskList } from "../../components/ui/SkeletonCard";
import EditTaskModal from "../../components/modals/EditTaskModal";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal";
import { useDeleteTask, useTasks, useUserTasks } from "../../hooks/useTasks";
import { useQueryClient } from "@tanstack/react-query";
import { on, joinProjectRoom, leaveProjectRoom } from "../../socket/socketClient";

const DEBOUNCE_MS = 300;

const statusOptions = ["All", "To Do", "In Progress", "Completed"];
const priorityOptions = ["All", "Low", "Medium", "High"];

const TaskList = () => {
  const { loadProjectTasks, refetchProjectTasks } = useContext(TaskContext);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [priority, setPriority] = useState("All");
  const [page, setPage] = useState(1);
  const [limit] = useState(6);
  const debounceRef = useRef();
  const queryClient = useQueryClient();

  // Extract projectId from URL or use context
  const currentPath = window.location.pathname;
  const projectIdMatch = currentPath.match(/\/projects\/([^/]+)/);
  const projectId = projectIdMatch ? projectIdMatch[1] : null;

  // Use React Query hooks for data management
  const { data: tasksData, isLoading, isError, error } = useTasks(
    projectId,
    {
      q: search,
      status: status !== "All" ? status : undefined,
      priority: priority !== "All" ? priority : undefined,
      page,
      limit,
    }
  );

  // If no projectId, use user tasks
  const { data: userTasksData } = useUserTasks({ page, limit });

  const data = projectId ? tasksData : userTasksData;
  const tasks = data?.data || [];
  const total = data?.total || 0;

  const deleteTaskMutation = useDeleteTask();

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalTab, setEditModalTab] = useState("details");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedTaskForDelete, setSelectedTaskForDelete] = useState(null);

  useEffect(() => {
    if (projectId) {
      loadProjectTasks(projectId);
    }
  }, [projectId, loadProjectTasks]);

  // Socket events for real-time updates
  useEffect(() => {
    if (!projectId) return;

    // Join project room
    joinProjectRoom(projectId);

    // Listen for task updates
    const handleTaskUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    };

    const handleTaskDeleted = (taskData) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });

      // Close modal if deleted task was being edited
      if (selectedTask && selectedTask._id === taskData.id) {
        handleCloseEditModal();
      }
      if (selectedTaskForDelete && selectedTaskForDelete._id === taskData.id) {
        handleCloseDeleteModal();
      }
    };

    // Subscribe to events
    on('updated', handleTaskUpdated);
    on('deleted', handleTaskDeleted);
    on('created', handleTaskUpdated); // Task creation also needs to refresh the list

    return () => {
      // Cleanup
      leaveProjectRoom(projectId);
    };
  }, [projectId, queryClient]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };
  const handleStatus = (e) => {
    setStatus(e.target.value);
    setPage(1);
  };
  const handlePriority = (e) => {
    setPriority(e.target.value);
    setPage(1);
  };
  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => {
    if (tasks.length === limit && page * limit < total) setPage((p) => p + 1);
  };

  const handleEditTask = (task, tab = "details") => {
    setSelectedTask(task);
    setEditModalTab(tab);
    setShowEditModal(true);
  };

  const handleDeleteTask = (task) => {
    setSelectedTaskForDelete(task);
    setShowDeleteModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedTask(null);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedTaskForDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTaskForDelete || !projectId) return;

    try {
      await deleteTaskMutation.mutateAsync({
        projectId,
        taskId: selectedTaskForDelete._id
      });
      handleCloseDeleteModal();
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  // Always use an array for mapping
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  return ( 
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Project Tasks</h2>
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <input 
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={handleSearch}
          className="border px-3 py-2 rounded w-full md:w-1/3"
        />
        <select
          value={status}
          onChange={handleStatus}
          className="border px-2 py-2 rounded"
        >
          {statusOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <select
          value={priority}
          onChange={handlePriority}
          className="border px-2 py-2 rounded"
        >
          {priorityOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      {isLoading ? (
        <SkeletonTaskList />
      ) : isError ? (
        <p className="text-red-500">{error?.message || "Error loading tasks"}</p>
      ) : safeTasks.length === 0 ? (
        <div className="text-center text-gray-500 mt-8">
          <svg
            className="mx-auto mb-2"
            width="48"
            height="48"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path stroke="#a0aec0" strokeWidth="2" d="M7 12h10M7 16h6M9 8h6" />
            <rect
              width="20"
              height="16"
              x="2"
              y="4"
              stroke="#a0aec0"
              strokeWidth="2"
              rx="2"
            />
          </svg>
          <p className="text-lg font-semibold mb-2">No Tasks Found</p>
          <p className="mb-4">
            You don't have any tasks yet. Start by creating your first task!
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4">
            {safeTasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                projectId={projectId}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
              />
            ))}
          </div>
          <div className="flex justify-center items-center mt-6 gap-2">
            <button
              onClick={handlePrev}
              disabled={page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span>Page {page}</span>
            <button
              onClick={handleNext}
              disabled={safeTasks.length < limit || page * limit >= total}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Edit Task Modal */}
      {showEditModal && selectedTask && (
        <EditTaskModal
          task={selectedTask}
          projectId={projectId}
          initialTab={editModalTab}
          closeModal={handleCloseEditModal}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedTaskForDelete && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
          title={`Delete Task: ${selectedTaskForDelete.title}`}
          message={`Are you sure you want to delete "${selectedTaskForDelete.title}"? This action cannot be undone and will permanently remove this task from the project.`}
          isDeleting={deleteTaskMutation.isPending}
        />
      )}
    </div>
  );
};

export default TaskList;
