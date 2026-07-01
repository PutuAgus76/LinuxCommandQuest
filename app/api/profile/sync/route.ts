import { NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";

export async function POST(request: Request) {
  try {
    // 1. Verify User Token
    const user = await verifyFirebaseToken(request);
    const { uid, email, name, picture } = user;

    // 2. Fetch or Create Profile
    let { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("firebase_uid", uid)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    if (!profile) {
      // Generate clean & unique linux_username: 3-20 lowercase alphanumeric/dash/underscore, starting with letter
      let baseUsername = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_-]/g, "");
      if (!/^[a-z]/.test(baseUsername)) {
        baseUsername = "u" + baseUsername;
      }
      baseUsername = baseUsername.substring(0, 15); // Leave space for uniqueness suffixes
      if (baseUsername.length < 3) {
        baseUsername = baseUsername.padEnd(3, "x");
      }

      let linuxUsername = baseUsername;
      let suffix = 1;
      let isUnique = false;

      while (!isUnique) {
        const { data: existingUser } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("linux_username", linuxUsername)
          .maybeSingle();

        if (!existingUser) {
          isUnique = true;
        } else {
          linuxUsername = `${baseUsername}_${suffix}`;
          suffix++;
        }
      }

      const { data: newProfile, error: createProfileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          firebase_uid: uid,
          email,
          display_name: name || email.split("@")[0],
          linux_username: linuxUsername,
          avatar_url: picture || null,
        })
        .select()
        .single();

      if (createProfileError) {
        return NextResponse.json({ error: createProfileError.message }, { status: 500 });
      }

      profile = newProfile;
    } else if (
      // Self-healing: if user has a stale "guest" or placeholder username, update from real email
      profile.linux_username === "guest" ||
      profile.linux_username === "user" ||
      profile.linux_username?.startsWith("mock_")
    ) {
      // Derive a proper username from real email
      let baseUsername = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_-]/g, "");
      if (!/^[a-z]/.test(baseUsername)) baseUsername = "u" + baseUsername;
      baseUsername = baseUsername.substring(0, 15);
      if (baseUsername.length < 3) baseUsername = baseUsername.padEnd(3, "x");

      let linuxUsername = baseUsername;
      let suffix = 1;
      let isUnique = false;
      while (!isUnique) {
        const { data: existingUser } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("linux_username", linuxUsername)
          .neq("id", profile.id) // exclude self
          .maybeSingle();
        if (!existingUser) {
          isUnique = true;
        } else {
          linuxUsername = `${baseUsername}_${suffix}`;
          suffix++;
        }
      }
      const { data: updatedProfile } = await supabaseAdmin
        .from("profiles")
        .update({ linux_username: linuxUsername, display_name: name || undefined })
        .eq("id", profile.id)
        .select()
        .single();
      if (updatedProfile) profile = updatedProfile;
    }

    // 3. Fetch or Create Personal Workspace
    let { data: workspace, error: workspaceError } = await supabaseAdmin
      .from("workspaces")
      .select("*")
      .eq("owner_uid", uid)
      .eq("type", "personal")
      .maybeSingle();

    if (workspaceError) {
      return NextResponse.json({ error: workspaceError.message }, { status: 500 });
    }

    let isNewWorkspace = false;
    if (!workspace) {
      isNewWorkspace = true;
      const { data: newWorkspace, error: createWorkspaceError } = await supabaseAdmin
        .from("workspaces")
        .insert({
          owner_uid: uid,
          name: `${profile.display_name}'s Workspace`,
          type: "personal",
        })
        .select()
        .single();

      if (createWorkspaceError) {
        return NextResponse.json({ error: createWorkspaceError.message }, { status: 500 });
      }

      workspace = newWorkspace;
    }

    // 4. Initialize Virtual File Tree if new workspace
    if (isNewWorkspace) {
      // Create root directory: /
      const { data: rootNode, error: rootError } = await supabaseAdmin
        .from("fs_nodes")
        .insert({
          workspace_id: workspace.id,
          parent_id: null,
          type: "directory",
          name: "/",
          mode: 755,
          owner_uid: uid,
        })
        .select()
        .single();

      if (rootError || !rootNode) {
        return NextResponse.json({ error: "Failed to create root directory: " + (rootError?.message || "Unknown error") }, { status: 500 });
      }

      // Create /home
      const { data: homeNode, error: homeError } = await supabaseAdmin
        .from("fs_nodes")
        .insert({
          workspace_id: workspace.id,
          parent_id: rootNode.id,
          type: "directory",
          name: "home",
          mode: 755,
          owner_uid: uid,
        })
        .select()
        .single();

      if (homeError || !homeNode) {
        return NextResponse.json({ error: "Failed to create /home directory" }, { status: 500 });
      }

      // Create user's home folder /home/<linux_username>
      const { data: userHomeNode, error: userHomeError } = await supabaseAdmin
        .from("fs_nodes")
        .insert({
          workspace_id: workspace.id,
          parent_id: homeNode.id,
          type: "directory",
          name: profile.linux_username,
          mode: 755,
          owner_uid: uid,
        })
        .select()
        .single();

      if (userHomeError || !userHomeNode) {
        return NextResponse.json({ error: "Failed to create user home directory" }, { status: 500 });
      }

      // Create default terminal session pointing to `/home/<linux_username>`
      const { error: sessionError } = await supabaseAdmin
        .from("terminal_sessions")
        .insert({
          workspace_id: workspace.id,
          user_uid: uid,
          name: "Default Session",
          current_directory_id: userHomeNode.id,
        });

      if (sessionError) {
        console.error("Failed to create default terminal session:", sessionError);
      }

      // Initialize Course Progress for all modules
      const level1ModuleIds = ["mkdir", "ls", "cd", "pwd"];
      const allModules = [
        "mkdir", "ls", "cd", "pwd",
        "touch", "cat", "echo-redirection",
        "mv", "cp", "rm", "rm-r",
        "vim",
        "permission-intro", "ls-l", "chmod-numeric", "chmod-symbolic",
        "chown", "cpanel"
      ];

      const progressInserts = allModules.map(modId => ({
        user_uid: uid,
        module_id: modId,
        status: level1ModuleIds.includes(modId) ? "in_progress" : "locked",
        score: 0
      }));

      const { error: progressInitError } = await supabaseAdmin
        .from("course_progress")
        .insert(progressInserts);

      if (progressInitError) {
        console.error("Failed to initialize course progress:", progressInitError);
      }
    }

    return NextResponse.json({
      profile,
      workspace,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
