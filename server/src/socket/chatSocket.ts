import { Server, Socket } from 'socket.io';
import { User, Message, Conversation } from '../models';
import { AuthRequest } from '../middleware/auth';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  username?: string;
}

export class ChatSocket {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.use(async (socket: any, next) => {
      try {
        const token = socket.handshake.auth.token;

        if (!token) {
          return next(new Error('未提供认证令牌'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;

        socket.userId = decoded.id;
        socket.username = decoded.username;

        await User.update(
          { status: 'online', last_seen: new Date() },
          { where: { id: decoded.id } }
        );

        next();
      } catch (error) {
        next(new Error('认证失败'));
      }
    });

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`用户 ${socket.username} (${socket.userId}) 已连接`);

      socket.join(`user_${socket.userId}`);

      this.handleJoinRoom(socket);
      this.handleSendMessage(socket);
      this.handleTyping(socket);
      this.handleDisconnect(socket);

      this.broadcastOnlineStatus(socket.userId, 'online');
    });
  }

  private handleJoinRoom(socket: AuthenticatedSocket) {
    socket.on('join_conversation', async (data: { userId: number }) => {
      const { userId } = data;

      if (!socket.userId) return;

      const roomName = `chat_${Math.min(socket.userId, userId)}_${Math.max(socket.userId, userId)}`;
      socket.join(roomName);

      const conversation = await Conversation.findOne({
        where: {
          user_id: socket.userId,
          other_user_id: userId,
        },
      });

      if (!conversation) {
        await Conversation.create({
          user_id: socket.userId,
          other_user_id: userId,
          room_id: roomName,
        });
      }

      socket.emit('joined_conversation', { roomName });
    });
  }

  private async handleSendMessage(socket: AuthenticatedSocket) {
    socket.on('send_message', async (data: { receiver_id: number; content: string }) => {
      const { receiver_id, content } = data;

      if (!socket.userId) return;

      try {
        const message = await Message.create({
          sender_id: socket.userId,
          receiver_id,
          content,
          message_type: 'text',
          is_read: false,
        });

        const roomName = `chat_${Math.min(socket.userId, receiver_id)}_${Math.max(socket.userId, receiver_id)}`;

        await this.updateConversation(socket.userId, receiver_id, content);

        this.io.to(roomName).emit('new_message', {
          id: message.id,
          sender_id: message.sender_id,
          receiver_id: message.receiver_id,
          content: message.content,
          message_type: message.message_type,
          is_read: message.is_read,
          created_at: message.createdAt,
        });

        this.io.to(`user_${receiver_id}`).emit('new_message_notification', {
          sender_id: socket.userId,
          content,
        });
      } catch (error) {
        console.error('发送消息失败:', error);
        socket.emit('message_error', { message: '发送消息失败' });
      }
    });
  }

  private handleTyping(socket: AuthenticatedSocket) {
    socket.on('typing', (data: { receiver_id: number }) => {
      const { receiver_id } = data;

      if (!socket.userId) return;

      const roomName = `chat_${Math.min(socket.userId, receiver_id)}_${Math.max(socket.userId, receiver_id)}`;

      socket.to(roomName).emit('user_typing', {
        user_id: socket.userId,
      });
    });

    socket.on('stop_typing', (data: { receiver_id: number }) => {
      const { receiver_id } = data;

      if (!socket.userId) return;

      const roomName = `chat_${Math.min(socket.userId, receiver_id)}_${Math.max(socket.userId, receiver_id)}`;

      socket.to(roomName).emit('user_stop_typing', {
        user_id: socket.userId,
      });
    });
  }

  private async handleDisconnect(socket: AuthenticatedSocket) {
    if (socket.userId) {
      console.log(`用户 ${socket.username} (${socket.userId}) 已断开连接`);

      await User.update(
        { status: 'offline', last_seen: new Date() },
        { where: { id: socket.userId } }
      );

      this.broadcastOnlineStatus(socket.userId, 'offline');
    }
  }

  private async updateConversation(userId: number, otherUserId: number, lastMessage: string) {
    await Conversation.update(
      {
        last_message: lastMessage,
        last_message_at: new Date(),
      },
      {
        where: {
          user_id: userId,
          other_user_id: otherUserId,
        },
      }
    );

    await Conversation.update(
      {
        last_message: lastMessage,
        last_message_at: new Date(),
      },
      {
        where: {
          user_id: otherUserId,
          other_user_id: userId,
        },
      }
    );
  }

  private broadcastOnlineStatus(userId: number, status: 'online' | 'offline') {
    this.io.emit('user_status_changed', {
      user_id: userId,
      status,
    });
  }

  public getOnlineUsers(): number[] {
    const onlineUsers: number[] = [];
    this.io.of('/').sockets.forEach((socket: any) => {
      if (socket.userId && !onlineUsers.includes(socket.userId)) {
        onlineUsers.push(socket.userId);
      }
    });
    return onlineUsers;
  }
}

export default ChatSocket;
