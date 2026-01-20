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
    <div className="min-h-screen bg-navy-900 relative overflow-hidden flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Background Image with Low Opacity */}
      <img 
        src="/images/login-bg.jpg"
        alt="Shanghai Skyline"
        className="absolute inset-0 z-0 w-full h-full object-cover opacity-20"
      />
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[30%] -left-[10%] w-[60%] h-[60%] bg-gold-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute top-[40%] -right-[10%] w-[50%] h-[70%] bg-navy-600/30 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 left-[20%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Left Column: Platform Introduction */}
          <div className="text-left space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400 text-sm font-medium backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse"></span>
              准备好开始了吗？只需简单几步
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight drop-shadow-lg">
                欢迎来到 <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-400 to-gold-500">
                  Marvel Education
                </span>
              </h1>
              <p className="text-xl text-navy-100/90 max-w-lg leading-relaxed drop-shadow-md">
                您的智能教育助手已准备就绪。赋能顾问与教师，提供课程规划、销售优化及专业发展的智能化工具。
              </p>
            </div>
          </div>

          {/* Right Column: Login Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 relative overflow-hidden group">
              {/* Form Header */}
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-navy-50 rounded-xl mb-4 shadow-inner">
                  <GraduationCap className="w-7 h-7 text-gold-500" />
                </div>
                <h2 className="text-2xl font-bold text-navy-900">登录您的账户</h2>
                <p className="text-slate-500 mt-1">请输入您的凭证以继续</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <span className="font-medium">错误：</span>
                    <span>{error}</span>
                  </div>
                )}

                {/* Audit Status Message */}
                {isAuthenticated && user && (
                  <div className={`px-4 py-3 rounded-xl text-sm border ${
                    user.auditStatus === 1 
                      ? 'bg-green-50 border-green-200 text-green-700' 
                      : user.auditStatus === 2
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-gold-50 border-gold-200 text-gold-800'
                  }`}>
                    <span className="font-medium">
                      {user.auditStatus === 1 
                        ? '✓ 账户已验证' 
                        : user.auditStatus === 2
                        ? '✗ 验证失败'
                        : '⏳ 等待验证'}
                    </span>
                    {user.auditStatus === 0 && (
                      <p className="mt-1 text-xs opacity-90">您的账户正在审核中，批准后将获得完全访问权限。</p>
                    )}
                    {user.auditStatus === 2 && (
                      <p className="mt-1 text-xs opacity-90">请联系管理员以获取帮助。</p>
                    )}
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-navy-900 mb-1.5">
                    邮箱地址
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-gold-500 transition-colors" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 bg-slate-50 text-navy-900 placeholder-slate-400 transition-all outline-none hover:border-gold-300"
                      placeholder="name@company.com"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="password" className="block text-sm font-semibold text-navy-900">
                      密码
                    </label>
                    <a href="#" className="text-xs font-medium text-navy-600 hover:text-gold-600 transition-colors">
                      忘记密码？
                    </a>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-gold-500 transition-colors" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 bg-slate-50 text-navy-900 placeholder-slate-400 transition-all outline-none hover:border-gold-300"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-navy-900 hover:bg-navy-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-navy-900/10 hover:shadow-xl hover:shadow-navy-900/20 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
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
              <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                <p className="text-sm text-slate-600">
                  还没有账户？{' '}
                  <Link
                    to="/register"
                    className="font-bold text-navy-700 hover:text-gold-600 transition-colors"
                  >
                    立即注册
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Usage Points */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors duration-300">
            <div className="w-10 h-10 bg-gold-500/20 rounded-lg flex items-center justify-center mb-4 text-gold-400 font-bold">
              01
            </div>
            <h3 className="text-lg font-bold text-white mb-2">智能规划</h3>
            <p className="text-navy-100/70 text-sm leading-relaxed">
              基于AI的个性化学习路径定制，为每一位学生提供最适合的成长方案，提升学习效率。
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors duration-300">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 text-blue-400 font-bold">
              02
            </div>
            <h3 className="text-lg font-bold text-white mb-2">隐私安全</h3>
            <p className="text-navy-100/70 text-sm leading-relaxed">
              企业级数据加密保护，确保您的所有教育数据和个人信息安全无忧，严格的权限管理。
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors duration-300">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-4 text-green-400 font-bold">
              03
            </div>
            <h3 className="text-lg font-bold text-white mb-2">专业工具</h3>
            <p className="text-navy-100/70 text-sm leading-relaxed">
              集成简历优化、备课生成等多种专业工具，全方位辅助教育工作者的日常工作。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
