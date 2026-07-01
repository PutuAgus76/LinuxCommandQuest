import { NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";
import { getFullPath } from "@/lib/fs/pathResolver";
import { validateEnv } from "@/lib/server/envValidator";

export async function POST(request: Request) {
  try {
    const envCheck = validateEnv();
    if (!envCheck.valid && envCheck.response) {
      return envCheck.response;
    }

    const user = await verifyFirebaseToken(request);
    const { uid } = user;

    // 1. Fetch Profile for linux_username
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("linux_username")
      .eq("firebase_uid", uid)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // 2. Fetch Workspace
    const { data: workspace, error: workspaceError } = await supabaseAdmin
      .from("workspaces")
      .select("id")
      .eq("owner_uid", uid)
      .eq("type", "personal")
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // 3. Try to find an existing active session (reuse it instead of creating new one)
    const { data: existingSession } = await supabaseAdmin
      .from("terminal_sessions")
      .select("*, current_directory:fs_nodes!current_directory_id(name)")
      .eq("workspace_id", workspace.id)
      .eq("user_uid", uid)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingSession) {
      // Resolve the current path string from DB for the client
      const currentPath = await getFullPath(existingSession.current_directory_id, workspace.id);
      return NextResponse.json({ 
        session: {
          ...existingSession,
          current_path: currentPath
        }
      });
    }

    // 4. No session exists — resolve home directory and create one
    const { data: rootNode } = await supabaseAdmin
      .from("fs_nodes")
      .select("id")
      .eq("workspace_id", workspace.id)
      .is("parent_id", null)
      .is("deleted_at", null)
      .single();

    const { data: homeNode } = await supabaseAdmin
      .from("fs_nodes")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("parent_id", rootNode?.id)
      .eq("name", "home")
      .is("deleted_at", null)
      .single();

    const { data: userHomeNode } = await supabaseAdmin
      .from("fs_nodes")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("parent_id", homeNode?.id)
      .eq("name", profile.linux_username)
      .is("deleted_at", null)
      .single();

    if (!userHomeNode) {
      return NextResponse.json({ error: "Home directory not initialized" }, { status: 500 });
    }

    // 5. Create new session
    const { data: session, error: createError } = await supabaseAdmin
      .from("terminal_sessions")
      .insert({
        workspace_id: workspace.id,
        user_uid: uid,
        name: "Main Session",
        current_directory_id: userHomeNode.id,
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      session: {
        ...session,
        current_path: `/home/${profile.linux_username}`
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

/** Resolves a node ID to its absolute path string by walking up the tree */
async function resolveNodePath(workspaceId: string, nodeId: string | null): Promise<string> {
  return getFullPath(nodeId || "", workspaceId);
}
