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

        <!-- 装饰性小组件 -->
        <div class="widget-container" v-if="!sidebarCollapsed">
          <div class="widget-tabs">
            <button
              @click="activeWidget = 'weather'"
              class="widget-tab"
              :class="{ active: activeWidget === 'weather' }"
            >
              天气
            </button>
            <button
              @click="activeWidget = 'calendar'"
              class="widget-tab"
              :class="{ active: activeWidget === 'calendar' }"
            >
              日历
            </button>
            <button
              @click="activeWidget = 'timer'"
              class="widget-tab"
              :class="{ active: activeWidget === 'timer' }"
            >
              计时器
            </button>
          </div>

          <div class="widget-content">
            <!-- 天气组件 -->
            <div v-if="activeWidget === 'weather'" class="weather-widget">
              <div class="weather-current">
                <div class="weather-icon">{{ weather.current.icon }}</div>
                <div class="weather-temp">{{ weather.current.temp }}°C</div>
                <div class="weather-desc">{{ weather.current.desc }}</div>
              </div>
              <div class="weather-forecast">
                <div
                  v-for="forecast in weather.forecast"
                  :key="forecast.time"
                  class="forecast-item"
                >
                  <div class="forecast-time">{{ forecast.time }}</div>
                  <div class="forecast-icon">{{ forecast.icon }}</div>
                  <div class="forecast-temp">{{ forecast.temp }}°</div>
                </div>
              </div>
            </div>

            <!-- 日历组件 -->
            <div v-if="activeWidget === 'calendar'" class="calendar-widget">
              <div class="calendar-header">
                <button @click="changeMonth(-1)" class="calendar-nav">‹</button>
                <div class="calendar-month">{{ calendar.currentMonth }}</div>
                <button @click="changeMonth(1)" class="calendar-nav">›</button>
              </div>
              <div class="calendar-grid">
                <div
                  v-for="day in calendar.days"
                  :key="day.date"
                  class="calendar-day"
                  :class="{
                    today: day.isToday,
                    weekend: day.isWeekend,
                    holiday: day.isHoliday,
                  }"
                >
                  {{ day.day }}
                </div>
              </div>
            </div>

            <!-- 计时器组件 -->
            <div v-if="activeWidget === 'timer'" class="timer-widget">
              <div v-if="!timer.running" class="timer-inputs">
                <input
                  type="number"
                  v-model="timer.hours"
                  placeholder="时"
                  class="timer-input"
                  min="0"
                  max="23"
                />
                <input
                  type="number"
                  v-model="timer.minutes"
                  placeholder="分"
                  class="timer-input"
                  min="0"
                  max="59"
                />
                <input
                  type="number"
                  v-model="timer.seconds"
                  placeholder="秒"
                  class="timer-input"
                  min="0"
                  max="59"
                />
              </div>
              <div class="timer-display">
                {{ formatTimerTime(timer.hours) }}:{{
                  formatTimerTime(timer.minutes)
                }}:{{ formatTimerTime(timer.seconds) }}
              </div>
              <div class="timer-controls">
                <button
                  @click="startTimer"
                  class="timer-btn primary"
                  v-if="!timer.running"
                >
                  开始
                </button>
                <button @click="pauseTimer" class="timer-btn primary" v-else>
                  暂停
                </button>
                <button @click="resetTimer" class="timer-btn secondary">
                  重置
                </button>
              </div>
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
              :id="`message-${message.id}`"
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

        <div class="settings-section">
          <h4>🔔 通知设置</h4>
          <div class="notification-settings">
            <div class="setting-item">
              <label class="setting-label">
                <input
                  type="checkbox"
                  v-model="notificationsEnabled"
                  @change="handleNotificationsToggle"
                />
                <span>启用桌面通知</span>
              </label>
            </div>

            <div class="setting-item">
              <label class="setting-label">
                <input
                  type="checkbox"
                  v-model="notificationSound"
                  @change="handleSoundToggle"
                  :disabled="!notificationsEnabled"
                />
                <span>通知声音</span>
              </label>
            </div>

            <div class="permission-info">
              <p class="settings-description">
                通知权限状态:
                <span
                  class="permission-status"
                  :class="notificationPermissionStatus"
                >
                  {{ getPermissionStatusText() }}
                </span>
              </p>
              <button
                @click="requestNotificationPermission"
                class="permission-btn"
                :disabled="notificationPermission === 'denied'"
              >
                {{ getPermissionButtonText() }}
              </button>
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
const uploadProgress = ref(0);
const isUploading = ref(false);
const isJoining = ref(false); // 添加加入状态
const sidebarCollapsed = ref(false); // 侧边栏收起状态

