<template>
  <div class="chat-container">
    <div class="chat-sidebar">
      <div class="sidebar-header">
        <h2>BubuChat</h2>
        <el-button
          type="primary"
          :icon="Plus"
          circle
          @click="showNewChatDialog = true"
        />
      </div>

      <el-tabs v-model="activeTab" class="chat-tabs">
        <el-tab-pane label="会话" name="conversations">
          <div class="conversation-list">
            <div
              v-for="conversation in chatStore.conversations"
              :key="conversation.id"
              class="conversation-item"
              :class="{ active: chatStore.currentConversation?.id === conversation.id }"
              @click="selectConversation(conversation)"
            >
              <div class="avatar">
                <el-avatar :size="48" :src="conversation.otherUser?.avatar">
                  {{ conversation.otherUser?.username?.charAt(0).toUpperCase() }}
                </el-avatar>
                <span
                  v-if="conversation.otherUser?.status === 'online'"
                  class="status-indicator online"
                />
                <span
                  v-else
                  class="status-indicator offline"
                />
              </div>
              <div class="conversation-info">
                <div class="conversation-header">
                  <span class="username">{{ conversation.otherUser?.username }}</span>
                  <span class="time">{{ formatTime(conversation.last_message_at) }}</span>
                </div>
                <div class="conversation-preview">
                  <span class="message">{{ conversation.last_message || '暂无消息' }}</span>
                  <el-badge
                    v-if="conversation.unread_count > 0"
                    :value="conversation.unread_count"
                    class="unread-badge"
                  />
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="联系人" name="contacts">
          <div class="contact-list">
            <div
              v-for="user in chatStore.users"
              :key="user.id"
              class="contact-item"
              @click="startChat(user)"
            >
              <div class="avatar">
                <el-avatar :size="48" :src="user.avatar">
                  {{ user.username.charAt(0).toUpperCase() }}
                </el-avatar>
                <span
                  v-if="user.status === 'online'"
                  class="status-indicator online"
                />
                <span
                  v-else
                  class="status-indicator offline"
                />
              </div>
              <div class="contact-info">
                <span class="username">{{ user.username }}</span>
                <span class="status">{{ getStatusText(user.status) }}</span>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <div class="chat-main">
      <div v-if="!chatStore.currentConversation" class="empty-state">
        <el-empty description="选择一个会话开始聊天" />
      </div>

      <div v-else class="chat-content">
        <div class="chat-header">
          <div class="user-info">
            <el-avatar :size="40" :src="chatStore.currentConversation.otherUser?.avatar">
              {{ chatStore.currentConversation.otherUser?.username?.charAt(0).toUpperCase() }}
            </el-avatar>
            <div>
              <h3>{{ chatStore.currentConversation.otherUser?.username }}</h3>
              <span class="status">{{ getStatusText(chatStore.currentConversation.otherUser?.status) }}</span>
            </div>
          </div>
          <el-button
            type="danger"
            :icon="Close"
            circle
            @click="closeConversation"
          />
        </div>

        <div ref="messagesContainer" class="messages-container">
          <div
            v-for="message in chatStore.currentMessages"
            :key="message.id"
            class="message-item"
            :class="{ 'message-sent': message.sender_id === authStore.user?.id }"
          >
            <el-avatar
              :size="36"
              :src="message.sender?.avatar"
              class="message-avatar"
            >
              {{ message.sender?.username?.charAt(0).toUpperCase() }}
            </el-avatar>
            <div class="message-content">
              <div class="message-bubble">
                <p>{{ message.content }}</p>
              </div>
              <span class="message-time">{{ formatMessageTime(message.created_at) }}</span>
            </div>
            <el-button
              v-if="message.sender_id === authStore.user?.id"
              type="danger"
              :icon="Delete"
              size="small"
              circle
              class="delete-btn"
              @click="deleteMessage(message.id)"
            />
          </div>

          <div v-if="chatStore.typingUsers.includes(chatStore.currentConversation.other_user_id!)" class="typing-indicator">
            <span>对方正在输入...</span>
          </div>
        </div>

        <div class="chat-input">
          <el-input
            v-model="messageInput"
            type="textarea"
            :rows="3"
            placeholder="输入消息..."
            @input="handleInput"
            @keydown.enter.prevent="handleEnter"
          />
          <div class="input-actions">
            <span v-if="isTyping" class="typing-status">正在输入...</span>
            <el-button
              type="primary"
              :icon="Position"
              @click="sendMessage"
            >
              发送
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <el-dialog
    v-model="showNewChatDialog"
    title="开始新对话"
    width="400px"
  >
    <el-input
      v-model="searchQuery"
      placeholder="搜索用户..."
      clearable
    />
    <div class="user-list">
      <div
        v-for="user in filteredUsers"
        :key="user.id"
        class="user-item"
        @click="startChat(user); showNewChatDialog = false"
      >
        <el-avatar :size="40" :src="user.avatar">
          {{ user.username.charAt(0).toUpperCase() }}
        </el-avatar>
        <span>{{ user.username }}</span>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Close, Position, Delete } from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth';
