import { Exercise } from "@/types";

export const exercises: Exercise[] = [
  // LEVEL 1
  {
    exerciseId: "ex-mkdir-01",
    moduleId: "mkdir",
    question: "Buat folder baru bernama 'latihan' di folder saat ini.",
    acceptedAnswers: ["mkdir latihan"],
    explanation: "Command 'mkdir latihan' digunakan untuk membuat folder baru bernama 'latihan'.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },
  {
    exerciseId: "ex-ls-01",
    moduleId: "ls",
    question: "Lihat daftar file dan folder di lokasi saat ini.",
    acceptedAnswers: ["ls"],
    explanation: "Command 'ls' menampilkan seluruh file dan folder yang tidak tersembunyi di lokasi direktori aktif Anda.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },
  {
    exerciseId: "ex-cd-01",
    moduleId: "cd",
    question: "Masuk ke folder yang baru saja dibuat yaitu 'latihan'.",
    acceptedAnswers: ["cd latihan"],
    explanation: "Command 'cd latihan' memindahkan lokasi terminal aktif Anda masuk ke dalam folder 'latihan'.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },
  {
    exerciseId: "ex-pwd-01",
    moduleId: "pwd",
    question: "Lihat letak path folder aktif Anda saat ini di sistem.",
    acceptedAnswers: ["pwd"],
    explanation: "Command 'pwd' (print working directory) mencetak letak path absolut dari folder tempat Anda berada sekarang.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },

  // LEVEL 2
  {
    exerciseId: "ex-touch-01",
    moduleId: "touch",
    question: "Buat file teks kosong baru bernama 'catatan.txt'.",
    acceptedAnswers: ["touch catatan.txt"],
    explanation: "Command 'touch catatan.txt' membuat file kosong baru bernama 'catatan.txt' tanpa mengubah isinya jika sudah ada.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },
  {
    exerciseId: "ex-cat-01",
    moduleId: "cat",
    question: "Lihat isi dari file teks bernama 'catatan.txt'.",
    acceptedAnswers: ["cat catatan.txt"],
    explanation: "Command 'cat catatan.txt' menampilkan isi teks di dalam file 'catatan.txt' ke layar terminal.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },
  {
    exerciseId: "ex-echo-01",
    moduleId: "echo-redirection",
    question: "Gunakan command echo untuk menulis teks \"Saya belajar Linux\" ke dalam file 'catatan.txt' (ingat untuk menimpa isi lama).",
    acceptedAnswers: [
      "echo \"Saya belajar Linux\" > catatan.txt",
      "echo 'Saya belajar Linux' > catatan.txt",
      "echo Saya belajar Linux > catatan.txt"
    ],
    explanation: "Operator '>' digunakan untuk mengarahkan output teks dari echo ke file 'catatan.txt' dan menimpa isi yang lama.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },
  {
    exerciseId: "ex-echo-02",
    moduleId: "echo-redirection",
    question: "Gunakan command echo untuk menambahkan teks \"Baris baru\" ke dalam file 'catatan.txt' tanpa menghapus isi yang sudah ada sebelumnya.",
    acceptedAnswers: [
      "echo \"Baris baru\" >> catatan.txt",
      "echo 'Baris baru' >> catatan.txt",
      "echo Baris baru >> catatan.txt"
    ],
    explanation: "Operator '>>' mengarahkan output teks ke akhir file 'catatan.txt' (append) tanpa merusak teks yang sudah tertulis sebelumnya.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },

  // LEVEL 3
  {
    exerciseId: "ex-mv-01",
    moduleId: "mv",
    question: "Ubah nama file 'catatan.txt' menjadi 'notes.txt'.",
    acceptedAnswers: ["mv catatan.txt notes.txt"],
    explanation: "Command 'mv' dengan argumen nama file baru berfungsi untuk mengganti nama (rename) file tersebut.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },
  {
    exerciseId: "ex-cp-01",
    moduleId: "cp",
    question: "Salin file 'notes.txt' menjadi file baru bernama 'backup.txt'.",
    acceptedAnswers: ["cp notes.txt backup.txt"],
    explanation: "Command 'cp notes.txt backup.txt' menduplikasi isi 'notes.txt' ke file baru yang bernama 'backup.txt'.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },
  {
    exerciseId: "ex-rm-01",
    moduleId: "rm",
    question: "Hapus file 'notes.txt' dari folder saat ini.",
    acceptedAnswers: ["rm notes.txt"],
    explanation: "Command 'rm notes.txt' menghapus file 'notes.txt' secara permanen dari direktori saat ini.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },
  {
    exerciseId: "ex-rmr-01",
    moduleId: "rm-r",
    question: "Hapus folder 'latihan' beserta seluruh file di dalamnya secara rekursif.",
    acceptedAnswers: ["rm -r latihan", "rm -rf latihan"],
    explanation: "Command 'rm -r latihan' secara rekursif menghapus seluruh folder 'latihan' beserta file atau subfolder yang ada di dalamnya.",
    points: 15,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },

  // LEVEL 4
  {
    exerciseId: "ex-vim-01",
    moduleId: "vim",
    question: "Ketik perintah Vim (dari Normal Mode) yang digunakan untuk menyimpan perubahan sekaligus keluar dari editor Vim.",
    acceptedAnswers: [":wq"],
    explanation: "Perintah ':wq' di dalam command mode Vim digunakan untuk Write (menyimpan) dan Quit (keluar).",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },
  {
    exerciseId: "ex-vim-02",
    moduleId: "vim",
    question: "Ketik tombol keyboard satu huruf yang ditekan untuk mengubah mode Vim dari Normal Mode ke Insert Mode agar bisa mengetik teks.",
    acceptedAnswers: ["i"],
    explanation: "Tombol 'i' pada keyboard adalah shortcut standar untuk mengaktifkan Insert Mode di editor Vim.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },

  // LEVEL 5
  {
    exerciseId: "ex-perm-01",
    moduleId: "permission-intro",
    question: "Gunakan chmod mode angka untuk memberikan akses penuh (read, write, execute) kepada owner, group, dan others pada file 'script.sh'.",
    acceptedAnswers: ["chmod 777 script.sh"],
    explanation: "Angka 7 diperoleh dari 4 (read) + 2 (write) + 1 (execute). Jadi, 'chmod 777 script.sh' membuka akses penuh untuk semua kategori pengguna.",
    points: 15,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },
  {
    exerciseId: "ex-perm-02",
    moduleId: "permission-intro",
    question: "Gunakan chmod mode angka untuk memberikan hak akses read saja bagi Owner, sedangkan Group dan Others tidak memiliki akses sama sekali pada file 'rahasia.txt'.",
    acceptedAnswers: ["chmod 400 rahasia.txt"],
    explanation: "Angka 4 (read), 0 (no access), 0 (no access). Sehingga perintahnya adalah 'chmod 400 rahasia.txt'.",
    points: 15,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },

  // LEVEL 6
  {
    exerciseId: "ex-lsl-01",
    moduleId: "ls-l",
    question: "Tulis perintah untuk melihat isi folder dalam format detail/long list agar kita bisa membaca string permission-nya.",
    acceptedAnswers: ["ls -l", "ls -la"],
    explanation: "Flag '-l' mengaktifkan mode long list, yang menampilkan permission, jumlah link, owner, group, ukuran, dan waktu modifikasi file.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },
  {
    exerciseId: "ex-lsl-02",
    moduleId: "ls-l",
    question: "Jika output 'ls -l' diawali dengan string 'drwxr-xr-x', apakah target tersebut bertipe 'folder' atau 'file'? (Jawab dengan kata 'folder' atau 'file').",
    acceptedAnswers: ["folder", "direktori"],
    explanation: "Karakter pertama 'd' menunjukkan Directory (folder). Jika file biasa, karakter pertamanya adalah tanda hubung '-'.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },

  // LEVEL 7
  {
    exerciseId: "ex-chmodnum-01",
    moduleId: "chmod-numeric",
    question: "Tetapkan hak akses standar untuk file website bernama 'index.php' (Owner: read/write, Group: read, Others: read).",
    acceptedAnswers: ["chmod 644 index.php"],
    explanation: "Angka 6 (read+write = 4+2) untuk owner, dan 4 (read) untuk group serta others. Perintah yang aman adalah 'chmod 644 index.php'.",
    points: 15,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },
  {
    exerciseId: "ex-chmodnum-02",
    moduleId: "chmod-numeric",
    question: "Tetapkan hak akses standar untuk folder website bernama 'public_html' (Owner: rwx, Group: rx, Others: rx).",
    acceptedAnswers: ["chmod 755 public_html"],
    explanation: "Angka 7 (read+write+execute = 4+2+1) untuk owner, dan 5 (read+execute = 4+1) untuk group serta others. Perintahnya adalah 'chmod 755 public_html'.",
    points: 15,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },

  // LEVEL 8
  {
    exerciseId: "ex-chmodsym-01",
    moduleId: "chmod-symbolic",
    question: "Gunakan chmod simbolik untuk menambahkan (+) hak akses execute (x) kepada user/owner (u) pada file 'run.sh'.",
    acceptedAnswers: ["chmod u+x run.sh"],
    explanation: "Perintah 'chmod u+x run.sh' menambahkan status executable khusus untuk owner (u) tanpa memengaruhi group dan others.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },
  {
    exerciseId: "ex-chmodsym-02",
    moduleId: "chmod-symbolic",
    question: "Gunakan chmod simbolik untuk mencabut/menghapus (-) hak akses write (w) dari group (g) pada file 'config.php'.",
    acceptedAnswers: ["chmod g-w config.php"],
    explanation: "Perintah 'chmod g-w config.php' mencabut hak akses menulis (write) bagi pengguna dalam kelompok (group).",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },

  // LEVEL 9
  {
    exerciseId: "ex-chown-01",
    moduleId: "chown",
    question: "Ubah pemilik file 'web.log' menjadi user bernama 'admin'.",
    acceptedAnswers: ["chown admin web.log"],
    explanation: "Perintah 'chown admin web.log' mengubah hak kepemilikan file 'web.log' ke user 'admin'.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },
  {
    exerciseId: "ex-chown-02",
    moduleId: "chown",
    question: "Ubah pemilik folder 'data' beserta seluruh isinya secara rekursif menjadi owner 'user' dan group 'group'.",
    acceptedAnswers: [
      "chown -R user:group data",
      "chown -R user:group data/"
    ],
    explanation: "Flag '-R' mengaktifkan perubahan secara rekursif ke seluruh file dan subfolder di dalam folder 'data'. Pembatas ':' memisahkan user dan group.",
    points: 15,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },

  // LEVEL 10
  {
    exerciseId: "ex-cpanel-01",
    moduleId: "cpanel",
    question: "Berapa angka permission (3 digit) yang paling direkomendasikan secara standar untuk file teks/php website di hosting cPanel?",
    acceptedAnswers: ["644"],
    explanation: "Angka '644' adalah standar permission file web di hosting agar file aman dibaca public namun hanya owner yang bisa mengubahnya.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  },
  {
    exerciseId: "ex-cpanel-02",
    moduleId: "cpanel",
    question: "Berapa angka permission (3 digit) yang paling direkomendasikan secara standar untuk folder/direktori website di hosting cPanel?",
    acceptedAnswers: ["755"],
    explanation: "Angka '755' adalah standar folder web di hosting agar web server dapat menelusuri folder (execute) dan membaca isinya.",
    points: 10,
    maxAttemptsBeforeHint: 3,
    hintPenaltyMultiplier: 0
  }
];
