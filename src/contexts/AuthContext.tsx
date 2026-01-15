import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthState, LoginCredentials, RegisterCredentials, AuthContextType, StoredUser, AuditStatus, UserIdentity } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'marvel_education_users';
const CURRENT_USER_KEY = 'marvel_education_current_user';

/**
 * 从服务器和 localStorage 获取所有用户（混合方案）
 */
const getStoredUsers = async (): Promise<StoredUser[]> => {
  try {
    // 优先从服务器获取
    const response = await fetch('/api/users');
    if (response.ok) {
      const data = await response.json();
      if (data.users && Array.isArray(data.users) && data.users.length > 0) {
        // 同步到本地存储作为备份
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.users));
        return data.users as StoredUser[];
      }
    }
  } catch (error) {
    console.warn('从服务器获取用户失败，使用本地存储:', error);
  }
  
  // 如果服务器获取失败，使用本地存储
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/**
 * 保存用户到服务器和 localStorage（混合方案）
 */
const saveStoredUsers = async (users: StoredUser[]): Promise<void> => {
  try {
    // 先保存到本地存储（立即更新）
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    
    // 然后同步到服务器（异步，不阻塞）
    try {
      // 批量同步所有用户到服务器
      const syncPromises = users.map((user) =>
        fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user),
        }).catch((err) => {
          console.warn(`同步用户 ${user.id} 到服务器失败:`, err);
          return null;
        })
      );
      
      await Promise.all(syncPromises);
    } catch (error) {
      console.warn('同步到服务器失败，但已保存到本地:', error);
    }
  } catch (error) {
    console.error('Failed to save users:', error);
    throw error;
  }
};

/**
 * 获取当前登录用户
 */
