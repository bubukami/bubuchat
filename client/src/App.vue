<template>
  <div class="app">
    <div v-if="!joined" class="login-screen">
      <div class="login-box">
        <div class="logo">
          <div class="logo-icon">💬</div>
          <h1>BubuChat</h1>
        </div>
        <p class="subtitle">轻量级实时聊天</p>

        <div class="avatar-preview" v-if="avatarPreview">
          <img :src="avatarPreview" alt="头像预览" />
          <button @click="clearAvatar" class="clear-btn">×</button>
        </div>

        <form @submit.prevent="joinChat">
          <div class="avatar-upload">
            <label for="avatarInput" class="upload-label">
              <div class="upload-icon">📷</div>
              <span>上传头像</span>
            </label>
            <input
              id="avatarInput"
              type="file"
              accept="image/*"
              @change="handleAvatarUpload"
              ref="avatarInput"
            />
          </div>

          <input
            v-model="username"
            placeholder="输入你的昵称"
            maxlength="20"
            required
            autofocus
            class="username-input"
          />

          <button type="submit" class="join-btn" :disabled="isJoining">
            开始聊天
            <span class="arrow">→</span>
          </button>
        </form>
      </div>
    </div>

    <div
      v-else
      class="chat-screen"
      :style="{ backgroundImage: customBackground }"
    >
      <div class="sidebar" :class="{ collapsed: sidebarCollapsed }">
        <div class="sidebar-header">
          <div class="user-info-mini">
            <div class="mini-avatar" :style="{ backgroundImage: myAvatar }">
              <span v-if="!myAvatar" class="avatar-text">
                {{ username.charAt(0).toUpperCase() }}
              </span>
            </div>
            <div v-if="!sidebarCollapsed">
              <h2>{{ username }}</h2>
              <span class="user-id">{{ myUserId }}</span>
            </div>
          </div>
          <div class="header-buttons">
            <button
              @click="toggleSidebar"
              class="collapse-btn"
              :title="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'"
            >
              {{ sidebarCollapsed ? "→" : "←" }}
            </button>
            <button
              @click="showSettings = true"
              class="settings-btn"
              v-if="!sidebarCollapsed"
            >
              ⚙️
            </button>
          </div>
        </div>

        <div class="online-count" v-if="!sidebarCollapsed">
          <span class="count">{{ users.length }}</span>
          <span class="label">人在线</span>
        </div>

        <div class="user-list" v-if="!sidebarCollapsed">
          <div
            v-for="user in users"
            :key="user.userId"
            class="user-item"
            :class="{ active: user.userId === myUserId }"
          >
            <div class="user-avatar" :style="{ backgroundImage: user.avatar }">
              <span v-if="!user.avatar" class="avatar-text">
                {{ user.username.charAt(0).toUpperCase() }}
              </span>
            </div>
            <div class="user-details">
              <span class="user-name">{{ user.username }}</span>
              <span v-if="user.typing" class="typing-indicator"
                >正在输入...</span
              >
            </div>
          </div>
        </div>
      </div>

      <div class="chat-area">
        <div
          class="messages"
          ref="messagesContainer"
          @scroll="handleMessagesScroll"
        >
          <!-- 加载更多按钮 -->
          <div v-if="showLoadMore" class="load-more-container">
            <button @click="loadMoreMessages" class="load-more-btn">
              加载更多消息
            </button>
          </div>

          <div v-if="messages.length > 0">
            <div
              v-for="message in displayedMessages"
              :key="message.id"
              class="message"
              :class="{ 'my-message': message.userId === myUserId }"
            >
              <div
                class="message-avatar"
                :style="{ backgroundImage: message.avatar }"
              >
                <span v-if="!message.avatar" class="avatar-text">
                  {{ message.username.charAt(0).toUpperCase() }}
                </span>
              </div>
              <div class="message-content">
                <div class="message-meta">
                  <span class="message-username">{{ message.username }}</span>
                  <span class="message-time">{{
                    formatTime(message.timestamp)
                  }}</span>
                </div>
                <div class="message-bubble">
                  <!-- 文本消息 -->
                  <div v-if="message.type === 'text' || !message.type">
                    {{ message.content }}
                  </div>
                  <!-- 图片消息 -->
                  <div
                    v-else-if="message.type === 'image'"
                    class="image-message"
                  >
                    <a
                      :href="message.content"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        :src="message.content"
                        :alt="message.filename"
                        class="message-image"
                        loading="lazy"
                      />
                    </a>
                    <div v-if="message.filename" class="message-filename">
                      {{ message.filename }}
                    </div>
                  </div>
                  <!-- 文件消息 -->
                  <div v-else-if="message.type === 'file'" class="file-message">
                    <a
                      :href="message.content"
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                    >
                      <div class="file-icon">📄</div>
                      <div class="file-info">
                        <div class="file-name">{{ message.filename }}</div>
                        <div class="file-size">
                          {{ formatFileSize(message.filesize) }}
                        </div>
                      </div>
                      <div class="file-download">↓</div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="no-messages">
            <p>还没有消息，开始聊天吧！</p>
          </div>
        </div>

        <div class="input-area">
          <form @submit.prevent="sendMessage">
            <div class="input-wrapper">
              <input
                v-model="newMessage"
                placeholder="输入消息..."
                @input="handleInput"
                @keydown.enter.prevent="sendMessage"
                class="message-input"
              />
              <button
                type="button"
                @click="showEmojiPicker = !showEmojiPicker"
                class="emoji-btn"
                title="表情"
              >
                😊
              </button>
              <label for="fileInput" class="file-btn" title="上传文件">
                📎
              </label>
              <input
                id="fileInput"
                type="file"
                accept="*/*"
                @change="handleFileUpload"
                ref="fileInput"
                style="display: none"
              />
            </div>
            <button
              type="submit"
              class="send-btn"
              :disabled="!newMessage.trim()"
            >
              发送
            </button>
          </form>

          <!-- 上传进度显示 -->
          <div v-if="isUploading" class="upload-progress-container">
            <div class="progress-bar-wrapper">
              <div
                class="progress-bar"
                :style="{ width: uploadProgress + '%' }"
              ></div>
            </div>
            <div class="progress-text">{{ uploadProgress }}%</div>
          </div>

          <div v-if="showEmojiPicker" class="emoji-picker">
            <span
              v-for="emoji in emojis"
              :key="emoji"
              @click="insertEmoji(emoji)"
              class="emoji-item"
            >
              {{ emoji }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showSettings"
      class="settings-modal"
      @click.self="showSettings = false"
    >
      <div class="settings-content" @click.stop>
        <div class="settings-header">
          <h3>个性化设置</h3>
          <button @click="showSettings = false" class="close-btn">×</button>
        </div>

        <div class="settings-section">
          <h4>🎨 背景图片</h4>
          <div class="background-preview" v-if="customBackground">
            <img :src="customBackground" alt="背景预览" />
            <button @click="clearBackground" class="clear-btn">清除</button>
          </div>
          <label class="upload-btn">
            <span>上传背景</span>
            <input
              type="file"
              accept="image/*"
              @change="handleBackgroundUpload"
            />
          </label>
        </div>

        <div class="settings-section">
          <h4>👤 更换头像</h4>
          <label class="upload-btn">
            <span>上传新头像</span>
            <input type="file" accept="image/*" @change="handleAvatarUpload" />
          </label>
        </div>

        <div class="settings-section">
          <h4>🔄 重置用户ID</h4>
          <p class="settings-description">当前用户ID: {{ myUserId }}</p>
          <button @click="resetUserId" class="reset-btn">重置用户ID</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

const username = ref("");
const joined = ref(false);
const myUserId = ref("");
const myAvatar = ref("");
const avatarPreview = ref("");
const users = ref([]);
const messages = ref([]);
const newMessage = ref("");
const messagesContainer = ref(null);
const showSettings = ref(false);
const showEmojiPicker = ref(false);
const customBackground = ref("");
const selectedTheme = ref("purple");
const uploadProgress = ref(0);
const isUploading = ref(false);
const isJoining = ref(false); // 添加加入状态
const sidebarCollapsed = ref(false); // 侧边栏收起状态

// 消息分页相关变量
const messagesPerPage = ref(50); // 每页显示的消息数量
const displayedMessages = ref([]); // 当前显示的消息
const showLoadMore = ref(false); // 是否显示加载更多按钮

const emojis = [
  "😀",
  "😂",
  "😍",
  "🥰",
  "😎",
  "🎉",
  "🎊",
  "🌈",
  "🔥",
  "❤️",
  "💯",
  "👍",
  "👎",
  "✨",
  "💫",
  "🚀",
  "💬",
  "👋",
  "🙏",
  "🎁",
  "🌟",
  "⭐",
];

let socket = null;
let typingTimeout = null;

function handleAvatarUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    avatarPreview.value = e.target.result;
    myAvatar.value = `url(${e.target.result})`;
  };
  reader.readAsDataURL(file);
}

