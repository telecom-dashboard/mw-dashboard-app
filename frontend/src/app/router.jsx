import { createBrowserRouter } from "react-router-dom";

import ProtectedRoute from "../components/layout/ProtectedRoute";
import AdminLayout from "../components/layout/AdminLayout";

import LoginPage from "../pages/LoginPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";

import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminSitesPage from "../pages/admin/AdminSitesPage";
import AdminLinksPage from "../pages/admin/AdminLinksPage";
import AdminTopologyPage from "../pages/admin/AdminTopologyPage";
import AdminLinkBudgetPage from "../pages/admin/AdminLinkBudgetPage";
import AdminLinkStatusPage from "../pages/admin/AdminLinkStatusPage";
import AdminPingPage from "../pages/admin/AdminPingPage";
import AdminImportCenterPage from "../pages/admin/AdminImportCenterPage";
import AdminTemplatesPage from "../pages/admin/AdminTemplatesPage";
import AdminPagesPage from "../pages/admin/AdminPagesPage";
import AdminNavigationPage from "../pages/admin/AdminNavigationPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import AdminAuditLogsPage from "../pages/admin/AdminAuditLogsPage";

import SiteSearchPage from "../pages/client/SiteSearchPage";
import SiteDetailPage from "../pages/client/SiteDetailPage";
import ClientLinkStatusPage from "../pages/client/ClientLinkStatusPage";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/unauthorized",
    element: <UnauthorizedPage />,
  },

  {
    path: "/admin",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "sites", element: <AdminSitesPage /> },
      { path: "links", element: <AdminLinksPage /> },
      { path: "topology", element: <AdminTopologyPage /> },
      { path: "link-budget", element: <AdminLinkBudgetPage /> },
      { path: "link-status", element: <AdminLinkStatusPage /> },
      { path: "ping", element: <AdminPingPage /> },
      { path: "imports", element: <AdminImportCenterPage /> },
      { path: "templates", element: <AdminTemplatesPage /> },
      { path: "pages", element: <AdminPagesPage /> },
      { path: "navigation", element: <AdminNavigationPage /> },
      { path: "users", element: <AdminUsersPage /> },
      { path: "audit-logs", element: <AdminAuditLogsPage /> },
    ],
  },

  {
    path: "/client",
    element: (
      <ProtectedRoute allowedRoles={["admin", "client"]}>
        <SiteSearchPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/client/sites/:id",
    element: (
      <ProtectedRoute allowedRoles={["admin", "client"]}>
        <SiteDetailPage />
      </ProtectedRoute>
    ),
  },
  {
  path: "/client/link-status",
  element: (
    <ProtectedRoute allowedRoles={["admin", "client"]}>
      <ClientLinkStatusPage />
    </ProtectedRoute>
  ),
  },

  {
    path: "*",
    element: <LoginPage />,
  },
]);

export default router;