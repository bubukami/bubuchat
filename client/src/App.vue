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

          <div class="theme-selector">
            <span class="theme-label">主题：</span>
            <div
              v-for="theme in themes"
              :key="theme.id"
              class="theme-option"
              :class="{ active: selectedTheme === theme.id }"
              :style="{ background: theme.gradient }"
              @click="selectTheme(theme.id)"
            >
              {{ theme.name }}
            </div>
          </div>

          <button type="submit" class="join-btn">
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
      <div class="sidebar">
        <div class="sidebar-header">
          <div class="user-info-mini">
            <div class="mini-avatar" :style="{ backgroundImage: myAvatar }">
              {{ username.charAt(0).toUpperCase() }}
            </div>
            <div>
              <h2>{{ username }}</h2>
              <span class="user-id">{{ myUserId }}</span>
            </div>
          </div>
          <button @click="showSettings = true" class="settings-btn">⚙️</button>
        </div>

        <div class="online-count">
          <span class="count">{{ users.length }}</span>
          <span class="label">人在线</span>
        </div>

        <div class="user-list">
          <div
            v-for="user in users"
            :key="user.userId"
            class="user-item"
            :class="{ active: user.userId === myUserId }"
          >
            <div class="user-avatar" :style="{ backgroundImage: user.avatar }">
              {{ user.username.charAt(0).toUpperCase() }}
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
        <div class="messages" ref="messagesContainer">
          <div
            v-for="message in messages"
            :key="message.id"
            class="message"
            :class="{ 'my-message': message.userId === myUserId }"
          >
            <div
              class="message-avatar"
              :style="{ backgroundImage: message.avatar }"
            >
              {{ message.username.charAt(0).toUpperCase() }}
            </div>
            <div class="message-content">
              <div class="message-meta">
                <span class="message-username">{{ message.username }}</span>
                <span class="message-time">{{
                  formatTime(message.timestamp)
                }}</span>
              </div>
              <div class="message-bubble">{{ message.content }}</div>
            </div>
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
            </div>
            <button
              type="submit"
              class="send-btn"
              :disabled="!newMessage.trim()"
            >
              发送
            </button>
          </form>

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
          <h4>🎨 主题颜色</h4>
          <div class="theme-grid">
            <div
              v-for="theme in themes"
              :key="theme.id"
              class="theme-card"
              :class="{ active: selectedTheme === theme.id }"
              :style="{ background: theme.gradient }"
              @click="selectTheme(theme.id)"
            >
              <div class="theme-name">{{ theme.name }}</div>
            </div>
          </div>
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

