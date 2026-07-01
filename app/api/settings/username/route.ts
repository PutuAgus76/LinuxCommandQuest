import { NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";
import { validateEnv } from "@/lib/server/envValidator";

export async function POST(request: Request) {
  try {
    const envCheck = validateEnv();
    if (!envCheck.valid && envCheck.response) {
      return envCheck.response;
    }

    // 1. Verify User Token
    const user = await verifyFirebaseToken(request);
    const { uid } = user;

    // 2. Parse Body
    const body = await request.json();
    const { linuxUsername } = body;

    if (!linuxUsername || typeof linuxUsername !== "string") {
      return NextResponse.json({ error: "Missing linuxUsername" }, { status: 400 });
    }

    // 3. Validate format using Regex
    const regex = /^[a-z][a-z0-9_-]{2,19}$/;
    if (!regex.test(linuxUsername)) {
      return NextResponse.json({ error: "Username format invalid (must start with letter, lowercase, 3-20 characters)" }, { status: 400 });
    }

    // 4. Fetch Profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("firebase_uid", uid)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const oldUsername = profile.linux_username;

    if (oldUsername === linuxUsername) {
      return NextResponse.json({ success: true, message: "Username is identical" });
    }

    // 5. Check uniqueness
    const { data: duplicate } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("linux_username", linuxUsername)
      .maybeSingle();

    if (duplicate) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 400 });
    }

    // 6. Update profiles table
    const { error: profileUpdateError } = await supabaseAdmin
      .from("profiles")
      .update({ linux_username: linuxUsername })
      .eq("firebase_uid", uid);

    if (profileUpdateError) {
      return NextResponse.json({ error: profileUpdateError.message }, { status: 500 });
    }

    // 7. Rename user home directory if it exists
    const { data: workspace } = await supabaseAdmin
      .from("workspaces")
      .select("id")
      .eq("owner_uid", uid)
      .eq("type", "personal")
      .maybeSingle();

    if (workspace && oldUsername) {
      const { data: rootNode } = await supabaseAdmin
        .from("fs_nodes")
        .select("id")
        .eq("workspace_id", workspace.id)
        .is("parent_id", null)
        .is("deleted_at", null)
        .single();

      if (rootNode) {
        const { data: homeNode } = await supabaseAdmin
          .from("fs_nodes")
          .select("id")
          .eq("workspace_id", workspace.id)
          .eq("parent_id", rootNode.id)
          .eq("name", "home")
          .is("deleted_at", null)
          .single();

        if (homeNode) {
          // Find user home directory with old name and rename it to new name
          await supabaseAdmin
            .from("fs_nodes")
            .update({ name: linuxUsername })
            .eq("workspace_id", workspace.id)
            .eq("parent_id", homeNode.id)
            .eq("name", oldUsername)
            .is("deleted_at", null);
        }
      }
    }

    return NextResponse.json({ success: true, linuxUsername });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
