/**
 * Simple Logger Utility
 *
 * 구분:
 * - debug: 개발 환경이나 DEBUG=true일 때만 출력
 * - info: 일반적인 정보 (항상 출력)
 * - warn: 경고 (항상 출력)
 * - error: 에러 (항상 출력)
 */

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';
const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true';

// Log Level 제어 가능하도록 (기본값: production이면 error만, 아니면 info 이상)
const LOG_LEVEL = process.env.LOG_LEVEL || (isProduction ? 'error' : 'debug');

const levels = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const shouldLog = (level: keyof typeof levels) => {
  if (isTest) return false; // 테스트 환경에서는 기본적으로 로그 끔 (필요시 수정)
  return levels[level] >= levels[LOG_LEVEL as keyof typeof levels];
};

export const logger = {
  debug: (message: string, ...args: unknown[]) => {
    if (shouldLog('debug') || isDebug) {
      console.debug(
        `[DEBUG] ${new Date().toISOString()} - ${message}`,
        ...args,
      );
    }
  },
  info: (message: string, ...args: unknown[]) => {
    if (shouldLog('info')) {
      console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    if (shouldLog('warn')) {
      console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
    }
  },
  error: (message: string, ...args: unknown[]) => {
    if (shouldLog('error')) {
      console.error(
        `[ERROR] ${new Date().toISOString()} - ${message}`,
        ...args,
      );
    }
  },
};
