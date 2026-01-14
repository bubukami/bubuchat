# 腾讯云开发(CloudBase)部署指南

本指南将帮助你将 BubuChat 项目部署到腾讯云开发平台，实现国内快速访问。

## 准备工作

1. 访问 [腾讯云开发官网](https://console.cloud.tencent.com/tcb) 注册/登录账号
2. 完成实名认证
3. 确保你的项目代码在本地可正常运行

## 步骤 1：创建云开发环境

1. 登录腾讯云开发控制台
2. 点击 **"新建环境"**
3. 填写环境信息：
   - **环境名称**：`bubuchat-env`
   - **计费方式**：选择 **"按量付费"**（免费额度内不收费）
   - **环境类型**：选择 **"标准环境"**
   - **地域**：选择离你最近的地域（推荐：广州/上海/北京）
4. 点击 **"立即开通"**

## 步骤 2：配置云开发环境

1. 环境创建完成后，进入环境详情页
2. 点击 **"云函数"** 标签
3. 点击 **"新建函数"**

## 步骤 3：部署后端云函数

### 3.1 准备后端代码

1. 在本地创建一个新的目录 `tcb-functions`
2. 将 `server/` 目录下的所有文件复制到 `tcb-functions/chat/` 目录
3. 修改 `tcb-functions/chat/index.js` 文件，添加云函数入口：

```javascript
// 云函数入口文件
const cloud = require('wx-server-sdk');
const app = require('./server'); // 原来的server/index.js

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 云函数入口函数
exports.main = async (event, context) => {
  // 这里不需要处理HTTP请求，因为WebSocket会直接连接
  return { success: true };
};
```

4. 在 `tcb-functions/chat/` 目录下创建 `package.json` 文件：

```json
{
  "name": "chat",
  "version": "1.0.0",
  "description": "BubuChat后端云函数",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.7.2",
    "wx-server-sdk": "^2.10.0"
  }
}
```

### 3.2 部署云函数

1. 在云函数列表页面，点击 **"上传并部署"**
2. 选择 **"文件夹"** 上传方式
3. 选择本地的 `tcb-functions/chat/` 目录
4. 选择 **"运行环境"**：Node.js 14.17
5. 点击 **"确定"** 开始部署

## 步骤 4：配置WebSocket

1. 在环境详情页，点击 **"环境设置"**
2. 点击 **"功能配置"** 标签
3. 找到 **"WebSocket"** 选项，点击 **"启用"**
4. 配置WebSocket：
   - **关联函数**：选择刚才创建的 `chat` 函数
   - **路径**：`/ws`
5. 点击 **"保存"**

## 步骤 5：部署前端静态网站

### 5.1 修改前端代码

1. 打开 `client/src/App.vue` 文件
2. 修改WebSocket连接地址：

```javascript
function joinChat() {
  if (!username.value.trim()) return;

  myUserId.value = generateUserId();
  // 替换为你的云开发环境域名
  const socketUrl = 'wss://your-env-id.ws.ap-shanghai.tcb.qcloud.la/ws';
  socket = io(socketUrl);
  
  // 其余代码不变...
}
```

### 5.2 构建前端项目

```bash
cd client
npm install
npm run build
```

构建完成后，会生成 `dist/` 目录

### 5.3 部署静态网站

1. 在云开发控制台，点击 **"静态网站托管"**
2. 点击 **"开始使用"**（如果是第一次使用）
3. 点击 **"上传文件"**
4. 上传 `client/dist/` 目录下的所有文件
5. 上传完成后，点击 **"详情"** 查看访问域名

## 步骤 6：测试部署

1. 访问前端静态网站的域名
2. 输入昵称，点击 "开始聊天"
3. 发送消息，确认可以正常工作
4. 关闭页面，重新打开，确认历史消息可以正常加载

## 注意事项

### 1. 免费额度说明

腾讯云开发提供的免费额度：
- 云函数：每月100万次调用
- 静态网站：每月10GB流量
- 数据库：5GB存储空间
- WebSocket：免费额度内使用

### 2. 环境域名

你的WebSocket连接地址格式为：
```
wss://your-env-id.ws.ap-region.tcb.qcloud.la/ws
```

其中：
- `your-env-id`：你的云开发环境ID
- `ap-region`：你的环境地域代码（如：ap-shanghai）

### 3. 消息存储

由于云函数的文件系统是临时的，我们需要将消息存储改为云数据库：

1. 在云开发控制台，点击 **"数据库"**
2. 创建一个名为 `messages` 的集合
3. 修改后端代码，使用云数据库存储消息

```javascript
// 使用云数据库存储消息
const db = cloud.database();

// 保存消息
async function saveMessage(message) {
  try {
    await db.collection('messages').add({
      data: message
    });
    // 限制消息数量
    const count = await db.collection('messages').count();
    if (count.total > 100) {
      const oldest = await db.collection('messages')
        .orderBy('timestamp', 'asc')
        .limit(1)
        .get();
      await db.collection('messages').doc(oldest.data[0]._id).remove();
    }
  } catch (error) {
    console.error('保存消息失败:', error);
  }
}

// 加载消息
async function loadMessages() {
  try {
    const result = await db.collection('messages')
      .orderBy('timestamp', 'asc')
      .get();
    return result.data;
  } catch (error) {
    console.error('加载消息失败:', error);
    return [];
  }
}
```

## 后续优化

1. **添加用户认证**：使用云开发的用户系统
2. **消息加密**：对敏感消息进行加密存储
3. **性能优化**：添加消息缓存机制
4. **监控告警**：配置使用量监控和告警

## 故障排查

### 问题 1：WebSocket连接失败

- 检查WebSocket地址是否正确
- 确认云函数已正确部署
- 检查云开发环境是否已启用WebSocket

### 问题 2：历史消息不显示

- 检查云数据库是否已创建
- 确认消息存储逻辑是否正确
- 检查数据库权限设置

### 问题 3：前端页面访问缓慢

- 优化前端代码，减少资源大小
- 启用CDN加速
- 选择离用户更近的地域

---

部署完成后，你的BubuChat应用就可以通过腾讯云开发平台在国内快速访问了！🎉