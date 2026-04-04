import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLoading } from "../../context/LoadingContext";
import TopLoadingBar from "../common/TopLoadingBar";
import { LayoutDashboard, RadioTower, Activity } from "lucide-react";

function TopNavbar() {
  const { user, logout } = useAuth();
  const { pulseLoading } = useLoading();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: "Sites", path: "/client", icon: RadioTower },
    { label: "Link Status", path: "/client/link-status", icon: Activity },
  ];

  const goTo = (path) => {
    if (location.pathname === path) return;
    pulseLoading(350);
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header style={navbarStyle}>
      <TopLoadingBar />

      <div style={leftWrapStyle}>
        <button style={brandButtonStyle} onClick={() => goTo("/client")}>
          <div style={brandIconWrap}>
            <LayoutDashboard size={16} />
          </div>
          <div style={brandTextWrap}>
            <span style={brandTitle}>Network Ops</span>
            <span style={brandSub}>Client Workspace</span>
          </div>
        </button>

        <nav style={navStyle}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => goTo(item.path)}
                style={{
                  ...navButtonStyle,
                  ...(isActive ? navButtonActiveStyle : {}),
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div style={rightStyle}>
        <div style={userBadgeStyle}>
          <span style={userNameStyle}>{user?.username || "User"}</span>
          <span style={userRoleStyle}>{user?.role || ""}</span>
        </div>

        <button onClick={handleLogout} style={logoutBtnStyle}>
          Logout
        </button>
      </div>
    </header>
  );
}

const navbarStyle = {
  position: "relative",
  height: 64,
  background: "rgba(17, 24, 39, 0.96)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 20px",
  gap: 18,
  boxShadow: "0 2px 12px rgba(0,0,0,0.14)",
  backdropFilter: "blur(10px)",
  zIndex: 1000,
};

const leftWrapStyle = {
  display: "flex",
  alignItems: "center",
  gap: 20,
  minWidth: 0,
};

const brandButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  background: "transparent",
  color: "#fff",
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
  boxShadow: "0 4px 14px rgba(37,99,235,0.28)",
};

const brandTextWrap = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
};

const brandTitle = {
  fontSize: 15,
  fontWeight: 700,
  lineHeight: 1.1,
};

const brandSub = {
  fontSize: 11,
  color: "#cbd5e1",
  lineHeight: 1.1,
};

const navStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const navButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: "transparent",
  color: "#e5e7eb",
  border: "1px solid transparent",
  borderRadius: 10,
  cursor: "pointer",
  padding: "8px 12px",
  fontSize: 13,
  transition: "all 0.2s ease",
};

const navButtonActiveStyle = {
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.12)",
};

const rightStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const userBadgeStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  padding: "6px 10px",
  borderRadius: 10,
  background: "rgba(255,255,255,0.06)",
};

const userNameStyle = {
  fontSize: 13,
  fontWeight: 600,
};

const userRoleStyle = {
  fontSize: 11,
  color: "#cbd5e1",
  textTransform: "capitalize",
};

const logoutBtnStyle = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  cursor: "pointer",
  fontSize: 13,
};

export default TopNavbar;