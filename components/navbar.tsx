"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getProgress } from "@/lib/storage";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Terminal, Trophy, User, Menu } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [points, setPoints] = useState(0);

  const updatePoints = () => {
    const progress = getProgress();
    setPoints(progress.totalPoints);
  };

  useEffect(() => {
    updatePoints();
    window.addEventListener("local-storage-update", updatePoints);
    return () => {
      window.removeEventListener("local-storage-update", updatePoints);
    };
  }, []);

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
          {/* Mobile Hamburguer Drawer */}
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
            href="/progress"
            className={`transition-colors hover:text-gray-800 ${
              isActive("/progress") ? "text-[#16A34A] border-b-2 border-[#16A34A] pb-5 pt-1" : "text-gray-500 pb-5 pt-1"
            }`}
          >
            Progress Saya
          </Link>
        </nav>

        {/* User Stats Widget */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 bg-[#F97316]/10 px-3 py-1.5 rounded-full text-[#F97316]">
            <Trophy className="h-4 w-4 fill-current" />
            <span className="text-sm font-semibold font-sans">{points} Poin</span>
          </div>
          <Link
            href="/progress"
            className="flex items-center justify-center h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
            title="Lihat Profil & Progress"
          >
            <User className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
