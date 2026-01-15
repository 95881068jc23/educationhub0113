import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

interface UserData {
  id: string;
  username: string;
  email: string;
  name: string;
  password: string;
  auditStatus: number;
  role: string;
  identity: string[] | null;
  createTime: string;
  createdAt: string;
}

// 初始化 Supabase 客户端
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL 和 Key 未配置。请在 Vercel 环境变量中设置 SUPABASE_URL 和 SUPABASE_ANON_KEY。');
  }

  return createClient(supabaseUrl, supabaseKey);
};

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
    const supabase = getSupabaseClient();

    // 获取所有用户
    const getAllUsersFromStorage = async (): Promise<UserData[]> => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('create_time', { ascending: false });

      if (error) {
        console.error('从 Supabase 读取失败:', error);
        throw error;
      }

      // 转换数据格式以匹配前端期望的格式
      return (data || []).map((user: any) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        password: user.password,
        auditStatus: user.audit_status,
        role: user.role,
        identity: user.identity || null,
        createTime: user.create_time || user.created_at,
        createdAt: user.created_at || user.create_time,
      }));
    };

    // 保存所有用户（用于批量更新）
    const saveAllUsersToStorage = async (users: UserData[]): Promise<void> => {
      // 转换数据格式以匹配数据库表结构
      const usersToInsert = users.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        password: user.password,
        audit_status: user.auditStatus,
        role: user.role,
        identity: user.identity,
        create_time: user.createTime || user.createdAt,
        created_at: user.createdAt || user.createTime,
      }));

      // 使用 upsert 来插入或更新
      const { error } = await supabase
        .from('users')
        .upsert(usersToInsert, { onConflict: 'id' });

      if (error) {
        console.error('保存到 Supabase 失败:', error);
        throw new Error(`保存用户数据失败: ${error.message}`);
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

      // 转换数据格式
      const userToInsert = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        name: userData.name,
        password: userData.password,
        audit_status: userData.auditStatus,
        role: userData.role,
        identity: userData.identity || null,
        create_time: userData.createTime || new Date().toISOString(),
        created_at: userData.createdAt || new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('users')
        .upsert(userToInsert, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error('保存用户失败:', error);
        return response.status(500).json({ 
          error: '保存用户失败',
          message: error.message 
        });
      }

      // 转换回前端格式
      const savedUser: UserData = {
        id: data.id,
        username: data.username,
        email: data.email,
        name: data.name,
        password: data.password,
        auditStatus: data.audit_status,
        role: data.role,
        identity: data.identity || null,
        createTime: data.create_time || data.created_at,
        createdAt: data.created_at || data.create_time,
      };

      return response.status(200).json({ success: true, user: savedUser });
    }

    if (request.method === 'PUT') {
      const { userId, updates } = request.body as { userId: string; updates: Partial<UserData> };
      
      // 转换更新数据格式
      const updateData: any = {};
      if (updates.auditStatus !== undefined) updateData.audit_status = updates.auditStatus;
      if (updates.role !== undefined) updateData.role = updates.role;
      if (updates.identity !== undefined) updateData.identity = updates.identity;
      if (updates.username !== undefined) updateData.username = updates.username;
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.password !== undefined) updateData.password = updates.password;

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return response.status(404).json({ error: '用户不存在' });
        }
        console.error('更新用户失败:', error);
        return response.status(500).json({ 
          error: '更新用户失败',
          message: error.message 
        });
      }

      // 转换回前端格式
      const updatedUser: UserData = {
        id: data.id,
        username: data.username,
        email: data.email,
        name: data.name,
        password: data.password,
        auditStatus: data.audit_status,
        role: data.role,
        identity: data.identity || null,
        createTime: data.create_time || data.created_at,
        createdAt: data.created_at || data.create_time,
      };

      return response.status(200).json({ success: true, user: updatedUser });
    }

    if (request.method === 'DELETE') {
      const { userId } = request.body as { userId: string };
      
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('删除用户失败:', error);
        return response.status(500).json({ 
          error: '删除用户失败',
          message: error.message 
        });
      }

      // 检查是否真的删除了
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (data) {
        return response.status(404).json({ error: '用户不存在或删除失败' });
      }

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
