-- Extension and Utility Function Setup
create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 1. profiles table
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

alter table profiles
  add constraint chk_linux_username_format
  check (linux_username is null or linux_username ~ '^[a-z][a-z0-9_-]{2,19}$');

create trigger trg_profiles_updated_at
before update on profiles
for each row execute function set_updated_at();


-- 2. workspaces table
create table workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_uid text not null,
  name text not null default 'My Workspace',
  slug text,
  type text not null default 'personal' check (type in ('personal', 'group')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_workspaces_owner_uid on workspaces(owner_uid);
create unique index uq_workspaces_owner_single on workspaces(owner_uid)
  where slug is null;

create trigger trg_workspaces_updated_at
before update on workspaces
for each row execute function set_updated_at();


-- 3. groups table
create table groups (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  owner_uid text not null,
  created_at timestamptz not null default now()
);

create index idx_groups_workspace on groups(workspace_id);
create index idx_groups_owner on groups(owner_uid);


-- 4. fs_nodes table
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

-- Unique name per parent directory when not deleted
create unique index uq_fs_nodes_parent_name
  on fs_nodes(workspace_id, parent_id, name)
  where deleted_at is null;

-- Single root node per workspace
create unique index uq_fs_nodes_single_root
  on fs_nodes(workspace_id)
  where parent_id is null and deleted_at is null;

create index idx_fs_nodes_parent on fs_nodes(parent_id) where deleted_at is null;
create index idx_fs_nodes_workspace on fs_nodes(workspace_id) where deleted_at is null;
create index idx_fs_nodes_owner on fs_nodes(owner_uid);

create trigger trg_fs_nodes_updated_at
before update on fs_nodes
for each row execute function set_updated_at();


-- 5. terminal_sessions table
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


-- 6. command_history table
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


-- 7. group_members table
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


-- 8. group_invites table
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


-- 9. course_progress table
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


-- 10. exercise_attempts table
create table exercise_attempts (
  id uuid primary key default gen_random_uuid(),
  user_uid text not null,
  module_id text not null,
  exercise_id text not null,
  answer text not null,
  is_correct boolean,
  points_awarded int not null default 0,
  used_hint boolean default false,
  created_at timestamptz not null default now()
);

create index idx_exercise_attempts_user on exercise_attempts(user_uid, module_id, exercise_id);


-- Enable Row Level Security (RLS) on all tables
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


-- ==========================================
-- Postgres RPC Functions (Atomic Operations)
-- ==========================================

-- A. mkdir_node
CREATE OR REPLACE FUNCTION mkdir_node(
  p_workspace_id UUID,
  p_parent_id UUID,
  p_name TEXT,
  p_owner_uid TEXT,
  p_mode INT
) RETURNS UUID AS $$
DECLARE
  v_node_id UUID;
  v_count INT;
  v_depth INT := 1;
  v_curr_parent UUID := p_parent_id;
  v_parent_type TEXT;
BEGIN
  -- 1. Check parent type and existence
  SELECT type INTO v_parent_type FROM fs_nodes WHERE id = p_parent_id AND workspace_id = p_workspace_id AND deleted_at IS NULL;
  IF v_parent_type IS NULL THEN
    RAISE EXCEPTION 'Parent directory not found';
  ELSIF v_parent_type <> 'directory' THEN
    RAISE EXCEPTION 'Parent is not a directory';
  END IF;

  -- 2. Check name duplication
  SELECT COUNT(*) INTO v_count FROM fs_nodes 
  WHERE workspace_id = p_workspace_id 
    AND parent_id = p_parent_id 
    AND name = p_name 
    AND deleted_at IS NULL;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'File exists';
  END IF;

  -- 3. Check total nodes limit (max 500)
  SELECT COUNT(*) INTO v_count FROM fs_nodes WHERE workspace_id = p_workspace_id AND deleted_at IS NULL;
  IF v_count >= 500 THEN
    RAISE EXCEPTION 'Workspace node limit reached (max 500)';
  END IF;

  -- 4. Check folder depth limit (max 20)
  WHILE v_curr_parent IS NOT NULL LOOP
    v_depth := v_depth + 1;
    SELECT parent_id INTO v_curr_parent FROM fs_nodes WHERE id = v_curr_parent AND workspace_id = p_workspace_id AND deleted_at IS NULL;
    IF v_depth > 20 THEN
      RAISE EXCEPTION 'Directory depth limit reached (max 20)';
    END IF;
  END LOOP;

  -- 5. Insert new directory
  INSERT INTO fs_nodes (workspace_id, parent_id, type, name, mode, owner_uid, size)
  VALUES (p_workspace_id, p_parent_id, 'directory', p_name, p_mode, p_owner_uid, 0)
  RETURNING id INTO v_node_id;

  RETURN v_node_id;
END;
$$ LANGUAGE plpgsql;


-- B. touch_node
CREATE OR REPLACE FUNCTION touch_node(
  p_workspace_id UUID,
  p_parent_id UUID,
  p_name TEXT,
  p_owner_uid TEXT,
  p_mode INT
) RETURNS UUID AS $$
DECLARE
  v_node_id UUID;
  v_count INT;
  v_parent_type TEXT;
  v_existing_id UUID;
  v_existing_type TEXT;
BEGIN
  -- 1. Check parent type and existence
  SELECT type INTO v_parent_type FROM fs_nodes WHERE id = p_parent_id AND workspace_id = p_workspace_id AND deleted_at IS NULL;
  IF v_parent_type IS NULL THEN
    RAISE EXCEPTION 'Parent directory not found';
  ELSIF v_parent_type <> 'directory' THEN
    RAISE EXCEPTION 'Parent is not a directory';
  END IF;

  -- 2. Check if node already exists
  SELECT id, type INTO v_existing_id, v_existing_type FROM fs_nodes
  WHERE workspace_id = p_workspace_id 
    AND parent_id = p_parent_id 
    AND name = p_name 
    AND deleted_at IS NULL;

  IF v_existing_id IS NOT NULL THEN
    -- If it exists, update updated_at timestamp
    UPDATE fs_nodes SET updated_at = NOW() WHERE id = v_existing_id;
    RETURN v_existing_id;
  END IF;

  -- 3. Check total nodes limit (max 500)
  SELECT COUNT(*) INTO v_count FROM fs_nodes WHERE workspace_id = p_workspace_id AND deleted_at IS NULL;
  IF v_count >= 500 THEN
    RAISE EXCEPTION 'Workspace node limit reached (max 500)';
  END IF;

  -- 4. Insert new file
  INSERT INTO fs_nodes (workspace_id, parent_id, type, name, mode, owner_uid, size, content)
  VALUES (p_workspace_id, p_parent_id, 'file', p_name, p_mode, p_owner_uid, 0, NULL)
  RETURNING id INTO v_node_id;

  RETURN v_node_id;
END;
$$ LANGUAGE plpgsql;


-- C. mv_node
CREATE OR REPLACE FUNCTION mv_node(
  p_workspace_id UUID,
  p_node_id UUID,
  p_new_parent_id UUID,
  p_new_name TEXT,
  p_owner_uid TEXT
) RETURNS VOID AS $$
DECLARE
  v_node_exists BOOLEAN;
  v_parent_id UUID;
  v_type TEXT;
  v_dest_parent_type TEXT;
  v_count INT;
  v_curr_parent UUID;
BEGIN
  -- 1. Check source node
  SELECT EXISTS(SELECT 1 FROM fs_nodes WHERE id = p_node_id AND workspace_id = p_workspace_id AND deleted_at IS NULL) INTO v_node_exists;
  IF NOT v_node_exists THEN
    RAISE EXCEPTION 'Source node not found';
  END IF;

  SELECT parent_id, type INTO v_parent_id, v_type FROM fs_nodes WHERE id = p_node_id AND workspace_id = p_workspace_id AND deleted_at IS NULL;
  
  -- Root cannot be moved
  IF v_parent_id IS NULL THEN
    RAISE EXCEPTION 'Cannot move root directory';
  END IF;

  -- 2. Check destination parent
  SELECT type INTO v_dest_parent_type FROM fs_nodes WHERE id = p_new_parent_id AND workspace_id = p_workspace_id AND deleted_at IS NULL;
  IF v_dest_parent_type IS NULL THEN
    RAISE EXCEPTION 'Destination directory not found';
  ELSIF v_dest_parent_type <> 'directory' THEN
    RAISE EXCEPTION 'Destination parent is not a directory';
  END IF;

  -- 3. Check loop recursion (cannot move directory to its own subdirectory)
  IF v_type = 'directory' THEN
    v_curr_parent := p_new_parent_id;
    WHILE v_curr_parent IS NOT NULL LOOP
      IF v_curr_parent = p_node_id THEN
        RAISE EXCEPTION 'Cannot move directory into its own subdirectory';
      END IF;
      SELECT parent_id INTO v_curr_parent FROM fs_nodes WHERE id = v_curr_parent AND deleted_at IS NULL;
    END LOOP;
  END IF;

  -- 4. Check name conflict in new parent
  SELECT COUNT(*) INTO v_count FROM fs_nodes 
  WHERE workspace_id = p_workspace_id 
    AND parent_id = p_new_parent_id 
    AND name = p_new_name 
    AND id <> p_node_id
    AND deleted_at IS NULL;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'File exists';
  END IF;

  -- 5. Perform the move/rename
  UPDATE fs_nodes 
  SET parent_id = p_new_parent_id, 
      name = p_new_name,
      updated_at = NOW()
  WHERE id = p_node_id;
END;
$$ LANGUAGE plpgsql;


-- D. cp_node
CREATE OR REPLACE FUNCTION cp_node(
  p_workspace_id UUID,
  p_node_id UUID,
  p_new_parent_id UUID,
  p_new_name TEXT,
  p_owner_uid TEXT
) RETURNS UUID AS $$
DECLARE
  v_new_node_id UUID;
  v_source_exists BOOLEAN;
  v_source_type TEXT;
  v_source_content TEXT;
  v_source_size INT;
  v_source_mode INT;
  v_dest_parent_type TEXT;
  v_count INT;
BEGIN
  -- 1. Check source node
  SELECT type, content, size, mode INTO v_source_type, v_source_content, v_source_size, v_source_mode
  FROM fs_nodes 
  WHERE id = p_node_id AND workspace_id = p_workspace_id AND deleted_at IS NULL;

  IF v_source_type IS NULL THEN
    RAISE EXCEPTION 'Source file not found';
  ELSIF v_source_type <> 'file' THEN
    RAISE EXCEPTION 'cp only supports copying files in MVP';
  END IF;

  -- 2. Check destination parent
  SELECT type INTO v_dest_parent_type FROM fs_nodes WHERE id = p_new_parent_id AND workspace_id = p_workspace_id AND deleted_at IS NULL;
  IF v_dest_parent_type IS NULL THEN
    RAISE EXCEPTION 'Destination directory not found';
  ELSIF v_dest_parent_type <> 'directory' THEN
    RAISE EXCEPTION 'Destination parent is not a directory';
  END IF;

  -- 3. Check name conflict
  SELECT COUNT(*) INTO v_count FROM fs_nodes
  WHERE workspace_id = p_workspace_id
    AND parent_id = p_new_parent_id
    AND name = p_new_name
    AND deleted_at IS NULL;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'File exists';
  END IF;

  -- 4. Check total nodes limit
  SELECT COUNT(*) INTO v_count FROM fs_nodes WHERE workspace_id = p_workspace_id AND deleted_at IS NULL;
  IF v_count >= 500 THEN
    RAISE EXCEPTION 'Workspace node limit reached (max 500)';
  END IF;

  -- 5. Copy file
  INSERT INTO fs_nodes (workspace_id, parent_id, type, name, content, mode, owner_uid, size)
  VALUES (p_workspace_id, p_new_parent_id, 'file', p_new_name, v_source_content, v_source_mode, p_owner_uid, v_source_size)
  RETURNING id INTO v_new_node_id;

  RETURN v_new_node_id;
END;
$$ LANGUAGE plpgsql;


-- E. rm_node
CREATE OR REPLACE FUNCTION rm_node(
  p_workspace_id UUID,
  p_node_id UUID,
  p_recursive BOOLEAN
) RETURNS VOID AS $$
DECLARE
  v_type TEXT;
  v_parent_id UUID;
  v_child_count INT;
BEGIN
  -- 1. Check node existence
  SELECT type, parent_id INTO v_type, v_parent_id FROM fs_nodes WHERE id = p_node_id AND workspace_id = p_workspace_id AND deleted_at IS NULL;
  IF v_type IS NULL THEN
    RAISE EXCEPTION 'Node not found';
  END IF;

  -- 2. Root cannot be deleted
  IF v_parent_id IS NULL THEN
    RAISE EXCEPTION 'Cannot delete root directory';
  END IF;

  -- 3. Handle directory deletion
  IF v_type = 'directory' AND NOT p_recursive THEN
    SELECT COUNT(*) INTO v_child_count FROM fs_nodes WHERE parent_id = p_node_id AND deleted_at IS NULL;
    IF v_child_count > 0 THEN
      RAISE EXCEPTION 'Directory not empty';
    ELSE
      UPDATE fs_nodes SET deleted_at = NOW() WHERE id = p_node_id;
    END IF;
  ELSIF v_type = 'directory' AND p_recursive THEN
    -- Recursive soft delete of directory and all descendants
    UPDATE fs_nodes 
    SET deleted_at = NOW() 
    WHERE id IN (
      WITH RECURSIVE subtree AS (
        SELECT id FROM fs_nodes WHERE id = p_node_id AND workspace_id = p_workspace_id AND deleted_at IS NULL
        UNION ALL
        SELECT f.id FROM fs_nodes f JOIN subtree s ON f.parent_id = s.id WHERE f.deleted_at IS NULL
      )
      SELECT id FROM subtree
    );
  ELSE
    -- File node, soft delete
    UPDATE fs_nodes SET deleted_at = NOW() WHERE id = p_node_id;
  END IF;
END;
$$ LANGUAGE plpgsql;


-- F. chmod_node
CREATE OR REPLACE FUNCTION chmod_node(
  p_workspace_id UUID,
  p_node_id UUID,
  p_mode INT,
  p_owner_uid TEXT
) RETURNS VOID AS $$
DECLARE
  v_node_exists BOOLEAN;
  v_owner_uid TEXT;
BEGIN
  -- 1. Check node existence and ownership
  SELECT owner_uid INTO v_owner_uid FROM fs_nodes WHERE id = p_node_id AND workspace_id = p_workspace_id AND deleted_at IS NULL;
  IF v_owner_uid IS NULL THEN
    RAISE EXCEPTION 'Node not found';
  END IF;

  IF v_owner_uid <> p_owner_uid THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- 2. Update mode
  UPDATE fs_nodes SET mode = p_mode, updated_at = NOW() WHERE id = p_node_id;
END;
$$ LANGUAGE plpgsql;
