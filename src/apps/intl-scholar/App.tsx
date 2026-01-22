
import React, { useState } from 'react';
import { AppMode, ExamType, Language, PlanItem } from './types';
import { EXAMS, EXAM_GROUPS, TRANSLATIONS } from './constants';
import ExamCard from './components/ExamCard';
import StudyPlan from './components/StudyPlan';
import Courseware from './components/Courseware';
import NeedsAnalysis from './components/NeedsAnalysis';
import PlacementTest from './components/PlacementTest';
import ExamInfo from './components/ExamInfo';
import MockExam from './components/MockExam'; 
import SchoolSelection from './components/SchoolSelection'; // New Component
import { LayoutDashboard, GraduationCap, BookOpen, MessageSquare, ArrowLeft, Languages, LogOut, Info, PenTool, School } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.DASHBOARD);
  const [selectedExam, setSelectedExam] = useState<ExamType | null>(null);
  const [language, setLanguage] = useState<Language>('zh');
  
  // Shared state (Persisted across tabs)
  const [sharedPlan, setSharedPlan] = useState<PlanItem[]>([]);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [mockScore, setMockScore] = useState<string | null>(null);

  const t = TRANSLATIONS[language];

  const handleExamSelect = (exam: ExamType) => {
    setSelectedExam(exam);
    // Reset data when entering new exam
    setSharedPlan([]);
    setAnalysisResult('');
    setMockScore(null);
    
    // Special redirect for School Admission
    if (exam === ExamType.INTL_SCHOOL_ADMISSION) {
        setMode(AppMode.SCHOOL);
    } else {
        setMode(AppMode.INFO);
    }
  };

  const handleBackToDashboard = (e?: React.MouseEvent) => {
    // Prevent default event bubbling if triggered by a button
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Check if there is actual data to lose
    const hasData = (analysisResult && analysisResult.length > 0) || 
                    (sharedPlan && sharedPlan.length > 0) || 
                    (mockScore !== null);

    if (hasData) {
        // Use a slight timeout to ensure UI thread isn't blocked before confirm
        setTimeout(() => {
           const confirmed = window.confirm(
               language === 'zh' 
               ? "警告：切换考试将清除当前生成的分析报告、模考成绩和教学规划。确定要退出吗？"
               : "Warning: Switching exams will clear all current analysis, scores, and plans. Are you sure?"
           );
           if (confirmed) {
              performReset();
           }
        }, 10);
    } else {
        performReset();
    }
  };

  const performReset = () => {
    setMode(AppMode.DASHBOARD);
    setSelectedExam(null);
    setSharedPlan([]);
    setAnalysisResult('');
    setMockScore(null);
  };

  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
  };

  const NavItem = ({ m, icon: Icon, label }: { m: AppMode, icon: any, label: string }) => (
    <button
      onClick={() => handleModeChange(m)}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full transition-colors
        ${mode === m 
          ? 'bg-navy-900 text-gold-400 shadow-md' 
          : 'text-slate-600 hover:bg-navy-50 hover:text-navy-900'}
      `}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex">
      {/* Sidebar (Only visible if exam selected) */}
      {selectedExam && (
        <div className="w-64 bg-white border-r border-slate-200 p-4 flex flex-col shadow-sm fixed h-full z-10 hidden md:flex no-print">
          <div className="mb-8 px-2 flex items-center gap-2 text-navy-900">
            <GraduationCap size={28} />
            <span className="font-bold text-lg tracking-tight">Marvel Intl. Scholar</span>
          </div>

          <div className="mb-6 p-3 bg-navy-50 rounded-lg border border-navy-100">
            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Current Focus</p>
            <p className="font-bold text-navy-900 leading-tight">{selectedExam}</p>
          </div>

          <nav className="space-y-2 flex-1">
            {selectedExam === ExamType.INTL_SCHOOL_ADMISSION ? (
                // Simplified Menu for School Admission
                <>
                    <NavItem m={AppMode.SCHOOL} icon={School} label={t.school} />
                    <NavItem m={AppMode.INFO} icon={Info} label={t.info} />
                </>
            ) : (
                // Standard Menu for Exams
                <>
                    <NavItem m={AppMode.INFO} icon={Info} label={t.info} />
                    <NavItem m={AppMode.MOCK} icon={PenTool} label={t.mock} /> 
                    <NavItem m={AppMode.NEEDS} icon={MessageSquare} label={t.needs} />
                    <NavItem m={AppMode.PLAN} icon={LayoutDashboard} label={t.plan} />
                    <NavItem m={AppMode.LEARN} icon={BookOpen} label={t.learn} />
                </>
            )}
          </nav>

          <div className="mt-auto pt-4 border-t border-slate-100">
             <button 
              onClick={handleBackToDashboard}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-navy-900 px-4 py-3 w-full transition-colors hover:bg-navy-50 rounded-lg cursor-pointer"
            >
              <LogOut size={18} /> {t.back}
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${selectedExam ? 'md:ml-64' : ''}`}>
        
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-6 py-4 flex justify-between items-center shadow-sm no-print">
          <div className="flex items-center gap-3">
             {selectedExam && (
                <button 
                  onClick={handleBackToDashboard}
                  className="md:hidden text-slate-600 p-2 hover:bg-slate-100 rounded-full"
                >
                  <ArrowLeft size={20} />
                </button>
             )}
             <h1 className="text-xl font-bold text-navy-900">
               {selectedExam ? (t[mode as keyof typeof t] || mode) : t.title}
             </h1>
          </div>
          
          <div className="flex items-center gap-3">
             {selectedExam && (
                <button 
                   onClick={handleBackToDashboard}
                   className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-navy-900 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
                >
                   <span className="text-xs uppercase font-bold tracking-wider">Switch Exam</span>
                </button>
             )}
             <button 
              onClick={() => setLanguage(l => l === 'en' ? 'zh' : 'en')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-300 text-sm hover:bg-slate-50 transition-colors"
            >
              <Languages size={16} />
              <span className="font-medium">{language === 'en' ? 'English' : '中文'}</span>
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="p-6 max-w-6xl mx-auto">
          {mode === AppMode.DASHBOARD && !selectedExam && (
            <div className="animate-fade-in-up">
              <div className="text-center mb-10 mt-6">
                <h2 className="text-3xl font-extrabold text-slate-900 mb-2">{t.selectExam}</h2>
                <p className="text-slate-500">{t.subtitle}</p>
              </div>
              
              <div className="space-y-12">
                {EXAM_GROUPS.map((group) => (
                  <div key={group.id} className="bg-white/50 rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-700 border-l-4 border-navy-500 pl-3 mb-6 flex items-center gap-2">
                       {t[group.titleKey as keyof typeof t]}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {group.exams.map((examId) => {
                         const examData = EXAMS.find(e => e.id === examId);
                         if (!examData) return null;
                         
                         const displayLabel = language === 'zh' 
                           ? `${examData.label} ${examData.labelZh}` 
                           : examData.label;

                         return (
                           <ExamCard 
                             key={examData.id} 
                             id={examData.id}
                             label={displayLabel}
                             icon={examData.icon}
                             selected={false} 
                             onClick={handleExamSelect} 
                           />
                         );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedExam && (
            <div className="animate-fade-in">
              {mode === AppMode.SCHOOL && (
                  <SchoolSelection 
                    exam={selectedExam}
                    language={language}
                    onBack={handleBackToDashboard}
                  />
              )}
              {mode === AppMode.INFO && (
                <ExamInfo 
                   exam={selectedExam} 
                   language={language} 
                />
              )}
              {mode === AppMode.MOCK && (
                 <MockExam 
                    exam={selectedExam} 
                    onScoreComplete={setMockScore}
                    onScoreClear={() => setMockScore(null)}
                    existingScore={mockScore}
                 />
              )}
              {mode === AppMode.NEEDS && (
                <NeedsAnalysis 
                  exam={selectedExam} 
                  language={language} 
                  onAnalysisComplete={setAnalysisResult}
                  onBack={handleBackToDashboard}
                  initialReport={analysisResult}
                  importedScore={mockScore}
                />
              )}
              {mode === AppMode.PLAN && (
                <StudyPlan 
                  exam={selectedExam} 
                  language={language} 
                  plan={sharedPlan} 
                  setPlan={setSharedPlan}
                  analysisResult={analysisResult} 
                  onBack={handleBackToDashboard}
                />
              )}
              {mode === AppMode.LEARN && (
                <Courseware 
                  exam={selectedExam} 
                  language={language} 
                  plan={sharedPlan} 
                  onBack={handleBackToDashboard}
                />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
