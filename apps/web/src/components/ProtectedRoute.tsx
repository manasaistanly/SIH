"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ShieldAlert, ArrowLeft, Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, router]);

  // Loading state during session inspection to prevent content flashing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-6 text-center select-none font-mono">
        <div className="w-8 h-8 rounded-sm bg-[#111111] text-white flex items-center justify-center font-bold text-xs mb-4">
          AIP
        </div>
        <div className="flex items-center gap-2 text-xs text-[#111111] font-semibold tracking-tight">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#6b7280]" />
          <span>VERIFYING CREDENTIALS...</span>
        </div>
        <p className="text-[11px] text-[#6b7280] mt-1">
          Securing statistical session &middot; RT-APIP Security
        </p>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Role validation
  if (requiredRoles && requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-6 text-center font-mono">
        <div className="max-w-md w-full p-8 bg-[#ffffff] border border-[#e5e7eb] rounded-sm shadow-sm">
          <div className="w-10 h-10 rounded-xs bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca] flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-5 h-5" />
          </div>

          <h2 className="text-sm font-bold uppercase tracking-tight text-[#111111]">
            403 &middot; Access Restricted
          </h2>

          <p className="text-xs text-[#6b7280] mt-2 leading-relaxed">
            Your current role (<span className="font-bold text-[#111111]">{user?.role}</span>) does not possess authorization to view this section. This area requires: <span className="font-bold text-[#111111]">{requiredRoles.join(", ")}</span>.
          </p>

          <div className="mt-6 pt-4 border-t border-[#f3f4f6]">
            <button
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] text-white text-xs font-mono font-medium rounded-sm hover:bg-[#27272a] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Workstation</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
