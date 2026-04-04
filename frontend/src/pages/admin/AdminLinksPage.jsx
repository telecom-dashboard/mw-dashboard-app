import { useEffect, useState } from "react";
import {
  createMicrowaveLink,
  getMicrowaveLinks,
  updateMicrowaveLink,
} from "../../api/microwaveLinkApi";
import AdminMicrowaveLinkForm from "../../components/admin/AdminMicrowaveLinkForm";
import AdminMicrowaveLinksTable from "../../components/admin/AdminMicrowaveLinksTable";

function AdminLinksPage() {
  const [rows, setRows] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchRows = async (
    pageValue = page,
    pageSizeValue = pageSize,
    searchValue = search
  ) => {
    try {
      setLoading(true);
      setError("");

      const data = await getMicrowaveLinks({
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
      console.error("Failed to fetch microwave links", err);
      setError("Failed to load microwave links");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows(page, pageSize, search);
  }, [page, pageSize, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleCreate = async (payload) => {
    try {
      setSaving(true);
      setError("");
      await createMicrowaveLink(payload);
      setShowCreateForm(false);
      await fetchRows(page, pageSize, search);
    } catch (err) {
      console.error("Create microwave link failed", err);
      setError(err?.response?.data?.detail || "Failed to create microwave link");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (payload) => {
    try {
      setSaving(true);
      setError("");
      await updateMicrowaveLink(editingRow.id, payload);
      setEditingRow(null);
      await fetchRows(page, pageSize, search);
    } catch (err) {
      console.error("Update microwave link failed", err);
      setError(err?.response?.data?.detail || "Failed to update microwave link");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={headerRow}>
        <div>
          <h2 style={{ margin: 0 }}>Microwave Links</h2>
          <p style={subText}>Manage microwave link master data</p>
        </div>

        <div style={headerActions}>
          <form onSubmit={handleSearch} style={searchWrap}>
            <input
              placeholder="Search NE / FE / Link ID / IP..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={searchInputStyle}
            />
            <button type="submit" style={searchBtn}>
              Search
            </button>
          </form>

          <button
            onClick={() => {
              setEditingRow(null);
              setShowCreateForm(true);
            }}
            style={primaryBtn}
          >
            + Add Microwave Link
          </button>
        </div>
      </div>

      {error && <p style={{ color: "crimson", marginBottom: 16 }}>{error}</p>}
      {saving && <p style={{ marginBottom: 16 }}>Saving...</p>}
      {loading && <p style={{ marginBottom: 16 }}>Loading...</p>}

      {showCreateForm && (
        <div style={formCard}>
          <div style={cardHeader}>
            <h3 style={{ margin: 0 }}>Create Microwave Link</h3>
          </div>

          <div style={cardBody}>
            <AdminMicrowaveLinkForm
              initialData={null}
              onSubmit={handleCreate}
              onCancel={() => setShowCreateForm(false)}
              submitLabel="Create Microwave Link"
            />
          </div>
        </div>
      )}

      {editingRow && (
        <div style={formCard}>
          <div style={cardHeader}>
            <h3 style={{ margin: 0 }}>Edit Microwave Link</h3>
          </div>

          <div style={cardBody}>
            <AdminMicrowaveLinkForm
              initialData={editingRow}
              onSubmit={handleUpdate}
              onCancel={() => setEditingRow(null)}
              submitLabel="Update Microwave Link"
            />
          </div>
        </div>
      )}

      <div style={tableCard}>
        <div style={cardHeader}>
          <h3 style={{ margin: 0 }}>Microwave Link Table</h3>
        </div>

        <div style={tableScroller}>
          <AdminMicrowaveLinksTable rows={rows} onEdit={setEditingRow} />
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
  );
}

const pageStyle = {
  padding: 4,
};

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  flexWrap: "wrap",
  marginBottom: 20,
};

const subText = {
  fontSize: 13,
  color: "#6b7280",
  marginTop: 4,
};

const headerActions = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const searchWrap = {
  display: "flex",
  gap: 8,
  alignItems: "center",
};

const searchInputStyle = {
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  width: 260,
  boxSizing: "border-box",
};

const searchBtn = {
  padding: "8px 12px",
  borderRadius: 6,
  border: "none",
  background: "#111827",
  color: "#fff",
  cursor: "pointer",
};

const primaryBtn = {
  padding: "8px 12px",
  borderRadius: 6,
  border: "none",
  background: "#2563eb",
  color: "#fff",
  cursor: "pointer",
};

const formCard = {
  background: "#fff",
  borderRadius: 10,
  boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
  overflow: "hidden",
  marginBottom: 20,
};

const tableCard = {
  background: "#fff",
  borderRadius: 10,
  boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
  overflow: "hidden",
};

const cardHeader = {
  padding: "16px 16px 8px 16px",
};

const cardBody = {
  padding: "0 16px 16px 16px",
};

const tableScroller = {
  overflowX: "auto",
  maxHeight: "65vh",
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

export default AdminLinksPage;