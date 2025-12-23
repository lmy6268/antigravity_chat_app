import { NextResponse } from 'next/server';
import { HTTP_STATUS } from '@/lib/constants/api';
import { getServerMetrics } from '@/lib/serverMetrics';

/**
 * GET /api/admin/metrics
 * 실시간 서버 메트릭 조회
 */
export async function GET() {
  try {
    const metrics = getServerMetrics();
    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('Error fetching server metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
