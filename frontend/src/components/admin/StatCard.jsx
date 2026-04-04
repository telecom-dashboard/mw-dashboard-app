function StatCard({ title, value }) {
  return (
    <div style={cardStyle}>
      <div style={titleStyle}>{title}</div>
      <div style={valueStyle}>{value}</div>
    </div>
  );
}

const cardStyle = {
  background: "#fff",
  padding: 20,
  borderRadius: 12,
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  minWidth: 180,
};

const titleStyle = {
  fontSize: 14,
  color: "#6b7280",
  marginBottom: 8,
};

const valueStyle = {
  fontSize: 28,
  fontWeight: "bold",
};

export default StatCard;