/**
 * Simple Logger Utility
 *
 * 구분:
 * - debug: 개발 환경이나 DEBUG=true일 때만 출력
 * - info: 일반적인 정보 (항상 출력)
 * - warn: 경고 (항상 출력)
 * - error: 에러 (항상 출력)
 */

const isDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true';

export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (isDebug) {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
    }
  },
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
  },
};
