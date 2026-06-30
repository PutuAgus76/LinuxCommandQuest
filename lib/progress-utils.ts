import { Module, UserProgress } from "@/types";
import { modules } from "@/data/modules";
import { exercises } from "@/data/exercises";

/**
 * Logika Perhitungan isLocked secara Dinamis:
 * Module Level n + 1 terkunci (isLocked = true) jika ada modul di Level n yang BELUM ada di completedModuleIds.
 * Modul Level 1 selalu terbuka (isLocked = false).
 */
export function isModuleLocked(module: Module, completedModuleIds: string[]): boolean {
  if (module.level === 1) {
    return false;
  }
  
  // Ambil semua modul pada level (n - 1)
  const prevLevelModules = modules.filter((m) => m.level === module.level - 1);
  
  // Jika ada modul level sebelumnya yang belum diselesaikan, maka modul saat ini terkunci
  const allPrevCompleted = prevLevelModules.every((m) =>
    completedModuleIds.includes(m.moduleId)
  );
  
  return !allPrevCompleted;
}

/**
 * Hitung persentase progres belajar global:
 * (jumlah modul selesai / total modul) * 100
 */
export function getGlobalProgressPercentage(completedModuleIds: string[]): number {
  if (modules.length === 0) return 0;
  const percentage = (completedModuleIds.length / modules.length) * 100;
  return Math.round(percentage);
}

/**
 * Hitung persentase progres per modul berdasarkan exercise yang selesai:
 * (jumlah exercise selesai / total exercise pada modul) * 100
 */
export function getModuleProgressPercentage(moduleId: string, progress: UserProgress): number {
  const module = modules.find((m) => m.moduleId === moduleId);
  if (!module || module.exerciseIds.length === 0) return 0;
  
  const completedExercises = module.exerciseIds.filter((exId) => {
    const attempt = progress.exerciseAttempts[exId];
    return attempt && attempt.isCorrect;
  });
  
  const percentage = (completedExercises.length / module.exerciseIds.length) * 100;
  return Math.round(percentage);
}

/**
 * Hitung akurasi jawaban pengguna:
 * Persentase jawaban benar di percobaan pertama dibanding total seluruh percobaan.
 */
export function getAnswerAccuracy(progress: UserProgress): number {
  let totalAttempts = 0;
  let correctOnFirstTry = 0;
  
  Object.keys(progress.exerciseAttempts).forEach((exId) => {
    const attempt = progress.exerciseAttempts[exId];
    totalAttempts += attempt.attemptCount;
    if (attempt.isCorrect && attempt.attemptCount === 1) {
      correctOnFirstTry++;
    }
  });
  
  if (totalAttempts === 0) return 0;
  const accuracy = (correctOnFirstTry / totalAttempts) * 100;
  return Math.round(accuracy);
}

/**
 * Menilai dan mengembalikan daftar badgeId yang berhasil di-unlock berdasarkan completedModuleIds.
 */
export function evaluateUnlockedBadges(completedModuleIds: string[]): string[] {
  const unlocked: string[] = [];
  
  // 1. Terminal Beginner: Menyelesaikan seluruh modul Level 1
  const level1Modules = modules.filter((m) => m.level === 1).map((m) => m.moduleId);
  if (level1Modules.length > 0 && level1Modules.every((id) => completedModuleIds.includes(id))) {
    unlocked.push("terminal-beginner");
  }
  
  // 2. File Explorer: Menyelesaikan seluruh modul Level 2 dan 3
  const level2and3Modules = modules.filter((m) => m.level === 2 || m.level === 3).map((m) => m.moduleId);
  if (level2and3Modules.length > 0 && level2and3Modules.every((id) => completedModuleIds.includes(id))) {
    unlocked.push("file-explorer");
  }
  
  // 3. Vim Survivor: Menyelesaikan modul Level 4 (Vim)
  const level4Modules = modules.filter((m) => m.level === 4).map((m) => m.moduleId);
  if (level4Modules.length > 0 && level4Modules.every((id) => completedModuleIds.includes(id))) {
    unlocked.push("vim-survivor");
  }
  
  // 4. Permission Master: Menyelesaikan seluruh modul Level 5 s/d 9 (permission & chmod/chown)
  const permissionModules = modules.filter((m) => m.level >= 5 && m.level <= 9).map((m) => m.moduleId);
  if (permissionModules.length > 0 && permissionModules.every((id) => completedModuleIds.includes(id))) {
    unlocked.push("permission-master");
  }
  
  // 5. cPanel Ready: Menyelesaikan modul Level 10 (permission cPanel)
  const level10Modules = modules.filter((m) => m.level === 10).map((m) => m.moduleId);
  if (level10Modules.length > 0 && level10Modules.every((id) => completedModuleIds.includes(id))) {
    unlocked.push("cpanel-ready");
  }
  
  return unlocked;
}
