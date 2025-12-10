import { Socket } from 'socket.io';

export interface CustomSocket extends Socket {
  roomId?: string;
  username?: string;
}
