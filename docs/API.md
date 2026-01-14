# BubuChat API 文档

## 概述

BubuChat 是一个实时聊天应用程序，提供完整的 RESTful API 接口和 WebSocket 实时通信。

## 基础信息

- **Base URL**: `http://localhost:3000/api`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON
- **字符编码**: UTF-8

## 认证

所有 API 接口（除登录和注册外）都需要在请求头中携带 JWT Token：

```
Authorization: Bearer {token}
```

## 统一响应格式

### 成功响应

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": { ... }
}
```

### 错误响应

```json
{
  "code": 400,
  "msg": "错误信息",
  "errors": [ ... ]
}
```

## 状态码说明

| 状态码 | 说明                |
| ------ | ------------------- |
| 200    | 请求成功            |
| 400    | 请求参数错误        |
| 401    | 未授权或 Token 失效 |
| 403    | 权限不足            |
| 404    | 资源不存在          |
| 429    | 请求过于频繁        |
| 500    | 服务器内部错误      |

## API 接口

### 认证模块

#### 用户注册

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

响应：

```json
{
  "code": 200,
  "msg": "注册成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "avatar": null,
      "status": "offline"
    }
  }
}
```

#### 用户登录

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

响应：

```json
{
  "code": 200,
  "msg": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "avatar": null,
      "status": "online"
    }
  }
}
```

#### 用户登出

```http
POST /api/auth/logout
Authorization: Bearer {token}
```

响应：

```json
{
  "code": 200,
  "msg": "登出成功"
}
```

#### 获取当前用户信息

```http
GET /api/auth/me
Authorization: Bearer {token}
```

响应：

```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "avatar": null,
    "status": "online",
    "last_seen": "2026-01-14T15:00:00.000Z"
  }
}
```

### 聊天模块

#### 获取用户列表

```http
GET /api/chat/users
Authorization: Bearer {token}
```

响应：

```json
{
  "code": 200,
  "msg": "获取成功",
  "data": [
    {
      "id": 2,
      "username": "user2",
      "email": "user2@example.com",
      "avatar": null,
      "status": "online",
      "last_seen": "2026-01-14T15:00:00.000Z"
    }
  ]
}
```

#### 获取会话列表

```http
GET /api/chat/conversations
Authorization: Bearer {token}
```

响应：

```json
{
  "code": 200,
  "msg": "获取成功",
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "other_user_id": 2,
      "room_id": "chat_1_2",
      "last_message": "你好",
      "last_message_at": "2026-01-14T15:00:00.000Z",
      "unread_count": 2,
      "otherUser": {
        "id": 2,
        "username": "user2",
        "avatar": null,
        "status": "online"
      }
    }
  ]
}
```

#### 获取消息记录

```http
GET /api/chat/messages/:userId?page=1&limit=50
Authorization: Bearer {token}
```

响应：

```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "list": [
      {
        "id": 1,
        "sender_id": 1,
        "receiver_id": 2,
        "content": "你好",
        "message_type": "text",
        "is_read": true,
        "read_at": "2026-01-14T15:00:00.000Z",
        "created_at": "2026-01-14T15:00:00.000Z",
        "sender": {
          "id": 1,
          "username": "testuser",
          "avatar": null
        }
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 50
  }
}
```

#### 标记消息已读

```http
POST /api/chat/messages/:userId/read
Authorization: Bearer {token}
```

响应：

```json
{
  "code": 200,
  "msg": "标记已读成功"
}
```

#### 删除消息

```http
DELETE /api/chat/messages/:id
Authorization: Bearer {token}
```

响应：

```json
{
  "code": 200,
  "msg": "删除成功"
}
```

## WebSocket 事件

### 连接

```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

### 客户端事件

#### 加入会话

```javascript
socket.emit('join_conversation', { userId: 2 });
```

#### 发送消息

```javascript
socket.emit('send_message', {
  receiver_id: 2,
  content: '你好'
});
```

#### 正在输入

```javascript
socket.emit('typing', { receiver_id: 2 });
```

#### 停止输入

```javascript
socket.emit('stop_typing', { receiver_id: 2 });
```

### 服务器事件

#### 新消息

```javascript
socket.on('new_message', (data) => {
  console.log(data);
});
```

数据格式：

```json
{
  "id": 1,
  "sender_id": 1,
  "receiver_id": 2,
  "content": "你好",
  "message_type": "text",
  "is_read": false,
  "created_at": "2026-01-14T15:00:00.000Z"
}
```

#### 用户正在输入

```javascript
socket.on('user_typing', (data) => {
  console.log(data);
});
```

数据格式：

```json
{
  "user_id": 2
}
```

#### 用户停止输入

```javascript
socket.on('user_stop_typing', (data) => {
  console.log(data);
});
```

#### 用户状态改变

```javascript
socket.on('user_status_changed', (data) => {
  console.log(data);
});
```

数据格式：

```json
{
  "user_id": 2,
  "status": "online"
}
```

## 限流规则

- 普通 API: 100 次/15 分钟
- 登录/注册 API: 5 次/15 分钟

## 错误处理

所有错误都遵循统一的错误响应格式。常见错误类型：

### 认证错误 (401)

```json
{
  "code": 401,
  "msg": "认证令牌无效或已过期"
}
```

### 权限错误 (403)

```json
{
  "code": 403,
  "msg": "无权访问该资源"
}
```

### 参数错误 (400)

```json
{
  "code": 400,
  "msg": "请求参数错误",
  "errors": [
    {
      "msg": "用户名不能为空",
      "param": "username",
      "location": "body"
    }
  ]
}
```

## 版本历史

- **v1.0.0** (2026-01-14): 初始版本
