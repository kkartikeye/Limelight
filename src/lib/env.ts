/**
 * Runtime environment validation.
 * Import this module in server entry points (API routes, server components)
 * to catch missing variables early with a clear message rather than a silent
 * runtime failure deep inside a Supabase or Mapbox call.
 *
 * Note: NEXT_PUBLIC_* vars are validated separately in the client via the
 * map-view initialisation (Mapbox throws if the token is missing).
 */

const REQUIRED_SERVER_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_MAPBOX_TOKEN",
] as const;

type RequiredVar = (typeof REQUIRED_SERVER_VARS)[number];

function validateEnv(): Record<RequiredVar, string> {
  const missing: string[] = [];

  for (const key of REQUIRED_SERVER_VARS) {
    if (!process.env[key]) missing.push(key);
  }

  if (missing.length > 0) {
    throw new Error(
      `[Limelight] Missing required environment variables:\n  ${missing.join("\n  ")}\n` +
        "Add them to .env.local (local dev) or your Vercel project settings (production)."
    );
  }

  return REQUIRED_SERVER_VARS.reduce(
    (acc, key) => ({ ...acc, [key]: process.env[key]! }),
    {} as Record<RequiredVar, string>
  );
}

// Validate once at module load time in server contexts.
// In client bundles this module is never imported so there is no leakage of
// server-only values.
let _env: Record<RequiredVar, string> | null = null;

export function getEnv(): Record<RequiredVar, string> {
  if (!_env) _env = validateEnv();
  return _env;
}
