import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { getPublishedClientPagesForNavApi } from "../../api/clientPageApi";

function ClientTopNav() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchNavItems = async () => {
      try {
        setLoading(true);
        const data = await getPublishedClientPagesForNavApi();
        setItems(data || []);
      } catch (error) {
        console.error("Failed to load client nav items", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNavItems();
  }, []);

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex w-full items-center gap-2 overflow-x-auto px-3 py-2">
        <NavLink
          to="/client"
          end
          className={({ isActive }) =>
            [
              "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition",
              isActive
                ? "bg-sky-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200",
            ].join(" ")
          }
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/client/link-status"
          className={({ isActive }) =>
            [
              "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition",
              isActive
                ? "bg-sky-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200",
            ].join(" ")
          }
        >
          Link Status
        </NavLink>

        {loading && (
          <div className="px-2 text-xs text-slate-400">Loading pages...</div>
        )}

        {items.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) =>
              [
                "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition",
                isActive
                  ? "bg-sky-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200",
              ].join(" ")
            }
          >
            {item.title}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export default ClientTopNav;