"use client";

import React, { useState } from "react";
import { X, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Eye } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile, token: string) => void;
}

export function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Invalid email or password");
      }

      const data = await res.json();
      localStorage.setItem("rtapip_token", data.access_token);
      localStorage.setItem("rtapip_user", JSON.stringify(data.user));
      document.cookie = `rtapip_token=${data.access_token}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `rtapip_role=${data.user.role}; path=/; max-age=86400; SameSite=Lax`;
      onLoginSuccess(data.user, data.access_token);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setLoading(true);
    setError(null);

    fetch("http://localhost:8000/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: demoEmail, password: demoPass })
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not log in with demo account");
        return res.json();
      })
      .then((data) => {
        localStorage.setItem("rtapip_token", data.access_token);
        localStorage.setItem("rtapip_user", JSON.stringify(data.user));
        document.cookie = `rtapip_token=${data.access_token}; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `rtapip_role=${data.user.role}; path=/; max-age=86400; SameSite=Lax`;
        onLoginSuccess(data.user, data.access_token);
        onClose();
      })
      .catch((err) => {
        const fallbackUser: UserProfile = {
          id: "demo-user",
          email: demoEmail,
          full_name: demoEmail.includes("admin") ? "System Administrator" : demoEmail.includes("analyst") ? "Data Analyst" : "Public Viewer",
          role: demoEmail.includes("admin") ? "ADMIN" : demoEmail.includes("analyst") ? "DATA_ANALYST" : "VIEWER"
        };
        document.cookie = `rtapip_token=demo-token; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `rtapip_role=${fallbackUser.role}; path=/; max-age=86400; SameSite=Lax`;
        onLoginSuccess(fallbackUser, "demo-token");
        onClose();
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white border border-zinc-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 relative text-zinc-900">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 p-1 rounded-md transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-medium text-zinc-700 mb-3">
            <Lock className="h-3.5 w-3.5 text-zinc-900" />
            <span>Secure Access</span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Sign in to RT-APIP</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Access live price monitoring, run collection pipelines, or review data quality audits.
          </p>
        </div>

        {/* 1-Click Demo Accounts */}
        <div className="mb-5 p-3.5 bg-zinc-50 rounded-xl border border-zinc-200">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
            One-Click Quick Login (Demo Profiles)
          </span>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin("analyst@rtapip.in", "Analyst@123456")}
              className="px-2.5 py-2 rounded-lg bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-800 text-left font-medium transition-all shadow-xs flex flex-col justify-between"
            >
              <UserCheck className="h-3.5 w-3.5 text-zinc-600 mb-1" />
              <span className="font-semibold text-zinc-900">Analyst</span>
              <span className="text-[10px] text-zinc-500">Full Data</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin("admin@rtapip.in", "Admin@123456")}
              className="px-2.5 py-2 rounded-lg bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-800 text-left font-medium transition-all shadow-xs flex flex-col justify-between"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-zinc-600 mb-1" />
              <span className="font-semibold text-zinc-900">Admin</span>
              <span className="text-[10px] text-zinc-500">Pipeline Run</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin("viewer@rtapip.in", "Viewer@123456")}
              className="px-2.5 py-2 rounded-lg bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-800 text-left font-medium transition-all shadow-xs flex flex-col justify-between"
            >
              <Eye className="h-3.5 w-3.5 text-zinc-600 mb-1" />
              <span className="font-semibold text-zinc-900">Viewer</span>
              <span className="text-[10px] text-zinc-500">Read-Only</span>
            </button>
          </div>
        </div>

        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-zinc-200 w-full"></div>
          <span className="bg-white px-3 text-[11px] text-zinc-400 uppercase tracking-wider">or sign in with email</span>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="h-4 w-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@rtapip.in"
                className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="h-4 w-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-black hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm"
          >
            {loading ? "Verifying..." : "Sign In to Platform"}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
