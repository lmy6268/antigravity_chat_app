import { Socket } from 'socket.io';

export interface CustomSocket extends Socket {
  id: string;
  roomId?: string;
  username?: string;
}
