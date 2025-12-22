import { Server } from 'socket.io';
import { CustomSocket } from '../../types/socket';
import { messageModel } from '../../models/MessageModel';
import { SERVER_EVENTS, CLIENT_EVENTS } from '../../types/events';
import { serverLogger } from '../../lib/logger/server';

export const registerMessageHandlers = (io: Server, socket: CustomSocket) => {
  // 클라이언트가 준비되면 히스토리 요청
  socket.on(CLIENT_EVENTS.REQUEST_HISTORY, async (roomId?: string) => {
    // roomId가 인자로 오거나 socket.roomId 사용
    const targetRoomId = roomId || socket.roomId;

    if (!targetRoomId) {
      serverLogger.error('No roomId provided for history request');
      return;
    }

    try {
      // MessageModel 사용
      const messageDTOs = await messageModel.findByRoomId(targetRoomId);

      serverLogger.debug(
        `[request_history] Sending ${messageDTOs.length} messages to ${socket.id} for room ${targetRoomId}`,
      );

      // Send all messages in a single event for better performance
      socket.emit(SERVER_EVENTS.HISTORY_RECEIVED, {
        messages: messageDTOs.map((dto) => {
          // Supabase JSONB가 객체 형태로 올 수 있으므로 배열로 강제 변환
          const ivRaw = Array.isArray(dto.iv)
            ? dto.iv
            : Object.values(dto.iv || {});
          const dataRaw = Array.isArray(dto.data)
            ? dto.data
            : Object.values(dto.data || {});

          const iv = ivRaw
            .map((n) => Number(n))
            .filter((n) => Number.isFinite(n));
          const data = dataRaw
            .map((n) => Number(n))
            .filter((n) => Number.isFinite(n));

          return {
            iv,
            data,
            timestamp: dto.created_at,
            id: dto.id,
          };
        }),
      });
    } catch (e) {
      serverLogger.error('Error in request_history:', e);
    }
  });

  // 새 메시지 저장 및 브로드캐스트
  socket.on(
    CLIENT_EVENTS.SEND_MESSAGE,
    async (messageData: { roomId: string; iv: number[]; data: number[] }) => {
      try {
        // MessageModel 사용
        const messageDTO = await messageModel.createMessage(
          messageData.roomId,
          messageData.iv,
          messageData.data,
        );

        // 방의 다른 사용자들에게 암호화된 메시지 브로드캐스트
        socket.to(messageData.roomId).emit(SERVER_EVENTS.MESSAGE_RECEIVED, {
          iv: messageDTO.iv,
          data: messageDTO.data,
          timestamp: messageDTO.created_at,
          id: messageDTO.id,
        });
      } catch (err) {
        serverLogger.error('Error saving message:', err);
        socket.emit(SERVER_EVENTS.ERROR, { message: 'Failed to save message' });
      }
    },
  );
};
