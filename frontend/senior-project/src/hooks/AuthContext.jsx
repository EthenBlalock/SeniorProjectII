import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  async function getAuth() {
    try {
      const res = await fetch("/api/react/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // important if using cookies
        body: JSON.stringify({}),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      setAuth(json.auth);
    } catch (err) {
      console.error("Failed to fetch auth:", err);
      setAuth(null);
    } finally {
      setLoadingAuth(false);
    }
  }

  useEffect(() => {
    getAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ auth, setAuth, loadingAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
