/**
 * Server Metrics Utility
 * Node.js process API를 사용하여 서버 메트릭을 수집합니다.
 */

import type { ServerMetrics } from '@/types/admin';

/**
 * 현재 서버의 메트릭 정보를 반환합니다.
 */
export function getServerMetrics(): ServerMetrics {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  return {
    memoryUsage: {
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
    },
    uptime: Math.round(process.uptime()), // 초
    cpuUsage: {
      user: Math.round(cpuUsage.user / 1000), // ms
      system: Math.round(cpuUsage.system / 1000), // ms
    },
  };
}
