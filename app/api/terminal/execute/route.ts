import { NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";
import { executeCommand } from "@/lib/server/commandExecutor";
import { getFullPath } from "@/lib/fs/pathResolver";
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
    const { sessionId, rawCommand } = body;

    if (!sessionId || typeof rawCommand !== "string") {
      return NextResponse.json({ error: "Missing sessionId or rawCommand" }, { status: 400 });
    }

    // 3. Load Session & Verify Ownership
    const { data: session, error: sessionError } = await supabaseAdmin
      .from("terminal_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_uid", uid)
      .maybeSingle();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found or access denied" }, { status: 404 });
    }

    // 4. Load Profile for linux_username
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("linux_username")
      .eq("firebase_uid", uid)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // 5. Execute Command
    const ctx = {
      uid,
      workspaceId: session.workspace_id,
      sessionId,
      currentDirectoryId: session.current_directory_id,
      linuxUsername: profile.linux_username,
      userGroupIds: [], // Delayed group feature
    };

    const result = await executeCommand(rawCommand, ctx);

    // 6. Determine active directory after command
    const activeDirId = result.newCurrentDirectoryId || session.current_directory_id;

    // 7. CRITICAL FIX: Persist new CWD back to terminal_sessions
    //    This is required so that subsequent calls (e.g., /api/course/complete-exercise)
    //    read the correct session.current_directory_id from the database.
    if (activeDirId !== session.current_directory_id) {
      await supabaseAdmin
        .from("terminal_sessions")
        .update({
          current_directory_id: activeDirId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionId);
    } else {
      // Still update timestamp so session reuse logic picks up this session as latest
      await supabaseAdmin
        .from("terminal_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", sessionId);
    }

    // 8. Record in command history
    await supabaseAdmin.from("command_history").insert({
      session_id: sessionId,
      user_uid: uid,
      command: rawCommand,
      output: result.output,
      status: result.status,
    });

    // 9. Return response with resolved path string
    const cwdPath = await getFullPath(activeDirId, session.workspace_id);

    return NextResponse.json({
      output: result.output,
      status: result.status,
      cwd: cwdPath,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
