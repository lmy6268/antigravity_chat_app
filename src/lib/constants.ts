/**
 * 프로젝트 전반에서 사용되는 상수 정의
 */

// 데이터베이스 테이블 이름
export const TABLES = {
  USERS: 'users',
  ROOMS: 'rooms',
  MESSAGES: 'messages',
  ROOM_PARTICIPANTS: 'room_participants'
} as const;

// 암호화 관련 상수
export const CRYPTO = {
  ALGORITHM: 'AES-GCM',
  HASH: 'SHA-256',
  KDF: 'PBKDF2',
  SALT: 'websocket-demo-salt',
  ITERATIONS: 100000,
  KEY_LENGTH: 256,
  IV_LENGTH: 12
} as const;

// Socket.io 이벤트 이름
export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  MESSAGE: 'message',
  ROOM_DELETED: 'room-deleted',
  ERROR: 'error'
} as const;

// API 응답 메시지
export const MESSAGES = {
  MISSING_FIELDS: 'Missing required fields',
  USER_NOT_FOUND: 'User not found',
  INVALID_CREDENTIALS: 'Invalid credentials',
  INTERNAL_ERROR: 'Internal server error',
  SUCCESS: 'Success'
} as const;

// HTTP 상태 코드
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
} as const;
