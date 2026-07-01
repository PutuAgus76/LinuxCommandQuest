import { supabaseAdmin } from "./supabaseAdmin";

/**
 * Asserts that the given user UID owns the specified workspace.
 * Throws an error if they do not own it.
 * Returns the workspace data.
 */
export async function assertWorkspaceOwnership(uid: string, workspaceId: string) {
  const { data: workspace, error } = await supabaseAdmin
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .single();

  if (error || !workspace) {
    throw new Error("Workspace not found");
  }

  if (workspace.owner_uid !== uid) {
    throw new Error("Access denied: You do not own this workspace");
  }

  return workspace;
}
