import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import * as XLSX from "xlsx";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  RadioTower,
  Search,
  X,
} from "lucide-react";
import {
  clientPageQueryKeys,
  fetchAllPublicClientPageData,
  fetchPublicClientPageConfig,
  fetchPublicClientPageData,
} from "../../api/clientPageApi";
import StandardDataTable from "../../components/common/StandardDataTable";
import {
  DEFAULT_CLIENT_PAGE_UI_STATE,
  useClientPageStore,
} from "../../stores/useClientPageStore";

function ClientDynamicPage() {
  const { slug } = useParams();
  const [exporting, setExporting] = useState(false);
  const {
    pageState,
    ensurePage,
    hydratePageSize,
    setSearchInput: setSearchInputAction,
    commitSearch,
    clearSearch,
    selectedRowIds,
    toggleRowSelection: toggleRowSelectionAction,
    toggleSelectAllRows: toggleSelectAllRowsAction,
    clearSelection: clearSelectionAction,
    viewingRow,
    setViewingRow: setViewingRowAction,
    clearViewingRow,
    sortConfig,
    setSort: setSortAction,
    page,
    setPage: setPageAction,
    pageSize,
    setPageSize: setPageSizeAction,
  } = useClientPageStore(
    useShallow((state) => {
      const currentPageState =
        state.pagesBySlug[slug] || DEFAULT_CLIENT_PAGE_UI_STATE;

      return {
        pageState: currentPageState,
        ensurePage: state.ensurePage,
        hydratePageSize: state.hydratePageSize,
        setSearchInput: state.setSearchInput,
        commitSearch: state.commitSearch,
        clearSearch: state.clearSearch,
        selectedRowIds: currentPageState.selectedRowIds,
        toggleRowSelection: state.toggleRowSelection,
        toggleSelectAllRows: state.toggleSelectAllRows,
        clearSelection: state.clearSelection,
        viewingRow: currentPageState.viewingRow,
        setViewingRow: state.setViewingRow,
        clearViewingRow: state.clearViewingRow,
        sortConfig: currentPageState.sortConfig,
        setSort: state.setSort,
        page: currentPageState.page,
        setPage: state.setPage,
        pageSize: currentPageState.pageSize,
        setPageSize: state.setPageSize,
      };
    })
  );

  const smallBtnClass =
    "inline-flex h-8 items-center justify-center gap-1 rounded-md border px-2.5 text-[11px] font-medium whitespace-nowrap transition";
  const inputClass =
    "h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-700 outline-none transition focus:border-sky-500";
  const modalBtnClass =
    "rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50";

  useEffect(() => {
    if (slug) {
      ensurePage(slug);
    }
  }, [ensurePage, slug]);

  const { data: pageConfig = null, isLoading: configLoading, error: configError } =
    useQuery({
      queryKey: clientPageQueryKeys.publicConfig(slug),
      queryFn: () => fetchPublicClientPageConfig(slug),
      enabled: Boolean(slug),
    });

  useEffect(() => {
    if (!slug || !pageConfig) {
      return;
    }

    hydratePageSize(slug, pageConfig?.layout?.pagination?.page_size || 10);
  }, [hydratePageSize, pageConfig, slug]);

  useEffect(() => {
    const timer = setTimeout(() => {
      commitSearch(slug, pageState.searchInput);
    }, 400);

    return () => clearTimeout(timer);
  }, [commitSearch, pageState.searchInput, slug]);

  const {
    data: pageData,
    isLoading: loading,
    error: dataError,
  } = useQuery({
    queryKey: clientPageQueryKeys.publicData(slug, {
      page,
      page_size: pageSize || 10,
      search: pageState.search,
    }),
    queryFn: () =>
      fetchPublicClientPageData(slug, {
        page,
        page_size: pageSize || 10,
        search: pageState.search || undefined,
      }),
    enabled: Boolean(slug && pageConfig && pageSize),
    placeholderData: (previousData) => previousData,
  });

  const {
    data: allFilteredRows = [],
    isLoading: loadingAllRows,
  } = useQuery({
    queryKey: clientPageQueryKeys.publicAllData(slug, pageState.search),
    queryFn: () => fetchAllPublicClientPageData(slug, pageState.search),
    enabled: Boolean(slug && pageConfig),
    placeholderData: (previousData) => previousData,
  });

  const rows = useMemo(() => pageData?.items || [], [pageData]);
  const total = pageData?.total || 0;
  const totalPages = pageData?.total_pages || 1;
  const error =
    configError?.response?.data?.detail ||
    dataError?.response?.data?.detail ||
    configError?.message ||
    dataError?.message ||
    "";

  const visibleColumns = useMemo(
    () => pageConfig?.layout?.columns?.filter((col) => col.visible) || [],
    [pageConfig]
  );

  const selectedRows = useMemo(
    () => allFilteredRows.filter((row) => selectedRowIds.includes(row.id)),
    [allFilteredRows, selectedRowIds]
  );

  const sortedRows = useMemo(() => {
    if (!sortConfig.key) {
      return rows;
    }

    return [...rows].sort((leftRow, rightRow) => {
      const leftValue = buildSortValue(leftRow?.[sortConfig.key]);
      const rightValue = buildSortValue(rightRow?.[sortConfig.key]);

      if (leftValue < rightValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }

      if (leftValue > rightValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }

      return 0;
    });
  }, [rows, sortConfig]);

  const currentPageRowIds = useMemo(
    () => sortedRows.map((row) => row.id).filter(Boolean),
    [sortedRows]
  );

  const summary = useMemo(() => {
    const totalLinks = allFilteredRows.length;
    const activeLinks = allFilteredRows.filter((row) => row.active === true).length;
    const inactiveLinks = allFilteredRows.filter((row) => row.active === false).length;
    const onAir = allFilteredRows.filter((row) => row.status === "On Air").length;
    const down = allFilteredRows.filter(
      (row) =>
        row.status === "Down" ||
        row.status === "Inactive" ||
        row.active === false
    ).length;

    return {
      totalLinks,
      activeLinks,
      inactiveLinks,
      onAir,
      down,
    };
  }, [allFilteredRows]);

  const stats = [
    {
      label: "Total Records",
      value: summary.totalLinks,
      sub: "All searchable data",
      icon: RadioTower,
      iconWrap: "bg-sky-100 text-sky-700",
    },
    {
      label: "Active",
      value: summary.activeLinks,
      sub: "Operational",
      icon: CheckCircle2,
      iconWrap: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "On Air",
      value: summary.onAir,
      sub: "Running links",
      icon: Activity,
      iconWrap: "bg-violet-100 text-violet-700",
    },
    {
      label: "Inactive / Down",
      value: summary.down || summary.inactiveLinks,
      sub: "Need attention",
      icon: AlertTriangle,
      iconWrap: "bg-amber-100 text-amber-700",
    },
  ];

  const toggleRowSelection = (rowId) => {
    toggleRowSelectionAction(slug, rowId);
  };

  const toggleSelectAllCurrentPage = (visibleRowIds) => {
    const rowIds = visibleRowIds || currentPageRowIds;
    toggleSelectAllRowsAction(slug, rowIds);
  };

  const handleSort = (key) => {
    setSortAction(slug, key);
  };

  const handleViewSelected = () => {
    if (selectedRows.length !== 1) {
      return;
    }

    setViewingRowAction(slug, selectedRows[0]);
  };

  const clearSelection = () => {
    clearSelectionAction(slug);
  };

  const buildExportRows = (dataRows) =>
    dataRows.map((row) => {
      const formattedRow = {};

      visibleColumns.forEach((col) => {
        formattedRow[col.label] = formatCell(row[col.key], col.key);
      });

      return formattedRow;
    });

  const downloadExcel = (dataRows, fileName) => {
    const exportRows = buildExportRows(dataRows);

    if (!exportRows.length) {
      alert("No data available to export.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Client Data");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  const handleExportSelected = () => {
    if (!selectedRows.length) {
      alert("Please select row(s) to export.");
      return;
    }

    downloadExcel(selectedRows, `${slug || "client"}_selected_rows`);
  };

  const handleExportAll = async () => {
    try {
      setExporting(true);
      downloadExcel(allFilteredRows, `${slug || "client"}_all_rows`);
    } finally {
      setExporting(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    commitSearch(slug, pageState.searchInput);
  };

  const handleClearSearch = () => {
    clearSearch(slug);
  };

  if (configLoading) {
    return (
      <div className="p-4 text-sm text-slate-600">Loading client page...</div>
    );
  }

  if (error && !pageConfig) {
    return <div className="p-4 text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="min-h-[calc(100vh-1rem)] w-full max-w-full overflow-hidden bg-slate-50 p-2 md:p-3">
      <div className="mx-auto w-full max-w-full space-y-3">
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-2 flex flex-col gap-0.5">
            <h1 className="text-lg font-bold tracking-tight text-slate-900">
              {pageConfig?.title || "Client View"}
            </h1>
            <p className="text-[11px] text-slate-500">
              Search, review, and export client records in a read-only workspace.
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
                        {loadingAllRows ? "..." : stat.value}
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
                <form
                  onSubmit={handleSearch}
                  className="flex flex-wrap items-center gap-2"
                >
                  <div className="relative w-[220px]">
                    <Search
                      size={13}
                      className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      placeholder={
                        pageConfig?.layout?.search?.placeholder ||
                        "Search records..."
                      }
                      value={pageState.searchInput}
                      onChange={(e) => setSearchInputAction(slug, e.target.value)}
                      className={`w-full pl-8 pr-8 ${inputClass}`}
                    />

                    {pageState.searchInput && (
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
                  onClick={handleExportAll}
                  disabled={exporting || loadingAllRows || allFilteredRows.length === 0}
                  className={`${smallBtnClass} border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <Download size={12} />
                  {exporting ? "Exporting..." : "Export All"}
                </button>

                <button
                  type="button"
                  onClick={handleExportSelected}
                  disabled={selectedRows.length === 0}
                  className={`${smallBtnClass} border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <Download size={12} />
                  Export Selected
                </button>
              </div>
            </div>
          </div>

          <div className="border-b border-slate-200 bg-slate-50 px-3 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-slate-600">
                Selected:{" "}
                <span className="font-semibold text-slate-900">
                  {selectedRowIds.length}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleViewSelected}
                  disabled={selectedRows.length !== 1}
                  className={`${smallBtnClass} border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <Eye size={12} />
                  View
                </button>

                <button
                  type="button"
                  onClick={clearSelection}
                  disabled={selectedRowIds.length === 0}
                  className={`${smallBtnClass} border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <X size={12} />
                  Clear
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="border-b border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          {loading && (
            <div className="border-b border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
              Loading client records...
            </div>
          )}

          <div className="border-b border-slate-200 bg-slate-50 px-3 py-2.5">
            <div className="flex w-full flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  {pageConfig?.title || "Client Records"}
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
            <StandardDataTable
              columns={visibleColumns.map((column) => ({
                key: column.key,
                label: column.label,
              }))}
              rows={sortedRows}
              selectedIds={selectedRowIds}
              onToggleSelectRow={toggleRowSelection}
              onToggleSelectAll={toggleSelectAllCurrentPage}
              sortConfig={sortConfig}
              onSort={handleSort}
              renderCell={(row, columnKey, column) =>
                renderStyledCell(
                  row[columnKey],
                  columnKey,
                  column.key === visibleColumns[0]?.key
                )
              }
              emptyTitle="No records found"
              emptyDescription="Try adjusting your search to see more results."
              emptyIcon={RadioTower}
            />
          </div>

          {pageConfig?.layout?.pagination?.enabled && (
            <div className="border-t border-slate-200 bg-white px-3 py-2.5">
              <div className="flex w-full flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span>Rows per page</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSizeAction(slug, Number(e.target.value));
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
                    <span className="font-semibold text-slate-900">
                      {totalPages || 1}
                    </span>
                  </span>

                  <button
                    type="button"
                    onClick={() => setPageAction(slug, Math.max(page - 1, 1))}
                    disabled={page <= 1}
                    className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={() => setPageAction(slug, Math.min(page + 1, totalPages || 1))}
                    disabled={page >= totalPages}
                    className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {viewingRow && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-slate-900/30"
            onClick={() => clearViewingRow(slug)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Record Details
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Read-only client record information
                </p>
              </div>
              <button
                type="button"
                onClick={() => clearViewingRow(slug)}
                className={modalBtnClass}
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-2.5 p-4">
              {visibleColumns.map((column) => (
                <DetailItem
                  key={column.key}
                  label={column.label}
                  value={formatCell(viewingRow[column.key], column.key)}
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

function buildSortValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  if (typeof value === "number") {
    return value;
  }

  return String(value).toLowerCase();
}

const infoBadgeClass =
  "inline-flex rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-700";

const protocolBadgeClass =
  "inline-flex rounded-md border border-cyan-200 bg-cyan-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-cyan-700";

function statusBadgeClass(status) {
  switch (status) {
    case "On Air":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Dismantle":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Down":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function activeBadgeClass(active) {
  return active
    ? "border-blue-200 bg-blue-50 text-blue-700"
    : "border-rose-200 bg-rose-50 text-rose-700";
}

function renderStyledCell(value, key, isPrimary = false) {
  const formatted = formatCell(value, key);

  if (key === "status") {
    return (
      <span
        className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass(
          value
        )}`}
      >
        {formatted}
      </span>
    );
  }

  if (key === "active") {
    return (
      <span
        className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold ${activeBadgeClass(
          !!value
        )}`}
      >
        {value ? "Active" : "Inactive"}
      </span>
    );
  }

  if (key === "management_ip" || key === "ip_address") {
    return <span className={infoBadgeClass}>{formatted}</span>;
  }

  if (key === "web_protocol" || key === "protocol") {
    return <span className={protocolBadgeClass}>{formatted}</span>;
  }

  if (isPrimary) {
    return <span className="font-semibold text-slate-900">{formatted}</span>;
  }

  return formatted;
}

function formatCell(value, key) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (key === "active") {
    return value ? "Active" : "Inactive";
  }

  return String(value);
}

export default ClientDynamicPage;
