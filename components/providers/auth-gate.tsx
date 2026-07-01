"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";
import { Button } from "@/components/ui/button";
import { Terminal, AlertCircle, RefreshCw, LogOut } from "lucide-react";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/modul",
  "/workspace",
  "/progress",
  "/settings"
];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, loading, syncLoading, syncError, isAuthenticated, logout, refreshSync } = useAuth();

  const isProtectedRoute = PROTECTED_ROUTES.some((route) => 
    pathname === route || pathname.startsWith(route + "/")
  );

  useEffect(() => {
    if (!loading && isProtectedRoute && !user) {
      router.push("/login");
    }
  }, [user, loading, pathname, isProtectedRoute, router]);

  // If path is not protected, render immediately
  if (!isProtectedRoute) {
    return <>{children}</>;
  }

  // 1. Initial loading auth state
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] space-y-4 font-sans bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#16A34A]"></div>
        <p className="text-gray-500 text-sm">Memuat status masuk...</p>
      </div>
    );
  }

  // 2. Not logged in: redirecting (handled in useEffect, show loading in between)
  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] space-y-4 font-sans bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#16A34A]"></div>
        <p className="text-gray-500 text-sm">Mengalihkan ke halaman masuk...</p>
      </div>
    );
  }

  // 3. Database Sync is loading
  if (syncLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] p-4 bg-gray-50 text-center font-sans space-y-6">
        <div className="bg-green-50 p-4 rounded-full text-[#16A34A] animate-pulse">
          <Terminal size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-gray-800">Menyiapkan workspace Linux kamu...</h2>
          <p className="text-gray-500 text-xs max-w-xs mx-auto">
            Kami sedang memverifikasi profil dan memetakan virtual filesystem Anda di cloud.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <RefreshCw size={12} className="animate-spin" />
          <span>Sedang mengunggah data awal...</span>
        </div>
      </div>
    );
  }

  // 4. Sync failed with error
  if (syncError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] p-6 bg-gray-50 text-center font-sans space-y-6 max-w-md mx-auto">
        <div className="bg-red-50 p-4 rounded-full text-red-600">
          <AlertCircle size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-gray-800">Gagal Menyiapkan Workspace</h2>
          <p className="text-red-500 text-xs font-mono bg-red-50/50 p-3 rounded border border-red-100/60 overflow-x-auto max-w-full text-left">
            {syncError}
          </p>
          <p className="text-gray-500 text-xs">
            Terjadi kendala saat menghubungkan akun Anda ke Supabase. Silakan coba sambungkan ulang.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
          <Button 
            onClick={refreshSync}
            className="bg-[#16A34A] hover:bg-green-700 text-white font-sans text-xs gap-1.5"
          >
            <RefreshCw size={14} />
            <span>Coba Lagi</span>
          </Button>
          <Button 
            onClick={logout}
            variant="outline"
            className="border-gray-200 hover:bg-gray-100 text-gray-600 font-sans text-xs gap-1.5"
          >
            <LogOut size={14} />
            <span>Keluar / Login Ulang</span>
          </Button>
        </div>
      </div>
    );
  }

  // 5. Authenticated and successfully synced
  return <>{children}</>;
}
