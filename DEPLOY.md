# BubuChat 部署指南

## 快速部署方案

### 方案一：Railway（推荐，免费，支持WebSocket）

Railway 是一个现代化的云平台，支持 WebSocket，非常适合部署 Node.js 应用。

#### 步骤：

1. **准备代码**

```bash
# 确保项目结构如下
bubuchat/
├── server/
│   ├── index.js
│   └── package.json
├── client/
│   ├── index.html
│   ├── src/
│   └── package.json
└── README.md
```

2. **修改客户端 API 地址**

编辑 `client/src/App.vue`，将 WebSocket 地址改为环境变量：

```javascript
// 找到这行
socket = io('http://localhost:3000');

// 改为
socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000');
```

3. **创建 Railway 账号**

访问 https://railway.app/，使用 GitHub 账号登录

4. **创建新项目**

- 点击 "New Project"
- 选择 "Deploy from GitHub repo"
- 选择你的 bubuchat 仓库

5. **配置后端服务**

- Railway 会自动检测到 `server/package.json`
- 点击 "Add Service" → "Database" → "MySQL"（可选，本项目不需要）
- 确认后端服务已创建

6. **配置前端服务**

- 点击 "Add Service" → "GitHub Repo"
- 选择 `client` 目录
- 在 "Root Directory" 填入 `client`
- 在 "Build Command" 填入 `npm run build`
- 在 "Start Command" 填入 `npm run preview`

7. **设置环境变量**

**后端服务**：
- `PORT`: `3000`

**前端服务**：
- `VITE_SOCKET_URL`: 你的后端服务地址（Railway 会自动分配）

8. **部署完成！**

Railway 会给你两个 URL：
- 前端 URL：类似 `https://bubuchat-client.up.railway.app`
- 后端 URL：类似 `https://bubuchat-server.up.railway.app`

9. **测试**

打开前端 URL，输入昵称开始聊天！

---

### 方案二：Render（免费，支持WebSocket）

Render 是另一个支持 WebSocket 的免费平台。

#### 步骤：

1. **创建 Render 账号**

访问 https://render.com/，使用 GitHub 账号登录

2. **部署后端**

- 点击 "New" → "Web Service"
- 选择你的 GitHub 仓库
- 配置：
  - **Name**: `bubuchat-server`
  - **Root Directory**: `server`
  - **Build Command**: `npm install`
  - **Start Command**: `node index.js`
  - **Instance Type**: `Free`
- 点击 "Create Web Service"

3. **部署前端**

- 点击 "New" → "Static Site"
- 选择你的 GitHub 仓库
- 配置：
  - **Name**: `bubuchat-client`
  - **Root Directory**: `client`
  - **Build Command**: `npm run build`
  - **Publish Directory**: `dist`
- 点击 "Create Static Site"

4. **修改前端配置**

在 Render 的前端服务设置中添加环境变量：
- `VITE_SOCKET_URL`: 你的后端 Render URL（如 `https://bubuchat-server.onrender.com`）

5. **重新部署前端**

在 Render 前端服务页面点击 "Manual Deploy" → "Clear build cache & deploy"

6. **完成！**

访问你的前端 Render URL 即可使用。

---

### 方案三：自己的服务器（最灵活）

如果你有自己的服务器（阿里云、腾讯云、AWS等），可以这样部署：

#### 步骤：

1. **安装 Node.js**

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

2. **上传代码**

```bash
# 使用 scp 或 git
scp -r bubuchat user@your-server:/home/user/

# 或使用 git
git clone your-repo-url
cd bubuchat
```

3. **安装依赖**

```bash
cd server
npm install --production

cd ../client
npm install
npm run build
```

4. **使用 PM2 管理进程**

```bash
# 安装 PM2
sudo npm install -g pm2

# 启动后端
cd server
pm2 start index.js --name bubuchat-server

# 设置开机自启
pm2 startup
pm2 save
```

5. **使用 Nginx 反向代理**

安装 Nginx：

```bash
sudo apt-get install nginx  # Ubuntu/Debian
sudo yum install nginx      # CentOS/RHEL
```

创建配置文件 `/etc/nginx/sites-available/bubuchat`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /home/user/bubuchat/client/dist;
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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/bubuchat /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

6. **配置 SSL（可选，推荐）**

使用 Let's Encrypt 免费证书：

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

7. **完成！**

访问 `http://your-domain.com` 或 `https://your-domain.com`

---

### 方案四：Docker 部署（适合有服务器的用户）

#### 步骤：

1. **创建 Dockerfile**

