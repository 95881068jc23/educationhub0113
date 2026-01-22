
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { OptimizationResult, OptimizationConfig, InterviewQuestion, WritingExerciseFeedback, InterviewDifficulty, ATSIssue, ATSData } from '../types';
import { 
  CheckCircle2, RefreshCw, AlertTriangle, ScanSearch, FileWarning, BookOpen, 
  Languages, Sparkles, SplitSquareHorizontal, FileDown, FileImage, FileText,
  MessagesSquare, ChevronDown, ChevronUp, Mic2, StopCircle, PlayCircle, Loader2, Volume2, X, Lightbulb, Send, PenTool, Gauge, Info, Search, Target, Layout, Component, UserCircle, Briefcase, GraduationCap, Users
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { processVoiceInterview, evaluateWritingExercise } from '../services/geminiService';

interface Props {
  result: OptimizationResult;
  config: OptimizationConfig;
  onReset: () => void;
  onRegenerateFromNative: (text: string) => void;
  onRefine: (instruction: string) => void;
  onRegenerateInterview: (prompt: string, difficulty?: InterviewDifficulty) => void;
  onGenerateWritingGuide: () => void;
  isProcessing: boolean;
  processingStage?: string;
}

// --- UTILS ---

const cleanAndFormatMarkdown = (text: string): string => {
  if (!text) return "";
  let formatted = text;
  formatted = formatted.replace(/([^\n])\n?(# )/g, '$1\n\n$2');
  formatted = formatted.replace(/([^\n])\n?(## )/g, '$1\n\n$2');
  formatted = formatted.replace(/([^\n])\n?(### )/g, '$1\n\n$2');
  formatted = formatted.replace(/([^\n])\n?(\* )/g, '$1\n$2');
  formatted = formatted.replace(/(\*\*)\n?(#)/g, '$1\n\n$2');
  return formatted;
};

// --- STYLING COMPONENTS ---

const MarkdownRenderer = ({ content }: { content: string }) => {
  const formattedContent = cleanAndFormatMarkdown(content);

  return (
    <ReactMarkdown
      components={{
        h1: ({node, ...props}) => <h1 className="text-4xl font-serif font-bold text-gray-900 text-center uppercase tracking-widest mb-4 mt-6 pb-4 border-b-2 border-gray-900" {...props} />,
        h2: ({node, ...props}) => <h2 className="text-xl font-serif font-bold text-gray-900 uppercase tracking-wider border-b border-gray-400 mb-4 mt-8 pb-1 flex items-center" {...props} />,
        h3: ({node, ...props}) => <h3 className="text-lg font-sans font-bold text-gray-800 mt-5 mb-2 flex justify-between items-baseline w-full border-b border-dashed border-gray-200 pb-1" {...props} />,
        p: ({node, children, ...props}) => {
             const text = String(children);
             const isContactInfo = text.includes('|') && text.length < 200; 
             return <p className={`text-sm text-gray-700 leading-relaxed mb-2 ${isContactInfo ? 'text-center font-medium text-gray-600 mb-6 -mt-2' : 'text-justify'}`} {...props}>{children}</p>;
        },
        ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1.5" {...props} />,
        li: ({node, ...props}) => <li className="text-sm text-gray-700 leading-snug pl-1 marker:text-gray-400" {...props} />,
        strong: ({node, ...props}) => <strong className="font-bold text-gray-900 whitespace-nowrap ml-4 text-base" {...props} />,
        em: ({node, ...props}) => <em className="italic text-gray-600" {...props} />,
      }}
    >
      {formattedContent}
    </ReactMarkdown>
  );
};

// --- SUB-COMPONENTS ---

const ScoreBreakdown: React.FC<{ data: ATSData }> = ({ data }) => {
  const scores = [
    { label: '关键词匹配 (Keywords)', score: data.keywordScore || 0, max: 40, icon: <Target size={14} />, color: 'bg-navy-500' },
    { label: '格式兼容性 (Formatting)', score: data.formattingScore || 0, max: 30, icon: <Layout size={14} />, color: 'bg-gold-500' },
    { label: '逻辑结构 (Structure)', score: data.structureScore || 0, max: 30, icon: <Component size={14} />, color: 'bg-navy-700' },
  ];

  return (
    <div className="w-full space-y-4 mb-8">
      {scores.map((item, idx) => (
        <div key={idx} className="space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">
             <div className="flex items-center gap-1.5">{item.icon} {item.label}</div>
             <span>{item.score} / {item.max}</span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
             <div 
               className={`h-full rounded-full transition-all duration-1000 ${item.color}`}
               style={{ width: `${(item.score / item.max) * 100}%` }}
             ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

const FormattingIssueList: React.FC<{ issues: ATSIssue[], title: string, type: 'original' | 'optimized' }> = ({ issues, title, type }) => {
  if (!issues || issues.length === 0) {
    return (
      <div className="bg-navy-50/50 border border-navy-100 rounded-xl p-4 flex items-center gap-3 mt-4">
        <CheckCircle2 className="text-gold-500" size={20} />
        <p className="text-sm text-navy-700 font-medium">未检测到明显的格式解析障碍 (No major formatting obstacles detected).</p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">{title} 格式与解析诊断 (Detailed Diagnosis)</h5>
      {issues.map((issue, idx) => (
        <div key={idx} className={`p-5 rounded-2xl border ${type === 'original' ? 'bg-red-50/30 border-red-100 shadow-sm' : 'bg-green-50/30 border-green-100'} transition-all hover:shadow-md`}>
          <div className="flex justify-between items-start mb-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${
                  issue.severity === 'High' ? 'bg-red-500 text-white' : 
                  issue.severity === 'Medium' ? 'bg-orange-400 text-white' : 
                  'bg-blue-500 text-white'
                }`}>
                  {issue.severity}
                </span>
                <p className="text-sm font-bold text-gray-900 leading-tight">障碍描述: {issue.issueCn}</p>
              </div>
              <p className="text-xs text-gray-500 italic font-medium ml-1">Detail: {issue.issueEn}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="bg-white/80 p-3.5 rounded-xl border border-gray-100 shadow-sm">
               <div className="flex items-center gap-1.5 mb-2 text-[10px] font-black text-gray-600 uppercase tracking-wide">
                 <Search size={12} className="text-blue-500" /> 深度诊断 (Why it breaks ATS)
               </div>
               <p className="text-xs text-gray-700 leading-relaxed">
                  {issue.issueCn.includes('因为') || issue.issueCn.includes('由于') 
                    ? issue.issueCn 
                    : `该格式障碍（如复杂表格或非标准页眉）会导致 ATS 无法按线性逻辑提取文本，往往导致关键工作背景被丢弃或与不相关的部分合并。`}
               </p>
            </div>

            <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-100 shadow-sm">
               <div className="flex items-center gap-1.5 mb-2 text-[10px] font-black text-blue-700 uppercase tracking-wide">
                 <CheckCircle2 size={12} className="text-blue-600" /> 修复动作 (Actionable Steps)
               </div>
               <p className="text-xs text-blue-900 leading-relaxed font-semibold">
                  {issue.suggestionCn}
               </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const InterviewCard: React.FC<{ 
  question: InterviewQuestion; 
  index: number; 
  onStartVoice: (q: InterviewQuestion) => void;
  isReverse?: boolean;
}> = ({ question, index, onStartVoice, isReverse = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow mb-4">
      <div 
        className="p-5 flex justify-between items-start cursor-pointer bg-gray-50/50 hover:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex gap-4">
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isReverse ? 'bg-gold-100 text-gold-700' : 'bg-navy-100 text-navy-700'}`}>
            Q{index + 1}
          </div>
          <div>
             <h4 className="font-bold text-gray-900 text-lg mb-1">{question.questionEn}</h4>
             <p className="text-gray-600 text-sm">{question.questionCn}</p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>
      
      {isOpen && (
        <div className="p-5 border-t border-gray-100 bg-white animate-in slide-in-from-top-2">
           {!isReverse && (
             <div className="flex justify-end mb-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); onStartVoice(question); }}
                  className="flex items-center gap-2 px-4 py-2 bg-navy-600 text-white rounded-full text-sm font-semibold hover:bg-navy-700 transition-colors shadow-sm"
                >
                  <Mic2 size={16} /> 语音模拟练习 (Voice Practice)
                </button>
             </div>
           )}
           
           <div className="grid md:grid-cols-2 gap-4">
             <div className="mb-4">
               <div className="flex items-center gap-2 mb-2">
                 <span className="bg-gold-100 text-gold-800 text-xs font-bold px-2 py-0.5 rounded uppercase">Intent (意图)</span>
               </div>
               <p className="text-sm text-gray-700 bg-gold-50/50 p-3 rounded-lg border border-gold-100 h-full">
                 {question.intentCn}
               </p>
             </div>
             <div className="mb-4">
               <div className="flex items-center gap-2 mb-2">
                 <span className="bg-navy-100 text-navy-800 text-xs font-bold px-2 py-0.5 rounded uppercase">Key Points (要点)</span>
               </div>
               <ul className="list-disc pl-5 space-y-1 bg-navy-50/50 p-3 rounded-lg border border-navy-100 h-full">
                 {question.keyPointsCn.map((point, i) => (
                   <li key={i} className="text-sm text-gray-700">{point}</li>
                 ))}
               </ul>
             </div>
           </div>
           <div>
             <div className="flex items-center gap-2 mb-2">
               <span className="bg-gold-100 text-gold-800 text-xs font-bold px-2 py-0.5 rounded uppercase">Sample Answer (示范回答)</span>
             </div>
             <div className="bg-gold-50 p-4 rounded-lg border border-gold-100 italic text-gray-800 text-sm leading-relaxed">
               "{question.sampleAnswerEn}"
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

const InterviewSection: React.FC<{ title: string, subtitle: string, icon: React.ReactNode, questions: InterviewQuestion[], onStartVoice: (q: InterviewQuestion) => void, isReverse?: boolean }> = ({ title, subtitle, icon, questions, onStartVoice, isReverse }) => (
  <div className="mb-8">
    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-200">
      <div className={`p-2 rounded-lg ${isReverse ? 'bg-gold-100 text-gold-700' : 'bg-navy-100 text-navy-700'}`}>
        {icon}
      </div>
      <div>
        <h4 className="text-lg font-bold text-gray-900">{title}</h4>
        <p className="text-xs text-gray-500 uppercase tracking-wider">{subtitle}</p>
      </div>
    </div>
    {questions && questions.length > 0 ? (
      questions.map((q, i) => (
        <InterviewCard key={i} question={q} index={i} onStartVoice={onStartVoice} isReverse={isReverse} />
      ))
    ) : (
      <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500 italic text-center">
        暂无该环节问题生成
      </div>
    )}
  </div>
);

// --- MAIN COMPONENT ---

export const StepResult: React.FC<Props> = ({ 
  result, config, onReset, onRegenerateFromNative, onRefine, 
  onRegenerateInterview, onGenerateWritingGuide,
  isProcessing, processingStage 
}) => {
  const { analysis, optimizedContentTarget, optimizedContentNative } = result || {};
  const [activeTab, setActiveTab] = useState<'preview' | 'analysis' | 'ats' | 'coach' | 'interview'>('preview');
  
  // Preview
  const [previewLang, setPreviewLang] = useState<'target' | 'native'>('target');
  const [viewMode, setViewMode] = useState<'single' | 'compare'>('single');
  const [refinePrompt, setRefinePrompt] = useState("");
  const [showRefineInput, setShowRefineInput] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Interview Refresh
  const [showInterviewRefresh, setShowInterviewRefresh] = useState(false);
  const [interviewRefreshPrompt, setInterviewRefreshPrompt] = useState("");
  const [refreshDifficulty, setRefreshDifficulty] = useState<InterviewDifficulty>(config.interviewDifficulty || InterviewDifficulty.ADVANCED);
  const [isRefreshingInterview, setIsRefreshingInterview] = useState(false);

  // Voice Interview
  const [activeQuestion, setActiveQuestion] = useState<InterviewQuestion | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [aiTextResponse, setAiTextResponse] = useState<string | null>(null);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [showSampleAnswer, setShowSampleAnswer] = useState(false);
  
  // Interactive Writing Exercises State
  interface ExerciseState {
    answer: string;
    feedback: WritingExerciseFeedback | null;
    isLoading: boolean;
  }
  const [exerciseStates, setExerciseStates] = useState<Record<number, ExerciseState>>({});

  const resumeRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
     if(isProcessing && processingStage === 'interview') setIsRefreshingInterview(true);
     else setIsRefreshingInterview(false);
  }, [isProcessing, processingStage]);

  if (!analysis) return <div className="p-8 text-center text-gray-500">Analysis data is missing or incomplete. Please try again.</div>;

  const handleExerciseChange = (index: number, val: string) => {
    setExerciseStates(prev => ({ ...prev, [index]: { ...prev[index], answer: val } }));
  };

  const handleExerciseSubmit = async (index: number, task: string) => {
    const current = exerciseStates[index];
    if(!current?.answer?.trim()) return;
    setExerciseStates(prev => ({ ...prev, [index]: { ...prev[index], isLoading: true } }));
    try {
      const feedback = await evaluateWritingExercise(task, current.answer);
      setExerciseStates(prev => ({ ...prev, [index]: { ...prev[index], isLoading: false, feedback } }));
    } catch (e) { alert("Evaluation failed"); setExerciseStates(prev => ({ ...prev, [index]: { ...prev[index], isLoading: false } })); }
  };

  const handleExportImage = async () => {
    const element = document.getElementById('printable-resume');
    if (!element) return;
    try {
      const originalShadow = element.style.boxShadow;
      element.style.boxShadow = 'none'; 
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      element.style.boxShadow = originalShadow;
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `Resume_${config.targetCompany || 'GlobalCV'}.png`;
      link.click();
      setShowExportMenu(false);
    } catch (err) { console.error(err); }
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('printable-resume');
    if (!element) return;
    try {
      const originalShadow = element.style.boxShadow;
      element.style.boxShadow = 'none';
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      element.style.boxShadow = originalShadow;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
      pdf.save(`Resume_${config.targetCompany || 'GlobalCV'}.pdf`);
      setShowExportMenu(false);
    } catch (err) { console.error(err); }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US'; 
      window.speechSynthesis.speak(utterance);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setIsAiResponding(true);
          try {
            const res = await processVoiceInterview(base64Audio, activeQuestion?.questionEn || "", optimizedContentTarget);
            setAiTextResponse(res.textResponse);
            speakText(res.textResponse);
          } catch (e) { alert("AI Voice processing failed."); } finally { setIsAiResponding(false); }
        };
      };
      mediaRecorder.start();
      setIsRecording(true);
      setAiTextResponse(null);
    } catch (err) { alert("Mic access denied."); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const scoreColor = (score: number = 0) => {
    if (score >= 80) return 'text-gold-600';
    if (score >= 60) return 'text-navy-600';
    return 'text-red-600';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-700 relative">
      {/* Voice Interview Modal */}
      {activeQuestion && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in duration-300">
              <div className="flex justify-between items-start mb-6">
                <div><h3 className="text-xl font-bold">模拟面试</h3><p className="text-sm text-gray-500">AI Interviewer</p></div>
                <button onClick={() => { setActiveQuestion(null); stopRecording(); window.speechSynthesis.cancel(); }} className="p-1 hover:bg-gray-100 rounded-full"><X size={24} className="text-gray-500" /></button>
              </div>
              <div className="mb-6 bg-navy-50 p-4 rounded-xl border border-navy-100"><p className="font-medium text-navy-900 text-lg">"{activeQuestion.questionEn}"</p></div>
              <div className="flex flex-col items-center justify-center py-4">
                 {isAiResponding ? <Loader2 className="animate-spin text-navy-600 w-12 h-12" /> : (
                    <button onClick={isRecording ? stopRecording : startRecording} className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-navy-600'}`}>
                      {isRecording ? <StopCircle size={32} className="text-white" /> : <Mic2 size={32} className="text-white" />}
                    </button>
                 )}
              </div>
              {aiTextResponse && <div className="mt-6 bg-green-50 p-4 rounded-xl border border-green-100"><p className="text-gray-800 text-sm">{aiTextResponse}</p></div>}
           </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap justify-between items-center mb-4 px-4 gap-2">
        <div className="flex space-x-2 bg-white p-1 rounded-lg shadow-sm border overflow-x-auto">
             <button onClick={() => setActiveTab('preview')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'preview' ? 'bg-blue-50 text-blue-700' : 'text-gray-600'}`}>履历预览</button>
             <button onClick={() => setActiveTab('analysis')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'analysis' ? 'bg-blue-50 text-blue-700' : 'text-gray-600'}`}>深度诊断</button>
             <button onClick={() => setActiveTab('ats')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'ats' ? 'bg-purple-50 text-purple-700' : 'text-gray-600'}`}>ATS 检查</button>
             <button onClick={() => setActiveTab('coach')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'coach' ? 'bg-green-50 text-green-700' : 'text-gray-600'}`}>写作指导</button>
             <button onClick={() => setActiveTab('interview')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'interview' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600'}`}>模拟面试</button>
        </div>
        <div className="flex space-x-3 items-center">
          <button onClick={onReset} className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white rounded-lg border text-sm"><RefreshCw size={16} /> 重置</button>
          {activeTab === 'preview' && (
            <div className="relative">
              <button onClick={() => setShowExportMenu(!showExportMenu)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm shadow-md"><FileDown size={16} /> 导出</button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border z-50 overflow-hidden">
                  <button onClick={handleExportPDF} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm flex items-center gap-2 border-b"><FileText size={16} className="text-red-500" /> Save as PDF</button>
                  <button onClick={handleExportImage} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm flex items-center gap-2"><FileImage size={16} className="text-blue-500" /> Save as Image</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden px-4 pb-4">
        <div className="flex-1 bg-white rounded-2xl shadow-xl border overflow-hidden flex flex-col">
          {activeTab === 'preview' && (
            <div className="flex flex-col h-full">
               <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                  <div className="flex items-center gap-4">
                     <div className="flex bg-gray-200 p-1 rounded-lg">
                        <button onClick={() => setViewMode('single')} className={`px-3 py-1 rounded-md text-sm ${viewMode === 'single' ? 'bg-white shadow' : ''}`}>单页</button>
                        <button onClick={() => setViewMode('compare')} className={`px-3 py-1 rounded-md text-sm flex items-center gap-1 ${viewMode === 'compare' ? 'bg-white shadow' : ''}`}><SplitSquareHorizontal size={14} /> 对比</button>
                     </div>
                     {viewMode === 'single' && (
                       <div className="flex gap-2">
                          <button onClick={() => setPreviewLang('target')} className={`px-3 py-1 rounded-full text-xs font-bold border ${previewLang === 'target' ? 'bg-blue-600 text-white' : 'bg-white'}`}>Target</button>
                          <button onClick={() => setPreviewLang('native')} className={`px-3 py-1 rounded-full text-xs font-bold border ${previewLang === 'native' ? 'bg-indigo-600 text-white' : 'bg-white'}`}>Chinese</button>
                       </div>
                     )}
                  </div>
                  <button onClick={() => setShowRefineInput(!showRefineInput)} className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded-lg text-sm"><Sparkles size={14} className="text-purple-600" /> AI 优化</button>
               </div>
               {showRefineInput && (
                 <div className="bg-purple-50 p-4 border-b flex gap-2">
                    <input type="text" value={refinePrompt} onChange={(e) => setRefinePrompt(e.target.value)} placeholder="输入修改建议..." className="flex-1 border rounded-lg px-4 py-2 text-sm"/>
                    <button onClick={() => { if(refinePrompt.trim()) { onRefine(refinePrompt); setShowRefineInput(false); } }} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm">提交</button>
                 </div>
               )}
               <div className="flex-1 overflow-auto bg-gray-100 p-8 relative">
                 {viewMode === 'compare' ? (
                   <div className="flex gap-4 h-full">
                      <div className="flex-1 bg-white shadow-sm p-8 overflow-y-auto rounded border"><MarkdownRenderer content={config.originalResume || result?.transcribedOriginal || ""} /></div>
                      <div className="flex-1 bg-white shadow-xl p-8 overflow-y-auto rounded border-t-4 border-blue-500"><MarkdownRenderer content={optimizedContentTarget || ""} /></div>
                   </div>
                 ) : (
                   <div className="flex justify-center min-h-full">
                     <div id="printable-resume" ref={resumeRef} className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-[20mm] text-gray-800 mx-auto">
                        <MarkdownRenderer content={previewLang === 'target' ? (optimizedContentTarget || "") : (optimizedContentNative || "")} />
                     </div>
                   </div>
                 )}
               </div>
            </div>
          )}

          {activeTab === 'analysis' && (
             <div className="flex-1 overflow-auto p-8 bg-gray-50/50">
                <div className="mb-8 bg-white border border-blue-100 rounded-xl p-6 shadow-sm flex items-center justify-between">
                   <div><h3 className="text-xl font-bold text-blue-900">履历诊断总览</h3><p className="text-blue-700 text-sm mt-1">{analysis?.summaryCn || "正在分析..."}</p></div>
                   <div className={`text-4xl font-bold ${scoreColor(analysis?.overallScore)}`}>{analysis?.overallScore || 0}<span className="text-lg text-gray-400">/100</span></div>
                </div>
                <div className="space-y-6">
                 {analysis?.issues?.map((issue, idx) => (
                   <div key={idx} className="bg-white border rounded-xl shadow-sm overflow-hidden">
                      <div className="bg-gray-50 px-6 py-3 border-b flex justify-between items-center"><span className="font-bold text-gray-600 text-sm">{issue.section}</span><span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">{issue.issueType}</span></div>
                      <div className="p-6">
                         <div className="mb-4"><p className="text-xs font-bold text-red-500 mb-1">原文:</p><div className="bg-red-50 p-4 border-l-4 border-red-400 rounded-r text-sm">"{issue.originalTextSnippet}"</div></div>
                         <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div><p className="text-sm font-bold">诊断:</p><p className="text-sm text-gray-700">{issue.reasonCn}</p></div>
                            <div><p className="text-sm font-bold">建议:</p><p className="text-sm text-gray-700">{issue.suggestionCn}</p></div>
                         </div>
                         <div className="bg-green-50 p-4 rounded border border-green-100"><p className="text-xs font-bold text-green-600 mb-2">优化示范 (EN):</p><p className="text-sm font-medium italic">"{issue.exampleImprovedEn}"</p></div>
                      </div>
                   </div>
                 ))}
               </div>
             </div>
          )}

          {activeTab === 'ats' && (
            <div className="flex-1 overflow-auto p-8 bg-gray-50/30 custom-scrollbar">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <ScanSearch className="text-purple-600" /> ATS 兼容性与格式解析诊断
                </h3>
                <p className="text-sm text-gray-500 mt-1">Comparing Original vs. AI Optimized Performance (深度诊断与评分细则)</p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 h-full">
                {/* Left: Original ATS */}
                <div className="flex flex-col">
                  <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 flex-1 shadow-sm">
                    <h4 className="text-lg font-bold text-gray-600 mb-6 text-center border-b border-gray-200 pb-3 flex items-center justify-center gap-2">
                      <FileWarning size={18} /> 原始履历表现 (Original)
                    </h4>
                    
                    <div className="flex flex-col items-center mb-6">
                      <div className={`text-6xl font-black mb-1 ${scoreColor(analysis?.atsAnalysis?.original?.score)}`}>
                        {analysis?.atsAnalysis?.original?.score || 0}
                      </div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ATS Compatibility Score</p>
                    </div>

                    <ScoreBreakdown data={analysis?.atsAnalysis?.original || {} as ATSData} />
                    
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-inner mb-6">
                       <p className="text-[10px] font-black text-gray-500 uppercase mb-2 flex items-center gap-1 tracking-wider"><Info size={12} className="text-gray-400" /> 评分简述</p>
                       <p className="text-sm text-gray-700 italic leading-relaxed font-medium">{analysis?.atsAnalysis?.original?.detailedFeedbackCn || "评分分析中..."}</p>
                    </div>

                    <FormattingIssueList 
                      issues={analysis?.atsAnalysis?.original?.formattingIssues || []} 
                      title="原始" 
                      type="original" 
                    />
                  </div>
                </div>

                {/* Right: Optimized ATS */}
                <div className="flex flex-col">
                  <div className="bg-white rounded-2xl border-2 border-green-100 shadow-xl p-6 flex-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-xl shadow-sm tracking-widest">AI OPTIMIZED</div>
                    <h4 className="text-lg font-bold text-green-700 mb-6 text-center border-b border-green-100 pb-3 flex items-center justify-center gap-2">
                      <CheckCircle2 size={18} /> 优化后表现 (Optimized)
                    </h4>
                    
                    <div className="flex flex-col items-center mb-6">
                      <div className={`text-7xl font-black mb-1 ${scoreColor(analysis?.atsAnalysis?.optimized?.score)}`}>
                        {analysis?.atsAnalysis?.optimized?.score || 0}
                      </div>
                      <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">AI Result Score</p>
                    </div>

                    <ScoreBreakdown data={analysis?.atsAnalysis?.optimized || {} as ATSData} />

                    <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 shadow-inner mb-6">
                       <p className="text-[10px] font-black text-green-700 uppercase mb-2 flex items-center gap-1 tracking-wider"><Sparkles size={12} className="text-green-500" /> 优化亮点</p>
                       <p className="text-sm text-green-800 italic leading-relaxed font-medium">{analysis?.atsAnalysis?.optimized?.detailedFeedbackCn || "分析完成"}</p>
                    </div>

                    <FormattingIssueList 
                      issues={analysis?.atsAnalysis?.optimized?.formattingIssues || []} 
                      title="优化" 
                      type="optimized" 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'coach' && (
             <div className="flex-1 overflow-auto p-8">
                {(!analysis?.writingGuide?.exercises || analysis.writingGuide.exercises.length === 0) ? (
                   <div className="flex flex-col items-center justify-center h-full"><BookOpen size={64} className="text-blue-200 mb-4" /><button onClick={onGenerateWritingGuide} disabled={isProcessing} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2">{isProcessing ? <Loader2 className="animate-spin" /> : <Sparkles />} 立即生成指南</button></div>
                ) : (
                   <div className="space-y-8">
                      <div className="bg-blue-50 p-6 rounded-xl border border-blue-100"><h3 className="text-lg font-bold text-blue-900 mb-2">写作建议</h3><p className="text-blue-800 text-sm">{analysis.writingGuide.conceptExplanationCn}</p></div>
                      {analysis.writingGuide.exercises.map((ex, i) => {
                        const state = exerciseStates[i] || { answer: "", feedback: null, isLoading: false };
                        return (
                          <div key={i} className="border rounded-xl p-6 bg-white">
                            <h4 className="text-lg font-bold text-gray-800 mb-2">{ex.scenarioCn}</h4><p className="text-sm text-gray-600 mb-4">{ex.taskCn}</p>
                            <textarea className="w-full border rounded-lg p-4 text-sm min-h-[100px] mb-3 bg-slate-800 text-white" value={state.answer} onChange={(e) => handleExerciseChange(i, e.target.value)} />
                            <div className="flex justify-end"><button onClick={() => handleExerciseSubmit(i, ex.taskEn)} disabled={!state.answer.trim() || state.isLoading} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2">{state.isLoading && <Loader2 size={16} className="animate-spin"/>} 提交评估</button></div>
                            {state.feedback && <div className="mt-4 bg-green-50 p-6 rounded-xl border border-green-200"><div className={`text-2xl font-bold mb-2 ${scoreColor(state.feedback.score)}`}>{state.feedback.score}</div><p className="text-sm text-gray-700 mb-3">{state.feedback.critique}</p><div className="bg-white p-3 rounded border text-sm text-gray-900">"{state.feedback.improvedVersion}"</div></div>}
                          </div>
                        );
                      })}
                   </div>
                )}
             </div>
          )}

          {activeTab === 'interview' && (
             <div className="flex-1 overflow-auto p-8 bg-gray-50/50">
               {(!analysis?.interviewPrep || !analysis.interviewPrep.isGenerated) ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <MessagesSquare size={64} className="text-indigo-200 mb-4" />
                    <h3 className="text-xl font-bold text-gray-800 mb-2">生成全流程模拟面试</h3>
                    <p className="text-gray-500 mb-6 text-center max-w-md">
                      系统将基于您的履历，生成包含开场、简历核实、行为面试(STAR)、专业技能及反向提问的完整面试脚本。
                    </p>
                    <button onClick={() => onRegenerateInterview("Generate structured interview.")} disabled={isProcessing} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg">
                      {isProcessing ? <Loader2 className="animate-spin" /> : <Sparkles />} 立即生成 (Start Simulation)
                    </button>
                  </div>
               ) : (
                  <div className="max-w-4xl mx-auto space-y-12 pb-12">
                     <div className="text-center mb-8">
                       <h2 className="text-2xl font-bold text-gray-900">结构化面试模拟 (Structured Interview Simulation)</h2>
                       <p className="text-gray-500 text-sm mt-1">Difficulty: {config.interviewDifficulty}</p>
                     </div>

                     <InterviewSection 
                       title="第一部分：开场与暖场 (Introduction)" 
                       subtitle="Ice-breaking & Professional Opening"
                       icon={<UserCircle size={20} />}
                       questions={analysis.interviewPrep.part1_intro}
                       onStartVoice={setActiveQuestion}
                     />

                     <InterviewSection 
                       title="第二部分：自我介绍与简历核实 (CV Walkthrough)" 
                       subtitle="Career Timeline & Transitions"
                       icon={<FileText size={20} />}
                       questions={analysis.interviewPrep.part2_cv}
                       onStartVoice={setActiveQuestion}
                     />

                     <InterviewSection 
                       title="第三部分：行为面试 (Behavioral)" 
                       subtitle="Core Competencies & STAR Method"
                       icon={<Users size={20} />}
                       questions={analysis.interviewPrep.part3_behavioral}
                       onStartVoice={setActiveQuestion}
                     />

                     <InterviewSection 
                       title="第四部分：岗位动机与技能 (Motivation & Skills)" 
                       subtitle="Technical Fit & Company Interest"
                       icon={<Briefcase size={20} />}
                       questions={analysis.interviewPrep.part4_technical}
                       onStartVoice={setActiveQuestion}
                     />

                     <InterviewSection 
                       title="第五部分：候选人提问 (Reverse Interview)" 
                       subtitle="Strategic Questions to Ask"
                       icon={<GraduationCap size={20} />}
                       questions={analysis.interviewPrep.part5_reverse}
                       onStartVoice={setActiveQuestion}
                       isReverse={true}
                     />
                  </div>
               )}
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
