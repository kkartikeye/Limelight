import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client for use in Server Components, Route Handlers, and
 * Middleware that reads/writes the user's session cookie.
 *
 * Uses the public anon key — Row Level Security policies enforce data access.
 * Do NOT import this in 'use client' files.
 */
export function getSupabaseServer() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll throws when called from a Server Component (read-only context).
            // Route Handlers can set cookies; Server Components cannot.
          }
        },
      },
    }
  );
}