// 装饰性小组件相关变量
const activeWidget = ref("weather");

// 天气数据（模拟）
const weather = ref({
  current: {
    temp: 22,
    desc: "晴朗",
    icon: "☀️",
  },
  forecast: [
    { time: "9:00", temp: 20, icon: "🌤️" },
    { time: "12:00", temp: 25, icon: "☀️" },
    { time: "15:00", temp: 27, icon: "☀️" },
    { time: "18:00", temp: 24, icon: "🌤️" },
    { time: "21:00", temp: 20, icon: "🌙" },
  ],
});

// 日历数据
const calendar = ref({
  currentMonth: "",
  days: [],
});

// 计时器数据
const timer = ref({
  hours: 0,
  minutes: 5,
  seconds: 0,
  running: false,
  interval: null,
});

// 生成日历数据
function generateCalendar() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // 设置当前月份名称
  calendar.value.currentMonth = now.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
  });

  // 生成当前月份的日期
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const days = [];
  for (let i = 0; i < 42; i++) {
    // 6周 × 7天
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    days.push({
      day: date.getDate(),
      date: date.toISOString(),
      isToday: date.toDateString() === now.toDateString(),
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      isHoliday: date.getDate() === 1, // 假设每月1号是节日
    });
  }

  calendar.value.days = days;
}

// 切换月份
function changeMonth(direction) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + direction;
  const newDate = new Date(year, month);

  // 设置当前月份名称
  calendar.value.currentMonth = newDate.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
  });

  // 生成新月份的日期
  const firstDay = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const days = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    days.push({
      day: date.getDate(),
      date: date.toISOString(),
      isToday: date.toDateString() === now.toDateString(),
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      isHoliday: date.getDate() === 1,
    });
  }

  calendar.value.days = days;
}

// 格式化计时器时间显示
function formatTimerTime(time) {
  return String(time).padStart(2, "0");
}

// 启动计时器
function startTimer() {
  if (timer.value.running) return;

  timer.value.running = true;
  timer.value.interval = setInterval(() => {
    if (timer.value.seconds > 0) {
      timer.value.seconds--;
    } else if (timer.value.minutes > 0) {
      timer.value.minutes--;
      timer.value.seconds = 59;
    } else if (timer.value.hours > 0) {
      timer.value.hours--;
      timer.value.minutes = 59;
      timer.value.seconds = 59;
    } else {
      // 计时器结束
      clearInterval(timer.value.interval);
      timer.value.running = false;
      alert("时间到！");
    }
  }, 1000);
}

// 暂停计时器
function pauseTimer() {
  if (!timer.value.running) return;

  clearInterval(timer.value.interval);
  timer.value.running = false;
}

// 重置计时器
function resetTimer() {
  pauseTimer();
  timer.value.hours = 0;
  timer.value.minutes = 5;
  timer.value.seconds = 0;
}

