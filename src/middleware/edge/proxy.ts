import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logApiCall } from './apiLogger';

export async function proxy(request: NextRequest) {
  const start = Date.now();
  const response = NextResponse.next();

  // API 요청에 대해서만 로깅 수행
  if (
    request.nextUrl.pathname.startsWith('/api/') &&
    !request.nextUrl.pathname.includes('/admin/')
  ) {
    // 비동기로 로깅 수행 (응답 속도에 영향을 주지 않기 위함)
    const duration = Date.now() - start;

    // Note: Edge Runtime에서는 비동기 처리가 제한적일 수 있으나
    // 여기서는 로깅 유틸리티를 호출합니다.
    eventuallyLog(request, response, duration);
  }

  return response;
}

async function eventuallyLog(
  request: NextRequest,
  response: Response,
  duration: number,
) {
  try {
    // 실제 로깅 수행
    await logApiCall(request, response, duration);
  } catch (e) {
    console.error('Middleware logging failed', e);
  }
}

// 미들웨어가 실행될 경로 설정
export const config = {
  matcher: '/api/:path*',
};
