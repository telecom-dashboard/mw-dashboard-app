import { Share2 } from "lucide-react";

import StandardDataTable from "../common/StandardDataTable";
import { siteConnectivityColumns } from "../../constants/siteConnectivityColumns";

function AdminSiteConnectivityTable({
  rows = [],
  selectedIds = [],
  onToggleSelectRow,
  onToggleSelectAll,
  sortConfig,
  onSort,
}) {
  const getCellValue = (row, key) => {
    const value = row?.[key];

    if (key === "is_active") {
      return (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            value
              ? "border border-blue-200 bg-blue-50 text-blue-700"
              : "border border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {value ? "Active" : "Inactive"}
        </span>
      );
    }

    if (key === "budget_status") {
      const statusClass =
        value === "On Air"
          ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
          : value === "Dismantle"
          ? "border border-amber-200 bg-amber-50 text-amber-700"
          : value === "Down"
          ? "border border-red-200 bg-red-50 text-red-700"
          : "border border-slate-200 bg-slate-50 text-slate-700";

      return (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass}`}
        >
          {value || "-"}
        </span>
      );
    }

    if (key === "budget_protocol") {
      return (
        <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-cyan-700">
          {value || "-"}
        </span>
      );
    }

    if (key === "category_ne") {
      return (
        <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
          {value || "-"}
        </span>
      );
    }

    if (["budget_site_name_s1_ip", "budget_site_name_s2_ip"].includes(key)) {
      return (
        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700">
          {value || "-"}
        </span>
      );
    }

    if (key === "link_id") {
      return <span className="font-semibold text-slate-900">{value || "-"}</span>;
    }

    return value === null || value === undefined || value === "" ? "-" : String(value);
  };

  return (
    <StandardDataTable
      columns={siteConnectivityColumns}
      rows={rows}
      selectedIds={selectedIds}
      onToggleSelectRow={onToggleSelectRow}
      onToggleSelectAll={onToggleSelectAll}
      sortConfig={sortConfig}
      onSort={onSort}
      renderCell={getCellValue}
      emptyTitle="No site connectivity records found"
      emptyDescription="Try adjusting search or category filter, or import a new Excel file."
      emptyIcon={Share2}
    />
  );
}

export default AdminSiteConnectivityTable;
