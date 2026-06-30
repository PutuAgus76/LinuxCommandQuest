"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getProgress, resetProgress } from "@/lib/storage";
import { getAnswerAccuracy, getGlobalProgressPercentage } from "@/lib/progress-utils";
import { badges } from "@/data/badges";
import { modules } from "@/data/modules";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import * as Icons from "lucide-react";

export default function ProgressPage() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [points, setPoints] = useState(0);
  const [completedModuleIds, setCompletedModuleIds] = useState<string[]>([]);
  const [unlockedBadgeIds, setUnlockedBadgeIds] = useState<string[]>([]);
  const [masteredCommands, setMasteredCommands] = useState<string[]>([]);
  const [accuracy, setAccuracy] = useState(0);
  const [showResetDialog, setShowResetDialog] = useState(false);

  useEffect(() => {
    const progress = getProgress();
    setPoints(progress.totalPoints);
    setCompletedModuleIds(progress.completedModuleIds);
    setUnlockedBadgeIds(progress.unlockedBadgeIds);
    setMasteredCommands(progress.masteredCommands);
    setAccuracy(getAnswerAccuracy(progress));
    setIsLoaded(true);
  }, []);

  const handleReset = () => {
    resetProgress();
    toast.success("Progress berhasil direset! Semua poin, lencana, dan riwayat belajar telah dihapus.");
    setShowResetDialog(false);
    
    // Refresh page state
    setPoints(0);
    setCompletedModuleIds([]);
    setUnlockedBadgeIds([]);
    setMasteredCommands([]);
    setAccuracy(0);
    
    // Redirect to landing
    setTimeout(() => {
      router.push("/");
    }, 1000);
  };

  const globalProgress = getGlobalProgressPercentage(completedModuleIds);

  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#16A34A]"></div>
        <p className="text-gray-500 font-sans text-sm">Memuat data progress...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 font-sans tracking-tight">Pencapaian Belajar</h1>
        <p className="text-gray-500 font-sans text-sm mt-1">
          Review poin, tingkat akurasi jawaban, badge, dan command yang berhasil Anda kuasai.
        </p>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Total Points */}
        <Card className="border-[#E5E7EB] shadow-sm bg-white">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold font-sans text-gray-500 uppercase tracking-wider">
              Total Skor Poin
            </CardTitle>
            <Icons.Trophy className="h-5 w-5 text-[#F97316]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-[#F97316] font-sans">{points} Poin</div>
            <p className="text-xs text-gray-400 font-sans mt-1">
              Hasil akumulasi dari seluruh latihan yang berhasil diselesaikan.
            </p>
          </CardContent>
        </Card>

        {/* Accuracy Rate */}
        <Card className="border-[#E5E7EB] shadow-sm bg-white">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold font-sans text-gray-500 uppercase tracking-wider">
              Akurasi Jawaban
            </CardTitle>
            <Icons.Target className="h-5 w-5 text-[#16A34A]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-[#16A34A] font-sans">{accuracy}%</div>
            <p className="text-xs text-gray-400 font-sans mt-1">
              Persentase jawaban benar pada percobaan pertama.
            </p>
          </CardContent>
        </Card>

        {/* Completed Modules */}
        <Card className="border-[#E5E7EB] shadow-sm bg-white">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold font-sans text-gray-500 uppercase tracking-wider">
              Modul Terselesaikan
            </CardTitle>
            <Icons.Award className="h-5 w-5 text-[#16A34A]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-[#16A34A] font-sans">
              {completedModuleIds.length} / {modules.length}
            </div>
            <p className="text-xs text-gray-400 font-sans mt-1">
              Persentase kelulusan kelas: {globalProgress}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Badges Grid */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-[#E5E7EB] shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold font-sans text-gray-800 flex items-center gap-2">
                <Icons.Shield className="h-5 w-5 text-[#16A34A]" />
                Lencana Penghargaan ({unlockedBadgeIds.length} terbuka)
              </CardTitle>
              <CardDescription className="text-gray-500 font-sans text-xs">
                Arahkan kursor / klik lencana untuk melihat syarat mendapatkan lencana tersebut.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid sm:grid-cols-2 gap-4">
                {badges.map((badge) => {
                  const isUnlocked = unlockedBadgeIds.includes(badge.badgeId);
                  
                  // Get Lucide Icon dynamically
                  const Icon = (Icons as any)[badge.iconName] || Icons.Award;

                  return (
                    <Tooltip key={badge.badgeId}>
                      <TooltipTrigger className="text-left w-full focus:outline-none">
                        <div
                          className={`flex items-center space-x-3.5 p-4 rounded-xl border transition-all duration-300 ${
                            isUnlocked
                              ? "bg-green-50/20 border-green-200 text-gray-800"
                              : "bg-gray-50/50 border-gray-100 opacity-60 grayscale select-none"
                          }`}
                        >
                          <div className={`p-2.5 rounded-lg ${
                            isUnlocked
                              ? "bg-[#16A34A]/10 text-[#16A34A] animate-pulse-subtle"
                              : "bg-gray-200 text-gray-400"
                          }`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="space-y-0.5 text-left">
                            <h4 className="font-bold font-sans text-sm">
                              {badge.title}
                            </h4>
                            <p className="text-[10px] font-sans text-gray-400">
                              {isUnlocked ? "Status: Terbuka" : "Status: Terkunci"}
                            </p>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-gray-800 text-white font-sans text-xs p-2.5 max-w-[200px] leading-relaxed">
                        <strong>Syarat:</strong> {badge.requirementDescription}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Mastered Commands */}
        <div className="lg:col-span-5 space-y-6">
          {/* Mastered Commands */}
          <Card className="border-[#E5E7EB] shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold font-sans text-gray-800 flex items-center gap-2">
                <Icons.Terminal className="h-5 w-5 text-[#16A34A]" />
                Command yang Dikuasai
              </CardTitle>
              <CardDescription className="text-gray-500 font-sans text-xs">
                Daftar command Linux yang sudah pernah dijawab benar minimal sekali.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {masteredCommands.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {masteredCommands.map((cmd) => (
                    <Badge
                      key={cmd}
                      className="font-mono text-xs py-1 px-2.5 bg-[#16A34A]/5 hover:bg-[#16A34A]/5 text-[#16A34A] border border-[#16A34A]/25 rounded font-semibold"
                    >
                      {cmd}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm font-sans">
                  Belum ada command yang dikuasai. <br />
                  <Link href="/dashboard" className="text-[#16A34A] hover:underline font-bold">
                    Mulai belajar sekarang
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Module Completed Checklist */}
          <Card className="border-[#E5E7EB] shadow-sm bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold font-sans text-gray-800">
                Ringkasan Materi Selesai
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-60 overflow-y-auto pr-2 space-y-2 text-sm font-sans">
              {modules.map((mod) => {
                const isCompleted = completedModuleIds.includes(mod.moduleId);
                return (
                  <div key={mod.moduleId} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors">
                    <span className={`text-xs ${isCompleted ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                      Level {mod.level}: {mod.title}
                    </span>
                    {isCompleted ? (
                      <span className="text-[10px] text-[#16A34A] font-semibold bg-[#16A34A]/10 px-2 py-0.5 rounded flex items-center gap-1 select-none">
                        <Icons.CheckCircle size={10} /> Selesai
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded select-none">
                        Belum
                      </span>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Danger Zone: Reset Button */}
      <div className="flex justify-center border-t border-gray-200 pt-8 pb-4">
        <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <DialogTrigger render={<Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-sans text-xs gap-1.5 px-5" />}>
            <Icons.RefreshCw size={13} />
            Reset Semua Progress
          </DialogTrigger>
          <DialogContent className="max-w-md bg-white border-[#E5E7EB] text-gray-800">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600 font-sans">
                <Icons.AlertCircle className="h-5 w-5" />
                Hapus Semua Progress Belajar?
              </DialogTitle>
              <DialogDescription className="text-gray-500 font-sans">
                Tindakan ini permanen dan tidak bisa dibatalkan.
              </DialogDescription>
            </DialogHeader>
            <div className="py-3 text-sm text-gray-600 font-sans leading-relaxed">
              Semua poin skor, status penyelesaian modul, lencana badge, dan daftar command yang telah Anda kuasai akan dihapus dari <strong>localStorage</strong> browser ini.
            </div>
            <DialogFooter className="gap-2 sm:gap-0 mt-2">
              <Button
                variant="outline"
                onClick={() => setShowResetDialog(false)}
                className="border-gray-200 text-gray-700 font-sans hover:bg-gray-50"
              >
                Batalkan
              </Button>
              <Button
                onClick={handleReset}
                className="bg-red-600 hover:bg-red-700 text-white font-sans"
              >
                Ya, Reset Progress
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