const getCurrentUser = (): User | null => {
  try {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

/**
 * 保存当前登录用户
 */
const saveCurrentUser = (user: User | null): void => {
  try {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch (error) {
    console.error('Failed to save current user:', error);
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // 初始化：从 localStorage 恢复登录状态
  useEffect(() => {
    const initAuth = async (): Promise<void> => {
      // 自动创建超级管理员账号
      const users = await getStoredUsers();
      const adminExists = users.some((u) => u.role === 'admin');
      if (!adminExists) {
        const adminUser: StoredUser = {
          id: 'admin_10086',
          username: '超级管理员',
          email: 'admin@admin.com',
          password: 'admin123',
          auditStatus: 1,
          role: 'admin',
          identity: null, // 管理员不需要身份
          createTime: new Date().toLocaleString(),
          name: '超级管理员',
          createdAt: new Date().toISOString(),
        };
        users.push(adminUser);
        await saveStoredUsers(users);
      }

      // 原有逻辑：从 localStorage 恢复登录状态
      const currentUser = getCurrentUser();
      // 如果用户数据缺少新字段，进行兼容性处理
      if (currentUser) {
        const updatedUsers = await getStoredUsers();
        const fullUser = updatedUsers.find((u) => u.id === currentUser.id);
        if (fullUser) {
          const { password, ...userWithoutPassword } = fullUser;
          const updatedUser: User = {
            ...userWithoutPassword,
            // 兼容旧数据：如果没有新字段，使用默认值
            username: (userWithoutPassword as any).username || currentUser.email.split('@')[0],
            auditStatus: (userWithoutPassword as any).auditStatus ?? 0,
            role: (userWithoutPassword as any).role || 'user',
            identity: (() => {
            const identity = (userWithoutPassword as any).identity;
            // 兼容旧数据：如果是字符串，转换为数组
            if (typeof identity === 'string' && identity !== null && identity !== '') {
              return [identity as 'consultant' | 'teacher'];
            }
            // 如果是数组或null，直接返回
            if (Array.isArray(identity)) {
              return identity as ('consultant' | 'teacher')[];
            }
            return null;
          })(),
            createTime: (userWithoutPassword as any).createTime || (userWithoutPassword as any).createdAt || new Date().toISOString(),
          };
          saveCurrentUser(updatedUser);
          setAuthState({
            user: updatedUser,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }
      }
      setAuthState({
        user: currentUser,
        isAuthenticated: !!currentUser,
        isLoading: false,
      });
    };
    
    initAuth();
  }, []);

  /**
   * 登录
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    const users = await getStoredUsers();
    const user = users.find(
      (u) => u.email === credentials.email && u.password === credentials.password
    );

    if (!user) {
      throw new Error('邮箱或密码错误');
    }

    // 移除密码字段
    const { password, ...userWithoutPassword } = user;
    // 兼容旧数据：如果是字符串身份，转换为数组
    let identity: UserIdentity = userWithoutPassword.identity ?? null;
    if (identity && typeof identity === 'string') {
      identity = [identity as 'consultant' | 'teacher'];
    }
    const currentUser: User = {
      ...userWithoutPassword,
      identity,
    };

    saveCurrentUser(currentUser);
    setAuthState({
      user: currentUser,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  /**
   * 注册
   */
  const register = useCallback(async (credentials: RegisterCredentials): Promise<void> => {
    // 验证密码匹配
    if (credentials.password !== credentials.confirmPassword) {
      throw new Error('两次输入的密码不一致');
    }

    // 验证密码长度
    if (credentials.password.length < 6) {
      throw new Error('密码长度至少为 6 位');
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(credentials.email)) {
      throw new Error('邮箱格式不正确');
    }

    const users = await getStoredUsers();

    // 检查用户名是否已存在
    if (users.some((u) => u.username === credentials.username)) {
      throw new Error('该用户名已被使用');
    }

    // 检查邮箱是否已存在
    if (users.some((u) => u.email === credentials.email)) {
      throw new Error('该邮箱已被注册');
    }

    // 验证用户名长度
    if (credentials.username.length < 3) {
      throw new Error('用户名长度至少为 3 个字符');
    }

    // 创建新用户
    const createTime = new Date().toISOString();
    const newUser: StoredUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      username: credentials.username,
      email: credentials.email,
      name: credentials.name,
      password: credentials.password, // 实际应用中应使用哈希
      auditStatus: 0, // 默认待审核
      role: 'user', // 默认普通用户
      identity: null, // 默认无身份，需要管理员分配
      createTime: createTime,
      createdAt: createTime, // 保留向后兼容
    };

    users.push(newUser);
    await saveStoredUsers(users);

    // 自动登录
    const { password, ...userWithoutPassword } = newUser;
    const currentUser: User = userWithoutPassword;

    saveCurrentUser(currentUser);
    setAuthState({
      user: currentUser,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  /**
   * 退出登录
   */
  const logout = useCallback((): void => {
    saveCurrentUser(null);
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  /**
   * 获取所有用户（管理员功能）
   */
  const getAllUsers = useCallback(async (): Promise<StoredUser[]> => {
    return await getStoredUsers();
  }, []);

  /**
   * 审核用户（管理员功能）
   */
  const auditUser = useCallback(async (userId: string, status: AuditStatus): Promise<void> => {
    const users = await getStoredUsers();
    const userIndex = users.findIndex((u) => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('用户不存在');
    }

    users[userIndex].auditStatus = status;
    await saveStoredUsers(users);

    // 如果审核的是当前登录用户，更新当前用户状态
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      const updatedUser: User = {
        ...currentUser,
        auditStatus: status,
      };
      saveCurrentUser(updatedUser);
      setAuthState((prev) => ({
        ...prev,
        user: updatedUser,
      }));
    }
  }, []);

  /**
   * 判断当前用户是否已审核通过
   */
  const isAudited = useCallback((): boolean => {
    const currentUser = authState.user;
    return currentUser ? currentUser.auditStatus === 1 : false;
  }, [authState.user]);

  /**
   * 判断当前用户是否拥有指定身份
   */
  const hasIdentity = useCallback((identity: 'consultant' | 'teacher'): boolean => {
    const currentUser = authState.user;
    if (!currentUser || !currentUser.identity) {
      return false;
    }
    // 兼容旧数据：如果是字符串，转换为数组
    if (typeof currentUser.identity === 'string') {
      return currentUser.identity === identity;
    }
    // 新数据：数组形式
    return Array.isArray(currentUser.identity) && currentUser.identity.includes(identity);
  }, [authState.user]);

  /**
   * 更新用户身份（管理员功能）
   */
  const updateUserIdentity = useCallback(async (userId: string, identity: UserIdentity): Promise<void> => {
    const users = await getStoredUsers();
    const userIndex = users.findIndex((u) => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('用户不存在');
    }

    users[userIndex].identity = identity;
    await saveStoredUsers(users);

    // 如果更新的是当前登录用户，更新当前用户状态
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      const updatedUser: User = {
        ...currentUser,
        identity: identity,
      };
      saveCurrentUser(updatedUser);
      setAuthState((prev) => ({
        ...prev,
        user: updatedUser,
      }));
    }
  }, []);

  const value: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    getAllUsers,
    auditUser,
    updateUserIdentity,
    isAudited,
    hasIdentity,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * 使用认证 Context 的 Hook
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
