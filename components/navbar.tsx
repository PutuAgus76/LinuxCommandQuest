"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Terminal, Trophy, User, Menu, LogOut, Settings as SettingsIcon } from "lucide-react";

import { getClientToken } from "@/lib/clientAuth";
import { useAuth } from "@/components/providers/auth-provider";

import { parseApiResponse } from "@/lib/apiHelper";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [points, setPoints] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchPoints = async () => {
    try {
      const token = getClientToken();
      if (!token) {
        setPoints(0);
        return;
      }
      const res = await fetch("/api/course/summary", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await parseApiResponse(res);
      setPoints(data.totalPoints || 0);
    } catch (err) {
      console.error("Failed to fetch points in navbar:", err);
    }
  };

  useEffect(() => {
    fetchPoints();
    window.addEventListener("points-updated", fetchPoints);
    window.addEventListener("local-storage-update", fetchPoints);
    return () => {
      window.removeEventListener("points-updated", fetchPoints);
      window.removeEventListener("local-storage-update", fetchPoints);
    };
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
    router.push("/login");
  };

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E5E7EB] bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center space-x-2">
          {/* Mobile Hamburger Drawer */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger render={
                <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-800 -ml-2" />
              }>
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="left" className="bg-white p-6 max-w-xs border-r border-[#E5E7EB] text-gray-800">
                <SheetHeader className="pb-4 border-b border-gray-100 flex flex-row items-center gap-2">
                  <div className="bg-[#16A34A]/10 p-1.5 rounded-lg text-[#16A34A]">
                    <Terminal className="h-5 w-5" />
                  </div>
                  <SheetTitle className="font-bold text-base font-sans select-none text-left">
                    Linux Command Quest
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-4 pt-6">
                  <SheetClose render={
                    <Link
                      href="/dashboard"
                      className={`text-sm font-semibold font-sans py-2.5 px-3 rounded-lg transition-colors ${
                        isActive("/dashboard")
                          ? "bg-[#16A34A]/10 text-[#16A34A]"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      Dashboard Belajar
                    </Link>
                  } />
                  <SheetClose render={
                    <Link
                      href="/workspace"
                      className={`text-sm font-semibold font-sans py-2.5 px-3 rounded-lg transition-colors ${
                        isActive("/workspace")
                          ? "bg-[#16A34A]/10 text-[#16A34A]"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      Virtual Workspace
                    </Link>
                  } />
                  <SheetClose render={
                    <Link
                      href="/progress"
                      className={`text-sm font-semibold font-sans py-2.5 px-3 rounded-lg transition-colors ${
                        isActive("/progress")
                          ? "bg-[#16A34A]/10 text-[#16A34A]"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      Progress Saya
                    </Link>
                  } />
                  {user && (
                    <button
                      onClick={handleLogout}
                      className="text-sm font-semibold font-sans py-2.5 px-3 rounded-lg transition-colors text-red-600 hover:bg-red-50 hover:text-red-700 text-left"
                    >
                      Keluar
                    </button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <Link href="/" className="flex items-center space-x-2 text-gray-800 hover:opacity-90">
            <div className="bg-[#16A34A]/10 p-1.5 rounded-lg text-[#16A34A]">
              <Terminal className="h-5 w-5" />
            </div>
            <span className="font-sans font-bold text-lg tracking-tight select-none">
              Linux <span className="text-[#F97316]">Command</span> Quest
            </span>
          </Link>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex space-x-8 text-sm font-medium">
          <Link
            href="/dashboard"
            className={`transition-colors hover:text-gray-800 ${
              isActive("/dashboard") ? "text-[#16A34A] border-b-2 border-[#16A34A] pb-5 pt-1" : "text-gray-500 pb-5 pt-1"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/workspace"
            className={`transition-colors hover:text-gray-800 ${
              isActive("/workspace") ? "text-[#16A34A] border-b-2 border-[#16A34A] pb-5 pt-1" : "text-gray-500 pb-5 pt-1"
            }`}
          >
            Workspace
          </Link>
          <Link
            href="/progress"
            className={`transition-colors hover:text-gray-800 ${
              isActive("/progress") ? "text-[#16A34A] border-b-2 border-[#16A34A] pb-5 pt-1" : "text-gray-500 pb-5 pt-1"
            }`}
          >
            Progress
          </Link>
        </nav>

        {/* User Stats Widget */}
        {user ? (
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 bg-[#F97316]/10 px-3 py-1.5 rounded-full text-[#F97316]">
              <Trophy className="h-4 w-4 fill-current" />
              <span className="text-sm font-semibold font-sans">{points} Poin</span>
            </div>

            {/* Avatar with dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu((v) => !v)}
                className="flex items-center justify-center h-9 w-9 rounded-full bg-gray-100 hover:bg-[#16A34A]/10 text-gray-600 hover:text-[#16A34A] transition-colors border border-transparent hover:border-[#16A34A]/20"
                title="Profil & Keluar"
                aria-expanded={showUserMenu}
              >
                <User className="h-4 w-4" />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-gray-100 shadow-lg py-1.5 z-50 animate-fadeIn">
                  <div className="px-4 py-2 border-b border-gray-50">
                    <p className="text-xs text-gray-400 font-sans truncate">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    href="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-sans text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    <SettingsIcon className="h-4 w-4 text-gray-400" />
                    Profile &amp; Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-sans text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button className="bg-[#16A34A] hover:bg-green-700 text-white font-sans text-xs px-4 py-2 font-semibold shadow-sm">
                Masuk
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
