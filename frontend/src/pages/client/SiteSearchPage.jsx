import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSites } from "../../api/siteApi";
import SiteTable from "./SiteTable";

function SiteSearchPage() {
  const [sites, setSites] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchSites = async (searchValue = search) => {
    try {
      setLoading(true);
      const data = await getSites(searchValue);
      setSites(data || []);
    } catch (error) {
      console.error("Failed to fetch sites", error);
      setSites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites("");
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchSites(search);
  };

  const handleSelectSite = (siteId) => {
    navigate(`/client/sites/${siteId}`);
  };

  return (
    <div style={{ padding: 30 }}>
      <h1>Site Search</h1>

      <form
        onSubmit={handleSearch}
        style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}
      >
        <input
          placeholder="Search site, vendor, IP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: 10, width: 300 }}
        />
        <button type="submit">Search</button>
      </form>

      {loading && <p>Loading sites...</p>}

      <SiteTable sites={sites} onSelect={handleSelectSite} />
    </div>
  );
}

export default SiteSearchPage;