**后端 Dockerfile** (`server/Dockerfile`)：

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "index.js"]
```

**前端 Dockerfile** (`client/Dockerfile`)：

```dockerfile
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Nginx 配置** (`client/nginx.conf`)：

```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

2. **构建镜像**

```bash
# 后端
cd server
docker build -t bubuchat-server .

# 前端
cd ../client
docker build -t bubuchat-client .
```

3. **运行容器**

```bash
# 后端
docker run -d -p 3000:3000 --name bubuchat-server bubuchat-server

# 前端
docker run -d -p 80:80 --name bubuchat-client bubuchat-client
```

4. **使用 Docker Compose（推荐）**

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  server:
    build: ./server
    ports:
      - "3000:3000"
    restart: always

  client:
    build: ./client
    ports:
      - "80:80"
    depends_on:
      - server
    restart: always
```

运行：

```bash
docker-compose up -d
```

---

### 方案五：Vercel + Railway（混合方案）

前端用 Vercel（速度快），后端用 Railway（支持 WebSocket）。

#### 步骤：

1. **前端部署到 Vercel**

- 访问 https://vercel.com/
- 使用 GitHub 账号登录
- 点击 "New Project"
- 选择你的仓库
- 在 "Root Directory" 填入 `client`
- 在 "Environment Variables" 添加：
  - `VITE_SOCKET_URL`: 你的 Railway 后端 URL
- 点击 "Deploy"

2. **后端部署到 Railway**

按照方案一的步骤部署后端到 Railway

3. **完成！**

Vercel 会给你一个 `vercel.app` 域名，访问即可。

---

## 域名配置（可选）

### 使用 Cloudflare 免费域名

1. 注册 Cloudflare：https://www.cloudflare.com/
2. 添加你的域名
3. 在 DNS 设置中添加 CNAME 记录：
   - `www` → 你的部署 URL
4. 等待 DNS 生效（通常几分钟）

### 使用免费域名

- **Freenom**: https://www.freenom.com/（.tk, .ml, .ga 等免费域名）
- **EU.org**: http://www.eu.org/（免费 .eu.org 域名）

---

## 常见问题

### 1. WebSocket 连接失败

**原因**：反向代理没有正确配置 WebSocket

**解决**：确保 Nginx 配置包含：
```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

### 2. 跨域问题

**原因**：前端和后端域名不同

**解决**：在 `server/index.js` 中已配置 CORS：
```javascript
cors: {
  origin: '*',
  methods: ['GET', 'POST'],
}
```

### 3. 端口被占用

**解决**：修改 `server/index.js` 中的端口：
```javascript
const PORT = process.env.PORT || 8080;
```

### 4. 部署后无法访问

**检查**：
- 服务器防火墙是否开放端口
- 云服务商的安全组是否开放端口
- PM2 进程是否在运行：`pm2 status`

---

## 性能优化

### 1. 使用 CDN

将前端静态文件上传到 CDN（如 Cloudflare、阿里云 CDN）

### 2. 启用 Gzip 压缩

在 Nginx 中已配置

### 3. 使用 Redis（可选）

如果用户量大，可以用 Redis 存储在线用户和消息

### 4. 负载均衡

使用 Nginx 负载均衡多个后端实例

---

## 监控和日志

### PM2 监控

```bash
pm2 monit  # 实时监控
pm2 logs bubuchat-server  # 查看日志
pm2 restart bubuchat-server  # 重启服务
```

### Nginx 日志

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 推荐方案总结

| 方案 | 难度 | 成本 | WebSocket | 推荐度 |
|------|------|------|-----------|--------|
| Railway | ⭐ | 免费 | ✅ | ⭐⭐⭐⭐⭐ |
| Render | ⭐ | 免费 | ✅ | ⭐⭐⭐⭐ |
| 自己服务器 | ⭐⭐⭐ | 付费 | ✅ | ⭐⭐⭐⭐ |
| Docker | ⭐⭐ | 付费 | ✅ | ⭐⭐⭐ |
| Vercel+Railway | ⭐⭐ | 免费 | ✅ | ⭐⭐⭐⭐⭐ |

**新手推荐**：Railway（最简单，完全免费）
**有服务器推荐**：自己的服务器 + Nginx
**追求速度**：Vercel + Railway

---

## 快速开始

如果你是新手，推荐使用 **Railway**：

1. 注册账号：https://railway.app/
2. 连接 GitHub
3. 选择仓库
4. 自动部署
5. 5分钟搞定！

就这么简单！🚀
