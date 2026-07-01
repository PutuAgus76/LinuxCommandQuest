import { NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";

export async function POST(request: Request) {
  try {
    // 1. Verify User Token
    const user = await verifyFirebaseToken(request);
    const { uid } = user;

    // 2. Fetch Profile for linux_username
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("linux_username")
      .eq("firebase_uid", uid)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // 3. Fetch Workspace
    const { data: workspace, error: workspaceError } = await supabaseAdmin
      .from("workspaces")
      .select("id")
      .eq("owner_uid", uid)
      .eq("type", "personal")
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // 4. Resolve root, /home, and home directory to preserve them
    const { data: rootNode } = await supabaseAdmin
      .from("fs_nodes")
      .select("id")
      .eq("workspace_id", workspace.id)
      .is("parent_id", null)
      .is("deleted_at", null)
      .single();

    if (!rootNode) {
      return NextResponse.json({ error: "Root directory not found" }, { status: 500 });
    }

    const { data: homeNode } = await supabaseAdmin
      .from("fs_nodes")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("parent_id", rootNode.id)
      .eq("name", "home")
      .is("deleted_at", null)
      .single();

    if (!homeNode) {
      return NextResponse.json({ error: "/home directory not found" }, { status: 500 });
    }

    const { data: userHomeNode } = await supabaseAdmin
      .from("fs_nodes")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("parent_id", homeNode.id)
      .eq("name", profile.linux_username)
      .is("deleted_at", null)
      .single();

    if (!userHomeNode) {
      return NextResponse.json({ error: "User home directory not found" }, { status: 500 });
    }

    // 5. Soft-delete all other files/folders
    const { error: resetError } = await supabaseAdmin
      .from("fs_nodes")
      .update({ deleted_at: new Date().toISOString() })
      .eq("workspace_id", workspace.id)
      .not("id", "in", `(${rootNode.id},${homeNode.id},${userHomeNode.id})`);

    if (resetError) {
      return NextResponse.json({ error: resetError.message }, { status: 500 });
    }

    // 6. Reset all active terminal sessions to user's home directory
    await supabaseAdmin
      .from("terminal_sessions")
      .update({ current_directory_id: userHomeNode.id })
      .eq("workspace_id", workspace.id)
      .eq("user_uid", uid);

    // 7. Clear history
    await supabaseAdmin
      .from("command_history")
      .delete()
      .eq("user_uid", uid);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
