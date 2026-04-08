import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getPublicClientPageApi,
  getPublicClientPageDataApi,
} from "../../api/clientPageApi";

function ClientDynamicPage() {
  const { slug } = useParams();

  const [pageConfig, setPageConfig] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [vendor, setVendor] = useState("");
  const [region, setRegion] = useState("");
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchConfig = async () => {
    try {
      setConfigLoading(true);
      setError("");

      const data = await getPublicClientPageApi(slug);
      setPageConfig(data);

      const defaultPageSize = data?.layout?.pagination?.page_size || 10;
      setPageSize(defaultPageSize);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load page config");
    } finally {
      setConfigLoading(false);
    }
  };

  const fetchRows = async () => {
    if (!pageConfig) return;

    try {
      setLoading(true);
      setError("");

      const data = await getPublicClientPageDataApi(slug, {
        page,
        page_size: pageSize,
        search: search || undefined,
        vendor: vendor || undefined,
        region: region || undefined,
        status: status || undefined,
      });

      setRows(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load client data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [slug]);

  useEffect(() => {
    fetchRows();
  }, [pageConfig, page, pageSize, search, vendor, region, status]);

  const visibleColumns = useMemo(
    () => pageConfig?.layout?.columns?.filter((col) => col.visible) || [],
    [pageConfig]
  );

  const filterKeys = useMemo(
    () => (pageConfig?.layout?.filters || []).map((f) => f.key),
    [pageConfig]
  );

  const vendorOptions = useMemo(() => {
    const set = new Set(rows.map((row) => row.vendor).filter(Boolean));
    return Array.from(set).sort();
  }, [rows]);

  const regionOptions = useMemo(() => {
    const set = new Set(rows.map((row) => row.region).filter(Boolean));
    return Array.from(set).sort();
  }, [rows]);

  const statusOptions = useMemo(() => {
    const set = new Set(rows.map((row) => row.status).filter(Boolean));
    return Array.from(set).sort();
  }, [rows]);

  if (configLoading) {
    return (
      <div className="p-4 text-sm text-slate-600">Loading client page...</div>
    );
  }

  if (error && !pageConfig) {
    return (
      <div className="p-4 text-sm text-red-600">{error}</div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-3 md:p-4">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h1 className="text-lg font-bold text-slate-900">
            {pageConfig?.title || "Client View"}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Data source: microwave_link_budgets
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-end gap-3">
            {pageConfig?.layout?.search?.enabled && (
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Search
                </label>
                <input
                  value={search}
                  onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                  }}
                  placeholder={
                    pageConfig?.layout?.search?.placeholder || "Search..."
                  }
                  className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-sky-500"
                />
              </div>
            )}

            {filterKeys.includes("vendor") && (
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Vendor
                </label>
                <select
                  value={vendor}
                  onChange={(e) => {
                    setPage(1);
                    setVendor(e.target.value);
                  }}
                  className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-sky-500"
                >
                  <option value="">All</option>
                  {vendorOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {filterKeys.includes("region") && (
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Region
                </label>
                <select
                  value={region}
                  onChange={(e) => {
                    setPage(1);
                    setRegion(e.target.value);
                  }}
                  className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-sky-500"
                >
                  <option value="">All</option>
                  {regionOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {filterKeys.includes("status") && (
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => {
                    setPage(1);
                    setStatus(e.target.value);
                  }}
                  className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-sky-500"
                >
                  <option value="">All</option>
                  {statusOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">
            Table View
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse">
              <thead>
                <tr>
                  {visibleColumns.map((col) => (
                    <th
                      key={col.key}
                      className="whitespace-nowrap border-b border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-600"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={visibleColumns.length || 1}
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      Loading data...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumns.length || 1}
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      No data found
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      {visibleColumns.map((col) => (
                        <td
                          key={col.key}
                          className="whitespace-nowrap border-b border-slate-100 px-3 py-2 text-sm text-slate-700"
                        >
                          {formatCell(row[col.key], col.key)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pageConfig?.layout?.pagination?.enabled && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3">
              <div className="text-xs text-slate-600">
                Showing{" "}
                <span className="font-semibold text-slate-900">
                  {total === 0 ? 0 : (page - 1) * pageSize + 1}
                </span>
                {" - "}
                <span className="font-semibold text-slate-900">
                  {total === 0 ? 0 : Math.min(page * pageSize, total)}
                </span>
                {" of "}
                <span className="font-semibold text-slate-900">{total}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page <= 1}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Previous
                </button>

                <span className="text-xs text-slate-700">
                  Page <span className="font-semibold">{page}</span> /{" "}
                  <span className="font-semibold">{totalPages}</span>
                </span>

                <button
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={page >= totalPages}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatCell(value, key) {
  if (value === null || value === undefined || value === "") return "-";

  if (key === "active") {
    return value ? "Active" : "Inactive";
  }

  return String(value);
}

export default ClientDynamicPage;