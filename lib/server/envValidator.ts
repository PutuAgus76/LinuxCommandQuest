import { NextResponse } from "next/server";

export function validateEnv() {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    const requiredEnv = [
      "NEXT_PUBLIC_SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
      "FIREBASE_ADMIN_PROJECT_ID",
      "FIREBASE_ADMIN_CLIENT_EMAIL",
      "FIREBASE_ADMIN_PRIVATE_KEY",
    ];

    const missing = requiredEnv.filter((env) => {
      const val = process.env[env];
      return !val || val.trim() === "";
    });

    if (missing.length > 0) {
      return {
        valid: false,
        response: NextResponse.json(
          {
            error: "Missing production environment variable",
            missing: missing,
          },
          { status: 500 }
        ),
      };
    }
  }

  return { valid: true };
}
