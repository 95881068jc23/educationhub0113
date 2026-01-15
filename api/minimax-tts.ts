import type { VercelRequest, VercelResponse } from '@vercel/node';

// 在 Node.js 环境中，Buffer 是全局可用的
declare const Buffer: {
  from(data: string, encoding: 'base64'): { toString(encoding: 'utf-8'): string };
};

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

  // 获取 MiniMax API Key
  const apiKey = process.env.MINIMAX_API_KEY;
  
  if (!apiKey) {
    return response.status(500).json({ 
      error: 'MiniMax API Key 未配置。请在 Vercel 环境变量中设置 MINIMAX_API_KEY。' 
    });
  }

  try {
    const {
      text,
      model = 'speech-2.6-hd',
      voiceId = 'male-qn-qingse',
      speed = 1.0,
      vol = 1.0,
      pitch = 0,
      format = 'mp3',
      sampleRate = 32000,
    } = request.body;

    if (!text || typeof text !== 'string') {
      return response.status(400).json({ error: '缺少 text 参数或格式不正确' });
    }

    // 检查文本长度（MiniMax 限制 10,000 字符）
    if (text.length > 10000) {
      return response.status(400).json({ error: '文本长度超过 10,000 字符限制' });
    }

    // 调用 MiniMax TTS API（HTTP 同步接口）
    const minimaxUrl = 'https://api.minimaxi.com/v1/t2a_v2';
    
    const requestBody = {
      model: model,
      voice_setting: {
        voice_id: voiceId,
        speed: Math.max(0.5, Math.min(2.0, speed)), // 限制在 0.5-2.0 范围
        vol: Math.max(0.1, Math.min(5.0, vol)), // 限制在 0.1-5.0 范围
        pitch: Math.max(-12, Math.min(12, pitch)), // 限制在 -12-12 范围
        english_normalization: false, // 是否启用英文标准化
      },
      audio_setting: {
        sample_rate: sampleRate,
        bitrate: 128000, // 比特率
        format: format,
        channel: 1, // 单声道
      },
      text: text,
    };

    const minimaxResponse = await fetch(minimaxUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!minimaxResponse.ok) {
      const errorText = await minimaxResponse.text();
      console.error('MiniMax TTS API Error:', errorText);
      
      if (minimaxResponse.status === 401) {
        return response.status(401).json({ 
          error: 'MiniMax API Key 无效。请检查 Vercel 环境变量中的 API Key 是否正确。' 
        });
      }
      if (minimaxResponse.status === 429) {
        return response.status(429).json({ 
          error: 'API 调用次数已达上限。请稍后再试或检查 API 配额。' 
        });
      }
      
      return response.status(minimaxResponse.status).json({ 
        error: `MiniMax TTS API 错误: ${errorText}` 
      });
    }

    // MiniMax 返回的音频数据
    const audioData = await minimaxResponse.json();
    
    // 检查响应格式（根据 MiniMax API 文档，响应可能包含 audio 字段或直接是 Base64）
    let audioBase64: string;
    
    if (audioData.audio && audioData.audio.data) {
      // 格式：{ audio: { data: "base64..." } }
      audioBase64 = audioData.audio.data;
    } else if (audioData.data) {
      // 格式：{ data: "base64..." }
      audioBase64 = audioData.data;
    } else if (typeof audioData === 'string') {
      // 直接返回 Base64 字符串
      audioBase64 = audioData;
    } else {
      console.error('MiniMax API 响应格式:', JSON.stringify(audioData));
      return response.status(500).json({ 
        error: 'MiniMax API 返回格式不正确，请检查 API 响应' 
      });
    }

    // 返回 Base64 编码的音频数据
    return response.status(200).json({
      audioBase64: audioBase64,
      format: format,
      sampleRate: sampleRate,
    });

  } catch (error) {
    console.error('MiniMax TTS Edge Function Error:', error);
    return response.status(500).json({ 
      error: error instanceof Error ? error.message : '服务器内部错误' 
    });
  }
}
