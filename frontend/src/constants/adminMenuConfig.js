import {
  LayoutDashboard,
  Waypoints,
  Calculator,
  Share2,
  Network,
  Users,
  ScrollText,
  Files,
} from "lucide-react";

export const adminMenuItems = [
  {
    label: "Dashboard",
    path: "/admin",
    icon: LayoutDashboard,
    visible: true,
    order: 1,
  },
  {
    label: "Topology",
    path: "/admin/topology",
    icon: Waypoints,
    visible: true,
    order: 2,
  },
  {
    label: "Link Budget",
    path: "/admin/microwave-link-budgets",
    icon: Calculator,
    visible: true,
    order: 3,
  },
  {
    label: "Site Connectivity",
    path: "/admin/site-connectivity",
    icon: Share2,
    visible: true,
    order: 4,
  },
  {
    label: "Link Level",
    path: "/admin/link-level",
    icon: Network,
    visible: true,
    order: 5,
  },
  {
    label: "Client Pages",
    path: "/admin/client-pages",
    icon: Files,
    visible: true,
    order: 6,
  },
  {
    label: "Users",
    path: "/admin/users",
    icon: Users,
    visible: true,
    order: 7,
  },
  {
    label: "Audit Logs",
    path: "/admin/audit-logs",
    icon: ScrollText,
    visible: true,
    order: 8,
  },
];
