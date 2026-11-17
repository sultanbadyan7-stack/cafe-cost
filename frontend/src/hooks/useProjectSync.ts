import { useCallback, useEffect, useRef, useState } from 'react';
import { translate } from '@i18n/index';
import type { AppState } from '../types/app';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { STORAGE_KEY } from '../lib/defaults';
import {
  isSupabaseConfigured,
  PROJECTS_TABLE,
  supabase,
} from '../lib/supabaseClient';

export type CloudSaveStatus =
  | 'idle'
  | 'saving'
  | 'saved'
  | 'error'
  | 'local'
  | 'unconfigured';

interface UseProjectSyncOptions {
  /** The complete workspace: general, suppliers, menu, expenses, staff, assets. */
  projectData: AppState;
  /** Replaces the in-memory workspace with a cloud row. */
  onProjectLoaded: (projectData: unknown) => void;
  /** Optional local-autosave side effect for immediate status feedback. */
  onLocalSave?: () => void;
}

interface UseProjectSyncResult {
  cloudSaveStatus: CloudSaveStatus;
  lastCloudSavedAt: number | null;
  isCloudLoading: boolean;
  saveToCloud: () => Promise<void>;
  reloadFromCloud: () => Promise<void>;
}

interface CloudProjectRow {
  project_data: unknown;
  updated_at: string | null;
}

/**
 * Cloud persistence for the whole workspace.
 *
 * - Signed in: upsert one row per user into `public.projects`.
 * - Signed out: fall back to localStorage and report that the work is local.
 * - Missing configuration: keep local data safe and surface a clear error.
 *
 * The hook owns the network lifecycle so CalculatorContext only deals with
 * workspace state.
 */
export function useProjectSync({
  projectData,
  onProjectLoaded,
  onLocalSave,
}: UseProjectSyncOptions): UseProjectSyncResult {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [cloudSaveStatus, setCloudSaveStatus] =
    useState<CloudSaveStatus>('idle');
  const [lastCloudSavedAt, setLastCloudSavedAt] = useState<number | null>(null);
  const [isCloudLoading, setIsCloudLoading] = useState(false);

  /* Tracks which user's cloud row has already been requested. The ref also
     guards against React StrictMode's double effect invocation without
     cancelling the first (real) request. */
  const loadedCloudUser = useRef<string | null>(null);

  const language = projectData.language;

  const persistLocally = useCallback((): boolean => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projectData));
      onLocalSave?.();
      return true;
    } catch {
      return false;
    }
  }, [projectData, onLocalSave]);

  const fetchProject = useCallback(async () => {
    if (!supabase || !user) return;

    setIsCloudLoading(true);
    try {
      const { data, error } = await supabase
        .from(PROJECTS_TABLE)
        .select('project_data, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle<CloudProjectRow>();

      /* A stale response must not overwrite a newer session. */
      if (loadedCloudUser.current !== user.id) return;

      if (error) {
        showToast(translate(language, 'toast.cloudLoadFailed'), 'error');
        return;
      }

      if (data?.project_data) {
        onProjectLoaded(data.project_data);
        setCloudSaveStatus('saved');
        if (data.updated_at) {
          const parsed = Date.parse(data.updated_at);
          setLastCloudSavedAt(Number.isFinite(parsed) ? parsed : Date.now());
        }
      }
    } catch {
      if (loadedCloudUser.current === user.id) {
        showToast(translate(language, 'toast.cloudLoadFailed'), 'error');
      }
    } finally {
      if (loadedCloudUser.current === user.id) {
        setIsCloudLoading(false);
      }
    }
  }, [user, onProjectLoaded, showToast, language]);

  /* Load the newest cloud project once per signed-in user. */
  useEffect(() => {
    if (!user || !supabase) {
      loadedCloudUser.current = null;
      setIsCloudLoading(false);
      return;
    }

    if (loadedCloudUser.current === user.id) return;
    loadedCloudUser.current = user.id;
    void fetchProject();
  }, [user, fetchProject]);

  const saveToCloud = useCallback(async () => {
    /* No credentials: there is nowhere to sync to. Keep the work safe locally
       and report the configuration problem instead of faking success. */
    if (!isSupabaseConfigured || !supabase) {
      const saved = persistLocally();
      setCloudSaveStatus(saved ? 'unconfigured' : 'error');
      showToast(
        translate(
          language,
          saved ? 'toast.cloudNotConfigured' : 'toast.cloudSaveFailed',
        ),
        saved ? 'info' : 'error',
      );
      return;
    }

    /* Signed out: localStorage is the fallback source of truth. */
    if (!user) {
      const saved = persistLocally();
      setCloudSaveStatus(saved ? 'local' : 'error');
      showToast(
        translate(language, saved ? 'toast.localSaved' : 'toast.cloudSaveFailed'),
        saved ? 'success' : 'error',
      );
      return;
    }

    setCloudSaveStatus('saving');
    try {
      const { error } = await supabase.from(PROJECTS_TABLE).upsert(
        {
          user_id: user.id,
          project_data: projectData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );

      if (error) {
        setCloudSaveStatus('error');
        showToast(translate(language, 'toast.cloudSaveFailed'), 'error');
        return;
      }

      setCloudSaveStatus('saved');
      setLastCloudSavedAt(Date.now());
      persistLocally();
      showToast(translate(language, 'toast.cloudSaved'), 'success');
    } catch {
      setCloudSaveStatus('error');
      showToast(translate(language, 'toast.cloudSaveFailed'), 'error');
    }
  }, [language, persistLocally, projectData, showToast, user]);

  const reloadFromCloud = useCallback(async () => {
    if (!supabase || !user) return;
    loadedCloudUser.current = user.id;
    await fetchProject();
  }, [fetchProject, user]);

  return {
    cloudSaveStatus,
    lastCloudSavedAt,
    isCloudLoading,
    saveToCloud,
    reloadFromCloud,
  };
}
