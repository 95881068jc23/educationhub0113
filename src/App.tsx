import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, BookOpen, FileText, UserCheck, MessageSquare, Briefcase } from 'lucide-react';
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
      color: 'bg-cyan-600',
      path: '/planner',
      identities: ['consultant'] as ('consultant' | 'teacher')[] // 顾问身份
    },
    {
      id: 'cv-pro',
      name: 'GlobalCV Pro',
      nameCn: '智能履历优化大师',
      description: 'AI-powered resume optimization and career consulting.',
      icon: <FileText className="w-8 h-8 text-white" />,
      color: 'bg-blue-600',
      path: '/cv-pro',
      identities: ['consultant', 'teacher'] as ('consultant' | 'teacher')[] // 顾问和教师都可以访问
    },
    {
      id: 'lesson-generator',
      name: 'Lesson Generator',
      nameCn: '英语备课生成器',
      description: 'Automated lesson plan and material generation.',
      icon: <GraduationCap className="w-8 h-8 text-white" />,
      color: 'bg-purple-600',
      path: '/lesson-generator',
      identities: ['teacher'] as ('consultant' | 'teacher')[] // 教师身份
    },
    {
      id: 'intl-scholar',
      name: 'Intl. Scholar',
      nameCn: '麦迩威国际智学',
      description: 'Comprehensive study abroad preparation and testing.',
      icon: <UserCheck className="w-8 h-8 text-white" />,
      color: 'bg-indigo-600',
      path: '/intl-scholar',
      identities: ['consultant'] as ('consultant' | 'teacher')[] // 顾问身份
    },
    {
      id: 'sales-genius',
      name: 'Sales Genius',
      nameCn: '销售百宝箱',
      description: 'AI sales assistant and training simulator.',
      icon: <Briefcase className="w-8 h-8 text-white" />,
      color: 'bg-orange-600',
      path: '/sales-genius',
      identities: ['consultant'] as ('consultant' | 'teacher')[] // 顾问身份
    },
    {
      id: 'teachers-genius',
      name: 'Teachers Genius',
      nameCn: '教师百宝箱',
      description: 'Professional development and teaching resources.',
      icon: <MessageSquare className="w-8 h-8 text-white" />,
      color: 'bg-violet-600',
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
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-brand-100/40 rounded-full blur-[120px] opacity-60"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-50/60 rounded-full blur-[100px] opacity-60"></div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center p-8 lg:p-12">
          {/* Hero Section */}
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <span className="inline-block py-1 px-3 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold tracking-wide uppercase mb-4">
              Welcome to Marvel Education
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-slate-900 mb-6 tracking-tight leading-tight">
              赋能教育，<br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-500">点亮未来的智慧之光</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed">
              Empowering education with AI-driven tools for students, teachers, and professionals.
            </p>
          </div>

          {apps.length === 0 ? (
            <div className="text-center py-16 px-8 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 max-w-lg mx-auto">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                 <UserCheck className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">等待分配身份</h3>
              <p className="text-slate-500 mb-6">您还没有被分配身份，请联系管理员。审核通过后，管理员会为您分配相应的身份权限。</p>
              <button className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors">
                联系支持
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl w-full px-4">
              {apps.map((app) => (
              <Link 
                key={app.id} 
                to={app.path}
                className="group relative bg-white rounded-3xl shadow-sm hover:shadow-xl hover:shadow-brand-900/5 transition-all duration-300 overflow-hidden border border-slate-100 flex flex-col h-full"
              >
                <div className="p-8 flex flex-col h-full relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className={`w-14 h-14 ${app.color} rounded-2xl flex items-center justify-center shadow-lg shadow-brand-900/5 group-hover:scale-110 transition-transform duration-300`}>
                      {React.cloneElement(app.icon as React.ReactElement<{ className?: string }>, { className: "w-7 h-7 text-white" })}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-brand-50 transition-colors">
                      <svg className="w-4 h-4 text-slate-400 group-hover:text-brand-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-brand-600 transition-colors">{app.name}</h3>
                  <div className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">{app.nameCn}</div>
                  
                  <p className="text-slate-600 leading-relaxed text-sm flex-grow">
                    {app.description}
                  </p>
                </div>
                
                {/* Decorative Bottom Gradient Line */}
                <div className={`h-1.5 w-full ${app.color} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
              </Link>
              ))}
            </div>
          )}

          <footer className="mt-20 text-center border-t border-slate-200/60 pt-8 w-full max-w-7xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
               <p>&copy; 2026 Marvellous Education. All rights reserved.</p>
               <div className="flex gap-6">
                 <a href="#" className="hover:text-slate-800 transition-colors">Privacy</a>
                 <a href="#" className="hover:text-slate-800 transition-colors">Terms</a>
                 <a href="#" className="hover:text-slate-800 transition-colors">Contact</a>
               </div>
            </div>
          </footer>
        </div>
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
