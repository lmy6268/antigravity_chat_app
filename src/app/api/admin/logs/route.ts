import { NextResponse } from 'next/server';
import { HTTP_STATUS } from '@/lib/constants/api';
import { dao } from '@/dao/supabase';
import { withAdminAuth } from '@/middleware/server/adminAuth';

/**
 * GET /api/admin/logs
 * API 호출 로그 조회
 * 인증: 관리자 인증 필요
 * Query params:
 * - limit: 조회할 로그 개수 (기본: 100)
 * - path: 특정 경로 필터링 (선택)
 * - ip: 특정 IP 필터링 (선택)
 */
export async function GET(request: Request) {
  return withAdminAuth(request, async () => {
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

    return { logs };
  });
}
