import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminMenuItems } from "../../constants/adminMenuConfig";
import { Search, X } from "lucide-react";

function AdminDashboard() {
  const [search, setSearch] = useState("");

  const dashboardItems = useMemo(() => {
    return [...adminMenuItems]
      .filter((item) => item.visible && item.showOnDashboard)
      .sort((a, b) => a.order - b.order);
  }, []);

  const filteredItems = dashboardItems.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleClearSearch = () => {
    setSearch("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-3 py-4 sm:px-5 sm:py-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage telecom operations quickly and efficiently.
            </p>
          </div>

          <div className="relative w-full max-w-xs">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              <Search size={14} />
            </span>

            <input
              type="text"
              placeholder="Search modules..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-10 text-xs text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />

            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-2 flex items-center justify-center text-slate-400 transition hover:text-sky-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 p-3 backdrop-blur-sm shadow-[0_8px_30px_rgb(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgb(14,165,233,0.14)]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-sky-50/0 via-sky-50/0 to-sky-100/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="relative flex h-24 flex-col justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-all duration-300 group-hover:scale-105 group-hover:bg-sky-100 group-hover:text-sky-600">
                    <Icon size={18} />
                  </div>

                  <div>
                    <h2 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-800">
                      {item.label}
                    </h2>
                    <div className="mt-2 h-1.5 w-8 rounded-full bg-slate-200 transition-all duration-300 group-hover:w-12 group-hover:bg-sky-500" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-10 text-center text-sm text-slate-500">
            No dashboard modules found.
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;