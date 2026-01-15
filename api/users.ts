import type { VercelRequest, VercelResponse } from '@vercel/node';

// 简单的内存存储（生产环境应使用数据库）
// 注意：Vercel 无服务器函数是 stateless 的，每次调用可能在不同的实例上
// 这里使用一个简单的存储方案，实际生产环境应使用 Vercel KV、数据库等

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

// 临时存储（仅用于演示，实际应使用持久化存储）
let usersStorage: UserData[] = [];

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
      return response.status(200).json({ users: usersStorage });
    }

    if (request.method === 'POST') {
      // 创建或更新用户
      const userData = request.body as UserData;
      
      if (!userData.id || !userData.email) {
        return response.status(400).json({ error: '用户ID和邮箱是必需的' });
      }

      const existingIndex = usersStorage.findIndex((u) => u.id === userData.id);
      
      if (existingIndex >= 0) {
        // 更新现有用户
        usersStorage[existingIndex] = userData;
      } else {
        // 创建新用户
        usersStorage.push(userData);
      }

      return response.status(200).json({ success: true, user: userData });
    }

    if (request.method === 'PUT') {
      // 更新用户（部分更新）
      const { userId, updates } = request.body as { userId: string; updates: Partial<UserData> };
      
      const userIndex = usersStorage.findIndex((u) => u.id === userId);
      
      if (userIndex === -1) {
        return response.status(404).json({ error: '用户不存在' });
      }

      usersStorage[userIndex] = { ...usersStorage[userIndex], ...updates };
      
      return response.status(200).json({ success: true, user: usersStorage[userIndex] });
    }

    if (request.method === 'DELETE') {
      // 删除用户
      const { userId } = request.body as { userId: string };
      
      usersStorage = usersStorage.filter((u) => u.id !== userId);
      
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
