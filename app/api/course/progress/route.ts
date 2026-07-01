import { NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";
import { evaluateUnlockedBadges } from "@/lib/progress-utils";
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

    // 1. Fetch Course Progress
    let { data: progressRows, error: progressError } = await supabaseAdmin
      .from("course_progress")
      .select("*")
      .eq("user_uid", uid);

    if (progressError) {
      return NextResponse.json({ error: progressError.message }, { status: 500 });
    }

    const allModules = [
      "mkdir", "ls", "cd", "pwd",
      "touch", "cat", "echo-redirection",
      "mv", "cp", "rm", "rm-r",
      "vim",
      "permission-intro", "ls-l", "chmod-numeric", "chmod-symbolic",
      "chown", "cpanel"
    ];

    // Safety fallback initialization if progress doesn't exist for user
    if (!progressRows || progressRows.length === 0) {
      const level1ModuleIds = ["mkdir", "ls", "cd", "pwd"];
      const progressInserts = allModules.map(modId => ({
        user_uid: uid,
        module_id: modId,
        status: level1ModuleIds.includes(modId) ? "in_progress" : "locked",
        score: 0
      }));

      const { data: inserted, error: insertError } = await supabaseAdmin
        .from("course_progress")
        .insert(progressInserts)
        .select();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      progressRows = inserted;
    }

    // 2. Fetch Exercise Attempts
    const { data: attempts, error: attemptsError } = await supabaseAdmin
      .from("exercise_attempts")
      .select("*")
      .eq("user_uid", uid);

    if (attemptsError) {
      return NextResponse.json({ error: attemptsError.message }, { status: 500 });
    }

    // 3. Compute exerciseAttempts map
    const exerciseAttempts: Record<string, { attemptCount: number; isCorrect: boolean; usedHint: boolean }> = {};
    
    // Group attempts by exercise_id
    const attemptsByExercise: Record<string, any[]> = {};
    if (attempts) {
      for (const attempt of attempts) {
        if (!attemptsByExercise[attempt.exercise_id]) {
          attemptsByExercise[attempt.exercise_id] = [];
        }
        attemptsByExercise[attempt.exercise_id].push(attempt);
      }
    }

    // Process each exercise
    for (const exId in attemptsByExercise) {
      const exAttempts = attemptsByExercise[exId];
      const attemptCount = exAttempts.length;
      const isCorrect = exAttempts.some(a => a.is_correct === true);
      const usedHint = exAttempts.some(a => a.used_hint === true);

      exerciseAttempts[exId] = {
        attemptCount,
        isCorrect,
        usedHint
      };
    }

    // 4. Calculate stats
    const completedModuleIds = progressRows
      .filter((r: any) => r.status === "completed")
      .map((r: any) => r.module_id);

    // Calculate total points (sum of points_awarded from correct attempts, unique per exercise_id)
    let totalPoints = 0;
    const uniqueSolvedExercises = new Set<string>();

    if (attempts) {
      for (const attempt of attempts) {
        if (attempt.is_correct && !uniqueSolvedExercises.has(attempt.exercise_id)) {
          uniqueSolvedExercises.add(attempt.exercise_id);
          totalPoints += attempt.points_awarded;
        }
      }
    }

    const unlockedBadgeIds = evaluateUnlockedBadges(completedModuleIds);

    const masteredCommands = modules
      .filter(m => completedModuleIds.includes(m.moduleId))
      .map(m => m.command);

    return NextResponse.json({
      progress: {
        totalPoints: totalPoints || 0,
        completedModuleIds: completedModuleIds || [],
        exerciseAttempts: exerciseAttempts || {},
        unlockedBadgeIds: unlockedBadgeIds || [],
        masteredCommands: masteredCommands || [],
        badges: unlockedBadgeIds || []
      },
      // Direct keys for fallback
      progressList: progressRows || [],
      exerciseAttempts: exerciseAttempts || {},
      completedModuleIds: completedModuleIds || [],
      totalPoints: totalPoints || 0,
      badges: unlockedBadgeIds || [],
      unlockedBadgeIds: unlockedBadgeIds || [],
      masteredCommands: masteredCommands || []
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
