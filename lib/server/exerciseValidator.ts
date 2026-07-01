import { supabaseAdmin } from "./supabaseAdmin";
import { resolvePath, getFullPath } from "../fs/pathResolver";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ValidationStatus = "correct" | "near_miss" | "incorrect";

export interface ValidationResult {
  isCorrect: boolean;
  status: ValidationStatus;
  feedback: string;
  debug?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ok(feedback: string, debug?: Record<string, unknown>): ValidationResult {
  return { isCorrect: true, status: "correct", feedback, debug };
}

function nearMiss(feedback: string, debug?: Record<string, unknown>): ValidationResult {
  return { isCorrect: false, status: "near_miss", feedback, debug };
}

function fail(feedback: string, debug?: Record<string, unknown>): ValidationResult {
  return { isCorrect: false, status: "incorrect", feedback, debug };
}

function norm(s: string) {
  return s.trim().replace(/\s+/g, " ");
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// ---------------------------------------------------------------------------
// Main validator
// ---------------------------------------------------------------------------

export async function validateDatabaseEffect(
  exerciseId: string,
  sessionId: string,
  uid: string,
  rawCommand: string = ""
): Promise<ValidationResult> {
  const { data: session } = await supabaseAdmin
    .from("terminal_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (!session) return fail("Terminal session tidak ditemukan.");

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("linux_username")
    .eq("firebase_uid", uid)
    .single();

  if (!profile) return fail("Profil pengguna tidak ditemukan.");

  const username = profile.linux_username;
  const homePath = `/home/${username}`;
  const workspaceId = session.workspace_id;
  const currentDirId = session.current_directory_id;

  const { data: history } = await supabaseAdmin
    .from("command_history")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(10);

  const lastCmd = history && history.length > 0 ? norm(history[0].command) : "";
  const lastStatus = history && history.length > 0 ? history[0].status : "error";

  const currentPath = await getFullPath(currentDirId, workspaceId);
  const normalizedInput = norm(rawCommand);

  const debugBase = {
    exerciseId,
    sessionId,
    uid,
    rawCommand: normalizedInput,
    currentPath,
    lastCmd,
    lastStatus,
  };

  switch (exerciseId) {

    // ──────────────────── LEVEL 1 — NAVIGASI & FOLDER ────────────────────────

    case "ex-pwd-01": {
      if (lastCmd === "pwd" && lastStatus === "success") {
        return ok("Command 'pwd' berhasil dijalankan.", debugBase);
      }
      if (/^pwd/.test(normalizedInput)) {
        return ok("Command 'pwd' berhasil dijalankan.", debugBase);
      }
      return fail("Belum menjalankan perintah 'pwd'. Ketik: pwd", debugBase);
    }

    case "ex-mkdir-01": {
      const { node } = await resolvePath(workspaceId, currentDirId, `${homePath}/latihan`, uid, username);
      if (node && node.type === "directory") {
        return ok("Folder 'latihan' berhasil dibuat.", debugBase);
      }
      return fail("Folder 'latihan' belum ditemukan. Jalankan: mkdir latihan", debugBase);
    }

    case "ex-mkdir-02": {
      const { node } = await resolvePath(workspaceId, currentDirId, `${homePath}/sekolah`, uid, username);
      if (node && node.type === "directory") {
        return ok("Folder 'sekolah' berhasil dibuat.", debugBase);
      }
      return fail("Folder 'sekolah' belum ditemukan. Jalankan: mkdir sekolah", debugBase);
    }

    case "ex-ls-01": {
      if (/^ls($|\s)/.test(lastCmd) && lastStatus === "success") {
        return ok("Command 'ls' berhasil dijalankan.", debugBase);
      }
      if (/^ls/.test(normalizedInput) && lastStatus === "success") {
        return ok("Command 'ls' berhasil dijalankan.", debugBase);
      }
      return fail("Belum menjalankan perintah 'ls'. Ketik: ls", debugBase);
    }

    case "ex-ls-02": {
      if (/^ls\s+-l/.test(lastCmd) && lastStatus === "success") {
        return ok("Command 'ls -l' berhasil dijalankan.", debugBase);
      }
      if (/^ls\s+-l/.test(normalizedInput) && lastStatus === "success") {
        return ok("Command 'ls -l' berhasil dijalankan.", debugBase);
      }
      return fail("Belum menjalankan perintah 'ls -l'. Ketik: ls -l", debugBase);
    }

    case "ex-ls-03": {
      if (/^ls\s+-a/.test(lastCmd) && lastStatus === "success") {
        return ok("Command 'ls -a' berhasil dijalankan.", debugBase);
      }
      if (/^ls\s+-a/.test(normalizedInput) && lastStatus === "success") {
        return ok("Command 'ls -a' berhasil dijalankan.", debugBase);
      }
      return fail("Belum menjalankan perintah 'ls -a'. Ketik: ls -a", debugBase);
    }

    case "ex-cd-01": {
      if (currentPath === `${homePath}/latihan`) {
        return ok("Berhasil masuk ke folder 'latihan'.", debugBase);
      }
      return fail("Kamu belum masuk ke folder 'latihan'. Jalankan: cd latihan", debugBase);
    }

    case "ex-cd-02": {
      if (currentPath === homePath) {
        return ok("Berhasil kembali ke home directory.", debugBase);
      }
      return fail("Kamu belum kembali ke home directory. Jalankan: cd ~", debugBase);
    }

    case "ex-cd-03": {
      if (currentPath === `${homePath}/sekolah`) {
        return ok("Berhasil masuk ke folder 'sekolah'.", debugBase);
      }
      return fail("Kamu belum masuk ke folder 'sekolah'. Jalankan: cd sekolah", debugBase);
    }

    case "ex-cd-04": {
      const { node } = await resolvePath(workspaceId, currentDirId, `${homePath}/sekolah/kelas`, uid, username);
      if (node && node.type === "directory") {
        return ok("Folder 'kelas' berhasil dibuat di dalam folder 'sekolah'.", debugBase);
      }
      return fail("Folder 'kelas' belum dibuat. Masuk ke folder 'sekolah' terlebih dahulu, lalu jalankan: mkdir kelas", debugBase);
    }

    case "ex-cd-05": {
      if (currentPath === `${homePath}/sekolah/kelas`) {
        return ok("Berhasil masuk ke folder 'kelas'.", debugBase);
      }
      return fail("Kamu belum masuk ke folder 'kelas'. Jalankan: cd kelas", debugBase);
    }

    case "ex-cd-06": {
      const { node } = await resolvePath(workspaceId, currentDirId, `${homePath}/sekolah/kelas/tugas`, uid, username);
      if (node && node.type === "directory") {
        return ok("Folder 'tugas' berhasil dibuat di dalam folder 'kelas'.", debugBase);
      }
      return fail("Folder 'tugas' belum dibuat. Masuk ke folder 'kelas' terlebih dahulu, lalu jalankan: mkdir tugas", debugBase);
    }

    case "ex-cd-07": {
      if (currentPath === `${homePath}/sekolah/kelas/tugas`) {
        return ok("Berhasil masuk ke folder 'tugas'.", debugBase);
      }
      return fail("Kamu belum masuk ke folder 'tugas'. Jalankan: cd tugas", debugBase);
    }

    case "ex-cd-08": {
      if (currentPath === `${homePath}/sekolah/kelas`) {
        return ok("Berhasil kembali ke folder 'kelas' (satu tingkat di atas).", debugBase);
      }
      return fail("Kamu belum kembali satu folder ke atas. Jalankan: cd ..", debugBase);
    }

    case "ex-cd-09": {
      if (currentPath === homePath) {
        return ok("Berhasil kembali ke home directory.", debugBase);
      }
      return fail("Kamu belum kembali ke home directory. Jalankan: cd ~", debugBase);
    }

    case "ex-cd-10": {
      if (currentPath === `${homePath}/sekolah/kelas/tugas`) {
        return ok("Luar biasa! Berhasil masuk langsung ke folder bertingkat 'sekolah/kelas/tugas'.", debugBase);
      }
      return fail("Kamu belum masuk langsung ke folder bertingkat. Dari home directory, jalankan: cd sekolah/kelas/tugas", debugBase);
    }

    // ──────────────────── LEVEL 2 — FILE DASAR ───────────────────────────────

    case "ex-touch-01": {
      const { node } = await resolvePath(workspaceId, currentDirId, `${homePath}/latihan/catatan.txt`, uid, username);
      if (node && node.type === "file") {
        return ok("File 'catatan.txt' berhasil dibuat di folder 'latihan'.", debugBase);
      }
      if (currentPath !== `${homePath}/latihan`) {
        return nearMiss("Pastikan kamu masuk ke folder 'latihan' dengan 'cd latihan' terlebih dahulu, baru jalankan 'touch catatan.txt'.", debugBase);
      }
      return fail("File 'catatan.txt' belum dibuat. Jalankan: touch catatan.txt", debugBase);
    }

    case "ex-touch-02": {
      const { node } = await resolvePath(workspaceId, currentDirId, `${homePath}/latihan/data.doc`, uid, username);
      if (node && node.type === "file") {
        return ok("File 'data.doc' berhasil dibuat.", debugBase);
      }
      return fail("File 'data.doc' belum dibuat. Jalankan: touch data.doc", debugBase);
    }

    case "ex-touch-03": {
      const { node } = await resolvePath(workspaceId, currentDirId, `${homePath}/latihan/index.html`, uid, username);
      if (node && node.type === "file") {
        return ok("File 'index.html' berhasil dibuat.", debugBase);
      }
      return fail("File 'index.html' belum dibuat. Jalankan: touch index.html", debugBase);
    }

    case "ex-echo-01": {
      const { node } = await resolvePath(workspaceId, currentDirId, `${homePath}/latihan/catatan.txt`, uid, username);
      const targetText = "Saya belajar Linux";
      if (node && node.type === "file") {
        const content = (node.content || "").trim();
        if (content === targetText) {
          if (/>>/.test(normalizedInput)) {
            return nearMiss(`Hampir benar. Kamu menggunakan '>>' (append) padahal instruksi meminta '>' (overwrite).`, debugBase);
          }
          return ok(`Isi file cocok: "${content}".`, debugBase);
        }
        if (content.toLowerCase() === targetText.toLowerCase()) {
          return nearMiss(`Perhatikan huruf kapital: seharusnya "${targetText}" (huruf 'L' kapital).`, debugBase);
        }
        if (levenshtein(content, targetText) <= 4) {
          return nearMiss(`Teks mendekati. Yang ditulis: "${content}". Seharusnya: "${targetText}".`, debugBase);
        }
      }
      return fail(`Isi file 'catatan.txt' tidak sesuai. Jalankan: echo "${targetText}" > catatan.txt`, debugBase);
    }

    case "ex-echo-02": {
      const { node } = await resolvePath(workspaceId, currentDirId, `${homePath}/latihan/index.html`, uid, username);
      const targetText = "<h1>Halo Linux</h1>";
      if (node && node.type === "file") {
        const content = (node.content || "").trim();
        if (content === targetText) {
          return ok("Isi index.html berhasil ditulis.", debugBase);
        }
      }
      return fail(`Isi file 'index.html' tidak sesuai. Jalankan: echo "${targetText}" > index.html`, debugBase);
    }

    case "ex-echo-03": {
      const { node } = await resolvePath(workspaceId, currentDirId, `${homePath}/latihan/catatan.txt`, uid, username);
      const targetText = "Materi command dasar";
      if (node && node.type === "file") {
        const content = (node.content || "").trim();
        if (content === targetText) {
          return ok("Isi file 'catatan.txt' berhasil ditimpa.", debugBase);
        }
      }
      return fail(`Isi file 'catatan.txt' tidak sesuai. Jalankan: echo "${targetText}" > catatan.txt`, debugBase);
    }

    case "ex-cat-01": {
      if (/^cat\s+catatan\.txt/.test(lastCmd) && lastStatus === "success") {
        return ok("Isi file 'catatan.txt' berhasil dicetak ke terminal.", debugBase);
      }
      if (/^cat\s+catatan\.txt/.test(normalizedInput) && lastStatus === "success") {
        return ok("Isi file 'catatan.txt' berhasil dicetak ke terminal.", debugBase);
      }
      return fail("Belum menampilkan isi file. Jalankan: cat catatan.txt", debugBase);
    }

    case "ex-cat-02": {
      if (/^cat\s+index\.html/.test(lastCmd) && lastStatus === "success") {
        return ok("Isi file 'index.html' berhasil dicetak ke terminal.", debugBase);
      }
      if (/^cat\s+index\.html/.test(normalizedInput) && lastStatus === "success") {
        return ok("Isi file 'index.html' berhasil dicetak ke terminal.", debugBase);
      }
      return fail("Belum menampilkan isi file. Jalankan: cat index.html", debugBase);
    }

    case "ex-echo-append-01": {
      const { node } = await resolvePath(workspaceId, currentDirId, `${homePath}/latihan/catatan.txt`, uid, username);
      const expectedEnd = "Baris baru";
      if (node && node.type === "file") {
        const content = (node.content || "").trim().replace(/\r\n/g, "\n");
        if (content.endsWith(expectedEnd)) {
          return ok("Teks berhasil ditambahkan di akhir file.", debugBase);
        }
        if (content === expectedEnd) {
          return nearMiss("Kamu menimpa file (>) alih-alih menambahkan (>>). Ulangi langkah kuis sebelumnya.", debugBase);
        }
      }
      return fail(`Jalankan: echo "${expectedEnd}" >> catatan.txt`, debugBase);
    }

    case "ex-echo-append-02": {
      const { node } = await resolvePath(workspaceId, currentDirId, `${homePath}/latihan/catatan.txt`, uid, username);
      const expectedEnd = "Selesai belajar";
      if (node && node.type === "file") {
        const content = (node.content || "").trim().replace(/\r\n/g, "\n");
        if (content.endsWith(expectedEnd)) {
          return ok("Teks berhasil ditambahkan ke baris paling bawah.", debugBase);
        }
      }
      return fail(`Jalankan: echo "${expectedEnd}" >> catatan.txt`, debugBase);
    }

    // ──────────────────── LEVEL 3 — MANAJEMEN FILE ───────────────────────────

    case "ex-cp-01": {
      const { node } = await resolvePath(workspaceId, currentDirId, `${homePath}/latihan/backup.txt`, uid, username);
      if (node && node.type === "file") {
        return ok("Berkas 'backup.txt' berhasil disalin.", debugBase);
      }
      return fail("File 'backup.txt' belum ditemukan. Jalankan: cp catatan.txt backup.txt", debugBase);
    }

    case "ex-cp-02": {
      const { node } = await resolvePath(workspaceId, currentDirId, `${homePath}/latihan/index-backup.html`, uid, username);
      if (node && node.type === "file") {
        return ok("Berkas 'index-backup.html' berhasil disalin.", debugBase);
      }
      return fail("File 'index-backup.html' belum ditemukan. Jalankan: cp index.html index-backup.html", debugBase);
    }

    case "ex-mv-01": {
      const { node: salinan } = await resolvePath(workspaceId, currentDirId, `${homePath}/latihan/salinan.txt`, uid, username);
      const { node: backup } = await resolvePath(workspaceId, currentDirId, `${homePath}/latihan/backup.txt`, uid, username);
      if (salinan && !backup) {
        return ok("File 'backup.txt' berhasil di-rename menjadi 'salinan.txt'.", debugBase);
      }
      return fail("Gagal me-rename file. Jalankan: mv backup.txt salinan.txt", debugBase);
    }

    case "ex-mv-02": {
      const { node: inside } = await resolvePath(workspaceId, currentDirId, `${homePath}/latihan/arsip/salinan.txt`, uid, username);
      const { node: outside } = await resolvePath(workspaceId, currentDirId, `${homePath}/latihan/salinan.txt`, uid, username);
      if (inside && !outside) {
        return ok("File 'salinan.txt' berhasil dipindahkan ke folder 'arsip'.", debugBase);
      }
      return fail("Gagal memindahkan file. Jalankan: mv salinan.txt arsip/", debugBase);
    }

    case "ex-rm-01": {
      const { node } = await resolvePath(workspaceId, currentDirId, `${homePath}/latihan/arsip/salinan.txt`, uid, username);
      if (!node) {
        return ok("File 'salinan.txt' berhasil dihapus.", debugBase);
      }
      return fail("File 'salinan.txt' masih ada. Jalankan: rm arsip/salinan.txt", debugBase);
    }

    case "ex-rm-02": {
      const { node } = await resolvePath(workspaceId, currentDirId, `${homePath}/latihan/data.doc`, uid, username);
      if (!node) {
        return ok("File 'data.doc' berhasil dihapus.", debugBase);
      }
      return fail("File 'data.doc' masih ada. Jalankan: rm data.doc", debugBase);
    }

    case "ex-rmr-01": {
      const { node } = await resolvePath(workspaceId, currentDirId, `${homePath}/latihan/arsip`, uid, username);
      if (!node) {
        return ok("Folder 'arsip' beserta seluruh isinya berhasil dihapus.", debugBase);
      }
      if (/^rm\s+latihan\/arsip/.test(normalizedInput) && !/\s+-r/.test(normalizedInput)) {
        return nearMiss("Untuk menghapus direktori/folder, kamu wajib menyertakan flag '-r'.", debugBase);
      }
      return fail("Folder 'arsip' masih ada. Jalankan dari home: rm -r latihan/arsip", debugBase);
    }

    // ──────────────────── LEVEL 4 — VIM DASAR ────────────────────────────────

    case "ex-vim-01": {
      if (/^vim\s+catatan\.txt/.test(normalizedInput)) {
        return ok("File 'catatan.txt' berhasil dibuka menggunakan Vim.", debugBase);
      }
      return fail("Gunakan command: vim catatan.txt", debugBase);
    }

    case "ex-vim-02": {
      if (normalizedInput.toLowerCase().trim() === "i") {
        return ok("Benar! Tombol 'i' digunakan untuk masuk ke Insert Mode.", debugBase);
      }
      return fail("Jawaban salah. Tombol standar untuk masuk ke Insert Mode adalah 'i'.", debugBase);
    }

    case "ex-vim-03": {
      const ans = normalizedInput.toLowerCase().trim();
      if (ans === "esc" || ans === "escape") {
        return ok("Benar! Tombol 'Esc' digunakan untuk kembali ke Normal Mode.", debugBase);
      }
      return fail("Jawaban salah. Tombol untuk kembali ke Normal Mode adalah 'Esc'.", debugBase);
    }

    case "ex-vim-04": {
      const ans = normalizedInput.trim();
      if (ans === ":w" || ans === ":wa" || ans === "w" || ans === "wa") {
        return ok("Benar! Perintah ':w' digunakan untuk menyimpan (write) perubahan.", debugBase);
      }
      return fail("Jawaban salah. Perintah untuk menyimpan di Vim adalah ':w'.", debugBase);
    }

    case "ex-vim-05": {
      const ans = normalizedInput.trim();
      if (ans === ":wq" || ans === "wq") {
        return ok("Benar! Perintah ':wq' menyimpan perubahan sekaligus keluar dari Vim.", debugBase);
      }
      return fail("Jawaban salah. Perintah menyimpan dan keluar adalah ':wq'.", debugBase);
    }

    case "ex-vim-06": {
      const ans = normalizedInput.trim();
      if (ans === ":q!" || ans === "q!") {
        return ok("Benar! Perintah ':q!' keluar secara paksa tanpa menyimpan perubahan.", debugBase);
      }
      return fail("Jawaban salah. Perintah keluar tanpa menyimpan adalah ':q!'.", debugBase);
    }

    case "ex-vim-07": {
      const ans = normalizedInput.replace(/\s+/g, "").toLowerCase();
      if (ans === "ctrl+c" || ans === "ctrlc") {
        return ok("Benar! Kombinasi Ctrl + C menghentikan/membatalkan proses terminal yang stuck.", debugBase);
      }
      return fail("Jawaban salah. Kombinasi tombol untuk membatalkan proses adalah Ctrl + C.", debugBase);
    }

    // ──────────────────── LEVEL 5 — PERMISSION DASAR ─────────────────────────

    case "ex-lsl-01": {
      if (/^ls\s+-l/.test(normalizedInput) && lastStatus === "success") {
        return ok("Format detail 'ls -l' berhasil dijalankan.", debugBase);
      }
      return fail("Jalankan command detail listing: ls -l", debugBase);
    }

    case "ex-lsl-02": {
      const ans = normalizedInput.toLowerCase().trim();
      if (ans === "folder" || ans === "direktori" || ans === "directory") {
        return ok("Benar! Huruf 'd' di awal string permission menunjukkan tipe direktori/folder.", debugBase);
      }
      return fail("Jawaban belum tepat. Karakter 'd' menandakan folder/direktori.", debugBase);
    }

    case "ex-perm-intro-01": {
      if (normalizedInput.trim() === "6") {
        return ok("Benar! Nilai 6 diperoleh dari Read (4) + Write (2).", debugBase);
      }
      return fail("Jawaban salah. Jumlahkan nilai Read (4) dan Write (2).", debugBase);
    }

    case "ex-perm-intro-02": {
      if (normalizedInput.trim() === "7") {
        return ok("Benar! Nilai 7 diperoleh dari Read (4) + Write (2) + Execute (1).", debugBase);
      }
      return fail("Jawaban salah. Jumlahkan nilai Read (4), Write (2), dan Execute (1).", debugBase);
    }

    case "ex-chmod777-01": {
      const { node } = await resolvePath(workspaceId, currentDirId, `${homePath}/script.sh`, uid, username);
      if (node && node.mode === 777) {
        return ok("Hak akses file 'script.sh' berhasil diubah menjadi 777.", debugBase);
      }
      return fail("Jalankan command: chmod 777 script.sh", debugBase);
    }

    case "ex-chmod400-01": {
      const { node } = await resolvePath(workspaceId, currentDirId, `${homePath}/rahasia.txt`, uid, username);
      if (node && node.mode === 400) {
        return ok("Hak akses file 'rahasia.txt' berhasil dibatasi menjadi 400.", debugBase);
      }
      return fail("Jalankan command: chmod 400 rahasia.txt", debugBase);
    }

    case "ex-chmod644-01": {
      const { node } = await resolvePath(workspaceId, currentDirId, `${homePath}/index.php`, uid, username);
      if (node && node.mode === 644) {
        return ok("Hak akses file 'index.php' berhasil diubah menjadi 644.", debugBase);
      }
      return fail("Jalankan command: chmod 644 index.php", debugBase);
    }

    case "ex-chmod755-01": {
      const { node } = await resolvePath(workspaceId, currentDirId, `${homePath}/public_html`, uid, username);
      if (node && node.mode === 755) {
        return ok("Hak akses folder 'public_html' berhasil diubah menjadi 755.", debugBase);
      }
      return fail("Jalankan command: chmod 755 public_html", debugBase);
    }

    // ──────────────────── LEVEL 6 — PERMISSION LANJUTAN ──────────────────────

    case "ex-chmodsym-01": {
      const { node } = await resolvePath(workspaceId, currentDirId, `${homePath}/run.sh`, uid, username);
      if (node) {
        const modeStr = node.mode.toString().padStart(3, "0");
        const ownerDigit = parseInt(modeStr[0], 10);
        // Owner execute bit is 1. If ownerDigit & 1 is 1, then execute is set.
        if ((ownerDigit & 1) === 1) {
          return ok("Hak akses execute (x) owner berhasil ditambahkan pada 'run.sh'.", debugBase);
        }
      }
      return fail("Jalankan command: chmod u+x run.sh", debugBase);
    }

    case "ex-chmodsym-02": {
      const { node } = await resolvePath(workspaceId, currentDirId, `${homePath}/config.php`, uid, username);
      if (node) {
        const modeStr = node.mode.toString().padStart(3, "0");
        const groupDigit = parseInt(modeStr[1], 10);
        // Group write bit is 2. If groupDigit & 2 is 0, write is removed.
        if ((groupDigit & 2) === 0) {
          return ok("Hak akses write (w) group berhasil dicabut dari 'config.php'.", debugBase);
        }
      }
      return fail("Jalankan command: chmod g-w config.php", debugBase);
    }

    case "ex-chmodsym-03": {
      const { node } = await resolvePath(workspaceId, currentDirId, `${homePath}/data.json`, uid, username);
      if (node) {
        const modeStr = node.mode.toString().padStart(3, "0");
        const othersDigit = parseInt(modeStr[2], 10);
        // Others read bit is 4. If othersDigit & 4 is 0, read is removed.
        if ((othersDigit & 4) === 0) {
          return ok("Hak akses read (r) others berhasil dicabut dari 'data.json'.", debugBase);
        }
      }
      return fail("Jalankan command: chmod o-r data.json", debugBase);
    }

    case "ex-chown-01": {
      if (/^chown\s+admin\s+web\.log/.test(normalizedInput) && lastStatus === "success") {
        return ok("Pemilik file 'web.log' berhasil diubah menjadi 'admin'.", debugBase);
      }
      return fail("Jalankan command: chown admin web.log", debugBase);
    }

    case "ex-chown-02": {
      if (/^chown\s+-R\s+user:group\s+data/.test(normalizedInput) && lastStatus === "success") {
        return ok("Pemilik folder 'data' beserta isinya berhasil diubah secara rekursif.", debugBase);
      }
      if (/^chown\s+user:group\s+data/.test(normalizedInput)) {
        return nearMiss("Hampir benar. Gunakan flag '-R' agar perubahan pemilik berjalan secara rekursif.", debugBase);
      }
      return fail("Jalankan command: chown -R user:group data", debugBase);
    }

    case "ex-cpanel-01": {
      if (normalizedInput.trim() === "644") {
        return ok("Benar! 644 adalah permission standar untuk file PHP/teks website.", debugBase);
      }
      return fail("Jawaban belum tepat. Standar permission file di cPanel adalah 644.", debugBase);
    }

    case "ex-cpanel-02": {
      if (normalizedInput.trim() === "755") {
        return ok("Benar! 755 adalah permission standar untuk folder/direktori website.", debugBase);
      }
      return fail("Jawaban belum tepat. Standar permission folder di cPanel adalah 755.", debugBase);
    }

    default:
      console.log(`[exerciseValidator] No DB-effect check for ${exerciseId}, using fallback.`);
      return ok("Latihan selesai diverifikasi.", debugBase);
  }
}
