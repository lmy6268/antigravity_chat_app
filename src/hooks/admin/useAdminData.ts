import { useState, useEffect, useCallback } from 'react';
import type { ServerMetrics, AdminStats, ApiLogEntity } from '@/types/admin';
import { loadAdminProfile } from '@/lib/key-storage';

/**
 * 관리자 인증 헤더를 생성하는 헬퍼 함수
 */
async function getAdminAuthHeaders(): Promise<HeadersInit> {
  const admin = await loadAdminProfile();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (admin?.id) {
    headers['Authorization'] = admin.id;
  }

  return headers;
}

export function useServerMetrics(refreshInterval = 5000) {
  const [metrics, setMetrics] = useState<ServerMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const headers = await getAdminAuthHeaders();
        const res = await fetch('/api/admin/metrics', { headers });
        const data = await res.json();
        setMetrics(data.metrics);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { metrics, isLoading };
}

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const headers = await getAdminAuthHeaders();
        const res = await fetch('/api/admin/stats', { headers });
        const data = await res.json();
        setStats(data.stats);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, isLoading };
}

export function useApiLogs(limit = 100) {
  const [logs, setLogs] = useState<ApiLogEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = useCallback(
    async (path?: string, ip?: string) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ limit: limit.toString() });
        if (path) params.append('path', path);
        if (ip) params.append('ip', ip);

        const headers = await getAdminAuthHeaders();
        const res = await fetch(`/api/admin/logs?${params}`, { headers });
        const data = await res.json();
        setLogs(data.logs);
      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [limit],
  );

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, isLoading, fetchLogs };
}
