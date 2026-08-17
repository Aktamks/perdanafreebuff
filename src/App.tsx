import type { ReactNode } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { Layout } from "./components/Layout";
import { ClientDetail } from "./pages/ClientDetail";
import { Clients } from "./pages/Clients";
import { DashboardAdmin } from "./pages/DashboardAdmin";
import { DashboardKlien } from "./pages/DashboardKlien";
import { DashboardTim } from "./pages/DashboardTim";
import { Jobs } from "./pages/Jobs";
import { Login } from "./pages/Login";
import { MapMonitoring } from "./pages/MapMonitoring";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { Teams } from "./pages/Teams";

/**
 * Hanya menampilkan halaman Login (tanpa Sidebar/Topbar).
 * User yang sudah login tidak perlu kembali ke halaman login.
 */
function LoginLayout() {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

/**
 * Layout dashboard: Sidebar + Topbar + konten halaman.
 * Hanya bisa diakses setelah login; jika belum login diarahkan ke /login.
 */
function DashboardLayout() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Layout />;
}

function RoleDashboard() {
  const { user } = useAuth();
  if (user?.role === "field_team") return <DashboardTim />;
  if (user?.role === "client") return <DashboardKlien />;
  return <DashboardAdmin />;
}

/**
 * Route guard berbasis role: halaman yang dibungkus hanya boleh diakses admin.
 * Role lain diarahkan ke /dashboard (bukan error/blank page).
 */
function AdminOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<LoginLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>

      <Route element={<DashboardLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<RoleDashboard />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/map" element={<MapMonitoring />} />
        <Route
          path="/teams"
          element={
            <AdminOnly>
              <Teams />
            </AdminOnly>
          }
        />
        <Route
          path="/clients"
          element={
            <AdminOnly>
              <Clients />
            </AdminOnly>
          }
        />
        <Route
          path="/clients/:id"
          element={
            <AdminOnly>
              <ClientDetail />
            </AdminOnly>
          }
        />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
