import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  RadioTower,
  Search,
  Plus,
  Download,
  Upload,
  Eye,
  Pencil,
  Trash2,
  FileSpreadsheet,
} from "lucide-react";
import {
  bulkDeleteMicrowaveLinkBudgets,
  createMicrowaveLinkBudget,
  deleteAllMicrowaveLinkBudgets,
  deleteMicrowaveLinkBudget,
  downloadMicrowaveLinkBudgetTemplateExcel,
  exportMicrowaveLinkBudgetsExcel,
  exportSelectedMicrowaveLinkBudgetsExcel,
  getMicrowaveLinkBudgetSummary,
  getMicrowaveLinkBudgets,
  importMicrowaveLinkBudgetsExcel,
  updateMicrowaveLinkBudget,
} from "../../api/microwaveLinkBudgetApi";
import { microwaveLinkBudgetColumns } from "../../constants/microwaveLinkBudgetColumns";
import AdminMicrowaveLinkBudgetForm from "../../components/admin/AdminMicrowaveLinkBudgetForm";
import AdminMicrowaveLinkBudgetTable from "../../components/admin/AdminMicrowaveLinkBudgetTable";

function AdminMicrowaveLinkBudgetPage() {
  const [rows, setRows] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [vendorFilter, setVendorFilter] = useState("All");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [viewingRow, setViewingRow] = useState(null);

  const [summary, setSummary] = useState({
    total_links: 0,
    active_links: 0,
    inactive_links: 0,
    status_counts: {},
    vendor_counts: {},
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [messageLog, setMessageLog] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [sortConfig, setSortConfig] = useState({
    key: "link_id",
    direction: "asc",
  });

  const toastTimer = useRef(null);
  const fileInputRef = useRef(null);

  const smallBtnClass =
    "inline-flex h-8 items-center justify-center gap-1 rounded-md border px-2.5 text-[11px] font-medium whitespace-nowrap transition";
  const inputClass =
    "h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-700 outline-none transition focus:border-sky-500";
  const modalBtnClass =
    "rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50";

  const showToast = (message, type = "success") => {
    setToast({ message, type });

    if (toastTimer.current) clearTimeout(toastTimer.current);

    toastTimer.current = setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const addMessageLog = (message, type = "info") => {
    setMessageLog((prev) => [
      {
        id: Date.now() + Math.random(),
        message,
        type,
        time: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);
  };

  const buildQueryParams = (
    pageValue = page,
    pageSizeValue = pageSize,
    searchValue = search,
    statusValue = statusFilter,
    vendorValue = vendorFilter,
    sortValue = sortConfig
  ) => {
    const params = {
      search: searchValue || undefined,
      page: pageValue,
      page_size: pageSizeValue,
      sort_by: sortValue.key,
      sort_order: sortValue.direction,
    };

    if (statusValue !== "All") {
      if (statusValue === "Active") {
        params.active = true;
      } else if (statusValue === "Inactive") {
        params.active = false;
      } else {
        params.status = statusValue;
      }
    }

    if (vendorValue !== "All") {
      params.vendor = vendorValue;
    }

    return params;
  };

  const fetchRows = async (
    pageValue = page,
    pageSizeValue = pageSize,
    searchValue = search,
    statusValue = statusFilter,
    vendorValue = vendorFilter,
    sortValue = sortConfig
  ) => {
    try {
      setLoading(true);
      setError("");

      const data = await getMicrowaveLinkBudgets(
        buildQueryParams(
          pageValue,
          pageSizeValue,
          searchValue,
          statusValue,
          vendorValue,
          sortValue
        )
      );

      setRows(data.items || []);
      setSelectedIds([]);
      setTotal(data.total || 0);
      setPage(data.page || 1);
      setPageSize(data.page_size || 10);
      setTotalPages(data.total_pages || 0);
    } catch (err) {
      console.error("Failed to fetch microwave link budgets", err);
      const message =
        err?.response?.data?.detail || "Failed to load microwave link budgets";
      setError(message);
      showToast(message, "error");
      addMessageLog(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const data = await getMicrowaveLinkBudgetSummary();
      setSummary({
        total_links: data.total_links || 0,
        active_links: data.active_links || 0,
        inactive_links: data.inactive_links || 0,
        status_counts: data.status_counts || {},
        vendor_counts: data.vendor_counts || {},
      });
    } catch (err) {
      console.error("Failed to fetch summary", err);
      addMessageLog("Failed to fetch summary", "error");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchRows(page, pageSize, search, statusFilter, vendorFilter, sortConfig);
  }, [page, pageSize, search, statusFilter, vendorFilter, sortConfig]);

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const refreshAll = async ({
    pageValue = page,
    pageSizeValue = pageSize,
    searchValue = search,
    statusValue = statusFilter,
    vendorValue = vendorFilter,
    sortValue = sortConfig,
  } = {}) => {
    await Promise.all([
      fetchRows(
        pageValue,
        pageSizeValue,
        searchValue,
        statusValue,
        vendorValue,
        sortValue
      ),
      fetchSummary(),
    ]);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleCreate = async (payload) => {
    try {
      setSaving(true);
      setError("");
      await createMicrowaveLinkBudget(payload);
      setShowCreateForm(false);
      await refreshAll();
      showToast("Microwave link budget created successfully");
      addMessageLog("Microwave link budget created successfully", "success");
    } catch (err) {
      const message =
        err?.response?.data?.detail || "Failed to create microwave link budget";
      setError(message);
      showToast(message, "error");
      addMessageLog(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (payload) => {
    try {
      setSaving(true);
      setError("");
      await updateMicrowaveLinkBudget(editingRow.id, payload);
      setEditingRow(null);
      await refreshAll();
      showToast("Microwave link budget updated successfully");
      addMessageLog("Microwave link budget updated successfully", "success");
    } catch (err) {
      const message =
        err?.response?.data?.detail || "Failed to update microwave link budget";
      setError(message);
      showToast(message, "error");
      addMessageLog(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    setDeleteTarget({ ids: selectedIds });
    addMessageLog(`Delete requested for ${selectedIds.length} selected record(s)`, "info");
  };

  const handleDeleteAll = () => {
    setDeleteTarget({ ids: [], deleteAll: true });
    addMessageLog("Delete all requested", "info");
  };

  const handleConfirmDelete = async () => {
    try {
      setSaving(true);
      setError("");

      if (deleteTarget?.deleteAll) {
        await deleteAllMicrowaveLinkBudgets();
        await refreshAll({ pageValue: 1 });
        setPage(1);
        setViewingRow(null);
        setEditingRow(null);
        setSelectedIds([]);
        setDeleteTarget(null);

        showToast("All microwave link budget records deleted successfully");
        addMessageLog("All microwave link budget records deleted successfully", "success");
        return;
      }

      if (!deleteTarget?.ids?.length) return;

      if (deleteTarget.ids.length === 1) {
        await deleteMicrowaveLinkBudget(deleteTarget.ids[0]);
      } else {
        await bulkDeleteMicrowaveLinkBudgets(deleteTarget.ids);
      }

      setViewingRow(null);
      setEditingRow(null);

      const nextPage =
        rows.length === deleteTarget.ids.length && page > 1 ? page - 1 : page;

      await refreshAll({ pageValue: nextPage });
      if (nextPage !== page) setPage(nextPage);

      showToast("Selected microwave link budget record(s) deleted successfully");
      addMessageLog(
        "Selected microwave link budget record(s) deleted successfully",
        "success"
      );

      setDeleteTarget(null);
      setSelectedIds([]);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const message =
        typeof detail === "string"
          ? detail
          : err?.response?.data?.message ||
            err?.message ||
            "Failed to delete microwave link budget records";

      setError(message);
      showToast(message, "error");
      addMessageLog(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteTarget(null);
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

  const handleStatusChange = (value) => {
    setPage(1);
    setStatusFilter(value);
  };

  const handleVendorChange = (e) => {
    setPage(1);
    setVendorFilter(e.target.value);
  };

  const handleCloseModal = () => {
    setShowCreateForm(false);
    setEditingRow(null);
  };

  const handleToggleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    const rowIds = rows.map((row) => row.id);
    const allSelected =
      rowIds.length > 0 && rowIds.every((id) => selectedIds.includes(id));

    setSelectedIds(allSelected ? [] : rowIds);
  };

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedIds.includes(row.id)),
    [rows, selectedIds]
  );

  const handleViewSelected = () => {
    if (selectedRows.length !== 1) return;
    setViewingRow(selectedRows[0]);
  };

  const handleEditSelected = () => {
    if (selectedRows.length !== 1) return;
    setEditingRow(selectedRows[0]);
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadMicrowaveLinkBudgetTemplateExcel();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "microwave_link_budgets_template.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast("Template downloaded successfully");
      addMessageLog("Template downloaded successfully", "success");
    } catch (err) {
      showToast("Failed to download template", "error");
      addMessageLog("Failed to download template", "error");
    }
  };

  const handleExportAllExcel = async () => {
    try {
      const blob = await exportMicrowaveLinkBudgetsExcel(
        buildQueryParams(1, pageSize, search, statusFilter, vendorFilter, sortConfig)
      );

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "microwave_link_budgets.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast("All data exported successfully");
      addMessageLog("All data exported successfully", "success");
    } catch (err) {
      showToast("Failed to export all data", "error");
      addMessageLog("Failed to export all data", "error");
    }
  };

  const handleExportSelectedExcel = async () => {
    if (selectedIds.length === 0) return;

    try {
      const blob = await exportSelectedMicrowaveLinkBudgetsExcel(selectedIds);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "microwave_link_budgets_selected.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast("Selected data exported successfully");
      addMessageLog("Selected data exported successfully", "success");
    } catch (err) {
      showToast("Failed to export selected data", "error");
      addMessageLog("Failed to export selected data", "error");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSaving(true);
      const result = await importMicrowaveLinkBudgetsExcel(file);
      await refreshAll();

      const errorCount = result?.errors?.length || 0;
      const message = `Import done. Created: ${result.created}, Updated: ${result.updated}, Errors: ${errorCount}`;
      showToast(message, errorCount > 0 ? "error" : "success");
      addMessageLog(message, errorCount > 0 ? "error" : "success");
    } catch (err) {
      const message = err?.response?.data?.detail || "Failed to import Excel";
      showToast(typeof message === "string" ? message : "Failed to import Excel", "error");
      addMessageLog(typeof message === "string" ? message : "Failed to import Excel", "error");
    } finally {
      setSaving(false);
      e.target.value = "";
    }
  };

  const stats = [
    {
      label: "Total Records",
      value: summary.total_links,
      sub: "All budgets",
      icon: RadioTower,
      iconWrap: "bg-sky-100 text-sky-700",
    },
    {
      label: "Active",
      value: summary.active_links,
      sub: "Operational",
      icon: CheckCircle2,
      iconWrap: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "On Air",
      value: summary.status_counts["On Air"] || 0,
      sub: "Operational",
      icon: Activity,
      iconWrap: "bg-violet-100 text-violet-700",
    },
    {
      label: "Inactive / Down",
      value: (summary.inactive_links || 0) + (summary.status_counts["Down"] || 0),
      sub: "Attention",
      icon: AlertTriangle,
      iconWrap: "bg-amber-100 text-amber-700",
    },
  ];

  const vendorOptions = useMemo(() => {
    const vendors = Object.keys(summary.vendor_counts || {})
      .filter(Boolean)
      .sort();
    return ["All", ...vendors];
  }, [summary.vendor_counts]);

  const statusOptions = ["All", "On Air", "Dismantle", "Down", "Active", "Inactive"];
  const isModalOpen = showCreateForm || Boolean(editingRow);

  return (
    <div className="min-h-[calc(100vh-1rem)] w-full max-w-full overflow-hidden bg-slate-50 p-2 md:p-3">
      <div className="mx-auto w-full max-w-full space-y-3">
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-2 flex flex-col gap-0.5">
            <h1 className="text-lg font-bold tracking-tight text-slate-900">
              Microwave Link Budgets
            </h1>
            <p className="text-[11px] text-slate-500">
              Manage microwave link budget records and monitor summary.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
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
                <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
                  <div className="relative w-[220px]">
                    <Search
                      size={13}
                      className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      placeholder="Search link ID, site, vendor, IP..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className={`w-full pl-8 pr-2.5 ${inputClass}`}
                    />
                  </div>

                  <button
                    type="submit"
                    className={`${smallBtnClass} border-slate-900 bg-slate-900 text-white hover:bg-slate-800`}
                  >
                    <Search size={12} />
                    Search
                  </button>
                </form>
              </div>

              <div className="flex flex-wrap items-center justify-start gap-2 xl:justify-end">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className={`${smallBtnClass} border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
                >
                  <FileSpreadsheet size={12} />
                  Template
                </button>

                <button
                  type="button"
                  onClick={handleExportAllExcel}
                  className={`${smallBtnClass} border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
                >
                  <Download size={12} />
                  Export All
                </button>

                <button
                  type="button"
                  onClick={handleExportSelectedExcel}
                  disabled={selectedIds.length === 0}
                  className={`${smallBtnClass} border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <Download size={12} />
                  Export Selected
                </button>

                <button
                  type="button"
                  onClick={handleImportClick}
                  className={`${smallBtnClass} border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
                >
                  <Upload size={12} />
                  Import
                </button>

                

                <button
                  type="button"
                  onClick={() => {
                    setEditingRow(null);
                    setShowCreateForm(true);
                  }}
                  className={`${smallBtnClass} border-sky-600 bg-sky-600 text-white hover:bg-sky-700`}
                >
                  <Plus size={12} />
                  Add Budget
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleImportFile}
                />
              </div>
            </div>
          </div>

          <div className="border-b border-slate-200 bg-slate-50 px-3 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-slate-600">
                Selected: <span className="font-semibold text-slate-900">{selectedIds.length}</span>
              </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {statusOptions.map((item) => {
                    const active = statusFilter === item;
                    return (
                      <button
                        key={item}
                        onClick={() => handleStatusChange(item)}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                          active
                            ? "border border-sky-600 bg-sky-600 text-white"
                            : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Vendor</span>
                  <select
                    value={vendorFilter}
                    onChange={handleVendorChange}
                    className={`${inputClass} min-w-[30px]`}
                  >
                    {vendorOptions.map((vendor) => (
                      <option key={vendor} value={vendor}>
                        {vendor}
                      </option>
                    ))}
                  </select>
                </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleViewSelected}
                  disabled={selectedIds.length !== 1}
                  className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Eye size={12} />
                  View
                </button>

                <button
                  type="button"
                  onClick={handleEditSelected}
                  disabled={selectedIds.length !== 1}
                  className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-blue-300 bg-white px-2.5 text-[11px] font-medium text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Pencil size={12} />
                  Edit
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

                <button
                  type="button"
                  onClick={handleDeleteAll}
                  className={`${smallBtnClass} border-red-300 bg-white text-red-600 hover:bg-red-50`}
                >
                  <Trash2 size={12} />
                  Delete All
                </button>
              </div>
            </div>
          </div>

          {messageLog.length > 0 && (
            <div className="border-b border-slate-200 bg-white px-3 py-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">Message Log</h3>
                <button
                  onClick={() => setMessageLog([])}
                  className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Clear
                </button>
              </div>

              <div className="max-h-44 space-y-1.5 overflow-y-auto">
                {messageLog.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-md px-2.5 py-2 text-xs ${
                      item.type === "error"
                        ? "bg-red-50 text-red-700"
                        : item.type === "success"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span>{item.message}</span>
                      <span className="shrink-0 text-[10px] opacity-70">
                        {item.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="border-b border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          {saving && (
            <div className="border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
              Processing request...
            </div>
          )}

          {loading && (
            <div className="border-b border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
              Loading microwave link budgets...
            </div>
          )}

          <div className="border-b border-slate-200 bg-slate-50 px-3 py-2.5">
            <div className="flex w-full flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Microwave Link Budget Records
                </h2>
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
              </div>
            </div>
          </div>

          <div className="w-full max-w-full overflow-x-auto bg-white px-2 py-2">
            <AdminMicrowaveLinkBudgetTable
              rows={rows}
              selectedIds={selectedIds}
              onToggleSelectRow={handleToggleSelectRow}
              onToggleSelectAll={handleToggleSelectAll}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
          </div>

          <div className="border-t border-slate-200 bg-white px-3 py-2.5">
            <div className="flex w-full flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span>Rows per page</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPage(1);
                    setPageSize(Number(e.target.value));
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
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page <= 1}
                  className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <button
                  onClick={() =>
                    setPage((prev) => Math.min(prev + 1, totalPages || 1))
                  }
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
              toast.type === "error"
                ? "bg-red-600 text-white"
                : "bg-slate-900 text-white"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={handleCloseModal}
          />

          <div className="relative z-10 max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {showCreateForm
                    ? "Create Microwave Link Budget"
                    : "Edit Microwave Link Budget"}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {showCreateForm
                    ? "Add a new microwave link budget record."
                    : "Update microwave link budget details."}
                </p>
              </div>

              <button onClick={handleCloseModal} className={modalBtnClass}>
                ✕
              </button>
            </div>

            <div className="max-h-[calc(92vh-76px)] overflow-y-auto px-4 py-4">
              <AdminMicrowaveLinkBudgetForm
                initialData={showCreateForm ? null : editingRow}
                onSubmit={showCreateForm ? handleCreate : handleUpdate}
                onCancel={handleCloseModal}
                submitLabel={
                  showCreateForm
                    ? "Create Microwave Link Budget"
                    : "Update Microwave Link Budget"
                }
              />
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 md:p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={handleCancelDelete}
          />

          <div className="relative z-10 w-full max-w-md rounded-lg border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-4 py-3">
              <h3 className="text-base font-bold text-slate-900">Confirm Delete</h3>
              <p className="mt-1 text-xs text-slate-500">
                {deleteTarget?.deleteAll
                  ? "Are you sure you want to delete all microwave link budget records?"
                  : "Are you sure you want to delete the selected record(s)?"}
              </p>
            </div>

            <div className="space-y-4 px-4 py-3">
              <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-700">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {deleteTarget?.deleteAll ? "Action" : "Selected Rows"}
                </div>
                <div className="mt-1 font-semibold text-slate-900">
                  {deleteTarget?.deleteAll
                    ? "Delete all records"
                    : deleteTarget?.ids?.length || 0}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
              <button
                onClick={handleCancelDelete}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmDelete}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingRow && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-slate-900/30"
            onClick={() => setViewingRow(null)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Budget Details</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Detailed microwave link budget information
                </p>
              </div>
              <button onClick={() => setViewingRow(null)} className={modalBtnClass}>
                ✕
              </button>
            </div>

            <div className="space-y-2.5 p-4">
              {microwaveLinkBudgetColumns.map((column) => (
                <DetailItem
                  key={column.key}
                  label={column.label}
                  value={
                    column.key === "active"
                      ? viewingRow.active
                        ? "Active"
                        : "Inactive"
                      : viewingRow[column.key]
                  }
                />
              ))}
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

export default AdminMicrowaveLinkBudgetPage;