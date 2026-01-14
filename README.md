# BubuChat

轻量级实时聊天应用，支持在线/离线消息、头像上传、主题切换等功能。

## 功能特性

- 📱 实时消息发送与接收
- 📸 头像上传功能
- 🎨 多种主题切换
- 💬 在线状态显示
- ⌨️ 正在输入提示
- 💾 消息持久化存储
- 🌐 跨平台支持

## 技术栈

- **前端**: Vue 3 + Vite + Socket.io-client
- **后端**: Node.js + Express + Socket.io
- **存储**: 文件系统（可扩展到数据库）

## 快速开始

### 本地开发

1. **克隆项目**

```bash
git clone https://github.com/bubukami/bubuchat.git
cd bubuchat
```

2. **安装依赖**

```bash
npm run install:all
```

3. **启动开发服务器**

```bash
# 启动后端服务器
cd server
npm start

# 启动前端开发服务器（新终端）
cd client
npm run dev
```

4. **访问应用**

打开浏览器访问：http://localhost:5173

## 部署到阿里云

### 准备工作

1. **购买阿里云服务器**

   - 推荐配置：1 核 2G，Ubuntu 22.04 LTS
   - 开放端口：80（HTTP）、3000（WebSocket）

2. **连接服务器**

```bash
ssh root@your-server-ip
```

### 部署步骤

#### 1. 安装依赖

```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 安装 PM2（进程管理）
npm install -g pm2

# 安装 Nginx（反向代理）
apt install -y nginx
```

#### 2. 部署应用

```bash
# 克隆代码
git clone https://github.com/bubukami/bubuchat.git
cd bubuchat

# 安装依赖
npm run install:all

# 构建前端
npm run build:client
```

#### 3. 启动应用

```bash
# 启动后端服务
npm start

# 或使用 PM2（推荐）
pm2 start npm --name bubuchat -- start
```

#### 4. 配置 Nginx

```bash
# 创建 Nginx 配置文件
nano /etc/nginx/sites-available/bubuchat
```

添加以下内容：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 或 your-server-ip

    # 前端静态文件
    location / {
        root /root/bubuchat/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # WebSocket 代理
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 启用 Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

启用配置：

```bash
ln -s /etc/nginx/sites-available/bubuchat /etc/nginx/sites-enabled/
nginx -t  # 检查配置
nginx -s reload  # 重启 Nginx
```

#### 5. 配置 SSL（可选）

```bash
# 安装 Certbot
apt install -y certbot python3-certbot-nginx

# 获取免费 SSL 证书
certbot --nginx -d your-domain.com
```

### 部署完成

访问你的域名或服务器 IP 即可使用应用！

## 项目结构

```
bubuchat/
├── client/                # 前端代码
│   ├── src/              # 源代码
│   │   ├── App.vue       # 主应用组件
│   │   └── main.js       # 入口文件
│   ├── index.html        # HTML 模板
│   ├── package.json      # 前端依赖
│   └── vite.config.js    # Vite 配置
├── server/               # 后端代码
│   ├── index.js          # 主服务器文件
│   ├── messages.json     # 消息存储文件
│   └── package.json      # 后端依赖
├── package.json          # 项目配置
├── DEPLOY.md             # 部署文档
└── README.md             # 项目说明
```

## 环境变量

### 前端（client/.env）

```
# Socket.io 服务器地址
VITE_SOCKET_URL=http://your-server-ip:3000
```

### 后端（server/.env）

```
# 服务器端口
PORT=3000
```

## 消息持久化

应用使用文件系统存储消息，位于 `server/messages.json`。

### 自定义存储

可以扩展为数据库存储，如 MongoDB、MySQL 等。修改 `server/index.js` 中的 `loadMessages()` 和 `saveMessages()` 函数即可。

## 性能优化

- 消息限制：最多存储 100 条历史消息
- 头像压缩：前端自动压缩上传的头像
- 连接管理：自动重连和错误处理

## 安全建议

1. **生产环境**：

   - 使用 HTTPS 协议
   - 配置适当的 CORS 策略
   - 启用防火墙

2. **数据安全**：
   - 定期备份消息文件
   - 考虑使用数据库加密

## 常见问题

### 1. WebSocket 连接失败

- 检查服务器防火墙是否开放 3000 端口
- 检查 Nginx 配置是否正确
- 确认前端环境变量配置正确

### 2. 头像上传失败

- 检查浏览器权限
- 确认文件大小限制
- 检查网络连接

### 3. 消息丢失

- 确保 `server/messages.json` 文件有写权限
- 检查磁盘空间

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

如有问题，请通过 GitHub Issues 联系。
