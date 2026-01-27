import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

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
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  try {
    const supabase = getSupabaseClient();

    if (request.method === 'POST') {
      // 记录操作日志
      const { userId, actionType, actionDetails, ipAddress, userAgent } = request.body as {
        userId: string;
        actionType: string;
        actionDetails?: Record<string, any>;
        ipAddress?: string;
        userAgent?: string;
      };

      if (!userId || !actionType) {
        return response.status(400).json({ error: '缺少必需参数：userId, actionType' });
      }

      const { data, error } = await supabase
        .from('user_logs')
        .insert({
          user_id: userId,
          action_type: actionType,
          action_details: actionDetails || {},
          ip_address: ipAddress || request.headers['x-forwarded-for'] || request.socket.remoteAddress,
          user_agent: userAgent || request.headers['user-agent'],
        })
        .select()
        .single();

      if (error) {
        console.error('记录日志失败:', error);
        return response.status(500).json({ 
          error: '记录日志失败',
          message: error.message 
        });
      }

      return response.status(200).json({ success: true, log: data });
    }

    if (request.method === 'GET') {
      // 查询操作日志
      const { userId, actionType, limit = 100, offset = 0 } = request.query as {
        userId?: string;
        actionType?: string;
        limit?: string;
        offset?: string;
      };

      let query = supabase
        .from('user_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(parseInt(limit) || 100)
        .range(parseInt(offset) || 0, parseInt(offset) + parseInt(limit) - 1);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (actionType) {
        query = query.eq('action_type', actionType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('查询日志失败:', error);
        return response.status(500).json({ 
          error: '查询日志失败',
          message: error.message 
        });
      }

      return response.status(200).json({ logs: data || [] });
    }

    return response.status(405).json({ error: '不支持的请求方法' });
  } catch (error) {
    console.error('Logs API Error:', error);
    return response.status(500).json({ 
      error: '服务器错误',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
}
