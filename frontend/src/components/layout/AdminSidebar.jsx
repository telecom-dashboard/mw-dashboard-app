import { useCallback, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { adminMenuItems } from "../../constants/adminMenuConfig";
import { fetchLinkLevelFlow, linkLevelQueryKeys } from "../../api/linkLevelApi";
import { useLoading } from "../../context/LoadingContext";

function AdminSidebar({ isOpen, isCollapsed, isMobile, onClose }) {
  const queryClient = useQueryClient();
  const location = useLocation();
  const { pulseLoading } = useLoading();
  const sidebarWidth = isCollapsed ? "w-[68px]" : "w-[220px]";

  const visibleMenuItems = [...adminMenuItems]
    .filter((item) => item.visible)
    .sort((a, b) => a.order - b.order);

  const handleItemClick = useCallback(
    (path) => {
      if (location.pathname !== path) {
        pulseLoading(path === "/admin/link-level" ? 650 : 350);
      }

      if (isMobile && onClose) {
        onClose();
      }
    },
    [isMobile, location.pathname, onClose, pulseLoading]
  );

  const prefetchLinkLevel = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: linkLevelQueryKeys.flow,
      queryFn: fetchLinkLevelFlow,
    });
  }, [queryClient]);

  useEffect(() => {
    prefetchLinkLevel();
  }, [prefetchLinkLevel]);

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
              {visibleMenuItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/admin"}
                    title={item.label}
                    onClick={() => handleItemClick(item.path)}
                    onMouseEnter={
                      item.path === "/admin/link-level" ? prefetchLinkLevel : undefined
                    }
                    onFocus={
                      item.path === "/admin/link-level" ? prefetchLinkLevel : undefined
                    }
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
