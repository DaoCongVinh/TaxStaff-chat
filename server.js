const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Track users in rooms
const rooms = {};

io.on('connection', (socket) => {
  // User joins a room
  socket.on('joinRoom', ({ username, room }) => {
    if (
      typeof username !== 'string' ||
      typeof room !== 'string' ||
      !username.trim() ||
      !room.trim() ||
      username.length > 20 ||
      room.length > 30
    ) {
      return;
    }

    socket.join(room);
    socket.username = username.trim();
    socket.room = room.trim();

    if (!rooms[room]) {
      rooms[room] = new Set();
    }
    rooms[room].add(socket.username);

    // Notify room members that a new user joined
    socket.to(room).emit('message', {
      username: 'System',
      text: `${socket.username} đã tham gia phòng chat`,
      time: new Date().toLocaleTimeString('vi-VN'),
    });

    // Send current user list to everyone in the room
    io.to(room).emit('roomUsers', {
      room,
      users: Array.from(rooms[room]),
    });
  });

  // Handle chat message
  socket.on('chatMessage', (text) => {
    const room = socket.room;
    if (!room) return;
    if (typeof text !== 'string' || !text.trim() || text.length > 500) return;

    io.to(room).emit('message', {
      username: socket.username,
      text: text.trim(),
      time: new Date().toLocaleTimeString('vi-VN'),
    });
  });

  // Handle explicit leave
  socket.on('leaveRoom', () => {
    const { username, room } = socket;
    if (!username || !room || !rooms[room]) return;

    socket.leave(room);
    rooms[room].delete(username);
    socket.username = undefined;
    socket.room = undefined;

    io.to(room).emit('message', {
      username: 'System',
      text: `${username} đã rời khỏi phòng chat`,
      time: new Date().toLocaleTimeString('vi-VN'),
    });

    io.to(room).emit('roomUsers', {
      room,
      users: Array.from(rooms[room]),
    });

    if (rooms[room].size === 0) {
      delete rooms[room];
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const { username, room } = socket;
    if (!username || !room || !rooms[room]) return;

    rooms[room].delete(username);

    io.to(room).emit('message', {
      username: 'System',
      text: `${username} đã rời khỏi phòng chat`,
      time: new Date().toLocaleTimeString('vi-VN'),
    });

    io.to(room).emit('roomUsers', {
      room,
      users: Array.from(rooms[room]),
    });

    if (rooms[room].size === 0) {
      delete rooms[room];
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
