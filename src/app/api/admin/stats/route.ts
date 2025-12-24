import { NextResponse } from 'next/server';
import { HTTP_STATUS } from '@/lib/constants/api';
import { dao } from '@/dao/supabase';
import { supabase } from '@/lib/supabase/client';
import type { AdminStats } from '@/types/admin';
import { withAdminAuth } from '@/middleware/server/adminAuth';

/**
 * GET /api/admin/stats
 * 통계 정보 조회 (메타데이터만, 내용 X)
 * 인증: 관리자 인증 필요
 */
export async function GET(request: Request) {
  return withAdminAuth(request, async () => {
    // 각 테이블의 총 개수만 조회 (내용은 조회하지 않음)
    const [usersCount, roomsCount, messagesCount, apiCallsCount] =
      await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('rooms').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
        dao.apiLog.countTotal(),
      ]);

    const stats: AdminStats = {
      totalUsers: usersCount.count || 0,
      totalRooms: roomsCount.count || 0,
      totalMessages: messagesCount.count || 0,
      totalApiCalls: apiCallsCount,
    };

    return { stats };
  });
}
