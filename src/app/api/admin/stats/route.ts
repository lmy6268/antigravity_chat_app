import { NextResponse } from 'next/server';
import { HTTP_STATUS } from '@/lib/constants/api';
import { dao } from '@/dao/supabase';
import { supabase } from '@/lib/supabase/client';
import type { AdminStats } from '@/types/admin';

/**
 * GET /api/admin/stats
 * 통계 정보 조회 (메타데이터만, 내용 X)
 */
export async function GET() {
    try {
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

        return NextResponse.json({ stats });
    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
        );
    }
}
