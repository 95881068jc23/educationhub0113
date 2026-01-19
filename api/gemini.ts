import type { VercelRequest, VercelResponse } from '@vercel/node';

// 在 Node.js 环境中，Buffer 是全局可用的
// @ts-ignore - Buffer 在 Node.js 环境中全局可用
declare const Buffer: {
  from(data: ArrayBuffer | Uint8Array | string, encoding?: string): any;
};

/**
 * 使用 Gemini File API 上传大文件（支持最大 5GB）
 * 采用 Resumable Upload Protocol
 * 
 * @param fileUrl 文件 URL（Supabase Storage 或其他可访问的 URL）
 * @param apiKey Gemini API Key
 * @param mimeType 文件 MIME 类型
 * @returns Gemini File URI (格式: gs://generativelanguage.googleapis.com/files/...)
 */
async function uploadFileToGemini(
  fileUrl: string,
  apiKey: string,
  mimeType: string
): Promise<string> {
  console.log(`开始使用 Gemini File API 上传文件: ${fileUrl}`);
  
  try {
    // 1. 从 Supabase Storage 下载文件
    const fileResponse = await fetch(fileUrl, {
      method: 'GET',
    });
    
    if (!fileResponse.ok) {
      throw new Error(`下载文件失败: ${fileResponse.status} ${fileResponse.statusText}`);
    }
    
    // 获取文件大小
    const contentLength = fileResponse.headers.get('content-length');
    const fileSize = contentLength ? parseInt(contentLength, 10) : 0;
    
    if (fileSize === 0) {
      throw new Error('无法获取文件大小');
    }
    
    console.log(`文件大小: ${(fileSize / (1024 * 1024)).toFixed(2)}MB`);
    
    // 2. 将文件内容转换为 Buffer（流式读取，避免内存溢出）
    const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());
    
    // 3. 启动 Resumable Upload
    // 第一步：创建上传会话
    const startUploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;
    
    const startResponse = await fetch(startUploadUrl, {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Type': mimeType,
        'X-Goog-Upload-Header-Content-Length': fileSize.toString(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: {
          displayName: `file_${Date.now()}`,
        },
      }),
    });
    
    if (!startResponse.ok) {
      const errorText = await startResponse.text();
      console.error('启动上传失败:', errorText);
      throw new Error(`启动 Gemini File API 上传失败: ${startResponse.status} - ${errorText}`);
    }
    
    // 4. 获取上传 URL
    const uploadUrl = startResponse.headers.get('x-goog-upload-url');
    if (!uploadUrl) {
      throw new Error('未获取到 Gemini File API 的上传 URL');
    }
    
    console.log(`获取到上传 URL，开始上传文件内容...`);
    
    // 5. 上传文件内容
    // 对于大文件，可以分块上传，但这里为了简化，一次性上传
    // Gemini File API 支持一次性上传（如果网络稳定）
    // 将 Buffer 转换为 Uint8Array 以便兼容 fetch API
    const uint8Array = new Uint8Array(fileBuffer);
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'X-Goog-Upload-Offset': '0',
        'X-Goog-Upload-Command': 'upload, finalize',
        'Content-Type': mimeType,
        'Content-Length': fileSize.toString(),
      },
      body: uint8Array,
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('上传文件内容失败:', errorText);
      throw new Error(`上传文件内容到 Gemini File API 失败: ${uploadResponse.status} - ${errorText}`);
    }
    
    // 6. 解析响应，获取 File URI
    const uploadData = await uploadResponse.json();
    
    // Gemini File API 返回的格式可能是：
    // - { file: { uri: "gs://..." } }
    // - { uri: "gs://..." }
    const fileUri = uploadData.file?.uri || uploadData.uri;
    
    if (!fileUri) {
      console.error('上传响应:', JSON.stringify(uploadData, null, 2));
      throw new Error('未从 Gemini File API 响应中获取到文件 URI');
    }
    
    console.log(`文件上传成功，Gemini File URI: ${fileUri}`);
    
    return fileUri; // 格式: gs://generativelanguage.googleapis.com/files/...
    
  } catch (error) {
    console.error('Gemini File API 上传失败:', error);
    throw error;
  }
}

/**
 * 获取文件大小（通过 HEAD 请求）
 */
