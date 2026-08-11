"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); // access token - used for all authenticated API calls
  const [loading, setLoading] = useState(true);
  const refreshTokenRef = useRef(null);
  const refreshTimerRef = useRef(null);

  const persistSession = (data) => {
    setToken(data.accessToken);
    refreshTokenRef.current = data.refreshToken;
    setUser(data);
    sessionStorage.setItem("accessToken", data.accessToken);
    sessionStorage.setItem("refreshToken", data.refreshToken);
    scheduleRefresh();
  };

  const clearSession = () => {
    setUser(null);
    setToken(null);
    refreshTokenRef.current = null;
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
  };

  // Access tokens expire in 15 minutes - silently get a new one every 10 minutes
  // so the user is never interrupted mid-session.
  const scheduleRefresh = () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(silentRefresh, 10 * 60 * 1000);
  };

  const silentRefresh = async () => {
    const rt = refreshTokenRef.current || sessionStorage.getItem("refreshToken");
    if (!rt) return;
    try {
      const data = await api.refreshAccessToken(rt);
      setToken(data.accessToken);
      refreshTokenRef.current = data.refreshToken;
      sessionStorage.setItem("accessToken", data.accessToken);
      sessionStorage.setItem("refreshToken", data.refreshToken);
      scheduleRefresh();
    } catch {
      // Refresh token expired too - user needs to log in again
      clearSession();
    }
  };

  // On first load, try to resume a session from sessionStorage
  useEffect(() => {
    const init = async () => {
      const savedAccess = sessionStorage.getItem("accessToken");
      const savedRefresh = sessionStorage.getItem("refreshToken");

      if (!savedAccess || !savedRefresh) {
        setLoading(false);
        return;
      }

      refreshTokenRef.current = savedRefresh;
      setToken(savedAccess);

      try {
        const me = await api.getMe(savedAccess);
        setUser(me);
        scheduleRefresh();
      } catch {
        // Access token may have expired while the tab was closed - try refreshing once
        try {
          const data = await api.refreshAccessToken(savedRefresh);
          setToken(data.accessToken);
          refreshTokenRef.current = data.refreshToken;
          sessionStorage.setItem("accessToken", data.accessToken);
          sessionStorage.setItem("refreshToken", data.refreshToken);
          const me = await api.getMe(data.accessToken);
          setUser(me);
          scheduleRefresh();
        } catch {
          clearSession();
        }
      } finally {
        setLoading(false);
      }
    };

    init();
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    persistSession(data);
    return data;
  };

  const register = async (name, email, password, role) => {
    const data = await api.register({ name, email, password, role });
    persistSession(data);
    return data;
  };

  const logout = async () => {
    try {
      if (token) await api.logout(token);
    } catch {
      // even if the server call fails, clear the local session
    }
    clearSession();
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
