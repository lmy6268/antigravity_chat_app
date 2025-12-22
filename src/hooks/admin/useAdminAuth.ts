import { useState, useCallback } from 'react';
import { STORAGE_KEYS } from '@/lib/constants/storage';
import type { AdminDTO } from '@/types/admin';

interface UseAdminAuthReturn {
    admin: AdminDTO | null;
    isLoading: boolean;
    error: string | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

export function useAdminAuth(): UseAdminAuthReturn {
    const [admin, setAdmin] = useState<AdminDTO | null>(() => {
        if (typeof window === 'undefined') return null;
        const stored = localStorage.getItem(STORAGE_KEYS.ADMIN);
        return stored ? JSON.parse(stored) : null;
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

            localStorage.setItem(STORAGE_KEYS.ADMIN, JSON.stringify(data.admin));
            setAdmin(data.admin);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(STORAGE_KEYS.ADMIN);
        setAdmin(null);
    }, []);

    return { admin, isLoading, error, login, logout };
}
