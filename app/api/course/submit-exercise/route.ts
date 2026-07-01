import { NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";
import { executeCommand } from "@/lib/server/commandExecutor";
import { getFullPath, resolvePath } from "@/lib/fs/pathResolver";
import { validateDatabaseEffect, ValidationStatus } from "@/lib/server/exerciseValidator";
import { exercises as allExercises } from "@/data/exercises";
import { modules as allModules } from "@/data/modules";
import { validateEnv } from "@/lib/server/envValidator";

async function ensurePrerequisites(
  workspaceId: string,
  uid: string,
  linuxUsername: string,
  setupSteps: Array<{ type: "directory" | "file" | "cwd"; path: string; content?: string; mode?: number }>,
  sessionId: string,
  initialDirId: string
): Promise<string> {
  let activeDirId = initialDirId;

  for (const step of setupSteps) {
    if (step.type === "cwd") {
      const { node } = await resolvePath(workspaceId, activeDirId, step.path, uid, linuxUsername);
      if (node && node.type === "directory") {
        activeDirId = node.id;
        await supabaseAdmin
          .from("terminal_sessions")
          .update({ current_directory_id: node.id })
          .eq("id", sessionId);
      }
      continue;
    }

    const { node } = await resolvePath(workspaceId, activeDirId, step.path, uid, linuxUsername);
    if (node) {
      if (step.type === "file" && step.content !== undefined && node.content !== step.content) {
        await supabaseAdmin
          .from("fs_nodes")
          .update({ content: step.content, size: step.content.length })
          .eq("id", node.id);
      }
      continue;
    }

    const lastSlash = step.path.lastIndexOf("/");
    let parentPath = "/";
    let name = step.path;
    if (lastSlash !== -1) {
      parentPath = step.path.substring(0, lastSlash) || "/";
      name = step.path.substring(lastSlash + 1);
    }

    const { node: parentNode } = await resolvePath(workspaceId, activeDirId, parentPath, uid, linuxUsername);
    if (!parentNode) {
      console.error(`ensurePrerequisites: parent path ${parentPath} not found for ${step.path}`);
      continue;
    }

    if (step.type === "directory") {
      await supabaseAdmin.rpc("mkdir_node", {
        p_workspace_id: workspaceId,
        p_parent_id: parentNode.id,
        p_name: name,
        p_owner_uid: uid,
        p_mode: step.mode || 755
      });
    } else {
      const { data: fileId } = await supabaseAdmin.rpc("touch_node", {
        p_workspace_id: workspaceId,
        p_parent_id: parentNode.id,
        p_name: name,
        p_owner_uid: uid,
        p_mode: step.mode || 644
      });

      if (fileId && step.content !== undefined) {
        await supabaseAdmin
          .from("fs_nodes")
          .update({ content: step.content, size: step.content.length })
          .eq("id", fileId);
      }
    }
  }

  return activeDirId;
}

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

    // 4. Load Profile for linux_username
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("linux_username, display_name")
      .eq("firebase_uid", uid)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Find Exercise config
    const exerciseConfig = allExercises.find((ex) => ex.exerciseId === exerciseId);
    if (!exerciseConfig) {
      return NextResponse.json({ error: "Exercise configuration not found" }, { status: 404 });
    }

    const moduleId = exerciseConfig.moduleId;

    // Run setup steps before execution
    let currentDirectoryId = session.current_directory_id;
    if (exerciseConfig.setupSteps) {
      currentDirectoryId = await ensurePrerequisites(
        session.workspace_id,
        uid,
        profile.linux_username,
        exerciseConfig.setupSteps,
        sessionId,
        currentDirectoryId
      );
    }

    // 5. Execute Command on backend virtual filesystem
    const ctx = {
      uid,
      workspaceId: session.workspace_id,
      sessionId,
      currentDirectoryId,
      linuxUsername: profile.linux_username,
      userGroupIds: [], // Delayed group feature
    };

    const result = await executeCommand(command, ctx);

    // 6. Determine active directory after command
    const activeDirId = result.newCurrentDirectoryId || currentDirectoryId;

    // 7. Persist new CWD and update session timestamp
    if (activeDirId !== session.current_directory_id) {
      await supabaseAdmin
        .from("terminal_sessions")
        .update({
          current_directory_id: activeDirId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionId);
    } else {
      await supabaseAdmin
        .from("terminal_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", sessionId);
    }

    // 8. Record in command history
    await supabaseAdmin.from("command_history").insert({
      session_id: sessionId,
      user_uid: uid,
      command: command,
      output: result.output,
      status: result.status,
    });

    // Get updated CWD path
    const cwdPath = await getFullPath(activeDirId, session.workspace_id);

    // 9. Check if exercise already successfully completed by this user
    const { data: completedAttempt } = await supabaseAdmin
      .from("exercise_attempts")
      .select("id")
      .eq("user_uid", uid)
      .eq("exercise_id", exerciseId)
      .eq("is_correct", true)
      .maybeSingle();

    const isAlreadyCompleted = !!completedAttempt;

    // 10. Run Validation on updated database state
    const validation = await validateDatabaseEffect(exerciseId, sessionId, uid, command);

    // Dev-only safe logging
    if (process.env.NODE_ENV !== "production") {
      console.log("[Exercise Submit Debug]", {
        exerciseId,
        command,
        sessionId,
        currentPathBefore: await getFullPath(session.current_directory_id, session.workspace_id),
        currentPathAfter: cwdPath,
        executeStatus: result.status,
        output: result.output,
        validationStatus: validation.status,
        validationReason: validation.feedback,
      });
    }

    const isCorrect = validation.status === "correct";
    let pointsAwarded = 0;

    if (isCorrect) {
      if (!isAlreadyCompleted) {
        if (usedHint) {
          const multiplier = exerciseConfig.hintPenaltyMultiplier ?? 0;
          pointsAwarded = Math.round(exerciseConfig.points * multiplier);
        } else {
          pointsAwarded = exerciseConfig.points;
        }
      }

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
      executeStatus: result.status,
      output: result.output,
      cwd: cwdPath,
      validationStatus: validation.status,
      message: validation.feedback,
      pointsAwarded,
      canContinue: isCorrect,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
