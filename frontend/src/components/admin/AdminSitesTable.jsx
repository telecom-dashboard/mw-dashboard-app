function AdminSitesTable({ sites, onEdit }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 20, background: "#fff" }}>
      <thead>
        <tr style={{ background: "#e5e7eb" }}>
          <th style={th}>Code</th>
          <th style={th}>Name</th>
          <th style={th}>Region</th>
          <th style={th}>Vendor</th>
          <th style={th}>Model</th>
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
            <td style={td}>{site.region}</td>
            <td style={td}>{site.vendor}</td>
            <td style={td}>{site.model}</td>
            <td style={td}>{site.management_ip}</td>
            <td style={td}>{site.status}</td>
            <td style={td}>
              <button onClick={() => onEdit(site)}>Edit</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const th = {
  padding: 10,
  border: "1px solid #d1d5db",
  textAlign: "left",
};

const td = {
  padding: 10,
  border: "1px solid #e5e7eb",
};

export default AdminSitesTable;