// 通知设置相关变量
const notificationsEnabled = ref(true); // 是否启用桌面通知
const notificationSound = ref(true); // 是否启用通知声音
const notificationPermission = ref("default"); // 当前通知权限状态
const notificationPermissionStatus = ref("default"); // 用于样式的权限状态类名

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

      // 发送桌面通知（如果不是自己发送的消息）
      if (data.userId !== myUserId.value) {
        showNotification(data);
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

// 显示桌面通知
function showNotification(message) {
  // 检查是否启用了通知
  if (!notificationsEnabled.value) {
    return;
  }

  // 检查浏览器是否支持通知
  if (!"Notification" in window) {
    console.log("此浏览器不支持桌面通知");
    return;
  }

  // 如果已经获得授权，直接显示通知
  if (Notification.permission === "granted") {
    createNotification(message);
  }
  // 否则请求授权
  else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      updateNotificationPermission();
      if (permission === "granted") {
        createNotification(message);
      }
    });
  }
}

// 创建并显示通知
function createNotification(message) {
  let notificationTitle = message.username;
  let notificationBody = "";

  // 根据消息类型设置通知内容，确保简洁清晰
  switch (message.type) {
    case "text":
      // 限制文本长度，确保通知简洁
      notificationBody =
        message.content.length > 100
          ? message.content.substring(0, 100) + "..."
          : message.content;
      break;
    case "image":
      notificationBody = `📷 发送了一张图片`;
      break;
    case "file":
      notificationBody = `📎 发送了文件: ${message.filename || "未命名文件"}`;
      break;
    default:
      notificationBody = message.content
        ? message.content.length > 100
          ? message.content.substring(0, 100) + "..."
          : message.content
        : "新消息";
  }

  // 创建通知选项，优化视觉样式
  const notificationOptions = {
    body: notificationBody,
    icon: message.avatar || "/favicon.ico",
    badge: "/favicon.ico",
    tag: "bubu-chat-message",
    requireInteraction: false,
    silent: false, // 默认启用声音提示
    data: {
      messageId: message.id,
      userId: message.userId,
      type: message.type,
    },
    vibrate: [100, 50, 100], // 添加振动效果（支持的设备）
    timestamp: Date.now(),
  };

  // 跨浏览器兼容性处理
  try {
    const notification = new Notification(
      notificationTitle,
      notificationOptions
    );

    // 点击通知时，聚焦到聊天窗口并高亮对应消息
    notification.onclick = () => {
      window.focus();
      // 滚动到对应消息（如果存在）
      if (message.id) {
        highlightMessage(message.id);
      }
      notification.close();
    };

    // 5秒后自动关闭通知
    setTimeout(() => {
      notification.close();
    }, 5000);
  } catch (error) {
    console.error("创建通知失败:", error);
    // 降级方案：使用浏览器默认通知
    const notification = new Notification(notificationTitle, {
      body: notificationBody,
      icon: message.avatar || "/favicon.ico",
    });
  }
}

// 高亮显示对应消息
function highlightMessage(messageId) {
  const messageElement = document.getElementById(`message-${messageId}`);
  if (messageElement) {
    // 滚动到消息位置，添加一些偏移量以便更好地查看
    const container = messagesContainer.value;
    if (container) {
      const elementTop = messageElement.offsetTop;
      const containerTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const elementHeight = messageElement.offsetHeight;

      // 计算滚动位置，将消息居中显示
      const scrollToPosition =
        elementTop - containerTop - containerHeight / 2 + elementHeight / 2;

      // 平滑滚动到消息位置
      container.scrollTo({
        top: container.scrollTop + scrollToPosition,
        behavior: "smooth",
      });
    }

    // 添加高亮效果
    messageElement.classList.add("message-highlight");

    // 3秒后移除高亮效果
    setTimeout(() => {
      messageElement.classList.remove("message-highlight");
    }, 3000);
  }
  console.log("高亮消息:", messageId);
}

// 更新通知权限状态
function updateNotificationPermission() {
  if ("Notification" in window) {
    notificationPermission.value = Notification.permission;
    updatePermissionStatusClass();
  }
}

