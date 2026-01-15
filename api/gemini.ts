import type { VercelRequest, VercelResponse } from '@vercel/node';

// 在 Node.js 环境中，Buffer 是全局可用的
declare const Buffer: {
  from(data: ArrayBuffer): { toString(encoding: 'base64'): string };
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

    // 规范化 contents 格式
    // 支持多种输入格式：
    // 1. [{ role: "user", parts: [...] }] - 正确格式
    // 2. [{ text: "..." }] - 需要转换
    // 3. { parts: [...] } - 需要转换
    // 4. "string" - 需要转换
    let normalizedContents: any[];
    
    if (typeof contents === 'string') {
      // 字符串格式：转换为标准格式
      normalizedContents = [{
        role: 'user',
        parts: [{ text: contents }]
      }];
    } else if (Array.isArray(contents)) {
      // 数组格式：检查每个元素，并处理 fileData.fileUri
      normalizedContents = await Promise.all(contents.map(async (item: any) => {
        if (item.role && item.parts) {
          // 已经是正确格式，但需要处理 parts 中的 fileData
          const processedParts = await Promise.all(item.parts.map(async (part: any) => {
            // 检查是否是 fileData 格式（包含 fileUri）
            if (part.fileData && part.fileData.fileUri) {
              try {
                // 从 Supabase Storage URL 下载文件
                const fileResponse = await fetch(part.fileData.fileUri);
                if (!fileResponse.ok) {
                  throw new Error(`下载文件失败: ${fileResponse.status}`);
                }
                const fileBlob = await fileResponse.blob();
                const fileBuffer = Buffer.from(await fileBlob.arrayBuffer());
                const base64Data = fileBuffer.toString('base64');
                
                // 检测 MIME 类型
                const mimeType = part.fileData.mimeType || fileBlob.type || 'audio/wav';
                
                return {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                  }
                };
              } catch (error) {
                console.error('处理文件 URL 失败:', error);
                throw new Error(`无法从 URL 下载文件: ${error instanceof Error ? error.message : '未知错误'}`);
              }
            }
            return part;
          }));
          return {
            role: item.role,
            parts: processedParts
          };
        } else if (item.text) {
          // { text: "..." } 格式
          return {
            role: 'user',
            parts: [{ text: item.text }]
          };
        } else if (item.parts) {
          // { parts: [...] } 格式，需要处理 fileData
          const processedParts = await Promise.all(item.parts.map(async (part: any) => {
            if (part.fileData && part.fileData.fileUri) {
              try {
                const fileResponse = await fetch(part.fileData.fileUri);
                if (!fileResponse.ok) {
                  throw new Error(`下载文件失败: ${fileResponse.status}`);
                }
                const fileBlob = await fileResponse.blob();
                const fileBuffer = Buffer.from(await fileBlob.arrayBuffer());
                const base64Data = fileBuffer.toString('base64');
                const mimeType = part.fileData.mimeType || fileBlob.type || 'audio/wav';
                
                return {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                  }
                };
              } catch (error) {
                console.error('处理文件 URL 失败:', error);
                throw new Error(`无法从 URL 下载文件: ${error instanceof Error ? error.message : '未知错误'}`);
              }
            }
            return part;
          }));
          return {
            role: 'user',
            parts: processedParts
          };
        } else {
          // 未知格式，尝试作为 parts
          return {
            role: 'user',
            parts: Array.isArray(item) ? item : [item]
          };
        }
      }));
    } else if (contents.parts) {
      // 对象格式：{ parts: [...] }，需要处理 fileData
      const processedParts = await Promise.all(contents.parts.map(async (part: any) => {
        if (part.fileData && part.fileData.fileUri) {
          try {
            const fileResponse = await fetch(part.fileData.fileUri);
            if (!fileResponse.ok) {
              throw new Error(`下载文件失败: ${fileResponse.status}`);
            }
            const fileBlob = await fileResponse.blob();
            const fileBuffer = Buffer.from(await fileBlob.arrayBuffer());
            const base64Data = fileBuffer.toString('base64');
            const mimeType = part.fileData.mimeType || fileBlob.type || 'audio/wav';
            
            return {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            };
          } catch (error) {
            console.error('处理文件 URL 失败:', error);
            throw new Error(`无法从 URL 下载文件: ${error instanceof Error ? error.message : '未知错误'}`);
          }
        }
        return part;
      }));
      normalizedContents = [{
        role: 'user',
        parts: processedParts
      }];
    } else {
      // 其他格式，尝试直接使用
      normalizedContents = [{
        role: 'user',
        parts: [contents]
      }];
    }

    // 构建 Gemini API 请求体
    const requestBody: any = {
      contents: normalizedContents,
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

    // 处理 generationConfig - temperature、responseMimeType、responseSchema 等参数应该在这里
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
    // responseMimeType 和 responseSchema 必须在 generationConfig 中
    if (config.responseMimeType) {
      generationConfig.responseMimeType = config.responseMimeType;
    }
    if (config.responseSchema) {
      generationConfig.responseSchema = config.responseSchema;
    }
    if (Object.keys(generationConfig).length > 0) {
      requestBody.generationConfig = generationConfig;
    }

    // 处理 tools
    if (config.tools) {
      requestBody.tools = config.tools;
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
