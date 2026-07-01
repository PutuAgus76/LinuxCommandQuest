import { NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";
import { validateEnv } from "@/lib/server/envValidator";

export async function GET(request: Request) {
  try {
    const envCheck = validateEnv();
    if (!envCheck.valid && envCheck.response) {
      return envCheck.response;
    }

    // 1. Verify User Token
    const user = await verifyFirebaseToken(request);
    const { uid } = user;

    // 2. Fetch User's Personal Workspace
    const { data: workspace, error: workspaceError } = await supabaseAdmin
      .from("workspaces")
      .select("id")
      .eq("owner_uid", uid)
      .eq("type", "personal")
      .maybeSingle();

    if (workspaceError) {
      return NextResponse.json({ error: workspaceError.message }, { status: 500 });
    }

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // 3. Fetch all active fs_nodes for the workspace
    const { data: nodes, error: nodesError } = await supabaseAdmin
      .from("fs_nodes")
      .select("id, parent_id, type, name, mode, size, owner_uid, updated_at")
      .eq("workspace_id", workspace.id)
      .is("deleted_at", null)
      .order("name", { ascending: true });

    if (nodesError) {
      return NextResponse.json({ error: nodesError.message }, { status: 500 });
    }

    return NextResponse.json({ nodes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
