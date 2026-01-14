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

  // 获取 API Key（在边缘函数中可以直接使用环境变量，不需要 VITE_ 前缀）
  const apiKey = process.env.VITE_API_KEY || process.env.API_KEY;
  
  if (!apiKey) {
    return response.status(500).json({ 
      error: 'API Key 未配置。请在 Vercel 环境变量中设置 VITE_API_KEY 或 API_KEY。' 
    });
  }

  try {
    const { 
      model = 'gemini-3-flash-preview',
      contents,
      config = {}
    } = request.body;

    if (!contents) {
      return response.status(400).json({ error: '缺少 contents 参数' });
    }

    // 构建 Gemini API 请求体
    const requestBody: any = {
      contents,
    };

    // 处理 systemInstruction - 如果是字符串，转换为 Content 格式
    if (config.systemInstruction) {
      if (typeof config.systemInstruction === 'string') {
        requestBody.systemInstruction = {
          parts: [{ text: config.systemInstruction }]
        };
      } else {
        requestBody.systemInstruction = config.systemInstruction;
      }
    }

    // 处理 generationConfig - temperature 等参数应该在这里
    const generationConfig: any = {};
    if (config.temperature !== undefined) {
      generationConfig.temperature = config.temperature;
    }
    if (config.topP !== undefined) {
      generationConfig.topP = config.topP;
    }
    if (config.topK !== undefined) {
      generationConfig.topK = config.topK;
    }
    if (config.maxOutputTokens !== undefined) {
      generationConfig.maxOutputTokens = config.maxOutputTokens;
    }
    if (Object.keys(generationConfig).length > 0) {
      requestBody.generationConfig = generationConfig;
    }

    // 处理 tools
    if (config.tools) {
      requestBody.tools = config.tools;
    }

    // 处理 responseMimeType 和 responseSchema
    if (config.responseMimeType) {
      requestBody.responseMimeType = config.responseMimeType;
    }
    if (config.responseSchema) {
      requestBody.responseSchema = config.responseSchema;
    }

    // 处理 thinkingConfig
    if (config.thinkingConfig) {
      requestBody.thinkingConfig = config.thinkingConfig;
    }

    // 调用 Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error('Gemini API Error:', errorData);
      
      // 处理不同的错误状态码
      if (geminiResponse.status === 401) {
        return response.status(401).json({ 
          error: 'API Key 无效。请检查 Vercel 环境变量中的 API Key 是否正确。' 
        });
      }
      if (geminiResponse.status === 403) {
        return response.status(403).json({ 
          error: 'API Key 权限不足或被限制。请检查 Google Cloud Console 中的 API Key 设置。' 
        });
      }
      if (geminiResponse.status === 429) {
        return response.status(429).json({ 
          error: 'API 调用次数已达上限。请稍后再试或检查 API 配额。' 
        });
      }
      
      return response.status(geminiResponse.status).json({ 
        error: `Gemini API 错误: ${errorData}` 
      });
    }

    const data = await geminiResponse.json();
    
    // 返回 Gemini API 的响应
    return response.status(200).json(data);

  } catch (error) {
    console.error('Edge Function Error:', error);
    return response.status(500).json({ 
      error: error instanceof Error ? error.message : '服务器内部错误' 
    });
  }
}
