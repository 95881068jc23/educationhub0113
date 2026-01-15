import type { VercelRequest, VercelResponse } from '@vercel/node';

interface UserData {
  id: string;
  username: string;
  email: string;
  name: string;
  password: string;
  auditStatus: number;
  role: string;
  identity: string | null;
  createTime: string;
  createdAt: string;
}

// 使用全局变量存储（在 Vercel 环境中，这个变量会在同一实例中保持）
// 注意：Vercel 无服务器函数是 stateless 的，不同请求可能在不同实例上
// 为了真正的持久化，应该使用 Vercel KV、数据库或其他持久化存储
// 这里提供一个基础实现，实际生产环境应使用持久化存储

// 使用 Map 存储用户数据，key 是用户 ID
const usersMap = new Map<string, UserData>();

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // 设置 CORS
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  try {
    if (request.method === 'GET') {
      // 获取所有用户
      const allUsers = Array.from(usersMap.values());
      return response.status(200).json({ users: allUsers });
    }

    if (request.method === 'POST') {
      // 创建或更新用户
      const userData = request.body as UserData;
      
      if (!userData.id || !userData.email) {
        return response.status(400).json({ error: '用户ID和邮箱是必需的' });
      }

      // 存储或更新用户
      usersMap.set(userData.id, userData);

      return response.status(200).json({ success: true, user: userData });
    }

    if (request.method === 'PUT') {
      // 更新用户（部分更新）
      const { userId, updates } = request.body as { userId: string; updates: Partial<UserData> };
      
      const existingUser = usersMap.get(userId);
      
      if (!existingUser) {
        return response.status(404).json({ error: '用户不存在' });
      }

      const updatedUser = { ...existingUser, ...updates };
      usersMap.set(userId, updatedUser);
      
      return response.status(200).json({ success: true, user: updatedUser });
    }

    if (request.method === 'DELETE') {
      // 删除用户
      const { userId } = request.body as { userId: string };
      
      if (!usersMap.has(userId)) {
        return response.status(404).json({ error: '用户不存在' });
      }
      
      usersMap.delete(userId);
      
      return response.status(200).json({ success: true });
    }

    return response.status(405).json({ error: '不支持的请求方法' });
  } catch (error) {
    console.error('API Error:', error);
    return response.status(500).json({ 
      error: '服务器错误',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
}
