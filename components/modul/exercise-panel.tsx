"use client";

import React, { useState, useEffect } from "react";
import { Exercise } from "@/types";
import { exercises as allExercises } from "@/data/exercises";
import { validateAnswer } from "@/lib/validation";
import { TerminalInput } from "../terminal/terminal-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { CheckCircle, XCircle, ArrowRight, Eye, Trophy, HelpCircle } from "lucide-react";

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
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [usedHint, setUsedHint] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showHintDialog, setShowHintDialog] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<
    Array<{ command: string; isCorrect: boolean; explanation?: string }>
  >([]);
  
  // Track status of all exercises in this module
  const [sessionResults, setSessionResults] = useState<
    Record<string, { attemptCount: number; isCorrect: boolean; usedHint: boolean }>
  >({});

  const activeExercise = moduleExercises[currentIdx];

  // Reset or load state when exercise index changes
  useEffect(() => {
    if (!activeExercise) return;
    
    const saved = savedAttempts[activeExercise.exerciseId];
    if (saved && saved.isCorrect) {
      setIsCorrect(true);
      setUsedHint(saved.usedHint);
      setAttemptCount(saved.attemptCount);
      setFeedback(
        saved.usedHint
          ? `Selesai dengan bantuan. Jawaban yang benar: ${activeExercise.acceptedAnswers[0]}`
          : "Anda sudah menyelesaikan latihan ini sebelumnya!"
      );
      setTerminalHistory([
        {
          command: saved.usedHint ? activeExercise.acceptedAnswers[0] : activeExercise.acceptedAnswers[0],
          isCorrect: true,
          explanation: activeExercise.explanation
        }
      ]);
    } else {
      setIsCorrect(null);
      setUsedHint(false);
      setAttemptCount(0);
      setFeedback("");
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

  const handleSubmit = () => {
    if (!activeExercise || isCorrect) return;

    const nextAttemptCount = attemptCount + 1;
    setAttemptCount(nextAttemptCount);

    const isAnswerCorrect = validateAnswer(inputValue, activeExercise.acceptedAnswers);

    if (isAnswerCorrect) {
      setIsCorrect(true);
      setFeedback(`✓ Hebat! Jawaban Anda benar. ${activeExercise.explanation}`);
      setTerminalHistory((prev) => [
        ...prev,
        {
          command: inputValue,
          isCorrect: true,
          explanation: activeExercise.explanation
        }
      ]);

      const newResults = {
        ...sessionResults,
        [activeExercise.exerciseId]: {
          attemptCount: nextAttemptCount,
          isCorrect: true,
          usedHint: usedHint
        }
      };
      setSessionResults(newResults);
    } else {
      setIsCorrect(false);
      setTerminalHistory((prev) => [
        ...prev,
        {
          command: inputValue,
          isCorrect: false
        }
      ]);

      if (nextAttemptCount >= activeExercise.maxAttemptsBeforeHint) {
        setFeedback(
          `✗ Command kurang tepat. Anda telah salah ${nextAttemptCount} kali. Anda sekarang bisa menggunakan tombol "Lihat Jawaban" di bawah.`
        );
      } else {
        setFeedback(
          `✗ Command kurang tepat (Percobaan ${nextAttemptCount}/${activeExercise.maxAttemptsBeforeHint}). Periksa kembali spasi, nama file, atau huruf kapital.`
        );
      }
    }
  };

  const handleRevealAnswer = () => {
    if (!activeExercise) return;
    
    setUsedHint(true);
    setIsCorrect(true);
    const correctAnswer = activeExercise.acceptedAnswers[0];
    setInputValue(correctAnswer);
    setFeedback(`Diperlihatkan: ${correctAnswer}. Silakan salin command tersebut untuk lanjut.`);
    setTerminalHistory((prev) => [
      ...prev,
      {
        command: correctAnswer,
        isCorrect: true,
        explanation: activeExercise.explanation
      }
    ]);
    setShowHintDialog(false);

    const newResults = {
      ...sessionResults,
      [activeExercise.exerciseId]: {
        attemptCount: attemptCount,
        isCorrect: true,
        usedHint: true
      }
    };
    setSessionResults(newResults);
  };

  const handleNext = () => {
    if (currentIdx < moduleExercises.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      // Calculate total points gained in this session
      // Only gain points if the exercise is solved without hint and wasn't already completed
      let totalGainedPoints = 0;
      
      const mergedResults = { ...savedAttempts, ...sessionResults };

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
          disabled={isCorrect === true && !usedHint}
          placeholder="Ketik command Anda di sini..."
          feedback={feedback}
          isCorrect={isCorrect}
          history={terminalHistory}
        />
      </CardContent>

      <CardFooter className="bg-[#FAFAFA] border-t border-[#E5E7EB] py-4 flex items-center justify-between">
        <div>
          {attemptCount >= activeExercise.maxAttemptsBeforeHint && !isCorrect && (
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
          {!isCorrect ? (
            <Button
              onClick={handleSubmit}
              disabled={!inputValue.trim()}
              className="bg-[#16A34A] hover:bg-[#15803d] text-white font-sans px-5"
            >
              Submit Command
            </Button>
          ) : (
            <Button
              onClick={handleNext}
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
