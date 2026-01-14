import api from './api';
import type { ApiResponse, User, Message, Conversation, PaginatedResponse } from '@/types';

export const authApi = {
  register: (username: string, email: string, password: string) => {
    return api.post<ApiResponse<{ token: string; user: User }>>('/auth/register', {
      username,
      email,
      password,
    });
  },

  login: (username: string, password: string) => {
    return api.post<ApiResponse<{ token: string; user: User }>>('/auth/login', {
      username,
      password,
    });
  },

  logout: () => {
    return api.post<ApiResponse>('/auth/logout');
  },

  getMe: () => {
    return api.get<ApiResponse<User>>('/auth/me');
  },
};

export const chatApi = {
  getUsers: () => {
    return api.get<ApiResponse<User[]>>('/chat/users');
  },

  getConversations: () => {
    return api.get<ApiResponse<Conversation[]>>('/chat/conversations');
  },

  getMessages: (userId: number, page: number = 1, limit: number = 50) => {
    return api.get<ApiResponse<PaginatedResponse<Message>>>(`/chat/messages/${userId}`, {
      params: { page, limit },
    });
  },

  markAsRead: (userId: number) => {
    return api.post<ApiResponse>(`/chat/messages/${userId}/read`);
  },

  deleteMessage: (messageId: number) => {
    return api.delete<ApiResponse>(`/chat/messages/${messageId}`);
  },
};
