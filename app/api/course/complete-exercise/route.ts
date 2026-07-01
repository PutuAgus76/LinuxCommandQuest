import { NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";
import { validateDatabaseEffect, ValidationStatus } from "@/lib/server/exerciseValidator";
import { exercises as allExercises } from "@/data/exercises";
import { modules as allModules } from "@/data/modules";

export async function POST(request: Request) {
  try {
    // 1. Verify User Token
    const user = await verifyFirebaseToken(request);
    const { uid } = user;

    // 2. Parse Body
    const body = await request.json();
    const { sessionId, exerciseId, command, usedHint } = body;

    if (!sessionId || !exerciseId || typeof command !== "string") {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
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

    // Find Exercise config
    const exerciseConfig = allExercises.find((ex) => ex.exerciseId === exerciseId);
    if (!exerciseConfig) {
      return NextResponse.json({ error: "Exercise configuration not found" }, { status: 404 });
    }

    const moduleId = exerciseConfig.moduleId;

    // 4. Check if exercise already successfully completed by this user
    const { data: completedAttempt } = await supabaseAdmin
      .from("exercise_attempts")
      .select("id")
      .eq("user_uid", uid)
      .eq("exercise_id", exerciseId)
      .eq("is_correct", true)
      .maybeSingle();

    const isAlreadyCompleted = !!completedAttempt;

    // 5. Validate Database Effects
    //    Pass rawCommand so the validator can use it for near-miss detection.
    //    The terminal execute route MUST have already persisted session CWD to DB.
    const validation = await validateDatabaseEffect(exerciseId, sessionId, uid, command);

    // Dev-safe debug logging (no secrets)
    if (process.env.NODE_ENV !== "production") {
      console.log("[complete-exercise]", JSON.stringify({
        exerciseId,
        moduleId,
        status: validation.status,
        feedback: validation.feedback,
        debug: validation.debug,
      }, null, 2));
    }

    const isCorrect = validation.status === "correct";
    let pointsAwarded = 0;

    if (isCorrect) {
      if (!isAlreadyCompleted) {
        // Calculate points (reduced to 0 if hint was used)
        if (usedHint) {
          const multiplier = exerciseConfig.hintPenaltyMultiplier ?? 0;
          pointsAwarded = Math.round(exerciseConfig.points * multiplier);
        } else {
          pointsAwarded = exerciseConfig.points;
        }
      }

      // Record successful attempt (idempotent — only if not already marked correct)
      if (!isAlreadyCompleted) {
        const { error: insertError } = await supabaseAdmin.from("exercise_attempts").insert({
          user_uid: uid,
          module_id: moduleId,
          exercise_id: exerciseId,
          answer: command || "verified",
          is_correct: true,
          points_awarded: pointsAwarded,
          used_hint: !!usedHint,
        });
        if (insertError) {
          console.error("Failed to record successful attempt:", insertError);
        }
      }

      // 6. Check if all exercises for the module are completed
      const moduleConfig = allModules.find((m) => m.moduleId === moduleId);
      if (moduleConfig) {
        const { data: successfulAttempts } = await supabaseAdmin
          .from("exercise_attempts")
          .select("exercise_id")
          .eq("user_uid", uid)
          .eq("module_id", moduleId)
          .eq("is_correct", true);

        const completedExIds = new Set(successfulAttempts?.map((a) => a.exercise_id) || []);
        const allCompleted = moduleConfig.exerciseIds.every((id) => completedExIds.has(id));

        if (allCompleted) {
          await supabaseAdmin
            .from("course_progress")
            .update({
              status: "completed",
              completed_at: new Date().toISOString(),
            })
            .eq("user_uid", uid)
            .eq("module_id", moduleId);

          // Unlock next level if all modules of current level are done
          const currentLevel = moduleConfig.level;
          const currentLevelModules = allModules.filter((m) => m.level === currentLevel);

          const { data: levelProgress } = await supabaseAdmin
            .from("course_progress")
            .select("module_id, status")
            .eq("user_uid", uid)
            .in("module_id", currentLevelModules.map((m) => m.moduleId));

          const levelCompletedCount =
            levelProgress?.filter((p: any) => p.status === "completed").length || 0;

          if (levelCompletedCount === currentLevelModules.length) {
            const nextLevel = currentLevel + 1;
            const nextLevelModules = allModules.filter((m) => m.level === nextLevel);
            if (nextLevelModules.length > 0) {
              await supabaseAdmin
                .from("course_progress")
                .update({ status: "in_progress" })
                .eq("user_uid", uid)
                .in("module_id", nextLevelModules.map((m) => m.moduleId))
                .eq("status", "locked");
            }
          }
        }
      }
    } else {
      // Record failed/near-miss attempt
      await supabaseAdmin.from("exercise_attempts").insert({
        user_uid: uid,
        module_id: moduleId,
        exercise_id: exerciseId,
        answer: command,
        is_correct: false,
        points_awarded: 0,
        used_hint: !!usedHint,
      });
    }

    return NextResponse.json({
      success: isCorrect,
      status: validation.status,    // "correct" | "near_miss" | "incorrect"
      message: validation.feedback,
      pointsAwarded,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
