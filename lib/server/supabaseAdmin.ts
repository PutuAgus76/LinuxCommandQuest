import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "http://mock-supabase.local";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "mock-service-role-key";

// Ensure this client is NEVER loaded in the client-side bundles
if (typeof window !== "undefined") {
  throw new Error("Supabase Admin client cannot be loaded in a browser environment!");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