// 更新权限状态类名
function updatePermissionStatusClass() {
  switch (notificationPermission.value) {
    case "granted":
      notificationPermissionStatus.value = "granted";
      break;
    case "denied":
      notificationPermissionStatus.value = "denied";
      break;
    default:
      notificationPermissionStatus.value = "default";
  }
}

// 获取权限状态文本
function getPermissionStatusText() {
  switch (notificationPermission.value) {
    case "granted":
      return "已授权";
    case "denied":
      return "已拒绝";
    default:
      return "未授权";
  }
}

// 获取权限按钮文本
function getPermissionButtonText() {
  switch (notificationPermission.value) {
    case "granted":
      return "已授权";
    case "denied":
      return "权限已拒绝";
    default:
      return "请求授权";
  }
}

// 请求通知权限
async function requestNotificationPermission() {
  if (!"Notification" in window) {
    alert("此浏览器不支持桌面通知");
    return;
  }

  try {
    let permission;

    // 兼容旧版浏览器的回调接口
    if (Notification.requestPermission.length > 0) {
      // 旧版回调方式
      permission = await new Promise((resolve) => {
        Notification.requestPermission((result) => resolve(result));
      });
    } else {
      // 现代Promise方式
      permission = await Notification.requestPermission();
    }

    updateNotificationPermission();

    if (permission === "granted") {
      alert("通知权限已授予");
    } else if (permission === "denied") {
      alert("通知权限已拒绝，请在浏览器设置中手动开启");
    }
  } catch (error) {
    console.error("请求通知权限失败:", error);
    alert("请求通知权限失败:", error.message);
  }
}

// 处理通知开关
function handleNotificationsToggle() {
  if (
    notificationsEnabled.value &&
    notificationPermission.value === "default"
  ) {
    requestNotificationPermission();
  }
}

// 处理声音开关
function handleSoundToggle() {
  // 这里可以添加声音提示的实现
  console.log("通知声音设置:", notificationSound.value);
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
  // 初始化通知权限状态
  updateNotificationPermission();
  // 初始化日历数据
  generateCalendar();
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
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");

:root {
  /* Typography */
  --font-primary: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    sans-serif;
  --font-size-xs: 0.75rem; /* 12px */
  --font-size-sm: 0.875rem; /* 14px */
  --font-size-base: 1rem; /* 16px */
  --font-size-lg: 1.125rem; /* 18px */
  --font-size-xl: 1.25rem; /* 20px */
  --font-size-2xl: 1.5rem; /* 24px */
  --font-size-3xl: 1.875rem; /* 30px */

  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;

  /* Colors - Natural & Professional Palette */
  --primary-color: #4a6fa5;
  --primary-dark: #3a5a83;
  --primary-light: #7a96c2;
  --primary-opacity: rgba(74, 111, 165, 0.1);

  --text-color: #2c3e50;
  --text-secondary: #6c757d;
  --text-tertiary: #95a5a6;

  --bg-color: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-tertiary: #e9ecef;

  --bubble-bg: #e9ecef;
  --bubble-text: #2c3e50;
  --bubble-sent: #4a6fa5;
  --bubble-sent-text: #ffffff;

  --border-color: rgba(0, 0, 0, 0.1);
  --border-light: rgba(0, 0, 0, 0.05);

  --success-color: #27ae60;
  --error-color: #e74c3c;
  --warning-color: #f39c12;

  /* Spacing */
  --spacing-xs: 0.25rem; /* 4px */
  --spacing-sm: 0.5rem; /* 8px */
  --spacing-md: 1rem; /* 16px */
  --spacing-lg: 1.5rem; /* 24px */
  --spacing-xl: 2rem; /* 32px */
  --spacing-2xl: 3rem; /* 48px */

  /* Border radius */
  --radius-sm: 0.375rem; /* 6px */
  --radius-md: 0.5rem; /* 8px */
  --radius-lg: 0.75rem; /* 12px */
  --radius-xl: 1rem; /* 16px */
  --radius-2xl: 1.25rem; /* 20px */
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);

  /* Transitions */
  --transition-fast: 0.15s ease;
  --transition-normal: 0.25s ease;
  --transition-slow: 0.35s ease;
}

