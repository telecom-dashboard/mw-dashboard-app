import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSiteById } from "../../api/siteApi";
import { getPingHistory, pingSite } from "../../api/toolApi";
import TopNavbar from "../../components/layout/TopNavBar";


function SiteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pingResult, setPingResult] = useState(null);
  const [pingLoading, setPingLoading] = useState(false);
  const [pingHistory, setPingHistory] = useState([]);

  const fetchSite = async () => {
    try {
      const data = await getSiteById(id);
      setSite(data);
    } catch (error) {
      console.error("Failed to fetch site details", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPingHistory = async () => {
    try {
      const data = await getPingHistory(id);
      setPingHistory(data);
    } catch (error) {
      console.error("Failed to fetch ping history", error);
    }
  };

  useEffect(() => {
    fetchSite();
    fetchPingHistory();
  }, [id]);

  const handleOpenLogin = () => {
    if (!site?.management_ip) {
      alert("No management IP available for this site.");
      return;
    }

    const protocol = site.web_protocol || "http";
    const url = `${protocol}://${site.management_ip}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handlePing = async () => {
    try {
      setPingLoading(true);
      const result = await pingSite(site.id);
      setPingResult(result);
      await fetchPingHistory();
    } catch (error) {
      console.error("Ping failed", error);
      alert(error?.response?.data?.detail || "Ping failed");
    } finally {
      setPingLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 30 }}>Loading site details...</div>;
  }

  if (!site) {
    return <div style={{ padding: 30 }}>Site not found.</div>;
  }

  return (
    <>
      <TopNavbar />

      <div style={{ padding: 30 }}>
        <button onClick={() => navigate("/client")} style={{ marginBottom: 20 }}>
          Back
        </button>

        <h1>Site Detail</h1>

        <div style={card}>
          <p><strong>Site Code:</strong> {site.site_code}</p>
          <p><strong>Site Name:</strong> {site.site_name}</p>
          <p><strong>Region:</strong> {site.region}</p>
          <p><strong>Vendor:</strong> {site.vendor}</p>
          <p><strong>Model:</strong> {site.model}</p>
          <p><strong>Latitude:</strong> {site.latitude}</p>
          <p><strong>Longitude:</strong> {site.longitude}</p>
          <p><strong>Management IP:</strong> {site.management_ip}</p>
          <p><strong>Web Protocol:</strong> {site.web_protocol}</p>
          <p><strong>Status:</strong> {site.status}</p>
          <p><strong>Site Class:</strong> {site.site_class}</p>
          <p><strong>Active:</strong> {site.is_active ? "Yes" : "No"}</p>

          <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
            <button onClick={handleOpenLogin}>Open Login</button>
            <button onClick={handlePing} disabled={pingLoading}>
              {pingLoading ? "Pinging..." : "Ping"}
            </button>
          </div>
        </div>

        {pingResult && (
          <div
            style={{
              ...card,
              marginTop: 20,
              borderLeft: pingResult.reachable ? "6px solid green" : "6px solid crimson",
            }}
          >
            <h2>Latest Ping Result</h2>
            <p><strong>IP:</strong> {pingResult.ip_address}</p>
            <p><strong>Status:</strong> {pingResult.reachable ? "Reachable ✅" : "Unreachable ❌"}</p>
            <p><strong>Sent:</strong> {pingResult.sent ?? "-"}</p>
            <p><strong>Received:</strong> {pingResult.received ?? "-"}</p>
            <p><strong>Packet Loss:</strong> {pingResult.packet_loss ?? "-"}%</p>
            <p><strong>Min:</strong> {pingResult.min_ms ?? "-"} ms</p>
            <p><strong>Avg:</strong> {pingResult.avg_ms ?? "-"} ms</p>
            <p><strong>Max:</strong> {pingResult.max_ms ?? "-"} ms</p>
            <p><strong>Error:</strong> {pingResult.error_message || "-"}</p>
          </div>
        )}

        <div style={{ ...card, marginTop: 20 }}>
          <h2>Recent Ping History</h2>

          {pingHistory.length === 0 ? (
            <p>No ping history yet.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
              <thead>
                <tr style={{ background: "#eee" }}>
                  <th style={th}>Time</th>
                  <th style={th}>IP</th>
                  <th style={th}>Status</th>
                  <th style={th}>Loss %</th>
                  <th style={th}>Avg ms</th>
                </tr>
              </thead>
              <tbody>
                {pingHistory.map((item) => (
                  <tr key={item.id}>
                    <td style={td}>{new Date(item.created_at).toLocaleString()}</td>
                    <td style={td}>{item.ip_address}</td>
                    <td style={td}>{item.reachable ? "Reachable" : "Unreachable"}</td>
                    <td style={td}>{item.packet_loss ?? "-"}</td>
                    <td style={td}>{item.avg_ms ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

const card = {
  background: "#fff",
  padding: 24,
  borderRadius: 12,
  boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
};

const th = {
  padding: 10,
  border: "1px solid #ddd",
  textAlign: "left",
};

const td = {
  padding: 10,
  border: "1px solid #ddd",
};

export default SiteDetailPage;