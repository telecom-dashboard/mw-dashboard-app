import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLoading } from "../../context/LoadingContext";
import AdminSidebar from "./AdminSidebar";
import TopLoadingBar from "../common/TopLoadingBar";
import {
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
} from "lucide-react";
import { useEffect, useState } from "react";

function AdminLayout() {
  const { user, logout } = useAuth();
  const { pulseLoading } = useLoading();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 992);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);

      if (mobile) {
        setIsSidebarOpen(false);
        setIsSidebarCollapsed(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleMenuClick = () => {
    pulseLoading(250);
    setIsSidebarOpen((prev) => !prev);
  };

  const toggleSidebarCollapse = () => {
    if (!isMobile && isSidebarOpen) {
      pulseLoading(200);
      setIsSidebarCollapsed((prev) => !prev);
    }
  };

  const goAdminHome = () => {
    if (location.pathname === "/admin") return;
    pulseLoading(350);
    navigate("/admin");
  };

  const sidebarWidthClass =
    !isSidebarOpen || isMobile
      ? "lg:ml-0"
      : isSidebarCollapsed
      ? "lg:ml-[68px]"
      : "lg:ml-[220px]";

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50 text-slate-800">
      <AdminSidebar
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        isMobile={isMobile}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className={`min-h-screen transition-all duration-300 ${sidebarWidthClass}`}>
        <header className="sticky top-0 z-40 border-b border-sky-100 bg-white/90 backdrop-blur-md">
          <TopLoadingBar />

          <div className="flex h-12 items-center justify-between px-3 sm:px-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={handleMenuClick}
                title="Toggle sidebar"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-sky-200 bg-white text-sky-700 transition hover:bg-sky-50"
              >
                <Menu size={16} />
              </button>

              {!isMobile && isSidebarOpen && (
                <button
                  onClick={toggleSidebarCollapse}
                  title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-sky-200 bg-white text-sky-700 transition hover:bg-sky-50"
                >
                  {isSidebarCollapsed ? (
                    <PanelLeftOpen size={16} />
                  ) : (
                    <PanelLeftClose size={16} />
                  )}
                </button>
              )}

              <button
                onClick={goAdminHome}
                className="flex items-center gap-2 px-1 py-1 transition hover:text-sky-700"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-sky-500 to-cyan-400 text-white shadow-sm">
                  <LayoutDashboard size={15} />
                </div>

                <div className="hidden sm:flex flex-col items-start leading-tight">
                  <span className="text-sm font-semibold text-sky-950">
                    Network Ops
                  </span>
                  <span className="text-[11px] text-sky-600">
                    Admin Console
                  </span>
                </div>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col items-end leading-tight">
                <span className="text-xs font-semibold text-slate-800">
                  {user?.username || "Admin"}
                </span>
                <span className="text-[11px] capitalize text-sky-600">
                  {user?.role || ""}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-sky-200 bg-white px-2.5 text-xs font-medium text-sky-700 transition hover:bg-sky-50"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="p-3 sm:p-4 lg:p-5">
          <div className="min-h-[calc(100vh-72px)]  border border-sky-100 bg-white/90 p-3 shadow-sm sm:p-4 lg:p-5">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;