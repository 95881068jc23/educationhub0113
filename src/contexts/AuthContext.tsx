import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthState, LoginCredentials, RegisterCredentials, AuthContextType, StoredUser, AuditStatus } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'marvel_education_users';
const CURRENT_USER_KEY = 'marvel_education_current_user';

/**
 * 从 localStorage 获取所有用户
 */
const getStoredUsers = (): StoredUser[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/**
 * 保存用户到 localStorage
 */
const saveStoredUsers = (users: StoredUser[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Failed to save users:', error);
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
    // 自动创建超级管理员账号
    const users = getStoredUsers();
    const adminExists = users.some((u) => u.role === 'admin');
    if (!adminExists) {
      const adminUser: StoredUser = {
        id: 'admin_10086',
        username: '超级管理员',
        email: 'admin@admin.com',
        password: 'admin123',
        auditStatus: 1,
        role: 'admin',
        createTime: new Date().toLocaleString(),
        name: '超级管理员',
        createdAt: new Date().toISOString(),
      };
      users.push(adminUser);
      saveStoredUsers(users);
    }

    // 原有逻辑：从 localStorage 恢复登录状态
    const currentUser = getCurrentUser();
    // 如果用户数据缺少新字段，进行兼容性处理
    if (currentUser) {
      const updatedUsers = getStoredUsers();
      const fullUser = updatedUsers.find((u) => u.id === currentUser.id);
      if (fullUser) {
        const { password, ...userWithoutPassword } = fullUser;
        const updatedUser: User = {
          ...userWithoutPassword,
          // 兼容旧数据：如果没有新字段，使用默认值
          username: (userWithoutPassword as any).username || currentUser.email.split('@')[0],
          auditStatus: (userWithoutPassword as any).auditStatus ?? 0,
          role: (userWithoutPassword as any).role || 'user',
          createTime: (userWithoutPassword as any).createTime || userWithoutPassword.createdAt || new Date().toISOString(),
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
  }, []);

  /**
   * 登录
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    const users = getStoredUsers();
    const user = users.find(
      (u) => u.email === credentials.email && u.password === credentials.password
    );

    if (!user) {
      throw new Error('邮箱或密码错误');
    }

    // 移除密码字段
    const { password, ...userWithoutPassword } = user;
    const currentUser: User = userWithoutPassword;

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

    const users = getStoredUsers();

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
      createTime: createTime,
      createdAt: createTime, // 保留向后兼容
    };

    users.push(newUser);
    saveStoredUsers(users);

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
  const getAllUsers = useCallback((): StoredUser[] => {
    return getStoredUsers();
  }, []);

  /**
   * 审核用户（管理员功能）
   */
  const auditUser = useCallback((userId: string, status: AuditStatus): void => {
    const users = getStoredUsers();
    const userIndex = users.findIndex((u) => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('用户不存在');
    }

    users[userIndex].auditStatus = status;
    saveStoredUsers(users);

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

  const value: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    getAllUsers,
    auditUser,
    isAudited,
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
