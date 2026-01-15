# Vercel KV 接入完成指南

## ✅ 已完成的工作

1. ✅ 在 `package.json` 中添加了 `@vercel/kv` 依赖
2. ✅ 更新了 `api/users.ts` 使用 Vercel KV 存储
3. ✅ 移除了内存存储，使用持久化 KV 存储

## 📋 接下来需要做的（在 Vercel Dashboard）

### 步骤 1：创建 Vercel KV 数据库

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目：`marvel-education-hub`
3. 进入 **Storage** 标签页
4. 点击 **Create Database**
5. 选择 **KV**（Redis）
6. 输入数据库名称（例如：`marvel-users-kv`）
7. 选择区域（建议选择离用户最近的区域）
8. 点击 **Create**

### 步骤 2：验证环境变量

创建 KV 数据库后，Vercel 会自动添加以下环境变量：
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

这些环境变量会自动注入到你的 Serverless Functions 中，无需手动配置。

### 步骤 3：重新部署

1. 推送代码到 GitHub（如果还没推送）
2. Vercel 会自动检测到新的提交并重新部署
3. 或者手动触发部署：在 Vercel Dashboard 点击 **Deployments** → **Redeploy**

## 🧪 验证 KV 是否正常工作

部署完成后，测试以下功能：

1. **注册新用户**：在设备 A 注册一个新账号
2. **查看管理员后台**：在设备 B 登录管理员账号
3. **验证同步**：应该能看到设备 A 注册的用户

如果看到用户数据，说明 KV 配置成功！

## ⚠️ 注意事项

### KV 未配置时的行为

如果 KV 数据库未创建或环境变量未配置：
- `getAllUsersFromStorage()` 会返回空数组
- `saveAllUsersToStorage()` 会抛出错误
- 用户数据不会保存

**解决方案**：确保在 Vercel Dashboard 中创建了 KV 数据库。

### 数据迁移

如果之前有用户数据存储在 `localStorage` 中：
- 这些数据仍然可以在本地浏览器中访问
- 但不会自动同步到 KV
- 建议：管理员可以手动重新注册，或者等待用户重新注册

### KV 免费额度

Vercel KV 免费计划包括：
- **30,000 次读取/天**
- **30,000 次写入/天**
- **256 MB 存储空间**

对于 100 位用户，这个额度完全足够使用。

## 🔍 故障排查

### 问题：用户数据无法保存

**检查清单**：
1. ✅ 是否在 Vercel Dashboard 创建了 KV 数据库？
2. ✅ 环境变量 `KV_REST_API_URL` 和 `KV_REST_API_TOKEN` 是否存在？
3. ✅ 是否重新部署了应用？
4. ✅ 查看 Vercel 部署日志是否有错误

### 问题：部署时出现错误

**可能原因**：
- `@vercel/kv` 依赖未安装 → 检查 `package.json` 是否包含该依赖
- KV 环境变量未配置 → 在 Vercel Dashboard 创建 KV 数据库

## 📊 性能说明

使用 Vercel KV 的优势：
- ✅ **数据持久化**：数据不会丢失
- ✅ **跨设备同步**：所有设备看到相同的数据
- ✅ **高性能**：Redis 兼容，读写速度快
- ✅ **自动备份**：Vercel 自动处理备份

## 🎉 完成！

配置完成后，你的应用将拥有：
- ✅ 持久化的用户数据存储
- ✅ 跨设备数据同步
- ✅ 适合 100+ 用户的生产级存储方案

如有任何问题，请查看 Vercel 官方文档或联系支持。
