"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { isFirebaseClientConfigured } from "@/lib/firebaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Terminal, Shield, LogIn, Settings } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { user, isAuthenticated, loginMock, loginGoogle, loading, syncLoading } = useAuth();
  const [customUsername, setCustomUsername] = useState("");
  const [localLoading, setLocalLoading] = useState(false);

  // If already authenticated and synced, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && !syncLoading) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, syncLoading, router]);

  const handleMockLogin = async (username: string) => {
    setLocalLoading(true);
    try {
      await loginMock(username);
      toast.success(`Berhasil masuk sebagai ${username}!`);
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Gagal masuk menggunakan mock user.");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleCustomMockLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUsername.trim()) return;
    const cleanUsername = customUsername.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (cleanUsername.length < 3) {
      toast.error("Username minimal 3 karakter.");
      return;
    }
    handleMockLogin(cleanUsername);
  };

  const handleGoogleLogin = async () => {
    setLocalLoading(true);
    try {
      await loginGoogle();
      toast.success("Berhasil masuk dengan Google!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Gagal masuk dengan Google.");
    } finally {
      setLocalLoading(false);
    }
  };

  const showMockSelection = 
    process.env.NODE_ENV !== "production" && 
    process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === "true";

  const isBtnDisabled = loading || syncLoading || localLoading;

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] p-4 bg-gradient-to-b from-gray-50 to-gray-100">
      <Card className="w-full max-w-md border-gray-200/80 shadow-lg bg-white overflow-hidden">
        {/* Brand Banner */}
        <div className="bg-[#181825] py-6 px-4 text-center border-b border-[#313244] flex flex-col items-center select-none">
          <div className="bg-[#16A34A]/10 p-2 rounded-lg text-[#16A34A] mb-2.5">
            <Terminal size={26} />
          </div>
          <h2 className="text-[#cdd6f4] font-sans font-bold text-lg">
            Linux <span className="text-[#F97316]">Command</span> Quest
          </h2>
          <p className="text-[#a6adc8] text-xs font-sans mt-0.5">
            Platform Belajar Command Line & Permission Linux
          </p>
        </div>

        <CardHeader className="pt-6 pb-2 text-center">
          <CardTitle className="text-xl font-bold font-sans text-gray-800">Masuk Akun</CardTitle>
          <CardDescription className="text-xs font-sans">
            Silakan masuk untuk melanjutkan progres belajar Linux Anda.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-2">
          {/* 1. Firebase Google Login (Production/Configured) */}
          {isFirebaseClientConfigured && (
            <div className="space-y-3">
              <Button
                onClick={handleGoogleLogin}
                disabled={isBtnDisabled}
                className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-sans text-sm font-semibold py-2.5 flex items-center justify-center gap-2 shadow-sm"
              >
                <LogIn size={18} className="text-[#16A34A]" />
                <span>Masuk dengan Google</span>
              </Button>
            </div>
          )}

          {/* Divider */}
          {isFirebaseClientConfigured && showMockSelection && (
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-4 text-[10px] text-gray-400 font-bold uppercase tracking-wider font-sans bg-white px-2">
                Atau
              </span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>
          )}

          {/* 2. Mock Users (Development Mode) */}
          {showMockSelection && (
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-150/80">
              <div className="flex items-center space-x-1.5 text-[#F97316] select-none">
                <Settings size={14} className="animate-spin-slow" />
                <span className="text-xs font-bold font-sans">Simulasi User (Development)</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {["guest", "agus", "budi"].map((uName) => (
                  <Button
                    key={uName}
                    type="button"
                    onClick={() => handleMockLogin(uName)}
                    disabled={isBtnDisabled}
                    variant="outline"
                    className="text-xs font-mono border-gray-200 hover:border-[#16A34A] hover:bg-white text-gray-700 capitalize py-1.5"
                  >
                    {uName}
                  </Button>
                ))}
              </div>

              {/* Custom Mock User input */}
              <form onSubmit={handleCustomMockLogin} className="space-y-2 pt-2 border-t border-gray-200/60">
                <label className="text-[10px] font-semibold text-gray-400 font-sans block">
                  Username Simulasi Kustom:
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={customUsername}
                    onChange={(e) => setCustomUsername(e.target.value)}
                    placeholder="budi_admin"
                    disabled={isBtnDisabled}
                    className="font-mono text-xs h-8 bg-white border-gray-200"
                    maxLength={20}
                  />
                  <Button
                    type="submit"
                    disabled={isBtnDisabled || !customUsername.trim()}
                    className="bg-[#16A34A] hover:bg-green-700 text-white font-sans text-xs px-3 h-8"
                  >
                    Masuk
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Fallback if neither is configured */}
          {!isFirebaseClientConfigured && !showMockSelection && (
            <div className="text-center p-4 bg-orange-50 border border-orange-100 rounded text-xs text-orange-700 font-sans">
              Autentikasi Firebase belum terkonfigurasi dan Mock Auth dinonaktifkan.
              Silakan konfigurasikan `.env.local` terlebih dahulu.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