async function getFileSize(fileUrl: string): Promise<number> {
  try {
    
    const headResponse = await fetch(fileUrl, {
      method: 'HEAD',
    });
    
    
    if (!headResponse.ok) {
      throw new Error(`HEAD 请求失败: ${headResponse.status}`);
    }
    
    const contentLength = headResponse.headers.get('content-length');
    const fileSize = contentLength ? parseInt(contentLength, 10) : 0;
    
    return fileSize;
  } catch (error) {
    
    console.warn('获取文件大小失败:', error);
    return 0;
  }
}

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
              const fileUrl = part.fileData.fileUri;
              const mimeType = part.fileData.mimeType || 'audio/wav';
              
              // 检查是否是 Gemini File URI（gs://格式）
              if (fileUrl.startsWith('gs://')) {
                // 已经是 Gemini File URI，直接使用
                return {
                  fileData: {
                    fileUri: fileUrl,
                    mimeType,
                  }
                };
              }
              
              // 检查 URL 格式（Supabase Storage URL 或公开 URL）
              if (!fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
                throw new Error(`无效的文件 URL 格式: ${fileUrl}`);
              }
              
              // 方案 B：大文件使用 Gemini File API 上传
              // Gemini API 限制：总请求大小（文件+提示+系统指令）超过 20MB 必须使用 Files API
              // 我们保守起见，文件大小超过 4MB 就使用 Gemini File API
              
              const fileSize = await getFileSize(fileUrl);
              const fileSizeMB = fileSize / (1024 * 1024);
              
              
              // 如果文件大小获取失败（返回0），或者文件大于4MB，使用 Gemini File API
              // 即使文件大小未知，也尝试使用 Gemini File API 上传，避免 413 错误
              if (fileSize === 0 || fileSize > 4 * 1024 * 1024) {
                // 文件大小未知或大于 4MB，使用 Gemini File API 上传
                console.log(`文件${fileSize === 0 ? '大小未知' : `较大（${fileSizeMB.toFixed(2)}MB）`}，使用 Gemini File API 上传`);
                try {
                  const geminiFileUri = await uploadFileToGemini(fileUrl, apiKey, mimeType);
                  return {
                    fileData: {
                      fileUri: geminiFileUri,
                      mimeType,
                    }
                  };
                } catch (error) {
                  console.error('Gemini File API 上传失败:', error);
                  // 如果上传失败，且文件大小已知且很小，尝试直接使用 URL
                  if (fileSize > 0 && fileSize <= 4 * 1024 * 1024) {
                    console.log('回退到直接使用 URL（小文件）');
                    return {
                      fileData: {
                        fileUri: fileUrl,
                        mimeType,
                      }
                    };
                  }
                  // 否则抛出错误，不继续处理
                  throw error;
                }
              } else {
                // 小文件（≤4MB）：直接传递 URL 给 Gemini API
                // Gemini API 支持从外部 URL 读取文件（最大 100MB）
                return {
                  fileData: {
                    fileUri: fileUrl,
                    mimeType,
                  }
                };
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
              const fileUrl = part.fileData.fileUri;
              const mimeType = part.fileData.mimeType || 'audio/wav';
              
              // 检查是否是 Gemini File URI（gs://格式）
              if (fileUrl.startsWith('gs://')) {
                return {
                  fileData: {
                    fileUri: fileUrl,
                    mimeType,
                  }
                };
              }
              
              if (!fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
                throw new Error(`无效的文件 URL 格式: ${fileUrl}`);
              }
              
              // 检测文件大小，大文件使用 Gemini File API
              // 如果文件大小获取失败（返回0），或文件大于4MB，使用 Gemini File API
              const fileSize = await getFileSize(fileUrl);
              const fileSizeMB = fileSize / (1024 * 1024);
              
              if (fileSize === 0 || fileSize > 4 * 1024 * 1024) {
                console.log(`文件${fileSize === 0 ? '大小未知' : `较大（${fileSizeMB.toFixed(2)}MB）`}，使用 Gemini File API 上传`);
                try {
                  const geminiFileUri = await uploadFileToGemini(fileUrl, apiKey, mimeType);
                  return {
                    fileData: {
                      fileUri: geminiFileUri,
                      mimeType,
                    }
                  };
                } catch (error) {
                  console.error('Gemini File API 上传失败:', error);
                  // 如果上传失败，且文件大小已知且很小，尝试直接使用 URL
                  if (fileSize > 0 && fileSize <= 4 * 1024 * 1024) {
                    console.log('回退到直接使用 URL（小文件）');
                    return {
                      fileData: {
                        fileUri: fileUrl,
                        mimeType,
                      }
                    };
                  }
                  throw error;
                }
              } else {
                return {
                  fileData: {
                    fileUri: fileUrl,
                    mimeType,
                  }
                };
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
          const fileUrl = part.fileData.fileUri;
          const mimeType = part.fileData.mimeType || 'audio/wav';
          
          // 检查是否是 Gemini File URI（gs://格式）
          if (fileUrl.startsWith('gs://')) {
            return {
              fileData: {
                fileUri: fileUrl,
                mimeType,
              }
            };
          }
          
          if (!fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
            throw new Error(`无效的文件 URL 格式: ${fileUrl}`);
          }
          
          // 检测文件大小，大文件使用 Gemini File API
          const fileSize = await getFileSize(fileUrl);
          const fileSizeMB = fileSize / (1024 * 1024);
          
          if (fileSize > 4 * 1024 * 1024) {
            console.log(`文件较大（${fileSizeMB.toFixed(2)}MB），使用 Gemini File API 上传`);
            try {
              const geminiFileUri = await uploadFileToGemini(fileUrl, apiKey, mimeType);
              return {
                fileData: {
                  fileUri: geminiFileUri,
                  mimeType,
                }
              };
            } catch (error) {
              console.error('Gemini File API 上传失败，尝试直接使用 URL:', error);
              return {
                fileData: {
                  fileUri: fileUrl,
                  mimeType,
                }
              };
            }
          } else {
            return {
              fileData: {
                fileUri: fileUrl,
                mimeType,
              }
            };
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
    
    // 记录请求体大小（用于调试）
    const requestBodySize = JSON.stringify(requestBody).length;
    const requestBodySizeMB = requestBodySize / (1024 * 1024);
    if (requestBodySizeMB > 4) {
      console.warn(`警告：请求体大小为 ${requestBodySizeMB.toFixed(2)}MB，接近 Vercel 限制`);
    }
    
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
      if (geminiResponse.status === 400) {
        // 400 错误可能是文件URL格式问题或Gemini无法访问URL
        const errorJson = JSON.parse(errorData).catch(() => null);
        if (errorJson?.error?.message?.includes('file') || errorJson?.error?.message?.includes('URL')) {
          return response.status(400).json({ 
            error: `文件URL访问失败。请确保Supabase Storage文件是公开的，或URL可访问。错误详情: ${errorData}` 
          });
        }
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