[data-theme="dark"] {
  --text-color: #ecf0f1;
  --text-secondary: #bdc3c7;
  --text-tertiary: #7f8c8d;

  --bg-color: #2c3e50;
  --bg-secondary: #34495e;
  --bg-tertiary: #4a6070;

  --bubble-bg: #4a6070;
  --bubble-text: #ecf0f1;
  --bubble-sent: #7a96c2;
  --bubble-sent-text: #ffffff;

  --border-color: rgba(255, 255, 255, 0.1);
  --border-light: rgba(255, 255, 255, 0.05);

  --primary-opacity: rgba(74, 111, 165, 0.2);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-primary);
  background: var(--primary-color);
  min-height: 100vh;
  color: var(--text-color);
  line-height: var(--line-height-normal);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
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
  background: var(--bg-color);
  padding: var(--spacing-2xl) var(--spacing-xl);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-xl);
  text-align: center;
  min-width: 360px;
  max-width: 420px;
  width: 90%;
  animation: slideUp 0.5s ease-out;
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-light);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.logo {
  margin-bottom: var(--spacing-lg);
}

.logo-icon {
  font-size: 72px;
  margin-bottom: var(--spacing-sm);
  animation: bounce 2s infinite;
  filter: drop-shadow(0 4px 12px rgba(102, 126, 234, 0.2));
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-12px);
  }
}

.login-box h1 {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--primary-color);
  margin-bottom: var(--spacing-xs);
  letter-spacing: -0.5px;
}

.subtitle {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xl);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  opacity: 0.9;
}

.avatar-preview {
  width: 100px;
  height: 100px;
  margin: 0 auto var(--spacing-lg);
  border-radius: var(--radius-full);
  overflow: hidden;
  position: relative;
  border: 3px solid var(--primary-color);
  box-shadow: var(--shadow-md);
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
  border-radius: var(--radius-full);
  border: 2px solid var(--bg-color);
  background: var(--error-color);
  color: white;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

.clear-btn:hover {
  transform: scale(1.1);
  box-shadow: var(--shadow-md);
}

.login-box form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
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
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-normal);
  background: var(--bg-secondary);
}

.upload-label:hover {
  border-color: var(--primary-color);
  background: var(--primary-opacity);
  transform: translateY(-2px);
}

.upload-icon {
  font-size: 32px;
  color: var(--text-tertiary);
}

.upload-label span {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

.username-input {
  padding: var(--spacing-md) var(--spacing-lg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-family: var(--font-primary);
  outline: none;
  transition: all var(--transition-normal);
  background: var(--bg-secondary);
}

.username-input:focus {
  border-color: var(--primary-light);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  background: var(--bg-color);
  transform: translateY(-1px);
}

.join-btn {
  padding: var(--spacing-md) var(--spacing-xl);
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-primary);
  cursor: pointer;
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  box-shadow: var(--shadow-md);
}

.join-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  background: var(--primary-dark);
}

.join-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: var(--shadow-sm);
}

.arrow {
  font-size: 18px;
  transition: transform var(--transition-normal);
}

.join-btn:hover .arrow {
  transform: translateX(4px);
}

.chat-screen {
  width: 100%;
  height: 100vh;
  display: flex;
  background: var(--bg-color);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  overflow: hidden;
}

.sidebar {
  width: 280px;
  background: var(--bg-color);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.04);
  transition: all var(--transition-normal);
  z-index: 10;
}

.sidebar.collapsed {
  width: 60px;
  box-shadow: 1px 0 8px rgba(0, 0, 0, 0.03);
}

.sidebar.collapsed .user-info-mini {
  justify-content: center;
}

.sidebar.collapsed .mini-avatar {
  margin: 0;
}

