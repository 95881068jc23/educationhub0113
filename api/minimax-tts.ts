
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // 设置 CORS 头
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理 OPTIONS 预检请求
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  // 只允许 POST 请求
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  // 获取 API Key (优先使用 GOOGLE_API_KEY，也兼容 MINIMAX_API_KEY 作为备用)
  // n1n.ai 通常使用同一个 Key 访问所有模型
  const apiKey = process.env.GOOGLE_API_KEY || process.env.VITE_API_KEY || process.env.MINIMAX_API_KEY;
  
  if (!apiKey) {
    return response.status(500).json({ 
      error: 'API Key 未配置。请在 Vercel 环境变量中设置 GOOGLE_API_KEY 或 VITE_API_KEY。' 
    });
  }

  try {
    const {
      text,
      model = 'tts-1', // OpenAI TTS model
      voiceId = 'alloy', // OpenAI voice: alloy, echo, fable, onyx, nova, shimmer
      speed = 1.0,
    } = request.body;

    if (!text || typeof text !== 'string') {
      return response.status(400).json({ error: '缺少 text 参数或格式不正确' });
    }

    // n1n.ai TTS endpoint (OpenAI compatible)
    // IMPORTANT: This API mimics OpenAI's TTS interface but routes through n1n.ai
    // User requested to change version to /v1
    const ttsUrl = 'https://api.n1n.ai/v1/audio/speech';
    
    // Construct OpenAI compatible request body
    const requestBody = {
      model: model,
      input: text,
      voice: voiceId, // OpenAI voices
      speed: Math.max(0.25, Math.min(4.0, speed)), // OpenAI range 0.25 to 4.0
    };

    const ttsResponse = await fetch(ttsUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('TTS API Error:', errorText);
      
      return response.status(ttsResponse.status).json({ 
        error: `TTS API 错误: ${errorText}` 
      });
    }

    // OpenAI TTS returns binary audio data (MP3 by default)
    const audioBuffer = await ttsResponse.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    // Return Base64 encoded audio data
    return response.status(200).json({
      audioBase64: audioBase64,
      format: 'mp3',
      sampleRate: 24000, // Default for tts-1
    });

  } catch (error) {
    console.error('TTS Edge Function Error:', error);
    return response.status(500).json({ 
      error: error instanceof Error ? error.message : '服务器内部错误' 
    });
  }
}
