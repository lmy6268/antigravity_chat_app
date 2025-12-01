// .env.local 파일에서 환경 변수 로드
require('dotenv').config({ path: '.env.local' });

const { createServer } = require('http');
const { createServer: createHttpsServer } = require('https');
const fs = require('fs');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { supabase } = require('./lib/supabase');

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
      const { pathname, query } = parsedUrl;

      if (pathname === '/a') {
        await app.render(req, res, '/a', query);
      } else if (pathname === '/b') {
        await app.render(req, res, '/b', query);
      } else {
        await handle(req, res, parsedUrl);
      }
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
  : createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      const { pathname, query } = parsedUrl;

      if (pathname === '/a') {
        await app.render(req, res, '/a', query);
      } else if (pathname === '/b') {
        await app.render(req, res, '/b', query);
      } else {
        await handle(req, res, parsedUrl);
      }
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

    socket.on('join', async (data) => {
      const { roomId, username } = data;
      socket.join(roomId);
      socket.roomId = roomId;
      socket.username = username;
      console.log(`Client ${socket.id} (${username}) joined room: ${roomId}`);

      try {
        // room_participants 테이블에 사용자 추가
        const { error: participantError } = await supabase
          .from('room_participants')
          .upsert(
            { room_id: roomId, username: username },
            { onConflict: 'room_id,username' }
          );

        if (participantError) {
          console.error('Error adding participant:', participantError);
        } else {
          console.log(`Added ${username} to room ${roomId} participants`);
        }

        // 메시지 히스토리 로드 및 전송
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
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

    socket.on('message', async (data) => {
      const { roomId, payload } = data;
      console.log(`Received message for room: ${roomId}`);

      try {
        // Supabase에 메시지 저장
        const { error } = await supabase
          .from('messages')
          .insert({
            room_id: roomId,
            iv: payload.iv,
            data: payload.data
          });

        if (error) {
          console.error('Error saving message:', error);
        } else {
          console.log(`Message saved to database for room: ${roomId}`);
          
          // 발신자를 제외한 방의 모든 클라이언트에게 브로드캠스트
          socket.broadcast.to(roomId).emit('message', payload);
          console.log(`Broadcast message to room ${roomId}`);
        }
      } catch (e) {
        console.error('Error processing message:', e);
      }
    });

    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id);
      
      // 방 참가자 목록에서 사용자 제거
      if (socket.roomId && socket.username) {
        try {
          const { error } = await supabase
            .from('room_participants')
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
