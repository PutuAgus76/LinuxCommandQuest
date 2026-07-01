"use client";

import React, { useState, useEffect } from "react";
import { Exercise } from "@/types";
import { exercises as allExercises } from "@/data/exercises";
import { getClientToken, getLinuxUsername, setLinuxUsername } from "@/lib/clientAuth";
import { TerminalInput } from "../terminal/terminal-input";
import type { ValidationStatus, TerminalEntry } from "../terminal/terminal-input";
import { parseApiResponse } from "@/lib/apiHelper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Swal from "sweetalert2";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowRight, Eye, Trophy, HelpCircle } from "lucide-react";

interface ExercisePanelProps {
  moduleId: string;
  exerciseIds: string[];
  onComplete: (
    gainedPoints: number,
    completedExercises: Record<
      string,
      { attemptCount: number; isCorrect: boolean; usedHint: boolean }
    >
  ) => void;
  savedAttempts?: Record<
    string,
    { attemptCount: number; isCorrect: boolean; usedHint: boolean }
  >;
}

export function ExercisePanel({
  moduleId,
  exerciseIds,
  onComplete,
  savedAttempts = {}
}: ExercisePanelProps) {
  const moduleExercises = allExercises.filter((ex) => exerciseIds.includes(ex.exerciseId));
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [attemptCount, setAttemptCount] = useState(0);
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>(null);
  const [usedHint, setUsedHint] = useState(false);
  const [showHintDialog, setShowHintDialog] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<TerminalEntry[]>([]);
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [cwd, setCwd] = useState<string>("~");
  const [username, setUsername] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Track status of all exercises in this module
  const [sessionResults, setSessionResults] = useState<
    Record<string, { attemptCount: number; isCorrect: boolean; usedHint: boolean }>
  >({})

  const activeExercise = moduleExercises[currentIdx];

  // Initialize terminal session — reuse existing shared session
  useEffect(() => {
    async function initSession() {
      try {
        const token = getClientToken();
        
        // 1. Sync Profile — get authoritative linux_username from Supabase
        const syncRes = await fetch("/api/profile/sync", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        
        const syncData = await parseApiResponse(syncRes);
        const uname: string = syncData.profile?.linux_username || getLinuxUsername();
        setUsername(uname);
        setLinuxUsername(uname);

        // 2. Get or reuse shared terminal session (persistent CWD across modules)
        const sessionRes = await fetch("/api/terminal/session", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        const { session } = await parseApiResponse(sessionRes);
        setSessionId(session.id);
        // Restore persisted CWD from session
        if (session.current_path) {
          setCwd(session.current_path);
        }
      } catch (err) {
        console.error("Failed to initialize session:", err);
        setUsername(getLinuxUsername());
      }
    }
    initSession();
  }, []);

  // Reset or load state when exercise index changes
  useEffect(() => {
    if (!activeExercise) return;
    
    const saved = savedAttempts[activeExercise.exerciseId];
    if (saved && saved.isCorrect) {
      setValidationStatus("correct");
      setUsedHint(saved.usedHint);
      setAttemptCount(saved.attemptCount);
      setTerminalHistory([
        {
          command: activeExercise.acceptedAnswers[0],
          output: "",
          status: "success",
          cwdBefore: "~",
          cwdAfter: "~"
        }
      ]);
    } else {
      setValidationStatus(null);
      setUsedHint(false);
      setAttemptCount(0);
      setInputValue("");
      setTerminalHistory([]);
    }
  }, [currentIdx, moduleId]);

  if (moduleExercises.length === 0) {
    return (
      <Card className="border-green-100 bg-green-50/20">
        <CardContent className="py-6 text-center text-muted-foreground">
          Tidak ada latihan untuk modul ini. Anda dapat langsung melanjutkan.
          <Button
            onClick={() => onComplete(0, {})}
            className="mt-4 bg-[#16A34A] hover:bg-green-700 text-white"
          >
            Selesaikan Modul <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async () => {
    if (!activeExercise || validationStatus === "correct" || !sessionId || loading) return;

    const nextAttemptCount = attemptCount + 1;
    setAttemptCount(nextAttemptCount);
    setLoading(true);

    try {
      const token = getClientToken();
      const formatPromptPath = (fullPath: string, user: string) => {
        const homePrefix = `/home/${user}`;
        if (fullPath.startsWith(homePrefix)) {
          return "~" + fullPath.substring(homePrefix.length);
        }
        return fullPath;
      };

      const getActivePrompt = (pathStr: string) => {
        if (moduleId === "vim") {
          if (activeExercise.exerciseId === "ex-vim-02") return "[VIM - NORMAL MODE] --";
          if (activeExercise.exerciseId === "ex-vim-03") return "[VIM - INSERT MODE] --";
          if (
            activeExercise.exerciseId === "ex-vim-04" ||
            activeExercise.exerciseId === "ex-vim-05" ||
            activeExercise.exerciseId === "ex-vim-06"
          ) {
            return "[VIM - COMMAND MODE] :";
          }
        }
        return `${username}@linux-quest:${formatPromptPath(pathStr, username)}$`;
      };

      const cwdBefore = getActivePrompt(cwd);

      const res = await fetch("/api/course/submit-exercise", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sessionId,
          exerciseId: activeExercise.exerciseId,
          command: inputValue,
          usedHint: !!usedHint
        })
      });

      const data = await parseApiResponse(res);

      if (data.cwd) {
        setCwd(data.cwd);
      }

      const status: ValidationStatus = data.validationStatus;
      setValidationStatus(status);

      // Append shell result to terminal transcript history (standard Unix behaviour)
      setTerminalHistory((prev) => [
        ...prev,
        {
          command: inputValue,
          output: data.output,
          status: data.executeStatus,
          cwdBefore,
          cwdAfter: getActivePrompt(data.cwd || cwd),
        }
      ]);

      if (status === "correct") {
        window.dispatchEvent(new Event("points-updated"));
        
        const finalMsg = usedHint
          ? "Command benar, latihan selesai. Poin 0 karena jawaban sudah ditampilkan."
          : `✓ ${data.message} ${activeExercise.explanation}`;

        // SweetAlert2 Success Toast
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Jawaban benar!",
          text: finalMsg,
          showConfirmButton: false,
          timer: 2200,
          timerProgressBar: true,
        });

        const nextResults = {
          ...sessionResults,
          [activeExercise.exerciseId]: {
            attemptCount: nextAttemptCount,
            isCorrect: true,
            usedHint,
          }
        };
        setSessionResults(nextResults);

        // Clear input value on success
        setInputValue("");

        // Check if this is the last exercise in the module
        const isLastExercise = currentIdx === moduleExercises.length - 1;
        if (isLastExercise) {
          setTimeout(() => {
            Swal.fire({
              icon: "success",
              title: "Modul selesai!",
              text: "Selamat, kamu berhasil menyelesaikan latihan ini.",
              confirmButtonText: "Lanjutkan",
              allowOutsideClick: false,
            }).then(() => {
              handleNext(nextResults);
            });
          }, 2400);
        }

      } else if (status === "near_miss") {
        // SweetAlert2 Warning Toast
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "warning",
          title: "Hampir benar",
          text: data.message || "Terdapat sedikit kesalahan pada jawaban Anda.",
          showConfirmButton: false,
          timer: 3500,
          timerProgressBar: true,
        });

      } else {
        let errorMsg = data.message || "Command kurang tepat.";
        if (data.output && data.executeStatus === "error") {
          errorMsg = `Shell: ${data.output}\n${errorMsg}`;
        }

        // SweetAlert2 Error Toast
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title: "Jawaban belum tepat",
          text: errorMsg,
          showConfirmButton: false,
          timer: 3500,
          timerProgressBar: true,
        });
      }
    } catch (error) {
      console.error("Verification failed:", error);
      setValidationStatus("incorrect");
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Koneksi gagal",
        text: "Terjadi kesalahan koneksi ke server.",
        showConfirmButton: false,
        timer: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRevealAnswer = () => {
    setUsedHint(true);
    setShowHintDialog(false);
  };

  const handleNext = (finalResultsOverride?: Record<string, { attemptCount: number; isCorrect: boolean; usedHint: boolean }>) => {
    if (currentIdx < moduleExercises.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      // Calculate total points gained in this session
      // Only gain points if the exercise is solved without hint and wasn't already completed
      let totalGainedPoints = 0;
      
      const mergedResults = { ...savedAttempts, ...sessionResults, ...finalResultsOverride };

      moduleExercises.forEach((ex) => {
        const result = mergedResults[ex.exerciseId];
        const previouslyCompleted = savedAttempts[ex.exerciseId]?.isCorrect;
        
        if (result && result.isCorrect && !previouslyCompleted) {
          if (result.usedHint) {
            // Apply hint penalty multiplier
            const multiplier = ex.hintPenaltyMultiplier ?? 0;
            totalGainedPoints += Math.round(ex.points * multiplier);
          } else {
            totalGainedPoints += ex.points;
          }
        }
      });

      onComplete(totalGainedPoints, mergedResults);
    }
  };

  return (
    <Card className="border-[#E5E7EB] shadow-md overflow-hidden bg-white">
      <CardHeader className="bg-[#FAFAFA] border-b border-[#E5E7EB]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-[#F97316]" />
            <CardTitle className="text-lg text-gray-800">Latihan Interaktif</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 font-sans border-gray-200">
            Latihan {currentIdx + 1} dari {moduleExercises.length}
          </Badge>
        </div>
        <CardDescription className="text-gray-500 mt-1 select-none">
          Ketikkan perintah terminal Linux yang tepat untuk menjawab soal di bawah.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-4">
        {/* Soal */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1 select-none">
            Instruksi Soal:
          </div>
          <p className="text-[#374151] font-medium leading-relaxed">
            {activeExercise.question}
          </p>
        </div>

        {/* Terminal Simulator */}
        <TerminalInput
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSubmit}
          disabled={loading || validationStatus === "correct"}
          placeholder={
            moduleId === "vim"
              ? "Ketik tombol/command Vim di sini..."
              : loading
              ? "Memproses command..."
              : "Ketik command Anda di sini..."
          }
          history={terminalHistory}
          cwd={cwd}
          username={username}
          vimMode={moduleId === "vim"}
          vimSubMode={
            activeExercise.exerciseId === "ex-vim-01" ? "SHELL" :
            activeExercise.exerciseId === "ex-vim-02" ? "NORMAL" :
            activeExercise.exerciseId === "ex-vim-03" ? "INSERT" :
            activeExercise.exerciseId === "ex-vim-04" ||
            activeExercise.exerciseId === "ex-vim-05" ||
            activeExercise.exerciseId === "ex-vim-06"
              ? "COMMAND"
              : "SHELL"
          }
        />

        {/* Hint Box (Only shown if usedHint is true) */}
        {usedHint && (
          <div className="bg-[#F97316]/10 border border-[#F97316]/30 rounded-lg p-4 space-y-2 select-text mt-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#F97316] flex items-center gap-1.5 font-sans select-none">
              <Eye size={14} />
              <span>Petunjuk Jawaban (Poin Latihan Ini: 0)</span>
            </div>
            <p className="text-sm font-mono bg-white text-gray-800 border border-gray-200 rounded p-2.5 font-semibold break-all">
              {activeExercise.acceptedAnswers[0]}
            </p>
            <p className="text-xs text-gray-500 font-sans leading-relaxed select-none">
              Silakan ketik perintah di atas persis ke dalam simulator terminal lalu submit untuk menyelesaikannya.
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="bg-[#FAFAFA] border-t border-[#E5E7EB] py-4 flex items-center justify-between">
        <div>
          {attemptCount >= activeExercise.maxAttemptsBeforeHint && validationStatus !== "correct" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowHintDialog(true)}
              className="text-[#F97316] border-[#F97316]/30 hover:bg-[#F97316]/10 font-sans gap-1.5"
            >
              <Eye size={15} />
              Lihat Jawaban
            </Button>
          )}
        </div>

        <div className="flex space-x-2">
          {validationStatus !== "correct" ? (
            <Button
              onClick={handleSubmit}
              disabled={!inputValue.trim() || loading}
              className="bg-[#16A34A] hover:bg-[#15803d] text-white font-sans px-5"
            >
              {loading ? "Memproses..." : "Submit Command"}
            </Button>
          ) : (
            <Button
              onClick={() => handleNext()}
              className="bg-[#16A34A] hover:bg-[#15803d] text-white font-sans px-5 gap-1.5 animate-bounce-subtle"
            >
              <span>
                {currentIdx < moduleExercises.length - 1 ? "Latihan Berikutnya" : "Selesaikan Modul"}
              </span>
              <ArrowRight size={16} />
            </Button>
          )}
        </div>
      </CardFooter>

      {/* Hint Dialog */}
      <Dialog open={showHintDialog} onOpenChange={setShowHintDialog}>
        <DialogContent className="max-w-md bg-white border-[#E5E7EB] text-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#F97316] font-sans">
              <HelpCircle className="h-5 w-5" />
              Butuh bantuan?
            </DialogTitle>
            <DialogDescription className="text-gray-500 font-sans">
              Melihat jawaban akan menandai latihan ini sebagai "dibantu".
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 px-1 space-y-3">
            <p className="text-sm leading-relaxed text-gray-600">
              Anda tidak akan mendapatkan poin penuh ({activeExercise.points} poin) untuk latihan ini. Poin yang akan Anda dapatkan adalah <strong>0 poin</strong>.
            </p>
            <p className="text-sm font-semibold text-gray-700">
              Apakah Anda ingin melihat jawaban yang benar?
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowHintDialog(false)}
              className="border-gray-200 text-gray-700 font-sans hover:bg-gray-50"
            >
              Kembali Mencoba
            </Button>
            <Button
              onClick={handleRevealAnswer}
              className="bg-[#F97316] hover:bg-orange-600 text-white font-sans"
            >
              Ya, Lihat Jawaban
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
