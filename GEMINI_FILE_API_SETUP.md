# Gemini File API 大文件上传功能说明

## 概述

已实现 Gemini File API 的大文件上传功能，支持最大 **5GB** 的文件分析。系统会自动检测文件大小，对于大于 4MB 的文件，使用 Gemini File API 上传；对于小文件，直接传递 URL 给 Gemini API。

## 工作原理

### 1. 文件大小检测

当请求中包含文件 URL 时，系统会：

1. **HEAD 请求**：先发送 HEAD 请求获取文件大小
2. **大小判断**：
   - 如果文件 ≤ 4MB：直接传递 URL 给 Gemini API（快速路径）
   - 如果文件 > 4MB：使用 Gemini File API 上传（支持最大 5GB）

### 2. Gemini File API 上传流程

对于大文件，采用 **Resumable Upload Protocol**：

```
步骤 1: 从 Supabase Storage 下载文件
  ↓
步骤 2: 创建上传会话（获取 upload URL）
  ↓
步骤 3: 上传文件内容（一次性上传或分块上传）
  ↓
步骤 4: 获取 Gemini File URI（gs://格式）
  ↓
步骤 5: 使用 Gemini File URI 进行分析
```

### 3. 文件 URI 格式

系统支持三种文件 URI 格式：

1. **Gemini File URI** (`gs://...`)
   - 格式：`gs://generativelanguage.googleapis.com/files/{fileId}`
   - 直接使用，无需处理

2. **外部 URL** (`http://...` 或 `https://...`)
   - Supabase Storage URL 或其他公开 URL
   - 系统会自动判断是否需要上传到 Gemini File API

3. **Base64 内联数据**（小文件）
   - 小于 4MB 的文件可以直接使用 Base64
   - 但对于 URL 格式，我们优先使用 URL 方式

## 代码实现

### 核心函数

#### `uploadFileToGemini(fileUrl, apiKey, mimeType)`

上传大文件到 Gemini File API。

**参数：**
- `fileUrl`: 文件 URL（Supabase Storage 或其他可访问的 URL）
- `apiKey`: Gemini API Key
- `mimeType`: 文件 MIME 类型（如 `audio/wav`、`audio/mpeg` 等）

**返回：**
- Gemini File URI（格式：`gs://generativelanguage.googleapis.com/files/...`）

**流程：**
1. 从 URL 下载文件到内存（Buffer）
2. 创建 Resumable Upload 会话
3. 上传文件内容
4. 解析响应，获取 File URI

#### `getFileSize(fileUrl)`

通过 HEAD 请求获取文件大小。

**参数：**
- `fileUrl`: 文件 URL

**返回：**
- 文件大小（字节），如果获取失败返回 0

## 使用示例

### 前端调用（无需修改）

前端代码无需修改，继续使用现有的文件上传流程：

```typescript
// 上传文件到 Supabase Storage
const uploadResult = await uploadFile({
  userId: 'user123',
  fileType: 'audio',
  fileName: 'recording.wav',
  fileData: audioBlob,
});

// 使用 fileUrl 发送到 Gemini API
const response = await sendMessageToGemini({
  contents: [{
    role: 'user',
    parts: [{
      fileData: {
        fileUri: uploadResult.fileUrl, // Supabase Storage URL
        mimeType: 'audio/wav',
      }
    }]
  }]
});
```

### 后端自动处理

后端（`api/gemini.ts`）会自动：

1. 检测文件大小（HEAD 请求）
2. 如果 > 4MB，自动上传到 Gemini File API
3. 使用 Gemini File URI 进行分析
4. 如果上传失败，回退到直接使用 URL

## 文件大小限制

| 传输方式 | 最大文件大小 | 说明 |
|---------|------------|------|
| 直接 URL | 100MB | Gemini API 支持从外部 URL 读取 |
| Gemini File API | 5GB | 使用 Resumable Upload |
| Base64 内联 | 4MB | Vercel Edge Function 限制 |

## 优势

1. **自动优化**：系统自动选择最优的传输方式
2. **大文件支持**：支持最大 5GB 的文件分析
3. **错误回退**：如果 Gemini File API 上传失败，自动回退到直接 URL
4. **无感知**：前端代码无需修改，后端自动处理

## 注意事项

### 1. 文件保留期

- Gemini File API 上传的文件保留 **48 小时**
- 48 小时后自动删除
- 如果需要长期存储，文件会保存在 Supabase Storage

### 2. 内存使用

- 大文件会先下载到内存（Buffer），然后上传到 Gemini
- 对于超大文件（> 1GB），可能需要优化为流式传输

### 3. 网络超时

- Vercel Edge Function 有执行时间限制（10秒）
- 对于超大文件上传，可能需要考虑：
  - 前端直接上传到 Gemini File API
  - 使用 Vercel Serverless Function（60秒限制）
  - 分块上传

### 4. API Key 权限

- 确保 Gemini API Key 有 `files.create` 权限
- 检查 Google Cloud Console 中的 API 启用状态

## 调试

### 查看日志

在 Vercel 日志中可以看到：

```
文件大小: 15.23MB
文件较大（15.23MB），使用 Gemini File API 上传
开始使用 Gemini File API 上传文件: https://...
获取到上传 URL，开始上传文件内容...
文件上传成功，Gemini File URI: gs://generativelanguage.googleapis.com/files/...
```

### 常见错误

1. **`启动 Gemini File API 上传失败: 401`**
   - API Key 无效或权限不足
   - 检查 Vercel 环境变量中的 `VITE_API_KEY`

2. **`上传文件内容到 Gemini File API 失败: 413`**
   - 文件太大，超过 5GB 限制
   - 考虑压缩文件或分段上传

3. **`下载文件失败: 403`**
   - Supabase Storage 文件未公开
   - 检查 Storage 的 RLS 策略

## 后续优化（可选）

1. **流式上传**：对于超大文件，实现分块上传
2. **进度追踪**：返回上传进度给前端
3. **缓存 Gemini File URI**：避免重复上传相同文件
4. **批量上传**：支持多个文件同时上传

## 相关文件

- `api/gemini.ts` - Gemini API 代理和文件上传逻辑
- `api/upload.ts` - 文件上传到 Supabase Storage
- `src/services/storageService.ts` - 前端文件服务
- `FILES_MANAGEMENT_SETUP.md` - 文件管理功能说明
