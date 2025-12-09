export const SOCKET_LIFECYCLE = {
  CONNECT: 'connect', // Client-side: socket.on('connect')
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
  HISTORY_RECEIVED: 'history',
  ROOM_DELETED: 'room-deleted',
  ERROR: 'error',
} as const;
