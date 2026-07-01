import { Module } from "@/types";

export const modules: Module[] = [
  // LEVEL 1 — Navigasi dan Folder
  {
    moduleId: "pwd",
    title: "Posisi Saat Ini dengan pwd",
    level: 1,
    summary: "Menampilkan lokasi folder aktif saat ini.",
    commandMeaning: "print working directory",
    command: "pwd",
    syntax: "pwd",
    examples: ["pwd"],
    notes: [
      "Berguna saat Anda tersesat di dalam folder yang dalam untuk mengetahui letak absolut folder Anda saat ini."
    ],
    exerciseIds: ["ex-pwd-01"],
    requiredPoints: 10,
    isLocked: false
  },
  {
    moduleId: "mkdir",
    title: "Membuat Folder dengan mkdir",
    level: 1,
    summary: "Membuat direktori/folder baru di Linux.",
    commandMeaning: "make directory",
    command: "mkdir",
    syntax: "mkdir [nama_folder]",
    examples: ["mkdir latihan", "mkdir sekolah"],
    notes: [
      "Nama folder sebaiknya tidak menggunakan spasi. Gunakan tanda hubung (-) atau underscore (_) jika terdiri dari beberapa kata.",
      "Linux bersifat case-sensitive. Folder 'Latihan' berbeda dengan 'latihan'."
    ],
    exerciseIds: ["ex-mkdir-01", "ex-mkdir-02"],
    requiredPoints: 20,
    isLocked: false
  },
  {
    moduleId: "ls",
    title: "Melihat Isi Folder dengan ls",
    level: 1,
    summary: "Melihat daftar file dan folder di lokasi saat ini.",
    commandMeaning: "list",
    command: "ls",
    syntax: "ls [argumen_opsional]",
    examples: ["ls", "ls -l", "ls -a"],
    notes: [
      "Secara default, 'ls' hanya menampilkan file/folder yang tidak tersembunyi (hidden).",
      "Gunakan flag '-a' untuk melihat file tersembunyi (yang diawali titik)."
    ],
    exerciseIds: ["ex-ls-01", "ex-ls-02", "ex-ls-03"],
    requiredPoints: 30,
    isLocked: false
  },
  {
    moduleId: "cd",
    title: "Pindah Folder dengan cd",
    level: 1,
    summary: "Masuk atau berpindah ke direktori lain.",
    commandMeaning: "change directory",
    command: "cd",
    syntax: "cd [path_folder]",
    examples: ["cd latihan", "cd ..", "cd ~", "cd sekolah/kelas/tugas"],
    notes: [
      "cd nama_folder untuk masuk ke folder.",
      "cd .. untuk kembali satu folder ke atas.",
      "cd ~ untuk kembali ke home.",
      "cd folder1/folder2/folder3 untuk masuk langsung ke folder bertingkat jika foldernya sudah ada."
    ],
    exerciseIds: [
      "ex-cd-01",
      "ex-cd-02",
      "ex-cd-03",
      "ex-cd-04",
      "ex-cd-05",
      "ex-cd-06",
      "ex-cd-07",
      "ex-cd-08",
      "ex-cd-09",
      "ex-cd-10"
    ],
    requiredPoints: 100,
    isLocked: false
  },

  // LEVEL 2 — File Dasar
  {
    moduleId: "touch",
    title: "Membuat File dengan touch",
    level: 2,
    summary: "Membuat file kosong baru di folder saat ini.",
    command: "touch",
    syntax: "touch [nama_file]",
    examples: ["touch catatan.txt", "touch data.doc", "touch index.html"],
    notes: [
      "Jika file sudah ada, command ini tidak akan menimpa isinya, melainkan hanya memperbarui timestamp akses file tersebut."
    ],
    exerciseIds: ["ex-touch-01", "ex-touch-02", "ex-touch-03"],
    requiredPoints: 20,
    isLocked: true
  },
  {
    moduleId: "echo-overwrite",
    title: "Menulis File dengan echo & Redirection >",
    level: 2,
    summary: "Menulis teks ke dalam file menggunakan echo dan operator pengarah overwrite.",
    command: "echo >",
    syntax: "echo \"teks\" > [nama_file]",
    examples: [
      "echo \"Saya belajar Linux\" > catatan.txt",
      "echo \"<h1>Halo Linux</h1>\" > index.html",
      "echo \"Materi command dasar\" > catatan.txt"
    ],
    notes: [
      "Operator '>' akan menulis teks dan MENIMPA (overwrite) seluruh isi lama file tersebut."
    ],
    exerciseIds: ["ex-echo-01", "ex-echo-02", "ex-echo-03"],
    requiredPoints: 20,
    isLocked: true
  },
  {
    moduleId: "cat",
    title: "Melihat Isi File dengan cat",
    level: 2,
    summary: "Menampilkan isi teks dari suatu file ke layar terminal.",
    commandMeaning: "concatenate",
    command: "cat",
    syntax: "cat [nama_file]",
    examples: ["cat catatan.txt", "cat index.html"],
    notes: [
      "Hanya cocok untuk membaca file teks pendek. Untuk file yang sangat panjang, command ini akan langsung menggulung terminal sampai baris terakhir."
    ],
    exerciseIds: ["ex-cat-01", "ex-cat-02"],
    requiredPoints: 20,
    isLocked: true
  },
  {
    moduleId: "echo-append",
    title: "Menambahkan Isi File dengan echo & Redirection >>",
    level: 2,
    summary: "Menambahkan teks ke dalam file menggunakan echo dan operator pengarah append.",
    command: "echo >>",
    syntax: "echo \"teks\" >> [nama_file]",
    examples: [
      "echo \"Baris baru\" >> catatan.txt",
      "echo \"Selesai belajar\" >> catatan.txt"
    ],
    notes: [
      "Operator '>>' akan MENAMBAHKAN (append) teks pada baris baru di akhir file tanpa menghapus isi sebelumnya."
    ],
    exerciseIds: ["ex-echo-append-01", "ex-echo-append-02"],
    requiredPoints: 20,
    isLocked: true
  },

  // LEVEL 3 — Manajemen File
  {
    moduleId: "cp",
    title: "Menyalin File dengan cp",
    level: 3,
    summary: "Menyalin (copy) file ke lokasi baru.",
    commandMeaning: "copy",
    command: "cp",
    syntax: "cp [sumber] [tujuan]",
    examples: ["cp catatan.txt backup.txt", "cp index.html index-backup.html"],
    notes: [
      "Secara default, 'cp' hanya menyalin file. Untuk menyalin folder beserta seluruh isinya, Anda harus menggunakan flag '-r' (recursive)."
    ],
    exerciseIds: ["ex-cp-01", "ex-cp-02"],
    requiredPoints: 20,
    isLocked: true
  },
  {
    moduleId: "mv",
    title: "Memindahkan / Rename dengan mv",
    level: 3,
    summary: "Memindahkan file/folder ke lokasi lain atau mengubah nama file/folder.",
    commandMeaning: "move",
    command: "mv",
    syntax: "mv [sumber] [tujuan]",
    examples: ["mv backup.txt salinan.txt", "mv salinan.txt arsip/"],
    notes: [
      "Jika tujuan adalah nama file baru, maka fungsinya adalah mengubah nama (rename).",
      "Jika tujuan adalah folder yang ada, fungsinya adalah memindahkan (move)."
    ],
    exerciseIds: ["ex-mv-01", "ex-mv-02"],
    requiredPoints: 20,
    isLocked: true
  },
  {
    moduleId: "rm",
    title: "Menghapus File dengan rm",
    level: 3,
    summary: "Menghapus file secara permanen.",
    commandMeaning: "remove",
    command: "rm",
    syntax: "rm [nama_file]",
    examples: ["rm salinan.txt", "rm data.doc"],
    notes: [
      "Hati-hati! File yang dihapus di terminal Linux tidak masuk ke Recycle Bin / Trash, melainkan langsung terhapus secara permanen."
    ],
    exerciseIds: ["ex-rm-01", "ex-rm-02"],
    requiredPoints: 20,
    isLocked: true
  },
  {
    moduleId: "rm-recursive",
    title: "Menghapus Folder dengan rm -r",
    level: 3,
    summary: "Menghapus folder beserta seluruh isinya secara rekursif.",
    commandMeaning: "remove recursive",
    command: "rm -r",
    syntax: "rm -r [nama_folder]",
    examples: ["rm -r arsip", "rm -rf latihan"],
    notes: [
      "Peringatan Keras! Command 'rm -r' atau 'rm -rf' sangat berbahaya jika salah menentukan target folder.",
      "Gunakan selalu dengan ekstra teliti. Sekali terhapus, data tidak bisa dikembalikan sama sekali."
    ],
    isDangerous: true,
    exerciseIds: ["ex-rmr-01"],
    requiredPoints: 15,
    isLocked: true
  },

  // LEVEL 4 — Vim Dasar
  {
    moduleId: "vim",
    title: "Mengedit File dengan Vim",
    level: 4,
    summary: "Membuka dan mengedit file teks langsung di dalam terminal menggunakan text editor Vim.",
    command: "vim",
    syntax: "vim [nama_file]",
    examples: [
      "vim catatan.txt",
      "i",
      "Esc",
      ":w",
      ":wa",
      ":wq",
      ":q!",
      "Ctrl+C"
    ],
    notes: [
      "Vim memiliki beberapa mode kerja utama: Normal Mode, Insert Mode, dan Command Mode.",
      "Secara default saat membuka file, Anda berada di Normal Mode. Anda tidak bisa mengetik teks langsung.",
      "Tekan tombol 'i' untuk masuk ke Insert Mode agar bisa mengetik teks.",
      "Tekan tombol 'Esc' untuk keluar dari Insert Mode kembali ke Normal Mode.",
      "Untuk menyimpan dan keluar, dari Normal Mode ketik ':wq' lalu tekan Enter. Untuk keluar tanpa menyimpan, ketik ':q!' lalu tekan Enter.",
      "Jika terminal terasa stuck atau terkunci, Anda bisa menekan tombol Ctrl + C untuk membatalkan proses yang berjalan."
    ],
    exerciseIds: [
      "ex-vim-01",
      "ex-vim-02",
      "ex-vim-03",
      "ex-vim-04",
      "ex-vim-05",
      "ex-vim-06",
      "ex-vim-07"
    ],
    requiredPoints: 50,
    isLocked: true
  },

  // LEVEL 5 — Permission Dasar
  {
    moduleId: "ls-l",
    title: "Membaca Permission dari ls -l",
    level: 5,
    summary: "Melihat dan memahami representasi hak akses file melalui format detail ls -l.",
    command: "ls -l",
    syntax: "ls -l [nama_file_atau_folder]",
    examples: ["ls -l", "ls -la file.txt"],
    notes: [
      "Output 'ls -l' diawali dengan string permission 10 karakter, contoh: -rw-r--r--"
    ],
    exerciseIds: ["ex-lsl-01", "ex-lsl-02"],
    requiredPoints: 20,
    isLocked: true
  },
  {
    moduleId: "permission-intro",
    title: "Konsep Permission Linux Dasar",
    level: 5,
    summary: "Memahami sistem hak akses file/folder (permission) di Linux secara teoretis.",
    command: "chmod",
    syntax: "chmod [permission_oktal] [nama_file]",
    examples: ["chmod 777 script.sh", "chmod 400 rahasia.txt"],
    notes: [
      "Ada 3 hak akses dasar dengan nilai oktalnya:\n- Read (r) = 4\n- Write (w) = 2\n- Execute (x) = 1"
    ],
    exerciseIds: ["ex-perm-intro-01", "ex-perm-intro-02"],
    requiredPoints: 20,
    isLocked: true
  },
  {
    moduleId: "chmod-777",
    title: "chmod 777 (Akses Penuh)",
    level: 5,
    summary: "Memberikan akses penuh read, write, dan execute kepada semua pengguna.",
    command: "chmod 777",
    syntax: "chmod 777 [nama_file]",
    examples: ["chmod 777 script.sh"],
    notes: [
      "Angka 7 diperoleh dari 4 (read) + 2 (write) + 1 (execute) = 7 untuk owner, group, dan others."
    ],
    exerciseIds: ["ex-chmod777-01"],
    requiredPoints: 15,
    isLocked: true
  },
  {
    moduleId: "chmod-400",
    title: "chmod 400 (Hanya Owner)",
    level: 5,
    summary: "Membatasi akses hanya untuk pemilik file.",
    command: "chmod 400",
    syntax: "chmod 400 [nama_file]",
    examples: ["chmod 400 rahasia.txt"],
    notes: [
      "Hanya owner yang bisa read (4). Group (0) dan Others (0) tidak memiliki akses sama sekali."
    ],
    exerciseIds: ["ex-chmod400-01"],
    requiredPoints: 15,
    isLocked: true
  },
  {
    moduleId: "chmod-644",
    title: "chmod 644 (File Website)",
    level: 5,
    summary: "Menetapkan hak akses standar yang aman untuk file website.",
    command: "chmod 644",
    syntax: "chmod 644 [nama_file]",
    examples: ["chmod 644 index.php"],
    notes: [
      "Owner bisa read/write (6), sedangkan group (4) dan others (4) hanya bisa membaca (read)."
    ],
    exerciseIds: ["ex-chmod644-01"],
    requiredPoints: 15,
    isLocked: true
  },
  {
    moduleId: "chmod-755",
    title: "chmod 755 (Folder Website)",
    level: 5,
    summary: "Menetapkan hak akses standar yang aman untuk folder/direktori website.",
    command: "chmod 755",
    syntax: "chmod 755 [nama_folder]",
    examples: ["chmod 755 public_html"],
    notes: [
      "Owner bisa read/write/execute (7), sedangkan group (5) dan others (5) bisa read/execute."
    ],
    exerciseIds: ["ex-chmod755-01"],
    requiredPoints: 15,
    isLocked: true
  },

  // LEVEL 6 — Permission Lanjutan
  {
    moduleId: "chmod-symbolic",
    title: "chmod Simbolik",
    level: 6,
    summary: "Mengubah hak akses file/folder menggunakan simbol representasi kelompok user (+/- dan rwx).",
    command: "chmod",
    syntax: "chmod [user_group_others][+/-][rwx] [nama_file]",
    examples: ["chmod u+x run.sh", "chmod g-w config.php", "chmod o-r data.json"],
    notes: [
      "Simbol kelompok:\n- u = user/owner\n- g = group\n- o = others\n- a = all (semua kelompok sekaligus)",
      "Simbol aksi:\n- '+' = menambahkan hak akses\n- '-' = mencabut/menghapus hak akses"
    ],
    exerciseIds: ["ex-chmodsym-01", "ex-chmodsym-02", "ex-chmodsym-03"],
    requiredPoints: 25,
    isLocked: true
  },
  {
    moduleId: "chown",
    title: "Mengubah Pemilik dengan chown",
    level: 6,
    summary: "Mengubah pemilik (owner) dan kelompok (group) suatu file atau folder.",
    commandMeaning: "change owner",
    command: "chown",
    syntax: "chown [owner] [nama_file]\nchown [owner]:[group] [nama_file]",
    examples: ["chown admin web.log", "chown -R user:group data/"],
    notes: [
      "Gunakan flag '-R' untuk mengubah owner secara rekursif (termasuk semua file dan folder di dalamnya)."
    ],
    exerciseIds: ["ex-chown-01", "ex-chown-02"],
    requiredPoints: 20,
    isLocked: true
  },
  {
    moduleId: "cpanel",
    title: "Permission di cPanel File Manager",
    level: 6,
    summary: "Memahami cara mengubah hak akses file/folder secara visual melalui File Manager cPanel hosting.",
    command: "cpanel",
    syntax: "visual action (no terminal command)",
    examples: [
      "1. Masuk ke File Manager cPanel.",
      "2. Klik kanan file/folder, pilih 'Change Permissions'.",
      "3. Centang kotak r/w/x sesuai kebutuhan (644 atau 755)."
    ],
    notes: [
      "cPanel File Manager menyediakan antarmuka checklist yang intuitif. Mencontreng kotak Read/Write/Execute otomatis menjumlahkan nilai oktal di bagian bawah dialog."
    ],
    exerciseIds: ["ex-cpanel-01", "ex-cpanel-02"],
    requiredPoints: 20,
    isLocked: true
  }
];
