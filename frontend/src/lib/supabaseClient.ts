import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase is optional.
 *
 * The URL and anon key are read from Vite environment variables and are never
 * hardcoded. When they are missing or malformed the app stays fully usable as
 * a local-only workspace: the auth dialog explains what is missing and "Save
 * to Cloud" reports a clear configuration error instead of pretending to sync.
 *
 * Create `frontend/.env.local` (or `.env`) next to `package.json`:
 *
 *   VITE_SUPABASE_URL=https://your-project.supabase.co
 *   VITE_SUPABASE_ANON_KEY=your-anon-key
 *
 * Restart `npm run dev` after changing these values — Vite only reads env files
 * at startup.
 */

function readEnv(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isValidHttpUrl(value: string | null): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

const rawUrl = readEnv(import.meta.env.VITE_SUPABASE_URL);
const rawAnonKey = readEnv(import.meta.env.VITE_SUPABASE_ANON_KEY);

export const supabaseUrl: string | null = isValidHttpUrl(rawUrl)
  ? rawUrl
  : null;
export const supabaseAnonKey: string | null = rawAnonKey;

/** Human-readable reason when cloud features are unavailable. */
export const supabaseConfigError: string | null = !rawUrl
  ? 'VITE_SUPABASE_URL is missing.'
  : !isValidHttpUrl(rawUrl)
    ? 'VITE_SUPABASE_URL is not a valid http(s) URL.'
    : !rawAnonKey
      ? 'VITE_SUPABASE_ANON_KEY is missing.'
      : null;

export const isSupabaseConfigured =
  supabaseUrl !== null && supabaseAnonKey !== null;

function createSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;

  try {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (error) {
    /* A bad key or URL must not crash the whole app. */
    console.error('[CaféCost] Failed to initialise Supabase:', error);
    return null;
  }
}

export const supabase: SupabaseClient | null = createSupabaseClient();

export interface CloudProjectRow {
  id: string;
  user_id: string;
  project_data: unknown;
  updated_at: string;
}

export const PROJECTS_TABLE = 'projects';