.sidebar-header {
  padding: var(--spacing-md) var(--spacing-sm);
  border-bottom: 1px solid var(--border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-buttons {
  display: flex;
  gap: var(--spacing-xs);
  align-items: center;
}

.collapse-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  border: none;
  background: rgba(0, 0, 0, 0.04);
  font-size: 16px;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.collapse-btn:hover {
  background: rgba(0, 0, 0, 0.08);
  transform: scale(1.05);
  color: var(--text-color);
}

.user-info-mini {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex: 1;
  min-width: 0;
}

.mini-avatar {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full);
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  background-size: cover;
  background-position: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
  overflow: hidden;
  transition: all var(--transition-fast);
}

.mini-avatar:hover {
  transform: scale(1.05);
}

.avatar-text {
  z-index: 1;
  font-weight: var(--font-weight-semibold);
}

.user-info-mini h2 {
  font-size: var(--font-size-sm);
  color: var(--text-color);
  margin: 0;
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-id {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  display: block;
  opacity: 0.8;
}

.settings-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  border: none;
  background: rgba(0, 0, 0, 0.04);
  font-size: 18px;
  cursor: pointer;
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.settings-btn:hover {
  background: rgba(0, 0, 0, 0.08);
  transform: rotate(90deg);
  color: var(--text-color);
}

.online-count {
  padding: var(--spacing-sm) var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  background: var(--primary-opacity);
  border-bottom: 1px solid var(--border-light);
}

.count {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--primary-color);
}

.label {
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
  opacity: 0.8;
  font-weight: var(--font-weight-medium);
}

.user-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-xs);
}

/* 装饰性小组件 */
.widget-container {
  border-top: 1px solid var(--border-color);
  padding: var(--spacing-sm);
  background: var(--bg-secondary);
}

.widget-tabs {
  display: flex;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.widget-tab {
  flex: 1;
  padding: var(--spacing-xs) var(--spacing-sm);
  border: none;
  border-radius: var(--radius-md);
  background: var(--bg-color);
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.widget-tab.active {
  background: var(--primary-color);
  color: white;
  box-shadow: 0 2px 6px rgba(74, 111, 165, 0.2);
}

.widget-tab:hover:not(.active) {
  background: var(--primary-opacity);
  color: var(--primary-color);
  transform: translateY(-1px);
}

.widget-content {
  background: var(--bg-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-sm);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  min-height: 180px;
  display: flex;
  flex-direction: column;
}

/* 天气组件 */
.weather-widget {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.weather-current {
  text-align: center;
}

.weather-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-xs);
}

.weather-temp {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
}

.weather-desc {
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
  text-transform: capitalize;
}

.weather-forecast {
  display: flex;
  justify-content: space-between;
  overflow-x: auto;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) 0;
}

.forecast-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 45px;
  padding: var(--spacing-xs);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
}

.forecast-time {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin-bottom: var(--spacing-xs);
}

.forecast-icon {
  font-size: 1.2rem;
  margin-bottom: var(--spacing-xs);
}

.forecast-temp {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-color);
}

/* 日历组件 */
.calendar-widget {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.calendar-month {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-color);
}

