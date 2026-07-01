import { supabaseAdmin } from "@/lib/server/supabaseAdmin";
import { FsNode, hasPermission } from "./permission";

/**
 * Resolves a virtual path to a specific fs_node.
 * Supports absolute paths (starting with /), home directory (~), and relative paths (., ..).
 * Checks execute (x) permission on each directory traversed.
 */
export async function resolvePath(
  workspaceId: string,
  currentDirId: string,
  rawPath: string,
  uid: string,
  linuxUsername: string,
  userGroupIds: string[] = []
): Promise<{ node: FsNode | null; error?: string }> {
  try {
    let cursorId = currentDirId;
    let pathParts: string[] = [];

    // Parse the start of the path
    if (rawPath.startsWith("~")) {
      // Resolve ~ to /home/<linux_username>
      // 1. Resolve root node
      const { data: rootNode } = await supabaseAdmin
        .from("fs_nodes")
        .select("*")
        .eq("workspace_id", workspaceId)
        .is("parent_id", null)
        .is("deleted_at", null)
        .single();

      if (!rootNode) return { node: null, error: "Root directory not found" };

      // 2. Resolve /home
      const { data: homeNode } = await supabaseAdmin
        .from("fs_nodes")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("parent_id", rootNode.id)
        .eq("name", "home")
        .is("deleted_at", null)
        .single();

      if (!homeNode) return { node: null, error: "Directory /home not found" };

      // 3. Resolve /home/<linux_username>
      const { data: userHomeNode } = await supabaseAdmin
        .from("fs_nodes")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("parent_id", homeNode.id)
        .eq("name", linuxUsername)
        .is("deleted_at", null)
        .single();

      if (!userHomeNode) {
        return { node: null, error: `Home directory for ${linuxUsername} not found` };
      }

      cursorId = userHomeNode.id;
      pathParts = rawPath.slice(1).split("/").filter(Boolean);
    } else if (rawPath.startsWith("/")) {
      // Absolute path from root
      const { data: rootNode } = await supabaseAdmin
        .from("fs_nodes")
        .select("*")
        .eq("workspace_id", workspaceId)
        .is("parent_id", null)
        .is("deleted_at", null)
        .single();

      if (!rootNode) return { node: null, error: "Root directory not found" };

      cursorId = rootNode.id;
      pathParts = rawPath.split("/").filter(Boolean);
    } else {
      // Relative path
      pathParts = rawPath.split("/").filter(Boolean);
    }

    // Retrieve initial cursor node
    let { data: cursorNode } = (await supabaseAdmin
      .from("fs_nodes")
      .select("*")
      .eq("id", cursorId)
      .is("deleted_at", null)
      .single()) as { data: FsNode | null };

    if (!cursorNode) {
      return { node: null, error: "Current directory node not found" };
    }

    // Traverse path parts
    for (const part of pathParts) {
      if (part === ".") {
        continue;
      }

      if (part === "..") {
        if (cursorNode.parent_id === null) {
          // At root, .. stays at root
          continue;
        }

        const { data: parentNode } = (await supabaseAdmin
          .from("fs_nodes")
          .select("*")
          .eq("id", cursorNode.parent_id)
          .is("deleted_at", null)
          .single()) as { data: FsNode | null };

        if (!parentNode) {
          return { node: null, error: "Parent directory not found" };
        }

        cursorNode = parentNode;
        continue;
      }

      // Check traverse (execute) permission on the current directory
      if (cursorNode.type !== "directory") {
        return { node: null, error: `Not a directory: ${cursorNode.name}` };
      }

      if (!hasPermission(cursorNode, uid, "execute", userGroupIds)) {
        return { node: null, error: `Permission denied: cannot access directory '${cursorNode.name}'` };
      }

      // Search for child in current directory
      const { data: childNode } = (await supabaseAdmin
        .from("fs_nodes")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("parent_id", cursorNode.id)
        .eq("name", part)
        .is("deleted_at", null)
        .maybeSingle()) as { data: FsNode | null };

      if (!childNode) {
        return { node: null, error: `No such file or directory: ${part}` };
      }

      cursorNode = childNode;
    }

    return { node: cursorNode };
  } catch (error: any) {
    return { node: null, error: error.message };
  }
}

/**
 * Returns the absolute full path of a given node in the virtual filesystem.
 */
export async function getFullPath(nodeId: string, workspaceId: string): Promise<string> {
  const pathSegments: string[] = [];
  let currentId: string | null = nodeId;

  while (currentId !== null) {
    const response: any = await (supabaseAdmin as any)
      .from("fs_nodes")
      .select("parent_id, name")
      .eq("id", currentId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    const dbNode: any = response.data;

    if (!dbNode) {
      break;
    }

    if (dbNode.parent_id === null) {
      // Root node name is '/', we don't push it so that we can join with '/' cleanly
      break;
    }

    pathSegments.unshift(dbNode.name);
    currentId = dbNode.parent_id;
  }

  return "/" + pathSegments.join("/");
}
