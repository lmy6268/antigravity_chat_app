import { ServerResponse } from 'http';

/**
 * 보안 강화를 위한 HTTP 헤더를 설정합니다.
 * Lighthouse "Best Practices" 및 보안 취약점 방지에 도움을 줍니다.
 */
export function applySecurityHeaders(res: ServerResponse) {
    // 클릭재킹 방지
    res.setHeader('X-Frame-Options', 'DENY');

    // MIME 스니핑 방지
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // XSS 필터링 (최신 브라우저에서는 CSP를 권장하지만 하위 호환성을 위해 유지)
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // HSTS 설정 (HTTPS 연결 강제, 1년 설정)
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    // 응답 압축 권장 (Next.js가 이미 어느 정도 처리하지만 명시적으로 확인 가능)
    // res.setHeader('Vary', 'Accept-Encoding');

    // Referer 정보 노출 제어
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // COOP 설정 (교차 출처 격리)
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

    // Content Security Policy (기본 정책)
    // Next.js 정적 파일 및 인라인 스크립트 허용을 위해 엄격하게 관리할 필요가 있음
    // 여기서는 가장 기본적인 정책만 우선 적용
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' wss: https:;");
}
