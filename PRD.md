# PRD.md — Linux Command Quest

**Versi Dokumen:** 1.0
**Status:** Final — Siap untuk AI Coding Agent
**Tipe Dokumen:** Product Requirement Document (PRD)
**Produk:** Linux Command Quest — Platform E-Learning Interaktif Belajar Command Linux

---

## 1. Overview Produk

**Linux Command Quest** adalah website e-learning interaktif berbasis web untuk belajar command line Linux dari level dasar hingga menengah, dengan fokus khusus pada manajemen file/folder dan permission system (chmod, chown, cPanel).

Produk ini mengadaptasi pola **course online + latihan praktik langsung**: pengguna membaca materi singkat dalam format "card pembelajaran", melihat contoh command nyata, lalu mengetik command tersebut pada terminal simulator untuk menyelesaikan latihan. Sistem akan memvalidasi jawaban secara otomatis, memberi poin jika benar, dan menampilkan tombol "Lihat Jawaban" jika pengguna gagal 3 kali berturut-turut.

Seluruh progres belajar (poin, modul selesai, command yang dikuasai, badge) disimpan secara lokal di browser pengguna menggunakan `localStorage`, sehingga aplikasi dapat berjalan sebagai MVP tanpa backend/database.

Produk ini dibangun dengan Next.js App Router, TypeScript, Tailwind CSS, dan shadcn/ui, dengan tema light mode hijau-oranye yang profesional dan bersih, terinspirasi dari dashboard course modern dan SaaS learning platform.

---

## 2. Background Masalah

1. Banyak pemula (siswa/mahasiswa) kesulitan memahami command line Linux karena materi yang tersedia umumnya berbentuk teks statis (PDF, slide, artikel blog) tanpa kesempatan praktik langsung.
2. Pemula sering bingung membedakan command yang mirip (`mv` vs `cp`, `rm` vs `rm -r`) karena tidak ada simulasi langsung yang aman untuk dicoba.
3. Materi permission Linux (`chmod`, `chown`, notasi `rwx`, representasi angka oktal) adalah salah satu topik paling sulit dipahami pemula karena sifatnya abstrak dan jarang dijelaskan dengan latihan bertahap.
4. Tidak ada media belajar yang menggabungkan teori singkat + command nyata + validasi jawaban otomatis + sistem motivasi (poin/badge) khusus untuk command Linux dasar-menengah, termasuk kebutuhan praktis seperti permission di cPanel hosting.
5. Pengguna yang akan menghadapi tes atau praktikum command Linux membutuhkan alat latihan cepat yang terstruktur per level, bukan dokumentasi panjang yang harus dibaca dari awal.

---

## 3. Target Pengguna

| Segmen | Deskripsi |
|---|---|
| Siswa/Mahasiswa Pemula | Belum pernah/baru mulai memakai terminal Linux, butuh pembelajaran bertahap dari nol. |
| Pengguna Lingkungan Baru | Pengguna yang baru menggunakan terminal di CoCalc, Debian, Ubuntu, VPS, atau hosting berbasis Linux. |
| Pengguna cPanel/Hosting | Pengguna yang perlu memahami permission file/folder untuk mengelola website di hosting (cPanel File Manager). |
| Pelajar Persiapan Tes/Praktikum | Pengguna yang membutuhkan media latihan cepat sebelum ujian atau tes command Linux. |

**Asumsi tingkat teknis:** Pengguna awam terhadap terminal, belum tentu paham istilah seperti "direktori", "argumen", atau "flag". Bahasa materi harus sederhana dan langsung ke contoh.

---

## 4. Tujuan Produk

1. Membantu pemula belajar command Linux secara bertahap, dari command paling dasar hingga konsep permission yang lebih kompleks.
2. Mengubah catatan/materi Linux statis menjadi pengalaman course interaktif yang menyenangkan.
3. Memastikan pengguna memahami empat aspek setiap command: **arti, fungsi, format, dan contoh penggunaan**.
4. Menyediakan latihan berbasis input command nyata (bukan pilihan ganda) agar pengguna terbiasa mengetik command yang benar.
5. Menerapkan sistem poin, progress tracking, dan unlock materi bertahap untuk meningkatkan motivasi belajar (gamifikasi).
6. Menjadi media latihan cepat dan efektif sebelum pengguna menghadapi tes/praktikum command Linux.

---

## 5. Scope MVP

MVP **WAJIB** mencakup:

1. Landing page dengan hero section, deskripsi, CTA, dan preview fitur.
2. Dashboard belajar yang menampilkan daftar modul, progress, dan total poin.
3. Minimal **10 modul materi**, mencakup Level 1 sampai Level 10 sesuai kurikulum di Bagian 10.
4. Minimal **20 latihan command interaktif** tersebar di seluruh modul.
5. Sistem validasi jawaban command (normalisasi teks, dukungan multi-jawaban benar).
6. Sistem poin dan progress yang tersimpan secara persisten via `localStorage`.
7. Tombol "Lihat Jawaban" yang muncul otomatis setelah 3 kali salah pada satu latihan.
8. Desain light theme dengan warna utama hijau dan aksen oranye, menggunakan shadcn/ui.
9. Tampilan responsif (mobile dan desktop).
10. Deploy-ready untuk platform Vercel.
11. Halaman Progress yang menampilkan ringkasan pencapaian belajar pengguna.
12. Sistem badge/achievement dasar (minimal 5 badge sesuai Bagian 12).

---

## 6. Non-Scope

Fitur berikut **TIDAK** termasuk dalam MVP dan tidak perlu dibangun pada tahap ini:

