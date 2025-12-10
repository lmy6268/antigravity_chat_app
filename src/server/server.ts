// .env.local 파일에서 환경 변수 로드
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import fs from 'fs';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { registerRoomHandlers } from './handlers/roomHandler';
import { registerMessageHandlers } from './handlers/messageHandler';
import { SOCKET_LIFECYCLE } from '../types/events';
import { serverLogger } from '../lib/server-logger';
import { applyRuntimeEnvHeader } from './middleware/runtimeEnv';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// SSL 인증서 확인
let useHttps = false;
let httpsOptions = {};

if (dev) {
  const certPath = process.env.SSL_CERT_PATH;
  const keyPath = process.env.SSL_KEY_PATH;

  if (certPath && keyPath && (!fs.existsSync(certPath) || !fs.existsSync(keyPath))) {
    serverLogger.error('🔴 SSL 인증서 파일을 찾을 수 없습니다!');
    serverLogger.error(`인증서 경로: ${certPath}`);
    serverLogger.error(`키 경로: ${keyPath}`);
    serverLogger.error('\n파일이 존재하는지 확인하거나 mkcert로 새로 생성하세요.');
    process.exit(1);
  }

  if (certPath && keyPath) {
    useHttps = true;
    httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
    serverLogger.info('✅ SSL 인증서 발견, HTTPS 서버 시작');
  }
}

app.prepare().then(() => {
  // HTTP(S) 서버 생성 (요청 핸들러는 아래에서 별도 등록)
  const server = useHttps ? createHttpsServer(httpsOptions) : createServer();

  const io = new Server(server, {
    path: '/api/socket',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Socket.io 핸드쉐이크/업그레이드를 직접 처리하여 Next로 안 넘김
  server.on('request', (req, res) => {
    if (req.url?.startsWith('/api/socket')) {
      const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const query = Object.fromEntries(urlObj.searchParams.entries());

      // Fix for type error: IncomingMessage is not EngineRequest
      // Attach parsed query so engine can read EIO/transport params
      (io.engine as any).handleRequest(Object.assign(req, { _query: query }), res);
      return;
    }

    if (req.url) {
      const parsedUrl = parse(req.url, true);
      applyRuntimeEnvHeader(res);
      handle(req, res, parsedUrl);
    } else {
      res.statusCode = 400;
      res.end('Bad Request: Missing URL');
    }
  });

  server.on('upgrade', (req, socket, head) => {
    if (req.url?.startsWith('/api/socket')) {
      const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const query = Object.fromEntries(urlObj.searchParams.entries());

      // Fix for type error: IncomingMessage is not EngineRequest
      // Attach parsed query so engine can read EIO/transport params
      (io.engine as any).handleUpgrade(Object.assign(req, { _query: query }), socket, head);
      return;
    }
    // 나머지 업그레이드는 Next(HMR 등)에서 처리되도록 그대로 둔다.
  });

  // --- Socket.io middleware 파이프라인 ---
  const registerHandlersMiddleware =
    (ioInstance: Server) => (socket: any, next: (err?: Error) => void) => {
      registerRoomHandlers(ioInstance, socket);
      registerMessageHandlers(ioInstance, socket);
      next();
    };

  io.use(registerHandlersMiddleware(io));

  io.on(SOCKET_LIFECYCLE.CONNECTION, (socket) => {
    serverLogger.info('New Socket.io connection:', socket.id);

    socket.on(SOCKET_LIFECYCLE.DISCONNECT, async () => {
      serverLogger.info('Client disconnected:', socket.id);
    });
  });

  server.listen(port, hostname, async () => {
    const protocol = useHttps ? 'https' : 'http';
    serverLogger.info(`> Ready on ${protocol}://${hostname}:${port}`);
    serverLogger.info(`> Access from your Mac: ${protocol}://localhost:${port}`);
    if (dev && useHttps) {
      // Get the local IP address
      const { networkInterfaces } = await import('os');
      const nets = networkInterfaces();
      for (const name of Object.keys(nets)) {
        const netArray = nets[name];
        if (!netArray) continue;
        for (const net of netArray) {
          if (net && net.family === 'IPv4' && !net.internal) {
            serverLogger.info(`> Access from iPhone: ${protocol}://${net.address}:${port}`);
            break;
          }
        }
      }
    }
    serverLogger.info('> Socket.io server running');
  });
});
