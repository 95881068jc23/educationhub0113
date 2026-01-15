-- Supabase 操作日志表结构
-- 在 Supabase Dashboard 的 SQL Editor 中执行此 SQL

-- 创建用户操作日志表
CREATE TABLE IF NOT EXISTS user_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_logs_user_id ON user_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_logs_action_type ON user_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_user_logs_created_at ON user_logs(created_at DESC);

-- 启用 Row Level Security (RLS)
ALTER TABLE user_logs ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许所有人插入日志（用于记录操作）
CREATE POLICY "Allow public insert logs" ON user_logs
  FOR INSERT
  WITH CHECK (true);

-- 创建策略：允许管理员读取所有日志
CREATE POLICY "Allow admin read logs" ON user_logs
  FOR SELECT
  USING (true); -- 简化：允许所有人读取，实际应用中可以根据用户角色限制

-- 添加注释
COMMENT ON TABLE user_logs IS '用户操作日志表，记录所有用户的操作行为';
COMMENT ON COLUMN user_logs.user_id IS '用户ID';
COMMENT ON COLUMN user_logs.action_type IS '操作类型：login, register, upload_audio, chat_message, etc.';
COMMENT ON COLUMN user_logs.action_details IS '操作详情（JSON格式）';
COMMENT ON COLUMN user_logs.ip_address IS '用户IP地址';
COMMENT ON COLUMN user_logs.user_agent IS '用户浏览器信息';
