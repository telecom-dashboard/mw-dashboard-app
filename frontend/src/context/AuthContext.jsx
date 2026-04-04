import { createContext, useContext, useEffect, useState } from "react";
import { getMeApi, loginApi } from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (username, password) => {
    const data = await loginApi(username, password);
    localStorage.setItem("access_token", data.access_token);

    const me = await getMeApi();
    localStorage.setItem("user", JSON.stringify(me));
    setUser(me);
    return me;
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setUser(null);
  };

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem("access_token");
      const cachedUser = localStorage.getItem("user");

      if (!token) {
        setLoading(false);
        return;
      }

      if (cachedUser) {
        setUser(JSON.parse(cachedUser));
      }

      try {
        const me = await getMeApi();
        localStorage.setItem("user", JSON.stringify(me));
        setUser(me);
      } catch (error) {
        logout();
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}