.calendar-nav {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: var(--font-size-base);
  padding: var(--spacing-xs);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.calendar-nav:hover {
  background: var(--primary-opacity);
  color: var(--primary-color);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  text-align: center;
}

.calendar-day {
  font-size: var(--font-size-xs);
  padding: var(--spacing-xs);
  border-radius: var(--radius-sm);
}

.calendar-day.weekend {
  color: var(--text-tertiary);
}

.calendar-day.today {
  background: var(--primary-color);
  color: white;
  font-weight: var(--font-weight-semibold);
}

.calendar-day.holiday {
  background: var(--warning-color);
  color: white;
}

/* 计时器组件 */
.timer-widget {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.timer-display {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  text-align: center;
  padding: var(--spacing-sm);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  color: var(--text-color);
}

.timer-controls {
  display: flex;
  gap: var(--spacing-xs);
}

.timer-btn {
  flex: 1;
  padding: var(--spacing-xs) var(--spacing-sm);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.timer-btn.primary {
  background: var(--primary-color);
  color: white;
}

.timer-btn.primary:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(74, 111, 165, 0.2);
}

.timer-btn.secondary {
  background: var(--bg-color);
  color: var(--text-secondary);
}

.timer-btn.secondary:hover {
  background: var(--primary-opacity);
  color: var(--primary-color);
  transform: translateY(-1px);
}

.timer-inputs {
  display: flex;
  gap: var(--spacing-xs);
}

.timer-input {
  flex: 1;
  padding: var(--spacing-xs);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  text-align: center;
  background: var(--bg-color);
  color: var(--text-color);
}

.timer-input:focus {
  outline: none;
  border-color: var(--primary-light);
  box-shadow: 0 0 0 2px rgba(74, 111, 165, 0.15);
}

.user-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  margin-bottom: var(--spacing-xs);
  background: rgba(255, 255, 255, 0.6);
}

.user-item:hover {
  background: var(--primary-opacity);
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
  border-radius: var(--radius-full);
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  margin-right: var(--spacing-sm);
  flex-shrink: 0;
  background-size: cover;
  background-position: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all var(--transition-fast);
}

.user-avatar .avatar-text {
  z-index: 1;
  font-weight: var(--font-weight-semibold);
}

.user-item.active .user-avatar {
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.2);
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: var(--font-weight-medium);
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--font-size-sm);
  color: var(--text-color);
}

.user-item.active .user-name {
  color: white;
}

.typing-indicator {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  display: block;
  margin-top: var(--spacing-xs);
  opacity: 0.8;
}

.user-item.active .typing-indicator {
  color: rgba(255, 255, 255, 0.9);
}

.user-list::-webkit-scrollbar {
  width: 4px;
}

.user-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.02);
  border-radius: var(--radius-sm);
}

.user-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: var(--radius-sm);
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
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  background: rgba(0, 0, 0, 0.01);
}

.message {
  display: flex;
  align-items: flex-end;
  animation: slideIn 0.3s ease-out;
  gap: var(--spacing-md);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(15px);
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
  border-radius: var(--radius-full);
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  flex-shrink: 0;
  background-size: cover;
  background-position: center;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: all var(--transition-fast);
}

.message-avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
}

.message-avatar .avatar-text {
  z-index: 1;
}

.message-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
}

.message-meta {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: var(--spacing-xs);
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.message.my-message .message-meta {
  justify-content: flex-end;
}

.message-username {
  font-weight: var(--font-weight-semibold);
  color: var(--text-color);
  font-size: var(--font-size-xs);
  opacity: 0.9;
}

.message-time {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  opacity: 0.7;
}

.message-bubble {
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--bubble-bg);
  border-radius: var(--radius-lg);
  color: var(--bubble-text);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  word-wrap: break-word;
  line-height: var(--line-height-normal);
  transition: all var(--transition-fast);
  position: relative;
}

.message-bubble:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.12);
}

.message.my-message .message-bubble {
  background: var(--bubble-sent);
  color: var(--bubble-sent-text);
  box-shadow: 0 1px 4px rgba(74, 111, 165, 0.2);
}

.message.my-message .message-bubble:hover {
  box-shadow: 0 3px 10px rgba(74, 111, 165, 0.3);
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
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--primary-opacity);
  border: 1px solid rgba(74, 111, 165, 0.3);
  border-radius: var(--radius-full);
  color: var(--primary-color);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.load-more-btn:hover {
  background: rgba(74, 111, 165, 0.15);
  border-color: var(--primary-color);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(74, 111, 165, 0.15);
}

