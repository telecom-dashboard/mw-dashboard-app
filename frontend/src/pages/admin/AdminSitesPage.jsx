import { useEffect, useState } from "react";
import { createSite, getSites, updateSite } from "../../api/siteApi";
import AdminSiteForm from "../../components/admin/AdminSiteForm";
import AdminSitesTable from "../../components/admin/AdminSitesTable";

function AdminSitesPage() {
  const [sites, setSites] = useState([]);
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchSites = async (searchText = "") => {
    try {
      const data = await getSites(searchText);
      setSites(data);
    } catch (err) {
      console.error("Failed to fetch sites", err);
      setError("Failed to load sites");
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    await fetchSites(search);
  };

  const handleCreate = async (payload) => {
    try {
      setSaving(true);
      setError("");
      await createSite(payload);
      setShowCreateForm(false);
      await fetchSites(search);
    } catch (err) {
      console.error("Create site failed", err);
      setError(err?.response?.data?.detail || "Failed to create site");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (payload) => {
    try {
      setSaving(true);
      setError("");
      await updateSite(editingSite.id, payload);
      setEditingSite(null);
      await fetchSites(search);
    } catch (err) {
      console.error("Update site failed", err);
      setError(err?.response?.data?.detail || "Failed to update site");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1>Sites</h1>
      <p>Manage telecom site master data here.</p>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <form onSubmit={handleSearch}>
          <input
            placeholder="Search code, name, vendor, region, IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: 10, width: 320 }}
          />
          <button type="submit" style={{ marginLeft: 10 }}>Search</button>
        </form>

        <button onClick={() => {
          setEditingSite(null);
          setShowCreateForm(true);
        }}>
          + Add Site
        </button>
      </div>

      {error && <p style={{ color: "crimson", marginTop: 16 }}>{error}</p>}
      {saving && <p style={{ marginTop: 16 }}>Saving...</p>}

      {showCreateForm && (
        <div style={{ marginTop: 20 }}>
          <h2>Create Site</h2>
          <AdminSiteForm
            initialData={null}
            onSubmit={handleCreate}
            onCancel={() => setShowCreateForm(false)}
            submitLabel="Create Site"
          />
        </div>
      )}

      {editingSite && (
        <div style={{ marginTop: 20 }}>
          <h2>Edit Site</h2>
          <AdminSiteForm
            initialData={editingSite}
            onSubmit={handleUpdate}
            onCancel={() => setEditingSite(null)}
            submitLabel="Update Site"
          />
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <AdminSitesTable sites={sites} onEdit={setEditingSite} />
      </div>
    </div>
  );
}

export default AdminSitesPage;