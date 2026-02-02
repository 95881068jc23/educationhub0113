/**
 * Gemini API 代理服务
 * 通过 Vercel 边缘函数调用 Gemini API，解决中国大陆访问问题
 */

import { logUserAction } from './storageService';

const CURRENT_USER_KEY = 'marvel_education_current_user';

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
  
  let retryCount = 0;
  const maxRetries = 2; // Client-side proxy level retries
  
  const executeRequest = async (): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s Timeout

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model || 'gemini-3-flash-preview',
          contents: request.contents,
          config: request.config || {},
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  let response: Response;
  
  while (true) {
    try {
      response = await executeRequest();
      
      // If rate limited at proxy level (429) or Gateway Timeout (504), wait and retry
      if ((response.status === 429 || response.status === 504) && retryCount < maxRetries) {
        retryCount++;
        // Exponential backoff: 2s, 4s
        const waitTime = 2000 * retryCount;
        const errorType = response.status === 429 ? 'Rate limit' : 'Gateway Timeout';
        console.warn(`Gemini Proxy ${errorType} (${response.status}). Retrying in ${waitTime}ms... (Attempt ${retryCount}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      break;
    } catch (fetchError) {
      if (retryCount < maxRetries) {
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      throw fetchError;
    }
  }

  try {
    if (!response.ok) {
      // 对于 413 错误，提供更详细的错误信息
      if (response.status === 413) {
        throw new Error('413 Payload Too Large: 文件太大，即使使用 Supabase Storage 也无法处理。请尝试压缩文件或使用更小的文件。');
      }
      
      // 尝试解析错误响应
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        // 先读取文本，避免 "body stream already read" 错误
        const errorText = await response.text();
        
        try {
          // 尝试解析 JSON
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (jsonError) {
          // 如果不是 JSON，直接使用文本
          if (errorText) {
            errorMessage = errorText;
          }
        }
      } catch (readError) {
        console.error('无法读取错误响应:', readError);
      }
      
      throw new Error(errorMessage);
    }

    // Handle SSE Streaming Response
    if (response.headers.get('Content-Type')?.includes('text/event-stream')) {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let candidates: any[] = [];
      let buffer = '';

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // 将新数据追加到缓冲区
        buffer += decoder.decode(value, { stream: true });
        
        // 按换行符分割
        const lines = buffer.split('\n');
        
        // 保留最后一行（可能是不完整的），等待下一次数据拼接
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.substring(6).trim();
            if (jsonStr === '[DONE]') continue;
            
            try {
              const data = JSON.parse(jsonStr);
              // Extract text from candidates
              const textChunk = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
              fullText += textChunk;
              
              // Keep track of candidates for metadata (e.g. citations)
              if (data.candidates) {
                // Merge candidates or keep the latest one
                candidates = data.candidates; 
              }
            } catch (e) {
              console.warn('Error parsing SSE chunk:', e);
            }
          }
        }
      }

      // Log success after streaming completes
      try {
        const storedUser = localStorage.getItem(CURRENT_USER_KEY);
        if (storedUser) {
          const user = JSON.parse(storedUser);
          if (user && user.id) {
            const contentSummary = JSON.stringify(request.contents).substring(0, 200);
            logUserAction(user.id, 'ai_service_usage', {
              service: 'gemini',
              model: request.model || 'gemini-3-flash-preview',
              input_summary: contentSummary,
              output_length: fullText.length,
              status: 'success'
            });
          }
        }
      } catch (logError) {
        console.error('Failed to log AI usage:', logError);
      }

      // Clean Markdown code blocks and extract JSON if response is expected to be JSON
      let cleanedText = fullText;
      
      if (request.config?.responseMimeType === 'application/json') {
        // Find the first '{' and the last '}' to extract the JSON object
        // This handles cases where the model includes "Thinking Process" or other text before/after the JSON
        const firstOpen = fullText.indexOf('{');
        const lastClose = fullText.lastIndexOf('}');
        
        if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
          cleanedText = fullText.substring(firstOpen, lastClose + 1);
        } else {
          // Fallback cleanup if no clear JSON object is found
          cleanedText = fullText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
        }
      } else if (fullText.trim().startsWith('```')) {
        cleanedText = fullText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
      }

      return {
        text: cleanedText,
        candidates: candidates
      };
    }

    // Fallback for non-streaming responses (legacy behavior)
    const data = await response.json();
    
    // 转换响应格式以匹配 @google/genai 的响应格式
    const firstCandidate = data.candidates?.[0];
    let text = firstCandidate?.content?.parts?.[0]?.text || '';

    // Clean Markdown code blocks and extract JSON if response is expected to be JSON
    if (request.config?.responseMimeType === 'application/json') {
      const firstOpen = text.indexOf('{');
      const lastClose = text.lastIndexOf('}');
      
      if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
        text = text.substring(firstOpen, lastClose + 1);
      } else {
        text = text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
      }
    } else if (text.trim().startsWith('```')) {
      text = text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
    }
    
    // 记录 AI 调用日志
    try {
      const storedUser = localStorage.getItem(CURRENT_USER_KEY);
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user && user.id) {
          // 简化的内容摘要，避免日志过大
          const contentSummary = JSON.stringify(request.contents).substring(0, 200);
          
          logUserAction(user.id, 'ai_service_usage', {
            service: 'gemini',
            model: request.model || 'gemini-3-flash-preview',
            input_summary: contentSummary,
            output_length: text.length,
            status: 'success'
          });
        }
      }
    } catch (logError) {
      console.error('Failed to log AI usage:', logError);
    }

    return {
      ...data,
      text,
      candidates: data.candidates || [],
    };
  } catch (error) {
    console.error('Gemini Proxy Error:', error);
    
    // 记录失败日志
    try {
      const storedUser = localStorage.getItem(CURRENT_USER_KEY);
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user && user.id) {
          logUserAction(user.id, 'ai_service_usage', {
            service: 'gemini',
            model: request.model || 'gemini-3-flash-preview',
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    } catch (logError) {
      console.error('Failed to log AI usage failure:', logError);
    }
    
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

