"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: "ADMIN" | "ANALYST" | "VIEWER" | string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => Promise<void>;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session from storage / cookies
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("rtapip_token");
      const savedUserStr = localStorage.getItem("rtapip_user");

      if (savedToken && savedUserStr) {
        const parsedUser = JSON.parse(savedUserStr);
        setToken(savedToken);
        setUser(parsedUser);

        // Ensure cookies stay in sync for Next.js middleware
        document.cookie = `rtapip_token=${savedToken}; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `rtapip_role=${parsedUser.role}; path=/; max-age=86400; SameSite=Lax`;
      } else {
        // Clean any stale cookies
        document.cookie = "rtapip_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        document.cookie = "rtapip_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
      }
    } catch (err) {
      console.warn("Failed reading saved auth session:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Prevent back-forward cache from revealing protected pages after logout
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        const currentToken = localStorage.getItem("rtapip_token");
        if (!currentToken && pathname !== "/" && !["/about", "/methodology", "/documentation"].includes(pathname)) {
          window.location.replace("/");
        }
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [pathname]);

  const login = useCallback((newToken: string, newUser: UserProfile) => {
    setToken(newToken);
    setUser(newUser);
    try {
      localStorage.setItem("rtapip_token", newToken);
      localStorage.setItem("rtapip_user", JSON.stringify(newUser));
      document.cookie = `rtapip_token=${newToken}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `rtapip_role=${newUser.role}; path=/; max-age=86400; SameSite=Lax`;
    } catch (e) {
      console.warn("Could not persist login tokens:", e);
    }
  }, []);

  const logout = useCallback(async () => {
    const currentToken = token || (typeof window !== "undefined" ? localStorage.getItem("rtapip_token") : null);
    
    // 1. Invalidate session on backend
    if (currentToken) {
      await api.logout(currentToken);
    }

    // 2. Clear credentials & tokens
    try {
      localStorage.removeItem("rtapip_token");
      localStorage.removeItem("rtapip_user");
      sessionStorage.clear();
      document.cookie = "rtapip_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
      document.cookie = "rtapip_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    } catch (e) {
      // Storage access error
    }

    // 3. Clear memory state
    setToken(null);
    setUser(null);

    // 4. Redirect immediately to public landing page
    router.replace("/");
  }, [token, router]);

  const hasRole = useCallback((allowedRoles: string[]) => {
    if (!user) return false;
    return allowedRoles.includes(user.role.toUpperCase());
  }, [user]);

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    hasRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
