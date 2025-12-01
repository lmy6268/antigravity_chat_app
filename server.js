// Load environment variables from .env.local
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

// Check for SSL certificates
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
      console.log('✅ SSL certificates found, starting HTTPS server');
    } else {
      console.log('ℹ️  No SSL certificates found, starting HTTP server');
    }
  } catch (err) {
    console.log('⚠️  Error loading SSL certificates, falling back to HTTP:', err.message);
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

  // Socket.io Server
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
        // Add user to room_participants table
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

        // Load and send message history
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
        // Insert message into Supabase
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
          
          // Broadcast to all clients in the room EXCEPT the sender
          socket.broadcast.to(roomId).emit('message', payload);
          console.log(`Broadcast message to room ${roomId}`);
        }
      } catch (e) {
        console.error('Error processing message:', e);
      }
    });

    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id);
      
      // Remove user from room participants
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
