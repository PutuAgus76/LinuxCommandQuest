export interface Module {
  moduleId: string;          // contoh: "mkdir", "chmod-angka"
  title: string;             // judul tampilan, contoh: "Membuat Folder dengan mkdir"
  level: number;              // 1 - 10
  summary: string;            // pengertian singkat
  commandMeaning?: string;    // kepanjangan command, opsional jika tidak ada
  command: string;            // command utama, contoh: "mkdir"
  syntax: string;              // format command, contoh: "mkdir [nama_folder]"
  examples: string[];          // daftar contoh command
  notes?: string[];            // catatan penting, bisa lebih dari satu
  isDangerous?: boolean;       // true untuk command seperti "rm -r" -> tampilkan Alert destructive
  requiresAdmin?: boolean;     // true untuk command seperti "chown" -> tampilkan Alert info
  exerciseIds: string[];       // referensi ke Exercise terkait modul ini
  requiredPoints: number;      // total poin yang bisa didapat dari modul ini
  isLocked: boolean;            // status awal/default, dihitung ulang secara dinamis di runtime
}

export interface Exercise {
  exerciseId: string;              // contoh: "ex-mkdir-01"
  moduleId: string;                // relasi ke Module.moduleId
  question: string;                // pertanyaan/instruksi latihan
  acceptedAnswers: string[];       // satu atau lebih jawaban valid
  explanation: string;             // penjelasan setelah benar
  points: number;                  // poin saat dijawab benar mandiri
  maxAttemptsBeforeHint: number;   // default: 3
  hintPenaltyMultiplier?: number;  // opsional, default 0 (poin 0 jika pakai "Lihat Jawaban")
}

export interface UserProgress {
  totalPoints: number;
  completedModuleIds: string[];
  exerciseAttempts: {
    [exerciseId: string]: {
      attemptCount: number;
      isCorrect: boolean;
      usedHint: boolean;
    };
  };
  unlockedBadgeIds: string[];
  masteredCommands: string[];   // daftar command yang sudah pernah dijawab benar
  lastVisitedModuleId?: string;  // untuk fitur "Lanjutkan Belajar"
}

export interface Badge {
  badgeId: string;
  title: string;
  requirementDescription: string;
  iconName: string; // e.g., "Terminal", "Folder", "Code", "Shield", "CheckCircle"
}
