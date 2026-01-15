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
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: '只支持 POST 请求' });
  }

  try {
    const supabase = getSupabaseClient();
    const { userId, fileType, fileName, fileData } = request.body as {
      userId: string;
      fileType: 'audio' | 'image' | 'document';
      fileName: string;
      fileData: string; // Base64 编码的文件数据
    };

    if (!userId || !fileType || !fileName || !fileData) {
      return response.status(400).json({ error: '缺少必需参数：userId, fileType, fileName, fileData' });
    }

    // 验证文件类型
    const allowedTypes = ['audio', 'image', 'document'];
    if (!allowedTypes.includes(fileType)) {
      return response.status(400).json({ error: `不支持的文件类型：${fileType}` });
    }

    // 将 Base64 数据转换为 Buffer
    const base64Data = fileData.replace(/^data:.*,/, ''); // 移除 data URL 前缀
    const fileBuffer = Buffer.from(base64Data, 'base64');

    // 生成文件路径：{userId}/{fileType}/{timestamp}-{fileName}
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${userId}/${fileType}/${timestamp}-${sanitizedFileName}`;

    // 上传文件到 Supabase Storage
    const bucketName = 'user-files'; // 需要在 Supabase Dashboard 中创建这个 bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType: getContentType(fileName),
        upsert: false, // 不允许覆盖
      });

    if (uploadError) {
      console.error('文件上传失败:', uploadError);
      return response.status(500).json({ 
        error: '文件上传失败',
        message: uploadError.message 
      });
    }

    // 获取文件的公共 URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return response.status(200).json({
      success: true,
      filePath: uploadData.path,
      fileUrl: urlData.publicUrl,
      fileName: sanitizedFileName,
      fileSize: fileBuffer.length,
    });
  } catch (error) {
    console.error('Upload API Error:', error);
    return response.status(500).json({ 
      error: '服务器错误',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
}

// 根据文件名获取 Content-Type
function getContentType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const contentTypes: Record<string, string> = {
    // 音频
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'm4a': 'audio/mp4',
    'webm': 'audio/webm',
    'ogg': 'audio/ogg',
    // 图片
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    // 文档
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
  return contentTypes[ext || ''] || 'application/octet-stream';
}
