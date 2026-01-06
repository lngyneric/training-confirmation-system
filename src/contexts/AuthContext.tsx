import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "wouter";

interface User {
  id: string;
  name: string;
  avatar?: string;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (mockUser?: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // 1. Check LocalStorage for existing session
    const storedUser = localStorage.getItem("training-system-user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user session", e);
        localStorage.removeItem("training-system-user");
      }
    }

    // 2. TODO: Check for WeCom Auth Code in URL (for real SSO)
    // const params = new URLSearchParams(window.location.search);
    // const code = params.get('code');
    // if (code) { ... exchange code for token ... }

    setIsLoading(false);
  }, []);

  const login = (mockUser?: User) => {
    // For Demo/Dev purpose
    const sessionUser = mockUser || {
      id: "demo-user-001",
      name: "演示用户", // Default placeholder
      token: "demo-token"
    };
    setUser(sessionUser);
    localStorage.setItem("training-system-user", JSON.stringify(sessionUser));
    setLocation("/");
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("training-system-user");
    setLocation("/login");
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        login, 
        logout,
        isAuthenticated: !!user 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
