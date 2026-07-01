import { Exercise } from "@/types";

export const exercises: Exercise[] = [
  // LEVEL 1 — Navigasi dan Folder
  {
    exerciseId: "ex-pwd-01",
    moduleId: "pwd",
    question: "Tampilkan lokasi absolut direktori tempat Anda berada saat ini. Secara default, Anda berada di home directory Anda.",
    acceptedAnswers: ["pwd"],
    explanation: "Command 'pwd' (print working directory) mencetak letak path absolut dari folder tempat Anda berada sekarang.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },
  {
    exerciseId: "ex-mkdir-01",
    moduleId: "mkdir",
    question: "Buat folder bernama 'latihan' di home directory Anda.",
    acceptedAnswers: ["mkdir latihan"],
    explanation: "Command 'mkdir latihan' membuat folder baru bernama 'latihan' di direktori saat ini.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },
  {
    exerciseId: "ex-mkdir-02",
    moduleId: "mkdir",
    question: "Buat folder bernama 'sekolah' di home directory Anda.",
    acceptedAnswers: ["mkdir sekolah"],
    explanation: "Command 'mkdir sekolah' membuat folder baru bernama 'sekolah'.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },
  {
    exerciseId: "ex-ls-01",
    moduleId: "ls",
    question: "Lihat daftar file dan folder di lokasi saat ini. Pastikan folder yang baru saja dibuat terlihat.",
    acceptedAnswers: ["ls"],
    explanation: "Command 'ls' menampilkan seluruh file dan folder yang tidak tersembunyi di lokasi direktori aktif Anda.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },
  {
    exerciseId: "ex-ls-02",
    moduleId: "ls",
    question: "Lihat daftar isi folder saat ini secara detail (menggunakan format detail/long list).",
    acceptedAnswers: ["ls -l", "ls -la", "ls -al"],
    explanation: "Flag '-l' menampilkan detail berupa permission, owner, size, dan timestamp modifikasi.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },
  {
    exerciseId: "ex-ls-03",
    moduleId: "ls",
    question: "Lihat seluruh daftar isi folder termasuk file-file tersembunyi (hidden files yang diawali tanda titik).",
    acceptedAnswers: ["ls -a", "ls -la", "ls -al", "ls -at"],
    explanation: "Flag '-a' (all) menampilkan semua file, termasuk yang tersembunyi seperti .profile atau .env.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },
  {
    exerciseId: "ex-cd-01",
    moduleId: "cd",
    question: "Masuk ke folder 'latihan' yang sudah dibuat sebelumnya.",
    acceptedAnswers: ["cd latihan"],
    explanation: "Command 'cd latihan' berpindah lokasi ke dalam folder 'latihan'.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "cwd", path: "~" }
    ]
  },
  {
    exerciseId: "ex-cd-02",
    moduleId: "cd",
    question: "Kembali ke home directory menggunakan command cd ~.",
    acceptedAnswers: ["cd ~", "cd"],
    explanation: "Command 'cd ~' atau 'cd' tanpa argumen akan mengembalikan Anda ke home directory.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "cwd", path: "~/latihan" }
    ]
  },
  {
    exerciseId: "ex-cd-03",
    moduleId: "cd",
    question: "Masuk ke folder 'sekolah' yang berada di home directory.",
    acceptedAnswers: ["cd sekolah"],
    explanation: "Command 'cd sekolah' masuk ke dalam folder 'sekolah'.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "cwd", path: "~" }
    ]
  },
  {
    exerciseId: "ex-cd-04",
    moduleId: "cd",
    question: "Di dalam folder 'sekolah', buat folder bernama 'kelas'.",
    acceptedAnswers: ["mkdir kelas"],
    explanation: "Command 'mkdir kelas' membuat folder baru bernama 'kelas' di dalam folder aktif saat ini.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "cwd", path: "~/sekolah" }
    ]
  },
  {
    exerciseId: "ex-cd-05",
    moduleId: "cd",
    question: "Masuk ke folder 'kelas' yang baru saja Anda buat.",
    acceptedAnswers: ["cd kelas"],
    explanation: "Command 'cd kelas' masuk ke dalam folder 'kelas'.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "cwd", path: "~/sekolah" }
    ]
  },
  {
    exerciseId: "ex-cd-06",
    moduleId: "cd",
    question: "Di dalam folder 'kelas', buat folder bernama 'tugas'.",
    acceptedAnswers: ["mkdir tugas"],
    explanation: "Command 'mkdir tugas' membuat folder baru bernama 'tugas'.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "cwd", path: "~/sekolah/kelas" }
    ]
  },
  {
    exerciseId: "ex-cd-07",
    moduleId: "cd",
    question: "Masuk ke folder 'tugas' yang baru saja Anda buat.",
    acceptedAnswers: ["cd tugas"],
    explanation: "Command 'cd tugas' masuk ke dalam folder 'tugas'.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "cwd", path: "~/sekolah/kelas" }
    ]
  },
  {
    exerciseId: "ex-cd-08",
    moduleId: "cd",
    question: "Kembali satu folder ke atas menggunakan cd ..",
    acceptedAnswers: ["cd ..", "cd ../"],
    explanation: "Command 'cd ..' berpindah satu folder ke atas (kembali ke folder 'kelas').",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "cwd", path: "~/sekolah/kelas/tugas" }
    ]
  },
  {
    exerciseId: "ex-cd-09",
    moduleId: "cd",
    question: "Kembali ke home directory Anda menggunakan shortcut cd.",
    acceptedAnswers: ["cd ~", "cd"],
    explanation: "Command 'cd' atau 'cd ~' langsung mengembalikan Anda ke home directory.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "cwd", path: "~/sekolah/kelas/tugas" }
    ]
  },
  {
    exerciseId: "ex-cd-10",
    moduleId: "cd",
    question: "Sekarang folder bertingkat sudah dibuat. Dari home directory Anda, masuk langsung ke folder sekolah/kelas/tugas dengan satu command.",
    acceptedAnswers: ["cd sekolah/kelas/tugas"],
    explanation: "Anda dapat berpindah langsung ke subfolder bertingkat dengan menuliskan path lengkapnya.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "cwd", path: "~" }
    ]
  },

  // LEVEL 2 — File Dasar
  {
    exerciseId: "ex-touch-01",
    moduleId: "touch",
    question: "Masuk ke folder 'latihan', lalu buatlah file kosong baru bernama 'catatan.txt'.",
    acceptedAnswers: ["touch catatan.txt"],
    explanation: "Command 'touch catatan.txt' membuat file kosong baru bernama 'catatan.txt' di direktori aktif.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "directory", path: "~/latihan" },
      { type: "cwd", path: "~/latihan" }
    ]
  },
  {
    exerciseId: "ex-touch-02",
    moduleId: "touch",
    question: "Buat file kosong baru bernama 'data.doc' di folder saat ini.",
    acceptedAnswers: ["touch data.doc"],
    explanation: "Command 'touch data.doc' membuat file kosong baru bernama 'data.doc'.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "directory", path: "~/latihan" },
      { type: "cwd", path: "~/latihan" }
    ]
  },
  {
    exerciseId: "ex-touch-03",
    moduleId: "touch",
    question: "Buat file kosong baru bernama 'index.html' di folder saat ini.",
    acceptedAnswers: ["touch index.html"],
    explanation: "Command 'touch index.html' membuat file baru bernama 'index.html'.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "directory", path: "~/latihan" },
      { type: "cwd", path: "~/latihan" }
    ]
  },
  {
    exerciseId: "ex-echo-01",
    moduleId: "echo-overwrite",
    question: "Isi file 'catatan.txt' dengan teks \"Saya belajar Linux\". Gunakan operator redirect '>' untuk menimpa konten.",
    acceptedAnswers: [
      "echo \"Saya belajar Linux\" > catatan.txt",
      "echo 'Saya belajar Linux' > catatan.txt",
      "echo Saya belajar Linux > catatan.txt"
    ],
    explanation: "Operator '>' mengarahkan output teks dari echo ke file 'catatan.txt' dan menimpa isi yang lama.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "directory", path: "~/latihan" },
      { type: "file", path: "~/latihan/catatan.txt", content: "" },
      { type: "cwd", path: "~/latihan" }
    ]
  },
  {
    exerciseId: "ex-echo-02",
    moduleId: "echo-overwrite",
    question: "Isi file 'index.html' dengan teks \"<h1>Halo Linux</h1>\". Gunakan operator redirect '>'.",
    acceptedAnswers: [
      "echo \"<h1>Halo Linux</h1>\" > index.html",
      "echo '<h1>Halo Linux</h1>' > index.html",
      "echo <h1>Halo Linux</h1> > index.html"
    ],
    explanation: "Gunakan '>' untuk menuliskan output string html ke dalam file index.html.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "directory", path: "~/latihan" },
      { type: "file", path: "~/latihan/index.html", content: "" },
      { type: "cwd", path: "~/latihan" }
    ]
  },
  {
    exerciseId: "ex-echo-03",
    moduleId: "echo-overwrite",
    question: "Timpa isi file 'catatan.txt' dengan teks baru: \"Materi command dasar\".",
    acceptedAnswers: [
      "echo \"Materi command dasar\" > catatan.txt",
      "echo 'Materi command dasar' > catatan.txt",
      "echo Materi command dasar > catatan.txt"
    ],
    explanation: "Redirection '>' akan sepenuhnya mengganti/menimpa isi file lama dengan teks baru.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "directory", path: "~/latihan" },
      { type: "file", path: "~/latihan/catatan.txt", content: "Saya belajar Linux" },
      { type: "cwd", path: "~/latihan" }
    ]
  },
  {
    exerciseId: "ex-cat-01",
    moduleId: "cat",
    question: "Tampilkan isi file 'catatan.txt' ke layar terminal.",
    acceptedAnswers: ["cat catatan.txt"],
    explanation: "Command 'cat' menampilkan seluruh konten file teks ke stdout layar terminal.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "directory", path: "~/latihan" },
      { type: "file", path: "~/latihan/catatan.txt", content: "Materi command dasar" },
      { type: "cwd", path: "~/latihan" }
    ]
  },
  {
    exerciseId: "ex-cat-02",
    moduleId: "cat",
    question: "Tampilkan isi file 'index.html' ke layar terminal.",
    acceptedAnswers: ["cat index.html"],
    explanation: "Command 'cat' mencetak isi html ke stdout.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "directory", path: "~/latihan" },
      { type: "file", path: "~/latihan/index.html", content: "<h1>Halo Linux</h1>" },
      { type: "cwd", path: "~/latihan" }
    ]
  },
  {
    exerciseId: "ex-echo-append-01",
    moduleId: "echo-append",
    question: "Tambahkan baris baru berisi teks \"Baris baru\" ke baris paling bawah file 'catatan.txt' tanpa menghapus teks sebelumnya. Gunakan '>>'.",
    acceptedAnswers: [
      "echo \"Baris baru\" >> catatan.txt",
      "echo 'Baris baru' >> catatan.txt",
      "echo Baris baru >> catatan.txt"
    ],
    explanation: "Operator redirection '>>' digunakan untuk menyisipkan/menambahkan konten di baris akhir file (append).",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "directory", path: "~/latihan" },
      { type: "file", path: "~/latihan/catatan.txt", content: "Materi command dasar" },
      { type: "cwd", path: "~/latihan" }
    ]
  },
  {
    exerciseId: "ex-echo-append-02",
    moduleId: "echo-append",
    question: "Tambahkan baris baru berisi teks \"Selesai belajar\" ke baris paling bawah file 'catatan.txt'.",
    acceptedAnswers: [
      "echo \"Selesai belajar\" >> catatan.txt",
      "echo 'Selesai belajar' >> catatan.txt",
      "echo Selesai belajar >> catatan.txt"
    ],
    explanation: "Kembali gunakan '>>' untuk menyisipkan teks di baris baru terbawah.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "directory", path: "~/latihan" },
      { type: "file", path: "~/latihan/catatan.txt", content: "Materi command dasar\nBaris baru" },
      { type: "cwd", path: "~/latihan" }
    ]
  },

  // LEVEL 3 — Manajemen File
  {
    exerciseId: "ex-cp-01",
    moduleId: "cp",
    question: "Salin file 'catatan.txt' yang ada di folder 'latihan' menjadi file baru bernama 'backup.txt' di folder yang sama.",
    acceptedAnswers: ["cp catatan.txt backup.txt"],
    explanation: "Command 'cp' menduplikasi isi file asal ke file target baru.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "directory", path: "~/latihan" },
      { type: "file", path: "~/latihan/catatan.txt", content: "Materi command dasar" },
      { type: "cwd", path: "~/latihan" }
    ]
  },
  {
    exerciseId: "ex-cp-02",
    moduleId: "cp",
    question: "Salin file 'index.html' menjadi file baru bernama 'index-backup.html'.",
    acceptedAnswers: ["cp index.html index-backup.html"],
    explanation: "Gunakan 'cp' untuk menyalin file html.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "directory", path: "~/latihan" },
      { type: "file", path: "~/latihan/index.html", content: "<h1>Halo Linux</h1>" },
      { type: "cwd", path: "~/latihan" }
    ]
  },
  {
    exerciseId: "ex-mv-01",
    moduleId: "mv",
    question: "Ganti nama file 'backup.txt' menjadi 'salinan.txt'.",
    acceptedAnswers: ["mv backup.txt salinan.txt"],
    explanation: "Perintah 'mv' pada file target baru di direktori yang sama bertindak sebagai rename.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "directory", path: "~/latihan" },
      { type: "file", path: "~/latihan/backup.txt", content: "Materi command dasar" },
      { type: "cwd", path: "~/latihan" }
    ]
  },
  {
    exerciseId: "ex-mv-02",
    moduleId: "mv",
    question: "Pindahkan file 'salinan.txt' ke dalam subfolder 'arsip' yang ada di direktori saat ini.",
    acceptedAnswers: ["mv salinan.txt arsip/", "mv salinan.txt arsip"],
    explanation: "Menyebutkan direktori tujuan pada argumen kedua 'mv' akan memindahkan file ke direktori tersebut.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "directory", path: "~/latihan" },
      { type: "directory", path: "~/latihan/arsip" },
      { type: "file", path: "~/latihan/salinan.txt", content: "Materi command dasar" },
      { type: "cwd", path: "~/latihan" }
    ]
  },
  {
    exerciseId: "ex-rm-01",
    moduleId: "rm",
    question: "Hapus file 'salinan.txt' yang berada di dalam folder 'arsip'.",
    acceptedAnswers: ["rm arsip/salinan.txt"],
    explanation: "Command 'rm' menghapus file secara permanen.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "directory", path: "~/latihan" },
      { type: "directory", path: "~/latihan/arsip" },
      { type: "file", path: "~/latihan/arsip/salinan.txt", content: "Materi command dasar" },
      { type: "cwd", path: "~/latihan" }
    ]
  },
  {
    exerciseId: "ex-rm-02",
    moduleId: "rm",
    question: "Hapus file 'data.doc' dari folder saat ini.",
    acceptedAnswers: ["rm data.doc"],
    explanation: "Command 'rm' menghapus data.doc secara permanen.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "directory", path: "~/latihan" },
      { type: "file", path: "~/latihan/data.doc", content: "" },
      { type: "cwd", path: "~/latihan" }
    ]
  },
  {
    exerciseId: "ex-rmr-01",
    moduleId: "rm-recursive",
    question: "Kembalilah ke home directory Anda, lalu hapus folder 'arsip' (yang berada di dalam folder 'latihan') beserta seluruh isinya secara rekursif.",
    acceptedAnswers: [
      "rm -r latihan/arsip",
      "rm -rf latihan/arsip",
      "rm -r latihan/arsip/",
      "rm -rf latihan/arsip/"
    ],
    explanation: "Flag '-r' (recursive) diperlukan untuk menghapus folder berserta semua subfile di dalamnya.",
    points: 15,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "directory", path: "~/latihan" },
      { type: "directory", path: "~/latihan/arsip" },
      { type: "file", path: "~/latihan/arsip/test.txt", content: "" },
      { type: "cwd", path: "~" }
    ]
  },

  // LEVEL 4 — Vim Dasar
  {
    exerciseId: "ex-vim-01",
    moduleId: "vim",
    question: "Buka file 'catatan.txt' menggunakan editor Vim dari terminal shell.",
    acceptedAnswers: ["vim catatan.txt"],
    explanation: "Perintah 'vim nama_file' digunakan untuk membuka file teks di Vim.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "directory", path: "~/latihan" },
      { type: "file", path: "~/latihan/catatan.txt", content: "Materi command dasar" },
      { type: "cwd", path: "~/latihan" }
    ]
  },
  {
    exerciseId: "ex-vim-02",
    moduleId: "vim",
    question: "Di dalam Vim (Normal Mode), tombol apa yang ditekan untuk masuk ke Insert Mode agar bisa mulai mengetik teks?",
    acceptedAnswers: ["i"],
    explanation: "Tombol 'i' mengaktifkan Insert Mode di editor Vim.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },
  {
    exerciseId: "ex-vim-03",
    moduleId: "vim",
    question: "Saat berada di dalam Insert Mode, tombol apa yang ditekan untuk kembali ke Normal Mode?",
    acceptedAnswers: ["Esc", "esc"],
    explanation: "Tombol 'Esc' (Escape) membatalkan mode penyuntingan aktif dan kembali ke Normal Mode.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },
  {
    exerciseId: "ex-vim-04",
    moduleId: "vim",
    question: "Dari Normal Mode, ketik perintah Command Mode untuk menyimpan (save) perubahan file tanpa keluar dari editor Vim.",
    acceptedAnswers: [":w", ":wa", "w", "wa"],
    explanation: "Perintah ':w' menyimpan perubahan berkas tanpa menutup jendela editor.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },
  {
    exerciseId: "ex-vim-05",
    moduleId: "vim",
    question: "Dari Normal Mode, ketik perintah Command Mode untuk menyimpan sekaligus keluar dari editor Vim.",
    acceptedAnswers: [":wq", "wq"],
    explanation: "Perintah ':wq' menyimpan (write) seluruh perubahan dan menutup editor (quit).",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },
  {
    exerciseId: "ex-vim-06",
    moduleId: "vim",
    question: "Dari Normal Mode, ketik perintah Command Mode untuk keluar secara paksa dari editor Vim tanpa menyimpan perubahan apa pun.",
    acceptedAnswers: [":q!", "q!"],
    explanation: "Perintah ':q!' menutup editor secara langsung dan mengabaikan perubahan data.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },
  {
    exerciseId: "ex-vim-07",
    moduleId: "vim",
    question: "Jika terminal simulator Anda stuck atau terkunci karena proses latar belakang yang tidak berhenti, tombol kombinasi apa yang ditekan untuk membatalkannya?",
    acceptedAnswers: ["Ctrl+C", "Ctrl + C", "ctrl+c"],
    explanation: "Kombinasi Ctrl + C mengirimkan sinyal SIGINT untuk membatalkan proses aktif terminal.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },

  // LEVEL 5 — Permission Dasar
  {
    exerciseId: "ex-lsl-01",
    moduleId: "ls-l",
    question: "Tulis perintah detail untuk melihat daftar file beserta permission detail-nya (long listing format).",
    acceptedAnswers: ["ls -l", "ls -la", "ls -al"],
    explanation: "Flag '-l' menampilkan format detail berupa permission, link, owner, group, size, date, dan name.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },
  {
    exerciseId: "ex-lsl-02",
    moduleId: "ls-l",
    question: "Jika output dari 'ls -l' diawali dengan karakter 'drwxr-xr-x', bertipe apakah objek tersebut? (Jawab dengan 'folder' atau 'file').",
    acceptedAnswers: ["folder", "direktori", "directory"],
    explanation: "Karakter pertama 'd' menandakan objek tersebut bertipe directory/folder.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },
  {
    exerciseId: "ex-perm-intro-01",
    moduleId: "permission-intro",
    question: "Berapakah total nilai hak akses jika pemilik (owner) hanya diberikan hak akses read (4) dan write (2) saja pada file?",
    acceptedAnswers: ["6"],
    explanation: "Nilai hak akses diakumulasikan. Read (4) + Write (2) = 6.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },
  {
    exerciseId: "ex-perm-intro-02",
    moduleId: "permission-intro",
    question: "Berapakah total nilai hak akses jika group/others diberikan hak akses penuh (read=4, write=2, execute=1)?",
    acceptedAnswers: ["7"],
    explanation: "Akses penuh bernilai 4 (read) + 2 (write) + 1 (execute) = 7.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },
  {
    exerciseId: "ex-chmod777-01",
    moduleId: "chmod-777",
    question: "Berikan hak akses penuh (read, write, execute = 777) kepada owner, group, dan others pada file 'script.sh' di home directory.",
    acceptedAnswers: ["chmod 777 script.sh"],
    explanation: "Perintah 'chmod 777' memberikan hak akses penuh kepada semua kelompok user.",
    points: 15,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "file", path: "~/script.sh", content: "" }
    ]
  },
  {
    exerciseId: "ex-chmod400-01",
    moduleId: "chmod-400",
    question: "Batasi hak akses file 'rahasia.txt' sehingga hanya Owner yang bisa membaca (read = 4), sedangkan Group dan Others tidak punya hak akses sama sekali (0).",
    acceptedAnswers: ["chmod 400 rahasia.txt"],
    explanation: "Perintah 'chmod 400' membatasi berkas sensitif hanya untuk pemilik berkas (read-only).",
    points: 15,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "file", path: "~/rahasia.txt", content: "" }
    ]
  },
  {
    exerciseId: "ex-chmod644-01",
    moduleId: "chmod-644",
    question: "Tetapkan permission standar yang aman untuk file website bernama 'index.php' (Owner: read/write, Group: read, Others: read).",
    acceptedAnswers: ["chmod 644 index.php"],
    explanation: "Permission '644' adalah standar paling aman untuk file PHP/HTML website di server production.",
    points: 15,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "file", path: "~/index.php", content: "" }
    ]
  },
  {
    exerciseId: "ex-chmod755-01",
    moduleId: "chmod-755",
    question: "Tetapkan permission standar yang aman untuk direktori/folder website bernama 'public_html' (Owner: rwx, Group: rx, Others: rx).",
    acceptedAnswers: ["chmod 755 public_html"],
    explanation: "Permission '755' adalah standar wajib untuk direktori web agar browser/web server bisa menelusuri isi folder.",
    points: 15,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "directory", path: "~/public_html" }
    ]
  },

  // LEVEL 6 — Permission Lanjutan
  {
    exerciseId: "ex-chmodsym-01",
    moduleId: "chmod-symbolic",
    question: "Gunakan chmod simbolik untuk menambahkan (+) hak akses execute (x) kepada user/owner (u) pada file 'run.sh'.",
    acceptedAnswers: ["chmod u+x run.sh"],
    explanation: "Command 'chmod u+x' secara simbolik menambahkan hak eksekusi ke pemilik file.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "file", path: "~/run.sh", content: "" }
    ]
  },
  {
    exerciseId: "ex-chmodsym-02",
    moduleId: "chmod-symbolic",
    question: "Gunakan chmod simbolik untuk mencabut (-) hak akses write (w) dari group (g) pada file 'config.php'.",
    acceptedAnswers: ["chmod g-w config.php"],
    explanation: "Command 'chmod g-w' menghapus kemampuan menulis berkas dari anggota grup.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "file", path: "~/config.php", content: "" }
    ]
  },
  {
    exerciseId: "ex-chmodsym-03",
    moduleId: "chmod-symbolic",
    question: "Gunakan chmod simbolik untuk mencabut (-) hak akses read (r) dari others (o) pada file 'data.json'.",
    acceptedAnswers: ["chmod o-r data.json"],
    explanation: "Command 'chmod o-r' mencabut hak akses membaca file dari pengguna luar.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "file", path: "~/data.json", content: "" }
    ]
  },
  {
    exerciseId: "ex-chown-01",
    moduleId: "chown",
    question: "Ubah pemilik file 'web.log' menjadi user 'admin'.",
    acceptedAnswers: ["chown admin web.log"],
    explanation: "Command 'chown admin web.log' mengganti kepemilikan owner berkas menjadi admin.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "file", path: "~/web.log", content: "" }
    ]
  },
  {
    exerciseId: "ex-chown-02",
    moduleId: "chown",
    question: "Ubah pemilik folder 'data' beserta seluruh isinya secara rekursif menjadi owner 'user' dan group 'group'.",
    acceptedAnswers: ["chown -R user:group data", "chown -R user:group data/"],
    explanation: "Flag '-R' menginstruksikan chown untuk berjalan secara rekursif ke seluruh isi direktori.",
    points: 15,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0,
    setupSteps: [
      { type: "directory", path: "~/data" },
      { type: "file", path: "~/data/item.txt", content: "" }
    ]
  },
  {
    exerciseId: "ex-cpanel-01",
    moduleId: "cpanel",
    question: "Berapa angka permission (3 digit oktal) yang paling direkomendasikan secara standar untuk file teks/php website di hosting cPanel?",
    acceptedAnswers: ["644"],
    explanation: "Angka '644' adalah hak akses ideal untuk file web PHP/HTML di server hosting cPanel.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },
  {
    exerciseId: "ex-cpanel-02",
    moduleId: "cpanel",
    question: "Berapa angka permission (3 digit oktal) yang paling direkomendasikan secara standar untuk folder/direktori website di hosting cPanel?",
    acceptedAnswers: ["755"],
    explanation: "Angka '755' adalah hak akses ideal untuk folder website di server hosting cPanel.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  }
];
