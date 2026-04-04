function SiteTable({ sites, onSelect }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 20 }}>
      <thead>
        <tr style={{ background: "#eee" }}>
          <th style={th}>Code</th>
          <th style={th}>Name</th>
          <th style={th}>Vendor</th>
          <th style={th}>IP</th>
          <th style={th}>Status</th>
          <th style={th}>Actions</th>
        </tr>
      </thead>

      <tbody>
        {sites.map((site) => (
          <tr key={site.id}>
            <td style={td}>{site.site_code}</td>
            <td style={td}>{site.site_name}</td>
            <td style={td}>{site.vendor}</td>
            <td style={td}>{site.management_ip}</td>
            <td style={td}>{site.status}</td>
            <td style={td}>
              <button onClick={() => onSelect(site.id)}>View</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const th = { padding: 10, border: "1px solid #ddd" };
const td = { padding: 10, border: "1px solid #ddd" };

export default SiteTable;