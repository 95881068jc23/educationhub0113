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

// 使用 Vercel KV 的版本（需要配置 KV）
// 如果未配置 KV，会回退到内存存储

let kv: any = null;
let usersMap: Map<string, UserData> = new Map();

// 尝试初始化 Vercel KV
try {
  // 检查环境变量
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    // 动态导入 @vercel/kv（如果已安装）
    // 注意：需要先安装 npm install @vercel/kv
    // import { kv } from '@vercel/kv';
  }
} catch (error) {
  console.warn('Vercel KV 未配置，使用内存存储:', error);
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
      if (kv) {
        // 使用 KV 存储
        try {
          const users = await kv.get(STORAGE_KEY);
          return users || [];
        } catch (error) {
          console.error('从 KV 读取失败:', error);
          return Array.from(usersMap.values());
        }
      } else {
        // 使用内存存储
        return Array.from(usersMap.values());
      }
    };

    // 保存所有用户
    const saveAllUsersToStorage = async (users: UserData[]): Promise<void> => {
      if (kv) {
        // 使用 KV 存储
        try {
          await kv.set(STORAGE_KEY, users);
        } catch (error) {
          console.error('保存到 KV 失败:', error);
          // 回退到内存存储
          usersMap.clear();
          users.forEach((user) => usersMap.set(user.id, user));
        }
      } else {
        // 使用内存存储
        usersMap.clear();
        users.forEach((user) => usersMap.set(user.id, user));
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
