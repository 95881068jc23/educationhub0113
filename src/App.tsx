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
      color: 'bg-emerald-600',
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
      color: 'bg-teal-600',
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Marvel Education Hub
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Empowering education with AI-driven tools for students, teachers, and professionals.
          </p>
        </div>

        {apps.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-slate-600 mb-4">您还没有被分配身份，请联系管理员</p>
            <p className="text-sm text-slate-500">审核通过后，管理员会为您分配相应的身份权限</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl w-full">
            {apps.map((app) => (
            <Link 
              key={app.id} 
              to={app.path}
              className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 transform hover:-translate-y-1"
            >
              <div className={`absolute top-0 left-0 w-2 h-full ${app.color}`}></div>
              <div className="p-8">
                <div className={`w-14 h-14 ${app.color} rounded-xl flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform`}>
                  {app.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{app.name}</h3>
                <div className="text-sm font-medium text-gray-500 mb-3">{app.nameCn}</div>
                <p className="text-gray-600 leading-relaxed">
                  {app.description}
                </p>
              </div>
              <div className="absolute bottom-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                 <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </div>
            </Link>
            ))}
          </div>
        )}

        <footer className="mt-16 text-center text-gray-400 text-sm">
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
