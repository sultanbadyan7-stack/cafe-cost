import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

export interface AuthActionResult {
  error: string | null;
  /** True when sign-up succeeded but Supabase still requires email confirmation. */
  needsEmailConfirmation?: boolean;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
  signUp: (email: string, password: string) => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthAction = 'getSession' | 'signIn' | 'signUp' | 'signOut';

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Authentication failed. Please try again.';
}

function isTransportError(error: unknown): boolean {
  const message = describeError(error).toLowerCase();
  return (
    message.includes('networkerror') ||
    message.includes('failed to fetch') ||
    message.includes('network request failed') ||
    message.includes('load failed')
  );
}

/**
 * Logs the exact error object returned/thrown by supabase-js.
 *
 * A returned `AuthError` means Supabase answered (wrong password, unconfirmed
 * email, CORS rejection). A thrown `TypeError: Failed to fetch` /
 * `NetworkError` means the request never completed — DNS, offline, proxy or
 * Firefox transport. Keep this logging in production builds: it is the only
 * way to tell those cases apart from a user report alone.
 */
function logAuthError(
  action: AuthAction,
  stage: 'returned' | 'threw',
  error: unknown,
): void {
  console.error(`[CaféCost][Auth] ${action} ${stage} error object:`, error);

  if (error instanceof Error) {
    console.error(`[CaféCost][Auth] ${action} error details:`, {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
  }

  if (isTransportError(error)) {
    console.error(
      `[CaféCost][Auth] ${action} looks like a transport failure, not a ` +
        'credentials error. Check in order: ' +
        '(1) nslookup <project-ref>.supabase.co — NXDOMAIN means the URL in ' +
        'frontend/.env.local is stale (deleted/renamed project); restart Vite ' +
        'after fixing it. ' +
        '(2) Supabase → Authentication → URL Configuration → Site URL and ' +
        'Redirect URLs must include http://localhost:5173 and ' +
        'http://127.0.0.1:5173. ' +
        '(3) Firefox: about:config → network.http.http3.enabled=false → ' +
        'restart Firefox (JS cannot force HTTP/2 or change fetch headers).',
    );
  }
}

/**
 * Thin wrapper around Supabase email/password auth.
 *
 * The provider is safe to mount without credentials: it reports
 * `isConfigured: false`, never touches the network, and every action returns a
 * clear error instead of throwing.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!active) return;
        if (sessionError) {
          logAuthError('getSession', 'returned', sessionError);
          setError(sessionError.message);
        }
        setSession(data.session ?? null);
        setLoading(false);
      })
      .catch((sessionError: unknown) => {
        if (!active) return;
        logAuthError('getSession', 'threw', sessionError);
        setError(describeError(sessionError));
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthActionResult> => {
      if (!supabase) {
        const message = 'Cloud authentication is not configured.';
        console.error(
          '[CaféCost][Auth] signIn skipped: Supabase client is null. ' +
            'Check the VITE_SUPABASE_* diagnostics printed by supabaseClient.ts ' +
            'and restart `npm run dev` from frontend/.',
        );
        setError(message);
        return { error: message };
      }

      setError(null);
      try {
        const { error: signInError } =
          await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          logAuthError('signIn', 'returned', signInError);
          setError(signInError.message);
          return { error: signInError.message };
        }
        return { error: null };
      } catch (signInError) {
        logAuthError('signIn', 'threw', signInError);
        const message = describeError(signInError);
        setError(message);
        return { error: message };
      }
    },
    [],
  );

  const signUp = useCallback(
    async (email: string, password: string): Promise<AuthActionResult> => {
      if (!supabase) {
        const message = 'Cloud authentication is not configured.';
        console.error(
          '[CaféCost][Auth] signUp skipped: Supabase client is null. ' +
            'Check the VITE_SUPABASE_* diagnostics printed by supabaseClient.ts ' +
            'and restart `npm run dev` from frontend/.',
        );
        setError(message);
        return { error: message };
      }

      setError(null);
      try {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) {
          logAuthError('signUp', 'returned', signUpError);
          setError(signUpError.message);
          return { error: signUpError.message };
        }
        return {
          error: null,
          needsEmailConfirmation: !data.session,
        };
      } catch (signUpError) {
        logAuthError('signUp', 'threw', signUpError);
        const message = describeError(signUpError);
        setError(message);
        return { error: message };
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    setError(null);
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        logAuthError('signOut', 'returned', signOutError);
        setError(signOutError.message);
      }
    } catch (signOutError) {
      logAuthError('signOut', 'threw', signOutError);
      setError(describeError(signOutError));
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      isConfigured: isSupabaseConfigured,
      error,
      signIn,
      signUp,
      signOut,
    }),
    [session, loading, error, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
