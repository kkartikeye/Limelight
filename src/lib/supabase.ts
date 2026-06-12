import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
}

// Server-only client — never import this in a 'use client' file
export const supabase = createClient<Database>(url, key, {
  auth: { persistSession: false },
});
