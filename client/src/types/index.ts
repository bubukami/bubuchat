export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  last_seen?: Date;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  message_type: 'text' | 'image' | 'file';
  is_read: boolean;
  read_at?: Date;
  created_at: Date;
  sender?: User;
}

export interface Conversation {
  id: number;
  user_id: number;
  other_user_id?: number;
  room_id?: string;
  last_message?: string;
  last_message_at?: Date;
  unread_count: number;
  otherUser?: User;
}

export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  limit: number;
}