import { useChatStore } from '@/stores/chat';
import socketService from '@/socket';
import type { User, Conversation } from '@/types';

const router = useRouter();
const authStore = useAuthStore();
const chatStore = useChatStore();

const activeTab = ref('conversations');
const messageInput = ref('');
const messagesContainer = ref<HTMLElement>();
const showNewChatDialog = ref(false);
const searchQuery = ref('');
const isTyping = ref(false);
let typingTimeout: any;

const filteredUsers = computed(() => {
  if (!searchQuery.value) return chatStore.users;
  return chatStore.users.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login');
    return;
  }

  await chatStore.fetchUsers();
  await chatStore.fetchConversations();

  setupSocketListeners();
});

onUnmounted(() => {
  socketService.off('new_message');
  socketService.off('user_typing');
  socketService.off('user_stop_typing');
  socketService.off('user_status_changed');
});

function setupSocketListeners() {
  socketService.on('new_message', (data) => {
    chatStore.addMessage(data);
    scrollToBottom();
  });

  socketService.on('user_typing', (data) => {
    chatStore.updateTypingUsers(data.user_id, true);
  });

  socketService.on('user_stop_typing', (data) => {
    chatStore.updateTypingUsers(data.user_id, false);
  });

  socketService.on('user_status_changed', (data) => {
    chatStore.updateUserStatus(data.user_id, data.status);
  });
}

function selectConversation(conversation: Conversation) {
  chatStore.selectConversation(conversation);
  activeTab.value = 'conversations';
  nextTick(() => {
    scrollToBottom();
  });
}

function startChat(user: User) {
  const existingConversation = chatStore.conversations.find(
    (c) => c.other_user_id === user.id
  );

  if (existingConversation) {
    selectConversation(existingConversation);
  } else {
    const newConversation: Conversation = {
      id: Date.now(),
      user_id: authStore.user!.id,
      other_user_id: user.id,
      otherUser: user,
      last_message: '',
      unread_count: 0,
    };
    chatStore.updateConversation(newConversation);
    selectConversation(newConversation);
  }
}

function closeConversation() {
  chatStore.currentConversation = null;
  chatStore.currentMessages = [];
}

function sendMessage() {
  if (!messageInput.value.trim() || !chatStore.currentConversation) return;

  const receiverId = chatStore.currentConversation.other_user_id!;
  chatStore.sendMessage(receiverId, messageInput.value);
  messageInput.value = '';
  isTyping.value = false;
  stopTyping();
}

function handleInput() {
  if (!isTyping.value) {
    isTyping.value = true;
    if (chatStore.currentConversation?.other_user_id) {
      chatStore.sendTyping(chatStore.currentConversation.other_user_id);
    }
  }

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    isTyping.value = false;
    stopTyping();
  }, 1000);
}

