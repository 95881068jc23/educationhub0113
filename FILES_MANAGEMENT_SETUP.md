# 文件管理功能设置指南

## 概述

已实现完整的文件管理功能，包括：
- 文件上传时自动保存元数据到数据库
- 管理后台查看用户文件列表
- 文件下载和删除功能
- 按文件类型筛选（音频、图片、文档）
- 音频文件在线播放、图片文件预览

## 数据库设置

### 1. 执行 SQL 创建表

在 Supabase Dashboard 的 SQL Editor 中执行 `supabase-files-schema.sql`：

```sql
-- 此文件已创建，包含完整的 user_files 表结构
```

### 2. 验证表创建

执行以下查询验证表是否创建成功：

```sql
SELECT * FROM user_files LIMIT 1;
```

## 功能说明

### 文件上传

- 文件上传到 Supabase Storage（`user-files` bucket）
- 文件元数据自动保存到 `user_files` 表
- 支持的文件类型：`audio`、`image`、`document`

### 管理后台文件管理

1. **查看文件列表**
   - 在用户列表的操作列中点击"文件"按钮
   - 显示该用户的所有文件
   - 支持按类型筛选（全部、音频、图片、文档）

2. **文件预览**
   - 音频文件：可直接在列表中播放
   - 图片文件：显示缩略图预览
   - 文档文件：显示文件图标和基本信息

3. **文件下载**
   - 点击下载按钮即可下载文件
   - 文件从 Supabase Storage 直接下载

4. **文件删除**
   - 点击删除按钮可删除文件
   - 同时删除 Storage 中的文件和数据库中的记录

### API 端点

#### GET /api/files
获取文件列表

**查询参数：**
- `userId` (可选): 用户ID，筛选特定用户的文件
- `fileType` (可选): 文件类型，`audio` | `image` | `document`

**响应：**
```json
{
  "files": [
    {
      "id": "uuid",
      "user_id": "user123",
      "file_name": "recording.wav",
      "file_type": "audio",
      "file_path": "user123/audio/1234567890-recording.wav",
      "file_url": "https://...",
      "file_size": 1024000,
      "mime_type": "audio/wav",
      "created_at": "2026-01-15T...",
      "updated_at": "2026-01-15T..."
    }
  ]
}
```

#### DELETE /api/files
删除文件

**查询参数：**
- `id`: 文件ID（必填）

**响应：**
```json
{
  "success": true
}
```

## 前端服务

### storageService.ts

新增方法：

- `getUserFiles(userId?, fileType?): Promise<UserFile[]>` - 获取文件列表
- `deleteUserFile(fileId): Promise<boolean>` - 删除文件
- `formatFileSize(bytes): string` - 格式化文件大小

### AdminPanel.tsx

新增功能：

- 文件列表模态框
- 文件类型筛选
- 文件下载和删除
- 音频播放和图片预览

## 注意事项

1. **Supabase Storage 权限**
   - 确保 `user-files` bucket 存在
   - 确保 RLS 策略允许公开访问（或使用签名 URL）
   - 如果文件无法访问，检查 Storage 的 Public 设置

2. **文件大小限制**
   - Supabase Storage 单文件最大 50MB（免费版）
   - 如果需要上传更大的文件，考虑升级 Supabase 计划

3. **文件安全**
   - 当前实现允许所有人读取文件（通过 public URL）
   - 如果需要更严格的权限控制，可以使用签名 URL 或调整 RLS 策略

## 下一步优化（可选）

1. **Gemini File API 集成**
   - 对于大于 4.5MB 的文件，可以使用 Gemini File API 上传
   - 这样可以支持最大 2GB 的文件分析
   - 实现代码已准备好，但需要测试 Gemini File API 的 resumable upload

2. **文件搜索**
   - 在文件列表中添加搜索功能
   - 按文件名、日期范围筛选

3. **批量操作**
   - 支持批量删除文件
   - 支持批量下载（打包为 ZIP）

4. **文件统计**
   - 显示用户总文件数
   - 显示文件总大小
   - 按类型统计
