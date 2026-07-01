import { supabaseAdmin } from "./supabaseAdmin";
import { resolvePath, getFullPath } from "../fs/pathResolver";
import { FsNode, hasPermission } from "../fs/permission";

export interface CommandContext {
  uid: string;
  workspaceId: string;
  sessionId: string;
  currentDirectoryId: string;
  linuxUsername: string;
  userGroupIds: string[];
}

export interface CommandResult {
  output: string;
  status: "success" | "error";
  newCurrentDirectoryId?: string;
}

type CommandHandler = (
  args: string[],
  flags: Record<string, boolean>,
  ctx: CommandContext
) => Promise<CommandResult>;

// Helper to format permissions as 'drwxr-xr-x'
function getPermissionString(type: "file" | "directory", mode: number): string {
  const typeChar = type === "directory" ? "d" : "-";
  const modeStr = mode.toString().padStart(3, "0");

  const getPerms = (digitChar: string) => {
    const val = parseInt(digitChar, 10);
    const r = val & 4 ? "r" : "-";
    const w = val & 2 ? "w" : "-";
    const x = val & 1 ? "x" : "-";
    return r + w + x;
  };

  return typeChar + getPerms(modeStr[0]) + getPerms(modeStr[1]) + getPerms(modeStr[2]);
}

// Helper to format timestamps for ls -l
function formatLsDate(dateStr: string): string {
  const date = new Date(dateStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[date.getMonth()];
  const day = date.getDate().toString().padStart(2, "0");
  return `${month} ${day}`;
}

// Tokenizer supporting single/double quotes
export function tokenize(raw: string): string[] {
  const regex = /"([^"]*)"|'([^']*)'|(\S+)/g;
  const tokens: string[] = [];
  let match;
  while ((match = regex.exec(raw)) !== null) {
    tokens.push(match[1] ?? match[2] ?? match[3]);
  }
  return tokens;
}

