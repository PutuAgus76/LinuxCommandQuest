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

    const user = await verifyFirebaseToken(request);
    const { uid } = user;

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    // 1. Verify that session belongs to user
    const { data: session, error: sessionError } = await supabaseAdmin
      .from("terminal_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_uid", uid)
      .maybeSingle();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found or access denied" }, { status: 404 });
    }

    // 2. Fetch history
    const { data: history, error: historyError } = await supabaseAdmin
      .from("command_history")
      .select("command, output, status, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (historyError) {
      return NextResponse.json({ error: historyError.message }, { status: 500 });
    }

    return NextResponse.json({ history });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
