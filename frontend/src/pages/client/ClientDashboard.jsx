import { useAuth } from "../../context/AuthContext";

function ClientDashboard() {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: 30 }}>
      <h1>Client Dashboard</h1>
      <p>Welcome, {user?.username} 👋</p>
      <p>Role: {user?.role}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default ClientDashboard;