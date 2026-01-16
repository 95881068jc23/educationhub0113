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
  response.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  try {
    const supabase = getSupabaseClient();

    // GET: 获取文件列表
    if (request.method === 'GET') {
      const { userId, fileType } = request.query;

      let query = supabase.from('user_files').select('*');

      if (userId) {
        query = query.eq('user_id', userId as string);
      }
      if (fileType) {
        query = query.eq('file_type', fileType as string);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('查询文件列表失败:', error);
        return response.status(500).json({ 
          error: '查询文件列表失败',
          message: error.message 
        });
      }

      return response.status(200).json({ files: data || [] });
    }

    // DELETE: 删除文件
    if (request.method === 'DELETE') {
      const { id } = request.query;

      if (!id || typeof id !== 'string') {
        return response.status(400).json({ error: '缺少文件 ID' });
      }

      // 1. 从数据库获取文件信息
      const { data: fileData, error: fetchError } = await supabase
        .from('user_files')
        .select('file_path')
        .eq('id', id)
        .single();

      if (fetchError || !fileData) {
        console.error('文件不存在:', fetchError);
        return response.status(404).json({ error: '文件不存在' });
      }

      // 2. 从 Supabase Storage 删除文件
      const bucketName = 'user-files';
      const { error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove([fileData.file_path]);

      if (deleteError) {
        console.error('删除文件失败:', deleteError);
        return response.status(500).json({ 
          error: '删除文件失败',
          message: deleteError.message 
        });
      }

      // 3. 从数据库删除记录
      const { error: dbError } = await supabase
        .from('user_files')
        .delete()
        .eq('id', id);

      if (dbError) {
        console.error('删除记录失败:', dbError);
        return response.status(500).json({ 
          error: '删除记录失败',
          message: dbError.message 
        });
      }

      return response.status(200).json({ success: true });
    }

    return response.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Files API Error:', error);
    return response.status(500).json({ 
      error: '服务器错误',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
}
