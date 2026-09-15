import { Navigate, Route, Routes } from "react-router-dom";
import { ReactNode } from "react";
import { useAppSelector } from "./store/hooks";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import ProjectsPage from "./pages/ProjectsPage";
import BoardPage from "./pages/BoardPage";
import BacklogPage from "./pages/BacklogPage";
import AppLayout from "./components/layout/AppLayout";

function Protected({ children }: { children: ReactNode }) {
  const token = useAppSelector((s) => s.auth.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const token = useAppSelector((s) => s.auth.token);

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <AuthPage mode="login" />} />
      <Route path="/register" element={token ? <Navigate to="/" replace /> : <AuthPage mode="register" />} />

      <Route
        element={
          <Protected>
            <AppLayout />
          </Protected>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId/board" element={<BoardPage />} />
        <Route path="/projects/:projectId/backlog" element={<BacklogPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}