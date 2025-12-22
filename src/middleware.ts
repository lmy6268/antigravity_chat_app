import { proxy } from './middleware/edge/proxy';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    // API 요청에 대해서만 프록시 및 로깅 수행
    if (request.nextUrl.pathname.startsWith('/api/')) {
        return proxy(request);
    }
}

// 미들웨어가 실행될 경로 설정
export const config = {
    matcher: '/api/:path*',
};
