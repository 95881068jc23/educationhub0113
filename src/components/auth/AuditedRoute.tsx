import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, AlertCircle } from 'lucide-react';

interface AuditedRouteProps {
  children: React.ReactElement;
}

/**
 * 审核状态路由守卫组件
 * 只有审核通过的用户才能访问
 */
export const AuditedRoute: React.FC<AuditedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user, isAudited } = useAuth();
  const location = useLocation();

  // 加载中状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto mb-4" />
          <p className="text-slate-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 未登录，重定向到登录页
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // 已登录但未审核通过，显示提示页面
  if (!isAudited()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {user?.auditStatus === 0 ? '账户待审核' : '账户审核未通过'}
          </h2>
          <p className="text-slate-600 mb-6">
            {user?.auditStatus === 0
              ? '您的账户正在审核中，审核通过后即可使用全部功能。请耐心等待管理员审核。'
              : '您的账户审核未通过，无法使用此功能。请联系管理员。'}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/home'}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              返回首页
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => window.location.href = '/admin'}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                前往管理员后台
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return children;
};