1. Sistem autentikasi/login pengguna (akun, email, password).
2. Database backend (Supabase/Firebase) — disimpan sebagai catatan untuk versi lanjutan, bukan kebutuhan MVP.
3. Terminal Linux sungguhan (sandboxed shell execution) — yang dibangun adalah **terminal simulator UI** untuk input teks command, bukan eksekusi shell nyata.
4. Sistem leaderboard multi-user / kompetisi antar pengguna.
5. Fitur sosial (komentar, forum diskusi, share progress ke media sosial).
6. Sertifikat kelulusan otomatis (PDF certificate generator).
7. Materi lanjutan di luar kurikulum (misalnya scripting Bash, cron job, networking, SSH advanced) — fokus MVP murni pada manajemen file/folder dan permission.
8. Mode gelap (dark mode) — tema MVP hanya light theme.
9. Sistem pembayaran/monetisasi.
10. Multi-bahasa (i18n) — MVP menggunakan Bahasa Indonesia sebagai bahasa utama.

---

## 7. User Flow

### 7.1 Flow Utama Pengguna Baru

```
Landing Page
   -> Klik "Mulai Belajar"
      -> Dashboard Belajar (progress 0%, Level 1 terbuka, level lain terkunci)
         -> Klik modul pertama (mkdir)
            -> Halaman Modul: baca materi singkat + contoh command
               -> Scroll ke Latihan Interaktif
                  -> Ketik command -> Submit
                     -> [Benar] -> Feedback positif + poin bertambah
                        -> Jika semua latihan modul selesai -> Unlock modul berikutnya
                           -> Kembali ke Dashboard atau lanjut ke modul berikutnya
                     -> [Salah, percobaan < 3] -> Feedback "hampir benar" + percobaan +1
                     -> [Salah, percobaan = 3] -> Tampilkan tombol "Lihat Jawaban"
                        -> Klik "Lihat Jawaban" -> Jawaban ditampilkan, poin latihan berkurang
```

### 7.2 Flow Pengguna Kembali (Returning User)

```
Landing Page / Dashboard
   -> Sistem membaca localStorage
      -> Tampilkan progress terakhir (poin, modul selesai, level terbuka)
         -> Klik "Lanjutkan Belajar" -> Diarahkan ke modul pertama yang belum selesai
```

### 7.3 Flow Melihat Progress

```
Navbar / Sidebar -> Klik "Progress"
   -> Halaman Progress
      -> Tampilkan total poin, modul selesai, akurasi jawaban, badge, command yang dikuasai
```

### 7.4 Aturan Penguncian Modul (Locking Logic)

- Modul Level `n+1` terkunci (`isLocked = true`) sampai seluruh latihan wajib pada modul Level `n` diselesaikan dengan status benar (baik dijawab langsung maupun setelah "Lihat Jawaban").
- Status "selesai dengan show answer" tetap menghitung modul sebagai *completed* (agar pengguna tidak terjebak), namun ditandai berbeda secara visual (misalnya badge kecil "Dibantu") dan poin yang didapat lebih kecil.

---

## 8. Daftar Halaman

| No | Halaman | Route (saran) | Deskripsi Singkat |
|---|---|---|---|
| 1 | Landing Page | `/` | Halaman pertama, perkenalan produk dan CTA mulai belajar |
| 2 | Dashboard Belajar | `/dashboard` | Daftar modul, progress, total poin |
| 3 | Halaman Modul | `/modul/[moduleId]` | Materi + latihan untuk satu modul spesifik |
| 4 | Halaman Latihan/Quiz | Komponen di dalam `/modul/[moduleId]` (bukan route terpisah, lihat catatan) | Area latihan command di akhir setiap materi modul |
| 5 | Halaman Progress | `/progress` | Ringkasan pencapaian, badge, akurasi |

**Catatan teknis:** Halaman "Latihan/Quiz Command" pada brief awal dapat diimplementasikan sebagai **section/komponen di dalam Halaman Modul** (bukan route terpisah), karena latihan secara konseptual adalah bagian akhir dari satu modul. Jika dibutuhkan deep-linking langsung ke latihan, gunakan anchor/hash, contoh: `/modul/mkdir#latihan`.

---

## 9. Detail Fitur

### 9.1 Landing Page

- **Hero Section**: Judul utama "Belajar Command Linux dari Nol", subjudul singkat, ilustrasi/icon terminal sebagai visual pendukung (bukan emoji).
- **Deskripsi Singkat**: 2-3 kalimat menjelaskan apa itu Linux Command Quest.
- **CTA Button**: "Mulai Belajar" — mengarahkan ke `/dashboard`. Jika pengguna sudah punya progress di localStorage, label tombol berubah menjadi "Lanjutkan Belajar".
- **Preview Progress Course**: Card ringkas menampilkan jumlah total modul, jumlah latihan, dan jumlah level (statis, bukan progress pribadi pengguna, kecuali pengguna returning).
- **Penjelasan Fitur** (grid 4 kolom/card): Materi Singkat, Latihan Command Langsung, Sistem Poin, Unlock Level Bertahap — masing-masing dengan icon dan deskripsi 1 baris. Tambahkan catatan kecil tentang fitur "Lihat Jawaban setelah 3x salah".

### 9.2 Dashboard Belajar

- **Daftar Modul**: Ditampilkan sebagai grid card, dikelompokkan per Level (1–10). Setiap card modul menampilkan: judul command, level, status (selesai/terkunci/tersedia), poin yang bisa didapat.
- **Progress Bar Global**: Persentase modul selesai dari total modul.
- **Total Poin**: Ditampilkan menonjol di bagian atas (misalnya dalam Card dengan icon Trophy).
- **Modul Selesai vs Terkunci**: Visual berbeda — modul selesai diberi checkmark hijau (`CheckCircle`), modul terkunci diberi icon gembok (`Lock`) dan dibuat non-klikable/disabled dengan tooltip "Selesaikan modul sebelumnya terlebih dahulu".
- **Tombol "Lanjutkan Belajar"**: Mengarahkan otomatis ke modul pertama yang berstatus belum selesai dan tidak terkunci.

