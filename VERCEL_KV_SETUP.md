# Vercel KV 配置指南

## 为什么需要 Vercel KV？

当前 `/api/users.ts` 使用内存存储，在 Vercel 无服务器环境中数据不会持久化。要实现真正的跨设备数据同步，需要使用持久化存储。

## 配置步骤

### 1. 在 Vercel Dashboard 创建 KV 数据库

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 **Storage** 标签页
4. 点击 **Create Database**
5. 选择 **KV**（Redis）
6. 创建数据库（会生成环境变量）

### 2. 安装依赖

```bash
npm install @vercel/kv
```

### 3. 更新 API 路由

将 `api/users.ts` 替换为使用 KV 的版本：

```typescript
import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const STORAGE_KEY = 'marvel_education_users';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // ... CORS 设置 ...

  try {
    if (request.method === 'GET') {
      const users = await kv.get<UserData[]>(STORAGE_KEY) || [];
      return response.status(200).json({ users });
    }

    if (request.method === 'POST') {
      const userData = request.body as UserData;
      const users = await kv.get<UserData[]>(STORAGE_KEY) || [];
      
      const existingIndex = users.findIndex((u) => u.id === userData.id);
      if (existingIndex >= 0) {
        users[existingIndex] = userData;
      } else {
        users.push(userData);
      }
      
      await kv.set(STORAGE_KEY, users);
      return response.status(200).json({ success: true, user: userData });
    }

    // ... 其他方法类似 ...
  } catch (error) {
    // ... 错误处理 ...
  }
}
```

### 4. 部署

提交代码后，Vercel 会自动部署。KV 数据库的环境变量会自动注入。

## 验证

部署后，测试跨设备同步：
1. 在设备 A 注册新用户
2. 在设备 B 登录管理员后台
3. 应该能看到设备 A 注册的用户

## 注意事项

- Vercel KV 有免费额度，对于小型应用足够使用
- 如果超出免费额度，需要升级 Vercel 计划
- KV 数据会自动备份，不用担心数据丢失
