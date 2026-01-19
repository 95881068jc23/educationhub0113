-- 更新用户表结构以支持分级管理员
-- 在 Supabase Dashboard 的 SQL Editor 中执行此 SQL

-- 1. 添加 managed_users 字段 (存储被管理用户的ID列表)
ALTER TABLE users ADD COLUMN IF NOT EXISTS managed_users TEXT[] DEFAULT NULL;

-- 2. 更新 role 字段的检查约束，允许 'tiered_admin'
-- 先删除旧约束
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
-- 添加新约束
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin', 'tiered_admin'));

-- 3. 添加注释
COMMENT ON COLUMN users.role IS '用户角色：user=普通用户, admin=超级管理员, tiered_admin=分级管理员';
COMMENT ON COLUMN users.managed_users IS '分级管理员管理的特定用户ID列表';

-- 4. (可选) 更新 RLS 策略以支持分级管理员
-- 注意：当前的策略是 "Allow public read access" (USING true)，如果需要更严格的权限控制，可以修改如下：
/*
-- 允许用户读取自己的信息，管理员读取所有，分级管理员读取自己管理的用户
DROP POLICY IF EXISTS "Allow public read access" ON users;
CREATE POLICY "Read access policy" ON users
  FOR SELECT
  USING (
    auth.uid() = id -- 自己
    OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin') -- 超级管理员
    OR
    EXISTS ( -- 分级管理员查看其管理的用户
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'tiered_admin' 
      AND (users.id = ANY(managed_users))
    )
  );
*/
