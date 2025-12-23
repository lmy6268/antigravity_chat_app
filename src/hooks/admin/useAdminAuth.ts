import { useState, useCallback, useEffect } from 'react';
import { STORAGE_KEYS } from '@/lib/constants/storage';
import { saveAdminProfile, loadAdminProfile, clearAdminSession } from '@/lib/key-storage';
import type { AdminDTO } from '@/types/admin';

interface UseAdminAuthReturn {
  admin: AdminDTO | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export function useAdminAuth(): UseAdminAuthReturn {
  const [admin, setAdmin] = useState<AdminDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize from Storage
  useEffect(() => {
    const initAdmin = async () => {
      const stored = await loadAdminProfile();
      setAdmin(stored);
      setIsLoading(false);
    };
    initAdmin();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      await saveAdminProfile(data.admin);
      setAdmin(data.admin);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await clearAdminSession();
    setAdmin(null);
  }, []);

  return { admin, isLoading, error, login, logout };
}
