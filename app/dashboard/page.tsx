"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getClientToken } from "@/lib/clientAuth";
import { parseApiResponse } from "@/lib/apiHelper";
import { isModuleLocked } from "@/lib/progress-utils";
import { modules } from "@/data/modules";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  BookOpen, 
  Lock, 
  CheckCircle, 
  ChevronRight, 
  PlayCircle,
  AlertCircle
} from "lucide-react";

export default function DashboardPage() {
  const [totalPoints, setTotalPoints] = useState(0);
  const [linuxUsername, setLinuxUsername] = useState("student");
  const [displayName, setDisplayName] = useState("Student");
  const [globalProgress, setGlobalProgress] = useState(0);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const token = getClientToken();

        // 1. Sync Profile & Create Personal Workspace (idempotent)
        const syncRes = await fetch("/api/profile/sync", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        await parseApiResponse(syncRes);

        // 2. Fetch summary stats
        const summaryRes = await fetch("/api/course/summary", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const summaryData = await parseApiResponse(summaryRes);
        setTotalPoints(summaryData.totalPoints);
        setLinuxUsername(summaryData.linuxUsername);
        setDisplayName(summaryData.displayName);
        setGlobalProgress(summaryData.globalProgressPercentage);

        // 3. Fetch full course progress
        const progressRes = await fetch("/api/course/progress", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const progressData = await parseApiResponse(progressRes);
        setCompletedIds(progressData.progress.completedModuleIds);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setIsLoaded(true);
      }
    }

    loadDashboardData();
  }, []);

  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#16A34A]"></div>
        <p className="text-gray-500 font-sans text-sm">Memuat data pembelajaran...</p>
      </div>
    );
  }

  // Calculate dynamic isLocked for each module
  const processedModules = modules.map((mod) => ({
    ...mod,
    isLocked: isModuleLocked(mod, completedIds)
  }));

  // Find first unfinished and unlocked module
  const nextModule = processedModules.find(
    (mod) => !completedIds.includes(mod.moduleId) && !mod.isLocked
  );

  // Group modules by Level
  const levels = Array.from(new Set(modules.map((m) => m.level))).sort((a, b) => a - b);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* Header & Quick stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-sans tracking-tight">
            Dashboard Belajar {displayName && `— ${displayName}`}
          </h1>
          <p className="text-gray-500 font-sans text-sm mt-1">
            Linux Identity: <span className="font-mono bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded border border-gray-200">{linuxUsername || "guest"}</span>
          </p>
        </div>

        {/* Continue Learning CTA */}
        {nextModule ? (
          <Link href={`/modul/${nextModule.moduleId}`} passHref>
            <Button className="bg-[#16A34A] hover:bg-green-700 text-white font-sans font-semibold gap-1.5 shadow-sm animate-bounce-subtle">
              <PlayCircle className="h-5 w-5" />
              <span>Lanjutkan Belajar ({nextModule.command})</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Button disabled className="bg-gray-200 text-gray-400 font-sans font-semibold gap-1.5 border border-gray-100">
            <CheckCircle className="h-5 w-5" />
            <span>Semua Level Selesai!</span>
          </Button>
        )}
      </div>

      {/* Progress Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Points Card */}
        <Card className="border-[#E5E7EB] shadow-sm bg-white overflow-hidden relative">
          <div className="absolute right-0 bottom-0 translate-y-2 translate-x-2 text-gray-50 opacity-50 select-none">
            <Trophy size={120} className="text-[#F97316]/5 fill-current" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-400 font-sans font-medium uppercase tracking-wider text-xs">Total Akumulasi Skor</CardDescription>
            <CardTitle className="text-3xl font-extrabold text-[#F97316] font-sans flex items-center gap-2 mt-1">
              <Trophy className="h-7 w-7 text-[#F97316] fill-current" />
              <span>{totalPoints} Poin</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-xs text-gray-500 font-sans">
              Poin didapatkan dari jawaban benar pada latihan interaktif.
            </p>
          </CardContent>
        </Card>

        {/* Completed Modules Card */}
        <Card className="border-[#E5E7EB] shadow-sm bg-white md:col-span-2 flex flex-col justify-between">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardDescription className="text-gray-400 font-sans font-medium uppercase tracking-wider text-xs">
                Modul Selesai
              </CardDescription>
              <span className="text-sm font-semibold text-gray-700 font-sans">
                {completedIds.length} dari {modules.length} Modul ({globalProgress}%)
              </span>
            </div>
            <Progress value={globalProgress} className="h-3.5 bg-gray-100 mt-2.5" />
          </CardHeader>
          <CardContent className="pt-2 pb-4">
            <p className="text-xs text-gray-500 font-sans flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-[#16A34A]" />
              <span>Selesaikan modul di setiap level untuk membuka materi level berikutnya.</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Levels and Modules Map */}
      <div className="space-y-10">
        {levels.map((level) => {
          const levelModules = processedModules.filter((mod) => mod.level === level);
          const levelCompletedCount = levelModules.filter((mod) => completedIds.includes(mod.moduleId)).length;
          const levelTotalCount = levelModules.length;
          const isLevelCleared = levelCompletedCount === levelTotalCount;

          return (
            <div key={level} className="space-y-4">
              {/* Level Heading */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <div className="flex items-center space-x-2.5">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold font-sans ${
                    isLevelCleared 
                      ? "bg-[#16A34A]/10 text-[#16A34A]" 
                      : "bg-[#F97316]/10 text-[#F97316]"
                  }`}>
                    {level}
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 font-sans tracking-tight">
                    Level {level} — {
                      level === 1 ? "Dasar Terminal dan Folder" :
                      level === 2 ? "Dasar File" :
                      level === 3 ? "Mengelola File" :
                      level === 4 ? "Mengedit File dengan Vim" :
                      level === 5 ? "Permission Linux Dasar" :
                      level === 6 ? "Membaca Permission dari ls -l" :
                      level === 7 ? "chmod Angka (Numeric)" :
                      level === 8 ? "chmod Simbolik (Symbolic)" :
                      level === 9 ? "Mengubah Pemilik dengan chown" :
                      "Permission di cPanel Hosting"
                    }
                  </h2>
                </div>
                <Badge variant="outline" className={`text-xs font-sans ${
                  isLevelCleared
                    ? "bg-[#16A34A]/5 text-[#16A34A] border-[#16A34A]/20"
                    : "bg-gray-50 text-gray-500 border-gray-200"
                }`}>
                  {levelCompletedCount} / {levelTotalCount} Modul
                </Badge>
              </div>

              {/* Module Cards Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {levelModules.map((mod) => {
                  const isCompleted = completedIds.includes(mod.moduleId);
                  const isLocked = mod.isLocked;

                  const cardContent = (
                    <Card className={`h-full border-[#E5E7EB] transition-all duration-300 flex flex-col justify-between ${
                      isCompleted 
                        ? "bg-green-50/10 border-green-200 shadow-sm" 
                        : isLocked 
                        ? "bg-gray-50/50 opacity-70 cursor-not-allowed border-dashed" 
                        : "bg-white hover:shadow-md hover:border-gray-300 cursor-pointer shadow-sm"
                    }`}>
                      <CardHeader className="pb-3 pt-5 px-5">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-1.5">
                              <Badge className="font-mono text-[10px] py-0 px-1 bg-[#FAFAFA] border border-gray-200 text-gray-600 font-normal">
                                {mod.command}
                              </Badge>
                              {mod.isDangerous && (
                                <Badge className="bg-[#DC2626]/10 hover:bg-[#DC2626]/10 text-[#DC2626] text-[9px] font-sans py-0 px-1 border-none">
                                  Bahaya
                                </Badge>
                              )}
                            </div>
                            <CardTitle className={`text-base font-bold font-sans mt-2 ${
                              isLocked ? "text-gray-400" : "text-gray-800"
                            }`}>
                              {mod.title}
                            </CardTitle>
                          </div>

                          <div className="pl-2">
                            {isCompleted ? (
                              <CheckCircle className="h-5 w-5 text-[#16A34A]" />
                            ) : isLocked ? (
                              <Lock className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-[#16A34A] animate-pulse" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-4 px-5">
                        <p className={`text-xs leading-relaxed font-sans ${
                          isLocked ? "text-gray-400" : "text-gray-500"
                        }`}>
                          {mod.summary}
                        </p>
                      </CardContent>
                      <div className="border-t border-gray-100/80 px-5 py-2.5 flex items-center justify-between text-[11px] font-sans text-gray-400 bg-gray-50/30">
                        <span>Poin: <strong className={isLocked ? "text-gray-400" : "text-[#F97316]"}>{mod.requiredPoints}</strong></span>
                        <span>{mod.exerciseIds.length} Latihan</span>
                      </div>
                    </Card>
                  );

                  if (isLocked) {
                    return (
                      <Tooltip key={mod.moduleId}>
                        <TooltipTrigger className="text-left w-full focus:outline-none">
                          {cardContent}
                        </TooltipTrigger>
                        <TooltipContent className="bg-gray-800 text-white font-sans text-xs flex items-center gap-1.5 p-2.5">
                          <AlertCircle size={14} className="text-[#F97316]" />
                          <span>Selesaikan seluruh modul Level {level - 1} untuk membuka.</span>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return (
                    <Link href={`/modul/${mod.moduleId}`} key={mod.moduleId}>
                      {cardContent}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
