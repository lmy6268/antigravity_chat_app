import { createRequire } from 'module';
import { logger } from './client';
const require = createRequire(import.meta.url);

// Next 환경에서는 server-only를 통해 클라이언트 사용을 막지만,
// tsx 등 순수 Node 실행 시에는 모듈이 없을 수 있어 실패를 무시한다.
try {
  require('server-only');
} catch {
  // server-only 패키지가 없는 환경에서는 단순히 패스
}


/**
 * Server-Only Logger
 *
 * "server-only" 패키지를 import하여 클라이언트 컴포넌트에서
 * 실수로 import 되는 것을 방지합니다.
 *
 * 서버 사이드 로직(DB 접근, API 핸들러 등)에서만 사용해야 합니다.
 */
export const serverLogger = {
  debug: (message: string, ...args: unknown[]) => logger.debug(message, ...args),
  info: (message: string, ...args: unknown[]) => logger.info(message, ...args),
  warn: (message: string, ...args: unknown[]) => logger.warn(message, ...args),
  error: (message: string, ...args: unknown[]) => logger.error(message, ...args),
};
