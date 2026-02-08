import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// 初始化 Supabase 客户端
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // 设置 CORS 头
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email, password } = request.body;

    if (!email || !password) {
      return response.status(400).json({ error: '邮箱和密码是必需的' });
    }

    // 查询用户
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return response.status(401).json({ error: '邮箱或密码错误' });
    }

    // 验证密码 (目前是明文比对，建议后续升级为哈希)
    if (user.password !== password) {
      return response.status(401).json({ error: '邮箱或密码错误' });
    }

    // 移除密码字段
    const { password: _, ...userWithoutPassword } = user;

    // 格式化返回数据以匹配前端 User 类型
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      auditStatus: user.audit_status,
      role: user.role,
      identity: user.identity || null,
      createTime: user.create_time || user.created_at,
      createdAt: user.created_at || user.create_time,
    };

    return response.status(200).json({ 
      success: true, 
      user: userData 
    });

  } catch (error) {
    console.error('Login Error:', error);
    return response.status(500).json({ 
      error: '服务器错误',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
}
