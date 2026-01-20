import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, BookOpen, FileText, UserCheck, MessageSquare, Briefcase, ArrowRight, Star, Sparkles } from 'lucide-react';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuditedRoute } from './components/auth/AuditedRoute';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { Navbar } from './components/Navbar';
import { AdminPanel } from './pages/Admin/AdminPanel';
import { useAuth } from './contexts/AuthContext';

// Placeholders for Apps (We will implement these later)
const PlannerApp = React.lazy(() => import('./apps/planner/App'));
const CVProApp = React.lazy(() => import('./apps/cv-pro/App'));
const LessonGeneratorApp = React.lazy(() => import('./apps/lesson-generator/App'));
const IntlScholarApp = React.lazy(() => import('./apps/intl-scholar/App'));
const SalesGeniusApp = React.lazy(() => import('./apps/sales-genius/App'));
const TeachersGeniusApp = React.lazy(() => import('./apps/teachers-genius/App'));

const LandingPage = () => {
  const { user } = useAuth();
  
  // 根据用户身份过滤应用
  const allApps = [
    {
      id: 'planner',
      name: 'Marvellous Planner',
      nameCn: '课程规划系统',
      description: 'Intelligent course planning for personalized learning paths.',
      icon: <BookOpen className="w-8 h-8 text-white" />,
      color: 'bg-navy-900',
      gradient: 'from-navy-900 to-navy-800',
      path: '/planner',
      identities: ['consultant'] as ('consultant' | 'teacher')[] // 顾问身份
    },
    {
      id: 'cv-pro',
      name: 'GlobalCV Pro',
      nameCn: '智能履历优化大师',
      description: 'AI-powered resume optimization and career consulting.',
      icon: <FileText className="w-8 h-8 text-white" />,
      color: 'bg-navy-800',
      gradient: 'from-navy-800 to-navy-700',
      path: '/cv-pro',
      identities: ['consultant', 'teacher'] as ('consultant' | 'teacher')[] // 顾问和教师都可以访问
    },
    {
      id: 'lesson-generator',
      name: 'Lesson Generator',
      nameCn: '英语备课生成器',
      description: 'Automated lesson plan and material generation.',
      icon: <GraduationCap className="w-8 h-8 text-white" />,
      color: 'bg-gold-600',
      gradient: 'from-gold-600 to-gold-500',
      path: '/lesson-generator',
      identities: ['teacher'] as ('consultant' | 'teacher')[] // 教师身份
    },
    {
      id: 'intl-scholar',
      name: 'Intl. Scholar',
      nameCn: '麦迩威国际智学',
      description: 'Comprehensive study abroad preparation and testing.',
      icon: <UserCheck className="w-8 h-8 text-white" />,
      color: 'bg-navy-700',
      gradient: 'from-navy-700 to-navy-600',
      path: '/intl-scholar',
      identities: ['consultant'] as ('consultant' | 'teacher')[] // 顾问身份
    },
    {
      id: 'sales-genius',
      name: 'Sales Genius',
      nameCn: '销售百宝箱',
      description: 'AI sales assistant and training simulator.',
      icon: <Briefcase className="w-8 h-8 text-white" />,
      color: 'bg-gold-500',
      gradient: 'from-gold-500 to-gold-400',
      path: '/sales-genius',
      identities: ['consultant'] as ('consultant' | 'teacher')[] // 顾问身份
    },
    {
      id: 'teachers-genius',
      name: 'Teachers Genius',
      nameCn: '教师百宝箱',
      description: 'Professional development and teaching resources.',
      icon: <MessageSquare className="w-8 h-8 text-white" />,
      color: 'bg-navy-600',
      gradient: 'from-navy-600 to-navy-500',
      path: '/teachers-genius',
      identities: ['teacher'] as ('consultant' | 'teacher')[] // 教师身份
    }
  ];

  // 根据用户身份过滤应用（支持多选身份）
  const apps = user && user.identity
    ? allApps.filter((app) => {
        // 兼容旧数据：如果是字符串，转换为数组
        let userIdentities: ('consultant' | 'teacher')[] = [];
        if (typeof user.identity === 'string') {
          userIdentities = [user.identity];
        } else if (Array.isArray(user.identity)) {
          userIdentities = user.identity;
        }
        
        // 如果用户拥有该应用所需的任一身份，就显示该应用
        return app.identities.some((requiredId) => userIdentities.includes(requiredId));
      })
    : [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative bg-navy-900 text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-[50%] -left-[20%] w-[80%] h-[150%] bg-navy-800/30 rounded-full blur-3xl transform rotate-12"></div>
          <div className="absolute top-[20%] -right-[10%] w-[60%] h-[120%] bg-gold-500/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/20 border border-gold-500/30 text-gold-400 text-sm font-medium mb-6"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Education Platform</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold mb-6 tracking-tight leading-tight"
            >
              Welcome to <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-400 to-gold-500">
                Marvel Education Hub
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-navy-100/80 max-w-2xl leading-relaxed"
            >
              Empowering consultants and teachers with intelligent tools for course planning, 
              sales optimization, and professional development.
            </motion.p>
          </div>
        </div>
      </div>

      {/* Apps Grid */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10 pb-20">
        {apps.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-slate-100">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Access Assigned</h3>
            <p className="text-slate-600 mb-6">You haven't been assigned any roles yet.</p>
            <p className="text-sm text-slate-500">Please contact the administrator to request access.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {apps.map((app, index) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
            >
              <Link 
                to={app.path}
                className="group relative block h-full bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-100 hover:border-gold-500/30 transform hover:-translate-y-2"
              >
                <div className={`h-2 bg-gradient-to-r ${app.gradient}`}></div>
                <div className="p-8">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${app.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {app.icon}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-navy-900 mb-1 group-hover:text-gold-600 transition-colors">
                    {app.name}
                  </h3>
                  <div className="text-sm font-medium text-slate-500 mb-4 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-gold-500"></span>
                    {app.nameCn}
                  </div>
                  
                  <p className="text-slate-600 leading-relaxed mb-6">
                    {app.description}
                  </p>
                  
                  <div className="flex items-center text-gold-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                    Enter Application <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
                
                {/* Decorative background icon */}
                <div className="absolute -bottom-4 -right-4 opacity-5 transform rotate-12 group-hover:rotate-0 group-hover:scale-110 transition-all duration-500">
                  {React.cloneElement(app.icon as React.ReactElement<{ className?: string }>, { className: "w-32 h-32 text-navy-900" })}
                </div>
              </Link>
            </motion.div>
            ))}
          </div>
        )}

        <footer className="mt-16 text-center text-slate-400 text-sm">
          <p>&copy; 2026 Marvellous Education. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

const App = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes - Home Page */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <LandingPage />
            </ProtectedRoute>
          }
        />
        
        {/* Protected Routes - Admin Panel */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        
        {/* Protected Routes - Gemini Chat Apps (Require Authentication + Audit) */}
        <Route
          path="/sales-genius/*"
          element={
            <ProtectedRoute>
              <AuditedRoute>
                <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading Sales Genius...</div>}>
                  <SalesGeniusApp />
                </React.Suspense>
              </AuditedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teachers-genius/*"
          element={
            <ProtectedRoute>
              <AuditedRoute>
                <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading Teachers Genius...</div>}>
                  <TeachersGeniusApp />
                </React.Suspense>
              </AuditedRoute>
            </ProtectedRoute>
          }
        />
        
        {/* Public App Routes */}
        <Route path="/planner/*" element={
          <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading Planner...</div>}>
            <PlannerApp />
          </React.Suspense>
        } />
        <Route path="/cv-pro/*" element={
          <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading CV Pro...</div>}>
            <CVProApp />
          </React.Suspense>
        } />
        <Route path="/lesson-generator/*" element={
          <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading Lesson Generator...</div>}>
            <LessonGeneratorApp />
          </React.Suspense>
        } />
        <Route path="/intl-scholar/*" element={
          <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading Intl Scholar...</div>}>
            <IntlScholarApp />
          </React.Suspense>
        } />
      </Routes>
    </AnimatePresence>
  );
};

export default App;
