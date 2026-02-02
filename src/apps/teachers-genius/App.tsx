import React, { useState } from 'react';
import { GeneralChat } from './components/GeneralChat';
import { CaseDiagnosis } from './components/CaseDiagnosis';
import { LiveCopilot } from './components/LiveCopilot';
import { LessonPlanner } from './components/LessonPlanner';
import { TeachingToolbox } from './components/TeachingToolbox';
import { MessageSquare, GraduationCap, Zap, FileText, Bot, Layers, BookOpen, Menu, X } from 'lucide-react';
import { TONE_OPTIONS } from './constants';

type Tab = 'toolbox' | 'chat' | 'planner' | 'diagnosis' | 'live';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('toolbox');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Shared State
  const [importedAudio, setImportedAudio] = useState<{data: string, name: string} | null>(null);
  const [globalTones, setGlobalTones] = useState<string[]>([TONE_OPTIONS[0].value]);

  const handleImportAudio = (audioData: string) => {
    setImportedAudio({
      data: audioData,
      name: `Live_Class_${new Date().toLocaleString()}.wav`
    });
    setActiveTab('diagnosis');
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false); // Close menu on mobile after selection
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'toolbox': return <TeachingToolbox />;
      case 'chat': return <GeneralChat globalTones={globalTones} setGlobalTones={setGlobalTones} />;
      case 'planner': return <LessonPlanner globalTones={globalTones} />;
      case 'diagnosis': return <CaseDiagnosis importedAudio={importedAudio} onClearImport={() => setImportedAudio(null)} globalTones={globalTones} setGlobalTones={setGlobalTones} />;
      case 'live': return <LiveCopilot onSaveAndAnalyze={handleImportAudio} globalTones={globalTones} setGlobalTones={setGlobalTones} />;
      default: return <TeachingToolbox />;
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'toolbox': return 'Teaching Methodology';
      case 'chat': return 'Teacher Q&A Assistant';
      case 'planner': return 'Lesson Material Generator';
      case 'diagnosis': return 'Teaching Quality Diagnosis';
      case 'live': return 'Live Class Copilot';
    }
  };

  const NavButton = ({ tab, icon: Icon, label, subLabel }: { tab: Tab, icon: any, label: string, subLabel: string }) => (
    <button 
      onClick={() => handleTabChange(tab)} 
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === tab ? 'bg-navy-800 text-white shadow-lg border-l-4 border-gold-500' : 'text-navy-200 hover:bg-navy-800'}`}
    >
      <Icon size={20} className={activeTab === tab ? 'text-gold-400' : ''} />
      <div className="text-left">
        <div className="font-medium text-sm md:text-base">{label}</div>
        <div className={`text-[10px] ${activeTab === tab ? 'text-gold-200/80' : 'text-navy-400'}`}>{subLabel}</div>
      </div>
    </button>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-navy-50 text-navy-900 font-sans">
      
      {/* Mobile Top Header (Fixed) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-navy-950 text-white z-50 flex items-center justify-between px-4 shadow-md">
         <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-gold-400" />
            <span className="font-bold text-lg tracking-tight">ME Genius</span>
         </div>
         <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-navy-200 hover:text-white focus:outline-none">
            {isMobileMenuOpen ? <X size={24}/> : <Menu size={24}/>}
         </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Responsive: Drawer on Mobile, Static on Desktop) */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-72 bg-navy-950 text-white h-full shadow-2xl flex-shrink-0 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-navy-800 pt-20 md:pt-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-navy-800 rounded-xl flex items-center justify-center border border-navy-700 shadow-inner">
               <GraduationCap className="w-6 h-6 text-gold-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">ME Teachers</h1>
              <p className="text-xs text-gold-500/80 font-medium">Teaching Genius v2.0</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <NavButton tab="toolbox" icon={BookOpen} label="Teaching Toolbox" subLabel="Methodology & Activities" />
          <NavButton tab="chat" icon={MessageSquare} label="Smart Q&A" subLabel="Ask the Academic Director" />
          <NavButton tab="planner" icon={Layers} label="Lesson Planner" subLabel="Generate Materials" />
          <NavButton tab="diagnosis" icon={FileText} label="Class Diagnosis" subLabel="Analyze Audio/Screenshots" />
          <NavButton tab="live" icon={Zap} label="Live Copilot" subLabel="Real-time Hints" />
        </div>
        
        <div className="p-4 border-t border-navy-800 text-xs text-slate-500 text-center">
           &copy; 2024 Marvellous Education
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full w-full relative pt-16 md:pt-0 overflow-hidden">
         <div className="flex-1 flex flex-col h-full w-full max-w-7xl mx-auto md:p-6 p-2 overflow-hidden">
            
            {/* Desktop Header Title - Explicitly flex-shrink-0 to prevent overlapping */}
            <header className="mb-4 flex-shrink-0 hidden md:block px-1">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                 {getTitle()}
              </h2>
            </header>
            
            {/* Content Container - Ensure Flex Grow and Overflow Handling */}
            <div className="flex-1 overflow-hidden relative rounded-2xl bg-white shadow-sm border border-slate-200 md:bg-transparent md:border-none md:shadow-none">
               <div className="absolute inset-0 overflow-hidden flex flex-col">
                 {renderContent()}
               </div>
            </div>
         </div>
      </main>
    </div>
  );
};

export default App;
