/**
 * Gemini API 代理服务
 * 通过 Vercel 边缘函数调用 Gemini API，解决中国大陆访问问题
 */

interface GeminiGenerateContentRequest {
  model?: string;
  contents: any;
  config?: {
    systemInstruction?: string;
    tools?: any;
    temperature?: number;
    responseMimeType?: string;
    responseSchema?: any;
    thinkingConfig?: any;
  };
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    groundingMetadata?: {
      groundingChunks?: Array<{
        web?: {
          uri?: string;
          title?: string;
        };
      }>;
    };
  }>;
  text?: string;
}

/**
 * 通过边缘函数调用 Gemini API
 */
export async function callGeminiAPI(request: GeminiGenerateContentRequest): Promise<GeminiResponse> {
  const apiUrl = '/api/gemini';
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.model || 'gemini-3-flash-preview',
        contents: request.contents,
        config: request.config || {},
      }),
    });

    if (!response.ok) {
      // 对于 413 错误，提供更详细的错误信息
      if (response.status === 413) {
        throw new Error('413 Payload Too Large: 文件太大，即使使用 Supabase Storage 也无法处理。请尝试压缩文件或使用更小的文件。');
      }
      
      // 尝试解析错误响应
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // 如果无法解析 JSON，尝试读取文本
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        } catch (textError) {
          // 如果都失败了，使用默认错误信息
          console.error('无法解析错误响应:', textError);
        }
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // 转换响应格式以匹配 @google/genai 的响应格式
    const firstCandidate = data.candidates?.[0];
    const text = firstCandidate?.content?.parts?.[0]?.text || '';
    
    return {
      ...data,
      text,
      candidates: data.candidates || [],
    };
  } catch (error) {
    console.error('Gemini Proxy Error:', error);
    
    // 提供更友好的错误信息
    if (error instanceof Error) {
      if (error.message.includes('API Key')) {
        throw new Error('API Key 未配置。请在 Vercel 环境变量中设置 VITE_API_KEY，然后重新部署应用。');
      }
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        throw new Error('API Key 无效。请检查 Vercel 环境变量中的 VITE_API_KEY 是否正确。');
      }
      if (error.message.includes('403') || error.message.includes('forbidden')) {
        throw new Error('API Key 权限不足或被限制。请检查 Google Cloud Console 中的 API Key 设置。');
      }
      if (error.message.includes('429') || error.message.includes('quota')) {
        throw new Error('API 调用次数已达上限。请稍后再试或检查 API 配额。');
      }
      if (error.message.includes('413') || error.message.includes('Payload Too Large') || error.message.includes('too large')) {
        throw new Error('文件太大，无法处理。请尝试压缩文件或使用更小的文件（建议小于 50MB）。');
      }
    }
    
    throw error;
  }
}

/**
 * 兼容 @google/genai 的 GenerateContentResponse 接口
 */
export interface GenerateContentResponse {
  text?: string;
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    groundingMetadata?: {
      groundingChunks?: Array<{
        web?: {
          uri?: string;
          title?: string;
        };
      }>;
    };
  }>;
}