function clearAvatar() {
  avatarPreview.value = "";
  myAvatar.value = "";
}

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}

function resetUserId() {
  if (confirm("确定要重置用户ID吗？这将创建一个新的用户身份。")) {
    localStorage.removeItem("bubuchat_user_id");
    alert("用户ID已重置，请刷新页面重新加入聊天");
    location.reload();
  }
}

function handleBackgroundUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    customBackground.value = `url(${e.target.result})`;
  };
  reader.readAsDataURL(file);
}

function clearBackground() {
  customBackground.value = "";
}

function joinChat() {
  if (!username.value.trim()) {
    alert("请输入昵称");
    return;
  }

  isJoining.value = true;
  myUserId.value = generateUserId();

  try {
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";
    console.log("尝试连接到服务器:", socketUrl);

    socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socket.on("connect", () => {
      console.log("已连接到服务器");
      socket.emit("join", {
        userId: myUserId.value,
        username: username.value,
        avatar: myAvatar.value,
      });
    });

    socket.on("joined", (data) => {
      console.log("加入成功", data);
      joined.value = true;
      isJoining.value = false;
      users.value = data.users || [];
      messages.value = data.messages || [];

      // 初始化显示的消息，默认显示最新的50条
      displayedMessages.value = messages.value.slice(-messagesPerPage.value);
      showLoadMore.value = messages.value.length > messagesPerPage.value;

      nextTick(() => {
        scrollToBottom();
      });
    });

    socket.on("connect_error", (error) => {
      console.error("连接错误:", error);
      console.error("错误详情:", error.description);
      console.error("错误类型:", error.type);
      alert(
        `连接服务器失败: ${
          error.message || error.description || "请检查网络连接"
        }`
      );
      isJoining.value = false;
    });

    socket.on("disconnect", (reason) => {
      console.log("与服务器断开连接:", reason);
      alert(`与服务器断开连接: ${reason}`);
      isJoining.value = false;
    });

    socket.on("user_joined", (data) => {
      console.log("新用户加入", data);
      users.value.push({
        userId: data.userId,
        username: data.username,
        avatar: data.avatar,
      });
    });

    socket.on("new_message", (data) => {
      console.log("收到消息", data);
      messages.value.push(data);

      // 如果当前显示的是最新消息（滚动到底部），则添加到显示列表
      const container = messagesContainer.value;
      const isAtBottom =
        container &&
        container.scrollTop + container.clientHeight >=
          container.scrollHeight - 10;

      if (
        isAtBottom ||
        displayedMessages.value.length < messagesPerPage.value
      ) {
        displayedMessages.value.push(data);
      }

      nextTick(() => {
        if (isAtBottom) {
          scrollToBottom();
        }
      });
    });

    socket.on("user_typing", (data) => {
      const user = users.value.find((u) => u.userId === data.userId);
      if (user) {
        user.typing = true;
      }
    });

    socket.on("user_stop_typing", (data) => {
      const user = users.value.find((u) => u.userId === data.userId);
      if (user) {
        user.typing = false;
      }
    });

    socket.on("user_left", (data) => {
      console.log("用户离开", data);
      users.value = users.value.filter((u) => u.userId !== data.userId);
    });
  } catch (error) {
    console.error("初始化Socket失败:", error);
    alert("初始化聊天失败，请刷新页面重试");
    isJoining.value = false;
  }
}