const themes = [
  {
    id: "purple",
    name: "紫罗兰",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  {
    id: "blue",
    name: "海洋蓝",
    gradient: "linear-gradient(135deg, #66a6ff 0%, #76c7ff 100%)",
  },
  {
    id: "green",
    name: "薄荷绿",
    gradient: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
  },
  {
    id: "pink",
    name: "樱花粉",
    gradient: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
  },
  {
    id: "orange",
    name: "日落橙",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  },
  {
    id: "dark",
    name: "暗夜黑",
    gradient: "linear-gradient(135deg, #434343 0%, #000000 100%)",
  },
];

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

function selectTheme(themeId) {
  selectedTheme.value = themeId;
  const theme = themes.find((t) => t.id === themeId);
  if (theme) {
    document.documentElement.style.setProperty(
      "--primary-gradient",
      theme.gradient
    );
  }
}

function joinChat() {
  if (!username.value.trim()) return;

  myUserId.value = generateUserId();
  socket = io();

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
    users.value = data.users || [];
    messages.value = data.messages || [];
    nextTick(() => {
      scrollToBottom();
    });
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
    nextTick(() => {
      scrollToBottom();
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

  socket.on("disconnect", () => {
    console.log("与服务器断开连接");
  });
}

function sendMessage() {
  if (!newMessage.value.trim()) return;

  socket.emit("send_message", {
    userId: myUserId.value,
    username: username.value,
    avatar: myAvatar.value,
    content: newMessage.value,
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

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function generateUserId() {
  return "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
}

onMounted(() => {
  const savedTheme = localStorage.getItem("bubuchat_theme");
  if (savedTheme) {
    selectTheme(savedTheme);
    selectedTheme.value = savedTheme;
  }
});

onUnmounted(() => {
  if (socket) {
    socket.disconnect();
  }
});
</script>

<style>
:root {
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  background: var(--primary-gradient);
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
  background: var(--primary-gradient);
}

.login-box {
  background: white;
  padding: 48px;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
  min-width: 380px;
  animation: slideUp 0.5s ease-out;
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
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
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

.theme-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
}

.theme-label {
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
}

.theme-option {
  padding: 12px 16px;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.theme-option:hover {
  transform: scale(1.02);
}

.theme-option.active {
  border-color: white;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.3);
}

.join-btn {
  padding: 16px 32px;
  background: var(--primary-gradient);
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
  width: 320px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info-mini {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mini-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--primary-gradient);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 20px;
  background-size: cover;
  background-position: center;
}

.user-info-mini h2 {
  font-size: 18px;
  color: var(--text-color);
  margin: 0;
}

.user-id {
  font-size: 12px;
  color: #999;
  display: block;
}

.settings-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.settings-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  transform: rotate(90deg);
}

.online-count {
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(102, 126, 234, 0.05);
}

.count {
  font-size: 32px;
  font-weight: bold;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.label {
  color: #666;
  font-size: 14px;
}

.user-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 8px;
}

.user-item:hover {
  background: rgba(102, 126, 234, 0.05);
  transform: translateX(5px);
}

.user-item.active {
  background: var(--primary-gradient);
  color: white;
}

.user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--primary-gradient);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
  margin-right: 12px;
  flex-shrink: 0;
  background-size: cover;
  background-position: center;
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
}

.typing-indicator {
  font-size: 12px;
  color: #999;
  display: block;
  margin-top: 2px;
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
  background: var(--primary-gradient);
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
}

.message-content {
  max-width: 65%;
}

.message-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  gap: 12px;
}

.message-username {
  font-weight: 600;
  color: var(--text-color);
}

.message-time {
  font-size: 11px;
  color: #999;
}

.message-bubble {
  padding: 14px 18px;
  background: var(--bubble-bg);
  border-radius: 18px;
  color: var(--bubble-text);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  word-wrap: break-word;
  line-height: 1.5;
}

.message.my-message .message-bubble {
  background: var(--primary-gradient);
  color: white;
  border-radius: 18px 18px 4px 18px;
}

.input-area {
  padding: 20px 24px;
  background: white;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.input-area form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
}

.message-input {
  flex: 1;
  padding: 14px 18px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 15px;
  outline: none;
  transition: all 0.3s;
}

.message-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.emoji-btn {
  width: 48px;
  height: 48px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: white;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.3s;
}

.emoji-btn:hover {
  border-color: var(--primary-color);
  transform: scale(1.05);
}

.send-btn {
  padding: 14px 28px;
  background: var(--primary-gradient);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  background: var(--primary-gradient);
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

.theme-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.theme-card {
  padding: 20px;
  border-radius: 12px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
  border: 3px solid transparent;
}

.theme-card:hover {
  transform: scale(1.05);
}

.theme-card.active {
  border-color: white;
  box-shadow: 0 0 0 5px rgba(0, 0, 0, 0.3);
}

.theme-name {
  font-size: 14px;
}

@media (max-width: 768px) {
  .sidebar {
    width: 280px;
  }

  .message-content {
    max-width: 80%;
  }

  .theme-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .sidebar {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 100;
    transform: translateX(-100%);
    transition: transform 0.3s;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .login-box {
    padding: 32px;
    min-width: 300px;
  }

  .theme-grid {
    grid-template-columns: 1fr;
  }
}
</style>
