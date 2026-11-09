"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, api, setAuthToken, getAuthToken } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  role: number | null; // 0: Admin, 1: Partner, 2: Customer, null when unauthenticated
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  registerCustomer: (data: { email: string; password: string; fullName: string; phone: string }) => Promise<User>;
  registerPartner: (data: { email: string; password: string; fullName: string; phone: string }) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async (): Promise<User | null> => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return null;
    }
    try {
      const profile = await api.auth.getProfile();
      if (profile) {
        setUser(profile);
        setAuthToken(token, profile.role);
        return profile;
      } else {
        setAuthToken(null);
        setUser(null);
        return null;
      }
    } catch {
      setAuthToken(null);
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.auth.login({ email, password });
    setUser(res.user);
    setAuthToken(res.accessToken, res.user.role);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("partner_owner_unlocked");
    }
    return res.user;
  };

  const registerCustomer = async (data: { email: string; password: string; fullName: string; phone: string }): Promise<User> => {
    await api.auth.registerCustomer(data);
    return await login(data.email, data.password);
  };

  const registerPartner = async (data: { email: string; password: string; fullName: string; phone: string }): Promise<User> => {
    await api.auth.registerPartner(data);
    return await login(data.email, data.password);
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("partner_owner_unlocked");
      window.location.href = "/";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        isAuthenticated: !!user,
        isLoading,
        login,
        registerCustomer,
        registerPartner,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
