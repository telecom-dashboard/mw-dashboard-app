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
  { label: "Link Budget", path: "/admin/microwave-link-budgets", icon: Calculator },
  { label: "Client Pages", path: "/admin/client-pages", icon: FileStack },
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
  const sidebarWidth = isCollapsed ? "w-[68px]" : "w-[220px]";

  return (
    <>
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-sky-950/20 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={[
          "fixed left-0 top-0 z-50 h-screen border-r border-sky-200 bg-gradient-to-b from-sky-50 via-white to-cyan-50 text-slate-700 shadow-[0_8px_30px_rgba(14,165,233,0.10)] transition-all duration-300",
          sidebarWidth,
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-sky-100 px-3 py-3">
            <div className="flex items-center justify-between">
              {!isCollapsed && (
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold tracking-tight text-sky-900">
                    Telecom Admin
                  </h2>
                  <p className="mt-0.5 text-[10px] text-sky-600">
                    Management Panel
                  </p>
                </div>
              )}

              {isMobile && (
                <button
                  onClick={onClose}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-white text-sky-700 shadow-sm transition hover:bg-sky-50"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="sidebar-scroll flex-1 overflow-y-auto px-2 py-3">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/admin"}
                    title={item.label}
                    onClick={() => {
                      if (isMobile) onClose();
                    }}
                    className={({ isActive }) =>
                      [
                        "group flex items-center rounded-xl px-2.5 py-2 text-xs font-medium transition-all duration-200",
                        isCollapsed ? "justify-center" : "gap-2.5",
                        isActive
                          ? "bg-gradient-to-r from-sky-500 to-cyan-400 text-white shadow-md shadow-sky-200"
                          : "text-slate-600 hover:bg-sky-100/70 hover:text-sky-800",
                      ].join(" ")
                    }
                  >
                    <Icon
                      size={16}
                      className="shrink-0 transition-transform duration-200 group-hover:scale-105"
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;