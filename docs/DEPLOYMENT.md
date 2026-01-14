# BubuChat 部署指南

## 概述

BubuChat 是一个基于 Node.js、Vue 3、MySQL 和 Redis 的实时聊天应用程序。本指南提供了详细的部署步骤和配置说明。

## 系统要求

### 服务器配置

- **操作系统**: Ubuntu 20.04+ / CentOS 7+ / Windows Server 2019+
- **CPU**: 2 核以上
- **内存**: 4GB 以上
- **磁盘**: 50GB 以上
- **网络**: 100Mbps 以上

### 软件要求

- **Docker**: 20.10 或更高
- **Docker Compose**: 2.0 或更高
- **Node.js**: 18.x 或更高（本地开发）
- **MySQL**: 8.0 或更高（本地开发）
- **Redis**: 6.0 或更高（本地开发）

## 部署方式

### 方式 1：Docker 部署（推荐）

#### 1. 克隆项目

```bash
git clone <repository-url>
cd bubuchat
```

#### 2. 配置环境变量

复制并修改环境配置文件：

```bash
# 后端配置
cd server
cp .env.example .env
# 编辑 .env 文件，修改数据库密码、JWT密钥等敏感信息

# 前端配置
cd ../client
cp .env.example .env
# 编辑 .env 文件，修改 API 地址
```

#### 3. 构建并启动服务

```bash
# 返回项目根目录
cd ..

# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

#### 4. 初始化数据库

```bash
# 进入服务器容器
docker-compose exec server sh

# 同步数据库表
npm run sync

# 退出容器
exit
```

#### 5. 访问应用

- **前端应用**: http://localhost
- **后端 API**: http://localhost:3000
- **健康检查**: http://localhost:3000/health

#### 6. 停止服务

```bash
docker-compose down
```

#### 7. 重启服务

```bash
docker-compose restart
```

### 方式 2：传统部署

#### 1. 安装依赖

##### 安装 Node.js

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

##### 安装 MySQL

```bash
# Ubuntu/Debian
sudo apt-get install -y mysql-server

# CentOS/RHEL
sudo yum install -y mysql-server
```

##### 安装 Redis

```bash
# Ubuntu/Debian
sudo apt-get install -y redis-server

# CentOS/RHEL
sudo yum install -y redis
```

##### 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt-get install -y nginx

# CentOS/RHEL
sudo yum install -y nginx
```

#### 2. 配置数据库

```bash
# 登录 MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE bubuchat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建用户
CREATE USER 'bubuchat'@'%' IDENTIFIED BY 'your_password';

# 授权
GRANT ALL PRIVILEGES ON bubuchat.* TO 'bubuchat'@'%';
FLUSH PRIVILEGES;

# 退出
exit;
```

#### 3. 配置 Redis

```bash
# 编辑 Redis 配置
sudo nano /etc/redis/redis.conf

# 设置密码
requirepass your_redis_password

# 重启 Redis
sudo systemctl restart redis
```

#### 4. 安装后端依赖

```bash
cd server
npm install
```

#### 5. 配置后端环境变量

```bash
cp .env.example .env
nano .env
```

修改以下配置：

```env
PORT=3000
NODE_ENV=production

DB_HOST=localhost
DB_PORT=3306
DB_NAME=bubuchat
DB_USER=bubuchat
DB_PASSWORD=your_password

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

CORS_ORIGIN=*
```

#### 6. 初始化数据库

```bash
npm run sync
```

#### 7. 启动后端服务

```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

#### 8. 安装前端依赖

```bash
cd ../client
npm install
```

#### 9. 配置前端环境变量

```bash
cp .env.example .env
nano .env
```

修改以下配置：

```env
VITE_API_BASE_URL=http://localhost:3000
```

#### 10. 构建前端

```bash
npm run build
```

#### 11. 配置 Nginx

创建 Nginx 配置文件：

```bash
sudo nano /etc/nginx/sites-available/bubuchat
```

添加以下内容：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/bubuchat/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
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

#### 12. 使用 PM2 管理进程

```bash
# 安装 PM2
sudo npm install -g pm2

# 启动后端服务
cd server
pm2 start dist/app.js --name bubuchat-server

# 查看状态
pm2 status

