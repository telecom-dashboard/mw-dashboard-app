function AdminMicrowaveLinksTable({ rows, onEdit }) {
  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={thSticky}>NE ID</th>
          <th style={thSticky}>FE ID</th>
          <th style={thSticky}>Link ID</th>
          <th style={thSticky}>IP</th>
          <th style={thSticky}>Protocol</th>
          <th style={thSticky}>Class</th>
          <th style={thSticky}>Vendor</th>
          <th style={thSticky}>Model</th>
          <th style={thSticky}>Type</th>
          <th style={thSticky}>Status</th>
          <th style={thSticky}>Active</th>
          <th style={thSticky}>Actions</th>
        </tr>
      </thead>

      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={12} style={emptyTd}>
              No microwave links found.
            </td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr key={row.id} style={tbodyRow}>
              <td style={td}>{row.ne_id || "-"}</td>
              <td style={td}>{row.fe_id || "-"}</td>
              <td style={tdBold}>{row.link_id}</td>
              <td style={td}>{row.management_ip || "-"}</td>
              <td style={td}>{row.web_protocol || "-"}</td>
              <td style={td}>{row.link_class || "-"}</td>
              <td style={td}>{row.vendor || "-"}</td>
              <td style={td}>{row.model || "-"}</td>
              <td style={td}>{row.type || "-"}</td>

              <td style={td}>
                <span style={statusBadge(row.status)}>
                  {row.status || "Unknown"}
                </span>
              </td>

              <td style={td}>
                <span style={activeBadge(row.is_active)}>
                  {row.is_active ? "Active" : "Down"}
                </span>
              </td>

              <td style={td}>
                <button onClick={() => onEdit(row)} style={editBtn}>
                  Edit
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

const tableStyle = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: 0,
};

const thSticky = {
  position: "sticky",
  top: 0,
  background: "#f9fafb",
  padding: 10,
  textAlign: "left",
  fontSize: 13,
  color: "#374151",
  whiteSpace: "nowrap",
  zIndex: 1,
  borderBottom: "1px solid #e5e7eb",
};

const td = {
  padding: 10,
  fontSize: 13,
  borderTop: "1px solid #f1f5f9",
  color: "#111827",
  verticalAlign: "middle",
};

const tdBold = {
  ...td,
  fontWeight: "600",
};

const tbodyRow = {
  transition: "background 0.2s",
};

const emptyTd = {
  padding: 20,
  textAlign: "center",
  color: "#6b7280",
  borderTop: "1px solid #f1f5f9",
};

const editBtn = {
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  background: "#fff",
  cursor: "pointer",
  fontSize: 12,
};

const statusBadge = (status) => ({
  padding: "4px 8px",
  borderRadius: 6,
  fontSize: 12,
  display: "inline-block",
  background:
    status === "On Air"
      ? "#d1fae5"
      : status === "Planned"
      ? "#fef3c7"
      : status === "Down"
      ? "#fee2e2"
      : "#e5e7eb",
  color: "#111827",
});

const activeBadge = (active) => ({
  padding: "4px 8px",
  borderRadius: 6,
  fontSize: 12,
  display: "inline-block",
  background: active ? "#d1fae5" : "#fee2e2",
  color: "#111827",
});

export default AdminMicrowaveLinksTable;