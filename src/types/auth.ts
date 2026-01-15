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

/**
 * 用户身份枚举
 * consultant = 顾问身份（课程规划系统/履历优化大师/国际智学/销售百宝箱）
 * teacher = 教师身份（履历优化大师/备课生成器/教师百宝箱）
 */
export type UserIdentity = 'consultant' | 'teacher' | null;

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  auditStatus: AuditStatus;
  role: UserRole;
  identity: UserIdentity; // 用户身份：顾问或教师
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
  getAllUsers: () => Promise<StoredUser[]>;
  auditUser: (userId: string, status: AuditStatus) => Promise<void>;
  updateUserIdentity: (userId: string, identity: UserIdentity) => Promise<void>;
  isAudited: () => boolean;
}
