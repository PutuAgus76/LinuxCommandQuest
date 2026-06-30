import { UserProgress } from "@/types";

const STORAGE_KEY = "linux-command-quest:progress";

export const DEFAULT_PROGRESS: UserProgress = {
  totalPoints: 0,
  completedModuleIds: [],
  exerciseAttempts: {},
  unlockedBadgeIds: [],
  masteredCommands: [],
};

export function getProgress(): UserProgress {
  if (typeof window === "undefined") {
    return DEFAULT_PROGRESS;
  }
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return DEFAULT_PROGRESS;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading progress from localStorage", error);
    return DEFAULT_PROGRESS;
  }
}

export function saveProgress(progress: UserProgress): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    // Trigger custom event so other components can listen to changes
    window.dispatchEvent(new Event("local-storage-update"));
  } catch (error) {
    console.error("Error writing progress to localStorage", error);
  }
}

export function resetProgress(): UserProgress {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new Event("local-storage-update"));
    } catch (error) {
      console.error("Error resetting progress in localStorage", error);
    }
  }
  return DEFAULT_PROGRESS;
}
