import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, ArrowLeft, CheckCircle, GraduationCap } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsSubmitted(true);
    } catch (err) {
      setError('发送请求失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 overflow-hidden font-sans">
      {/* Left Side - Feature Introduction (Same as Login) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-50 overflow-hidden flex-col justify-center items-center p-12 xl:p-16 2xl:p-24 text-slate-900 border-r border-slate-200">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
           <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-200/30 rounded-full blur-[100px] animate-blob"></div>
           <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-200/30 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
        </div>

        <div className="absolute top-8 left-8 xl:top-12 xl:left-12 z-20">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="bg-white/80 backdrop-blur-md p-2.5 rounded-xl border border-slate-200 shadow-sm">
              <GraduationCap className="w-6 h-6 text-brand-600" />
            </div>
            <span className="text-xl font-bold tracking-wide text-slate-900">Marvel Education</span>
          </Link>
        </div>

        <div className="relative z-10 w-full max-w-lg xl:max-w-xl">
            <h2 className="text-4xl xl:text-5xl font-serif font-bold mb-6 xl:mb-8 leading-tight text-slate-900">
              安全找回<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">您的账户访问权限</span>
            </h2>
            <p className="text-slate-600 text-lg xl:text-xl leading-relaxed mb-8 xl:mb-12 font-light">
              我们重视您的账户安全。通过简单的几步验证，即可快速重置密码，重新开启您的智慧教育之旅。
            </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full blur-3xl mix-blend-multiply opacity-60 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl mix-blend-multiply opacity-60 pointer-events-none"></div>

        <div className="w-full max-w-md relative z-10">
          {/* Mobile Header */}
          <div className="text-center mb-8 lg:hidden">
            <Link to="/" className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-2xl mb-4 shadow-lg">
              <GraduationCap className="w-8 h-8 text-white" />
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">Marvel Education</h1>
          </div>

          <div className="mb-8">
            <Link to="/" className="inline-flex items-center text-sm text-slate-500 hover:text-brand-600 transition-colors mb-6 group">
              <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
              返回登录
            </Link>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">重置密码</h2>
            <p className="text-slate-500">
              {isSubmitted ? '邮件发送成功' : '请输入您的注册邮箱以获取重置链接'}
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 lg:p-10">
            {isSubmitted ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">已发送重置说明</h3>
                <p className="text-slate-600 mb-6">
                  如果该邮箱 <strong>{email}</strong> 已在系统注册，我们已向其发送了密码重置说明。
                </p>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-left mb-6">
                  <p className="text-sm text-blue-800 font-medium mb-1">提示：</p>
                  <p className="text-xs text-blue-600">
                    当前为演示/本地系统，无法实际发送邮件。请联系系统管理员 <strong>(admin@admin.com)</strong> 重置您的密码，或使用默认管理员账号登录。
                  </p>
                </div>
                <Link 
                  to="/" 
                  className="block w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 text-center"
                >
                  返回登录页面
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

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
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900 placeholder-slate-400 transition-all outline-none"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-brand-200 hover:shadow-xl hover:shadow-brand-300/50 transition-all duration-200 flex items-center justify-center gap-2 transform active:scale-[0.98]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>发送中...</span>
                    </>
                  ) : (
                    <span>发送重置链接</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
