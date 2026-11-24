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
 *   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
 *   VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
 *
 * Restart `npm run dev` after changing these values — Vite only reads env files
 * at startup.
 *
 * ---------------------------------------------------------------------------
 * DEBUGGING "NetworkError when attempting to fetch resource" (Firefox)
 * ---------------------------------------------------------------------------
 * The browser cannot control HTTP/2 vs HTTP/3 from JavaScript and no `fetch`
 * header can downgrade the transport. Firefox users can test this manually:
 * about:config -> network.http.http3.enabled = false -> restart Firefox.
 *
 * However, a *permanent* NetworkError is usually DNS/CORS, not HTTP/3:
 *   1. Confirm the host resolves:  nslookup <your-project-ref>.supabase.co
 *      An NXDOMAIN means the project URL is wrong, the project was deleted, or
 *      its custom domain changed. Update frontend/.env.local and RESTART Vite.
 *   2. Confirm the app origin is allowed in Supabase:
 *      Authentication -> URL Configuration -> Site URL / Redirect URLs.
 *      Add BOTH http://localhost:5173 and http://127.0.0.1:5173.
 *   3. Only then test the Firefox HTTP/3 toggle above.
 * The console diagnostics below print the exact values and error objects.
 */

function readEnv(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
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

/** Masks a public key while still showing its type and length. */
function maskKey(key: string | null): string {
  if (!key) return '<missing>';
  return `${key.slice(0, 14)}…(${key.length} chars)`;
}

/* -------------------------------------------------------------------------- */
/* Env diagnostics — printed before the client is created.                    */
/* -------------------------------------------------------------------------- */

console.log(
  '[CaféCost][Env] import.meta.env.VITE_SUPABASE_URL =',
  import.meta.env.VITE_SUPABASE_URL,
);
console.log(
  '[CaféCost][Env] VITE_SUPABASE_ANON_KEY =',
  maskKey(import.meta.env.VITE_SUPABASE_ANON_KEY ?? null),
);

const rawUrl = readEnv(import.meta.env.VITE_SUPABASE_URL);
const rawAnonKey = readEnv(import.meta.env.VITE_SUPABASE_ANON_KEY);

if (!rawUrl || !rawAnonKey) {
  console.error(
    '[CaféCost][Env] Supabase is NOT configured. ' +
      `VITE_SUPABASE_URL=${rawUrl ? JSON.stringify(rawUrl) : '<missing>'}, ` +
      `VITE_SUPABASE_ANON_KEY=${rawAnonKey ? 'present' : '<missing>'}. ` +
      'Create frontend/.env.local NEXT TO frontend/vite.config.ts (not in the ' +
      'repository root), with both VITE_* variables, then RESTART `npm run dev` ' +
      '— Vite reads .env files only at startup. ' +
      'The app will keep working locally, but auth and cloud sync are disabled.',
  );
}

if (rawUrl && !/^https:\/\/[^\s/]+\.supabase\.co\/?$/.test(rawUrl)) {
  console.warn(
    '[CaféCost][Env] VITE_SUPABASE_URL does not look like a hosted Supabase ' +
      'URL (expected https://<project-ref>.supabase.co). Current value:',
    rawUrl,
  );
}

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

  console.log('[CaféCost][Env] Creating Supabase client for', supabaseUrl);

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
