# 初始化超级管理员账号

## 方法一：浏览器控制台执行（推荐）

打开浏览器开发者工具（F12），在控制台（Console）中执行以下代码：

```javascript
// 初始化超级管理员账号
(function() {
  const STORAGE_KEY = 'marvel_education_users';
  
  // 获取现有用户数据
  let users = [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    users = stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('读取用户数据失败:', e);
  }
  
  // 检查是否已存在管理员
  const adminExists = users.some(u => u.role === 'admin');
  if (adminExists) {
    console.log('管理员账号已存在，跳过创建');
    return;
  }
  
  // 创建超级管理员
  const createTime = new Date().toISOString();
  const adminUser = {
    id: 'admin_' + Date.now(),
    username: 'admin',
    email: 'admin@marvel.edu',
    name: '超级管理员',
    password: 'admin123', // 请登录后立即修改密码
    auditStatus: 1, // 审核通过
    role: 'admin', // 管理员角色
    createTime: createTime,
    createdAt: createTime
  };
  
  users.push(adminUser);
  
  // 保存到 localStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    console.log('✅ 超级管理员账号创建成功！');
    console.log('📧 邮箱: admin@marvel.edu');
    console.log('🔑 密码: admin123');
    console.log('⚠️  请登录后立即修改密码！');
  } catch (e) {
    console.error('保存用户数据失败:', e);
  }
})();
```

## 方法二：手动创建（如果控制台方法不可用）

1. 打开浏览器开发者工具（F12）
2. 切换到 Application（应用）标签页
3. 在左侧找到 Local Storage，选择你的网站域名
4. 找到 `marvel_education_users` 键
5. 如果不存在，点击右键选择 "Add new item"，键名输入 `marvel_education_users`，值输入以下 JSON：

```json
[{
  "id": "admin_1737000000000",
  "username": "admin",
  "email": "admin@marvel.edu",
  "name": "超级管理员",
  "password": "admin123",
  "auditStatus": 1,
  "role": "admin",
  "createTime": "2026-01-15T00:00:00.000Z",
  "createdAt": "2026-01-15T00:00:00.000Z"
}]
```

## 登录信息

- **邮箱**: `admin@marvel.edu`
- **密码**: `admin123`
- **角色**: 管理员（admin）
- **审核状态**: 已通过（1）

## 安全提示

⚠️ **重要**: 创建管理员账号后，请立即：
1. 使用上述账号登录系统
2. 进入管理员后台
3. 修改管理员密码（可以通过编辑 localStorage 中的用户数据来修改）

## 修改密码方法

在浏览器控制台执行：

```javascript
(function() {
  const STORAGE_KEY = 'marvel_education_users';
  const users = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const admin = users.find(u => u.role === 'admin');
  if (admin) {
    admin.password = '你的新密码'; // 修改这里
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    console.log('✅ 密码已更新');
  } else {
    console.log('❌ 未找到管理员账号');
  }
})();
```
