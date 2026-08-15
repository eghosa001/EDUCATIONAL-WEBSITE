'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAdminAuthStore } from '@/state/auth';
import { fetchSettings, updateSettings, type Setting } from '@/services/api/adminService';

export type SettingsMap = Record<string, string>;

const DEFAULTS: SettingsMap = {
  platform_name: 'EduPlatform',
  currency: 'NGN',
  timezone: 'Africa/Lagos',
  maintenance_mode: 'false',
  registration_open: 'true',
  ai_enabled: 'true',
};

export const parseBool = (value: unknown): boolean => value === true || value === 'true' || value === '1';

export function useSettings() {
  const { token } = useAdminAuthStore();
  const [values, setValues] = useState<SettingsMap>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    fetchSettings(token)
      .then((res) => {
        const next = { ...DEFAULTS };
        (res.data.settings || []).forEach((s: Setting) => {
          let decoded: unknown = s.value;
          try {
            decoded = JSON.parse(String(s.value));
          } catch {
            decoded = s.value;
          }
          next[s.key] = typeof decoded === 'string' ? decoded : JSON.stringify(decoded);
        });
        setValues(next);
        setLoaded(true);
      })
      .catch((err: Error) => setError(err.message || 'Failed to load settings'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const set = useCallback((key: string, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [key]: String(value) }));
  }, []);

  const save = useCallback(async () => {
    if (!token) return;
    setSaving(true);
    try {
      await updateSettings(token, Object.entries(values).map(([key, value]) => ({ key, value })));
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 3000);
    } catch (err) {
      setError((err as Error).message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }, [token, values]);

  return { values, loaded, loading, saving, error, reload: load, set, save, savedFlash };
}
