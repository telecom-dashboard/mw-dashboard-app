import { useEffect, useState } from "react";
import {
  getMicrowaveLinkStatus,
  getMicrowaveLinkStatusSummary,
} from "../../api/linkStatusApi";
import TopNavbar from "../../components/layout/TopNavbar";

function ClientLinkStatusPage() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchSummary = async () => {
    try {
      const data = await getMicrowaveLinkStatusSummary();
      setSummary(data);
    } catch (err) {
      setError("Failed to load summary");
    }
  };

  const fetchRows = async (pageValue = page, pageSizeValue = pageSize, searchValue = search) => {
    try {
      setLoading(true);
      const data = await getMicrowaveLinkStatus({
        search: searchValue || undefined,
        page: pageValue,
        page_size: pageSizeValue,
      });

      setRows(data.items || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
      setPageSize(data.page_size || 10);
      setTotalPages(data.total_pages || 0);
    } catch (err) {
      setError("Failed to load link status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchRows(page, pageSize, search);
  }, [page, pageSize, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  return (
    <>
      <TopNavbar />

      <div style={pageStyle}>
        <div style={headerRow}>
          <div>
            <h2 style={{ margin: 0 }}>Link Status</h2>
            <p style={subText}>Real-time microwave link overview</p>
          </div>

          <form onSubmit={handleSearch} style={searchWrap}>
            <input
              placeholder="Search link / NE / IP..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={searchInputStyle}
            />
            <button style={searchBtn}>Search</button>
          </form>
        </div>

        {error && <p style={{ color: "crimson", marginBottom: 16 }}>{error}</p>}
        {loading && <p style={{ marginBottom: 16 }}>Loading...</p>}

        {summary && (
          <div style={summaryWrap}>
            <SmallCard title="Total" value={summary.total_links} />
            <SmallCard title="Active" value={summary.active_links} />
            <SmallCard title="Inactive" value={summary.inactive_links} />
          </div>
        )}

        <div style={tableCard}>
          <div style={tableScroller}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thSticky}>Link</th>
                  <th style={thSticky}>NE</th>
                  <th style={thSticky}>FE</th>
                  <th style={thSticky}>Vendor</th>
                  <th style={thSticky}>Model</th>
                  <th style={thSticky}>Type</th>
                  <th style={thSticky}>Status</th>
                  <th style={thSticky}>Active</th>
                  <th style={thSticky}>IP</th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={emptyTd}>
                      No link status records found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} style={tbodyRow}>
                      <td style={tdBold}>{row.link_id}</td>
                      <td style={td}>{row.ne_id || "-"}</td>
                      <td style={td}>{row.fe_id || "-"}</td>
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
                      <td style={td}>{row.management_ip || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={paginationWrap}>
            <div>
              <span style={{ marginRight: 8 }}>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPage(1);
                  setPageSize(Number(e.target.value));
                }}
                style={selectStyle}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div style={paginationRight}>
              <span>
                {total === 0
                  ? "0"
                  : `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} of ${total}`}
              </span>

              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page <= 1}
                style={pageBtn}
              >
                Previous
              </button>

              <span>
                Page {page} / {totalPages || 1}
              </span>

              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages || 1))}
                disabled={page >= totalPages}
                style={pageBtn}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ClientLinkStatusPage;

function SmallCard({ title, value }) {
  return (
    <div style={cardStyle}>
      <div style={cardTitle}>{title}</div>
      <div style={cardValue}>{value}</div>
    </div>
  );
}

const pageStyle = {
  padding: 20,
  maxWidth: 1200,
  margin: "0 auto",
};

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20,
  gap: 16,
  flexWrap: "wrap",
};

const subText = {
  fontSize: 13,
  color: "#6b7280",
  marginTop: 4,
};

const searchWrap = {
  display: "flex",
  gap: 8,
};

const searchInputStyle = {
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  width: 220,
};

const searchBtn = {
  padding: "8px 12px",
  borderRadius: 6,
  border: "none",
  background: "#111827",
  color: "#fff",
  cursor: "pointer",
};

const summaryWrap = {
  display: "flex",
  gap: 12,
  marginBottom: 16,
  flexWrap: "wrap",
};

const cardStyle = {
  background: "#fff",
  padding: 12,
  borderRadius: 8,
  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  minWidth: 100,
};

const cardTitle = {
  fontSize: 12,
  color: "#6b7280",
};

const cardValue = {
  fontSize: 20,
  fontWeight: "bold",
};

const tableCard = {
  background: "#fff",
  borderRadius: 10,
  boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
  overflow: "hidden",
};

const tableScroller = {
  overflowX: "auto",
  maxHeight: "65vh",
};

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

const paginationWrap = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: 16,
  borderTop: "1px solid #f1f5f9",
  flexWrap: "wrap",
  gap: 12,
};

const paginationRight = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const pageBtn = {
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  background: "#fff",
  cursor: "pointer",
};

const selectStyle = {
  padding: "6px 8px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
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