export const SOCKET_LIFECYCLE = {
  CONNECT: 'connect',       // Client-side: socket.on('connect')
  CONNECTION: 'connection', // Server-side: io.on('connection')
  DISCONNECT: 'disconnect',
} as const;

export const CLIENT_EVENTS = {
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  SEND_MESSAGE: 'message',
  REQUEST_HISTORY: 'request_history',
  DELETE_ROOM: 'delete-room',
} as const;

export const SERVER_EVENTS = {
  MESSAGE_RECEIVED: 'message',
  ROOM_DELETED: 'room-deleted',
  ERROR: 'error',
} as const;

// Legacy support for now, or just remove it if I update all usages immediately.
// Let's keep a combined one for easier migration if needed, but better to enforce separation.
// I will remove SOCKET_EVENTS and force updates.
