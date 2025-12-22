import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { dao } from '@/dao/supabase';

/**
 * API 호출을 로깅하는 미들웨어 함수
 * 개별 API Route에서 직접 호출하거나 Next.js Middleware에서 사용 가능합니다.
 */
export async function logApiCall(request: NextRequest, response: Response, duration: number) {
    try {
        const url = new URL(request.url);
        const path = url.pathname;

        // 관리자 API 자체 호출은 로깅하지 않음 (무한 루프 방지 및 노이즈 제거)
        if (path.startsWith('/api/admin/logs') || path.startsWith('/api/admin/metrics') || path.startsWith('/api/admin/stats')) {
            return;
        }

        const method = request.method;
        const statusCode = response.status;
        const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            'unknown';
        const userAgent = request.headers.get('user-agent');

        await dao.apiLog.create({
            method,
            path,
            status_code: statusCode,
            ip_address: ipAddress,
            user_agent: userAgent,
            response_time_ms: duration,
        });
    } catch (error) {
        // 로깅 실패가 서비스 중단으로 이어지지 않도록 에러만 기록
        console.error('Failed to log API call:', error);
    }
}