// Registry of Command Handlers
const COMMAND_REGISTRY: Record<string, CommandHandler> = {
  // PWD
  pwd: async (args, flags, ctx) => {
    const path = await getFullPath(ctx.currentDirectoryId, ctx.workspaceId);
    return { output: path, status: "success" };
  },

  // CD
  cd: async (args, flags, ctx) => {
    const pathArg = args[0] || "~";
    const { node, error } = await resolvePath(
      ctx.workspaceId,
      ctx.currentDirectoryId,
      pathArg,
      ctx.uid,
      ctx.linuxUsername,
      ctx.userGroupIds
    );

    if (error || !node) {
      return { output: `cd: ${pathArg}: No such file or directory`, status: "error" };
    }

    if (node.type !== "directory") {
      return { output: `cd: not a directory: ${pathArg}`, status: "error" };
    }

    if (!hasPermission(node, ctx.uid, "execute", ctx.userGroupIds)) {
      return { output: `cd: permission denied: ${pathArg}`, status: "error" };
    }

    // Update current session's directory in the database
    const { error: updateError } = await supabaseAdmin
      .from("terminal_sessions")
      .update({ current_directory_id: node.id })
      .eq("id", ctx.sessionId);

    if (updateError) {
      return { output: `cd: database error: ${updateError.message}`, status: "error" };
    }

    return { output: "", status: "success", newCurrentDirectoryId: node.id };
  },

  // LS
  ls: async (args, flags, ctx) => {
    // Determine target directory
    const pathArg = args.filter(a => !a.startsWith("-"))[0] || ".";
    
    // Check flags
    const longFormat = flags["l"] || flags["la"] || flags["al"] || false;
    const showHidden = flags["a"] || flags["la"] || flags["al"] || false;

    const { node: targetNode, error } = await resolvePath(
      ctx.workspaceId,
      ctx.currentDirectoryId,
      pathArg,
      ctx.uid,
      ctx.linuxUsername,
      ctx.userGroupIds
    );

    if (error || !targetNode) {
      return { output: `ls: cannot access '${pathArg}': No such file or directory`, status: "error" };
    }

    let filesToList: FsNode[] = [];

    if (targetNode.type === "file") {
      filesToList = [targetNode];
    } else {
      // Check read permission
      if (!hasPermission(targetNode, ctx.uid, "read", ctx.userGroupIds)) {
        return { output: `ls: cannot open directory '${pathArg}': Permission denied`, status: "error" };
      }

      // Fetch children
      const { data, error: dbError } = await supabaseAdmin
        .from("fs_nodes")
        .select("*")
        .eq("workspace_id", ctx.workspaceId)
        .eq("parent_id", targetNode.id)
        .is("deleted_at", null)
        .order("name", { ascending: true });

      if (dbError) {
        return { output: `ls: database error: ${dbError.message}`, status: "error" };
      }
      filesToList = (data as FsNode[]) || [];
    }

    // Filter hidden files (names starting with '.')
    const filteredFiles = filesToList.filter(f => showHidden || !f.name.startsWith("."));

    if (longFormat) {
      const lines = filteredFiles.map(f => {
        const perms = getPermissionString(f.type, f.mode);
        const dateStr = formatLsDate(f.updated_at);
        const owner = ctx.linuxUsername;
        const group = "users";
        return `${perms}  ${owner}  ${group}  ${f.size}  ${dateStr}  ${f.name}`;
      });
      return { output: lines.join("\n"), status: "success" };
    } else {
      const names = filteredFiles.map(f => f.name);
      return { output: names.join("  "), status: "success" };
    }
  },

  // MKDIR
  mkdir: async (args, flags, ctx) => {
    const nameArg = args[0];
    if (!nameArg) {
      return { output: "mkdir: missing operand", status: "error" };
    }

    // Separate parent path and new node name
    const lastSlashIdx = nameArg.lastIndexOf("/");
    let parentPath = ".";
    let newDirName = nameArg;

    if (lastSlashIdx !== -1) {
      parentPath = nameArg.substring(0, lastSlashIdx) || "/";
      newDirName = nameArg.substring(lastSlashIdx + 1);
    }

    if (!newDirName || newDirName.trim().length === 0) {
      return { output: "mkdir: cannot create directory: empty name", status: "error" };
    }

    // Resolve parent directory
    const { node: parentNode, error } = await resolvePath(
      ctx.workspaceId,
      ctx.currentDirectoryId,
      parentPath,
      ctx.uid,
      ctx.linuxUsername,
      ctx.userGroupIds
    );

    if (error || !parentNode) {
      return { output: `mkdir: cannot create directory '${nameArg}': No such file or directory`, status: "error" };
    }

    if (parentNode.type !== "directory") {
      return { output: `mkdir: cannot create directory '${nameArg}': Not a directory`, status: "error" };
    }

    // Check write permission in parent
    if (!hasPermission(parentNode, ctx.uid, "write", ctx.userGroupIds)) {
      return { output: `mkdir: cannot create directory '${nameArg}': Permission denied`, status: "error" };
    }

    // Call stored procedure mkdir_node for safety & transaction consistency
    const { data: newId, error: rpcError } = await supabaseAdmin.rpc("mkdir_node", {
      p_workspace_id: ctx.workspaceId,
      p_parent_id: parentNode.id,
      p_name: newDirName,
      p_owner_uid: ctx.uid,
      p_mode: 755, // default directory mode = 755
    });

    if (rpcError) {
      return { output: `mkdir: cannot create directory '${nameArg}': ${rpcError.message}`, status: "error" };
    }

    return { output: "", status: "success" };
  },

  // TOUCH
  touch: async (args, flags, ctx) => {
    const nameArg = args[0];
    if (!nameArg) {
      return { output: "touch: missing operand", status: "error" };
    }

    const lastSlashIdx = nameArg.lastIndexOf("/");
    let parentPath = ".";
    let newFileName = nameArg;

    if (lastSlashIdx !== -1) {
      parentPath = nameArg.substring(0, lastSlashIdx) || "/";
      newFileName = nameArg.substring(lastSlashIdx + 1);
    }

    // Resolve parent
    const { node: parentNode, error } = await resolvePath(
      ctx.workspaceId,
      ctx.currentDirectoryId,
      parentPath,
      ctx.uid,
      ctx.linuxUsername,
      ctx.userGroupIds
    );

    if (error || !parentNode) {
      return { output: `touch: cannot touch '${nameArg}': No such file or directory`, status: "error" };
    }

    if (parentNode.type !== "directory") {
      return { output: `touch: cannot touch '${nameArg}': Not a directory`, status: "error" };
    }

    // Check write permission in parent
    if (!hasPermission(parentNode, ctx.uid, "write", ctx.userGroupIds)) {
      return { output: `touch: cannot touch '${nameArg}': Permission denied`, status: "error" };
    }

    // Call touch_node RPC
    const { data: fileId, error: rpcError } = await supabaseAdmin.rpc("touch_node", {
      p_workspace_id: ctx.workspaceId,
      p_parent_id: parentNode.id,
      p_name: newFileName,
      p_owner_uid: ctx.uid,
      p_mode: 644, // default file mode = 644
    });

    if (rpcError) {
      return { output: `touch: cannot touch '${nameArg}': ${rpcError.message}`, status: "error" };
    }

    return { output: "", status: "success" };
  },

  // CAT
  cat: async (args, flags, ctx) => {
    const nameArg = args[0];
    if (!nameArg) {
      return { output: "cat: missing file argument", status: "error" };
    }

    const { node, error } = await resolvePath(
      ctx.workspaceId,
      ctx.currentDirectoryId,
      nameArg,
      ctx.uid,
      ctx.linuxUsername,
      ctx.userGroupIds
    );

    if (error || !node) {
      return { output: `cat: ${nameArg}: No such file or directory`, status: "error" };
    }

    if (node.type === "directory") {
      return { output: `cat: ${nameArg}: Is a directory`, status: "error" };
    }

    // Check read permission
    if (!hasPermission(node, ctx.uid, "read", ctx.userGroupIds)) {
      return { output: `cat: ${nameArg}: Permission denied`, status: "error" };
    }

    return { output: node.content || "", status: "success" };
  },

  // CHMOD
  chmod: async (args, flags, ctx) => {
    const modeArg = args[0];
    const pathArg = args[1];

    if (!modeArg || !pathArg) {
      return { output: "chmod: missing operand", status: "error" };
    }

    // Verify 3-digit octal format
    if (!/^[0-7]{3}$/.test(modeArg)) {
      return { output: `chmod: invalid mode: '${modeArg}'`, status: "error" };
    }

    const modeInt = parseInt(modeArg, 10);

    const { node, error } = await resolvePath(
      ctx.workspaceId,
      ctx.currentDirectoryId,
      pathArg,
      ctx.uid,
      ctx.linuxUsername,
      ctx.userGroupIds
    );

    if (error || !node) {
      return { output: `chmod: cannot access '${pathArg}': No such file or directory`, status: "error" };
    }

    // Call chmod_node RPC
    const { error: rpcError } = await supabaseAdmin.rpc("chmod_node", {
      p_workspace_id: ctx.workspaceId,
      p_node_id: node.id,
      p_mode: modeInt,
      p_owner_uid: ctx.uid,
    });

    if (rpcError) {
      if (rpcError.message.includes("Permission denied")) {
        return { output: `chmod: changing permissions of '${pathArg}': Permission denied`, status: "error" };
      }
      return { output: `chmod: database error: ${rpcError.message}`, status: "error" };
    }

    return { output: "", status: "success" };
  },

  // CP
  cp: async (args, flags, ctx) => {
    const srcArg = args[0];
    const destArg = args[1];

    if (!srcArg || !destArg) {
      return { output: "cp: missing file operand", status: "error" };
    }

    // Resolve source
    const { node: srcNode, error: srcError } = await resolvePath(
      ctx.workspaceId,
      ctx.currentDirectoryId,
      srcArg,
      ctx.uid,
      ctx.linuxUsername,
      ctx.userGroupIds
    );

    if (srcError || !srcNode) {
      return { output: `cp: cannot stat '${srcArg}': No such file or directory`, status: "error" };
    }

    if (srcNode.type !== "file") {
      return { output: `cp: omitting directory '${srcArg}' (cp recursive not supported for MVP)`, status: "error" };
    }

    // Check read permission on source file
    if (!hasPermission(srcNode, ctx.uid, "read", ctx.userGroupIds)) {
      return { output: `cp: cannot open '${srcArg}' for reading: Permission denied`, status: "error" };
    }

    // Resolve target path
    let destParentId = ctx.currentDirectoryId;
    let newFileName = srcNode.name;

    const { node: destNode } = await resolvePath(
      ctx.workspaceId,
      ctx.currentDirectoryId,
      destArg,
      ctx.uid,
      ctx.linuxUsername,
      ctx.userGroupIds
    );

    if (destNode && destNode.type === "directory") {
      // Copying into existing directory: cp file.txt folder/
      destParentId = destNode.id;
      newFileName = srcNode.name;
    } else {
      // Copying to a path with custom name: cp file.txt copy.txt
      const lastSlashIdx = destArg.lastIndexOf("/");
      let parentPath = ".";
      newFileName = destArg;

      if (lastSlashIdx !== -1) {
        parentPath = destArg.substring(0, lastSlashIdx) || "/";
        newFileName = destArg.substring(lastSlashIdx + 1);
      }

      const { node: destParentNode, error: destParentError } = await resolvePath(
        ctx.workspaceId,
        ctx.currentDirectoryId,
        parentPath,
        ctx.uid,
        ctx.linuxUsername,
        ctx.userGroupIds
      );

      if (destParentError || !destParentNode) {
        return { output: `cp: cannot create regular file '${destArg}': No such file or directory`, status: "error" };
      }

      if (destParentNode.type !== "directory") {
        return { output: `cp: cannot create regular file '${destArg}': Not a directory`, status: "error" };
      }

      destParentId = destParentNode.id;
    }

    // Check write permission on target parent directory
    const { data: destParent } = await supabaseAdmin
      .from("fs_nodes")
      .select("*")
      .eq("id", destParentId)
      .single();

    if (!destParent || !hasPermission(destParent as FsNode, ctx.uid, "write", ctx.userGroupIds)) {
      return { output: `cp: cannot copy to '${destArg}': Permission denied`, status: "error" };
    }

    // Run cp_node RPC
    const { error: rpcError } = await supabaseAdmin.rpc("cp_node", {
      p_workspace_id: ctx.workspaceId,
      p_node_id: srcNode.id,
      p_new_parent_id: destParentId,
      p_new_name: newFileName,
      p_owner_uid: ctx.uid,
    });

    if (rpcError) {
      return { output: `cp: cannot copy: ${rpcError.message}`, status: "error" };
    }

    return { output: "", status: "success" };
  },

  // MV
  mv: async (args, flags, ctx) => {
    const srcArg = args[0];
    const destArg = args[1];

    if (!srcArg || !destArg) {
      return { output: "mv: missing file operand", status: "error" };
    }

    // Resolve source
    const { node: srcNode, error: srcError } = await resolvePath(
      ctx.workspaceId,
      ctx.currentDirectoryId,
      srcArg,
      ctx.uid,
      ctx.linuxUsername,
      ctx.userGroupIds
    );

    if (srcError || !srcNode) {
      return { output: `mv: cannot stat '${srcArg}': No such file or directory`, status: "error" };
    }

    // Check write permission on source parent directory
    if (srcNode.parent_id) {
      const { data: srcParent } = await supabaseAdmin
        .from("fs_nodes")
        .select("*")
        .eq("id", srcNode.parent_id)
        .single();
      if (!srcParent || !hasPermission(srcParent as FsNode, ctx.uid, "write", ctx.userGroupIds)) {
        return { output: `mv: cannot move '${srcArg}': Permission denied`, status: "error" };
      }
    }

    // Resolve target path
    let destParentId = ctx.currentDirectoryId;
    let newFileName = srcNode.name;

    const { node: destNode } = await resolvePath(
      ctx.workspaceId,
      ctx.currentDirectoryId,
      destArg,
      ctx.uid,
      ctx.linuxUsername,
      ctx.userGroupIds
    );

    if (destNode && destNode.type === "directory") {
      // Moving into directory: mv file.txt folder/
      destParentId = destNode.id;
      newFileName = srcNode.name;
    } else {
      // Renaming: mv file.txt newfile.txt
      const lastSlashIdx = destArg.lastIndexOf("/");
      let parentPath = ".";
      newFileName = destArg;

      if (lastSlashIdx !== -1) {
        parentPath = destArg.substring(0, lastSlashIdx) || "/";
        newFileName = destArg.substring(lastSlashIdx + 1);
      }

      const { node: destParentNode, error: destParentError } = await resolvePath(
        ctx.workspaceId,
        ctx.currentDirectoryId,
        parentPath,
        ctx.uid,
        ctx.linuxUsername,
        ctx.userGroupIds
      );

      if (destParentError || !destParentNode) {
        return { output: `mv: cannot move to '${destArg}': No such file or directory`, status: "error" };
      }

      if (destParentNode.type !== "directory") {
        return { output: `mv: cannot move to '${destArg}': Not a directory`, status: "error" };
      }

      destParentId = destParentNode.id;
    }

    // Check write permission on target parent directory
    const { data: destParent } = await supabaseAdmin
      .from("fs_nodes")
      .select("*")
      .eq("id", destParentId)
      .single();

    if (!destParent || !hasPermission(destParent as FsNode, ctx.uid, "write", ctx.userGroupIds)) {
      return { output: `mv: cannot move to '${destArg}': Permission denied`, status: "error" };
    }

    // Run mv_node RPC
    const { error: rpcError } = await supabaseAdmin.rpc("mv_node", {
      p_workspace_id: ctx.workspaceId,
      p_node_id: srcNode.id,
      p_new_parent_id: destParentId,
      p_new_name: newFileName,
      p_owner_uid: ctx.uid,
    });

    if (rpcError) {
      return { output: `mv: cannot move: ${rpcError.message}`, status: "error" };
    }

    return { output: "", status: "success" };
  },

  // RM
  rm: async (args, flags, ctx) => {
    // Detect flags: -r, -rf, -f
    const isRecursive = flags["r"] || flags["rf"] || flags["R"] || false;
    const force = flags["f"] || flags["rf"] || false;

    // Filter path arguments
    const paths = args.filter(a => !a.startsWith("-"));
    const pathArg = paths[0];

    if (!pathArg) {
      return { output: "rm: missing operand", status: "error" };
    }

    // Resolve target
    const { node, error } = await resolvePath(
      ctx.workspaceId,
      ctx.currentDirectoryId,
      pathArg,
      ctx.uid,
      ctx.linuxUsername,
      ctx.userGroupIds
    );

    if (error || !node) {
      if (force) return { output: "", status: "success" };
      return { output: `rm: cannot remove '${pathArg}': No such file or directory`, status: "error" };
    }

    if (node.type === "directory" && !isRecursive) {
      return { output: `rm: cannot remove '${pathArg}': Is a directory`, status: "error" };
    }

    // Check write permission on parent directory
    if (node.parent_id) {
      const { data: parentNode } = await supabaseAdmin
        .from("fs_nodes")
        .select("*")
        .eq("id", node.parent_id)
        .single();

      if (!parentNode || !hasPermission(parentNode as FsNode, ctx.uid, "write", ctx.userGroupIds)) {
        return { output: `rm: cannot remove '${pathArg}': Permission denied`, status: "error" };
      }
    }

    // Run rm_node RPC
    const { error: rpcError } = await supabaseAdmin.rpc("rm_node", {
      p_workspace_id: ctx.workspaceId,
      p_node_id: node.id,
      p_recursive: isRecursive,
    });

    if (rpcError) {
      return { output: `rm: cannot remove '${pathArg}': ${rpcError.message}`, status: "error" };
    }

    return { output: "", status: "success" };
  },

  // ECHO (non-redirected fallback)
  echo: async (args, flags, ctx) => {
    return { output: args.join(" "), status: "success" };
  },
};

