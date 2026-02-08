import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthState, LoginCredentials, RegisterCredentials, AuthContextType, StoredUser, AuditStatus, UserIdentity } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'marvel_education_users';
const CURRENT_USER_KEY = 'marvel_education_current_user';

/**
 * 从服务器获取所有用户
 * 改动：不再从 localStorage 读取或写入，防止敏感信息泄露
 * 仅作为 API 包装器
 */
const getStoredUsers = async (): Promise<StoredUser[]> => {
  try {
    const response = await fetch('/api/users');
    if (response.ok) {
      const data = await response.json();
      if (data.users && Array.isArray(data.users)) {
        return data.users as StoredUser[];
      }
    }
  } catch (error) {
    console.warn('从服务器获取用户失败:', error);
  }
  return [];
};

/**
 * 废弃：不再需要在客户端全量保存用户
 * 仅保留空函数以兼容现有调用（如果有遗漏）
 */
const saveStoredUsers = async (users: StoredUser[]): Promise<void> => {
  console.warn('saveStoredUsers is deprecated. Use API endpoints instead.');
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
      // 1. 安全清理：清除旧版本遗留在本地的所有用户数据（包含密码）
      localStorage.removeItem(STORAGE_KEY);

      // 原有逻辑：从 localStorage 恢复登录状态
      const currentUser = getCurrentUser();
      // 如果用户数据缺少新字段，进行兼容性处理
      if (currentUser) {
        // 尝试从服务器获取最新用户信息来更新本地状态
        try {
           const users = await getStoredUsers();
           const fullUser = users.find((u) => u.id === currentUser.id);
           if (fullUser) {
             // 确保不包含密码
             const { password, ...userWithoutPassword } = fullUser as any; 
             
             const updatedUser: User = {
               ...userWithoutPassword,
               // 兼容旧数据
               username: userWithoutPassword.username || currentUser.email.split('@')[0],
               auditStatus: userWithoutPassword.auditStatus ?? 0,
               role: userWithoutPassword.role || 'user',
               identity: (() => {
                const identity = userWithoutPassword.identity;
                if (typeof identity === 'string' && identity !== null && identity !== '') {
                  return [identity as 'consultant' | 'teacher'];
                }
                if (Array.isArray(identity)) {
                  return identity as ('consultant' | 'teacher')[];
                }
                return null;
              })(),
               createTime: userWithoutPassword.createTime || userWithoutPassword.createdAt || new Date().toISOString(),
             };
             saveCurrentUser(updatedUser);
             setAuthState({
               user: updatedUser,
               isAuthenticated: true,
               isLoading: false,
             });
             return;
           }
        } catch (e) {
           console.warn("Failed to sync user on init", e);
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
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '登录失败');
      }

      const data = await response.json();
      const user = data.user;

      // 兼容旧数据：如果是字符串身份，转换为数组
      let identity: UserIdentity = user.identity ?? null;
      if (identity && typeof identity === 'string') {
        identity = [identity as 'consultant' | 'teacher'];
      }
      const currentUser: User = {
        ...user,
        identity,
      };

      saveCurrentUser(currentUser);
      setAuthState({
        user: currentUser,
        isAuthenticated: true,
        isLoading: false,
      });

      // 记录登录日志
      try {
        await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            actionType: 'login',
            actionDetails: { email: credentials.email },
          }),
        });
      } catch (error) {
        console.error('记录登录日志失败:', error);
      }
    } catch (error) {
      console.error('登录错误:', error);
      throw error;
    }
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

    // 验证用户名长度
    if (credentials.username.length < 3) {
      throw new Error('用户名长度至少为 3 个字符');
    }

    try {
      const createTime = new Date().toISOString();
      const newUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        username: credentials.username,
        email: credentials.email,
        name: credentials.name,
        password: credentials.password,
        auditStatus: 0,
        role: 'user',
        identity: null,
        createTime: createTime,
        createdAt: createTime,
      };

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        const data = await response.json();
        // 如果后端返回具体错误信息（如用户名/邮箱已存在），直接抛出
        if (data.error) {
           throw new Error(data.error);
        }
        throw new Error('注册失败，请稍后重试');
      }

      const data = await response.json();
      const savedUser = data.user;
      
      // 自动登录
      // 确保不包含密码
      const { password, ...userWithoutPassword } = savedUser;
      const currentUser: User = userWithoutPassword;

      saveCurrentUser(currentUser);
      setAuthState({
        user: currentUser,
        isAuthenticated: true,
        isLoading: false,
      });

      // 记录注册日志
      try {
        await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            actionType: 'register',
            actionDetails: { 
              username: credentials.username,
              email: credentials.email,
            },
          }),
        });
      } catch (error) {
        console.error('记录注册日志失败:', error);
      }

    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
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
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, updates: { auditStatus: status } }),
      });

      if (!response.ok) {
        throw new Error('审核用户失败');
      }

      // 更新本地状态（为了 UI 响应速度）
      // 重新拉取一次列表以保持同步
      await getStoredUsers();

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
    } catch (error) {
      console.error('Audit user failed:', error);
      throw error;
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
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, updates: { identity } }),
      });

      if (!response.ok) {
        throw new Error('更新用户身份失败');
      }

      // 更新本地状态
      await getStoredUsers();

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
    } catch (error) {
      console.error('Update user identity failed:', error);
      throw error;
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
