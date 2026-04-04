import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const user = await login(form.username, form.password);

      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/client");
      }
    } catch (err) {
      setError(err?.response?.data?.detail || "Login failed");
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: 24 }}>
      <h1>Login</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>Username</label>
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            style={{ width: "100%", padding: 10, marginTop: 4 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            style={{ width: "100%", padding: 10, marginTop: 4 }}
          />
        </div>

        {error && <p style={{ color: "crimson" }}>{error}</p>}

        <button type="submit" style={{ padding: "10px 16px", cursor: "pointer" }}>
          Sign In
        </button>
      </form>
    </div>
  );
}

export default LoginPage;