### 9.3 Halaman Modul

Struktur konten per modul (urut dari atas ke bawah):

1. **Header Modul**: Judul command, badge Level, badge status (Belum Dimulai/Sedang Berjalan/Selesai).
2. **Pengertian Singkat**: 1-2 kalimat penjelasan command.
3. **Kepanjangan Command** (jika ada): contoh `mkdir = make directory`.
4. **Fungsi Command**: penjelasan kegunaan command tersebut.
5. **Format/Syntax Command**: ditampilkan dalam code block, contoh: `mkdir [nama_folder]`.
6. **Contoh Command**: code block dengan syntax highlighting, dilengkapi **tombol copy command** (icon `Copy`/clipboard, dengan toast "Command disalin").
7. **Catatan Penting**: ditampilkan dalam komponen `Alert` (terutama untuk command berbahaya seperti `rm -r`, atau command yang butuh akses admin seperti `chown`).
8. **Section Latihan Interaktif**: lihat Bagian 9.4 dan Bagian 11.

### 9.4 Latihan Interaktif (di dalam Halaman Modul)

- **Instruksi Soal**: pertanyaan latihan ditampilkan jelas di atas input.
- **Terminal Simulator Input**: komponen input bergaya terminal (background gelap dengan font monospace di dalam Card, kontras dengan tema utama yang light — ini adalah satu-satunya elemen yang boleh memakai nuansa gelap karena mensimulasikan terminal sungguhan), dengan prompt prefix seperti `user@linux:~$`.
- **Tombol Submit**: submit jawaban, juga bisa di-trigger dengan tombol Enter.
- **Feedback Real-Time**: setelah submit, tampilkan feedback benar (hijau, icon `CheckCircle`) atau salah (oranye/merah, icon `XCircle`) di bawah input.
- **Jumlah Percobaan**: indikator kecil "Percobaan: 2/3".
- **Tombol "Lihat Jawaban"**: muncul otomatis setelah percobaan ke-3 gagal, menggunakan komponen `Dialog` atau inline reveal dengan styling berbeda (misalnya border oranye) agar terlihat sebagai "bantuan", bukan keberhasilan normal.
- **Tombol Lanjut**: muncul setelah seluruh latihan wajib pada modul tersebut selesai dijawab (baik benar mandiri maupun dengan bantuan), mengarahkan ke modul berikutnya.

### 9.5 Halaman Progress

- **Modul Selesai**: jumlah dan daftar modul yang sudah diselesaikan (list ringkas dengan link kembali ke modul).
- **Total Poin**: angka besar dengan visual progress menuju milestone berikutnya (opsional).
- **Akurasi Jawaban**: persentase jawaban benar di percobaan pertama dibanding total seluruh percobaan latihan.
- **Command yang Sudah Dikuasai**: daftar/tag (`Badge`) seluruh command yang sudah berhasil dijawab benar minimal sekali.
- **Badge Pencapaian**: grid badge dengan status terkunci/terbuka sesuai Bagian 12.

---

## 10. Detail Materi Course

Course dibagi menjadi **10 Level** berurutan. Setiap level = 1 atau beberapa modul (lihat pemetaan modul di Bagian 15). Modul Level `n+1` terkunci sampai seluruh latihan Level `n` selesai.

### Level 1 — Dasar Terminal dan Folder

| Command | Kepanjangan | Fungsi | Contoh |
|---|---|---|---|
| `mkdir` | make directory | Membuat folder baru | `mkdir latihan-linux` |
| `ls` | list | Melihat isi file/folder di lokasi saat ini | `ls` |
| `cd` | change directory | Masuk atau berpindah folder | `cd latihan-linux` |
| `pwd` | print working directory | Melihat posisi folder saat ini | `pwd` |

### Level 2 — Dasar File

| Command | Kepanjangan | Fungsi | Contoh |
|---|---|---|---|
| `touch` | — | Membuat file kosong | `touch catatan.txt` |
| `cat` | concatenate | Melihat isi file | `cat catatan.txt` |
| `echo` | — | Menampilkan teks atau mengisi file | `echo "Saya belajar Linux" > catatan.txt` |
| `>` | — | Memasukkan output ke file dan menimpa isi lama | `echo "Halo" > file.txt` |
| `>>` | — | Menambahkan output ke file tanpa menghapus isi lama | `echo "Baris baru" >> file.txt` |

### Level 3 — Mengelola File

| Command | Kepanjangan | Fungsi | Contoh |
|---|---|---|---|
| `mv` | move | Memindahkan file atau mengganti nama file | Pindah: `mv catatan.txt folder-tujuan/` · Rename: `mv lama.txt baru.txt` |
| `cp` | copy | Menyalin file | `cp catatan.txt backup.txt` |
| `rm` | remove | Menghapus file | `rm catatan.txt` |
| `rm -r` | remove recursive | Menghapus folder beserta isinya — **WAJIB tampilkan warning bahaya** | `rm -r folder-lama` |

**Catatan khusus coder:** Command `rm -r` harus ditandai dengan komponen `Alert` bervariant destructive/warning yang menjelaskan bahwa command ini tidak bisa dibatalkan (irreversible) di Linux sungguhan.

### Level 4 — Mengedit File dengan Vim

Materi non-command (konseptual), sajikan dalam format step-by-step dengan komponen `Accordion` atau `Tabs`:

1. **Membuka file**: `vim nama_file` → contoh: `vim catatan.txt`
2. **Mode di Vim**:
   - Normal mode (mode default saat membuka file)
   - Insert mode (mode untuk mengetik/edit teks)
   - Command mode (mode untuk perintah simpan/keluar)
