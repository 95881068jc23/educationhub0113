
import React, { useState } from 'react';
import { GeneralChat } from './components/GeneralChat';
import { CaseDiagnosis } from './components/CaseDiagnosis';
import { LiveCopilot } from './components/LiveCopilot';
import { ValueGenerator } from './components/ValueGenerator';
import { AdvisoryProcess } from './components/AdvisoryProcess';
import { SalesSimulation } from './components/SalesSimulation';
import { MessageSquare, Menu, X, GraduationCap, Zap, FileText, Gift, ClipboardList, Bot } from 'lucide-react';
import { TONE_OPTIONS } from './constants';

type Tab = 'process' | 'chat' | 'value' | 'diagnosis' | 'live' | 'simulation';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('process');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Shared State
  const [importedAudio, setImportedAudio] = useState<{data: string, name: string} | null>(null);
  const [globalTones, setGlobalTones] = useState<string[]>([TONE_OPTIONS[0].value]);

  const handleImportAudio = (audioData: string) => {
    setImportedAudio({
      data: audioData,
      name: `实时录音_${new Date().toLocaleString()}.webm`
    });
    setActiveTab('diagnosis');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'process': return <AdvisoryProcess />;
      case 'chat': return <GeneralChat globalTones={globalTones} setGlobalTones={setGlobalTones} />;
      case 'value': return <ValueGenerator />;
      case 'diagnosis': return <CaseDiagnosis importedAudio={importedAudio} onClearImport={() => setImportedAudio(null)} globalTones={globalTones} setGlobalTones={setGlobalTones} />;
      case 'live': return <LiveCopilot onSaveAndAnalyze={handleImportAudio} globalTones={globalTones} setGlobalTones={setGlobalTones} />;
      case 'simulation': return <SalesSimulation />;
      default: return <AdvisoryProcess />;
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'process': return '顾问咨询标准流程 SOP';
      case 'chat': return '麦迩威智能问答 (售前/售后)';
      case 'value': return '价值赋能锦囊 (给客户)';
      case 'diagnosis': return '案例深度诊断复盘';
      case 'live': return '实时销售建议 (Live)';
      case 'simulation': return 'AI 模拟谈单训练';
    }
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-slate-50 overscroll-none">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-navy-900 text-white h-full shadow-xl z-20 flex-shrink-0">
        <div className="p-6 border-b border-navy-800">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-gold-400" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">ME Magic Box</h1>
              <p className="text-xs text-navy-200">成交百宝箱 Pro</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button 
            onClick={() => setActiveTab('process')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'process' ? 'bg-navy-700 text-white shadow-lg' : 'text-slate-300 hover:bg-navy-800'}`}
          >
            <ClipboardList size={20} />
            <div className="text-left">
              <div className="font-medium">咨询流程 SOP</div>
              <div className="text-[10px] text-slate-400">上半场挖需 / 下半场成交</div>
            </div>
          </button>

          <button 
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'chat' ? 'bg-navy-700 text-white shadow-lg' : 'text-slate-300 hover:bg-navy-800'}`}
          >
            <MessageSquare size={20} />
            <div className="text-left">
              <div className="font-medium">智能问答 Q&A</div>
              <div className="text-[10px] text-slate-400">售前攻单 / 售后服务</div>
            </div>
          </button>

           <button 
            onClick={() => setActiveTab('value')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'value' ? 'bg-gold-600 text-white shadow-lg' : 'text-slate-300 hover:bg-navy-800'}`}
          >
            <Gift size={20} />
            <div className="text-left">
              <div className="font-medium">价值赋能锦囊</div>
              <div className="text-[10px] text-slate-400">生成客户行业资料</div>
            </div>
          </button>

          <button 
            onClick={() => setActiveTab('diagnosis')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'diagnosis' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <FileText size={20} />
            <div className="text-left">
              <div className="font-medium">案例 AI 复盘</div>
              <div className="text-[10px] text-slate-400">录音/截图 深度分析</div>
            </div>
          </button>
          
          <button 
            onClick={() => setActiveTab('live')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'live' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <Zap size={20} />
            <div className="text-left">
              <div className="font-medium">实时建议 Live</div>
              <div className="text-[10px] text-slate-400">实时话术提醒</div>
            </div>
          </button>

          <button 
            onClick={() => setActiveTab('simulation')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'simulation' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <Bot size={20} />
            <div className="text-left">
              <div className="font-medium">模拟谈单训练</div>
              <div className="text-[10px] text-slate-400">AI 客户实战演练</div>
            </div>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
           <p className="text-xs text-slate-500 text-center">© 2024 Marvellous Education</p>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-slate-900 text-white z-50 h-14 flex items-center justify-between px-4 shadow-md">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-blue-400" />
          <span className="font-bold text-sm">ME Magic Box</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900 z-40 pt-16 px-4 space-y-3 overflow-y-auto">
           <button 
            onClick={() => { setActiveTab('process'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base ${activeTab === 'process' ? 'bg-blue-600' : 'bg-slate-800'} text-white`}
          >
            <ClipboardList size={18} /> 咨询流程 SOP
          </button>
           <button 
            onClick={() => { setActiveTab('chat'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base ${activeTab === 'chat' ? 'bg-blue-600' : 'bg-slate-800'} text-white`}
          >
            <MessageSquare size={18} /> 智能问答 Q&A
          </button>
          <button 
            onClick={() => { setActiveTab('value'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base ${activeTab === 'value' ? 'bg-purple-600' : 'bg-slate-800'} text-white`}
          >
            <Gift size={18} /> 价值赋能锦囊
          </button>
          <button 
            onClick={() => { setActiveTab('diagnosis'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base ${activeTab === 'diagnosis' ? 'bg-blue-600' : 'bg-slate-800'} text-white`}
          >
            <FileText size={18} /> 案例 AI 复盘
          </button>
          <button 
            onClick={() => { setActiveTab('live'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base ${activeTab === 'live' ? 'bg-blue-600' : 'bg-slate-800'} text-white`}
          >
            <Zap size={18} /> 实时建议 Live
          </button>
          <button 
            onClick={() => { setActiveTab('simulation'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base ${activeTab === 'simulation' ? 'bg-indigo-600' : 'bg-slate-800'} text-white`}
          >
            <Bot size={18} /> 模拟谈单训练
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative md:static pt-14 md:pt-0">
         <div className="flex-1 flex flex-col h-full p-2 md:p-6 w-full max-w-6xl mx-auto overflow-hidden">
            <header className="mb-3 md:mb-4 flex-shrink-0 hidden md:block">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{getTitle()}</h2>
            </header>
            <div className="flex-1 overflow-hidden relative rounded-xl bg-white shadow-sm md:shadow-none border md:border-none border-slate-200">
               <div className="absolute inset-0">
                 {renderContent()}
               </div>
            </div>
         </div>
      </main>
    </div>
  );
};

export default App;
