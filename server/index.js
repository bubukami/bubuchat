const http = require('http');
const { Server } = require('socket.io');

const httpServer = http.createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const users = new Map();
const messages = [];

io.on('connection', (socket) => {
  console.log('新用户连接:', socket.id);

  socket.on('join', (data) => {
    const { userId, username, avatar } = data;
    
    users.set(socket.id, {
      userId,
      username,
      avatar: avatar || '',
      socketId: socket.id,
    });

    socket.emit('joined', {
      userId,
      username,
      avatar: avatar || '',
      messages: messages,
      users: Array.from(users.values()).map(u => ({
        userId: u.userId,
        username: u.username,
        avatar: u.avatar,
      })),
    });

    socket.broadcast.emit('user_joined', {
      userId,
      username,
      avatar: avatar || '',
    });

    console.log(`用户 ${username} (${userId}) 加入聊天`);
  });

  socket.on('send_message', (data) => {
    const { userId, username, avatar, content } = data;
    const user = users.get(socket.id);

    if (!user) return;

    const message = {
      id: Date.now(),
      userId,
      username,
      avatar: avatar || '',
      content,
      timestamp: new Date().toISOString(),
    };

    messages.push(message);

    io.emit('new_message', message);
    console.log(`消息: ${username}: ${content}`);
  });

  socket.on('typing', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    socket.broadcast.emit('user_typing', {
      userId: user.userId,
      username: user.username,
    });
  });

  socket.on('stop_typing', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    socket.broadcast.emit('user_stop_typing', {
      userId: user.userId,
      username: user.username,
    });
  });

  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      users.delete(socket.id);
      socket.broadcast.emit('user_left', {
        userId: user.userId,
        username: user.username,
      });
      console.log(`用户 ${user.username} (${user.userId}) 离开聊天`);
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`聊天服务器运行在端口 ${PORT}`);
  console.log(`访问 http://localhost:${PORT} 查看状态`);
});
