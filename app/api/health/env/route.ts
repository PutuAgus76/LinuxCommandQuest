import { NextResponse } from "next/server";

export async function GET() {
  const hasSupabaseUrl = !!(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  );
  const hasSupabaseServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasFirebaseProjectId = !!process.env.FIREBASE_ADMIN_PROJECT_ID;
  const hasFirebaseClientEmail = !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const hasFirebasePrivateKey = !!process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const mockAuth = process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === "true";
  const nodeEnv = process.env.NODE_ENV || "development";

  return NextResponse.json({
    hasSupabaseUrl,
    hasSupabaseServiceRole,
    hasFirebaseProjectId,
    hasFirebaseClientEmail,
    hasFirebasePrivateKey,
    mockAuth,
    nodeEnv,
  });
}
