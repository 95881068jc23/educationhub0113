
## 问题解析
经过分析，录音分析报错的根本原因是 **API 限流（Rate Limit）导致的重试机制失效**。

1.  **现象**：
    - 后端 API 返回了 `429 Too Many Requests` 错误（限流）。
    - 您的 `geminiProxy.ts` 服务将此错误捕获并抛出了中文提示：“**API 调用次数已达上限**”。
    - 录音分析组件 (`CaseDiagnosis.tsx`) 的重试逻辑只识别英文关键词（如 `429`, `quota`），无法识别这个中文错误信息。
    - 结果：程序误认为这是一个不可恢复的错误，直接跳过当前音频片段，导致分析失败。

2.  **受影响文件**：
    - `src/apps/sales-genius/components/CaseDiagnosis.tsx`

## 修复方案

我将修改 `CaseDiagnosis.tsx` 中的错误处理逻辑，使其能够识别中文的限流错误提示，从而正确触发自动重试机制。

### 具体修改内容：

1.  **更新重试条件**：
    在 `CaseDiagnosis.tsx` 第 324 行左右，增加对中文错误信息的检测。

    ```typescript
    // 修改前
    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Resource has been exhausted')) {

    // 修改后
    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Resource has been exhausted') || errorMessage.includes('API 调用次数已达上限')) {
    ```

2.  **优化效果**：
    - 当再次遇到 API 限流时，程序将自动等待（2秒、4秒、8秒）后重试，而不是直接报错跳过。
    - 这将显著提高长录音分析的成功率。

请确认执行此修复方案。
