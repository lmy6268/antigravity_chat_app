/**
 * Admin Types - 관리자 및 모니터링 관련 타입 정의
 */

export interface AdminEntity {
  id: string;
  username: string;
  password: string;
  created_at: string;
}

export interface AdminDTO {
  id: string;
  username: string;
  created_at: string;
  /**
   * Optional admin session token (JWT)
   * - 클라이언트에서 관리자 API 호출 시 Authorization 헤더에 사용
   */
  token?: string;
}

export interface ApiLogEntity {
  id: number;
  method: string;
  path: string;
  status_code: number | null;
  ip_address: string | null;
  user_agent: string | null;
  response_time_ms: number | null;
  created_at: string;
}

export interface ServerMetrics {
  memoryUsage: {
    rss: number; // Resident Set Size (MB)
    heapTotal: number; // Total Heap (MB)
    heapUsed: number; // Used Heap (MB)
    external: number; // External memory (MB)
  };
  uptime: number; // 서버 가동 시간 (초)
  cpuUsage: {
    user: number; // User CPU time (ms)
    system: number; // System CPU time (ms)
  };
}

export interface AdminStats {
  totalUsers: number;
  totalRooms: number;
  totalMessages: number;
  totalApiCalls: number;
}
