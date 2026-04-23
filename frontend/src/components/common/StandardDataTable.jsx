import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Funnel, Inbox, X } from "lucide-react";

function StandardDataTable({
  columns = [],
  rows = [],
  selectedIds = [],
  onToggleSelectRow,
  onToggleSelectAll,
  sortConfig,
  onSort,
  renderCell,
  emptyTitle = "No records found",
  emptyDescription = "Try adjusting your filters or adding a new record.",
  emptyIcon,
  getRowId = (row) => row.id,
}) {
  const [filterValues, setFilterValues] = useState({});
  const EmptyStateIcon = emptyIcon || Inbox;
  const selectionEnabled =
    typeof onToggleSelectRow === "function" &&
    typeof onToggleSelectAll === "function";

  useEffect(() => {
    setFilterValues((prev) => {
      const next = {};

      columns.forEach((column) => {
        if (prev[column.key]) {
          next[column.key] = prev[column.key];
        }
      });

      return next;
    });
  }, [columns]);

  const filterMeta = useMemo(
    () =>
      columns.reduce((accumulator, column) => {
        accumulator[column.key] = buildColumnFilterMeta(column, rows);
        return accumulator;
      }, {}),
    [columns, rows]
  );

  const filteredRows = useMemo(
    () =>
      rows.filter((row) =>
        columns.every((column) => {
          const filterValue = filterValues[column.key];

          if (!filterValue) {
            return true;
          }

          const normalizedFilter = normalizeFilterString(filterValue);
          const comparableValue = getComparableCellValue(row, column);

          if (filterMeta[column.key]?.type === "select") {
            return comparableValue === normalizedFilter;
          }

          if (filterMeta[column.key]?.type === "datetime") {
            return comparableValue.startsWith(normalizeDateTimeFilterValue(filterValue));
          }

          return comparableValue.includes(normalizedFilter);
        })
      ),
    [columns, filterMeta, filterValues, rows]
  );

  const rowIds = filteredRows
    .map((row) => getRowId(row))
    .filter((id) => id !== undefined);
  const allSelected =
    selectionEnabled &&
    rowIds.length > 0 &&
    rowIds.every((id) => selectedIds.includes(id));

  const hasActiveFilters = Object.values(filterValues).some(Boolean);

  const renderSortIcon = (columnKey) => {
    if (!onSort) {
      return null;
    }

    if (sortConfig?.key !== columnKey) {
      return <ArrowUpDown size={12} className="text-slate-400" aria-hidden="true" />;
    }

    if (sortConfig.direction === "asc") {
      return <ArrowUp size={12} className="text-sky-600" aria-hidden="true" />;
    }

    return <ArrowDown size={12} className="text-sky-600" aria-hidden="true" />;
  };

  const handleFilterChange = (columnKey, value) => {
    setFilterValues((prev) => ({
      ...prev,
      [columnKey]: value,
    }));
  };

  const clearColumnFilter = (columnKey) => {
    setFilterValues((prev) => {
      const next = { ...prev };
      delete next[columnKey];
      return next;
    });
  };

  const clearAllFilters = () => {
    setFilterValues({});
  };

  return (
    <div className="overflow-hidden border border-slate-300 bg-white">
      {hasActiveFilters && (
        <div className="flex items-center justify-between border-b border-slate-300 bg-[#f3f6fb] px-3 py-2">
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
            <Funnel size={12} className="text-slate-500" />
            <span>Column filters applied</span>
          </div>

          <button
            type="button"
            onClick={clearAllFilters}
            className="inline-flex items-center gap-1 border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <X size={11} />
            Clear filters
          </button>
        </div>
      )}

      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-max border-collapse">
          <thead>
            <tr className="bg-[#eef3f8]">
              {selectionEnabled && (
                <th className={selectHeaderClass} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => onToggleSelectAll(rowIds)}
                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    aria-label="Select all rows"
                  />
                </th>
              )}

              {columns.map((column) => {
                const sortable =
                  typeof onSort === "function" && column.sortable !== false;

                return (
                  <th
                    key={column.key}
                    className={`${headerClass} ${column.headerClassName || ""}`}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => onSort(column.key)}
                        className="flex w-full items-center gap-1.5 text-left transition hover:text-slate-900"
                      >
                        <span>{column.label}</span>
                        {renderSortIcon(column.key)}
                      </button>
                    ) : (
                      <span>{column.label}</span>
                    )}
                  </th>
                );
              })}
            </tr>

            <tr className="bg-[#f8fafc]">
              {selectionEnabled && (
                <th className={filterSelectHeaderClass}>
                  <span className="text-[10px] font-medium text-slate-400">Filter</span>
                </th>
              )}

              {columns.map((column) => {
                const meta = filterMeta[column.key];
                const filterValue = filterValues[column.key] || "";
                const canFilter = column.filterable !== false;

                return (
                  <th
                    key={`${column.key}-filter`}
                    className={`${filterHeaderClass} ${column.headerClassName || ""}`}
                  >
                    {canFilter ? (
                      <div className="flex items-center gap-1">
                        {meta?.type === "select" ? (
                          <select
                            value={filterValue}
                            onChange={(e) =>
                              handleFilterChange(column.key, e.target.value)
                            }
                            className={filterControlClass}
                            aria-label={`Filter ${column.label}`}
                          >
                            <option value="">All</option>
                            {(meta.options || []).map((option) => (
                              <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        ) : meta?.type === "datetime" ? (
                          <input
                            type="datetime-local"
                            value={filterValue}
                            onChange={(e) =>
                              handleFilterChange(column.key, e.target.value)
                            }
                            className={filterControlClass}
                            aria-label={`Filter ${column.label}`}
                          />
                        ) : (
                          <input
                            value={filterValue}
                            onChange={(e) =>
                              handleFilterChange(column.key, e.target.value)
                            }
                            placeholder="Filter..."
                            className={filterControlClass}
                            aria-label={`Filter ${column.label}`}
                          />
                        )}

                        {filterValue && (
                          <button
                            type="button"
                            onClick={() => clearColumnFilter(column.key)}
                            className="inline-flex h-7 items-center justify-center border border-slate-300 bg-white px-2 text-[10px] font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-800"
                            aria-label={`Clear filter for ${column.label}`}
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400">
                        Not filterable
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectionEnabled ? 1 : 0)}
                  className="px-6 py-14 text-center"
                >
                  <div className="mx-auto flex max-w-sm flex-col items-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <EmptyStateIcon size={24} aria-hidden="true" />
                    </div>
                    <h3 className="mt-4 text-sm font-semibold text-slate-900">{emptyTitle}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {hasActiveFilters
                        ? "No rows match the current column filters."
                        : emptyDescription}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRows.map((row, index) => {
                const rowId = getRowId(row);
                const selected = selectionEnabled && selectedIds.includes(rowId);

                return (
                  <tr
                    key={rowId ?? index}
                    onClick={
                      selectionEnabled ? () => onToggleSelectRow(rowId) : undefined
                    }
                    className={[
                      "transition",
                      selectionEnabled ? "cursor-pointer" : "",
                      selected
                        ? "bg-sky-50"
                        : index % 2 === 0
                        ? "bg-white"
                        : "bg-[#fbfcfe]",
                      "hover:bg-sky-50/80",
                    ].join(" ")}
                  >
                    {selectionEnabled && (
                      <td
                        className={selectCellClass}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSelectRow(rowId);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          readOnly
                          className="pointer-events-none h-4 w-4 rounded border-slate-300 text-sky-600"
                          aria-label={`Select row ${index + 1}`}
                        />
                      </td>
                    )}

                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`${cellClass} ${column.cellClassName || ""}`}
                      >
                        {renderCell
                          ? renderCell(row, column.key, column)
                          : defaultRenderCell(row?.[column.key])}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function defaultRenderCell(value) {
  return value === null || value === undefined || value === "" ? "-" : String(value);
}

const headerClass =
  "sticky top-0 z-20 whitespace-nowrap border-b border-r border-slate-300 bg-[#eef3f8] px-3 py-2 text-left text-[10px] font-semibold tracking-[0.06em] text-slate-700 last:border-r-0";

const selectHeaderClass =
  "sticky left-0 top-0 z-30 border-b border-r border-slate-300 bg-[#eef3f8] px-3 py-2";

const filterHeaderClass =
  "sticky top-[33px] z-10 border-b border-r border-slate-300 bg-[#f8fafc] px-2 py-1.5 text-left last:border-r-0";

const filterSelectHeaderClass =
  "sticky left-0 top-[33px] z-20 border-b border-r border-slate-300 bg-[#f8fafc] px-2 py-1.5";

const cellClass =
  "whitespace-nowrap border-b border-r border-slate-200 px-3 py-2 align-middle text-[11px] text-slate-700 last:border-r-0";

const selectCellClass =
  "sticky left-0 z-10 border-b border-r border-slate-300 bg-inherit px-3 py-2 align-middle";

const filterControlClass =
  "h-7 min-w-[88px] flex-1 border border-slate-300 bg-white px-2 text-[11px] font-medium text-slate-700 outline-none transition focus:border-sky-500";

function buildColumnFilterMeta(column, rows) {
  if (column.filterable === false) {
    return { type: "none", options: [] };
  }

  if (column.filterType === "datetime") {
    return { type: "datetime", options: [] };
  }

  const normalizedValues = Array.from(
    new Set(
      rows
        .map((row) => getComparableCellValue(row, column))
        .filter((value) => value !== "")
    )
  ).sort((left, right) => left.localeCompare(right));

  if (
    column.filterType === "select" ||
    looksBooleanColumn(column, rows) ||
    (normalizedValues.length > 0 &&
      normalizedValues.length <= 8 &&
      normalizedValues.every((value) => value.length <= 24))
  ) {
    return {
      type: "select",
      options: normalizedValues.map((value) => ({
        value,
        label: humanizeFilterValue(value),
      })),
    };
  }

  return { type: "text", options: [] };
}

function looksBooleanColumn(column, rows) {
  const rawValues = Array.from(
    new Set(rows.map((row) => row?.[column.key]).filter((value) => value !== null && value !== undefined))
  );

  return (
    rawValues.length > 0 &&
    rawValues.every((value) => typeof value === "boolean")
  );
}

function getComparableCellValue(row, column) {
  const rawValue =
    typeof column.filterAccessor === "function"
      ? column.filterAccessor(row)
      : row?.[column.key];

  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return "";
  }

  if (typeof rawValue === "boolean") {
    return rawValue ? "active" : "inactive";
  }

  if (column.filterType === "datetime") {
    return normalizeDateTimeFilterValue(rawValue);
  }

  return normalizeFilterString(rawValue);
}

function normalizeDateTimeFilterValue(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).trim().slice(0, 16);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function normalizeFilterString(value) {
  return String(value).trim().toLowerCase();
}

function humanizeFilterValue(value) {
  if (value === "active") {
    return "Active";
  }

  if (value === "inactive") {
    return "Inactive";
  }

  return value;
}

export default StandardDataTable;
