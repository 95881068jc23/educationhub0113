import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthState, LoginCredentials, RegisterCredentials, AuthContextType } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'marvel_education_users';
const CURRENT_USER_KEY = 'marvel_education_current_user';

interface StoredUser extends User {
  password: string; // 仅用于演示，实际应用中应使用哈希
}

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
    const currentUser = getCurrentUser();
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

    // 检查邮箱是否已存在
    if (users.some((u) => u.email === credentials.email)) {
      throw new Error('该邮箱已被注册');
    }

    // 创建新用户
    const newUser: StoredUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: credentials.email,
      name: credentials.name,
      password: credentials.password, // 实际应用中应使用哈希
      createdAt: new Date().toISOString(),
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

  const value: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
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
