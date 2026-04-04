import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSites } from "../../api/siteApi";
import SiteTable from "./SiteTable";
import TopNavbar from "../../components/layout/TopNavBar";

function SiteSearchPage() {
  const [sites, setSites] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const fetchSites = async () => {
    try {
      const data = await getSites(search);
      setSites(data);
    } catch (error) {
      console.error("Failed to fetch sites", error);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchSites();
  };

  const handleSelectSite = (siteId) => {
    navigate(`/client/sites/${siteId}`);
  };

  return (
    <>
      <TopNavbar />

      <div style={{ padding: 30 }}>
        <h1>Site Search</h1>

        <form onSubmit={handleSearch}>
          <input
            placeholder="Search site, vendor, IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: 10, width: 300 }}
          />
          <button type="submit" style={{ marginLeft: 10 }}>
            Search
          </button>
        </form>

        <SiteTable sites={sites} onSelect={handleSelectSite} />
      </div>
    </>
  );
}

export default SiteSearchPage;