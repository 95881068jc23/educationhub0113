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
    <div className="min-h-screen w-full flex bg-slate-50 overflow-hidden font-sans">
      {/* Left Side - Feature Introduction */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-50 overflow-hidden flex-col p-12 text-slate-900 border-r border-slate-200">
        {/* Background Gradients/Blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
           <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-200/30 rounded-full blur-[100px] animate-blob"></div>
           <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-200/30 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
           <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-purple-200/30 rounded-full blur-[80px] animate-blob animation-delay-4000"></div>
        </div>

        {/* Logo */}
        <div className="relative z-10 flex-none">
          <div className="flex items-center gap-3">
            <div className="bg-white/80 backdrop-blur-md p-2.5 rounded-xl border border-slate-200 shadow-sm">
              <GraduationCap className="w-6 h-6 text-brand-600" />
            </div>
            <span className="text-xl font-bold tracking-wide text-slate-900">Marvel Education</span>
          </div>
        </div>

        {/* Main Content - Centered */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <div className="max-w-md">
            <h2 className="text-4xl font-serif font-bold mb-6 leading-tight text-slate-900">
              开启您的<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">智慧教育之旅</span>
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed mb-8 font-light">
              在一个宁静的空间里，探索AI驱动的教育工具。从课程规划到学生评估，我们为您提供全方位的支持，让教育回归本质。
            </p>
            
            <div className="space-y-4">
               <div className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm hover:shadow-md transition-all">
                 <div className="bg-brand-50 p-3 rounded-xl">
                   <GraduationCap className="w-6 h-6 text-brand-600" />
                 </div>
                 <div>
                   <h3 className="font-semibold text-slate-900">智能规划</h3>
                   <p className="text-sm text-slate-500">个性化的学习与教学路径</p>
                 </div>
               </div>
               
               <div className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm hover:shadow-md transition-all">
                 <div className="bg-indigo-50 p-3 rounded-xl">
                   <Mail className="w-6 h-6 text-indigo-600" />
                 </div>
                 <div>
                   <h3 className="font-semibold text-slate-900">高效沟通</h3>
                   <p className="text-sm text-slate-500">连接教师、学生与家长的桥梁</p>
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* Footer/Quote */}
        <div className="relative z-10 flex-none">
           <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-sm max-w-sm">
             <p className="text-slate-600 italic mb-4 font-serif">"教育不是注满一桶水，而是点燃一把火。"</p>
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">W</div>
                <div>
                  <p className="font-semibold text-sm text-slate-900">William Butler Yeats</p>
                  <p className="text-xs text-slate-500">Poet</p>
                </div>
             </div>
           </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative">
         {/* Decorative elements for right side */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full blur-3xl mix-blend-multiply opacity-60 pointer-events-none"></div>
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl mix-blend-multiply opacity-60 pointer-events-none"></div>

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-2xl mb-4 shadow-lg">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Marvel Education</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">欢迎回来</h2>
            <p className="text-slate-500">请输入您的账号信息以登录</p>
          </div>

          {/* Login Form Container */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 lg:p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-fadeIn">
                  <span className="font-medium">错误：</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Audit Status Message */}
              {isAuthenticated && user && (
                <div className={`px-4 py-3 rounded-xl text-sm ${
                  user.auditStatus === 1 
                    ? 'bg-green-50 border border-green-100 text-green-700' 
                    : user.auditStatus === 2
                    ? 'bg-red-50 border border-red-100 text-red-700'
                    : 'bg-yellow-50 border border-yellow-100 text-yellow-700'
                }`}>
                  <span className="font-medium">
                    {user.auditStatus === 1 
                      ? '✓ 审核已通过' 
                      : user.auditStatus === 2
                      ? '✗ 审核已拒绝'
                      : '⏳ 待审核中'}
                  </span>
                  {user.auditStatus === 0 && (
                    <p className="mt-1 text-xs opacity-80">您的账户正在审核中，审核通过后即可使用全部功能</p>
                  )}
                  {user.auditStatus === 2 && (
                    <p className="mt-1 text-xs opacity-80">您的账户审核未通过，请联系管理员</p>
                  )}
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                  邮箱地址
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-brand-600">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900 placeholder-slate-400 transition-all outline-none"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                   <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                     密码
                   </label>
                   <a href="#" className="text-xs font-medium text-brand-600 hover:text-brand-700">忘记密码？</a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-brand-600">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900 placeholder-slate-400 transition-all outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-brand-200 hover:shadow-xl hover:shadow-brand-300/50 transition-all duration-200 flex items-center justify-center gap-2 transform active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>登录中...</span>
                  </>
                ) : (
                  <span>立即登录</span>
                )}
              </button>
            </form>

            {/* Register Link */}
            <div className="mt-8 text-center">
              <p className="text-sm text-slate-600">
                还没有账户？{' '}
                <Link
                  to="/register"
                  className="font-semibold text-brand-600 hover:text-brand-700 transition-colors relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-brand-600 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left"
                >
                  注册新账户
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
             <div className="flex items-center justify-center gap-6 text-sm text-slate-400">
                <a href="#" className="hover:text-slate-600 transition-colors">隐私政策</a>
                <a href="#" className="hover:text-slate-600 transition-colors">服务条款</a>
                <a href="#" className="hover:text-slate-600 transition-colors">帮助中心</a>
             </div>
             <p className="mt-4 text-xs text-slate-400">&copy; 2026 Marvellous Education. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