function stopTyping() {
  if (chatStore.currentConversation?.other_user_id) {
    chatStore.stopTyping(chatStore.currentConversation.other_user_id);
  }
}

function handleEnter(event: KeyboardEvent) {
  if (!event.shiftKey) {
    sendMessage();
  }
}

function deleteMessage(messageId: number) {
  ElMessageBox.confirm('确定要删除这条消息吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    chatStore.deleteMessage(messageId);
    ElMessage.success('删除成功');
  }).catch(() => {});
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

function formatTime(date?: Date): string {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  return d.toLocaleDateString();
}

function formatMessageTime(date: Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getStatusText(status?: string): string {
  switch (status) {
    case 'online':
      return '在线';
    case 'offline':
      return '离线';
    case 'away':
      return '离开';
    default:
      return '未知';
  }
}

watch(() => chatStore.currentMessages, () => {
  scrollToBottom();
}, { deep: true });
</script>

<style scoped>
.chat-container {
  display: flex;
  width: 100%;
  height: 100vh;
  background: #f5f5f5;
}

.chat-sidebar {
  width: 320px;
  background: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.sidebar-header h2 {
  font-size: 24px;
  color: #333;
  margin: 0;
}

.chat-tabs {
  flex: 1;
  overflow: hidden;
}

:deep(.el-tabs__content) {
  height: calc(100% - 55px);
  overflow-y: auto;
}

.conversation-list,
.contact-list {
  padding: 8px;
}

.conversation-item,
.contact-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-bottom: 4px;
}

.conversation-item:hover,
.contact-item:hover {
  background-color: #f5f5f5;
}

.conversation-item.active {
  background-color: #e3f2fd;
}

.avatar {
  position: relative;
  margin-right: 12px;
}

.status-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
}

.status-indicator.online {
  background-color: #52c41a;
}

.status-indicator.offline {
  background-color: #999;
}

.conversation-info,
.contact-info {
  flex: 1;
  min-width: 0;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.username {
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.time {
  font-size: 12px;
  color: #999;
  flex-shrink: 0;
  margin-left: 8px;
}

.conversation-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.message {
  font-size: 14px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.unread-badge {
  flex-shrink: 0;
}

.status {
  font-size: 12px;
  color: #999;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.user-info .status {
  font-size: 12px;
  color: #999;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f5f5f5;
}

.message-item {
  display: flex;
  align-items: flex-end;
  margin-bottom: 16px;
  position: relative;
}

.message-item.message-sent {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

.message-content {
  max-width: 60%;
  margin: 0 12px;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message-item.message-sent .message-bubble {
  background: #667eea;
  color: white;
}

.message-bubble p {
  margin: 0;
  word-wrap: break-word;
}

.message-time {
  display: block;
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}

.message-item.message-sent .message-time {
  text-align: right;
}

.delete-btn {
  position: absolute;
  right: 0;
  bottom: 0;
  opacity: 0;
  transition: opacity 0.2s;
}

.message-item:hover .delete-btn {
  opacity: 1;
}

.typing-indicator {
  padding: 8px 16px;
  color: #999;
  font-size: 14px;
  font-style: italic;
}

.chat-input {
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
  background: white;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.typing-status {
  font-size: 12px;
  color: #999;
}

.user-list {
  margin-top: 16px;
  max-height: 300px;
  overflow-y: auto;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.user-item:hover {
  background-color: #f5f5f5;
}

@media (max-width: 768px) {
  .chat-sidebar {
    width: 280px;
  }

  .message-content {
    max-width: 80%;
  }
}

@media (max-width: 480px) {
  .chat-sidebar {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 100;
    transform: translateX(-100%);
    transition: transform 0.3s;
  }

  .chat-sidebar.open {
    transform: translateX(0);
  }
}
</style>
