"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { modules } from "@/data/modules";
import { isModuleLocked } from "@/lib/progress-utils";
import { ExercisePanel } from "@/components/modul/exercise-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { getClientToken } from "@/lib/clientAuth";
import { parseApiResponse } from "@/lib/apiHelper";
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  AlertCircle, 
  Info, 
  BookOpen, 
  Lock, 
  CheckCircle,
  ChevronRight,
  ArrowRight
} from "lucide-react";

interface PageProps {
  params: Promise<{ moduleId: string }>;
}

export default function ModulePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const moduleId = resolvedParams.moduleId;
  const router = useRouter();

  const [progress, setProgress] = useState<any>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCompletedThisSession, setIsCompletedThisSession] = useState(false);

  const moduleData = modules.find((m) => m.moduleId === moduleId);

  const fetchModuleProgress = async () => {
    try {
      const token = getClientToken();
      const res = await fetch("/api/course/progress", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await parseApiResponse(res);
      setProgress(data.progress);
    } catch (err) {
      console.error("Failed to load progress:", err);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    if (!moduleData) return;
    fetchModuleProgress();
  }, [moduleId, moduleData]);

  if (!moduleData) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <h2 className="text-2xl font-bold font-sans text-gray-800">Modul Tidak Ditemukan</h2>
        <p className="text-gray-500 font-sans">Modul dengan ID '{moduleId}' tidak terdaftar di sistem kami.</p>
        <Link href="/dashboard" passHref>
          <Button className="bg-[#16A34A] hover:bg-green-700 text-white font-sans">
            Kembali ke Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  if (!isLoaded || !progress) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#16A34A]"></div>
        <p className="text-gray-500 font-sans text-sm">Memuat modul & progress...</p>
      </div>
    );
  }

  // Check locking state
  const isLocked = isModuleLocked(moduleData, progress.completedModuleIds);
  const isCompleted = progress.completedModuleIds.includes(moduleId);

  if (isLocked) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4 max-w-md">
        <Lock className="h-16 w-16 text-gray-400 mx-auto" />
        <h2 className="text-2xl font-bold font-sans text-gray-800">Modul Terkunci</h2>
        <p className="text-gray-500 font-sans leading-relaxed">
          Anda belum bisa membuka modul <strong>{moduleData.title}</strong>. Selesaikan semua modul di level sebelumnya terlebih dahulu untuk membuka akses.
        </p>
        <Link href="/dashboard" passHref>
          <Button className="bg-[#16A34A] hover:bg-green-700 text-white font-sans mt-2">
            Kembali ke Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Command disalin ke clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCompleteModule = async (
    gainedPoints: number,
    updatedAttempts: Record<string, { attemptCount: number; isCorrect: boolean; usedHint: boolean }>
  ) => {
    // Refresh progress state from server
    await fetchModuleProgress();
    
    // Also notify navbar to update points
    window.dispatchEvent(new Event("points-updated"));

    setIsCompletedThisSession(true);

    if (gainedPoints > 0) {
      toast.success(`Modul selesai! Anda mendapatkan +${gainedPoints} poin.`);
    } else {
      toast.info("Modul diselesaikan!");
    }
  };

  // Find next module link
  const activeModuleIndex = modules.findIndex((m) => m.moduleId === moduleId);
  const nextModuleData = activeModuleIndex !== -1 && activeModuleIndex < modules.length - 1 
    ? modules[activeModuleIndex + 1] 
    : null;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
      {/* Back to dashboard & Navigation */}
      <div className="flex justify-between items-center">
        <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800 font-medium font-sans gap-1.5 transition-colors">
          <ArrowLeft size={16} />
          <span>Kembali ke Dashboard</span>
        </Link>
        <div className="flex items-center space-x-2">
          <Badge className="bg-[#16A34A]/10 text-[#16A34A] border-none font-sans">
            Level {moduleData.level}
          </Badge>
          {isCompleted && (
            <Badge className="bg-green-600 text-white border-none font-sans flex items-center gap-1">
              <CheckCircle size={12} />
              Selesai
            </Badge>
          )}
        </div>
      </div>

      {/* Grid Workspace */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Theory & Documentation */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-[#E5E7EB] shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl font-bold font-sans text-gray-800">
                    {moduleData.title}
                  </CardTitle>
                  <CardDescription className="text-gray-500 font-sans text-xs mt-1">
                    Materi dan dokumentasi command line Linux
                  </CardDescription>
                </div>
                <BookOpen className="h-5 w-5 text-[#16A34A]" />
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              {/* Pengertian & Kepanjangan */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 font-sans">
                  Pengertian
                </h3>
                <p className="text-sm leading-relaxed text-gray-600 font-sans">
                  {moduleData.summary}
                </p>
                {moduleData.commandMeaning && (
                  <p className="text-xs text-[#F97316] font-sans font-medium bg-orange-50/40 border border-orange-100/50 rounded px-2.5 py-1 inline-block">
                    Arti Singkatan: <strong className="font-mono">{moduleData.commandMeaning}</strong>
                  </p>
                )}
              </div>

              {/* Format / Syntax */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 font-sans">
                  Format Command
                </h3>
                <div className="bg-[#1e1e2e] text-[#a6e3a1] font-mono text-xs rounded-lg p-3 border border-[#313244] whitespace-pre-wrap select-all">
                  {moduleData.syntax}
                </div>
              </div>

              {/* Contoh Command */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 font-sans">
                  Contoh Penggunaan
                </h3>
                <div className="space-y-2">
                  {moduleData.examples.map((ex, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2.5 rounded border border-gray-100 hover:bg-gray-100/50 transition-colors">
                      <code className="text-xs font-mono text-gray-700 font-bold select-all">{ex}</code>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleCopy(ex, index)}
                        className="h-7 w-7 text-gray-400 hover:text-[#16A34A]"
                        title="Salin Command"
                      >
                        {copiedIndex === index ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Catatan Penting / Warnings */}
              {moduleData.notes && moduleData.notes.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 font-sans">
                    Catatan Penting
                  </h3>
                  <div className="space-y-2">
                    {moduleData.notes.map((note, index) => (
                      <div key={index} className="text-xs text-gray-500 leading-relaxed font-sans list-disc list-inside bg-gray-50/40 p-2 border border-gray-100 rounded">
                        {note}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dangerous or Admin Alerts */}
          {moduleData.isDangerous && (
            <Alert variant="destructive" className="border-red-200 bg-red-50/30 text-[#DC2626]">
              <AlertCircle className="h-4 w-4 text-[#DC2626]" />
              <AlertTitle className="font-bold font-sans">Peringatan Bahaya!</AlertTitle>
              <AlertDescription className="font-sans text-xs mt-1 text-red-700 leading-relaxed">
                Command ini bersifat merusak dan tidak bisa dibatalkan di sistem Linux asli. Gunakan dengan penuh tanggung jawab dan pastikan target folder/file sudah benar sebelum menekan Enter.
              </AlertDescription>
            </Alert>
          )}

          {moduleData.requiresAdmin && (
            <Alert className="border-blue-200 bg-blue-50/30 text-blue-800">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertTitle className="font-bold font-sans">Memerlukan Hak Admin</AlertTitle>
              <AlertDescription className="font-sans text-xs mt-1 text-blue-700 leading-relaxed">
                Perintah ini membutuhkan akses administrator/super user pada Linux nyata (biasanya diawali command <code className="font-mono bg-blue-100 px-1 rounded text-blue-800">sudo</code>).
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Right Column: Latihan / Quiz Work Area */}
        <div className="lg:col-span-7 space-y-6">
          <ExercisePanel
            moduleId={moduleData.moduleId}
            exerciseIds={moduleData.exerciseIds}
            onComplete={handleCompleteModule}
            savedAttempts={progress.exerciseAttempts}
          />

          {/* Module Success & Continuation */}
          {(isCompleted || isCompletedThisSession) && (
            <Card className="border-green-200 bg-green-50/15 shadow-sm text-gray-800 animate-fadeIn">
              <CardContent className="py-5 px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3 text-center sm:text-left">
                  <div className="bg-[#16A34A]/10 p-2 rounded-full text-[#16A34A]">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold font-sans text-sm text-gray-800">Modul Selesai Dilatih!</h4>
                    <p className="text-xs font-sans text-gray-500">
                      Anda telah berhasil menyelesaikan latihan modul ini.
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3 w-full sm:w-auto">
                  {nextModuleData ? (
                    <Link href={`/modul/${nextModuleData.moduleId}`} className="w-full sm:w-auto">
                      <Button className="w-full bg-[#16A34A] hover:bg-green-700 text-white font-sans text-xs py-5 px-4 h-auto font-semibold gap-1">
                        <span>Lanjut ke Modul: {nextModuleData.command}</span>
                        <ArrowRight size={14} />
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/progress" className="w-full sm:w-auto">
                      <Button className="w-full bg-[#F97316] hover:bg-orange-600 text-white font-sans text-xs py-5 px-4 h-auto font-semibold gap-1">
                        <span>Lihat Pencapaian & Progress</span>
                        <ChevronRight size={14} />
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
