import React, { useState, useEffect } from 'react';
import { StepInput } from './components/StepInput';
import { StepConfig } from './components/StepConfig';
import { StepResult } from './components/StepResult';
import { AppState, Language, ResumeStyle, FileInput, InterviewDifficulty } from './types';
import { processResume, regenerateInterviewQuestions, generateWritingGuide } from './services/geminiService';
import { GraduationCap, ArrowRight } from 'lucide-react';

// New Overlay Component
const ProcessingOverlay: React.FC<{ message: string }> = ({ message }) => {
  const [seconds, setSeconds] = useState(90);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const percentage = ((90 - seconds) / 90) * 100;

  return (
    <div className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-500">
       <div className="bg-navy-800 p-4 rounded-full mb-6 shadow-xl animate-bounce">
         <GraduationCap className="text-white w-12 h-12" />
       </div>
       <h2 className="text-2xl font-bold text-gray-800 mb-2">AI 正在深度思考...</h2>
       <p className="text-gray-500 mb-8 text-lg">{message}</p>
       
       <div className="w-80 bg-gray-200 rounded-full h-3 mb-4 overflow-hidden shadow-inner">
         <div 
           className="bg-gradient-to-r from-gold-400 to-gold-600 h-full rounded-full transition-all duration-1000 ease-linear"
           style={{ width: `${percentage}%` }}
         ></div>
       </div>
       <p className="text-sm font-medium text-gray-400">预计剩余 {seconds} 秒</p>
    </div>
  );
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    step: 'input',
    config: {
      targetLanguage: Language.ENGLISH,
      targetStyle: ResumeStyle.PROFESSIONAL,
      originalResume: '',
      targetCompany: '',
      jobDescription: '',
    },
    result: null,
    error: null,
    isProcessing: false,
  });

  const handleResumeChange = (text: string, fileInput?: FileInput) => {
    setState(prev => ({ 
      ...prev, 
      config: { 
        ...prev.config, 
        originalResume: text,
        fileInput: fileInput 
      } 
    }));
  };

  const handleConfigChange = (newConfig: Partial<typeof state.config>) => {
    setState(prev => ({ ...prev, config: { ...prev.config, ...newConfig } }));
  };

  // Full generation logic
  const handleGenerate = async (customConfig?: Partial<typeof state.config>) => {
    const configToUse = { ...state.config, ...customConfig };
    
    setState(prev => ({ 
      ...prev, 
      step: 'analyzing', 
      isProcessing: true, 
      processingStage: undefined, // Default full processing
      error: null,
      config: configToUse
    }));

    try {
      const result = await processResume(configToUse);
      setState(prev => ({
        ...prev,
        step: 'results',
        result,
        isProcessing: false,
        config: { ...prev.config, refinementInstruction: undefined } 
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        step: prev.result ? 'results' : 'input', 
        isProcessing: false,
        error: err.message || "Something went wrong during generation.",
      }));
      alert(err.message);
    }
  };

  // Partial Regeneration: Interview Only
  const handleRegenerateInterview = async (prompt: string, difficulty?: InterviewDifficulty) => {
    if (!state.result) return;
    
    setState(prev => ({ ...prev, isProcessing: true, processingStage: 'interview' }));
    
    // Create a temporary config object that includes the overridden difficulty (if provided)
    // or falls back to the existing config state
    const configToUse = { 
      ...state.config, 
      interviewDifficulty: difficulty || state.config.interviewDifficulty 
    };

    try {
      const newInterviewPrep = await regenerateInterviewQuestions(state.result, configToUse, prompt);
      
      setState(prev => {
        if (!prev.result) return prev;
        return {
          ...prev,
          isProcessing: false,
          processingStage: undefined,
          // Update the main config with the selected difficulty so it persists in UI if needed
          config: { ...prev.config, interviewDifficulty: configToUse.interviewDifficulty },
          result: {
            ...prev.result,
            analysis: {
              ...prev.result.analysis,
              interviewPrep: newInterviewPrep
            }
          }
        };
      });
    } catch (error) {
       alert("Failed to refresh questions.");
       setState(prev => ({ ...prev, isProcessing: false, processingStage: undefined }));
    }
  };

  // Partial Generation: Writing Guide
  const handleGenerateWritingGuide = async () => {
    if (!state.result) return;
    setState(prev => ({ ...prev, isProcessing: true, processingStage: 'guide' }));
    
    try {
      const guide = await generateWritingGuide(state.config);
       setState(prev => {
        if (!prev.result) return prev;
        return {
          ...prev,
          isProcessing: false,
          processingStage: undefined,
          result: {
            ...prev.result,
            analysis: {
              ...prev.result.analysis,
              writingGuide: guide
            }
          }
        };
      });
    } catch (error) {
      alert("Failed to generate guide.");
      setState(prev => ({ ...prev, isProcessing: false, processingStage: undefined }));
    }
  };

  const handleRegenerateFromNative = (newNativeContent: string) => {
    handleGenerate({
      originalResume: newNativeContent,
      fileInput: undefined, 
      refinementInstruction: "User has manually edited the Native Language version. Please translate and optimize this specific content into the Target Language version."
    });
  };

  const handleRefine = (instruction: string) => {
    handleGenerate({ refinementInstruction: instruction });
  };

  const resetApp = () => {
    setState({
      step: 'input',
      config: {
        targetLanguage: Language.ENGLISH,
        targetStyle: ResumeStyle.PROFESSIONAL,
        originalResume: '',
        targetCompany: '',
        jobDescription: '',
      },
      result: null,
      error: null,
      isProcessing: false,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {state.isProcessing && !state.processingStage && (
        <ProcessingOverlay message="正在分析您的履历并构建职业档案..." />
      )}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
               <GraduationCap className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500">
                GlobalCV Pro
              </h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide">INTELLIGENT RESUME OPTIMIZER</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <div className={`flex items-center gap-2 text-sm font-medium ${state.step === 'input' ? 'text-blue-600' : 'text-slate-400'}`}>
              <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs">1</span>
              输入履历
            </div>
            <ArrowRight size={14} className="text-slate-300" />
             <div className={`flex items-center gap-2 text-sm font-medium ${state.step === 'analyzing' ? 'text-blue-600' : (state.step === 'results' ? 'text-green-600' : 'text-slate-400')}`}>
              <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs">2</span>
              目标设定
            </div>
            <ArrowRight size={14} className="text-slate-300" />
             <div className={`flex items-center gap-2 text-sm font-medium ${state.step === 'results' ? 'text-blue-600' : 'text-slate-400'}`}>
              <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs">3</span>
              生成结果
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 relative">
        {state.step === 'input' && (
          <div className="mt-8">
             <StepInput 
                value={state.config.originalResume} 
                fileInput={state.config.fileInput}
                onChange={handleResumeChange} 
                onNext={() => setState(prev => ({ ...prev, step: 'analyzing' }))} 
             />
          </div>
        )}

        {state.step === 'analyzing' && !state.result && (
          <div className="mt-8">
            <StepConfig 
              config={state.config}
              onChange={handleConfigChange}
              onGenerate={() => handleGenerate()}
              isProcessing={state.isProcessing}
            />
          </div>
        )}
        
        {state.step === 'results' && state.result && (
          <StepResult 
            result={state.result}
            config={state.config}
            onReset={resetApp}
            onRegenerateFromNative={handleRegenerateFromNative}
            onRefine={handleRefine}
            onRegenerateInterview={handleRegenerateInterview}
            onGenerateWritingGuide={handleGenerateWritingGuide}
            isProcessing={state.isProcessing}
            processingStage={state.processingStage}
          />
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>© 2024 GlobalCV Pro. Powered by Google Gemini 2.5 Flash.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;