3. **Masuk ke Insert Mode**: tekan `i`. (Catatan: jelaskan bahwa tombol utama tetap `i` meskipun pada keyboard/layout tertentu mungkin perlu kombinasi tambahan.)
4. **Keluar dari Insert Mode**: tekan `Esc`.
5. **Menyimpan**:
   - `:w` → menyimpan
   - `:wq` → menyimpan dan keluar
   - `:q` → keluar (hanya jika tidak ada perubahan)
   - `:q!` → keluar paksa tanpa menyimpan
   - (Opsional disebutkan sebagai info tambahan, bukan fokus utama pemula: `:wa` = write all)
6. **Mengatasi Terminal Stuck**: tekan `Ctrl + C` untuk membatalkan proses; jika masih bermasalah, tutup dan buka ulang terminal.

**Catatan UI:** Karena Level 4 lebih konseptual (banyak istilah mode, bukan satu command tunggal), latihan untuk level ini sebaiknya berbentuk "ketik command Vim yang sesuai untuk aksi X" (lihat contoh latihan tambahan di Bagian 11.4).

### Level 5 — Permission Linux Dasar

1. **Konsep Permission**: hak akses file/folder yang menentukan siapa yang boleh membaca (read), menulis (write), dan menjalankan (execute) sebuah file.
2. **Tiga Jenis User**: Owner/User, Group, Others.
3. **Tiga Jenis Permission & Nilai Oktal**:
   - Read = `r` = 4
   - Write = `w` = 2
   - Execute = `x` = 1
4. **Contoh `chmod 777 file.txt`**: owner, group, dan others mendapat akses read+write+execute penuh (7 = 4+2+1).
5. **Contoh `chmod 400 file.txt`**: hanya owner yang bisa read; group dan others tidak punya akses sama sekali.

**Saran UI:** Gunakan kalkulator visual interaktif sederhana (opsional, nice-to-have) yang menunjukkan breakdown r/w/x → angka, untuk membantu pemahaman sebelum masuk ke latihan.

### Level 6 — Membaca Permission dari `ls -l`

1. Command: `ls -l`
2. Contoh output: `-rw-r--r--`
3. Penjelasan struktur string permission (10 karakter):
   - Karakter ke-1: tipe file (`-` = file biasa, `d` = directory)
   - Karakter ke-2 s/d 4: permission **owner**
   - Karakter ke-5 s/d 7: permission **group**
   - Karakter ke-8 s/d 10: permission **others**
4. Contoh interpretasi:
   - `-rw-r--r--` → owner: read+write, group: read, others: read
   - `drwxr-xr-x` → folder, owner: full access, group: read+execute, others: read+execute

### Level 7 — chmod Angka (Numeric Mode)

| Command | Owner | Group | Others |
|---|---|---|---|
| `chmod 644 file.txt` | read+write (6) | read (4) | read (4) |
| `chmod 755 folder` | read+write+execute (7) | read+execute (5) | read+execute (5) |
| `chmod 600 file.txt` | read+write | tidak ada akses | tidak ada akses |

**Rekomendasi umum (tampilkan sebagai catatan penting):**
- File website pada umumnya: `644`
- Folder website pada umumnya: `755`
- Hindari `777` untuk file/folder website karena terlalu terbuka dan berisiko keamanan.

### Level 8 — chmod Simbolik (Symbolic Mode)

| Command | Fungsi |
|---|---|
| `chmod u+x script.sh` | Menambah akses execute untuk user/owner |
| `chmod g-w file.txt` | Menghapus akses write untuk group |
| `chmod o-r file.txt` | Menghapus akses read untuk others |
| `chmod a+r file.txt` | Menambah akses read untuk semua (all) |

### Level 9 — chown

1. **`chown`** = change owner — fungsinya mengubah pemilik file/folder.
2. Contoh dasar: `chown user file.txt`
3. Contoh dengan owner dan group: `chown user:group file.txt`
4. Recursive (untuk seluruh isi folder): `chown -R user:group folder/`
5. **Catatan penting**: command ini umumnya membutuhkan akses admin/root pada server tertentu — tampilkan dalam komponen `Alert`.

### Level 10 — Permission di cPanel

Materi konseptual (tanpa command terminal), sajikan dalam format step-by-step bernomor dengan visual icon folder/file:

1. Mengubah permission lewat **File Manager** di cPanel.
2. Klik kanan pada file/folder yang ingin diubah.
3. Pilih opsi **Change Permissions**.
4. Centang kombinasi **Read, Write, Execute** sesuai kebutuhan (untuk Owner, Group, Public/World).
5. Klik **Save** untuk menyimpan perubahan permission.
6. **Rekomendasi umum**: File → `644`, Folder → `755`.
7. **Perbandingan**: cPanel bersifat lebih visual (klik dan centang), sedangkan terminal menggunakan command seperti `chmod` untuk hasil yang sama.

**Catatan UI Level 10:** Karena tidak ada command untuk diketik, latihan level ini bisa menggunakan format "tentukan angka permission yang tepat" (pengguna tetap mengetik jawaban berupa angka, contoh: ketik `644` untuk permission file standar), agar tetap konsisten dengan pola input command di seluruh aplikasi.

---

## 11. Sistem Latihan dan Validasi Jawaban

### 11.1 Format Setiap Latihan

Setiap exercise terdiri dari:
- `question` — teks pertanyaan/instruksi.
- `acceptedAnswers` — array string berisi satu atau lebih jawaban yang dianggap benar.
- `explanation` — penjelasan singkat yang muncul setelah pengguna menjawab benar.
- `points` — jumlah poin yang didapat jika benar pada percobaan normal.
- `maxAttemptsBeforeHint` — default `3`.

### 11.2 Contoh Latihan (Minimum Set, harus ada di MVP)

