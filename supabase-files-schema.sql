-- Supabase 数据库表结构：用户文件表
-- 在 Supabase Dashboard 的 SQL Editor 中执行此 SQL

-- 创建用户文件表
CREATE TABLE IF NOT EXISTS user_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('audio', 'image', 'document')),
  file_path TEXT NOT NULL, -- Supabase Storage 路径
  file_url TEXT NOT NULL, -- 公开 URL
  file_size BIGINT NOT NULL, -- 文件大小（字节）
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_files_user_id ON user_files(user_id);
CREATE INDEX IF NOT EXISTS idx_user_files_file_type ON user_files(file_type);
CREATE INDEX IF NOT EXISTS idx_user_files_created_at ON user_files(created_at DESC);

-- 启用 Row Level Security (RLS)
ALTER TABLE user_files ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许所有人插入文件（用于上传）
CREATE POLICY "Allow public insert files" ON user_files
  FOR INSERT
  WITH CHECK (true);

-- 创建策略：允许所有人读取文件（用于管理后台查看）
CREATE POLICY "Allow public read files" ON user_files
  FOR SELECT
  USING (true);

-- 创建策略：允许删除文件（用于管理后台删除）
CREATE POLICY "Allow public delete files" ON user_files
  FOR DELETE
  USING (true);

-- 添加注释
COMMENT ON TABLE user_files IS '用户文件表，存储所有用户上传的文件元数据';
COMMENT ON COLUMN user_files.user_id IS '用户ID';
COMMENT ON COLUMN user_files.file_name IS '原始文件名';
COMMENT ON COLUMN user_files.file_type IS '文件类型：audio=音频, image=图片, document=文档';
COMMENT ON COLUMN user_files.file_path IS 'Supabase Storage 中的文件路径';
COMMENT ON COLUMN user_files.file_url IS '文件的公开访问 URL';
COMMENT ON COLUMN user_files.file_size IS '文件大小（字节）';
COMMENT ON COLUMN user_files.mime_type IS '文件 MIME 类型';
