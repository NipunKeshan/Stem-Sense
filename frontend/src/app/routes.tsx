import { createBrowserRouter, Navigate } from "react-router";
import Layout from "./components/Layout";
import Overview from "./pages/Overview";
import SoilMoisture from "./pages/SoilMoisture";
import Temperature from "./pages/Temperature";
import MotionDetection from "./pages/MotionDetection";
import SystemHealth from "./pages/SystemHealth";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import AdminPanel from "./pages/AdminPanel";
import { useAuth } from "./context/AuthContext";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen bg-[#0F1C12] text-white flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export const router = createBrowserRouter([
  { path: "/login", Component: Login },
  {
    path: "/",
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      { index: true, Component: Overview },
      { path: "admin", Component: AdminPanel },
      { path: "soil-moisture", Component: SoilMoisture },
      { path: "temperature", Component: Temperature },
      { path: "motion", Component: MotionDetection },
      { path: "system-health", Component: SystemHealth },
      { path: "alerts", Component: Alerts },
      { path: "settings", Component: Settings },
    ],
  },
]);