/* 上传进度指示器样式 */
.upload-progress-container {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--primary-opacity);
  border-radius: var(--radius-md);
  margin-top: var(--spacing-xs);
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
  padding: var(--spacing-lg) var(--spacing-xl);
  background: var(--bg-color);
  border-top: 1px solid var(--border-color);
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.03);
}

.input-area form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.input-wrapper {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.message-input {
  flex: 1;
  padding: var(--spacing-md) var(--spacing-lg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-family: var(--font-primary);
  outline: none;
  transition: all var(--transition-fast);
  background: var(--bg-secondary);
  color: var(--text-color);
}

.message-input:focus {
  border-color: var(--primary-light);
  box-shadow: 0 0 0 3px rgba(74, 111, 165, 0.15);
  background: var(--bg-color);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(74, 111, 165, 0.1);
}

.emoji-btn {
  width: 44px;
  height: 44px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.8);
  font-size: 20px;
  cursor: pointer;
  transition: all var(--transition-fast);
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
  border: 1px solid var(--border-color);
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.8);
  font-size: 20px;
  cursor: pointer;
  transition: all var(--transition-fast);
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
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
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
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
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
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
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
  backdrop-filter: blur(4px);
}

.settings-content {
  background: white;
  border-radius: var(--radius-2xl);
  padding: var(--spacing-xl);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease-out;
  box-shadow: var(--shadow-xl);
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
}

.settings-header h3 {
  font-size: var(--font-size-xl);
  color: var(--text-color);
  margin: 0;
  font-weight: var(--font-weight-semibold);
}

.settings-section {
  margin-bottom: var(--spacing-xl);
}

.settings-section h4 {
  font-size: var(--font-size-sm);
  color: var(--text-color);
  margin-bottom: var(--spacing-md);
  font-weight: var(--font-weight-semibold);
}

.background-preview {
  width: 100%;
  height: 150px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  position: relative;
  margin-bottom: var(--spacing-md);
  box-shadow: var(--shadow-sm);
}

.background-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-btn {
  display: block;
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--primary-color);
  color: white;
  border-radius: var(--radius-md);
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.upload-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.upload-btn input[type="file"] {
  display: none;
}

.settings-description {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-sm);
  word-break: break-all;
  background: rgba(102, 126, 234, 0.05);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
}

.reset-btn {
  display: block;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--error-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-normal);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.reset-btn:hover {
  background: var(--error-color);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* 通知设置样式 */
.notification-settings {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.setting-item {
  display: flex;
  align-items: center;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  user-select: none;
  font-size: var(--font-size-sm);
  color: var(--text-color);
  transition: all var(--transition-fast);
}

.setting-label:hover {
  color: var(--primary-color);
}

.setting-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--primary-color);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.setting-label input[type="checkbox"]:disabled {
  accent-color: #ccc;
  cursor: not-allowed;
}

.permission-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--primary-opacity);
  border-radius: var(--radius-lg);
}

.permission-status {
  font-weight: var(--font-weight-semibold);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
}

.permission-status.granted {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success-color);
}

.permission-status.denied {
  background: rgba(239, 68, 68, 0.1);
  color: var(--error-color);
}

.permission-status.default {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning-color);
}

.permission-btn {
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  max-width: 150px;
}

.permission-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.permission-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 消息高亮样式 */
.message-highlight {
  animation: messageHighlight 3s ease-in-out;
}

@keyframes messageHighlight {
  0% {
    background: rgba(102, 126, 234, 0.3);
    transform: scale(1.02);
  }
  50% {
    background: rgba(102, 126, 234, 0.2);
    transform: scale(1.01);
  }
  100% {
    background: transparent;
    transform: scale(1);
  }
}

@media (max-width: 768px) {
  .sidebar {
    width: 280px;
  }
  .message-content {
    max-width: 80%;
  }

  .login-box {
    min-width: auto;
    max-width: 90%;
  }

  .messages {
    padding: var(--spacing-md);
  }

  .input-area {
    padding: var(--spacing-md);
  }
}
</style>
