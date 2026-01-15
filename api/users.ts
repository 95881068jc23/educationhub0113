import { kv } from '@vercel/kv';
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

const STORAGE_KEY = 'marvel_education_users';

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
    // 获取所有用户
    const getAllUsersFromStorage = async (): Promise<UserData[]> => {
      try {
        const users = await kv.get<UserData[]>(STORAGE_KEY);
        return users || [];
      } catch (error) {
        console.error('从 KV 读取失败:', error);
        // 如果 KV 未配置，返回空数组
        return [];
      }
    };

    // 保存所有用户
    const saveAllUsersToStorage = async (users: UserData[]): Promise<void> => {
      try {
        await kv.set(STORAGE_KEY, users);
      } catch (error) {
        console.error('保存到 KV 失败:', error);
        throw new Error('保存用户数据失败，请检查 Vercel KV 配置');
      }
    };

    if (request.method === 'GET') {
      const allUsers = await getAllUsersFromStorage();
      return response.status(200).json({ users: allUsers });
    }

    if (request.method === 'POST') {
      const userData = request.body as UserData;
      
      if (!userData.id || !userData.email) {
        return response.status(400).json({ error: '用户ID和邮箱是必需的' });
      }

      const allUsers = await getAllUsersFromStorage();
      const existingIndex = allUsers.findIndex((u) => u.id === userData.id);
      
      if (existingIndex >= 0) {
        allUsers[existingIndex] = userData;
      } else {
        allUsers.push(userData);
      }

      await saveAllUsersToStorage(allUsers);

      return response.status(200).json({ success: true, user: userData });
    }

    if (request.method === 'PUT') {
      const { userId, updates } = request.body as { userId: string; updates: Partial<UserData> };
      
      const allUsers = await getAllUsersFromStorage();
      const userIndex = allUsers.findIndex((u) => u.id === userId);
      
      if (userIndex === -1) {
        return response.status(404).json({ error: '用户不存在' });
      }

      allUsers[userIndex] = { ...allUsers[userIndex], ...updates };
      await saveAllUsersToStorage(allUsers);
      
      return response.status(200).json({ success: true, user: allUsers[userIndex] });
    }

    if (request.method === 'DELETE') {
      const { userId } = request.body as { userId: string };
      
      const allUsers = await getAllUsersFromStorage();
      const filteredUsers = allUsers.filter((u) => u.id !== userId);
      
      if (filteredUsers.length === allUsers.length) {
        return response.status(404).json({ error: '用户不存在' });
      }
      
      await saveAllUsersToStorage(filteredUsers);
      
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
