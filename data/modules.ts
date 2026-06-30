import { Module } from "@/types";

export const modules: Module[] = [
  // LEVEL 1
  {
    moduleId: "mkdir",
    title: "Membuat Folder dengan mkdir",
    level: 1,
    summary: "Membuat direktori/folder baru di Linux.",
    commandMeaning: "make directory",
    command: "mkdir",
    syntax: "mkdir [nama_folder]",
    examples: ["mkdir latihan-linux", "mkdir project-web", "mkdir data"],
    notes: [
      "Nama folder sebaiknya tidak menggunakan spasi. Gunakan tanda hubung (-) atau underscore (_) jika terdiri dari beberapa kata.",
      "Linux bersifat case-sensitive. Folder 'Latihan' berbeda dengan 'latihan'."
    ],
    exerciseIds: ["ex-mkdir-01"],
    requiredPoints: 10,
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
    examples: ["ls", "ls -l", "ls -la"],
    notes: [
      "Secara default, 'ls' hanya menampilkan file/folder yang tidak tersembunyi (hidden).",
      "Gunakan flag '-a' untuk melihat file tersembunyi (yang diawali titik seperti .env)."
    ],
    exerciseIds: ["ex-ls-01"],
    requiredPoints: 10,
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
    examples: ["cd latihan-linux", "cd ..", "cd ~"],
    notes: [
      "Gunakan 'cd ..' untuk naik satu tingkat ke folder di atasnya.",
      "Gunakan 'cd ~' atau cukup 'cd' untuk langsung kembali ke home directory."
    ],
    exerciseIds: ["ex-cd-01"],
    requiredPoints: 10,
    isLocked: false
  },
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

  // LEVEL 2
  {
    moduleId: "touch",
    title: "Membuat File dengan touch",
    level: 2,
    summary: "Membuat file kosong baru di folder saat ini.",
    command: "touch",
    syntax: "touch [nama_file]",
    examples: ["touch catatan.txt", "touch index.html", "touch config.json"],
    notes: [
      "Jika file sudah ada, command ini tidak akan menimpa isinya, melainkan hanya memperbarui timestamp akses file tersebut."
    ],
    exerciseIds: ["ex-touch-01"],
    requiredPoints: 10,
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
    exerciseIds: ["ex-cat-01"],
    requiredPoints: 10,
    isLocked: true
  },
  {
    moduleId: "echo-redirection",
    title: "Menulis File dengan echo & Redirection",
    level: 2,
    summary: "Menulis teks ke dalam file menggunakan echo dan operator pengarah.",
    command: "echo",
    syntax: "echo \"teks\" > [nama_file]\necho \"teks\" >> [nama_file]",
    examples: [
      "echo \"Saya belajar Linux\" > catatan.txt",
      "echo \"Baris baru\" >> catatan.txt"
    ],
    notes: [
      "Operator '>' akan menulis teks dan MENIMPA (overwrite) seluruh isi lama file tersebut.",
      "Operator '>>' akan MENAMBAHKAN (append) teks pada baris baru di akhir file tanpa menghapus isi sebelumnya."
    ],
    exerciseIds: ["ex-echo-01", "ex-echo-02"],
    requiredPoints: 20,
    isLocked: true
  },

  // LEVEL 3
  {
    moduleId: "mv",
    title: "Memindahkan / Rename dengan mv",
    level: 3,
    summary: "Memindahkan file/folder ke lokasi lain atau mengubah nama file/folder.",
    commandMeaning: "move",
    command: "mv",
    syntax: "mv [sumber] [tujuan]",
    examples: ["mv catatan.txt folder-tujuan/", "mv lama.txt baru.txt", "mv data.csv ../backup/"],
    notes: [
      "Jika tujuan adalah nama file baru, maka fungsinya adalah mengubah nama (rename).",
      "Jika tujuan adalah folder yang ada, fungsinya adalah memindahkan (move)."
    ],
    exerciseIds: ["ex-mv-01"],
    requiredPoints: 10,
    isLocked: true
  },
  {
    moduleId: "cp",
    title: "Menyalin File dengan cp",
    level: 3,
    summary: "Menyalin (copy) file ke lokasi baru.",
    commandMeaning: "copy",
    command: "cp",
    syntax: "cp [sumber] [tujuan]",
    examples: ["cp catatan.txt backup.txt", "cp data.json ../archive/"],
    notes: [
      "Secara default, 'cp' hanya menyalin file. Untuk menyalin folder beserta seluruh isinya, Anda harus menggunakan flag '-r' (recursive)."
    ],
    exerciseIds: ["ex-cp-01"],
    requiredPoints: 10,
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
    examples: ["rm catatan.txt", "rm temp.log"],
    notes: [
      "Hati-hati! File yang dihapus di terminal Linux tidak masuk ke Recycle Bin / Trash, melainkan langsung terhapus secara permanen."
    ],
    exerciseIds: ["ex-rm-01"],
    requiredPoints: 10,
    isLocked: true
  },
  {
    moduleId: "rm-r",
    title: "Menghapus Folder dengan rm -r",
    level: 3,
    summary: "Menghapus folder beserta seluruh isinya secara rekursif.",
    commandMeaning: "remove recursive",
    command: "rm -r",
    syntax: "rm -r [nama_folder]",
    examples: ["rm -r folder-lama", "rm -rf cache_dir"],
    notes: [
      "Peringatan Keras! Command 'rm -r' atau 'rm -rf' sangat berbahaya jika salah menentukan target folder.",
      "Gunakan selalu dengan ekstra teliti. Sekali terhapus, data tidak bisa dikembalikan sama sekali."
    ],
    isDangerous: true,
    exerciseIds: ["ex-rmr-01"],
    requiredPoints: 15,
    isLocked: true
  },

  // LEVEL 4
  {
    moduleId: "vim",
    title: "Mengedit File dengan Vim",
    level: 4,
    summary: "Membuka dan mengedit file teks langsung di dalam terminal menggunakan text editor Vim.",
    command: "vim",
    syntax: "vim [nama_file]",
    examples: ["vim catatan.txt", "vim index.html"],
    notes: [
      "Vim memiliki beberapa mode kerja utama: Normal Mode, Insert Mode, dan Command Mode.",
      "Secara default saat membuka file, Anda berada di Normal Mode. Anda tidak bisa mengetik teks langsung.",
      "Tekan tombol 'i' untuk masuk ke Insert Mode agar bisa mengetik teks.",
      "Tekan tombol 'Esc' untuk keluar dari Insert Mode kembali ke Normal Mode.",
      "Untuk menyimpan dan keluar, dari Normal Mode ketik ':wq' lalu tekan Enter. Untuk keluar tanpa menyimpan, ketik ':q!' lalu tekan Enter.",
      "Jika terminal terasa stuck atau terkunci, Anda bisa menekan tombol Ctrl + C untuk membatalkan proses yang berjalan."
    ],
    exerciseIds: ["ex-vim-01", "ex-vim-02"],
    requiredPoints: 20,
    isLocked: true
  },

  // LEVEL 5
  {
    moduleId: "permission-intro",
    title: "Konsep Permission Linux Dasar",
    level: 5,
    summary: "Memahami sistem hak akses file/folder (permission) di Linux.",
    command: "chmod",
    syntax: "chmod [permission_oktal] [nama_file]",
    examples: ["chmod 777 script.sh", "chmod 400 rahasia.txt"],
    notes: [
      "Ada 3 kelompok pengguna (user): Owner/User (pemilik), Group (kelompok), dan Others (pengguna umum).",
      "Ada 3 hak akses dasar dengan nilai oktalnya:\n- Read (r) = 4\n- Write (w) = 2\n- Execute (x) = 1",
      "Angka permission diperoleh dengan menjumlahkan nilai hak akses untuk masing-masing kelompok (contoh: r+w = 4+2 = 6).",
      "Contoh: chmod 777 memberikan akses penuh (read+write+execute = 7) ke Owner, Group, dan Others.",
      "Contoh: chmod 400 memberikan akses read (4) hanya ke Owner. Group dan Others tidak memiliki akses sama sekali (0)."
    ],
    exerciseIds: ["ex-perm-01", "ex-perm-02"],
    requiredPoints: 30,
    isLocked: true
  },

  // LEVEL 6
  {
    moduleId: "ls-l",
    title: "Membaca Permission dari ls -l",
    level: 6,
    summary: "Melihat dan memahami representasi hak akses file melalui format detail ls -l.",
    command: "ls -l",
    syntax: "ls -l [nama_file_atau_folder]",
    examples: ["ls -l", "ls -la file.txt"],
    notes: [
      "Output 'ls -l' diawali dengan string permission 10 karakter, contoh: -rw-r--r--",
      "Karakter ke-1: tipe data ('-' = file biasa, 'd' = direktori/folder).",
      "Karakter ke-2 s/d 4: hak akses Owner (contoh: rw- = read & write).",
      "Karakter ke-5 s/d 7: hak akses Group (contoh: r-- = hanya read).",
      "Karakter ke-8 s/d 10: hak akses Others (contoh: r-- = hanya read)."
    ],
    exerciseIds: ["ex-lsl-01", "ex-lsl-02"],
    requiredPoints: 20,
    isLocked: true
  },

  // LEVEL 7
  {
    moduleId: "chmod-numeric",
    title: "chmod Angka (Numeric Mode)",
    level: 7,
    summary: "Mengatur hak akses file/folder secara presisi menggunakan angka representasi oktal.",
    command: "chmod",
    syntax: "chmod [tiga_digit_angka] [nama_file]",
    examples: ["chmod 644 index.php", "chmod 755 public_html", "chmod 600 config.php"],
    notes: [
      "Rekomendasi standar keamanan website:\n- File php/html biasa: 644 (Owner: rw, Group: r, Others: r)\n- Folder/direktori: 755 (Owner: rwx, Group: rx, Others: rx)",
      "Hindari menggunakan permission 777 untuk file website karena sangat berisiko keamanan (siapa saja bisa memodifikasi dan mengeksekusi file tersebut)."
    ],
    exerciseIds: ["ex-chmodnum-01", "ex-chmodnum-02"],
    requiredPoints: 30,
    isLocked: true
  },

  // LEVEL 8
  {
    moduleId: "chmod-symbolic",
    title: "chmod Simbolik (Symbolic Mode)",
    level: 8,
    summary: "Mengubah hak akses file/folder menggunakan simbol representasi kelompok user (+/-/= dan rwx).",
    command: "chmod",
    syntax: "chmod [user_group_others][+/-][rwx] [nama_file]",
    examples: ["chmod u+x run.sh", "chmod g-w config.php", "chmod o-r data.json", "chmod a+r readme.md"],
    notes: [
      "Simbol kelompok:\n- u = user/owner\n- g = group\n- o = others\n- a = all (semua kelompok sekaligus)",
      "Simbol aksi:\n- '+' = menambahkan hak akses\n- '-' = mencabut/menghapus hak akses\n- '=' = menetapkan hak akses secara mutlak"
    ],
    exerciseIds: ["ex-chmodsym-01", "ex-chmodsym-02"],
    requiredPoints: 20,
    isLocked: true
  },

  // LEVEL 9
  {
    moduleId: "chown",
    title: "Mengubah Pemilik dengan chown",
    level: 9,
    summary: "Mengubah pemilik (owner) dan kelompok (group) suatu file atau folder.",
    commandMeaning: "change owner",
    command: "chown",
    syntax: "chown [owner] [nama_file]\nchown [owner]:[group] [nama_file]",
    examples: ["chown admin web.log", "chown user:group config.json", "chown -R www-data:www-data public_html/"],
    notes: [
      "Gunakan flag '-R' untuk mengubah owner secara rekursif (termasuk semua file dan folder di dalamnya).",
      "Pemberitahuan: Command chown biasanya membutuhkan hak akses Administrator/Root (sudo chown...) untuk bisa dieksekusi di server Linux sungguhan."
    ],
    requiresAdmin: true,
    exerciseIds: ["ex-chown-01", "ex-chown-02"],
    requiredPoints: 25,
    isLocked: true
  },

  // LEVEL 10
  {
    moduleId: "cpanel",
    title: "Permission di cPanel File Manager",
    level: 10,
    summary: "Memahami cara mengubah hak akses file/folder secara visual melalui File Manager cPanel hosting.",
    command: "cpanel",
    syntax: "visual action (no terminal command)",
    examples: [
      "1. Masuk ke File Manager cPanel.",
      "2. Klik kanan file/folder, pilih 'Change Permissions'.",
      "3. Centang kotak r/w/x sesuai kebutuhan (misal 644 atau 755)."
    ],
    notes: [
      "cPanel File Manager menyediakan antarmuka checklist yang intuitif. Mencontreng kotak Read/Write/Execute otomatis menjumlahkan nilai oktal di bagian bawah dialog.",
      "Meskipun dilakukan secara visual dengan mouse, di balik layar cPanel mengeksekusi perintah chmod yang setara pada server hosting."
    ],
    exerciseIds: ["ex-cpanel-01", "ex-cpanel-02"],
    requiredPoints: 20,
    isLocked: true
  }
];
