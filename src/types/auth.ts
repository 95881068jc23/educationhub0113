/**
 * 认证相关类型定义
 */

/**
 * 审核状态枚举
 * 0 = 待审核
 * 1 = 审核通过
 * 2 = 审核拒绝
 */
export type AuditStatus = 0 | 1 | 2;

/**
 * 用户角色枚举
 * user = 普通用户
 * admin = 管理员
 */
export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  auditStatus: AuditStatus;
  role: UserRole;
  createTime: string;
  createdAt: string; // 保留向后兼容
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  name: string;
  confirmPassword: string;
}

export interface StoredUser extends User {
  password: string; // 仅用于演示，实际应用中应使用哈希
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  getAllUsers: () => StoredUser[];
  auditUser: (userId: string, status: AuditStatus) => void;
  isAudited: () => boolean;
}
