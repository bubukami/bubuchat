import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() {
    const authStore = useAuthStore();
    const token = authStore.token;

    if (!token) {
      console.error('未找到认证令牌');
      return;
    }

    if (this.socket?.connected) {
      console.log('Socket 已连接');
      return;
    }

    this.socket = io('http://localhost:3000', {
      auth: {
        token,
      },
      transports: ['websocket'],
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket 已连接');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      console.log('Socket 已断开连接');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket 连接错误:', error);
      this.handleReconnect();
    });

    this.socket.on('new_message', (data) => {
      console.log('收到新消息:', data);
    });

    this.socket.on('user_typing', (data) => {
      console.log('用户正在输入:', data);
    });

    this.socket.on('user_stop_typing', (data) => {
      console.log('用户停止输入:', data);
    });

    this.socket.on('user_status_changed', (data) => {
      console.log('用户状态改变:', data);
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`尝试重新连接 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => {
        this.connect();
      }, 3000 * this.reconnectAttempts);
    } else {
      console.error('达到最大重连次数');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinConversation(userId: number) {
    if (this.socket) {
      this.socket.emit('join_conversation', { userId });
    }
  }

  sendMessage(receiverId: number, content: string) {
    if (this.socket) {
      this.socket.emit('send_message', {
        receiver_id: receiverId,
        content,
      });
    }
  }

  sendTyping(receiverId: number) {
    if (this.socket) {
      this.socket.emit('typing', { receiver_id: receiverId });
    }
  }

  stopTyping(receiverId: number) {
    if (this.socket) {
      this.socket.emit('stop_typing', { receiver_id: receiverId });
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export default new SocketService();
