import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, Loader2, GraduationCap } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user } = useAuth();
  
  // 如果已登录，重定向到首页或之前访问的页面
  React.useEffect(() => {
    if (isAuthenticated && user) {
      // 如果是管理员，直接跳转到后台
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        const from = (location.state as { from?: Location })?.from?.pathname || '/home';
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, location]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({
        email: formData.email,
        password: formData.password,
      });
      // 登录成功后重定向逻辑
      const from = (location.state as { from?: Location })?.from?.pathname;
      // 获取登录后的用户信息
      const loggedInUser = user;
      // 如果是管理员，直接跳转到后台
      if (loggedInUser && loggedInUser.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (from) {
        navigate(from, { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl mix-blend-multiply animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-300/30 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-pink-300/30 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/50 backdrop-blur-md rounded-2xl mb-4 shadow-lg border border-white/50">
            <GraduationCap className="w-8 h-8 text-brand-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">欢迎回来</h1>
          <p className="text-slate-600">登录您的账户以继续使用</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <span className="font-medium">错误：</span>
                <span>{error}</span>
              </div>
            )}

            {/* Audit Status Message */}
            {isAuthenticated && user && (
              <div className={`px-4 py-3 rounded-lg text-sm backdrop-blur-sm ${
                user.auditStatus === 1 
                  ? 'bg-green-50/80 border border-green-200 text-green-700' 
                  : user.auditStatus === 2
                  ? 'bg-red-50/80 border border-red-200 text-red-700'
                  : 'bg-yellow-50/80 border border-yellow-200 text-yellow-700'
              }`}>
                <span className="font-medium">
                  {user.auditStatus === 1 
                    ? '✓ 审核已通过' 
                    : user.auditStatus === 2
                    ? '✗ 审核已拒绝'
                    : '⏳ 待审核中'}
                </span>
                {user.auditStatus === 0 && (
                  <p className="mt-1 text-xs">您的账户正在审核中，审核通过后即可使用全部功能</p>
                )}
                {user.auditStatus === 2 && (
                  <p className="mt-1 text-xs">您的账户审核未通过，请联系管理员</p>
                )}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                邮箱地址
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200/60 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white/50 backdrop-blur-sm text-slate-900 placeholder-slate-400 transition-all shadow-sm"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                密码
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200/60 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white/50 backdrop-blur-sm text-slate-900 placeholder-slate-400 transition-all shadow-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-600/90 hover:bg-brand-700 backdrop-blur-sm disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg shadow-lg shadow-brand-200/50 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 border border-transparent"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>登录中...</span>
                </>
              ) : (
                <span>登录</span>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              还没有账户？{' '}
              <Link
                to="/register"
                className="font-semibold text-brand-600 hover:text-brand-700 transition-colors"
              >
                立即注册
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500/80">
          <p>&copy; 2026 Marvellous Education. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};