# 查看日志
pm2 logs bubuchat-server

# 重启服务
pm2 restart bubuchat-server

# 停止服务
pm2 stop bubuchat-server

# 设置开机自启
pm2 startup
pm2 save
```

## SSL/HTTPS 配置

### 使用 Let's Encrypt

```bash
# 安装 Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

### 手动配置 SSL

编辑 Nginx 配置：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 其他配置...
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## 数据备份

### 手动备份

```bash
# 备份数据库
mysqldump -u bubuchat -p bubuchat > backup_$(date +%Y%m%d).sql

# 备份 Redis
redis-cli --rdb /path/to/backup/dump_$(date +%Y%m%d).rdb
```

### 自动备份

添加到 crontab：

```bash
crontab -e
```

添加以下内容：

```bash
# 每天凌晨 2 点备份数据库
0 2 * * * /usr/bin/mysqldump -u bubuchat -p bubuchat > /backups/db_$(date +\%Y\%m\%d).sql

# 每周清理旧备份
0 3 * * 0 /usr/bin/find /backups -name "db_*.sql" -mtime +30 -delete
```

## 监控与日志

### 查看日志

```bash
# Docker 部署
docker-compose logs -f server
docker-compose logs -f client

# PM2 部署
pm2 logs bubuchat-server

# Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 健康检查

```bash
# 检查应用健康状态
curl http://localhost:3000/health
```

## 故障排查

### 常见问题

#### 1. 应用无法启动

```bash
# 检查端口占用
netstat -tuln | grep :3000

# 检查环境变量
pm2 env bubuchat-server

# 查看详细日志
pm2 logs bubuchat-server --lines 100
```

#### 2. 数据库连接失败

```bash
# 测试数据库连接
mysql -u bubuchat -p -h localhost bubuchat

# 检查 MySQL 状态
sudo systemctl status mysql

# 查看 MySQL 日志
sudo tail -f /var/log/mysql/error.log
```

#### 3. Redis 连接失败

```bash
# 测试 Redis 连接
redis-cli -a your_redis_password ping

# 检查 Redis 状态
sudo systemctl status redis

# 查看 Redis 日志
sudo tail -f /var/log/redis/redis-server.log
```

#### 4. WebSocket 连接失败

检查 Nginx 配置中的 WebSocket 代理设置，确保正确配置了 `Upgrade` 和 `Connection` 头。

## 性能优化

### 1. 数据库优化

```sql
-- 添加索引
CREATE INDEX idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_conversations_user ON conversations(user_id);
```

### 2. Redis 缓存

配置 Redis 用于缓存在线用户和会话信息。

### 3. Nginx 缓存

在 Nginx 配置中添加缓存规则：

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=bubuchat_cache:10m max_size=1g inactive=60m;

location /api {
    proxy_cache bubuchat_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_key "$scheme$request_method$host$request_uri";
    # 其他配置...
}
```

## 安全加固

### 1. 防火墙配置

```bash
# Ubuntu/Debian
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 2. 文件权限

```bash
# 设置正确的文件权限
chmod 600 .env
chmod 700 logs/
```

### 3. 更新依赖

定期更新依赖以修复安全漏洞：

```bash
# 检查过时的依赖
npm outdated

# 更新依赖
npm update
npm audit fix
```

## 部署检查清单

### 部署前

- [ ] 环境变量已配置
- [ ] 数据库已创建
- [ ] Redis 已配置
- [ ] SSL 证书已获取（生产环境）
- [ ] Nginx 已配置
- [ ] 防火墙规则已设置
- [ ] 备份策略已设置

### 部署后

- [ ] 应用正常启动
- [ ] 数据库连接正常
- [ ] Redis 连接正常
- [ ] API 健康检查通过
- [ ] WebSocket 连接正常
- [ ] 日志正常输出
- [ ] SSL 证书有效（生产环境）
- [ ] 性能指标正常

## 参考资料

- [Docker 文档](https://docs.docker.com/)
- [Nginx 文档](https://nginx.org/en/docs/)
- [PM2 文档](https://pm2.keymetrics.io/docs/)
- [MySQL 文档](https://dev.mysql.com/doc/)
- [Redis 文档](https://redis.io/documentation)
