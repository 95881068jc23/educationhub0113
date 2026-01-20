import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GraduationCap, LogIn, LogOut, User, Menu, X, Shield, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useState } from 'react';

export const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const handleLogout = (): void => {
    logout();
    navigate('/');
  };

  // 在登录和注册页面不显示导航栏
  if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  return (
    <nav className="bg-navy-900 border-b border-navy-800 sticky top-0 z-50 shadow-lg shadow-navy-900/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/home" className="flex items-center gap-2 hover:opacity-80 transition-opacity group">
            <div className="bg-gradient-to-br from-gold-400 to-gold-600 p-2 rounded-lg shadow-lg shadow-gold-500/20 group-hover:shadow-gold-500/40 transition-shadow">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-white tracking-tight">
                Marvel Education Hub
              </h1>
              <p className="text-xs text-navy-200 font-medium tracking-wide">AI-Powered Education Platform</p>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            {isAuthenticated ? (
              <>
                {/* Audit Status Badge */}
                {user && user.auditStatus !== 1 && (
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                    user.auditStatus === 0
                      ? 'bg-gold-500/10 border-gold-500/30 text-gold-400'
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}>
                    {user.auditStatus === 0 ? (
                      <>
                        <Clock className="w-3 h-3" />
                        <span>Pending</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        <span>Rejected</span>
                      </>
                    )}
                  </div>
                )}
                {user && user.auditStatus === 1 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 border border-green-500/30 text-green-400">
                    <CheckCircle className="w-3 h-3" />
                    <span>Verified</span>
                  </div>
                )}
                {/* Admin Panel Link */}
                {user && user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 px-4 py-2 bg-navy-800 hover:bg-navy-700 border border-navy-700 text-white rounded-lg transition-all font-medium hover:border-gold-500/50 hover:text-gold-400"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin</span>
                  </Link>
                )}
                <div className="flex items-center gap-3 px-4 py-2 bg-navy-800 border border-navy-700 rounded-lg">
                  <div className="w-8 h-8 bg-navy-700 rounded-full flex items-center justify-center ring-1 ring-navy-600">
                    <User className="w-4 h-4 text-gold-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{user?.name}</p>
                    <p className="text-xs text-navy-300">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-navy-300 hover:text-white hover:bg-navy-800 rounded-lg transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/"
                className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-lg transition-all font-medium shadow-lg shadow-gold-500/20 hover:shadow-gold-500/30"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-navy-200 hover:text-white hover:bg-navy-800 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-navy-800 bg-navy-900">
            {isAuthenticated ? (
              <div className="space-y-3">
                {/* Audit Status Badge */}
                {user && user.auditStatus !== 1 && (
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border ${
                    user.auditStatus === 0
                      ? 'bg-gold-500/10 border-gold-500/30 text-gold-400'
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}>
                    {user.auditStatus === 0 ? (
                      <>
                        <Clock className="w-4 h-4" />
                        <span>Pending Verification</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span>Verification Failed</span>
                      </>
                    )}
                  </div>
                )}
                {user && user.auditStatus === 1 && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-500/10 border border-green-500/30 text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span>Account Verified</span>
                  </div>
                )}
                {/* Admin Panel Link */}
                {user && user.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 w-full px-4 py-3 bg-navy-800 text-white rounded-lg font-medium"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin Dashboard</span>
                  </Link>
                )}
                <div className="flex items-center gap-3 px-4 py-3 bg-navy-800 rounded-lg mx-2">
                  <div className="w-10 h-10 bg-navy-700 rounded-full flex items-center justify-center ring-1 ring-navy-600">
                    <User className="w-5 h-5 text-gold-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{user?.name}</p>
                    <p className="text-xs text-navy-300">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-navy-300 hover:text-white hover:bg-navy-800 rounded-lg transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gold-500 hover:bg-gold-600 text-white rounded-lg transition-colors font-medium shadow-md"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
