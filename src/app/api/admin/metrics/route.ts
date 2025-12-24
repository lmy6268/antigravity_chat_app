import { NextResponse } from 'next/server';
import { HTTP_STATUS } from '@/lib/constants/api';
import { getServerMetrics } from '@/lib/serverMetrics';
import { withAdminAuth } from '@/middleware/server/adminAuth';

/**
 * GET /api/admin/metrics
 * 실시간 서버 메트릭 조회
 * 인증: 관리자 인증 필요
 */
export async function GET(request: Request) {
  return withAdminAuth(request, async () => {
    const metrics = getServerMetrics();
    return { metrics };
  });
}
