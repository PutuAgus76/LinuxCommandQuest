import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Check if Firebase Admin environment variables are configured
const hasFirebaseEnv = !!(
  process.env.FIREBASE_ADMIN_PROJECT_ID &&
  process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
  process.env.FIREBASE_ADMIN_PRIVATE_KEY
);

// Development-only debug log
if (process.env.NODE_ENV !== "production") {
  console.log("[Firebase Admin Env]", {
    hasProjectId: !!process.env.FIREBASE_ADMIN_PROJECT_ID,
    hasClientEmail: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    hasPrivateKey: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
    mockAuth: process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH,
  });
}

function getFirebaseAdminAuth() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
    ?.replace(/^"|"$/g, "")
    .replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin env belum lengkap.");
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  return getAuth();
}

export interface DecodedUser {
  uid: string;
  email: string;
  name?: string;
  picture?: string;
}

/**
 * Verifies the Firebase ID token from the request's Authorization header.
 * Falls back to Mock Mode if Firebase is not configured and mock auth is enabled.
 */
export async function verifyFirebaseToken(req: Request): Promise<DecodedUser> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }

  const token = authHeader.substring(7);

  // If Firebase is configured, verify using Firebase Admin SDK
  if (hasFirebaseEnv) {
    try {
      const decodedToken = await getFirebaseAdminAuth().verifyIdToken(token);
      return {
        uid: decodedToken.uid,
        email: decodedToken.email || "",
        name: decodedToken.name,
        picture: decodedToken.picture,
      };
    } catch (error: any) {
      console.error("Firebase token verification failed:", error);
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  const isProduction = process.env.NODE_ENV === "production";
  const enableMockAuth = process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === "true";

  // Block mock auth in production or if not explicitly enabled
  if (isProduction || !enableMockAuth) {
    throw new Error("Authentication failed: Mock auth is disabled and Firebase is not configured.");
  }

  // Fallback: Mock Mode
  console.log("Verifying token in Mock Mode:", token);
  const match = token.match(/^mock_user_([a-z0-9_-]{3,20})$/);
  if (match) {
    const username = match[1];
    return {
      uid: `mock_uid_${username}`,
      email: `${username}@linuxquest.local`,
      name: username.charAt(0).toUpperCase() + username.slice(1),
    };
  }

  // Default fallback mock user
  return {
    uid: "mock_uid_guest",
    email: "guest@linuxquest.local",
    name: "Guest User",
  };
}
