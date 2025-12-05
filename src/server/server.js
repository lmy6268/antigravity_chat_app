// .env.local 파일에서 환경 변수 로드
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import fs from 'fs';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { messageModel } from '../models/MessageModel.ts'; // TypeScript Models import
import { dao } from '../dao/supabase.ts';

// Constants
import { CLIENT_EVENTS, SERVER_EVENTS, SOCKET_LIFECYCLE } from '../types/events.ts';
import { logger } from '../lib/logger.ts';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// SSL 인증서 확인
let useHttps = false;
let httpsOptions = {};

if (dev) {
  const certPath = './localhost+3.pem';
  const keyPath = './localhost+3-key.pem';

  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    useHttps = true;
    httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };
    logger.info('✅ SSL 인증서 발견, HTTPS 서버 시작');
  } else {
    logger.warn('⚠️  SSL 인증서 없음, HTTP 서버 시작');
  }
}

app.prepare().then(() => {
  const server = useHttps
    ? createHttpsServer(httpsOptions, (req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    })
    : createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    });

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Socket.io 연결 처리
  io.on(SOCKET_LIFECYCLE.CONNECTION, (socket) => {
    logger.info('New Socket.io connection:', socket.id);

    // 방 참가 처리
    socket.on(CLIENT_EVENTS.JOIN_ROOM, async ({ roomId, username }) => {
      socket.join(roomId);
      socket.roomId = roomId;
      socket.username = username;
      logger.info(`User ${username} joined room ${roomId}`);

      // 참가자 정보를 DB에 저장
      try {
        const userEntity = await dao.user.findByUsername(username);

        if (!userEntity) {
          logger.error('Error finding user:', username);
        } else {
          await dao.participant.upsert({
            room_id: roomId,
            user_id: userEntity.id,
            username: username
          });
        }
      } catch (e) {
        logger.error('Error in join-room:', e);
      }
    });

    // 클라이언트가 준비되면 히스토리 요청
    socket.on(CLIENT_EVENTS.REQUEST_HISTORY, async (roomId) => {
      // roomId가 인자로 오거나 socket.roomId 사용
      const targetRoomId = roomId || socket.roomId;

      if (!targetRoomId) {
        logger.error('No roomId provided for history request');
        return;
      }

      try {
        // MessageModel 사용
        const messageDTOs = await messageModel.findByRoomId(targetRoomId);

        logger.debug(`[request_history] Sending ${messageDTOs.length} messages to ${socket.id} for room ${targetRoomId}`);
        messageDTOs.forEach((dto, idx) => {
          socket.emit(SERVER_EVENTS.MESSAGE_RECEIVED, { iv: dto.iv, data: dto.data, timestamp: dto.created_at, id: dto.id });
        });
      } catch (e) {
        logger.error('Error in request_history:', e);
      }
    });

    // 새 메시지 저장 및 브로드캐스트
    socket.on(CLIENT_EVENTS.SEND_MESSAGE, async (messageData) => {
      try {
        // MessageModel 사용
        const messageDTO = await messageModel.createMessage(
          messageData.roomId,
          messageData.iv,
          messageData.data
        );

        // 방의 다른 사용자들에게 암호화된 메시지 브로드캐스트
        socket.to(messageData.roomId).emit(SERVER_EVENTS.MESSAGE_RECEIVED, {
          iv: messageDTO.iv,
          data: messageDTO.data,
          timestamp: messageDTO.created_at,
          id: messageDTO.id
        });
      } catch (err) {
        logger.error('Error saving message:', err);
        socket.emit(SERVER_EVENTS.ERROR, { message: 'Failed to save message' });
      }
    });

    // 연결 해제 처리
    socket.on(SOCKET_LIFECYCLE.DISCONNECT, async () => {
      logger.info('Client disconnected:', socket.id);
      // 영구 채팅방이므로 연결 해제 시 참가자를 제거하지 않음
    });

    // 방 삭제 알림 (방장이 방을 삭제할 때)
    socket.on(CLIENT_EVENTS.DELETE_ROOM, async (roomId) => {
      // 방장(sender)을 제외한 다른 참가자들에게만 알림 전송
      socket.to(roomId).emit(SERVER_EVENTS.ROOM_DELETED);
      // 모든 소켓을 방에서 내보냄 (방장 포함, 하지만 방장은 클라이언트에서 처리됨)
      io.in(roomId).socketsLeave(roomId);
    });
  });

  server.listen(port, hostname, async () => {
    const protocol = useHttps ? 'https' : 'http';
    logger.info(`> Ready on ${protocol}://${hostname}:${port}`);
    logger.info(`> Access from your Mac: ${protocol}://localhost:${port}`);
    if (dev && useHttps) {
      // Get the local IP address
      const { networkInterfaces } = await import('os');
      const nets = networkInterfaces();
      for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
          if (net.family === 'IPv4' && !net.internal) {
            logger.info(`> Access from iPhone: ${protocol}://${net.address}:${port}`);
            break;
          }
        }
      }
    }
    logger.info('> Socket.io server running');
  });
});
