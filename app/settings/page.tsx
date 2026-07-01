"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { 
  getClientToken, 
  setClientToken, 
  getLinuxUsername, 
  setLinuxUsername, 
  logoutClient 
} from "@/lib/clientAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Settings, Shield, User, HardDrive, RefreshCw, Key, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { parseApiResponse } from "@/lib/apiHelper";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [activeToken, setActiveToken] = useState("");
  const [customToken, setCustomToken] = useState("");
  const [syncStatus, setSyncStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    setUsernameInput(getLinuxUsername());
    setActiveToken(getClientToken() || "");
  }, []);

  const handleUsernameSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = getClientToken();
      const res = await fetch("/api/settings/username", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ linuxUsername: usernameInput })
      });

      await parseApiResponse(res);
      setLinuxUsername(usernameInput);
      toast.success("Linux Username berhasil diubah!");
    } catch (err: any) {
      toast.error(err.message || "Gagal mengubah username");
    } finally {
      setLoading(false);
    }
  };

  const handleTokenSelect = (tokenValue: string) => {
    setClientToken(tokenValue);
    setActiveToken(tokenValue);
    // Auto fill corresponding username
    const match = tokenValue.match(/^mock_user_([a-z0-9_-]{3,20})$/);
    if (match) {
      setUsernameInput(match[1]);
      setLinuxUsername(match[1]);
    }
    toast.info(`Token diubah: ${tokenValue}`);
  };

  const handleCustomTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customToken.trim()) return;
    setClientToken(customToken);
    setActiveToken(customToken);
    
    const match = customToken.match(/^mock_user_([a-z0-9_-]{3,20})$/);
    if (match) {
      setUsernameInput(match[1]);
      setLinuxUsername(match[1]);
    }
    
    setCustomToken("");
    toast.success("Custom token berhasil diaktifkan!");
  };

  const handleResetWorkspace = async () => {
    if (!confirm("Apakah Anda yakin ingin meriset seluruh filesystem? Semua file dan folder buatan Anda akan dihapus permanen!")) {
      return;
    }

    setLoading(true);
    try {
      const token = getClientToken();
      const res = await fetch("/api/workspace/reset", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      await parseApiResponse(res);
      toast.success("Workspace berhasil diriset.");
    } catch (err: any) {
      toast.error(err.message || "Gagal meriset workspace.");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncProfile = async () => {
    setLoading(true);
    try {
      const token = getClientToken();
      const res = await fetch("/api/profile/sync", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      const data = await parseApiResponse(res);
      setUsernameInput(data.profile.linux_username);
      setLinuxUsername(data.profile.linux_username);
      setSyncStatus("success");
      toast.success("Profil berhasil disinkronkan ke Supabase!");
    } catch (err: any) {
      setSyncStatus("error");
      toast.error(err.message || "Sinkronisasi gagal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl space-y-6">
        <div className="flex items-center space-x-2.5 mb-2">
          <Settings className="h-6 w-6 text-gray-700" />
          <h1 className="text-2xl font-bold font-sans text-gray-800">Pengaturan</h1>
        </div>

        {/* 1. Profile & Sync Card */}
        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <User size={16} className="text-[#16A34A]" />
              <span>Profil Pengguna (Linux Identity)</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Ubah identitas Linux virtual Anda yang digunakan pada terminal dan file explorer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleUsernameSave} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 font-sans">Linux Username</label>
                <div className="flex gap-2">
                  <Input 
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                    placeholder="Contoh: budi_dev"
                    maxLength={20}
                    className="font-mono text-sm max-w-xs"
                    disabled={loading}
                  />
                  <Button 
                    type="submit" 
                    disabled={loading || !usernameInput.trim()} 
                    className="bg-[#16A34A] hover:bg-green-700 text-white font-sans text-xs px-4"
                  >
                    Simpan
                  </Button>
                </div>
                <span className="text-[10px] text-gray-400 block font-sans">
                  Format: 3-20 karakter huruf kecil, angka, garis bawah (_), atau strip (-), diawali huruf.
                </span>
              </div>
            </form>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-sans">Sinkronkan data dengan Supabase:</span>
              <Button 
                onClick={handleSyncProfile} 
                variant="outline" 
                size="sm"
                disabled={loading}
                className="font-sans text-xs border-gray-200 hover:bg-gray-50 text-gray-600 gap-1.5"
              >
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                <span>Sync Profile</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 2. Mock Authentication Configurator (Development Helper) */}
        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Key size={16} className="text-[#F97316]" />
              <span>Konfigurasi Mock Token (Development Only)</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Ubah token login Anda untuk mensimulasikan login user yang berbeda di database lokal/Supabase.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-500 block font-sans">Pilih User Simulasi:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: "guest", val: "mock_user_guest" },
                  { name: "budi", val: "mock_user_budi" },
                  { name: "agus", val: "mock_user_agus" },
                  { name: "student", val: "mock_user_student" }
                ].map((u) => {
                  const isActive = activeToken === u.val;
                  return (
                    <button
                      key={u.name}
                      onClick={() => handleTokenSelect(u.val)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        isActive
                          ? "bg-[#F97316]/10 border-[#F97316] text-[#F97316] font-semibold"
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {u.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleCustomTokenSubmit} className="space-y-2.5 pt-2 border-t border-gray-100">
              <label className="text-xs font-semibold text-gray-500 font-sans block">Custom ID Token</label>
              <div className="flex gap-2">
                <Input 
                  value={customToken}
                  onChange={(e) => setCustomToken(e.target.value)}
                  placeholder="Ketik custom token (contoh: mock_user_john)"
                  className="font-mono text-xs max-w-sm"
                />
                <Button 
                  type="submit"
                  size="sm"
                  className="bg-gray-800 hover:bg-gray-900 text-white font-sans text-xs px-4"
                >
                  Set Token
                </Button>
              </div>
            </form>

            <div className="bg-orange-50/50 border border-orange-100 rounded p-2.5 text-[11px] text-[#F97316]/90 font-mono leading-relaxed">
              <strong>Token Aktif:</strong> Bearer {activeToken}
            </div>
          </CardContent>
        </Card>

        {/* 3. Filesystem Management */}
        <Card className="border-gray-200 bg-white shadow-sm border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <HardDrive size={16} className="text-red-500" />
              <span>Manajemen Filesystem</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Kelola atau bersihkan node filesystem Anda di database.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-gray-700 block font-sans">Reset Filesystem Latihan</span>
                <span className="text-[10px] text-gray-400 block font-sans">
                  Hapus semua file dan folder custom Anda, mengembalikan ke kondisi /home/username kosong.
                </span>
              </div>
              <Button 
                onClick={handleResetWorkspace} 
                variant="destructive"
                disabled={loading}
                className="font-sans text-xs px-4"
              >
                Reset Workspace
              </Button>
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
