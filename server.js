// .env.local 파일에서 환경 변수 로드
require('dotenv').config({ path: '.env.local' });

const { createServer } = require('http');
const { createServer: createHttpsServer } = require('https');
const fs = require('fs');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { supabase } = require('./lib/supabase');
const { TABLES, SOCKET_EVENTS } = require('./lib/constants');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// SSL 인증서 확인
let useHttps = false;
let httpsOptions = {};

if (dev) {
  try {
    const keyPath = './localhost+3-key.pem';
    const certPath = './localhost+3.pem';
    
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      httpsOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };
      useHttps = true;
      console.log('✅ SSL 인증서 발견, HTTPS 서버 시작');
    } else {
      console.log('ℹ️  SSL 인증서 없음, HTTP 서버 시작');
    }
  } catch (err) {
    console.log('⚠️  SSL 인증서 로딩 오류, HTTP로 전환:', err.message);
  }
}

app.prepare().then(() => {
  const server = useHttps 
    ? createHttpsServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
  : createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Socket.io 서버
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
  });

  io.on('connection', (socket) => {
    console.log('New Socket.io connection:', socket.id);

    // 방 참가 처리
    socket.on(SOCKET_EVENTS.JOIN_ROOM, async ({ roomId, username }) => {
      socket.join(roomId);
      socket.roomId = roomId;
      socket.username = username;
      console.log(`User ${username} joined room ${roomId}`);

      // 참가자 정보를 DB에 저장 (선택 사항, 현재 접속자 추적용)
      try {
        const { error } = await supabase
          .from(TABLES.ROOM_PARTICIPANTS)
          .insert({
            room_id: roomId,
            username: username,
            socket_id: socket.id
          });
        
        if (error) console.error('Error saving participant:', error);
      } catch (e) {
        console.error('Error in join-room:', e);
      }

      try {
        // 메시지 히스토리 로드 및 전송
        const { data: messages, error: messagesError } = await supabase
          .from(TABLES.MESSAGES)
          .select('*')
          .eq('room_id', roomId)
          .order('created_at', { ascending: true });

        if (messagesError) {
          console.error('Error loading message history:', messagesError);
        } else {
          console.log(`Sending ${messages.length} history messages to ${socket.id}`);
          messages.forEach(msg => {
            socket.emit('message', { iv: msg.iv, data: msg.data });
          });
        }
      } catch (e) {
        console.error('Error in join handler:', e);
      }
    });

    // 새 메시지 저장 및 브로드캐스트
    socket.on(SOCKET_EVENTS.MESSAGE, async (messageData) => {
      try {
        // Supabase에 메시지 저장
        const { data, error } = await supabase
          .from(TABLES.MESSAGES)
          .insert([
            {
              room_id: messageData.roomId,
              user_id: messageData.userId,
              content: messageData.content,
              is_encrypted: messageData.isEncrypted,
              iv: messageData.iv
            }
          ])
          .select()
          .single();

        if (error) throw error;

        // 방의 다른 사용자들에게 메시지 브로드캐스트
        // 송신자를 제외하고 전송 (송신자는 이미 UI에 추가함)
        socket.to(messageData.roomId).emit(SOCKET_EVENTS.MESSAGE, {
          id: data.id,
          userId: messageData.userId,
          username: messageData.username,
          content: messageData.content,
          timestamp: new Date().toISOString(),
          isEncrypted: messageData.isEncrypted,
          iv: messageData.iv
        });
      } catch (err) {
        console.error('Error saving message:', err);
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to save message' });
      }
    });

    // 연결 해제 처리
    socket.on(SOCKET_EVENTS.DISCONNECT, async () => {
      console.log('Client disconnected:', socket.id);
      
      // 방 참가자 목록에서 사용자 제거
      if (socket.roomId && socket.username) {
        try {
          const { error } = await supabase
            .from(TABLES.ROOM_PARTICIPANTS)
            .delete()
            .eq('room_id', socket.roomId)
            .eq('username', socket.username);

          if (error) {
            console.error('Error removing participant:', error);
          } else {
            console.log(`Removed ${socket.username} from room ${socket.roomId} participants`);
          }
        } catch (e) {
          console.error('Error in disconnect handler:', e);
        }
      }
    });
  });

  server.listen(port, '0.0.0.0', (err) => {
    if (err) throw err;
    const protocol = useHttps ? 'https' : 'http';
    console.log(`> Ready on ${protocol}://0.0.0.0:${port}`);
    console.log(`> Access from your Mac: ${protocol}://localhost:${port}`);
    console.log(`> Access from iPhone: ${protocol}://192.168.0.3:${port}`);
    console.log(`> Socket.io server running`);
  });
});
