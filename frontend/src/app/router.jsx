import { createBrowserRouter } from "react-router-dom";

import ProtectedRoute from "../components/layout/ProtectedRoute";
import AdminLayout from "../components/layout/AdminLayout";
import ClientLayout from "../components/layout/ClientLayout";

import LoginPage from "../pages/LoginPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";

import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminTopologyPage from "../pages/admin/AdminTopologyPage";
import AdminMicrowaveLinkBudgetPage from "../pages/admin/AdminMicrowaveLinkBudgetPage";
import AdminSiteDependencyPage from "../pages/admin/AdminSiteDependencyPage";
import AdminSiteConnectivityPage from "../pages/admin/AdminSiteConnectivityPage";
import AdminLinkLevelPage from "../pages/admin/AdminLinkLevelPage";
// import AdminPagesPage from "../pages/admin/AdminPagesPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import AdminAuditLogsPage from "../pages/admin/AdminAuditLogsPage";
import AdminClientPageBuilder from "../pages/admin/AdminClientPageBuilder";

import ClientHomePage from "../pages/client/ClientHomePage";
import ClientDynamicPage from "../pages/client/ClientDynamicPage";
import ClientHybridPage from "../pages/client/ClientHybridPage";

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
      { path: "topology", element: <AdminTopologyPage /> },
      {
        path: "microwave-link-budgets",
        element: <AdminMicrowaveLinkBudgetPage />,
      },
      {
        path: "site-connectivity",
        element: <AdminSiteConnectivityPage />,
      },
      {
        path: "site-dependencies",
        element: <AdminSiteDependencyPage />,
      },
      {
        path: "link-level",
        element: <AdminLinkLevelPage />,
      },
      { path: "client-pages", element: <AdminClientPageBuilder /> },
      // { path: "pages", element: <AdminPagesPage /> },
      { path: "users", element: <AdminUsersPage /> },
      { path: "audit-logs", element: <AdminAuditLogsPage /> },
    ],
  },
  {
    path: "/client",
    element: (
      <ProtectedRoute allowedRoles={["admin", "client"]}>
        <ClientLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <ClientHomePage /> },
      { path: "pages/:slug", element: <ClientDynamicPage /> },
      { path: "hybrid/:pageKey", element: <ClientHybridPage /> },
    ],
  },
  {
    path: "/client/pages/:slug",
    element: (
      <ProtectedRoute allowedRoles={["admin", "client"]}>
        <ClientDynamicPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: <LoginPage />,
  },
]);

export default router;
