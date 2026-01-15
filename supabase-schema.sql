-- Supabase 数据库表结构
-- 在 Supabase Dashboard 的 SQL Editor 中执行此 SQL

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  audit_status INTEGER NOT NULL DEFAULT 0 CHECK (audit_status IN (0, 1, 2)),
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  identity TEXT[] DEFAULT NULL, -- 数组类型，支持多选身份
  create_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_audit_status ON users(audit_status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_create_time ON users(create_time DESC);

-- 启用 Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许所有人读取（用于管理员查看用户列表）
CREATE POLICY "Allow public read access" ON users
  FOR SELECT
  USING (true);

-- 创建策略：允许插入新用户（用于注册）
CREATE POLICY "Allow public insert" ON users
  FOR INSERT
  WITH CHECK (true);

-- 创建策略：允许更新用户（用于审核和更新身份）
CREATE POLICY "Allow public update" ON users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 创建策略：允许删除用户（可选，根据需求决定是否启用）
-- CREATE POLICY "Allow public delete" ON users
--   FOR DELETE
--   USING (true);

-- 添加注释
COMMENT ON TABLE users IS '用户表，存储所有注册用户的信息';
COMMENT ON COLUMN users.audit_status IS '审核状态：0=待审核, 1=已通过, 2=已拒绝';
COMMENT ON COLUMN users.role IS '用户角色：user=普通用户, admin=管理员';
COMMENT ON COLUMN users.identity IS '用户身份数组：consultant=顾问, teacher=教师';
