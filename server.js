
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;
const app = next({ dev });
const handle = app.getRequestHandler();

const MESSAGES_FILE = path.join(__dirname, 'data', 'messages.json');
const ROOMS_FILE = path.join(__dirname, 'data', 'rooms.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
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
    }
  });

  io.on('connection', (socket) => {
    console.log('New Socket.io connection:', socket.id);

    socket.on('join', (data) => {
      const { roomId, username } = data;
      socket.join(roomId);
      socket.roomId = roomId;
      socket.username = username;
      console.log(`Client ${socket.id} (${username}) joined room: ${roomId}`);

      // Add user to room participants
      try {
        const roomsData = fs.readFileSync(ROOMS_FILE, 'utf8');
        const rooms = JSON.parse(roomsData);
        
        if (rooms[roomId]) {
          // Add username if not already in participants
          if (!rooms[roomId].participants.includes(username)) {
            rooms[roomId].participants.push(username);
            fs.writeFileSync(ROOMS_FILE, JSON.stringify(rooms, null, 2));
            console.log(`Added ${username} to room ${roomId} participants`);
          }
        }
      } catch (e) {
        console.error('Error updating room participants:', e);
      }

      // Add room to user's activeRooms
      try {
        const usersData = fs.readFileSync(USERS_FILE, 'utf8');
        const users = JSON.parse(usersData);
        
        const user = users.find(u => u.username === username);
        if (user) {
          if (!user.activeRooms) user.activeRooms = [];
          if (!user.activeRooms.includes(roomId)) {
            user.activeRooms.push(roomId);
            fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
            console.log(`Added room ${roomId} to ${username}'s activeRooms`);
          }
        }
      } catch (e) {
        console.error('Error updating user activeRooms:', e);
      }

      // Load and send history
      try {
        // Check if messages.json exists, create if not
        if (!fs.existsSync(MESSAGES_FILE)) {
          const dir = path.dirname(MESSAGES_FILE);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          fs.writeFileSync(MESSAGES_FILE, '{}', 'utf8');
        }

        const messagesData = fs.readFileSync(MESSAGES_FILE, 'utf8');
        const allMessages = JSON.parse(messagesData);
        const roomMessages = allMessages[roomId] || [];
        console.log(`Sending ${roomMessages.length} history messages to ${socket.id}`);
        
        roomMessages.forEach(msg => {
          socket.emit('message', msg);
        });
      } catch (e) {
        console.error('Error loading history:', e);
      }
    });

    socket.on('message', (data) => {
      const { roomId, payload } = data;
      console.log(`Received message for room: ${roomId}`);

      try {
        // Check if messages.json exists, create if not
        if (!fs.existsSync(MESSAGES_FILE)) {
          const dir = path.dirname(MESSAGES_FILE);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          fs.writeFileSync(MESSAGES_FILE, '{}', 'utf8');
        }

        // Persist message
        const messagesData = fs.readFileSync(MESSAGES_FILE, 'utf8');
        const allMessages = JSON.parse(messagesData);
        
        if (!allMessages[roomId]) {
          allMessages[roomId] = [];
        }
        
        allMessages[roomId].push(payload);
        fs.writeFileSync(MESSAGES_FILE, JSON.stringify(allMessages, null, 2));
        console.log(`Message saved. Total messages in room: ${allMessages[roomId].length}`);

        // Broadcast to all clients in the room EXCEPT the sender
        socket.broadcast.to(roomId).emit('message', payload);
        console.log(`Broadcast message to room ${roomId}`);
      } catch (e) {
        console.error('Error processing message:', e);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      // Remove user from room participants
      if (socket.roomId && socket.username) {
        try {
          const roomsData = fs.readFileSync(ROOMS_FILE, 'utf8');
          const rooms = JSON.parse(roomsData);
          
          if (rooms[socket.roomId]) {
            const index = rooms[socket.roomId].participants.indexOf(socket.username);
            if (index > -1) {
              rooms[socket.roomId].participants.splice(index, 1);
              fs.writeFileSync(ROOMS_FILE, JSON.stringify(rooms, null, 2));
              console.log(`Removed ${socket.username} from room ${socket.roomId} participants`);
            }
          }
        } catch (e) {
          console.error('Error removing participant:', e);
        }

        // Remove room from user's activeRooms
        try {
          const usersData = fs.readFileSync(USERS_FILE, 'utf8');
          const users = JSON.parse(usersData);
          
          const user = users.find(u => u.username === socket.username);
          if (user && user.activeRooms) {
            const roomIndex = user.activeRooms.indexOf(socket.roomId);
            if (roomIndex > -1) {
              user.activeRooms.splice(roomIndex, 1);
              fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
              console.log(`Removed room ${socket.roomId} from ${socket.username}'s activeRooms`);
            }
          }
        } catch (e) {
          console.error('Error removing room from activeRooms:', e);
        }
      }
    });
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.io server running`);
  });
});
