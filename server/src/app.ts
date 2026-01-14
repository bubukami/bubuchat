import express from 'express';
import * as http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import sequelize from './utils/database';
import { User, Message, Conversation } from './models';
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimit';
import ChatSocket from './socket/chatSocket';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(generalLimiter);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '服务运行正常',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

app.use(errorHandler);

const chatSocket = new ChatSocket(io);

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    await sequelize.sync({ force: false });
    console.log('数据库表同步成功');

    server.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
      console.log(`Socket.io 服务器已启动`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();

export { io };
