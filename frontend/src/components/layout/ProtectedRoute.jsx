import { Navigate } from "react-router-dom";
import { ShieldCheck, LoaderCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();
  const userRole =
    typeof user?.role === "string" ? user.role.trim().toLowerCase() : user?.role;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-cyan-50 px-4">
        <div className="w-full max-w-sm rounded-3xl border border-sky-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
            <LoaderCircle className="animate-spin" size={24} />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Loading workspace</h2>
          <p className="mt-2 text-sm text-slate-500">
            Please wait while we verify your access.
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-cyan-50 px-4">
        <div className="w-full max-w-md rounded-3xl border border-sky-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <ShieldCheck size={24} />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Unauthorized Access</h2>
          <p className="mt-2 text-sm text-slate-500">
            You do not have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
