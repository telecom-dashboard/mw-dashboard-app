import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  RadioTower,
  Waypoints,
  Network,
  Calculator,
  Activity,
  Wifi,
  Upload,
  Table2,
  FileStack,
  MenuSquare,
  Users,
  ScrollText,
  X,
} from "lucide-react";

const menuItems = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Sites", path: "/admin/sites", icon: RadioTower },
  { label: "Links", path: "/admin/links", icon: Waypoints },
  { label: "Network Topology", path: "/admin/topology", icon: Network },
  { label: "Link Budget", path: "/admin/link-budget", icon: Calculator },
  { label: "Link Status", path: "/admin/link-status", icon: Activity },
  { label: "Ping", path: "/admin/ping", icon: Wifi },
  { label: "Import Center", path: "/admin/imports", icon: Upload },
  { label: "Templates", path: "/admin/templates", icon: Table2 },
  { label: "Pages", path: "/admin/pages", icon: FileStack },
  { label: "Navigation", path: "/admin/navigation", icon: MenuSquare },
  { label: "Users", path: "/admin/users", icon: Users },
  { label: "Audit Logs", path: "/admin/audit-logs", icon: ScrollText },
];

function AdminSidebar({ isOpen, isCollapsed, isMobile, onClose }) {
  const sidebarWidth = isCollapsed ? 84 : 250;

  return (
    <>
      {isMobile && isOpen && <div style={overlayStyle} onClick={onClose} />}

      <aside
        style={{
          ...sidebarStyle,
          width: sidebarWidth,
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          position: "fixed",
        }}
      >
        <div style={headerStyle}>
          {!isCollapsed && <div style={titleStyle}>Telecom Admin</div>}

          {isMobile && (
            <button style={closeButtonStyle} onClick={onClose}>
              <X size={20} />
            </button>
          )}
        </div>

        <div style={menuStyle}>
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (isMobile) onClose();
                }}
                style={({ isActive }) => ({
                  ...linkStyle,
                  justifyContent: isCollapsed ? "center" : "flex-start",
                  background: isActive ? "#1f2937" : "transparent",
                })}
                title={item.label}
              >
                <Icon size={18} />
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </div>
      </aside>
    </>
  );
}

const sidebarStyle = {
  top: 0,
  left: 0,
  height: "100vh",
  background: "#111827",
  color: "#fff",
  padding: 16,
  boxSizing: "border-box",
  zIndex: 1200,
  overflowY: "auto",
  transition: "all 0.25s ease",
  boxShadow: "2px 0 12px rgba(0,0,0,0.15)",
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  zIndex: 1100,
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 20,
};

const titleStyle = {
  fontSize: 22,
  fontWeight: "bold",
};

const closeButtonStyle = {
  background: "transparent",
  color: "#fff",
  border: "none",
  cursor: "pointer",
};

const menuStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const linkStyle = {
  color: "#fff",
  textDecoration: "none",
  padding: "10px 12px",
  borderRadius: 8,
  display: "flex",
  alignItems: "center",
  gap: 10,
  whiteSpace: "nowrap",
};

export default AdminSidebar;