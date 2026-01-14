# Vercel 部署配置指南

## 环境变量配置

### 必需的环境变量

在 Vercel 上部署此应用时，**必须**配置以下环境变量：

- **`VITE_API_KEY`**: 您的 Google Gemini API Key

### 配置步骤

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择您的项目
3. 进入 **Settings** → **Environment Variables**
4. 添加环境变量：
   - **Name**: `VITE_API_KEY`
   - **Value**: 您的 Gemini API Key
   - **Environment**: 选择所有环境（Production, Preview, Development）
5. **重要**: 添加环境变量后，需要**重新部署**应用才能生效

### 为什么需要重新部署？

Vite 在**构建时**将环境变量注入到代码中。这意味着：
- 环境变量在构建时被读取
- 如果环境变量在构建后添加或修改，必须重新构建
- 在 Vercel 上，这需要触发新的部署

### 验证配置

部署后，如果 API 调用失败，请检查：

1. **环境变量名称是否正确**: 必须是 `VITE_API_KEY`（注意 `VITE_` 前缀）
2. **环境变量值是否正确**: 确保 API Key 没有多余的空格或换行符
3. **是否已重新部署**: 添加环境变量后必须重新部署
4. **浏览器控制台**: 打开浏览器开发者工具，查看是否有错误信息

### 常见问题

#### Q: 为什么环境变量不生效？
A: 
- 确保环境变量名称是 `VITE_API_KEY`（不是 `API_KEY` 或其他名称）
- 确保在添加环境变量后重新部署了应用
- 检查环境变量值是否正确（没有多余空格）

#### Q: 如何获取 Gemini API Key？
A: 
1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 登录您的 Google 账号
3. 创建新的 API Key
4. 复制 API Key 并添加到 Vercel 环境变量中

#### Q: API Key 安全吗？
A: 
⚠️ **重要安全提示**: 
- 所有以 `VITE_` 开头的环境变量会被**暴露到客户端代码**中
- 这意味着 API Key 会被打包到前端代码，任何人都可以在浏览器中查看
- 建议：
  - 使用 API Key 限制（在 Google Cloud Console 中设置）
  - 限制 API Key 的使用范围
  - 考虑使用后端代理来保护 API Key（更安全的方案）

### 诊断工具

如果遇到问题，可以在浏览器控制台中运行以下代码来检查环境变量：

```javascript
console.log('VITE_API_KEY:', import.meta.env.VITE_API_KEY ? '已配置' : '未配置');
```