| # | Pertanyaan | Jawaban Benar | Poin |
|---|---|---|---|
| 1 | Buat folder bernama `latihan` | `mkdir latihan` | 10 |
| 2 | Lihat isi folder saat ini | `ls` | 10 |
| 3 | Buat file bernama `catatan.txt` | `touch catatan.txt` | 10 |
| 4 | Masuk ke folder `latihan` | `cd latihan` | 10 |
| 5 | Beri permission agar semua user bisa read, write, execute pada file `script.sh` | `chmod 777 script.sh` | 15 |
| 6 | Beri permission agar hanya owner yang bisa membaca file `rahasia.txt` | `chmod 400 rahasia.txt` | 15 |
| 7 | Beri permission standar file website `index.php` | `chmod 644 index.php` | 15 |
| 8 | Beri permission standar folder `public_html` | `chmod 755 public_html` | 15 |

Tambahkan minimal 12 latihan lain yang tersebar merata di seluruh 10 level (total minimal 20 latihan sesuai Scope MVP di Bagian 5), mengikuti pola command pada Bagian 10. Contoh tambahan yang disarankan: `pwd`, `cat`, `echo ... > file`, `echo ... >> file`, `mv`, `cp`, `rm`, `rm -r` (dengan latihan berbasis simulasi konsekuensi, bukan eksekusi nyata), Vim (`:wq`, `i`, `Esc`), `ls -l` (interpretasi output), `chmod` simbolik, `chown`.

### 11.3 Aturan Normalisasi Jawaban

Sebelum dibandingkan dengan `acceptedAnswers`, input pengguna diproses sebagai berikut:

1. **Trim** spasi di awal dan akhir string.
2. **Collapse multiple spaces** menjadi satu spasi tunggal (regex: `/\s+/g` → `' '`).
3. **Case-sensitive untuk nama file/folder** — jangan lowercase seluruh string, karena Linux sensitif terhadap huruf besar/kecil pada nama file.
4. **Command utama harus sesuai** — bagian command (kata pertama, misal `mkdir`, `chmod`) divalidasi tepat sesuai command yang diharapkan.

### 11.4 Dukungan Multi-Jawaban (Alternatif)

`acceptedAnswers` dapat berisi lebih dari satu variasi jawaban yang valid secara fungsional. Contoh: untuk soal "lihat detail file termasuk permission", baik `ls -l` maupun `ls -la` dapat diterima sebagai jawaban benar.

### 11.5 Alur Validasi

```
Input pengguna
   -> Normalisasi (trim, collapse spasi)
   -> Bandingkan dengan setiap item di acceptedAnswers (case-sensitive untuk nama file)
      -> [Cocok] -> Status: BENAR
      -> [Tidak cocok] -> Status: SALAH -> attemptCount += 1
```

### 11.6 Perilaku Saat Jawaban Salah

1. Tampilkan feedback singkat dan suportif, **jangan langsung memberi jawaban**. Contoh teks: "Command-nya hampir benar, coba cek lagi nama file atau urutan argumennya."
2. Tambahkan jumlah percobaan (`attemptCount`) dan tampilkan indikator visual (misal "Percobaan: 2/3").
3. Setelah `attemptCount` mencapai `maxAttemptsBeforeHint` (3), tampilkan tombol **"Lihat Jawaban"**.
4. Jika pengguna menekan "Lihat Jawaban": tampilkan jawaban yang benar, tandai exercise sebagai *completed-with-help*, dan berikan poin lebih kecil dari poin normal (saran: 0 poin atau maksimal 30% dari poin normal — keputusan final dapat dikonfigurasi di `data/exercises.ts` melalui field tambahan opsional, misal `hintPenaltyMultiplier`).

### 11.7 Perilaku Saat Jawaban Benar

1. Tampilkan feedback positif (visual hijau + icon `CheckCircle`).
2. Tampilkan `explanation` singkat yang menjelaskan mengapa jawaban tersebut benar.
3. Tambahkan `points` ke total poin pengguna (disimpan di `localStorage`).
4. Tandai command terkait sebagai "dikuasai" (untuk ditampilkan di Halaman Progress).
5. Jika seluruh exercise wajib dalam modul tersebut sudah selesai (benar mandiri atau dengan bantuan), unlock modul berikutnya secara otomatis.

---

## 12. Gamifikasi

### 12.1 Total Poin

- Akumulasi seluruh poin dari latihan yang berhasil diselesaikan, disimpan di `localStorage` dengan key dedicated (lihat Bagian 15).
- Ditampilkan secara global di Dashboard, Navbar/Sidebar (opsional), dan Halaman Progress.

### 12.2 Progress Bar

- Progress bar global di Dashboard: `(jumlah modul selesai / total modul) * 100%`.
- Progress bar per-modul di Halaman Modul: `(jumlah exercise selesai / total exercise pada modul) * 100%`.

### 12.3 Sistem Badge

| Badge | Syarat Unlock | Icon (lucide-react) |
|---|---|---|
| Terminal Beginner | Menyelesaikan seluruh modul Level 1 | `Terminal` |
| File Explorer | Menyelesaikan seluruh modul Level 2 dan 3 | `Folder` atau `FileText` |
| Vim Survivor | Menyelesaikan modul Level 4 (Vim) | `Code` |
| Permission Master | Menyelesaikan seluruh modul Level 5 s/d 9 (permission & chmod/chown) | `Shield` |
| cPanel Ready | Menyelesaikan modul Level 10 (permission cPanel) | `CheckCircle` atau icon shield variant |

Badge yang belum terbuka ditampilkan dalam keadaan *grayscale/disabled* dengan tooltip syarat unlock. Badge yang sudah terbuka ditampilkan penuh warna dengan animasi subtle (opsional, misal fade-in).

### 12.4 Unlock Level

