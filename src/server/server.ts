// Load environment variables first (now handled by config.ts)

import { createServer, IncomingMessage } from 'http';
import { createServer as createHttpsServer } from 'https';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { registerRoomHandlers } from './handlers/roomHandler';
import { registerMessageHandlers } from './handlers/messageHandler';
import { SOCKET_LIFECYCLE } from '../types/events';
import { serverLogger } from '../lib/logger/server';
import { applyRuntimeEnvHeader } from '../middleware/server/runtimeEnv';
import { applySecurityHeaders } from '../middleware/server/security';
import { CustomSocket } from '../types/socket';

import { config, getHttpsOptions } from './config';

const { dev, hostname, port } = config;

const app = next({
  dev,
  hostname,
  port,
  dir: '.',
});
const handle = app.getRequestHandler();

// SSL 인증서 설정 가져오기
const httpsOptions = dev ? getHttpsOptions() : null;
const useHttps = !!httpsOptions;

if (dev && !useHttps) {
  serverLogger.warn('� SSL 인증서를 찾을 수 없어 HTTP 모드로 시작합니다.');
} else if (useHttps) {
  serverLogger.info('✅ SSL 인증서 발견, HTTPS 서버 시작');
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

  // Custom request type for Engine.IO compatibility
  interface EngineRequest extends IncomingMessage {
    _query?: Record<string, string | string[] | undefined>;
  }

  // Socket.io 핸드쉐이크/업그레이드를 직접 처리하여 Next로 안 넘김
  server.on('request', (req, res) => {
    if (req.url?.startsWith('/api/socket')) {
      const urlObj = new URL(
        req.url,
        `http://${req.headers.host || 'localhost'}`,
      );
      const query = Object.fromEntries(urlObj.searchParams.entries());

      // Attach parsed query so engine can read EIO/transport params
      io.engine.handleRequest(
        Object.assign(req as EngineRequest, { _query: query }),
        res,
      );
      return;
    }

    if (req.url) {
      const parsedUrl = parse(req.url, true);
      applyRuntimeEnvHeader(res);
      applySecurityHeaders(res);
      handle(req, res, parsedUrl);
    } else {
      res.statusCode = 400;
      res.end('Bad Request: Missing URL');
    }
  });

  server.on('upgrade', (req, socket, head) => {
    if (req.url?.startsWith('/api/socket')) {
      const urlObj = new URL(
        req.url,
        `http://${req.headers.host || 'localhost'}`,
      );
      const query = Object.fromEntries(urlObj.searchParams.entries());

      (io.engine as any).handleUpgrade(
        Object.assign(req as EngineRequest, { _query: query }),
        socket,
        head,
      );
      return;
    }
    // 나머지 업그레이드는 Next(HMR 등)에서 처리되도록 그대로 둔다.
  });

  // --- Socket.io middleware 파이프라인 ---
  const registerHandlersMiddleware =
    (ioInstance: Server) =>
      (socket: CustomSocket, next: (err?: Error) => void) => {
        registerRoomHandlers(ioInstance, socket);
        registerMessageHandlers(ioInstance, socket);
        next();
      };

  io.use(registerHandlersMiddleware(io));

  io.on(SOCKET_LIFECYCLE.CONNECTION, (socket: CustomSocket) => {
    serverLogger.info('New Socket.io connection:', socket.id);

    socket.on(SOCKET_LIFECYCLE.DISCONNECT, async () => {
      serverLogger.info('Client disconnected:', socket.id);
    });
  });

  server.listen(port, hostname, async () => {
    const protocol = useHttps ? 'https' : 'http';
    serverLogger.info(`> Ready on ${protocol}://${hostname}:${port}`);
    serverLogger.info(`> local: ${protocol}://localhost:${port}`);
    if (dev && useHttps) {
      // Get the local IP address
      const { networkInterfaces } = await import('os');
      const nets = networkInterfaces();
      for (const name of Object.keys(nets)) {
        const netArray = nets[name];
        if (!netArray) continue;
        for (const net of netArray) {
          if (net && net.family === 'IPv4' && !net.internal) {
            serverLogger.info(`> client: ${protocol}://${net.address}:${port}`);
            break;
          }
        }
      }
    }
    serverLogger.info('> Socket.io server running');
  });
});
