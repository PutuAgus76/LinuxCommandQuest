# Plan.md — Virtual Linux Workspace (E-Learning Command Linux)

> Dokumen ini adalah rencana implementasi teknis untuk mengembangkan website e-learning command Linux yang sudah ada menjadi platform belajar interaktif bergaya CoCalc/Colab ringan, dengan workspace virtual per user, terminal simulator, filesystem virtual berbasis Supabase, dan sistem permission Linux (owner/group/others).
>
> Dokumen ini ditulis agar dapat langsung dieksekusi secara bertahap oleh AI coding agent (Antigravity). Setiap fase dirancang independen secukupnya sehingga bisa di-review dan di-merge satu per satu, tanpa harus menunggu seluruh fitur selesai sekaligus.

---

## Daftar Isi

1. [Ringkasan Visi Pengembangan](#1-ringkasan-visi-pengembangan)
2. [Keputusan Arsitektur](#2-keputusan-arsitektur)
3. [Diagram Konseptual Data Flow](#3-diagram-konseptual-data-flow)
4. [Database Schema Detail](#4-database-schema-detail)
5. [RLS / Security Strategy](#5-rls--security-strategy)
6. [Virtual Filesystem Design](#6-virtual-filesystem-design)
7. [Permission Model](#7-permission-model)
8. [Command Parser Design](#8-command-parser-design)
9. [API Routes / Server Actions](#9-api-routes--server-actions)
10. [UI/UX Plan](#10-uiux-plan)
11. [Integrasi Course dengan Workspace](#11-integrasi-course-dengan-workspace)
12. [Phase Implementation Plan](#12-phase-implementation-plan)
13. [Risiko Teknis dan Mitigasi](#13-risiko-teknis-dan-mitigasi)
14. [Checklist Implementasi](#14-checklist-implementasi)
15. [Acceptance Criteria](#15-acceptance-criteria)

---

## 1. Ringkasan Visi Pengembangan

Saat ini aplikasi adalah e-learning Linux dengan modul belajar, poin, dan latihan mengetik command, tetapi progress kemungkinan masih berbasis lokal/parsial. Tujuan pengembangan ini adalah mengubah pengalaman belajar dari "kuis statis tentang command" menjadi "praktik command nyata di filesystem virtual milik sendiri", dengan karakteristik berikut:

- Setiap user memiliki **identitas Linux virtual** (linux_username) dan **workspace** sendiri yang persisten di database, bukan di localStorage.
- User berinteraksi lewat **terminal virtual** yang memproses command teks (bukan shell asli) dan mengubah state filesystem virtual di Supabase.
- Materi course terhubung langsung ke aksi nyata di filesystem user — modul tidak lagi sekadar "pilih jawaban benar", tetapi "buktikan command-mu benar-benar mengubah state filesystem".
- User bisa berkolaborasi lewat **group**, sehingga konsep permission Linux (owner/group/others) punya makna nyata dan bisa dipraktikkan.
- Seluruh proses berjalan aman di atas Vercel (serverless, stateless) tanpa menjalankan shell asli di server — seluruh "Linux" yang dialami user adalah simulasi yang dikontrol penuh oleh aplikasi.

Hasil akhir: pengalaman belajar yang terasa seperti punya VM Linux pribadi, tetapi sebenarnya adalah aplikasi web biasa dengan command parser dan database relasional yang merepresentasikan filesystem sebagai tree (adjacency list) di Postgres.

---

## 2. Keputusan Arsitektur

### 2.1 Pola integrasi Firebase Auth + Supabase

Ada dua opsi yang disebutkan di brief:

1. **Direct Supabase client + Supabase Third-Party Auth (Firebase sebagai issuer JWT)** — Supabase memverifikasi token Firebase langsung di edge, RLS berjalan otomatis berdasarkan klaim JWT.
2. **API Route Next.js sebagai perantara** — client mengirim Firebase ID token ke API route, server memverifikasi token via Firebase Admin SDK, lalu menjalankan query ke Supabase menggunakan service role key (server-only).

**Keputusan untuk MVP: Opsi 2 (API Route sebagai perantara), dengan RLS tetap diaktifkan sebagai defense-in-depth.**

Alasan:

- Lebih mudah dikontrol dan di-debug oleh AI coding agent — semua logika otorisasi terpusat di satu layer (API route/server action), bukan tersebar di client + RLS policy yang bergantung pada konfigurasi third-party auth yang lebih kompleks untuk disiapkan ulang.
- Service role key **tidak pernah** dikirim ke browser; semua query sensitif terjadi di server (App Router Route Handler / Server Action) sehingga lebih mudah diaudit.
- Validasi command parser (efek terhadap filesystem, permission check, dsb.) lebih natural dilakukan di server karena ada logika bisnis kompleks (path resolving, permission bitmask, dsb.) yang tidak ideal dijalankan murni lewat RLS SQL policy.
- RLS tetap diaktifkan di seluruh tabel sebagai lapisan kedua: meskipun API route adalah jalur utama, RLS mencegah kebocoran data jika suatu saat ada akses langsung dari client (misalnya untuk read-only realtime subscription di masa depan).
- Opsi 1 (third-party auth) dicatat sebagai **rencana migrasi masa depan (Phase 7, opsional)** jika nanti dibutuhkan Supabase Realtime langsung dari client (misalnya kolaborasi multi-user real-time di file explorer).

### 2.2 Pola autentikasi server-side

- Setiap request ke API route wajib menyertakan `Authorization: Bearer <Firebase ID Token>`.
- Server route memverifikasi token menggunakan **Firebase Admin SDK** (`getAuth().verifyIdToken(token)`).
- `uid` dan `email` hasil verifikasi adalah satu-satunya sumber kebenaran identitas user — **tidak pernah** dipercaya dari body request meskipun client mengirimkannya.
- Supabase diakses dari server menggunakan **service role key**, disimpan di environment variable server-only (`SUPABASE_SERVICE_ROLE_KEY`), tidak diawali `NEXT_PUBLIC_`.
- Supabase client untuk operasi read-only ringan dari client (jika dibutuhkan di masa depan) menggunakan **anon key** + RLS, terpisah dari service role client.

### 2.3 Pola eksekusi command

Command tidak dieksekusi sebagai shell asli. Alurnya:

```
User mengetik command di terminal UI
   -> Client mengirim { sessionId, rawCommand } ke POST /api/terminal/execute
   -> Server verifikasi Firebase token
   -> Server memuat session + current_directory dari Supabase
   -> Command Parser: tokenize -> parse -> validasi syntax
   -> Command Executor: validasi permission virtual -> jalankan efek ke fs_nodes
   -> Server menyimpan command_history (command, output, status)
   -> Server mengembalikan { output, newCurrentDirectory, fsDelta }
   -> Client merender output ke terminal & update file explorer
```

Seluruh "state mesin" (filesystem, current directory, permission) hidup di Supabase — client adalah view layer murni, sehingga refresh halaman atau ganti device tidak menghilangkan progress.

### 2.4 State management client

- **Zustand** dipakai untuk state UI sementara: histori output terminal yang sedang ditampilkan, status loading, tab aktif, dsb.
- **localStorage** hanya untuk preferensi UI non-kritikal (misalnya tema terakhir, ukuran panel) — eksplisit **bukan** sumber data filesystem/progress.
- Data filesystem, progress, command history selalu di-fetch ulang dari Supabase melalui API route saat dibutuhkan (dengan caching ringan di client memory, bukan persisted storage).

### 2.5 Mengapa adjacency list untuk filesystem

`fs_nodes` menggunakan pola **adjacency list** (`parent_id` self-reference) karena:

- Operasi paling sering adalah "isi 1 folder" (`ls`) dan "cari berdasarkan parent" — sangat efisien dengan index pada `(workspace_id, parent_id)`.
- Mendukung struktur tree arbitrary depth tanpa skema kaku.
- Mudah dipahami dan dipelihara oleh AI coding agent dibanding model lain (materialized path / nested set) yang lebih kompleks untuk MVP.
- Trade-off: query "ambil seluruh subtree" butuh rekursi (Postgres `WITH RECURSIVE`), tapi ini hanya dibutuhkan untuk `rm -r` dan render file explorer penuh — masih dalam batas wajar untuk skala MVP (maks 500 node/user).

---

## 3. Diagram Konseptual Data Flow

### 3.1 Alur Login & Sinkronisasi Profile

```
[Browser]
   |  1. Login via Firebase Auth (Google/Email)
   v
[Firebase Auth] --(idToken)--> [Browser]
   |
   |  2. POST /api/profile/sync  (Authorization: Bearer idToken)
   v
[Next.js API Route]
   |  3. verifyIdToken(idToken) -> { uid, email, name, picture }
   |  4. SELECT * FROM profiles WHERE firebase_uid = uid
   |     - jika tidak ada -> INSERT profiles (firebase_uid, email, display_name, avatar_url)
   |  5. SELECT * FROM workspaces WHERE owner_uid = uid
   |     - jika tidak ada -> INSERT workspaces (name='My Workspace')
   |             -> INSERT fs_nodes root (parent_id=NULL, name='/', type='directory', mode=755)
   v
[Supabase Postgres]
   |
   v
[Next.js API Route] --(profile, workspace)--> [Browser] -> redirect ke /app/workspace
```

### 3.2 Alur Eksekusi Command Terminal

```
[Terminal UI] --rawCommand, sessionId--> POST /api/terminal/execute
        |
        v
 [Auth Middleware] - verify Firebase token -> uid
        |
        v
 [Load Context] - ambil terminal_sessions (current_directory_id)
        |
        v
 [Tokenizer]  -> tokens: ["mkdir", "latihan"]
        |
        v
 [Parser]     -> AST: { command: "mkdir", args: ["latihan"], redirects: [] }
        |
        v
 [Permission Guard] -> cek write-permission pada current_directory utk owner/group/others
        |              (gagal -> output "Permission denied", status='error', simpan history, return)
        v
 [Command Handler: mkdir]
        - validasi nama (regex, panjang, tidak ada '/')
        - cek duplikasi nama dalam parent yang sama
        - cek limit node per user & limit depth
        - INSERT fs_nodes (type='directory', mode=755, owner_uid=uid)
        v
 [Audit] -> INSERT command_history (command, output, status='success')
        v
 [Response] -> { output: "", cwd: "/latihan", fsDelta: {...} }
        |
        v
 [Terminal UI] render output + [File Explorer] refresh tree
```

### 3.3 Alur Group Invite

```
[User A - Owner Group] -> POST /api/groups/invite { groupId, invitedEmail }
        |
        v
 [API Route] verify token -> cek user A adalah owner group
        |
        v
 INSERT group_invites (group_id, invited_email, invited_by_uid, status='pending', token, expires_at)
        |
        v
 (Opsional Phase lanjutan: kirim notifikasi/email via provider eksternal)
        |
        v
[User B login] -> GET daftar invite WHERE invited_email = email(User B)
        |
        v
[User B] -> POST /api/groups/accept { inviteId }
        |
        v
 [API Route] verify invited_email == email user login
        -> UPDATE group_invites SET status='accepted'
        -> INSERT group_members (group_id, user_uid=B, role='member')
```

### 3.4 Alur Validasi Exercise berbasis Filesystem

```
[Course Module UI] -> "Buat folder bernama latihan-linux"
        |
        v
 User mengetik command di terminal -> dieksekusi via alur 3.2 (state fs_nodes berubah)
        |
        v
 User klik "Cek Jawaban" -> POST /api/course/complete-exercise { moduleId, exerciseId }
        |
        v
 [API Route] verify token -> ambil rule validasi exercise (dari config statis/DB)
        - rule: EXISTS fs_nodes WHERE workspace_id=ws AND parent_id=root AND name='latihan-linux' AND type='directory'
        |
        v
 [Validator] jalankan query/cek sesuai rule -> true/false
        |
        v
 jika true:
   UPDATE course_progress SET status='completed', score=...
   INSERT exercise_attempts (is_correct=true, points_awarded=...)
 jika false:
   INSERT exercise_attempts (is_correct=false, points_awarded=0)
        |
        v
 Response -> { success, message, pointsAwarded } -> UI tampilkan feedback
```

---

## 4. Database Schema Detail

Seluruh tabel dibuat di skema `public` Supabase Postgres. `uuid` menggunakan `gen_random_uuid()` (extension `pgcrypto`/`pgcrypto` built-in via `uuid-ossp` atau `pgcrypto`). Semua tabel memakai `timestamptz` dan trigger `updated_at`.

### 4.0 Extension & Util

```sql
create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
```

### 4.1 profiles

```sql
create table profiles (
  id uuid primary key default gen_random_uuid(),
  firebase_uid text unique not null,
  email text unique not null,
  display_name text,
  linux_username text unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_firebase_uid on profiles(firebase_uid);

-- linux_username: huruf kecil, angka, underscore, dash, 3-20 karakter
alter table profiles
  add constraint chk_linux_username_format
  check (linux_username is null or linux_username ~ '^[a-z][a-z0-9_-]{2,19}$');

create trigger trg_profiles_updated_at
before update on profiles
for each row execute function set_updated_at();
```

### 4.2 workspaces

```sql
create table workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_uid text not null,
  name text not null default 'My Workspace',
  slug text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_workspaces_owner_uid on workspaces(owner_uid);
create unique index uq_workspaces_owner_single on workspaces(owner_uid)
  where slug is null; -- MVP: 1 workspace utama per user

create trigger trg_workspaces_updated_at
before update on workspaces
for each row execute function set_updated_at();
```

> Catatan: skema dirancang agar 1 user = 1 workspace utama untuk MVP, tetapi struktur tabel tetap mendukung multi-workspace di masa depan (cukup hapus unique index di atas).

### 4.3 fs_nodes

```sql
create table fs_nodes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  parent_id uuid references fs_nodes(id) on delete cascade,
  type text not null check (type in ('file', 'directory')),
  name text not null,
  content text,
  mode int not null default 644,
  owner_uid text not null,
  group_id uuid references groups(id) on delete set null,
  size int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,

  constraint chk_name_not_empty check (length(trim(name)) > 0),
  constraint chk_name_no_slash check (name !~ '/'),
  constraint chk_name_length check (length(name) <= 100),
  constraint chk_directory_no_content check (type <> 'directory' or content is null),
  constraint chk_file_size check (content is null or length(content) <= 51200) -- 50 KB
);

-- Nama unik dalam parent yang sama (case-sensitive), hanya untuk node yang belum dihapus
create unique index uq_fs_nodes_parent_name
  on fs_nodes(workspace_id, parent_id, name)
  where deleted_at is null;

-- Root directory: parent_id null, hanya boleh 1 root per workspace
create unique index uq_fs_nodes_single_root
  on fs_nodes(workspace_id)
  where parent_id is null and deleted_at is null;

create index idx_fs_nodes_parent on fs_nodes(parent_id) where deleted_at is null;
create index idx_fs_nodes_workspace on fs_nodes(workspace_id) where deleted_at is null;
create index idx_fs_nodes_owner on fs_nodes(owner_uid);

create trigger trg_fs_nodes_updated_at
before update on fs_nodes
for each row execute function set_updated_at();
```

> `group_id` mereferensikan tabel `groups` yang didefinisikan di 4.7 — di Postgres urutan `create table` perlu disesuaikan (buat `groups` lebih dulu, atau tambahkan FK lewat `alter table` setelah semua tabel dibuat). Dalam migration file aktual, urutan eksekusi: `profiles -> workspaces -> groups -> group_members -> group_invites -> fs_nodes -> terminal_sessions -> command_history -> course_progress -> exercise_attempts`.

### 4.4 terminal_sessions

```sql
create table terminal_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_uid text not null,
  name text default 'Terminal 1',
  current_directory_id uuid references fs_nodes(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_terminal_sessions_workspace on terminal_sessions(workspace_id);
create index idx_terminal_sessions_user on terminal_sessions(user_uid);

create trigger trg_terminal_sessions_updated_at
before update on terminal_sessions
for each row execute function set_updated_at();
```

### 4.5 command_history

```sql
create table command_history (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references terminal_sessions(id) on delete cascade,
  user_uid text not null,
  command text not null,
  output text,
  status text not null check (status in ('success', 'error')),
  created_at timestamptz not null default now()
);

create index idx_command_history_session on command_history(session_id, created_at desc);
create index idx_command_history_user on command_history(user_uid);
```

### 4.6 groups

```sql
create table groups (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  owner_uid text not null,
  created_at timestamptz not null default now()
);

create index idx_groups_workspace on groups(workspace_id);
create index idx_groups_owner on groups(owner_uid);
```

### 4.7 group_members

```sql
create table group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  user_uid text not null,
  role text not null check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  unique (group_id, user_uid)
);

create index idx_group_members_group on group_members(group_id);
create index idx_group_members_user on group_members(user_uid);
```

### 4.8 group_invites

```sql
create table group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  invited_email text not null,
  invited_by_uid text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  token text unique not null default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

create index idx_group_invites_email on group_invites(invited_email);
create index idx_group_invites_group on group_invites(group_id);
```

### 4.9 course_progress

```sql
create table course_progress (
  id uuid primary key default gen_random_uuid(),
  user_uid text not null,
  module_id text not null,
  status text not null default 'locked' check (status in ('locked', 'in_progress', 'completed')),
  score int not null default 0,
  completed_at timestamptz,
  unique (user_uid, module_id)
);

create index idx_course_progress_user on course_progress(user_uid);
```

### 4.10 exercise_attempts

```sql
create table exercise_attempts (
  id uuid primary key default gen_random_uuid(),
  user_uid text not null,
  module_id text not null,
  exercise_id text not null,
  answer text not null,
  is_correct boolean,
  points_awarded int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_exercise_attempts_user on exercise_attempts(user_uid, module_id, exercise_id);
```

---

## 5. RLS / Security Strategy

### 5.1 Prinsip dasar

> **Penting:** RLS Supabase melindungi **data aplikasi** dari akses lintas-user yang tidak sah (lapisan keamanan database). Permission Linux virtual (owner/group/others pada `fs_nodes.mode`) adalah **logika pembelajaran di dalam workspace milik satu user/grup**, dipakai untuk simulasi command seperti `chmod`/`cat`/`ls`. Keduanya independen — RLS tetap berlaku meskipun permission virtual mengizinkan, dan sebaliknya.

Karena akses utama melalui API route dengan **service role key** (yang melewati RLS), RLS berfungsi sebagai **defense-in-depth** untuk skenario:

- Kebocoran kunci/akses langsung dari client di masa depan.
- Query langsung lewat Supabase client (anon key) untuk fitur read-only ringan (opsional, Phase lanjutan).

Semua tabel diaktifkan RLS (`enable row level security`), dengan policy berbasis `auth.jwt() ->> 'sub'` **jika nanti memakai Supabase Third-Party Auth (Firebase JWT)**. Untuk MVP (akses via service role di server), policy berikut tetap disiapkan agar siap dipakai saat migrasi ke pola direct-client di masa depan, dan agar anon key tidak pernah bisa membaca data lintas user secara tidak sengaja.

### 5.2 Pola umum policy (contoh dengan asumsi klaim JWT `sub` = firebase_uid)

```sql
alter table profiles enable row level security;
alter table workspaces enable row level security;
alter table fs_nodes enable row level security;
alter table terminal_sessions enable row level security;
alter table command_history enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table group_invites enable row level security;
alter table course_progress enable row level security;
alter table exercise_attempts enable row level security;
```

```sql
-- profiles: user hanya bisa baca/update profile miliknya sendiri
create policy "profiles_select_own"
  on profiles for select
  using (firebase_uid = auth.jwt() ->> 'sub');

create policy "profiles_update_own"
  on profiles for update
  using (firebase_uid = auth.jwt() ->> 'sub');

-- workspaces: hanya owner
create policy "workspaces_owner_all"
  on workspaces for all
  using (owner_uid = auth.jwt() ->> 'sub');

-- fs_nodes: hanya node milik workspace user sendiri
create policy "fs_nodes_owner_all"
  on fs_nodes for all
  using (
    workspace_id in (
      select id from workspaces where owner_uid = auth.jwt() ->> 'sub'
    )
  );

-- terminal_sessions & command_history: hanya milik user sendiri
create policy "terminal_sessions_owner_all"
  on terminal_sessions for all
  using (user_uid = auth.jwt() ->> 'sub');

create policy "command_history_owner_all"
  on command_history for all
  using (user_uid = auth.jwt() ->> 'sub');

-- groups: owner atau member bisa select
create policy "groups_member_select"
  on groups for select
  using (
    owner_uid = auth.jwt() ->> 'sub'
    or id in (select group_id from group_members where user_uid = auth.jwt() ->> 'sub')
  );

create policy "groups_owner_modify"
  on groups for insert with check (owner_uid = auth.jwt() ->> 'sub');
create policy "groups_owner_update"
  on groups for update using (owner_uid = auth.jwt() ->> 'sub');
create policy "groups_owner_delete"
  on groups for delete using (owner_uid = auth.jwt() ->> 'sub');

-- group_members: member bisa lihat sesama anggota group yang sama
create policy "group_members_select"
  on group_members for select
  using (
    group_id in (select group_id from group_members where user_uid = auth.jwt() ->> 'sub')
  );

-- group_invites: hanya invited_email yang sama dengan email login bisa lihat/accept
create policy "group_invites_select_own"
  on group_invites for select
  using (invited_email = auth.jwt() ->> 'email');

create policy "group_invites_owner_select"
  on group_invites for select
  using (invited_by_uid = auth.jwt() ->> 'sub');

-- course_progress & exercise_attempts: hanya milik sendiri
create policy "course_progress_owner_all"
  on course_progress for all
  using (user_uid = auth.jwt() ->> 'sub');

create policy "exercise_attempts_owner_all"
  on exercise_attempts for all
  using (user_uid = auth.jwt() ->> 'sub');
```

> Catatan implementasi MVP: selama akses tetap lewat service role (server-side), policy di atas tidak diuji oleh trafik nyata sampai migrasi ke third-party auth dilakukan. **Tetap wajib dibuat sejak awal** agar tidak ada celah saat suatu saat anon key dipakai langsung dari client tanpa sengaja.

### 5.3 Validasi tambahan di level API route (karena RLS dilewati oleh service role)

Karena server menggunakan service role key, RLS tidak otomatis mencegah bug logika di server. Maka setiap API route **wajib**:

1. Selalu menyertakan filter eksplisit `workspace_id`/`owner_uid`/`user_uid` sesuai `uid` hasil verifikasi token pada setiap query — tidak pernah melakukan query tanpa filter kepemilikan.
2. Untuk operasi pada `fs_nodes`, validasi bahwa `workspace_id` node target memang milik `uid` (atau group yang relevan) sebelum melakukan write.
3. Untuk `group_invites.accept`, validasi `invited_email === decodedToken.email` sebelum update status.
4. Membuat **helper terpusat** (`assertWorkspaceOwnership(uid, workspaceId)`, `assertGroupMembership(uid, groupId)`) yang dipakai di semua route agar konsisten dan mudah diaudit, daripada menulis ulang logic otorisasi di setiap file route.

---

## 6. Virtual Filesystem Design

### 6.1 Representasi struktur

- Filesystem direpresentasikan sebagai tree menggunakan tabel `fs_nodes` (adjacency list).
- Root directory per workspace: `parent_id = NULL`, `name = '/'`, `type = 'directory'`, `mode = 755`.
- Setiap workspace **wajib** memiliki tepat satu root (dijamin oleh `uq_fs_nodes_single_root`), dibuat otomatis saat workspace dibuat (lihat alur 3.1).

### 6.2 Path resolution

Path absolut diawali `/`, path relatif dihitung dari `current_directory_id` pada `terminal_sessions`.

Algoritma resolver (pseudocode, dijalankan di server):

```ts
async function resolvePath(workspaceId: string, currentDirId: string, rawPath: string): Promise<NodeId | null> {
  const isAbsolute = rawPath.startsWith('/');
  let cursor = isAbsolute ? await getRoot(workspaceId) : currentDirId;

  const segments = rawPath.split('/').filter(Boolean); // buang string kosong dari leading '/'

  for (const segment of segments) {
    if (segment === '.') continue;
    if (segment === '..') {
      cursor = (await getNode(cursor)).parent_id ?? cursor; // root: '..' tetap di root
      continue;
    }
    const child = await findChildByName(workspaceId, cursor, segment, { type: 'directory' /* atau any, tergantung konteks */ });
    if (!child) return null; // path tidak ditemukan
    cursor = child.id;
  }
  return cursor;
}
```

Aturan tambahan:

- `~` selalu diterjemahkan ke root directory workspace user (untuk MVP, karena 1 user = 1 root; bukan home directory terpisah seperti `/home/user`).
- Segmen kosong berturut-turut (`//`) diabaikan (disamakan dengan satu `/`).
- Resolusi path untuk command yang menargetkan **node terakhir** (mis. `touch nama.txt`) memisahkan antara *parent path* (harus berupa directory yang valid & accessible) dan *nama node baru* (divalidasi terpisah, lihat 6.3).

### 6.3 Validasi nama file/folder

```ts
const NAME_REGEX = /^[^/]{1,100}$/; // tidak boleh mengandung '/', 1-100 karakter, tidak boleh kosong
const RESERVED_NAMES = new Set(['.', '..']);

function validateName(name: string) {
  if (!name || name.trim().length === 0) throw new ValidationError('Nama tidak boleh kosong');
  if (name.includes('/')) throw new ValidationError("Nama tidak boleh mengandung '/'");
  if (name.length > 100) throw new ValidationError('Nama maksimal 100 karakter');
  if (RESERVED_NAMES.has(name)) throw new ValidationError(`Nama "${name}" adalah nama reserved`);
}
```

Duplikasi nama dalam parent yang sama dicegah oleh constraint database (`uq_fs_nodes_parent_name`), tetapi tetap dicek lebih dulu di level aplikasi agar pesan error untuk user lebih ramah (bukan raw Postgres error).

### 6.4 Batasan MVP

| Batasan | Nilai | Implementasi |
|---|---|---|
| Maks ukuran content file | 50 KB | DB constraint `chk_file_size` + validasi server sebelum INSERT/UPDATE |
| Maks depth folder | 20 level | Dihitung saat resolve path / saat `mkdir`, tolak jika melebihi |
| Maks jumlah node per workspace | 500 node | `SELECT count(*) FROM fs_nodes WHERE workspace_id=... AND deleted_at IS NULL` sebelum insert, tolak jika sudah mencapai batas |
| Maks panjang nama | 100 karakter | DB constraint + validasi client |

### 6.5 Soft delete

- `rm` (tanpa `-r`) pada file: set `deleted_at = now()` (soft delete), bukan hard delete, agar bisa diaudit/dipulihkan di Phase lanjutan.
- `rm -r` pada folder: soft delete folder **dan seluruh descendant-nya** menggunakan `WITH RECURSIVE` untuk mengumpulkan semua id subtree, lalu `UPDATE ... SET deleted_at = now() WHERE id = ANY(ids)`.
- Index unik nama (`uq_fs_nodes_parent_name`) memakai kondisi `WHERE deleted_at IS NULL`, sehingga nama yang sudah dihapus bisa dipakai ulang.
- Query `ls`, path resolver, dan perhitungan limit node **selalu** memfilter `deleted_at IS NULL`.

### 6.6 File explorer read model

`GET /api/workspace/tree` mengembalikan seluruh `fs_nodes` aktif milik workspace dalam bentuk flat list `{ id, parent_id, name, type, mode, size, updated_at }`, lalu di-assemble menjadi tree di client (lebih efisien daripada query rekursif berulang untuk render UI, karena seluruh node MVP dibatasi maksimal 500).

---

## 7. Permission Model

### 7.1 Representasi mode

`mode` disimpan sebagai integer 3 digit oktal-style (disimpan sebagai int biasa, direpresentasikan dan divalidasi sebagai 3 digit 0-7), contoh: `755`, `644`, `400`, `777`.

```
Digit 1 = Owner permission
Digit 2 = Group permission
Digit 3 = Others permission

Read    = 4
Write   = 2
Execute = 1
(jumlahkan sesuai kombinasi, mis. rwx = 4+2+1 = 7)
```

### 7.2 Fungsi pengecekan akses (pseudocode)

```ts
type Scope = 'owner' | 'group' | 'others';

function getScopeDigit(mode: number, scope: Scope): number {
  const str = mode.toString().padStart(3, '0');
  if (scope === 'owner') return Number(str[0]);
  if (scope === 'group') return Number(str[1]);
  return Number(str[2]);
}

function hasPermission(node: FsNode, uid: string, userGroupIds: string[], action: 'read' | 'write' | 'execute'): boolean {
  const bit = { read: 4, write: 2, execute: 1 }[action];

  const scope: Scope =
    node.owner_uid === uid ? 'owner' :
    node.group_id && userGroupIds.includes(node.group_id) ? 'group' :
    'others';

  const digit = getScopeDigit(node.mode, scope);
  return (digit & bit) === bit;
}
```

### 7.3 Aturan per command

| Command | Permission yang diperlukan |
|---|---|
| `cat file` | `read` pada file |
| `echo > file` / `echo >> file` | `write` pada file (jika file belum ada, butuh `write` pada parent directory) |
| `ls dir` | `read` pada directory |
| `cd dir` | `execute` pada directory (mengikuti konvensi Linux: execute = boleh "masuk"/traverse) |
| `mkdir nama` (di current dir) | `write` pada current directory |
| `touch nama` | `write` pada current directory |
| `cp src dst` | `read` pada src, `write` pada parent dst |
| `mv src dst` | `write` pada parent src **dan** parent dst |
| `rm`, `rm -r` | `write` pada parent directory dari target |
| `chmod` | hanya **owner** node target (bukan sekadar permission bit, tapi cek `node.owner_uid === uid`) |
| `chown` | dibatasi: hanya **owner workspace** (untuk MVP disederhanakan menjadi: hanya pemilik workspace boleh mengubah `owner_uid`/`group_id` node di dalam workspace-nya sendiri; kolaborasi lintas-user via group memakai `group_id`, bukan `chown` lintas akun) |

### 7.4 Traversal path memerlukan execute di setiap level

Saat resolve path multi-level (mis. `cat a/b/c.txt`), server harus memvalidasi **execute permission** pada setiap directory yang dilewati (`a`, lalu `a/b`), tidak hanya pada node akhir — konsisten dengan perilaku Linux asli dan jadi bahan pembelajaran penting untuk modul permission.

### 7.5 Catatan untuk modul group

- `group_id` pada `fs_nodes` menunjuk ke grup yang **owner workspace** pilih untuk node tersebut (mis. lewat command lanjutan `chgrp`, opsional di luar MVP, atau diatur lewat UI file explorer).
- Untuk MVP, `group_id` di-set manual lewat field tambahan saat `chmod`/`chown` dijalankan oleh owner workspace, bukan oleh anggota grup lain.

---

## 8. Command Parser Design

### 8.1 Arsitektur lapisan

```
rawCommand (string)
   -> Tokenizer        (pisah berdasarkan spasi, hormati tanda kutip "...")
   -> Parser            (kenali nama command + args + redirect operator > / >>)
   -> Validator          (cek jumlah argumen sesuai command)
   -> Permission Guard   (cek hasPermission sebelum eksekusi efek)
   -> Executor           (jalankan efek ke fs_nodes via Supabase)
   -> Formatter          (susun output string seperti terminal asli)
```

Disusun sebagai **command registry** (`Record<string, CommandHandler>`) agar mudah menambah command baru di masa depan tanpa mengubah parser inti.

```ts
interface CommandContext {
  uid: string;
  workspaceId: string;
  sessionId: string;
  currentDirectoryId: string;
}

interface CommandResult {
  output: string;
  status: 'success' | 'error';
  newCurrentDirectoryId?: string; // hanya diisi oleh 'cd'
}

type CommandHandler = (args: string[], flags: Record<string, boolean>, ctx: CommandContext) => Promise<CommandResult>;

const COMMAND_REGISTRY: Record<string, CommandHandler> = {
  pwd: handlePwd,
  ls: handleLs,
  cd: handleCd,
  mkdir: handleMkdir,
  touch: handleTouch,
  cat: handleCat,
  echo: handleEcho,
  cp: handleCp,
  mv: handleMv,
  rm: handleRm,
  chmod: handleChmod,
  clear: handleClearClientOnly, // tidak menyentuh server, ditangani di client
};
```

### 8.2 Tokenizer (mendukung tanda kutip)

```ts
function tokenize(raw: string): string[] {
  const regex = /"([^"]*)"|'([^']*)'|(\S+)/g;
  const tokens: string[] = [];
  let match;
  while ((match = regex.exec(raw)) !== null) {
    tokens.push(match[1] ?? match[2] ?? match[3]);
  }
  return tokens;
}
```

Ini mendukung `mkdir "nama folder"` dan `echo "Halo dunia" > catatan.txt`.

### 8.3 Parser redirect untuk `echo`

`echo` adalah satu-satunya command MVP yang memakai redirect operator. Parser khusus:

```ts
function parseEcho(tokens: string[]): { text: string; mode: 'overwrite' | 'append'; target: string } {
  const appendIdx = tokens.indexOf('>>');
  const overwriteIdx = tokens.indexOf('>');

  if (appendIdx === -1 && overwriteIdx === -1) {
    throw new SyntaxError('echo tanpa redirect tidak didukung untuk menyimpan ke file. Gunakan: echo "teks" > file.txt');
  }

  const idx = appendIdx !== -1 ? appendIdx : overwriteIdx;
  const mode = appendIdx !== -1 ? 'append' : 'overwrite';
  const text = tokens.slice(1, idx).join(' ');
  const target = tokens[idx + 1];

  if (!target) throw new SyntaxError('Target file tidak ditemukan setelah operator redirect');
  return { text, mode, target };
}
```

### 8.4 Tabel grammar command MVP

| Command | Sintaks didukung | Catatan |
|---|---|---|
| `pwd` | `pwd` | Tidak ada argumen |
| `ls` | `ls`, `ls -l`, `ls -la`, `ls nama_folder` | Flag `-a` (tampilkan hidden, opsional MVP), `-l` (format detail: mode, owner, size, name) |
| `cd` | `cd folder`, `cd ..`, `cd /`, `cd ~` | Tanpa argumen = `cd ~` |
| `mkdir` | `mkdir nama`, `mkdir "nama dengan spasi"` | Tidak mendukung `-p` (nested) di MVP — boleh ditambah di Phase lanjutan |
| `touch` | `touch nama.txt` | Jika file sudah ada, update `updated_at` saja (idempotent, sesuai perilaku asli) |
| `cat` | `cat nama.txt` | Error jika target adalah directory |
| `echo` | `echo "teks" > file`, `echo "teks" >> file` | Lihat 8.3 |
| `cp` | `cp file.txt backup.txt`, `cp file.txt folder/` | MVP: hanya file (bukan folder rekursif) |
| `mv` | `mv lama.txt baru.txt`, `mv file.txt folder/` | Bisa untuk file maupun folder (update `parent_id` dan/atau `name`) |
| `rm` | `rm file.txt`, `rm -r folder` | Tanpa `-r` pada folder -> error "is a directory" |
| `chmod` | `chmod 777 file.txt`, dst | Validasi 3 digit, masing-masing 0-7 |
| `clear` | `clear` | Ditangani 100% di client, tidak memanggil API |

Command di luar daftar -> output: `command not found: <nama_command>`, `status: 'error'`.

### 8.5 Contoh handler: `mkdir`

```ts
async function handleMkdir(args: string[], _flags: Record<string, boolean>, ctx: CommandContext): Promise<CommandResult> {
  if (args.length === 0) return { output: 'mkdir: missing operand', status: 'error' };

  const name = args[0];
  validateName(name); // throws ValidationError -> ditangkap di layer atas, dikonversi ke CommandResult error

  const parentDir = await getNode(ctx.currentDirectoryId);
  if (!hasPermission(parentDir, ctx.uid, await getUserGroupIds(ctx.uid), 'write')) {
    return { output: `mkdir: cannot create directory '${name}': Permission denied`, status: 'error' };
  }

  await assertNodeLimit(ctx.workspaceId);
  await assertDepthLimit(parentDir);

  const existing = await findChildByName(ctx.workspaceId, parentDir.id, name);
  if (existing) return { output: `mkdir: cannot create directory '${name}': File exists`, status: 'error' };

  await insertFsNode({
    workspace_id: ctx.workspaceId,
    parent_id: parentDir.id,
    type: 'directory',
    name,
    mode: 755,
    owner_uid: ctx.uid,
  });

  return { output: '', status: 'success' };
}
```

### 8.6 Penanganan error terpusat

Seluruh handler melempar exception khusus (`ValidationError`, `PermissionError`, `NotFoundError`, `SyntaxErrorCmd`) yang ditangkap satu kali di level `executeCommand()` dan dikonversi menjadi `CommandResult` dengan pesan mirip terminal asli (mis. `bash: <cmd>: <pesan>`), supaya konsisten dan terminal terasa otentik secara nuansa tanpa benar-benar menjalankan shell.

### 8.7 Ekstensibilitas

Struktur registry memudahkan penambahan command baru di masa depan (`chown`, `grep`, `find`, `head`, `tail`) tanpa mengubah tokenizer/parser inti — cukup menambah entry baru di `COMMAND_REGISTRY` dan grammar table di dokumentasi ini.

---

## 9. API Routes / Server Actions

Semua route berada di `app/api/**/route.ts` (App Router Route Handlers), method sesuai kebutuhan, semua **wajib** memverifikasi Firebase ID token di awal via helper `verifyFirebaseToken(request)`.

| Route | Method | Auth | Input | Output | Catatan |
|---|---|---|---|---|---|
| `/api/profile/sync` | POST | Wajib | — (ambil dari token) | `{ profile, workspace }` | Idempotent: buat profile/workspace/root jika belum ada |
| `/api/workspace/init` | POST | Wajib | — | `{ workspace, rootNodeId }` | Dipanggil internal oleh `profile/sync`, bisa juga dipanggil ulang aman (idempotent) |
| `/api/workspace/tree` | GET | Wajib | `?workspaceId=` (opsional, default workspace milik user) | `{ nodes: FsNode[] }` | Untuk render file explorer |
| `/api/terminal/execute` | POST | Wajib | `{ sessionId, rawCommand }` | `{ output, status, cwd, fsChanged: boolean }` | Lihat alur 3.2 & section 8 |
| `/api/terminal/session` | POST | Wajib | `{ name? }` | `{ session }` | Membuat terminal session baru ("new terminal session" di UI) |
| `/api/terminal/history` | GET | Wajib | `?sessionId=` | `{ history: CommandHistory[] }` | Untuk panel command history |
| `/api/groups/create` | POST | Wajib | `{ name }` | `{ group }` | Pembuat otomatis jadi `role='owner'` di `group_members` |
| `/api/groups/invite` | POST | Wajib | `{ groupId, invitedEmail }` | `{ invite }` | Hanya owner group yang boleh invite |
| `/api/groups/accept` | POST | Wajib | `{ inviteId }` | `{ membership }` | Validasi `invited_email === token.email` |
| `/api/groups/reject` | POST | Wajib | `{ inviteId }` | `{ success: true }` | Sama validasi seperti accept |
| `/api/groups/list` | GET | Wajib | — | `{ groups, pendingInvites }` | Untuk halaman `/app/groups` |
| `/api/course/complete-exercise` | POST | Wajib | `{ moduleId, exerciseId }` | `{ success, message, pointsAwarded }` | Lihat alur 3.4 & section 11 |
| `/api/course/progress` | GET | Wajib | — | `{ progress: CourseProgress[] }` | Untuk sidebar progress |
| `/api/workspace/reset` | POST | Wajib | `{ confirm: true }` | `{ success: true }` | Soft-delete semua node kecuali root, reset session cwd ke root |
| `/api/settings/username` | POST | Wajib | `{ linuxUsername }` | `{ profile }` | Validasi regex + cek unik sebelum update |

### 9.1 Standar tiap route

```ts
export async function POST(request: Request) {
  const decoded = await verifyFirebaseToken(request); // throws 401 jika invalid
  const body = await request.json();
  const parsed = SomeZodSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // gunakan decoded.uid / decoded.email, JANGAN PERNAH percaya body.uid
  const result = await doSomethingSafely(decoded.uid, parsed.data);
  return NextResponse.json(result);
}
```

- Validasi input memakai **Zod** di setiap route.
- Helper `verifyFirebaseToken` ditempatkan di `lib/server/auth.ts`, dipakai ulang di semua route.
- Helper otorisasi (`assertWorkspaceOwnership`, `assertGroupMembership`, `assertGroupOwnership`) ditempatkan di `lib/server/authz.ts`.
- Supabase service-role client di-inisialisasi sekali di `lib/server/supabaseAdmin.ts`, **tidak pernah** diimpor dari file yang berjalan di client (`'use client'`).

---

## 10. UI/UX Plan

### 10.1 `/app/workspace` — Layout utama

```
┌──────────────────────────────────────────────────────────────────────┐
│ Header: [Home] Nama Workspace      Poin: 1240   [Avatar ▾]           │
├───────────────┬──────────────────────────────────┬───────────────────┤
│ Sidebar Modul │ Terminal Panel (tengah)           │ File Explorer     │
│ (BookOpen)    │                                    │ (Folder/FileText) │
│               │  $ mkdir latihan-linux             │                   │
│ ▸ Dasar Linux │  $ cd latihan-linux                │  📁 /             │
│   ✓ mkdir     │  $ touch catatan.txt                │   📁 latihan-linux│
│   ✓ cd        │  $ cat catatan.txt                  │     📄 catatan.txt│
│   ○ touch     │  bash: cat: catatan.txt: ...        │                   │
│   ○ chmod     │                                      │                   │
│               │ ┌──────────────────────────────┐    │  [History] panel  │
│ Progress: 40% │ │ $ _ ketik command di sini      │    │  (riwayat command)│
│ [▓▓▓▓░░░░░░]  │ └──────────────────────────────┘    │                   │
│               │ [New Session] [Reset Workspace]      │                   │
└───────────────┴──────────────────────────────────────┴───────────────────┘
```

- **Sidebar kiri**: `Accordion` (shadcn) berisi daftar modul, tiap item pakai `Badge` untuk status (locked/in_progress/completed) + `Progress` bar total di bagian bawah. Icon `BookOpen`, `CheckCircle`, `XCircle` sesuai status.
- **Panel tengah (Terminal)**: area output dengan font monospace, `ScrollArea` (shadcn) untuk auto-scroll, input command di bawah menggunakan `Input` shadcn dengan styling terminal (prompt prefix `username@workspace:~/path$`). Tombol `New Session` dan `Reset Workspace` pakai `Button` + `Dialog` konfirmasi untuk reset (karena destruktif).
- **Panel kanan (File Explorer)**: tree view sederhana dari hasil `/api/workspace/tree`, ikon `Folder`/`FileText` lucide-react, `Tooltip` menampilkan mode permission (mis. `rwxr-xr-x`) saat hover. Tab terpisah (`Tabs` shadcn) untuk "Explorer" vs "History" (riwayat command dengan `Table` shadcn: command, status, waktu).
- **Header**: nama workspace, total poin (`Badge`), `DropdownMenu` untuk avatar/profile dengan opsi ke `/app/settings` dan logout.

### 10.2 `/app/groups`

```
┌─────────────────────────────────────────────────────────────┐
│ [Users] Groups Saya                       [+ Buat Group]     │
├─────────────────────────────────────────────────────────────┤
│  Card: "Tim Belajar A"          [UserPlus] Invite            │
│   Anggota: 3   Role kamu: Owner                               │
│   [Lihat Anggota]                                             │
├─────────────────────────────────────────────────────────────┤
│  Undangan Masuk (pending)                                     │
│   "Tim Backend" mengundangmu — diundang oleh budi@x.com       │
│   [Terima]  [Tolak]                                           │
└─────────────────────────────────────────────────────────────┘
```

- `Card` per group, `Dialog`/`Sheet` untuk form "Buat Group" dan "Invite via Email" (`Input` email + `Button`).
- Daftar anggota ditampilkan via `Table` (`Avatar`/nama, `Badge` role).
- Notifikasi aksi (invite terkirim, berhasil join) memakai `Toast`/`Sonner`.
- Invite pending ditampilkan dengan `Alert` (icon `UserPlus`) + dua `Button` Terima/Tolak.

### 10.3 `/app/settings`

```
┌─────────────────────────────────────────────────────┐
│ [Settings] Pengaturan Akun                            │
├─────────────────────────────────────────────────────┤
│ Email login: budi@example.com (read-only)             │
│                                                         │
│ Linux Username                                          │
│ [ budi_dev          ] [Simpan]                          │
│                                                         │
│ Workspace                                                │
│ [Reset Workspace Latihan]  (destruktif, perlu konfirmasi)│
│ [Export Progress (.json)]                                 │
└─────────────────────────────────────────────────────┘
```

- Form `linux_username` pakai `Input` + validasi inline (regex sama seperti backend) + `Button` simpan yang disable saat invalid.
- Tombol "Reset Workspace" membuka `Dialog` konfirmasi (destruktif, styling pakai warna accent orange / destructive variant) sebelum memanggil `/api/workspace/reset`.
- "Export Progress" memicu download file JSON hasil `GET /api/course/progress` (client-side blob download, tidak perlu endpoint khusus tambahan untuk MVP).

### 10.4 Prinsip desain visual

- Tema **light**, warna primer **hijau** (untuk aksi positif: tombol utama, status completed/success), warna aksen **oranye** (untuk highlight/CTA sekunder, status warning/in-progress).
- Tidak memakai emoji sebagai elemen UI utama — gunakan icon `lucide-react` profesional sesuai daftar di brief (`Terminal`, `Folder`, `FileText`, `Lock`, `Shield`, `Users`, `UserPlus`, dst).
- Layout responsive: pada mobile, tiga panel (sidebar modul, terminal, file explorer) dikonversi menjadi `Sheet`/`Tabs` yang bisa di-toggle, dengan terminal sebagai tampilan default karena merupakan area interaksi utama.
- Konsisten memakai komponen shadcn/ui yang sudah terinstal — sebelum membangun komponen baru, cek dulu lewat MCP shadcn/ui apakah komponen serupa sudah tersedia (lihat instruksi khusus di awal brief).

---

## 11. Integrasi Course dengan Workspace

### 11.1 Struktur data exercise (konfigurasi statis, bisa berupa file `lib/course/modules.ts` atau tabel DB di Phase lanjutan)

```ts
interface ExerciseRule {
  type: 'node_exists' | 'node_permission' | 'current_directory' | 'command_used';
  // node_exists
  path?: string;
  nodeType?: 'file' | 'directory';
  // node_permission
  expectedMode?: number;
  // current_directory
  expectedPath?: string;
  // command_used
  expectedCommandPattern?: RegExp;
}

interface Exercise {
  id: string;
  moduleId: string;
  title: string;
  instruction: string;
  rules: ExerciseRule[]; // semua rule harus terpenuhi (AND)
  points: number;
}
```

### 11.2 Contoh konfigurasi modul (sesuai brief)

```ts
const exercises: Exercise[] = [
  {
    id: 'mkdir-basic',
    moduleId: 'modul-mkdir',
    title: 'Membuat folder pertama',
    instruction: 'Buat folder bernama "latihan-linux" di direktori utama.',
    rules: [{ type: 'node_exists', path: '/latihan-linux', nodeType: 'directory' }],
    points: 10,
  },
  {
    id: 'cd-into-folder',
    moduleId: 'modul-cd',
    title: 'Berpindah direktori',
    instruction: 'Masuk ke folder "latihan-linux" yang sudah kamu buat.',
    rules: [{ type: 'current_directory', expectedPath: '/latihan-linux' }],
    points: 10,
  },
  {
    id: 'touch-file',
    moduleId: 'modul-touch',
    title: 'Membuat file',
    instruction: 'Buat file "catatan.txt" di dalam folder "latihan-linux".',
    rules: [{ type: 'node_exists', path: '/latihan-linux/catatan.txt', nodeType: 'file' }],
    points: 10,
  },
  {
    id: 'chmod-permission',
    moduleId: 'modul-chmod',
    title: 'Mengubah permission',
    instruction: 'Ubah permission "catatan.txt" menjadi 644.',
    rules: [{ type: 'node_permission', path: '/latihan-linux/catatan.txt', expectedMode: 644 }],
    points: 15,
  },
];
```

### 11.3 Engine validasi

```ts
async function validateExercise(uid: string, workspaceId: string, exercise: Exercise): Promise<boolean> {
  for (const rule of exercise.rules) {
    const passed = await evaluateRule(workspaceId, uid, rule);
    if (!passed) return false;
  }
  return true;
}

async function evaluateRule(workspaceId: string, uid: string, rule: ExerciseRule): Promise<boolean> {
  switch (rule.type) {
    case 'node_exists': {
      const node = await resolvePathToNode(workspaceId, rule.path!);
      return !!node && (!rule.nodeType || node.type === rule.nodeType);
    }
    case 'node_permission': {
      const node = await resolvePathToNode(workspaceId, rule.path!);
      return !!node && node.mode === rule.expectedMode;
    }
    case 'current_directory': {
      const session = await getActiveSession(uid, workspaceId);
      const path = await getFullPath(session.current_directory_id);
      return path === rule.expectedPath;
    }
    case 'command_used': {
      const recent = await getRecentCommands(uid, 20);
      return recent.some(c => rule.expectedCommandPattern!.test(c.command));
    }
  }
}
```

### 11.4 Alur unlock modul

- `course_progress.status` dimulai `locked`, diubah ke `in_progress` saat user pertama kali membuka modul, dan `completed` saat seluruh exercise dalam modul lolos validasi.
- Modul berikutnya ter-unlock berdasarkan urutan statis (`modules.ts`) yang mendefinisikan `prerequisiteModuleId`, dicek di endpoint `GET /api/course/progress` saat menyusun daftar modul untuk sidebar.
- Poin (`score`) diakumulasi dari `exercise_attempts.points_awarded` per modul, ditampilkan di header sebagai total poin.

---

## 12. Phase Implementation Plan

### Phase 1 — Supabase Setup (fondasi)

- Tambah `@supabase/supabase-js` dan environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` di server-only, `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` jika dibutuhkan client read-only).
- Jalankan migration SQL: `profiles`, `workspaces` (Section 4.1–4.2) + extension `pgcrypto` + trigger `updated_at`.
- Implementasi `lib/server/auth.ts` (`verifyFirebaseToken`) menggunakan Firebase Admin SDK.
- Implementasi `lib/server/supabaseAdmin.ts`.
- Implementasi `POST /api/profile/sync` dan `POST /api/workspace/init` (Section 9).
- Hook client: panggil `profile/sync` otomatis setelah `onAuthStateChanged` Firebase berhasil login.
- **Deliverable:** user login -> profile & workspace (tanpa root node dulu) tersimpan di Supabase, terverifikasi lewat Supabase dashboard.

### Phase 2 — Virtual Filesystem (data layer)

- Migration `fs_nodes` (Section 4.3) lengkap dengan constraint & index.
- Update `workspace/init` agar otomatis membuat root directory.
- Implementasi `lib/fs/pathResolver.ts` (Section 6.2) dan `lib/fs/validation.ts` (Section 6.3).
- Implementasi `lib/fs/permission.ts` (Section 7.2).
- Implementasi `GET /api/workspace/tree`.
- Build file explorer **read-only** sederhana (tampilkan tree dari root, belum ada interaksi).
- **Deliverable:** root directory otomatis terbuat, file explorer menampilkan struktur kosong (`/`) yang benar.

### Phase 3 — Terminal Parser (interaksi inti)

- Migration `terminal_sessions` dan `command_history` (Section 4.4–4.5).
- Implementasi tokenizer & parser (Section 8.1–8.3).
- Implementasi command handlers MVP satu per satu, urutan disarankan: `pwd` -> `ls` -> `cd` -> `mkdir` -> `touch` -> `cat` -> `echo` -> `cp` -> `mv` -> `rm` -> `chmod` -> `clear`.
- Implementasi `POST /api/terminal/execute`, `POST /api/terminal/session`, `GET /api/terminal/history`.
- Build UI terminal interaktif (panel tengah) + panel history.
- **Deliverable:** seluruh acceptance criteria command dasar (poin 3–10 di Section 15) terpenuhi.

### Phase 4 — Course Integration

- Definisikan struktur `Exercise`/`ExerciseRule` (Section 11.1) dan minimal 1 set modul nyata mengikuti urutan command yang sudah ada di course saat ini.
- Migration `course_progress` dan `exercise_attempts` (Section 4.9–4.10).
- Implementasi validation engine (Section 11.3) dan `POST /api/course/complete-exercise`.
- Hubungkan sidebar modul dengan data progress nyata (`GET /api/course/progress`), termasuk logic unlock modul.
- **Deliverable:** user menyelesaikan command di terminal -> klik cek jawaban -> progress & poin tersimpan di Supabase dan terlihat di sidebar.

### Phase 5 — Group dan Permission

- Migration `groups`, `group_members`, `group_invites` (Section 4.6–4.8), tambahkan FK `fs_nodes.group_id -> groups(id)` jika belum.
- Implementasi `POST /api/groups/create`, `/invite`, `/accept`, `/reject`, `GET /api/groups/list`.
- Build halaman `/app/groups` (Section 10.2).
- Terapkan permission group secara penuh pada command `chmod` (validasi 3 digit) dan pada `hasPermission` (Section 7.2) sehingga `group_id` benar-benar memengaruhi akses `read`/`write`/`execute` anggota grup.
- **Deliverable:** dua user berbeda, satu grup, satu file dengan `group_id` ter-set -> permission grup terverifikasi memengaruhi command `cat`/`ls`/`cd` anggota grup lain (selama desain kolaborasi lintas-workspace untuk grup didefinisikan secara eksplisit, lihat catatan risiko di Section 13).

### Phase 6 — Polish dan Safety

- Implementasi guard limit ukuran file (50 KB), limit depth (20), limit node (500) secara konsisten di seluruh command relevan (Section 6.4).
- Implementasi `POST /api/workspace/reset` + UI tombol reset dengan `Dialog` konfirmasi.
- Implementasi export progress (`GET /api/course/progress` -> download JSON di client).
- Audit responsive UI di mobile (sidebar/file explorer jadi `Sheet`).
- Review RLS policy aktif di seluruh tabel (Section 5), pastikan tidak ada tabel yang lupa di-enable RLS.
- **Deliverable:** seluruh Acceptance Criteria (Section 15) terpenuhi dan diverifikasi manual.

### Phase 7 (Opsional, di luar MVP)

- Migrasi ke Supabase Third-Party Auth (direct client + Firebase JWT) untuk mendukung Supabase Realtime (kolaborasi file explorer real-time antar anggota grup).
- Command lanjutan: `chown` penuh, `grep`, `find`, `head`, `tail`, `mkdir -p`.
- Notifikasi email untuk group invite (integrasi provider email pihak ketiga).

---

## 13. Risiko Teknis dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Service role key bocor ke client (salah import di komponen `'use client'`) | Kebocoran seluruh data lintas user | Pisahkan eksplisit `lib/server/*` vs `lib/client/*`; ESLint rule custom/boundary check; pastikan `supabaseAdmin.ts` tidak pernah diimpor di file dengan direktif `'use client'` |
| Query rekursif `rm -r` pada folder besar lambat/timeout di serverless function Vercel | UX buruk, request timeout | Batasi maks 500 node/workspace (Section 6.4) sehingga subtree terbesar tetap kecil; gunakan `WITH RECURSIVE` di database (lebih cepat dari rekursi di application layer) |
| Race condition saat dua command dieksekusi nyaris bersamaan dari device berbeda (mis. dua tab) pada `current_directory_id` yang sama | Current directory session jadi tidak konsisten | Setiap command bersifat atomic per `sessionId`; idealnya gunakan transaksi Postgres untuk operasi multi-step (cek lalu insert); untuk MVP, terima eventual-consistency ringan karena 1 user biasanya 1 sesi aktif |
| Nama file/folder duplikat akibat race condition antara cek aplikasi dan insert | Error tak terduga / data tidak konsisten | Unique constraint di database (`uq_fs_nodes_parent_name`) sebagai sumber kebenaran akhir; error dari constraint ditangkap dan dikonversi ke pesan ramah `File exists` |
| Definisi kolaborasi grup pada `fs_nodes` belum sepenuhnya jelas (apakah anggota grup bisa lihat file user lain di workspace berbeda, atau hanya dalam 1 workspace bersama?) | Ambiguitas desain bisa menyebabkan implementasi salah arah di Phase 5 | Putuskan secara eksplisit sebelum Phase 5: untuk MVP, kolaborasi grup dibatasi hanya pada node yang `group_id`-nya di-set oleh **owner workspace tempat node itu berada** — bukan workspace gabungan; RLS tetap membatasi akses tabel `fs_nodes` ke workspace milik sendiri kecuali ditambahkan policy khusus kolaborasi (catatan: ini butuh keputusan tambahan jika ingin mendukung akses lintas-workspace yang sesungguhnya) |
| Command parser disalahgunakan untuk injeksi SQL via `content` file (`echo`) | Risiko keamanan jika query dibangun lewat string concatenation | Selalu gunakan parameterized query / Supabase client query builder, **tidak pernah** raw string interpolation ke SQL |
| User mencoba membuat folder/file dengan nama sangat panjang atau karakter aneh untuk DoS ringan | Penurunan performa / data kotor | Validasi regex + length check di server sebelum query (Section 6.3), constraint database sebagai lapisan kedua |
| Linux username duplikat / karakter tidak valid | Konflik data, tampilan rusak | Regex validasi (Section 4.1) + unique constraint + pengecekan ketersediaan sebelum simpan (`SELECT` cek dulu, lalu insert dengan unique constraint sebagai jaminan akhir) |
| Firebase ID token kedaluwarsa di tengah sesi panjang di terminal | Request gagal tiba-tiba, UX membingungkan | Client refresh token otomatis via Firebase SDK (`onIdTokenChanged`) sebelum setiap request; tangani error 401 di client dengan retry-once setelah refresh token |
| AI coding agent membangun komponen UI dari nol padahal sudah ada di shadcn/ui | Inkonsistensi desain, waktu development lebih lama | Wajibkan langkah cek MCP shadcn/ui sebelum membuat komponen baru (sudah dicatat di instruksi khusus brief) |

---

## 14. Checklist Implementasi

### Phase 1 — Supabase Setup
- [ ] Setup Supabase project + environment variables
- [ ] Migration: extension `pgcrypto`, fungsi `set_updated_at`
- [ ] Migration: tabel `profiles`
- [ ] Migration: tabel `workspaces`
- [ ] `lib/server/auth.ts` — verifikasi Firebase ID token
- [ ] `lib/server/supabaseAdmin.ts` — service role client
- [ ] `POST /api/profile/sync`
- [ ] `POST /api/workspace/init`
- [ ] Trigger sync otomatis setelah login di client

### Phase 2 — Virtual Filesystem
- [ ] Migration: tabel `fs_nodes` + seluruh constraint & index
- [ ] Root directory otomatis dibuat saat workspace dibuat
- [ ] `lib/fs/pathResolver.ts`
- [ ] `lib/fs/validation.ts` (nama, panjang, karakter)
- [ ] `lib/fs/permission.ts` (hasPermission, getScopeDigit)
- [ ] `GET /api/workspace/tree`
- [ ] UI file explorer read-only

### Phase 3 — Terminal Parser
- [ ] Migration: `terminal_sessions`, `command_history`
- [ ] Tokenizer + parser inti
- [ ] Handler: `pwd`, `ls`, `cd`
- [ ] Handler: `mkdir`, `touch`, `cat`
- [ ] Handler: `echo` (overwrite & append)
- [ ] Handler: `cp`, `mv`, `rm` (`-r`)
- [ ] Handler: `chmod`
- [ ] Handler: `clear` (client-only)
- [ ] `POST /api/terminal/execute`
- [ ] `POST /api/terminal/session`
- [ ] `GET /api/terminal/history`
- [ ] UI terminal interaktif + panel history

### Phase 4 — Course Integration
- [ ] Struktur data `Exercise`/`ExerciseRule`
- [ ] Migration: `course_progress`, `exercise_attempts`
- [ ] Validation engine (`evaluateRule`)
- [ ] `POST /api/course/complete-exercise`
- [ ] `GET /api/course/progress`
- [ ] Sidebar modul terhubung ke progress nyata + unlock logic

### Phase 5 — Group dan Permission
- [ ] Migration: `groups`, `group_members`, `group_invites`
- [ ] FK `fs_nodes.group_id -> groups(id)`
- [ ] `POST /api/groups/create`
- [ ] `POST /api/groups/invite`
- [ ] `POST /api/groups/accept` / `/reject`
- [ ] `GET /api/groups/list`
- [ ] Halaman `/app/groups`
- [ ] Permission grup aktif memengaruhi `hasPermission`

### Phase 6 — Polish dan Safety
- [ ] Limit ukuran file (50 KB) aktif di semua command relevan
- [ ] Limit depth folder (20) aktif
- [ ] Limit jumlah node (500) aktif
- [ ] `POST /api/workspace/reset` + UI konfirmasi
- [ ] Export progress (JSON)
- [ ] Audit responsive mobile
- [ ] Review & enable RLS di seluruh tabel
- [ ] Review tidak ada service role key di bundle client

---

## 15. Acceptance Criteria

Fitur dianggap selesai (siap rilis MVP) jika seluruh poin berikut terverifikasi:

1. User login Firebase berhasil disinkronkan ke tabel `profiles` Supabase.
2. User baru otomatis memiliki `profiles`, `workspaces`, dan root `fs_nodes` (`/`) setelah login pertama kali.
3. User bisa menjalankan `mkdir latihan` dari terminal dan menerima output sukses (tanpa error).
4. Folder `latihan` tersimpan sebagai row baru di tabel `fs_nodes` dengan `parent_id` mengarah ke root.
5. Setelah refresh halaman, folder `latihan` masih muncul di file explorer maupun lewat `cd`/`ls`.
6. User bisa `cd latihan`, lalu `touch catatan.txt`, lalu `cat catatan.txt` (output kosong, tanpa error, karena file belum diisi).
7. User bisa mengisi file dengan `echo "Halo" > catatan.txt` dan content tersimpan di kolom `content` tabel `fs_nodes`.
8. User bisa melihat isi file lewat `cat catatan.txt` dan outputnya sesuai dengan yang terakhir di-`echo`.
9. User bisa mengubah permission dengan `chmod 644 catatan.txt` dan kolom `mode` di database berubah menjadi `644`.
10. Permission yang baru benar-benar memengaruhi command berikutnya (contoh: `chmod 000 catatan.txt` lalu `cat catatan.txt` -> output `Permission denied`).
11. User A tidak bisa membaca atau mengubah node milik User B (diverifikasi lewat percobaan akses langsung dengan `workspace_id` user lain, baik via RLS maupun validasi server).
12. Progress course (`course_progress`) tersimpan di Supabase dan tetap ada setelah refresh/logout-login ulang.
13. File explorer menampilkan struktur folder/file persis sesuai isi tabel `fs_nodes` (termasuk setelah operasi `mv`/`rm`).
14. Setiap command yang dijalankan tercatat di `command_history` dengan `status` yang sesuai (`success`/`error`).
15. Tampilan UI konsisten light theme, palet hijau-oranye, tanpa emoji sebagai elemen utama, profesional, dan responsive di desktop maupun mobile.
16. (Tambahan, Phase 5) User bisa membuat group, mengundang user lain via email, dan user yang diundang bisa menerima/menolak undangan sesuai email login mereka.
17. (Tambahan, Phase 6) Operasi yang melebihi limit (ukuran file > 50 KB, depth > 20, node > 500) ditolak dengan pesan error yang jelas, bukan crash atau silent failure.

---

*Dokumen ini adalah living document — setiap fase boleh memicu revisi kecil pada bagian skema/aturan di atas jika ditemukan kebutuhan baru saat implementasi, tetapi perubahan besar pada arsitektur (Section 2) sebaiknya didiskusikan ulang sebelum dieksekusi oleh agent.*
