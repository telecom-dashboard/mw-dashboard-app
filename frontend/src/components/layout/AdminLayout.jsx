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
} from "lucide-react";
import { useEffect, useState } from "react";

function AdminLayout() {
  const { user, logout } = useAuth();
  const { pulseLoading } = useLoading();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);

      if (mobile) {
        setIsSidebarOpen(false);
        setIsSidebarCollapsed(false);
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

  const sidebarWidth = !isSidebarOpen ? 0 : isSidebarCollapsed ? 84 : 250;

  return (
    <div style={wrapperStyle}>
      <AdminSidebar
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        isMobile={isMobile}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div
        style={{
          ...mainAreaStyle,
          marginLeft: isMobile ? 0 : sidebarWidth,
        }}
      >
        <header style={topbarStyle}>
          <TopLoadingBar />

          <div style={topbarLeftStyle}>
            <button onClick={handleMenuClick} style={iconButtonStyle} title="Toggle sidebar">
              <Menu size={18} />
            </button>

            {!isMobile && isSidebarOpen && (
              <button
                onClick={toggleSidebarCollapse}
                style={iconButtonStyle}
                title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
              </button>
            )}

            <button style={brandButtonStyle} onClick={goAdminHome}>
              <div style={brandIconWrap}>
                <LayoutDashboard size={16} />
              </div>
              <div style={brandTextWrap}>
                <span style={brandTitle}>Network Ops</span>
                <span style={brandSub}>Admin Console</span>
              </div>
            </button>
          </div>

          <div style={topbarRightStyle}>
            <div style={userBadgeStyle}>
              <span style={userNameStyle}>{user?.username || "Admin"}</span>
              <span style={userRoleStyle}>{user?.role || ""}</span>
            </div>

            <button onClick={handleLogout} style={logoutBtnStyle}>
              Logout
            </button>
          </div>
        </header>

        <main style={contentStyle}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const wrapperStyle = {
  minHeight: "100vh",
  background: "#f3f4f6",
};

const mainAreaStyle = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  transition: "margin-left 0.25s ease",
};

const topbarStyle = {
  position: "sticky",
  top: 0,
  height: 64,
  background: "rgba(255,255,255,0.92)",
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 20px",
  zIndex: 1000,
  backdropFilter: "blur(10px)",
  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
};

const topbarLeftStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const topbarRightStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const brandButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: 0,
};

const brandIconWrap = {
  width: 34,
  height: 34,
  borderRadius: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
  color: "#fff",
  boxShadow: "0 4px 14px rgba(37,99,235,0.22)",
};

const brandTextWrap = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
};

const brandTitle = {
  fontSize: 15,
  fontWeight: 700,
  color: "#111827",
  lineHeight: 1.1,
};

const brandSub = {
  fontSize: 11,
  color: "#6b7280",
  lineHeight: 1.1,
};

const contentStyle = {
  padding: 24,
};

const iconButtonStyle = {
  border: "1px solid #d1d5db",
  background: "#fff",
  borderRadius: 10,
  padding: 8,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const userBadgeStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  padding: "6px 10px",
  borderRadius: 10,
  background: "#f8fafc",
};

const userNameStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: "#111827",
};

const userRoleStyle = {
  fontSize: 11,
  color: "#6b7280",
  textTransform: "capitalize",
};

const logoutBtnStyle = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  background: "#fff",
  color: "#111827",
  cursor: "pointer",
  fontSize: 13,
};

export default AdminLayout;