function sendMessage() {
  if (!newMessage.value.trim()) return;

  socket.emit("send_message", {
    userId: myUserId.value,
    username: username.value,
    avatar: myAvatar.value,
    content: newMessage.value,
    type: "text",
  });

  stopTyping();
  newMessage.value = "";
}

function handleInput() {
  if (newMessage.value.trim()) {
    socket.emit("typing", {
      userId: myUserId.value,
      username: username.value,
    });

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      stopTyping();
    }, 1000);
  }
}

function stopTyping() {
  socket.emit("stop_typing", {
    userId: myUserId.value,
    username: username.value,
  });
}

function insertEmoji(emoji) {
  newMessage.value += emoji;
  showEmojiPicker.value = false;
}

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // 限制文件大小（5MB）
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    alert("文件大小不能超过5MB");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    // 上传文件到服务器
    const socketUrl = import.meta.env.VITE_SOCKET_URL || "";
    const uploadUrl = socketUrl ? `${socketUrl}/upload` : "/upload";

    // 开始上传，显示进度
    isUploading.value = true;
    uploadProgress.value = 0;

    // 创建XMLHttpRequest以跟踪上传进度
    const xhr = new XMLHttpRequest();

    // 监听上传进度
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        uploadProgress.value = Math.round((e.loaded / e.total) * 100);
      }
    });

    // 发送请求
    const response = await new Promise((resolve, reject) => {
      xhr.open("POST", uploadUrl);
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(`HTTP错误! 状态: ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error("网络错误"));
      xhr.send(formData);
    });

    if (response.success) {
      // 发送文件消息
      socket.emit("send_message", {
        userId: myUserId.value,
        username: username.value,
        avatar: myAvatar.value,
        content: response.url,
        type: file.type.startsWith("image/") ? "image" : "file",
        filename: file.name,
        filesize: file.size,
      });
    }
  } catch (error) {
    console.error("文件上传失败:", error);
    alert("文件上传失败，请重试");
  } finally {
    // 上传完成，重置状态
    isUploading.value = false;
    uploadProgress.value = 0;
  }

  // 重置文件输入
  event.target.value = "";
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatFileSize(bytes) {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// 更新显示的消息
function updateDisplayedMessages() {
  const totalMessages = messages.value.length;
  const startIndex = Math.max(
    0,
    totalMessages - displayedMessages.value.length - messagesPerPage.value
  );
  const endIndex = totalMessages - displayedMessages.value.length;

  if (startIndex < endIndex) {
    const newMessages = messages.value.slice(startIndex, endIndex).reverse();
    displayedMessages.value = [...newMessages, ...displayedMessages.value];
  }

  // 检查是否还有更多消息可以加载
  showLoadMore.value = displayedMessages.value.length < messages.value.length;
}

// 加载更多消息
function loadMoreMessages() {
  updateDisplayedMessages();
}

// 处理消息容器滚动事件
function handleMessagesScroll() {
  const container = messagesContainer.value;
  if (container && container.scrollTop === 0 && showLoadMore.value) {
    loadMoreMessages();
  }
}

function generateUserId() {
  // 检查localStorage中是否已有UID
  let userId = localStorage.getItem("bubuchat_user_id");

  // 如果没有，生成新的UID并保存
  if (!userId) {
    userId =
      "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("bubuchat_user_id", userId);
  }

  return userId;
}

onMounted(() => {
  // 移除了不存在的selectTheme函数调用
  // 如果需要主题功能，可以后续添加
});

onUnmounted(() => {
  if (socket) {
    socket.disconnect();
  }
});
</script>

<style>
:root {
  --primary-color: #667eea;
  --text-color: #333;
  --bg-color: #fff;
  --bubble-bg: #fff;
  --bubble-text: #333;
}

[data-theme="dark"] {
  --text-color: #fff;
  --bg-color: #1a1a1a;
  --bubble-bg: #2a2a2a;
  --bubble-text: #fff;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
    "Microsoft YaHei", sans-serif;
  background: var(--primary-color);
  min-height: 100vh;
}

.app {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-screen {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-color);
}

.login-box {
  background: white;
  padding: 40px 32px;
  border-radius: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  text-align: center;
  min-width: 360px;
  animation: slideUp 0.5s ease-out;
  backdrop-filter: blur(10px);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo {
  margin-bottom: 24px;
}

.logo-icon {
  font-size: 64px;
  margin-bottom: 12px;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.login-box h1 {
  font-size: 36px;
  color: var(--text-color);
  margin-bottom: 8px;
  color: var(--primary-color);
}

.subtitle {
  color: #666;
  margin-bottom: 32px;
  font-size: 16px;
}

.avatar-preview {
  width: 100px;
  height: 100px;
  margin: 0 auto 24px;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  border: 3px solid var(--primary-color);
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.clear-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: #ff4757;
  color: white;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-box form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.avatar-upload {
  position: relative;
}

.avatar-upload input[type="file"] {
  display: none;
}

.upload-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  border: 2px dashed #ddd;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-label:hover {
  border-color: var(--primary-color);
  background: rgba(102, 126, 234, 0.05);
}

.upload-icon {
  font-size: 32px;
}

.username-input {
  padding: 16px 20px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 16px;
  outline: none;
  transition: all 0.3s;
}

.username-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.join-btn {
  padding: 16px 32px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.join-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
}

.join-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.arrow {
  font-size: 20px;
  transition: transform 0.3s;
}

.join-btn:hover .arrow {
  transform: translateX(5px);
}

.chat-screen {
  width: 100%;
  height: 100vh;
  display: flex;
  background: white;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.sidebar {
  width: 280px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(12px);
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.02);
  transition: width 0.3s ease;
}

.sidebar.collapsed {
  width: 60px;
}

.sidebar.collapsed .user-info-mini {
  justify-content: center;
}

.sidebar.collapsed .mini-avatar {
  margin: 0;
}

.sidebar-header {
  padding: 20px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.collapse-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.04);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.collapse-btn:hover {
  background: rgba(0, 0, 0, 0.08);
  transform: scale(1.05);
}

.user-info-mini {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.mini-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 18px;
  background-size: cover;
  background-position: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
  overflow: hidden;
}

.avatar-text {
  z-index: 1;
}

.user-info-mini h2 {
  font-size: 16px;
  color: var(--text-color);
  margin: 0;
  font-weight: 600;
}

.user-id {
  font-size: 11px;
  color: #777;
  display: block;
  opacity: 0.7;
}

.settings-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.04);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.settings-btn:hover {
  background: rgba(0, 0, 0, 0.08);
  transform: rotate(90deg);
}

.online-count {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(102, 126, 234, 0.05);
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.count {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary-color);
}

.label {
  color: #666;
  font-size: 13px;
  opacity: 0.8;
}

.user-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 4px;
  background: rgba(255, 255, 255, 0.6);
}

.user-item:hover {
  background: rgba(102, 126, 234, 0.06);
  transform: translateX(4px);
}

.user-item.active {
  background: var(--primary-color);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  margin-right: 10px;
  flex-shrink: 0;
  background-size: cover;
  background-position: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.user-avatar .avatar-text {
  z-index: 1;
}

.user-item.active .user-avatar {
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.2);
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 500;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.typing-indicator {
  font-size: 11px;
  color: #666;
  display: block;
  margin-top: 2px;
  opacity: 0.7;
}

.user-item.active .typing-indicator {
  color: rgba(255, 255, 255, 0.8);
}

.user-list::-webkit-scrollbar {
  width: 4px;
}

.user-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 2px;
}

.user-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.user-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.15);
}

.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.5);
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  align-items: flex-end;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.my-message {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  flex-shrink: 0;
  margin: 0 12px;
  background-size: cover;
  background-position: center;
  overflow: hidden;
}

.message-avatar .avatar-text {
  z-index: 1;
}

.message-content {
  max-width: 70%;
}

.message-meta {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 4px;
  gap: 8px;
  flex-wrap: wrap;
}

.message.my-message .message-meta {
  justify-content: flex-end;
}

.message-username {
  font-weight: 600;
  color: var(--text-color);
  font-size: 13px;
  opacity: 0.8;
}

.message-time {
  font-size: 10px;
  color: #888;
  opacity: 0.7;
}

.message-bubble {
  padding: 12px 16px;
  background: var(--bubble-bg);
  border-radius: 20px;
  color: var(--bubble-text);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  word-wrap: break-word;
  line-height: 1.5;
  transition: all 0.2s ease;
}

.message-bubble:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
}

.message.my-message .message-bubble {
  background: var(--primary-color);
  color: white;
  border-radius: 20px 20px 4px 20px;
}

/* 图片消息样式 */
.image-message {
  text-align: center;
}

.message-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  cursor: pointer;
}

.message-image:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.message-filename {
  margin-top: 8px;
  font-size: 12px;
  opacity: 0.8;
  color: inherit;
  word-break: break-all;
}

/* 文件消息样式 */
.file-message {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.message.my-message .file-message {
  background: rgba(255, 255, 255, 0.2);
}

.file-message:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
}

.message.my-message .file-message:hover {
  background: rgba(255, 255, 255, 0.3);
}

.file-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 13px;
  font-weight: 500;
  color: inherit;
  word-break: break-all;
}

.file-size {
  font-size: 11px;
  opacity: 0.7;
  color: inherit;
}

.file-download {
  font-size: 16px;
  color: inherit;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.file-message:hover .file-download {
  opacity: 1;
}

.file-message a {
  color: inherit;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

/* 加载更多按钮样式 */
.load-more-container {
  display: flex;
  justify-content: center;
  padding: 12px;
}

.load-more-btn {
  padding: 8px 16px;
  background: rgba(102, 126, 234, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 20px;
  color: var(--primary-color);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.load-more-btn:hover {
  background: rgba(102, 126, 234, 0.15);
  border-color: var(--primary-color);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
}

/* 上传进度指示器样式 */
.upload-progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 12px;
  margin-top: 8px;
}

.progress-bar-wrapper {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--primary-color);
  border-radius: 3px;
  transition: width 0.2s ease;
}

.progress-text {
  font-size: 12px;
  font-weight: 500;
  color: var(--primary-color);
  min-width: 36px;
  text-align: right;
}

.input-area {
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.95);
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);
}

.input-area form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input-wrapper {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 20px;
  font-size: 14px;
  outline: none;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.8);
}

.message-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.15);
  background: white;
}

.emoji-btn {
  width: 44px;
  height: 44px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.emoji-btn:hover {
  border-color: var(--primary-color);
  background: white;
  transform: scale(1.05);
}

.file-btn {
  width: 44px;
  height: 44px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-btn:hover {
  border-color: var(--primary-color);
  background: white;
  transform: scale(1.05);
}

.send-btn {
  padding: 12px 24px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.emoji-picker {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.emoji-item {
  font-size: 28px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.emoji-item:hover {
  background: rgba(102, 126, 234, 0.1);
  transform: scale(1.2);
}

.settings-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

.settings-content {
  background: white;
  border-radius: 20px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease-out;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.settings-header h3 {
  font-size: 24px;
  color: var(--text-color);
  margin: 0;
}

.settings-section {
  margin-bottom: 32px;
}

.settings-section h4 {
  font-size: 16px;
  color: var(--text-color);
  margin-bottom: 16px;
}

.background-preview {
  width: 100%;
  height: 150px;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  margin-bottom: 16px;
}

.background-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-btn {
  display: block;
  padding: 12px 24px;
  background: var(--primary-color);
  color: white;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

.upload-btn input[type="file"] {
  display: none;
}

.settings-description {
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
  word-break: break-all;
  background: rgba(102, 126, 234, 0.05);
  padding: 8px 12px;
  border-radius: 6px;
}

.reset-btn {
  display: block;
  padding: 10px 20px;
  background: #ff4757;
  color: white;
  border: none;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  font-weight: 500;
}

.reset-btn:hover {
  background: #ff3344;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(255, 71, 87, 0.3);
}

@media (max-width: 768px) {
  .sidebar {
    width: 280px;
  }
  .message-content {
    max-width: 80%;
  }
}
</style>
