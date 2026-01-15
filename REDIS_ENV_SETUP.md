# Redis 环境变量配置指南

## 需要的环境变量

使用 `@vercel/kv` 需要以下两个环境变量：

1. **`KV_REST_API_URL`** - Redis REST API 的 URL
2. **`KV_REST_API_TOKEN`** - Redis REST API 的认证 Token

## 配置步骤

### 步骤 1：检查环境变量是否已自动添加

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目：`marvel-education-hub`
3. 进入 **Settings** → **Environment Variables**
4. 检查是否存在：
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

### 步骤 2：如果环境变量已自动添加

✅ **恭喜！** 无需额外配置，直接重新部署即可。

### 步骤 3：如果环境变量未自动添加（手动配置）

如果只看到 `REDIS_URL` 或其他环境变量，需要手动添加：

1. 进入 **Storage** 标签页
2. 点击你的 Redis 数据库
3. 在详情页找到：
   - **REST API URL** 或 **Endpoint**
   - **REST API Token** 或 **Password**
4. 进入 **Settings** → **Environment Variables**
5. 添加以下环境变量：

   **变量 1：**
   - Name: `KV_REST_API_URL`
   - Value: 从 Redis 详情页复制的 REST API URL
   - Environment: 选择所有环境（Production, Preview, Development）

   **变量 2：**
   - Name: `KV_REST_API_TOKEN`
   - Value: 从 Redis 详情页复制的 REST API Token
   - Environment: 选择所有环境（Production, Preview, Development）

### 步骤 4：重新部署

1. 进入 **Deployments** 标签页
2. 点击最新的部署
3. 点击 **Redeploy** 按钮

## 验证配置

部署完成后，测试：
1. 注册一个新用户
2. 登录管理员后台
3. 应该能看到新注册的用户

如果能看到用户数据，说明配置成功！

## 故障排查

### 问题：仍然报错 "Missing required environment variables"

**解决方案：**
1. 确认环境变量名称完全正确：`KV_REST_API_URL` 和 `KV_REST_API_TOKEN`
2. 确认环境变量已应用到所有环境
3. 确认已重新部署应用
4. 检查环境变量值是否正确（没有多余空格）

### 问题：找不到 REST API URL 和 Token

**解决方案：**
- 如果使用的是 Marketplace 的 Redis，查看 Redis 提供商的文档
- 或者联系 Redis 提供商获取 REST API 信息

## 其他需要的环境变量

除了 Redis 相关变量，还需要：

- **`VITE_API_KEY`** 或 **`API_KEY`**: Google Gemini API Key（用于 AI 功能）

## 完成！

配置完成后，你的应用将拥有：
- ✅ 持久化的用户数据存储
- ✅ 跨设备数据同步
- ✅ 适合 100+ 用户的生产级存储方案