// Main Execution Engine
export async function executeCommand(
  rawCommand: string,
  ctx: CommandContext
): Promise<CommandResult> {
  const normalized = rawCommand.trim();
  if (!normalized) {
    return { output: "", status: "success" };
  }

  // Parse Redirections: echo text > file / echo text >> file
  // Only apply redirection to commands (currently only supporting echo)
  const tokens = tokenize(normalized);
  const commandName = tokens[0];

  if (!COMMAND_REGISTRY[commandName]) {
    return { output: `bash: ${commandName}: command not found`, status: "error" };
  }

  // Redirection Parsing
  const overwriteIdx = tokens.indexOf(">");
  const appendIdx = tokens.indexOf(">>");
  const hasRedirect = overwriteIdx !== -1 || appendIdx !== -1;

  if (hasRedirect) {
    const redirIdx = overwriteIdx !== -1 ? overwriteIdx : appendIdx;
    const isAppend = appendIdx !== -1;
    
    // Command args before redirect operator
    const cmdTokens = tokens.slice(0, redirIdx);
    const targetFileArg = tokens[redirIdx + 1];

    if (!targetFileArg) {
      return { output: "bash: syntax error near unexpected token `newline'", status: "error" };
    }

    // Only allow redirection on 'echo'
    if (commandName !== "echo") {
      return { output: `bash: redirection not supported for command '${commandName}'`, status: "error" };
    }

    // Perform echo text extraction
    // echo args are the ones from index 1 to redirIdx
    const textToEcho = cmdTokens.slice(1).join(" ");

    // Resolve target file parent and name
    const lastSlashIdx = targetFileArg.lastIndexOf("/");
    let parentPath = ".";
    let newFileName = targetFileArg;

    if (lastSlashIdx !== -1) {
      parentPath = targetFileArg.substring(0, lastSlashIdx) || "/";
      newFileName = targetFileArg.substring(lastSlashIdx + 1);
    }

    // Resolve parent
    const { node: parentNode, error: parentError } = await resolvePath(
      ctx.workspaceId,
      ctx.currentDirectoryId,
      parentPath,
      ctx.uid,
      ctx.linuxUsername,
      ctx.userGroupIds
    );

    if (parentError || !parentNode) {
      return { output: `bash: ${targetFileArg}: No such file or directory`, status: "error" };
    }

    if (parentNode.type !== "directory") {
      return { output: `bash: ${targetFileArg}: Not a directory`, status: "error" };
    }

    if (!hasPermission(parentNode, ctx.uid, "write", ctx.userGroupIds)) {
      return { output: `bash: ${targetFileArg}: Permission denied`, status: "error" };
    }

    // Resolve target file node (if exists)
    const { node: fileNode } = await resolvePath(
      ctx.workspaceId,
      ctx.currentDirectoryId,
      targetFileArg,
      ctx.uid,
      ctx.linuxUsername,
      ctx.userGroupIds
    );

    let activeFileId = "";
    let oldContent = "";

    if (fileNode) {
      if (fileNode.type === "directory") {
        return { output: `bash: ${targetFileArg}: Is a directory`, status: "error" };
      }
      if (!hasPermission(fileNode, ctx.uid, "write", ctx.userGroupIds)) {
        return { output: `bash: ${targetFileArg}: Permission denied`, status: "error" };
      }
      activeFileId = fileNode.id;
      oldContent = fileNode.content || "";
    } else {
      // Create new file
      const { data: createdId, error: touchError } = await supabaseAdmin.rpc("touch_node", {
        p_workspace_id: ctx.workspaceId,
        p_parent_id: parentNode.id,
        p_name: newFileName,
        p_owner_uid: ctx.uid,
        p_mode: 644,
      });

      if (touchError || !createdId) {
        return { output: `bash: ${targetFileArg}: Failed to create file`, status: "error" };
      }
      activeFileId = createdId;
    }

    // Combine contents
    const newContent = isAppend 
      ? (oldContent ? oldContent + "\n" + textToEcho : textToEcho)
      : textToEcho;

    if (newContent.length > 51200) {
      return { output: "bash: file size limit exceeded (max 50KB)", status: "error" };
    }

    // Save changes
    const { error: saveError } = await supabaseAdmin
      .from("fs_nodes")
      .update({
        content: newContent,
        size: newContent.length,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activeFileId);

    if (saveError) {
      return { output: `bash: database error: ${saveError.message}`, status: "error" };
    }

    return { output: "", status: "success" };
  }

  // Parse args and flags
  const args: string[] = [];
  const flags: Record<string, boolean> = {};

  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.startsWith("-") && token.length > 1) {
      // It's a flag, e.g. -la or -l
      const flagChars = token.slice(1);
      // Support combined flags, e.g. -la -> flags['l'] = true, flags['a'] = true
      for (const char of flagChars) {
        flags[char] = true;
      }
      // Also register the full string flag
      flags[flagChars] = true;
    } else {
      args.push(token);
    }
  }

  try {
    const handler = COMMAND_REGISTRY[commandName];
    return await handler(args, flags, ctx);
  } catch (err: any) {
    return { output: `bash: ${commandName}: error: ${err.message}`, status: "error" };
  }
}
