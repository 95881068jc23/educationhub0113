/**
 * 文件存储服务
 * 使用 Supabase Storage 存储用户文件（录音、图片等）
 */

interface UploadFileParams {
  userId: string;
  fileType: 'audio' | 'image' | 'document';
  fileName: string;
  fileData: string | Blob | File; // Base64 字符串、Blob 或 File 对象
}

interface UploadFileResponse {
  success: boolean;
  filePath?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
}

/**
 * 上传文件到 Supabase Storage
 */
export async function uploadFile({
  userId,
  fileType,
  fileName,
  fileData,
}: UploadFileParams): Promise<UploadFileResponse> {
  try {
    // 将文件转换为 Base64
    let base64Data: string;
    
    if (typeof fileData === 'string') {
      // 如果已经是 Base64 字符串
      base64Data = fileData;
    } else if (fileData instanceof Blob || (typeof File !== 'undefined' && (fileData as any) instanceof File)) {
      // 如果是 Blob 或 File 对象，转换为 Base64
      base64Data = await blobToBase64(fileData as Blob);
    } else {
      throw new Error('不支持的文件数据类型');
    }

    // 调用上传 API
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        fileType,
        fileName,
        fileData: base64Data,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: '上传失败' }));
      throw new Error(errorData.error || `上传失败: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      filePath: data.filePath,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
    };
  } catch (error) {
    console.error('文件上传失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

/**
 * 将 Blob 转换为 Base64 字符串
 */
function blobToBase64(blob: Blob | File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * 记录操作日志
 */
export async function logUserAction(
  userId: string,
  actionType: string,
  actionDetails?: Record<string, any>
): Promise<void> {
  try {
    await fetch('/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        actionType,
        actionDetails,
        userAgent: navigator.userAgent,
      }),
    });
  } catch (error) {
    // 日志记录失败不应该影响主流程，只记录错误
    console.error('记录操作日志失败:', error);
  }
}

/**
 * 获取用户的操作日志
 */
export async function getUserLogs(
  userId?: string,
  actionType?: string,
  limit: number = 100
): Promise<any[]> {
  try {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (actionType) params.append('actionType', actionType);
    params.append('limit', limit.toString());

    const response = await fetch(`/api/logs?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`获取日志失败: ${response.status}`);
    }

    const data = await response.json();
    return data.logs || [];
  } catch (error) {
    console.error('获取操作日志失败:', error);
    return [];
  }
}

/**
 * 用户文件接口定义
 */
export interface UserFile {
  id: string;
  user_id: string;
  file_name: string;
  file_type: 'audio' | 'image' | 'document';
  file_path: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  updated_at: string;
}

/**
 * 获取用户文件列表
 */
export async function getUserFiles(
  userId?: string,
  fileType?: 'audio' | 'image' | 'document'
): Promise<UserFile[]> {
  try {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (fileType) params.append('fileType', fileType);

    const response = await fetch(`/api/files?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`获取文件列表失败: ${response.status}`);
    }

    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('获取文件列表失败:', error);
    return [];
  }
}

/**
 * 删除用户文件
 */
export async function deleteUserFile(fileId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/files?id=${fileId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: '删除失败' }));
      throw new Error(errorData.error || `删除文件失败: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('删除文件失败:', error);
    throw error;
  }
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