Sequential locking: Level `n+1` hanya terbuka setelah seluruh exercise wajib di Level `n` diselesaikan (lihat aturan locking di Bagian 7.4).

### 12.5 Ringkasan Command yang Dikuasai

Ditampilkan di Halaman Progress sebagai kumpulan `Badge` kecil bertuliskan nama command (misal `mkdir`, `chmod`, `cd`), berdasarkan command yang sudah pernah dijawab benar minimal satu kali (baik mandiri maupun dengan bantuan "Lihat Jawaban", namun bisa dibedakan dengan style berbeda jika ingin lebih presisi — opsional).

---

## 13. Design System

### 13.1 Prinsip Umum

- **Mode**: Light theme saja (tidak perlu dark mode toggle pada MVP).
- **Nuansa**: clean SaaS learning platform / dashboard course modern — banyak white space, card dengan border halus dan shadow lembut, bukan flat tanpa elevation sama sekali.
- **Tidak menggunakan emoji** sebagai elemen desain utama (judul, badge, notifikasi). Gunakan icon profesional dari `lucide-react`.
- Pengecualian nuansa gelap: **hanya pada komponen Terminal Simulator** (input latihan command), karena merepresentasikan tampilan terminal sungguhan.

### 13.2 Palet Warna (saran token Tailwind/shadcn)

| Token | Penggunaan | Contoh Hex (saran) |
|---|---|---|
| `primary` (Green) | Tombol utama, progress bar, status selesai, link aktif | `#16A34A` (green-600) |
| `primary-foreground` | Teks di atas warna primary | `#FFFFFF` |
| `accent` (Orange) | Highlight, badge spesial, warning ringan, CTA sekunder | `#F97316` (orange-500) |
| `background` | Latar belakang utama | `#FFFFFF` atau `#FAFAFA` (off-white) |
| `card` | Latar belakang card | `#FFFFFF` dengan border `#E5E7EB` dan shadow halus |
| `destructive` | Warning bahaya (misal `rm -r`), jawaban salah | `#DC2626` (red-600) — gunakan secukupnya, jangan dominan |
| `muted-foreground` | Teks sekunder/deskripsi | `#6B7280` (gray-500) |

### 13.3 Tipografi

- Font sans-serif modern dan mudah dibaca (saran: `Inter`, `Geist`, atau font default Next.js/shadcn).
- Untuk code block, command syntax, dan terminal simulator: font monospace (saran: `JetBrains Mono`, `Fira Code`, atau `ui-monospace`).
- Hierarki ukuran: Heading besar untuk judul halaman, heading sedang untuk judul modul, body text nyaman dibaca (minimal 16px untuk teks utama).

### 13.4 Komponen Visual Khusus

- **Card Modul**: border tipis, shadow lembut, hover state dengan sedikit elevation/scale.
- **Terminal Simulator**: background gelap (`#1E1E1E` atau sejenis), font monospace hijau/putih, prompt prefix custom (`user@linux:~$`), tetap dalam bingkai `Card` agar konsisten dengan layout sekitarnya yang light.
- **Progress Bar**: warna primary (hijau) dengan track abu-abu muda.
- **Badge Locked vs Unlocked**: locked = grayscale + icon `Lock`, unlocked = warna penuh + icon sesuai konteks.

### 13.5 Icon yang Digunakan (lucide-react)

`Terminal`, `Folder`, `FileText`, `Lock`, `Shield`, `CheckCircle`, `XCircle`, `Trophy`, `BookOpen`, `PlayCircle`, `Code`, `HelpCircle`, `Copy` (untuk tombol copy command), `ChevronRight`/`ArrowRight` (navigasi lanjut).

---

## 14. Tech Stack

| Kategori | Pilihan |
|---|---|
| Framework | Next.js (App Router) |
| Bahasa | TypeScript |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Icon | lucide-react |
| State/Persistensi MVP | `localStorage` (poin, progress, modul selesai) |
| Database (opsional, versi lanjut) | Supabase atau Firebase — **tidak digunakan di MVP** |
| Deployment | Vercel |

### 14.1 Catatan Penting untuk Coder — Wajib Menggunakan shadcn MCP

Sebelum membangun UI, coder/AI agent **wajib** menggunakan **MCP shadcn** (melalui Antigravity atau AI coding environment yang digunakan) untuk:

1. **Mencari** komponen shadcn/ui yang relevan dengan kebutuhan setiap halaman.
2. **Mengambil contoh implementasi** resmi dari komponen tersebut sebelum menulis kode custom.
3. **Menginstall** komponen shadcn/ui yang diperlukan melalui MCP, bukan copy-paste manual tanpa verifikasi.
4. **Menjaga konsistensi** desain dan kualitas kode sesuai standar shadcn/ui resmi.

Komponen minimum yang harus dicari & dipasang melalui MCP shadcn: `Button`, `Card`, `Badge`, `Progress`, `Tabs`, `Accordion`, `Input`, `Alert`, `Dialog`, `Sheet`, `Tooltip`, `Toast`/`Sonner`, dan komponen `Navigation`/`Menu`. Lihat daftar lengkap di Bagian 17.

### 14.2 Constraint Khusus

- **Jangan membuat kode aplikasi pada tahap ini** — dokumen ini adalah PRD murni untuk dibaca dan dieksekusi oleh AI coding agent pada tahap pengembangan berikutnya.
- Terminal simulator pada latihan adalah **UI input teks biasa**, bukan shell execution sungguhan — tidak perlu sandboxing/eksekusi command nyata di server.

---

## 15. Struktur Data

### 15.1 Lokasi File Data

Course disimpan sebagai data statis TypeScript, bukan hardcode di dalam komponen UI:

- `data/modules.ts` — seluruh definisi modul/materi.
- `data/exercises.ts` — seluruh definisi latihan, dikelompokkan per `moduleId`.
- `data/badges.ts` — definisi badge dan syarat unlock-nya (opsional, bisa digabung ke `modules.ts` jika lebih sederhana).

### 15.2 Interface `Module`

```typescript
interface Module {
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
```

### 15.3 Interface `Exercise`

```typescript
interface Exercise {
  exerciseId: string;              // contoh: "ex-mkdir-01"
  moduleId: string;                // relasi ke Module.moduleId
  question: string;                // pertanyaan/instruksi latihan
  acceptedAnswers: string[];       // satu atau lebih jawaban valid
  explanation: string;             // penjelasan setelah benar
  points: number;                  // poin saat dijawab benar mandiri
  maxAttemptsBeforeHint: number;   // default: 3
  hintPenaltyMultiplier?: number;  // opsional, default 0 (poin 0 jika pakai "Lihat Jawaban")
}
```

### 15.4 Struktur Data Progress di `localStorage`

```typescript
interface UserProgress {
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
```

**Key localStorage yang disarankan:** `linux-command-quest:progress` (single JSON object berisi seluruh struktur `UserProgress` di atas, agar mudah dibaca/ditulis sekaligus dan menghindari banyak key terpisah).

### 15.5 Logika Perhitungan `isLocked` (Runtime, Bukan Statis)

`isLocked` pada `Module` sebaiknya **tidak disimpan permanen** di data statis, melainkan dihitung secara dinamis saat render berdasarkan:

```
isLocked(module) = module.level > 1
                    AND BELUM SEMUA modul di level (module.level - 1)
                    ada di completedModuleIds
```

Modul Level 1 selalu `isLocked = false` secara default.

---

## 16. Struktur Folder Project

Saran struktur folder Next.js App Router:

```
linux-command-quest/
├── app/
│   ├── page.tsx                     # Landing Page
│   ├── dashboard/
│   │   └── page.tsx                 # Dashboard Belajar
│   ├── modul/
│   │   └── [moduleId]/
│   │       └── page.tsx             # Halaman Modul + Latihan
│   ├── progress/
│   │   └── page.tsx                 # Halaman Progress
│   └── layout.tsx
├── components/
│   ├── ui/                          # komponen shadcn/ui hasil install via MCP
│   ├── landing/
│   │   ├── hero-section.tsx
│   │   └── feature-grid.tsx
│   ├── dashboard/
│   │   ├── module-card.tsx
│   │   └── progress-summary.tsx
│   ├── modul/
│   │   ├── module-header.tsx
│   │   ├── command-example-block.tsx
│   │   └── exercise-panel.tsx
│   ├── terminal/
│   │   └── terminal-input.tsx       # komponen terminal simulator
│   └── progress/
│       ├── badge-grid.tsx
│       └── mastered-commands.tsx
├── data/
│   ├── modules.ts
│   ├── exercises.ts
│   └── badges.ts
├── lib/
│   ├── validation.ts                 # logika normalisasi & pencocokan jawaban
│   ├── storage.ts                    # helper baca/tulis localStorage
│   └── progress-utils.ts             # helper hitung isLocked, persentase progress, dll.
├── types/
│   └── index.ts                      # seluruh interface (Module, Exercise, UserProgress)
├── public/
└── README.md
```

---

## 17. Komponen UI

### 17.1 shadcn/ui (wajib dicari & dipasang via MCP shadcn — lihat Bagian 14.1)

`Button`, `Card`, `Badge`, `Progress`, `Input`, `Tabs`, `Accordion`, `Dialog`, `Alert`, `Tooltip`, `Sheet` (untuk sidebar mobile), `Toast`/`Sonner` (untuk notifikasi seperti "Command disalin"), `Separator`, `ScrollArea`.

### 17.2 Icon (lucide-react)

`Terminal`, `Folder`, `FileText`, `Lock`, `Shield`, `CheckCircle`, `XCircle`, `Trophy`, `BookOpen`, `PlayCircle`, `Code`, `HelpCircle`, ditambah `Copy`, `ChevronRight`/`ArrowRight` untuk navigasi.

### 17.3 Pemetaan Komponen ke Fitur

| Fitur | Komponen shadcn/ui Terkait |
|---|---|
| Tombol CTA, Submit, Lanjut | `Button` |
| Card Modul, Card Fitur, Card Materi | `Card` |
| Status Selesai/Terkunci, Tag Command Dikuasai | `Badge` |
| Progress Bar Global & Per-Modul | `Progress` |
| Input Jawaban Command | `Input` (dikustomisasi jadi Terminal Input) |
| Mode Vim (Normal/Insert/Command) | `Tabs` |
| Catatan Penting, Detail Tambahan | `Accordion` |
| Konfirmasi/Reveal Jawaban | `Dialog` |
| Warning command berbahaya (`rm -r`), info `chown` | `Alert` |
| Tooltip syarat unlock badge/modul terkunci | `Tooltip` |
| Sidebar navigasi modul (mobile) | `Sheet` |
| Notifikasi "Command disalin" | `Toast`/`Sonner` |
| Pemisah antar section | `Separator` |
| Daftar modul panjang di sidebar/dashboard | `ScrollArea` |

---

## 18. Acceptance Criteria

Website dianggap **selesai (Definition of Done)** jika seluruh poin berikut terpenuhi:

1. ✅ User bisa memulai dari modul pertama (Level 1, `mkdir`) tanpa hambatan.
2. ✅ User bisa membaca materi singkat setiap modul (pengertian, fungsi, format, contoh, catatan).
3. ✅ User bisa mengetik jawaban command pada terminal simulator input.
4. ✅ Sistem dapat menentukan jawaban benar/salah secara otomatis sesuai aturan normalisasi (Bagian 11.3).
5. ✅ User mendapat poin sesuai ketentuan saat menjawab benar.
6. ✅ User tidak bisa melanjutkan ke modul berikutnya jika latihan wajib pada modul saat ini belum diselesaikan.
7. ✅ Jika salah 3 kali berturut-turut pada satu latihan, tombol "Lihat Jawaban" muncul.
8. ✅ Progress (poin, modul selesai, badge, command dikuasai) tetap tersimpan setelah browser di-refresh (persisten via `localStorage`).
9. ✅ Tampilan UI responsif dan tetap nyaman digunakan di perangkat desktop maupun mobile.
10. ✅ Desain konsisten dengan tema light hijau-oranye, profesional, dan **tidak menggunakan emoji** sebagai elemen desain utama di seluruh halaman.
11. ✅ Minimal 10 modul materi dan minimal 20 latihan command tersedia dan dapat diakses sesuai urutan level.
12. ✅ Seluruh komponen UI inti (Button, Card, Badge, Progress, Tabs, Accordion, Input, Alert, Dialog, Sheet, Tooltip, Toast, Separator, ScrollArea) telah dipasang melalui MCP shadcn dan digunakan secara konsisten.
13. ✅ Aplikasi dapat di-deploy dan berjalan normal di Vercel.

---

## 19. Roadmap Pengembangan

### Fase 1 — Setup & Fondasi
- Inisialisasi project Next.js (App Router) + TypeScript + Tailwind.
- Setup shadcn/ui melalui MCP shadcn, install komponen dasar (`Button`, `Card`, `Badge`).
- Definisikan seluruh `types/index.ts` (interface `Module`, `Exercise`, `UserProgress`).
- Buat helper `lib/storage.ts` untuk baca/tulis `localStorage`.

### Fase 2 — Data Course
- Isi `data/modules.ts` untuk seluruh 10 Level sesuai Bagian 10.
- Isi `data/exercises.ts` dengan minimal 20 latihan sesuai Bagian 11.2 (termasuk contoh tambahan yang disarankan).
- Buat `lib/validation.ts` untuk logika normalisasi dan pencocokan jawaban (Bagian 11.3–11.5).
- Buat `lib/progress-utils.ts` untuk logika `isLocked`, persentase progress, dan perhitungan badge.

### Fase 3 — Halaman Inti
- Bangun Landing Page (Bagian 9.1).
- Bangun Dashboard Belajar (Bagian 9.2).
- Bangun Halaman Modul lengkap dengan section Latihan Interaktif (Bagian 9.3–9.4).
- Implementasikan komponen Terminal Simulator Input (`components/terminal/terminal-input.tsx`).

### Fase 4 — Gamifikasi & Progress
- Implementasikan sistem poin dan penyimpanan ke `localStorage`.
- Bangun Halaman Progress (Bagian 9.5) lengkap dengan badge grid, akurasi, dan command dikuasai.
- Implementasikan logika unlock badge (Bagian 12.3).

### Fase 5 — Polish & QA
- Review responsivitas mobile/desktop di seluruh halaman.
- Review konsistensi desain (warna, tipografi, icon) terhadap Design System (Bagian 13).
- Uji ulang seluruh Acceptance Criteria (Bagian 18) satu per satu.
- Deploy ke Vercel dan verifikasi build production berjalan normal.

---

## 20. Risiko dan Solusi

| Risiko | Dampak | Solusi |
|---|---|---|
| Pengguna mengetik command dengan spasi/format sedikit berbeda namun secara fungsi benar | Jawaban benar ditolak sistem, pengguna frustrasi | Normalisasi jawaban (trim, collapse spasi) dan dukungan `acceptedAnswers` multi-variasi (Bagian 11.3–11.4) |
| Progress hilang karena `localStorage` di-clear browser atau pindah device | Pengguna kehilangan seluruh poin dan progress | Untuk MVP, sampaikan keterbatasan ini secara implisit melalui UX (tidak perlu fitur ekspor di MVP); rencanakan migrasi ke Supabase/Firebase di versi lanjut sebagai mitigasi jangka panjang |
| Modul dengan command berbahaya (`rm -r`) disalahpahami sebagai aman untuk dicoba di sistem nyata | Risiko pengguna merusak data di Linux sungguhan akibat kurang paham bahaya `rm -r` | Tampilkan `Alert` destructive yang jelas dan eksplisit pada modul terkait, tegaskan sifat irreversible command tersebut |
| Pengguna pemula bingung dengan istilah teknis (oktal, owner/group/others) pada materi permission | Drop-off pada Level 5 ke atas | Gunakan bahasa sederhana, tabel breakdown r/w/x → angka, dan urutan materi bertahap (Level 5 sebelum Level 7) sesuai kurikulum di Bagian 10 |
| Validasi jawaban terlalu ketat untuk command dengan banyak variasi valid (misal flag tambahan) | Jawaban benar secara fungsi tetap ditolak | Selalu sertakan variasi umum di `acceptedAnswers` saat mengisi `data/exercises.ts`, terutama untuk command yang lazim punya flag alternatif (`ls -l` / `ls -la`) |
| Ketergantungan pada `localStorage` membuat data tidak sinkron antar device/browser | Pengalaman belajar terputus jika pengguna ganti perangkat | Dicatat sebagai Non-Scope MVP (Bagian 6); jadikan prioritas utama roadmap pasca-MVP (integrasi Supabase/Firebase + autentikasi ringan) |
| Coder AI agent membangun UI tanpa memanfaatkan MCP shadcn, menghasilkan komponen tidak konsisten | Desain pecah, kualitas kode menurun, sulit maintain | Tegaskan kembali instruksi wajib di Bagian 14.1 sebagai prasyarat sebelum membangun komponen UI apa pun |

---

*Akhir dokumen PRD.md — Linux Command Quest.*
