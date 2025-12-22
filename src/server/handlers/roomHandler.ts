import { Server } from 'socket.io';
import { CustomSocket } from '../../types/socket';
import { dao } from '../../dao/supabase';
import { SERVER_EVENTS, CLIENT_EVENTS } from '../../types/events';
import { serverLogger } from '../../lib/logger/server';

export const registerRoomHandlers = (io: Server, socket: CustomSocket) => {
  // 방 참가 처리
  socket.on(
    CLIENT_EVENTS.JOIN_ROOM,
    async ({ roomId, username }: { roomId: string; username: string }) => {
      socket.join(roomId);
      socket.roomId = roomId;
      socket.username = username;

      serverLogger.info(`User ${username} joined room ${roomId}`);

      // 참가자 정보를 DB에 저장
      try {
        const userEntity = await dao.user.findByUsername(username);

        if (!userEntity) {
          serverLogger.error('Error finding user:', username);
        } else {
          await dao.participant.upsert({
            room_id: roomId,
            user_id: userEntity.id,
            username: username,
          });
        }
      } catch (e) {
        serverLogger.error('Error in join-room:', e);
      }

      // 참가 알림 브로드캐스트 (본인 포함)
      io.in(roomId).emit(SERVER_EVENTS.USER_JOINED, { username });
    },
  );

  // 방 나가기 알림
  socket.on(
    CLIENT_EVENTS.LEAVE_ROOM,
    async ({ roomId, username }: { roomId: string; username: string }) => {
      socket.leave(roomId);
      io.in(roomId).emit(SERVER_EVENTS.USER_LEFT, { username });
    },
  );

  // 방 삭제 알림 (방장이 방을 삭제할 때)
  socket.on(CLIENT_EVENTS.DELETE_ROOM, async (roomId: string) => {
    // 방장(sender)을 제외한 다른 참가자들에게만 알림 전송
    socket.to(roomId).emit(SERVER_EVENTS.ROOM_DELETED);
    // 모든 소켓을 방에서 내보냄 (방장 포함, 하지만 방장은 클라이언트에서 처리됨)
    io.in(roomId).socketsLeave(roomId);
  });
};
