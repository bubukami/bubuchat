# Railway 部署配置

## 快速部署步骤

### 1. 准备代码

确保你的项目结构如下：

```
bubuchat/
├── server/
│   ├── index.js
│   ├── package.json
│   └── .gitignore
├── client/
│   ├── index.html
│   ├── src/
│   │   ├── App.vue
│   │   └── main.js
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
├── DEPLOY.md
├── README.md
└── .gitignore
```

### 2. 推送到 GitHub

```bash
# 初始化 Git 仓库（如果还没有）
git init
git add .
git commit -m "Initial commit: BubuChat lightweight chat app"

# 添加远程仓库（替换成你的仓库地址）
git remote add origin https://github.com/你的用户名/bubuchat.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### 3. 在 Railway 部署

#### 3.1 注册 Railway

1. 访问：https://railway.app/
2. 点击 "Start a New Project"
3. 选择 "Login with GitHub"
4. 授权 Railway 访问你的 GitHub

#### 3.2 创建项目

1. 点击 "New Project" 按钮
2. 选择 "Deploy from GitHub repo"
3. 在搜索框中找到你的 `bubuchat` 仓库
4. 点击 "Import"

#### 3.3 部署后端服务

Railway 会自动检测到 `server/package.json`，会自动创建一个服务。

**配置后端服务**：

1. 点击后端服务（通常叫 "server" 或 "bubuchat-server"）
2. 在 "Settings" 标签页：
   - **Name**: 改为 `bubuchat-server`
   - **Port**: 确认是 `3000`
3. 在 "Variables" 标签页：
   - 添加环境变量：`PORT` = `3000`
4. 等待部署完成（通常 1-2 分钟）

**获取后端 URL**：
- 部署完成后，在服务页面顶部会看到 URL
- 类似：`https://bubuchat-server-production.up.railway.app`
- **复制这个 URL**，后面配置前端需要用到

#### 3.4 部署前端服务

1. 回到项目主页面
2. 点击 "New Service" → "GitHub Repo"
3. 选择同一个 `bubuchat` 仓库
4. 配置前端服务：
   - **Name**: `bubuchat-client`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run preview`
   - **Environment Variables**:
     - `VITE_SOCKET_URL`: 粘贴后端 URL（例如 `https://bubuchat-server-production.up.railway.app`）

5. 点击 "Create Service"
6. 等待部署完成（通常 1-2 分钟）

#### 3.5 获取前端 URL

- 部署完成后，在前端服务页面顶部会看到 URL
- 类似：`https://bubuchat-client-production.up.railway.app`
- **这就是你的聊天应用地址！**

### 4. 测试部署

1. 打开浏览器，访问前端 URL
2. 输入昵称，选择主题
3. 点击"开始聊天"
4. 打开另一个浏览器窗口，访问同一个 URL
5. 用另一个昵称加入
6. 开始聊天测试！

### 5. 自定义域名（可选）

如果你想用自己的域名：

#### 前端域名

1. 在前端服务页面，点击 "Settings" → "Domains"
2. 点击 "Add Domain"
3. 输入你的域名（例如 `chat.yourdomain.com`）
4. 按照提示添加 DNS 记录

#### 后端域名

1. 在后端服务页面，点击 "Settings" → "Domains"
2. 点击 "Add Domain"
3. 输入你的域名（例如 `api.yourdomain.com`）
4. 按照提示添加 DNS 记录

### 6. 监控和管理

#### 查看日志

1. 在服务页面，点击 "Logs" 标签
2. 可以看到实时日志
3. 也可以查看历史日志

#### 查看指标

1. 在服务页面，点击 "Metrics" 标签
2. 可以看到 CPU、内存、网络使用情况
3. Railway 免费额度：每月 $5，足够小项目使用

#### 重启服务

1. 在服务页面，点击 "Settings" 标签
2. 点击 "Restart Service" 按钮

#### 重新部署

当你推送新代码到 GitHub 时，Railway 会自动重新部署。

你也可以手动触发：
1. 在服务页面，点击 "Deployments" 标签
2. 点击 "Redeploy" 按钮

### 7. 环境变量说明

#### 后端环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| PORT | 服务器端口 | 3000 |

#### 前端环境变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| VITE_SOCKET_URL | WebSocket 服务器地址 | https://bubuchat-server-production.up.railway.app |

### 8. 常见问题

#### Q1: 部署后无法连接 WebSocket

**原因**: 前端的 `VITE_SOCKET_URL` 配置错误

**解决**:
1. 确认后端服务 URL 正确
2. 在前端服务的环境变量中重新设置 `VITE_SOCKET_URL`
3. 重新部署前端服务

#### Q2: 跨域问题

**原因**: CORS 配置问题

**解决**: 后端代码已配置 CORS 允许所有来源，应该不会有这个问题。如果还有问题，检查 `server/index.js` 中的 CORS 配置。

#### Q3: 部署失败

**原因**: 可能是依赖安装失败

**解决**:
1. 查看 "Logs" 标签页的错误信息
2. 检查 `package.json` 是否正确
3. 确认所有依赖都已正确列出

#### Q4: 如何更新应用？

**方法**: 直接推送代码到 GitHub，Railway 会自动重新部署

```bash
git add .
git commit -m "Update: 添加新功能"
git push
```

#### Q5: Railway 免费额度用完了怎么办？

**解决**:
1. Railway 每月 $5 免费额度
2. 如果用完了，可以：
   - 升级到付费计划
   - 或者删除不用的服务
   - 或者优化应用减少资源使用

### 9. 成本估算

Railway 免费额度：
- 每月 $5
- 足够运行 2 个小服务（前端 + 后端）

如果你的应用用户量不大，完全够用！

### 10. 下一步

部署完成后，你可以：
- 分享 URL 给朋友使用
- 自定义域名
- 添加更多功能
- 监控应用性能

---

## 🎉 完成！

你的 BubuChat 现在已经部署到 Railway 了！

访问你的前端 URL，开始聊天吧！

**有问题？查看 Railway 文档：https://docs.railway.app/**
