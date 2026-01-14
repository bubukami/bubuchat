import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { User, Message, Conversation } from '@/types';
import { chatApi } from '@/services';
import socketService from '@/socket';

export const useChatStore = defineStore('chat', () => {
  const users = ref<User[]>([]);
  const conversations = ref<Conversation[]>([]);
  const currentMessages = ref<Message[]>([]);
  const currentConversation = ref<Conversation | null>(null);
  const typingUsers = ref<number[]>([]);
  const loading = ref(false);

  async function fetchUsers() {
    loading.value = true;
    try {
      const response = await chatApi.getUsers();
      if (response.data.code === 200) {
        users.value = response.data.data;
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
    } finally {
      loading.value = false;
    }
  }

  async function fetchConversations() {
    loading.value = true;
    try {
      const response = await chatApi.getConversations();
      if (response.data.code === 200) {
        conversations.value = response.data.data;
      }
    } catch (error) {
      console.error('获取会话列表失败:', error);
    } finally {
      loading.value = false;
    }
  }

  async function fetchMessages(userId: number, page: number = 1) {
    loading.value = true;
    try {
      const response = await chatApi.getMessages(userId, page);
      if (response.data.code === 200) {
        if (page === 1) {
          currentMessages.value = response.data.data.list;
        } else {
          currentMessages.value = [...response.data.data.list, ...currentMessages.value];
        }
      }
    } catch (error) {
      console.error('获取消息记录失败:', error);
    } finally {
      loading.value = false;
    }
  }

  async function markAsRead(userId: number) {
    try {
      await chatApi.markAsRead(userId);
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  }

  async function deleteMessage(messageId: number) {
    try {
      await chatApi.deleteMessage(messageId);
      currentMessages.value = currentMessages.value.filter((m) => m.id !== messageId);
    } catch (error) {
      console.error('删除消息失败:', error);
    }
  }

  function selectConversation(conversation: Conversation) {
    currentConversation.value = conversation;
    if (conversation.other_user_id) {
      fetchMessages(conversation.other_user_id);
      markAsRead(conversation.other_user_id);
      socketService.joinConversation(conversation.other_user_id);
    }
  }

  function sendMessage(receiverId: number, content: string) {
    socketService.sendMessage(receiverId, content);
  }

  function sendTyping(receiverId: number) {
    socketService.sendTyping(receiverId);
  }

  function stopTyping(receiverId: number) {
    socketService.stopTyping(receiverId);
  }

  function addMessage(message: Message) {
    currentMessages.value.push(message);
  }

  function updateConversation(conversation: Conversation) {
    const index = conversations.value.findIndex((c) => c.id === conversation.id);
    if (index !== -1) {
      conversations.value[index] = conversation;
    } else {
      conversations.value.unshift(conversation);
    }
  }

  function updateTypingUsers(userId: number, isTyping: boolean) {
    if (isTyping) {
      if (!typingUsers.value.includes(userId)) {
        typingUsers.value.push(userId);
      }
    } else {
      typingUsers.value = typingUsers.value.filter((id) => id !== userId);
    }
  }

  function updateUserStatus(userId: number, status: 'online' | 'offline') {
    const user = users.value.find((u) => u.id === userId);
    if (user) {
      user.status = status;
    }
  }

  return {
    users,
    conversations,
    currentMessages,
    currentConversation,
    typingUsers,
    loading,
    fetchUsers,
    fetchConversations,
    fetchMessages,
    markAsRead,
    deleteMessage,
    selectConversation,
    sendMessage,
    sendTyping,
    stopTyping,
    addMessage,
    updateConversation,
    updateTypingUsers,
    updateUserStatus,
  };
});
