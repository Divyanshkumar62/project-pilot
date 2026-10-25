import React, { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import SkeletonLoader from "./components/ui/SkeltonLoader";
import LandingPage from "./pages/Home/LandingPage";
import { ProfileProvider } from "./context/ProfileContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const ProfileView = lazy(() => import("./pages/Profile/ProfileView"));
const ProfileEdit = lazy(() => import("./pages/Profile/ProfileEdit"));
const ChangePassword = lazy(() => import("./pages/Profile/ChangePassword"));
import { ProjectProvider } from "./context/ProjectContext";
import { TaskProvider } from "./context/TaskContext";
import TaskList from "./pages/Tasks/TaskList";
import { InvitationProvider } from "./context/InvitationContext";
import InvitationList from "./pages/Invitations/InvitationList";
import ManageInvitation from "./pages/Invitations/ManageInvitation";
import { ProtectedRoute, RoleProtectedRoute } from "./routes/ProtectedRoute";
import { NotificationProvider } from "./context/NotificationContext";
import NotificationList from "./pages/Notifications/NotificationList";
import { FeedbackProvider } from "./context/FeedbackContext";

// Lazy-loaded components
// Home page removed
const Login = lazy(() => import("./pages/Auth/Login"));
const Signup = lazy(() => import("./pages/Auth/Signup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ProjectDetails = lazy(() => import("./pages/Projects/ProjectDetails"));
const ProjectList = lazy(() => import("./pages/Projects/ProjectList"));
const MyTasks = lazy(() => import("./pages/Tasks/MyTasks"));
const TemplateLibrary = lazy(() => import("./pages/Templates/TemplateLibrary"));
const TemplateDetails = lazy(() => import("./pages/Templates/TemplateDetails"));
const Settings = lazy(() => import("./pages/setting"));

const App = () => {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <ProjectProvider>
        <TaskProvider>
          <InvitationProvider>
            <NotificationProvider>
              <ProfileProvider>
                <FeedbackProvider>
                  <Router>
                    <Suspense fallback={<SkeletonLoader />}>
                      <Routes>
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/tasks" element={<TaskList />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute>
                            <Dashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/my-tasks"
                        element={
                          <ProtectedRoute>
                            <MyTasks />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/projects"
                        element={
                          <ProtectedRoute>
                            <ProjectList />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/templates"
                        element={
                          <ProtectedRoute>
                            <TemplateLibrary />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/templates/:templateId"
                        element={
                          <ProtectedRoute>
                            <TemplateDetails />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/projects/:projectId"
                        element={
                          <ProtectedRoute>
                            <ProjectDetails />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/projects/:projectId/invitations"
                        element={
                          <RoleProtectedRoute requiredRole="Owner">
                            <InvitationList />
                          </RoleProtectedRoute>
                        }
                      />
                      <Route
                        path="/projects/:projectId/invitations/manage"
                        element={
                          <RoleProtectedRoute requiredRole="Owner">
                            <ManageInvitation />
                          </RoleProtectedRoute>
                        }
                      />
                      <Route
                        path="/notifications"
                        element={
                          <ProtectedRoute>
                            <NotificationList />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/profile"
                        element={<Navigate to="/settings" replace />}
                      />
                      <Route
                        path="/profile/edit"
                        element={<Navigate to="/settings" replace />}
                      />
                      <Route
                        path="/profile/password"
                        element={
                          <ProtectedRoute>
                            <ChangePassword />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/settings"
                        element={
                          <ProtectedRoute>
                            <Settings />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/setting" element={<Navigate to="/settings" replace />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </Router>
              </FeedbackProvider>
            </ProfileProvider>
            </NotificationProvider>
          </InvitationProvider>
        </TaskProvider>
      </ProjectProvider>
    </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;

