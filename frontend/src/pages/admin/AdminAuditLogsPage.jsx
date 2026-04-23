import { useEffect, useMemo, useRef, useState } from "react";
import {
  Database,
  Download,
  Eye,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import {
  bulkDeleteAuditLogs,
  deleteAuditLog,
  exportAuditLogsExcel,
  exportSelectedAuditLogsExcel,
  getAuditLogs,
  getAuditLogSummary,
} from "../../api/auditLogApi";
import StandardDataTable from "../../components/common/StandardDataTable";

const actionOptions = [
  { value: "all", label: "All Actions" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "bulk_delete", label: "Bulk Delete" },
  { value: "delete_all", label: "Delete All" },
  { value: "import", label: "Import" },
];

const tableOptions = [
  { value: "all", label: "All Tables" },
  { value: "users", label: "Users" },
  { value: "site_connectivity", label: "Site Connectivity" },
  { value: "client_pages", label: "Client Pages" },
  { value: "microwave_link_budgets", label: "Microwave Link Budgets" },
];

const tableColumns = [
  { key: "id", label: "ID" },
  { key: "table_name", label: "Table", filterType: "select" },
  { key: "record_id", label: "Record ID" },
  { key: "action", label: "Action", filterType: "select" },
  { key: "changed_by_username", label: "Admin" },
  { key: "changed_at", label: "Timestamp", filterType: "datetime" },
  { key: "summary", label: "Summary", sortable: false, filterable: false },
  {
    key: "actions",
    label: "Actions",
    sortable: false,
    filterable: false,
    headerClassName: "min-w-[160px]",
  },
];

const inputClass =
  "h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-sky-500";

const compactFilterControlClass =
  "h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-700 outline-none transition focus:border-sky-500";

function AdminAuditLogsPage() {
  const [rows, setRows] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [tableFilter, setTableFilter] = useState("all");
  const [changedFrom, setChangedFrom] = useState("");
  const [changedTo, setChangedTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: "changed_at",
    direction: "desc",
  });
  const [summary, setSummary] = useState({
    total_events: 0,
    create_events: 0,
    update_events: 0,
    delete_events: 0,
    import_events: 0,
    admins_involved: 0,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [viewingLog, setViewingLog] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const toastTimerRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const fetchRows = async ({
    pageValue = page,
    pageSizeValue = pageSize,
    searchValue = search,
    actionValue = actionFilter,
    tableValue = tableFilter,
    changedFromValue = changedFrom,
    changedToValue = changedTo,
    sortValue = sortConfig,
  } = {}) => {
    try {
      setLoading(true);
      setError("");

      const data = await getAuditLogs({
        search: searchValue,
        action: actionValue === "all" ? "" : actionValue,
        tableName: tableValue === "all" ? "" : tableValue,
        changedFrom: changedFromValue,
        changedTo: changedToValue,
        page: pageValue,
        pageSize: pageSizeValue,
        sortBy: sortValue.key,
        sortOrder: sortValue.direction,
      });

      setRows(data.items || []);
      setSelectedIds([]);
      setPage(data.page || 1);
      setPageSize(data.page_size || pageSizeValue);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      const message = err?.response?.data?.detail || "Failed to load audit logs";
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const data = await getAuditLogSummary();
      setSummary({
        total_events: data.total_events || 0,
        create_events: data.create_events || 0,
        update_events: data.update_events || 0,
        delete_events: data.delete_events || 0,
        import_events: data.import_events || 0,
        admins_involved: data.admins_involved || 0,
      });
    } catch (err) {
      console.error("Failed to fetch audit summary", err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchRows();
  }, [page, pageSize, search, actionFilter, tableFilter, changedFrom, changedTo, sortConfig]);

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedIds.includes(row.id)),
    [rows, selectedIds]
  );

  const stats = [
    {
      label: "Total Events",
      value: summary.total_events,
      sub: "Database activity captured",
      icon: Database,
      iconWrap: "bg-sky-100 text-sky-700",
    },
    {
      label: "Creates",
      value: summary.create_events,
      sub: "New records added",
      icon: Plus,
      iconWrap: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Updates",
      value: summary.update_events,
      sub: "Records changed",
      icon: Pencil,
      iconWrap: "bg-violet-100 text-violet-700",
    },
    {
      label: "Deletes",
      value: summary.delete_events,
      sub: "Delete activity",
      icon: Trash2,
      iconWrap: "bg-rose-100 text-rose-700",
    },
    {
      label: "Imports",
      value: summary.import_events,
      sub: "Bulk import runs",
      icon: Upload,
      iconWrap: "bg-amber-100 text-amber-700",
    },
    {
      label: "Admins",
      value: summary.admins_involved,
      sub: "Unique admins involved",
      icon: Shield,
      iconWrap: "bg-cyan-100 text-cyan-700",
    },
  ];

  const refreshAll = async ({
    pageValue = page,
    pageSizeValue = pageSize,
    searchValue = search,
    actionValue = actionFilter,
    tableValue = tableFilter,
    changedFromValue = changedFrom,
    changedToValue = changedTo,
    sortValue = sortConfig,
  } = {}) => {
    await Promise.all([
      fetchRows({
        pageValue,
        pageSizeValue,
        searchValue,
        actionValue,
        tableValue,
        changedFromValue,
        changedToValue,
        sortValue,
      }),
      fetchSummary(),
    ]);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const handleClearTimeFilters = () => {
    setChangedFrom("");
    setChangedTo("");
    setPage(1);
  };

  const handleSort = (key) => {
    setPage(1);
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  const handleToggleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = (visibleRowIds) => {
    const allSelected =
      visibleRowIds.length > 0 && visibleRowIds.every((id) => selectedIds.includes(id));

    setSelectedIds(allSelected ? [] : visibleRowIds);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) {
      return;
    }

    setDeleteTarget({
      ids: [...selectedIds],
      count: selectedIds.length,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.ids?.length) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (deleteTarget.ids.length === 1) {
        await deleteAuditLog(deleteTarget.ids[0]);
      } else {
        await bulkDeleteAuditLogs(deleteTarget.ids);
      }

      const nextPage =
        rows.length === deleteTarget.ids.length && page > 1 ? page - 1 : page;

      setDeleteTarget(null);
      setViewingLog((prev) =>
        deleteTarget.ids.includes(prev?.id) ? null : prev
      );
      await refreshAll({ pageValue: nextPage });
      if (nextPage !== page) {
        setPage(nextPage);
      }
      showToast("Audit log entries deleted successfully");
    } catch (err) {
      const message = err?.response?.data?.detail || "Failed to delete audit logs";
      setError(message);
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleViewSelected = () => {
    if (selectedRows.length !== 1) {
      return;
    }

    setViewingLog(selectedRows[0]);
  };

  const handleExportSelected = async () => {
    if (selectedIds.length === 0) {
      showToast("Please select at least one log entry", "error");
      return;
    }

    try {
      const blob = await exportSelectedAuditLogsExcel(selectedIds);
      downloadBlob(blob, "selected_audit_logs.xlsx");
      showToast("Selected audit logs exported successfully");
    } catch (err) {
      const message =
        err?.response?.data?.detail || "Failed to export selected audit logs";
      showToast(message, "error");
    }
  };

  const handleExportAll = async () => {
    try {
      const blob = await exportAuditLogsExcel({
        search,
        action: actionFilter === "all" ? "" : actionFilter,
        tableName: tableFilter === "all" ? "" : tableFilter,
        changedFrom,
        changedTo,
      });
      downloadBlob(blob, "audit_logs.xlsx");
      showToast("Audit logs exported successfully");
    } catch (err) {
      const message = err?.response?.data?.detail || "Failed to export audit logs";
      showToast(message, "error");
    }
  };

  const renderCell = (row, key) => {
    if (key === "action") {
      return (
        <span className={getActionBadgeClass(row.action)}>
          {formatAction(row.action)}
        </span>
      );
    }

    if (key === "table_name") {
      return (
        <span className="font-medium text-slate-800">
          {humanizeTableName(row.table_name)}
        </span>
      );
    }

    if (key === "changed_by_username") {
      return row.changed_by_username || row.changed_by || "System";
    }

    if (key === "changed_at") {
      return formatDateTime(row.changed_at);
    }

    if (key === "summary") {
      return (
        <span className="line-clamp-2 max-w-[360px] whitespace-normal text-[11px] text-slate-600">
          {buildAuditSummary(row)}
        </span>
      );
    }

    if (key === "actions") {
      return (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setViewingLog(row);
            }}
            className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2 py-1 text-[10px] font-semibold text-sky-700 transition hover:bg-sky-100"
          >
            <Eye size={11} />
            View
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setDeleteTarget({ ids: [row.id], count: 1 });
            }}
            className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-700 transition hover:bg-red-100"
          >
            <Trash2 size={11} />
            Delete
          </button>
        </div>
      );
    }

    return row[key];
  };

  return (
    <div className="min-h-[calc(100vh-1rem)] w-full max-w-full overflow-hidden bg-slate-50 p-2 md:p-3">
      <div className="mx-auto w-full max-w-full space-y-3">
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-2 flex flex-col gap-0.5">
            <h1 className="text-lg font-bold tracking-tight text-slate-900">Audit Logs</h1>
            <p className="text-[11px] text-slate-500">
              Review which admin changed what in the database, when it happened, and the before or after values.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 xl:grid-cols-6">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        {stat.label}
                      </div>
                      <div className="mt-0.5 text-base font-bold leading-tight text-slate-900">
                        {stat.value}
                      </div>
                      <div className="text-[10px] text-slate-400">{stat.sub}</div>
                    </div>

                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${stat.iconWrap}`}
                    >
                      <Icon size={13} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full max-w-full rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-3 py-2.5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-1 flex-wrap items-center gap-2">
                <div className="relative w-full max-w-[210px]">
                  <Search
                    size={12}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search table, admin, action, or data"
                    className={`w-full pl-8 pr-8 ${compactFilterControlClass}`}
                  />

                  {searchInput && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-2 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Clear search"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <select
                  value={actionFilter}
                  onChange={(event) => {
                    setPage(1);
                    setActionFilter(event.target.value);
                  }}
                  className={`${compactFilterControlClass} min-w-[124px]`}
                >
                  {actionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  value={tableFilter}
                  onChange={(event) => {
                    setPage(1);
                    setTableFilter(event.target.value);
                  }}
                  className={`${compactFilterControlClass} min-w-[140px]`}
                >
                  {tableOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 rounded-md border border-slate-300 bg-slate-50 px-2 py-1">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Start
                    </span>
                    <input
                      type="datetime-local"
                      value={changedFrom}
                      onChange={(event) => {
                        setPage(1);
                        setChangedFrom(event.target.value);
                      }}
                      className="h-7 min-w-[168px] border border-slate-300 bg-white px-2 text-[11px] text-slate-700 outline-none transition focus:border-sky-500"
                      aria-label="Filter start date and time"
                    />
                  </div>

                  <div className="flex items-center gap-2 rounded-md border border-slate-300 bg-slate-50 px-2 py-1">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                      End
                    </span>
                    <input
                      type="datetime-local"
                      value={changedTo}
                      onChange={(event) => {
                        setPage(1);
                        setChangedTo(event.target.value);
                      }}
                      className="h-7 min-w-[168px] border border-slate-300 bg-white px-2 text-[11px] text-slate-700 outline-none transition focus:border-sky-500"
                      aria-label="Filter end date and time"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-start gap-2 xl:justify-end">
                {(changedFrom || changedTo) && (
                  <button
                    type="button"
                    onClick={handleClearTimeFilters}
                    className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <X size={12} />
                    Clear Time
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => refreshAll()}
                  className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <RefreshCw size={12} />
                  Refresh
                </button>

                <button
                  type="button"
                  onClick={handleExportSelected}
                  disabled={selectedIds.length === 0}
                  className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download size={12} />
                  Export Selected
                </button>

                <button
                  type="button"
                  onClick={handleExportAll}
                  className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Download size={12} />
                  Export All
                </button>
              </div>
            </div>
          </div>

          <div className="border-b border-slate-200 bg-slate-50 px-3 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-slate-600">
                Selected: <span className="font-semibold text-slate-900">{selectedIds.length}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleViewSelected}
                  disabled={selectedRows.length !== 1}
                  className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-sky-300 bg-white px-2.5 text-[11px] font-medium text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Eye size={12} />
                  View
                </button>

                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  disabled={selectedIds.length === 0}
                  className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-red-300 bg-white px-2.5 text-[11px] font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="border-b border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          {saving && (
            <div className="border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
              Processing audit log request...
            </div>
          )}

          {loading && (
            <div className="border-b border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
              Loading audit logs...
            </div>
          )}

          <div className="border-b border-slate-200 bg-slate-50 px-3 py-2.5">
            <div className="flex w-full flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Database Change History</h2>
                <p className="text-xs text-slate-500">
                  Each row records the admin action, target record, and timestamp.
                </p>
              </div>

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
                {" "}log entr{total === 1 ? "y" : "ies"}
              </div>
            </div>
          </div>

          <div className="w-full max-w-full overflow-x-auto bg-white px-2 py-2">
            <StandardDataTable
              columns={tableColumns}
              rows={rows}
              selectedIds={selectedIds}
              onToggleSelectRow={handleToggleSelectRow}
              onToggleSelectAll={handleToggleSelectAll}
              sortConfig={sortConfig}
              onSort={handleSort}
              renderCell={renderCell}
              emptyTitle="No audit logs found"
              emptyDescription="Perform a database change from an admin page to generate audit history."
            />
          </div>

          <div className="border-t border-slate-200 bg-white px-3 py-2.5">
            <div className="flex w-full flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span>Rows per page</span>
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPage(1);
                    setPageSize(Number(event.target.value));
                  }}
                  className={inputClass}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span className="rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1.5">
                  Page <span className="font-semibold text-slate-900">{page}</span> /{" "}
                  <span className="font-semibold text-slate-900">{totalPages || 1}</span>
                </span>

                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page <= 1}
                  className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages || 1))}
                  disabled={page >= totalPages}
                  className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed right-3 top-3 z-[70]">
          <div
            className={`rounded-lg px-3 py-2 text-xs font-semibold shadow-lg ${
              toast.type === "error" ? "bg-red-600 text-white" : "bg-slate-900 text-white"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 md:p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          />

          <div className="relative z-10 w-full max-w-md rounded-lg border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-4 py-3">
              <h3 className="text-base font-bold text-slate-900">Delete Audit Logs</h3>
              <p className="mt-1 text-xs text-slate-500">
                This removes the selected audit log entr{deleteTarget.count === 1 ? "y" : "ies"} from history.
              </p>
            </div>

            <div className="space-y-3 px-4 py-3">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Selected Rows
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {deleteTarget.count}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingLog && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-slate-900/30"
            onClick={() => setViewingLog(null)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Audit Log Details</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Full change snapshot for the selected database action
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingLog(null)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <DetailItem label="Log ID" value={viewingLog.id} />
                <DetailItem label="Table" value={humanizeTableName(viewingLog.table_name)} />
                <DetailItem label="Record ID" value={viewingLog.record_id} />
                <DetailItem label="Action" value={formatAction(viewingLog.action)} />
                <DetailItem
                  label="Admin"
                  value={viewingLog.changed_by_username || viewingLog.changed_by || "System"}
                />
                <DetailItem label="Timestamp" value={formatDateTime(viewingLog.changed_at)} />
              </div>

              <JsonPanel title="Old Values" data={viewingLog.old_values} />
              <JsonPanel title="New Values" data={viewingLog.new_values} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-xs font-semibold text-slate-900">
        {value === null || value === undefined || value === "" ? "-" : String(value)}
      </div>
    </div>
  );
}

function JsonPanel({ title, data }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
        {title}
      </div>
      <pre className="max-h-[260px] overflow-auto bg-slate-950 px-3 py-3 text-[11px] leading-5 text-slate-100">
        {data ? JSON.stringify(data, null, 2) : "No data recorded."}
      </pre>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

function formatAction(action) {
  return String(action || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function humanizeTableName(tableName) {
  return String(tableName || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getActionBadgeClass(action) {
  const baseClass =
    "inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em]";

  if (action === "create") {
    return `${baseClass} bg-emerald-100 text-emerald-700`;
  }

  if (action === "update") {
    return `${baseClass} bg-violet-100 text-violet-700`;
  }

  if (action === "delete" || action === "bulk_delete" || action === "delete_all") {
    return `${baseClass} bg-rose-100 text-rose-700`;
  }

  if (action === "import") {
    return `${baseClass} bg-amber-100 text-amber-700`;
  }

  return `${baseClass} bg-slate-100 text-slate-700`;
}

function buildAuditSummary(row) {
  if (row.action === "create") {
    const newKeys = Object.keys(row.new_values || {});
    return `Created record with ${newKeys.length} captured field${newKeys.length === 1 ? "" : "s"}.`;
  }

  if (row.action === "update") {
    const changedKeys = getChangedKeys(row.old_values, row.new_values);
    if (changedKeys.length === 0) {
      return "Updated record values.";
    }

    return `Updated ${changedKeys.slice(0, 4).join(", ")}${changedKeys.length > 4 ? "..." : ""}`;
  }

  if (row.action === "delete") {
    return "Deleted record from database.";
  }

  if (row.action === "bulk_delete") {
    const deletedCount = row.new_values?.deleted_count;
    return `Bulk deleted ${deletedCount || 0} record${deletedCount === 1 ? "" : "s"}.`;
  }

  if (row.action === "delete_all") {
    return `Deleted all records. Count: ${row.new_values?.deleted_count || 0}.`;
  }

  if (row.action === "import") {
    return `Import run. Created: ${row.new_values?.created || 0}, Updated: ${row.new_values?.updated || 0}.`;
  }

  return "Database change recorded.";
}

function getChangedKeys(oldValues, newValues) {
  const oldData = oldValues || {};
  const newData = newValues || {};
  const keys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

  return Array.from(keys).filter((key) => {
    return JSON.stringify(oldData[key]) !== JSON.stringify(newData[key]);
  });
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default AdminAuditLogsPage;
