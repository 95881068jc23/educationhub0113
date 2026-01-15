# Supabase Storage 配置指南

## ✅ 已完成的工作

1. ✅ 创建了操作日志表 SQL (`supabase-logs-schema.sql`)
2. ✅ 创建了文件上传 API (`api/upload.ts`)
3. ✅ 创建了操作日志 API (`api/logs.ts`)
4. ✅ 创建了文件存储服务工具 (`src/services/storageService.ts`)

## 📋 配置步骤

### 步骤 1：创建操作日志表

1. 在 Supabase Dashboard 中，进入 **SQL Editor**
2. 复制 `supabase-logs-schema.sql` 文件中的所有内容
3. 粘贴到 SQL Editor 并执行

### 步骤 2：创建 Storage Bucket

1. 在 Supabase Dashboard 中，点击左侧菜单的 **Storage**
2. 点击 **New bucket**
3. 填写信息：
   - **Name**: `user-files`
   - **Public bucket**: ✅ 勾选（允许公开访问文件）
4. 点击 **Create bucket**

### 步骤 3：配置 Storage 权限

1. 在 Storage 页面，点击 `user-files` bucket
2. 进入 **Policies** 标签页
3. 点击 **New Policy**
4. 选择 **For full customization**
5. 创建以下策略：

   **策略 1：允许用户上传文件**
   ```sql
   CREATE POLICY "Allow authenticated upload"
   ON storage.objects FOR INSERT
   WITH CHECK (bucket_id = 'user-files');
   ```

   **策略 2：允许所有人读取文件**
   ```sql
   CREATE POLICY "Allow public read"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'user-files');
   ```

   **策略 3：允许用户删除自己的文件**
   ```sql
   CREATE POLICY "Allow users delete own files"
   ON storage.objects FOR DELETE
   USING (bucket_id = 'user-files' AND (storage.foldername(name))[1] = auth.uid()::text);
   ```

### 步骤 4：重新部署

1. 推送代码到 GitHub
2. Vercel 会自动部署
3. 或手动触发部署

## 🧪 验证配置

### 测试文件上传

部署完成后，可以测试：

1. **上传录音文件**：在聊天界面录制音频并发送
2. **查看文件**：检查 Supabase Storage 中是否有文件
3. **查看日志**：检查 `user_logs` 表中是否有记录

## 📊 Supabase Storage 免费额度

Supabase Storage 免费计划包括：
- **1 GB 存储空间**
- **2 GB 带宽/月**
- **无限文件数量**

对于 100 位用户：
- 假设每个录音文件 1-5 MB
- 1 GB 可以存储约 200-1000 个录音文件
- 足够使用

## 🔍 故障排查

### 问题：文件上传失败

**检查清单**：
1. ✅ Storage Bucket `user-files` 是否已创建？
2. ✅ Storage 权限策略是否已配置？
3. ✅ 环境变量 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY` 是否正确？
4. ✅ 是否重新部署了应用？

### 问题：操作日志无法记录

**检查清单**：
1. ✅ `user_logs` 表是否已创建？
2. ✅ RLS 策略是否已配置？
3. ✅ API 路由是否正常工作？

## 📝 使用示例

### 上传录音文件

```typescript
import { uploadFile } from '@/services/storageService';
import { useAuth } from '@/contexts/AuthContext';

const { user } = useAuth();

// 上传录音
const audioBlob = new Blob([audioData], { type: 'audio/webm' });
const result = await uploadFile({
  userId: user!.id,
  fileType: 'audio',
  fileName: 'recording.webm',
  fileData: audioBlob,
});

if (result.success) {
  console.log('文件上传成功:', result.fileUrl);
}
```

### 记录操作日志

```typescript
import { logUserAction } from '@/services/storageService';

// 记录登录
await logUserAction(userId, 'login', {
  timestamp: new Date().toISOString(),
});

// 记录上传文件
await logUserAction(userId, 'upload_audio', {
  fileName: 'recording.webm',
  fileSize: 1024000,
  fileUrl: result.fileUrl,
});
```

## 🎉 完成！

配置完成后，你的应用将拥有：
- ✅ 文件存储功能（录音、图片等）
- ✅ 操作日志记录功能
- ✅ 适合 100+ 用户的生产级存储方案
- ✅ 免费额度充足

如有任何问题，请查看 Supabase 官方文档或联系支持。
