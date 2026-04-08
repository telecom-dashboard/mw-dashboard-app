import { microwaveLinkBudgetColumns } from "../../constants/microwaveLinkBudgetColumns";

function AdminMicrowaveLinkBudgetTable({
  rows = [],
  selectedIds = [],
  onToggleSelectRow,
  onToggleSelectAll,
  sortConfig,
  onSort,
}) {
  const allSelected =
    rows.length > 0 && rows.every((row) => selectedIds.includes(row.id));

  const sortIndicator = (key) => {
    if (sortConfig?.key !== key) return "↕";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  const getCellValue = (row, key) => {
    const value = row?.[key];

    if (key === "active") {
      return (
        <span
          className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold ${
            value
              ? "border border-blue-200 bg-blue-50 text-blue-700"
              : "border border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {value ? "Active" : "Inactive"}
        </span>
      );
    }

    if (key === "status") {
      const statusClass =
        value === "On Air"
          ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
          : value === "Dismantle"
          ? "border border-amber-200 bg-amber-50 text-amber-700"
          : value === "Down"
          ? "border border-red-200 bg-red-50 text-red-700"
          : "border border-slate-200 bg-slate-50 text-slate-700";

      return (
        <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold ${statusClass}`}>
          {value || "-"}
        </span>
      );
    }

    if (key === "protocol") {
      return (
        <span className="rounded border border-cyan-200 bg-cyan-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-cyan-700">
          {value || "-"}
        </span>
      );
    }

    if (["site_name_s1_ip", "site_name_s2_ip"].includes(key)) {
      return (
        <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
          {value || "-"}
        </span>
      );
    }

    if (key === "link_id") {
      return <span className="font-semibold text-slate-900">{value || "-"}</span>;
    }

    return value === null || value === undefined || value === "" ? "-" : String(value);
  };

  const SortableHeader = ({ label, columnKey }) => (
    <th
      onClick={() => onSort(columnKey)}
      className={`${thClass} cursor-pointer select-none hover:bg-slate-200`}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        <span className="text-[9px] text-slate-400">{sortIndicator(columnKey)}</span>
      </div>
    </th>
  );

  return (
    <table className="w-full min-w-max border-collapse bg-white">
      <thead>
        <tr>
          <th className={thClass} onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onToggleSelectAll}
              className="h-3.5 w-3.5 rounded border-slate-300"
            />
          </th>

          {microwaveLinkBudgetColumns.map((column) => (
            <SortableHeader
              key={column.key}
              label={column.label}
              columnKey={column.key}
            />
          ))}
        </tr>
      </thead>

      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td
              colSpan={microwaveLinkBudgetColumns.length + 1}
              className="px-4 py-10 text-center"
            >
              <div className="text-3xl">📡</div>
              <h3 className="mt-2 text-sm font-semibold text-slate-900">
                No microwave link budget records found
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Try adjusting search or filter, or create a new record.
              </p>
            </td>
          </tr>
        ) : (
          rows.map((row, index) => {
            const selected = selectedIds.includes(row.id);

            return (
              <tr
                key={row.id}
                onClick={() => onToggleSelectRow(row.id)}
                className={`cursor-pointer transition ${
                  selected
                    ? "bg-sky-50 ring-1 ring-inset ring-sky-200"
                    : index % 2 === 0
                    ? "bg-white"
                    : "bg-slate-50/50"
                } hover:bg-sky-50`}
              >
                <td
                  className={tdClass}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelectRow(row.id);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => {}}
                    className="pointer-events-none h-3.5 w-3.5 rounded border-slate-300"
                  />
                </td>

                {microwaveLinkBudgetColumns.map((column) => (
                  <td key={column.key} className={tdClass}>
                    {getCellValue(row, column.key)}
                  </td>
                ))}
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

const thClass =
  "whitespace-nowrap border-b border-slate-300 bg-slate-100 px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-slate-600";

const tdClass =
  "whitespace-nowrap border-b border-slate-200 px-2 py-1.5 align-middle text-[11px] text-slate-700";

export default AdminMicrowaveLinkBudgetTable;