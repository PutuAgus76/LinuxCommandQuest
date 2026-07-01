import { NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";
import { modules } from "@/data/modules";
import { validateEnv } from "@/lib/server/envValidator";

export async function GET(request: Request) {
  try {
    const envCheck = validateEnv();
    if (!envCheck.valid && envCheck.response) {
      return envCheck.response;
    }

    const user = await verifyFirebaseToken(request);
    const { uid } = user;

    // 1. Fetch Profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("display_name, linux_username")
      .eq("firebase_uid", uid)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // 2. Fetch Attempts for points calculation
    const { data: attempts, error: attemptsError } = await supabaseAdmin
      .from("exercise_attempts")
      .select("exercise_id, is_correct, points_awarded")
      .eq("user_uid", uid)
      .eq("is_correct", true);

    if (attemptsError) {
      return NextResponse.json({ error: attemptsError.message }, { status: 500 });
    }

    // Sum unique correct points
    let totalPoints = 0;
    const uniqueSolved = new Set<string>();
    if (attempts) {
      for (const attempt of attempts) {
        if (!uniqueSolved.has(attempt.exercise_id)) {
          uniqueSolved.add(attempt.exercise_id);
          totalPoints += attempt.points_awarded;
        }
      }
    }

    // 3. Fetch Completed Modules count
    const { data: progressRows, error: progressError } = await supabaseAdmin
      .from("course_progress")
      .select("module_id, status")
      .eq("user_uid", uid);

    if (progressError) {
      return NextResponse.json({ error: progressError.message }, { status: 500 });
    }

    const completedCount = progressRows ? progressRows.filter((r: any) => r.status === "completed").length : 0;
    const totalModulesCount = modules.length;
    const globalProgressPercentage = totalModulesCount > 0 ? Math.round((completedCount / totalModulesCount) * 100) : 0;

    return NextResponse.json({
      displayName: profile.display_name,
      linuxUsername: profile.linux_username,
      totalPoints,
      completedModulesCount: completedCount,
      totalModulesCount,
      globalProgressPercentage,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
