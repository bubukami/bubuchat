const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");
const express = require("express");
const multer = require("multer");

// 创建Express应用
const app = express();

// 配置Multer用于文件上传
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

// 创建HTTP服务器并使用Express应用
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  allowEIO3: true,
  transports: ["websocket", "polling"],
});

// 静态文件服务
app.use("/uploads", express.static(uploadsDir));

// 启用CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// 文件上传路由
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "没有文件被上传" });
  }

  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${
    req.file.filename
  }`;
  res.json({
    success: true,
    filename: req.file.filename,
    url: fileUrl,
    type: req.file.mimetype,
    size: req.file.size,
  });
});

// 健康检查路由
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const users = new Map();
const messages = [];
const MESSAGES_FILE = path.join(__dirname, "messages.json");

// 加载保存的消息
function loadMessages() {
  try {
    if (fs.existsSync(MESSAGES_FILE)) {
      const data = fs.readFileSync(MESSAGES_FILE, "utf8");
      const savedMessages = JSON.parse(data);
      messages.push(...savedMessages);
      console.log(`已加载 ${savedMessages.length} 条历史消息`);
    }
  } catch (error) {
    console.error("加载消息失败:", error);
  }
}

// 保存消息到文件
function saveMessages() {
  try {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2), "utf8");
  } catch (error) {
    console.error("保存消息失败:", error);
  }
}

// 初始化时加载消息
loadMessages();

io.on("connection", (socket) => {
  console.log("新用户连接:", socket.id);

  socket.on("join", (data) => {
    const { userId, username, avatar } = data;

    users.set(socket.id, {
      userId,
      username,
      avatar: avatar || "",
      socketId: socket.id,
    });

    socket.emit("joined", {
      userId,
      username,
      avatar: avatar || "",
      messages: messages,
      users: Array.from(users.values()).map((u) => ({
        userId: u.userId,
        username: u.username,
        avatar: u.avatar,
      })),
    });

    socket.broadcast.emit("user_joined", {
      userId,
      username,
      avatar: avatar || "",
    });

    console.log(`用户 ${username} (${userId}) 加入聊天`);
  });

  socket.on("send_message", (data) => {
    const { userId, username, avatar, content, type, filename, filesize } =
      data;
    const user = users.get(socket.id);

    if (!user) return;

    const message = {
      id: Date.now(),
      userId,
      username,
      avatar: avatar || "",
      content,
      timestamp: new Date().toISOString(),
      type: type || "text",
      filename: filename || "",
      filesize: filesize || 0,
    };

    messages.push(message);
    saveMessages(); // 保存消息到文件系统

    io.emit("new_message", message);

    // 根据消息类型输出不同日志
    let logMessage = `消息: ${username}: `;
    if (type === "image") {
      logMessage += `[图片] ${filename || "未命名图片"}`;
    } else if (type === "file") {
      logMessage += `[文件] ${filename || "未命名文件"} (${
        filesize || 0
      } bytes)`;
    } else {
      logMessage += content;
    }
    console.log(logMessage);
  });

  socket.on("typing", (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    socket.broadcast.emit("user_typing", {
      userId: user.userId,
      username: user.username,
    });
  });

  socket.on("stop_typing", (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    socket.broadcast.emit("user_stop_typing", {
      userId: user.userId,
      username: user.username,
    });
  });

  socket.on("disconnect", () => {
    const user = users.get(socket.id);
    if (user) {
      users.delete(socket.id);
      socket.broadcast.emit("user_left", {
        userId: user.userId,
        username: user.username,
      });
      console.log(`用户 ${user.username} (${user.userId}) 离开聊天`);
    }
  });
});

const PORT = process.env.PORT || 3000;
// 监听所有接口，而不仅仅是localhost
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`聊天服务器运行在端口 ${PORT}`);
  console.log(`访问 http://0.0.0.0:${PORT} 查看状态`);
  console.log(`远程访问地址: http://159.75.208.141:${PORT}`);
});
