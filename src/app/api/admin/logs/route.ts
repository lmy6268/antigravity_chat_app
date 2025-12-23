import { NextResponse } from 'next/server';
import { HTTP_STATUS } from '@/lib/constants/api';
import { dao } from '@/dao/supabase';

/**
 * GET /api/admin/logs
 * API 호출 로그 조회
 * Query params:
 * - limit: 조회할 로그 개수 (기본: 100)
 * - path: 특정 경로 필터링 (선택)
 * - ip: 특정 IP 필터링 (선택)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const path = searchParams.get('path');
    const ip = searchParams.get('ip');

    let logs;

    if (path) {
      logs = await dao.apiLog.findByPath(path, limit);
    } else if (ip) {
      logs = await dao.apiLog.findByIp(ip, limit);
    } else {
      logs = await dao.apiLog.findRecent(limit);
    }

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error fetching API logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
