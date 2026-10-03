import { createContext, useState, useContext, useEffect, type ReactNode } from "react";

interface User {
  id: number;
  fname: string;
  lname: string;
  email: string;
  phone: string | null;
  bio: string | null;
  avatar: string | null;
  role: "admin" | "user";
  status: "activo" | "inactivo";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (fname: string, lname: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { API_URL } from "../config/api";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch {
      // no session
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message };
    } catch {
      return { success: false, message: "Error de conexión" };
    }
  };

  const register = async (fname: string, lname: string, email: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fname, lname, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message };
    } catch {
      return { success: false, message: "Error de conexión" };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/auth/signout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setUser(null);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
