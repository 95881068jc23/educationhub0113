
import React, { useState, useRef, useEffect } from 'react';
import { ProductType, MessageRole, ChatMessage } from '../types';
import { sendMessageToGemini } from '../services/gemini';
import { ANALYSIS_PROMPT_TEMPLATE } from '../constants';
import { Upload, FileAudio, Image as ImageIcon, X, Wand2, Loader2, FileText, ArrowLeft, Download, Compass, CheckCircle2, AlertTriangle, Lightbulb, MessageSquare, Microscope, Sword, Send, User, Bot, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface CaseDiagnosisProps {
  importedAudio?: { data: string; name: string } | null;
  onClearImport?: () => void;
  globalTones: string[];
  setGlobalTones: (tones: string[]) => void;
}

// 🎨 1. Diagnosis Report Markdown Styles
const DiagnosisMarkdownComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  h1: ({ node, ...props }) => (
    <div className="border-b-2 border-slate-100 pb-4 mb-6 mt-2">
       <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2" {...props} />
    </div>
  ),
  h2: ({ node, ...props }) => (
    <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4 flex items-center gap-2" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 
      className="text-lg font-bold text-slate-800 mt-6 mb-3 flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border-l-4 border-indigo-600" 
      {...props} 
    />
  ),
  blockquote: ({ node, ...props }) => (
    <div className="relative group my-4">
       <div className="diagnosis-blockquote bg-indigo-50/50 border-l-4 border-indigo-500 rounded-r-lg p-4 shadow-sm">
          <div className="text-slate-800 italic leading-relaxed" {...props} />
       </div>
    </div>
  ),
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-6 rounded-xl border border-slate-200 shadow-sm bg-white">
      <table className="min-w-full divide-y divide-slate-100" {...props} />
    </div>
  ),
  thead: ({ node, ...props }) => (
    <thead className="bg-slate-100 text-slate-700" {...props} />
  ),
  tbody: ({ node, ...props }) => (
    <tbody className="bg-white divide-y divide-slate-50" {...props} />
  ),
  tr: ({ node, ...props }) => (
    <tr className="hover:bg-slate-50 transition-colors" {...props} />
  ),
  th: ({ node, ...props }) => (
    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600" {...props} />
  ),
  td: ({ node, ...props }) => (
    <td className="px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap" {...props} />
  ),
  ul: ({ node, ...props }) => (
    <ul className="space-y-2 mb-4" {...props} />
  ),
  li: ({ node, ...props }) => (
    <li className="flex items-start gap-2 text-slate-700 leading-relaxed text-sm" {...props}>
       <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0"></span>
       <span>{props.children}</span>
    </li>
  ),
  p: ({ node, ...props }) => (
    <p className="mb-3 leading-relaxed text-slate-700 text-sm" {...props} />
  ),
  strong: ({ node, ...props }) => (
    <span className="font-bold text-indigo-800" {...props} />
  ),
  hr: ({ node, ...props }) => (
    <hr className="my-8 border-slate-100" {...props} />
  )
};

// 🎨 2. Deep Dive Interaction Markdown Styles (Rich, distinct blocks)
const DeepDiveMarkdownComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  h1: ({node, ...props}) => <h3 className="text-lg font-bold text-indigo-800 mt-4 mb-2 border-b border-indigo-100 pb-2" {...props}/>,
  h2: ({node, ...props}) => <h3 className="text-base font-bold text-indigo-700 mt-3 mb-2" {...props}/>,
  h3: ({node, ...props}) => <h3 className="text-sm font-bold text-slate-700 mt-3 mb-1 uppercase tracking-wider" {...props}/>,
  
  // Strong emphasis - Color block effect for key terms
  strong: ({node, ...props}) => <span className="font-bold text-indigo-700 bg-indigo-50 px-1 rounded mx-0.5 border border-indigo-100/50" {...props}/>,
  
  // Paragraphs
  p: ({node, ...props}) => <p className="mb-3 leading-relaxed text-slate-700 last:mb-0 text-sm" {...props}/>,
  
  // Lists
  ul: ({node, ...props}) => <ul className="space-y-2 mb-3 ml-1 list-none" {...props}/>,
  li: ({node, ...props}) => (
    <li className="flex items-start gap-2 text-sm text-slate-700" {...props}>
      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0"></span>
      <span>{props.children}</span>
    </li>
  ),

  // Blockquotes - Used for Scripts or Important Insights (Color Block)
  blockquote: ({node, ...props}) => (
    <div className="my-3 border-l-4 border-indigo-500 bg-indigo-50/60 p-3 rounded-r-lg shadow-sm">
      <div className="text-slate-800 text-sm italic" {...props} />
    </div>
  ),

  // Tables - distinct styling for "Microscope Analysis"
  table: ({node, ...props}) => (
    <div className="overflow-x-auto my-3 rounded-lg border border-slate-200 shadow-sm bg-white">
      <table className="min-w-full divide-y divide-slate-100" {...props} />
    </div>
  ),
  thead: ({node, ...props}) => <thead className="bg-slate-50" {...props}/>,
  th: ({node, ...props}) => <th className="px-3 py-2 text-left text-xs font-bold text-slate-500 uppercase tracking-wider" {...props}/>,
  tbody: ({node, ...props}) => <tbody className="bg-white divide-y divide-slate-50" {...props}/>,
  tr: ({node, ...props}) => <tr className="hover:bg-indigo-50/30 transition-colors" {...props}/>,
  td: ({node, ...props}) => <td className="px-3 py-2 text-sm text-slate-600 whitespace-pre-wrap align-top" {...props}/>,
  
  // Horizontal Rule
  hr: ({node, ...props}) => <hr className="my-4 border-slate-100" {...props}/>,
  
  // Code (sometimes used for emphasis)
  code: ({node, ...props}) => <code className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-xs font-mono" {...props}/>
};

export const CaseDiagnosis: React.FC<CaseDiagnosisProps> = ({ importedAudio, onClearImport }) => {
  const [selectedProduct, setSelectedProduct] = useState<ProductType>(ProductType.ADULT);
  const [clientGender, setClientGender] = useState<string>('不确定');
  const [images, setImages] = useState<string[]>([]);
  const [audio, setAudio] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioName, setAudioName] = useState<string>('');
  
  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [report, setReport] = useState<string | null>(null); // The main initial report
  const [customDirection, setCustomDirection] = useState('');

  // Interactive Deep Dive State
  const [followUpMessages, setFollowUpMessages] = useState<ChatMessage[]>([]);
  const [followUpInput, setFollowUpInput] = useState('');
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (importedAudio) {
      setAudio(importedAudio.data);
      setAudioName(importedAudio.name);
    }
  }, [importedAudio]);

  useEffect(() => {
    // Auto-scroll to bottom of chat when messages change
    if (followUpMessages.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [followUpMessages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAudio(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalysis = async () => {
    if ((images.length === 0 && !audio) || isAnalyzing) return;
    
    setIsAnalyzing(true);
    setReport(null);
    setFollowUpMessages([]); // Clear previous chat

    try {
      const response = await sendMessageToGemini({
        message: ANALYSIS_PROMPT_TEMPLATE(selectedProduct, customDirection, clientGender),
        images: images,
        audio: audio || undefined,
        temperature: 0.1, 
      });
      setReport(response.text || '分析失败，请重试');
    } catch (error) {
      setReport('系统繁忙，无法完成分析，请检查文件大小或稍后重试。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- Follow-up Logic ---

  const sendFollowUp = async (text: string, isHiddenContext: boolean = false) => {
    if (!text.trim() || isFollowUpLoading) return;

    // Add user message to UI immediately (unless it's a hidden prompt trigger)
    if (!isHiddenContext) {
      setFollowUpMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: MessageRole.USER,
        text: text
      }]);
    }
    
    if(!isHiddenContext) setFollowUpInput('');
    setIsFollowUpLoading(true);

    // Context construction: Main Report + Chat History
    const historyContext = followUpMessages.map(m => `${m.role === MessageRole.USER ? 'User' : 'AI Consultant'}: ${m.text}`).join('\n');
    
    // The prompt includes the original report context implicitly by instructions or we can re-inject it if needed.
    // For Gemini, it's best to maintain session or include context. Since we use stateless calls here, we inject context.
    const fullPrompt = `
      [BACKGROUND - ORIGINAL DIAGNOSIS REPORT]:
      ${report ? report.substring(0, 5000) : "No report context."}
      
      [CHAT HISTORY]:
      ${historyContext}

      [USER REQUEST]:
      ${text}

      [INSTRUCTION]:
      You are the Senior Consultant Coach who wrote the diagnosis report.
      Answer the user's request specifically based on the context of the analyzed case.
      If they ask for "Training" or "Simulation", start a roleplay with them.
      If they ask for "Deep Dive", perform a microscopic analysis.
      Keep the tone professional, encouraging, and sharp.
      
      [FORMATTING]:
      Use Markdown features to make your response visually structured:
      - Use **Bold** for key concepts.
      - Use > Blockquotes for scripts or suggested dialogue.
      - Use Tables for comparisons.
      - Use Bullet points for lists.
    `;

    try {
      const response = await sendMessageToGemini({ message: fullPrompt });
      setFollowUpMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: MessageRole.MODEL,
        text: response.text || "抱歉，无法处理该请求。"
      }]);
    } catch (e) {
      setFollowUpMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: MessageRole.MODEL,
        text: "网络错误，请重试。",
        isError: true
      }]);
    } finally {
      setIsFollowUpLoading(false);
    }
  };

  // --- Quick Actions ---
  
  const handleDeepDive = (phase: string) => {
    const prompt = `针对报告中的【${phase}】环节，请进行“逐句显微镜式分析”。\n找出顾问在这个环节说的每一句话中隐含的心理博弈漏洞，并给出具体的更优替代话术（Word-by-Word Script）。\n请用表格形式对比：[原话] vs [客户心理] vs [精修话术]`;
    // We add a UI message to show what's happening, then send the prompt
    setFollowUpMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: MessageRole.USER,
      text: `🔬 请对【${phase}】环节进行显微镜式逐句深度精修`
    }]);
    sendFollowUp(prompt, true);
  };

  const handleSimulate = (phase: string) => {
    const prompt = `我想针对报告中暴露的【${phase}】弱点进行专项模拟训练。\n请你扮演这个案例中的难搞客户，重现当时的场景，让我（顾问）重新尝试应对。\n请直接以客户的身份说出第一句话，并在括号里注明你的心理潜台词。`;
    setFollowUpMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: MessageRole.USER,
      text: `⚔️ 我想针对【${phase}】进行模拟实战训练`
    }]);
    sendFollowUp(prompt, true);
  };

  const handleStrategy = () => {
    const prompt = `基于这个失败/不完美的案例，请给出一份未来3天的“挽单跟进策略 (Follow-up Plan)”。\n具体到：明天几点发微信？发什么内容（给具体的Copywriting）？如果不回怎么办？`;
    setFollowUpMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: MessageRole.USER,
      text: `📋 请给出针对此客户的未来3天挽单跟进策略`
    }]);
    sendFollowUp(prompt, true);
  };


  const handleDownload = async (type: 'image' | 'pdf') => {
    if (!resultRef.current) return;
    try {
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      container.style.width = '800px'; 
      document.body.appendChild(container);

      const originalElement = resultRef.current;
      const clone = originalElement.cloneNode(true) as HTMLElement;
      
      clone.style.width = '800px';
      clone.style.maxWidth = '800px';
      clone.style.height = 'auto'; 
      clone.style.overflow = 'visible';
      clone.style.background = '#ffffff';
      clone.style.padding = '40px';
      clone.style.margin = '0';
      
      container.appendChild(clone);

      const styleFix = document.createElement('style');
      styleFix.innerHTML = `
        .diagnosis-blockquote, .relative, .group, div, p, span { position: static !important; transform: none !important; box-shadow: none !important; text-shadow: none !important; transition: none !important; animation: none !important; }
        .diagnosis-blockquote { background-image: none !important; background-color: #f8fafc !important; border: 1px solid #e2e8f0 !important; border-left: 4px solid #6366f1 !important; border-radius: 8px !important; margin: 16px 0 !important; padding: 16px !important; display: block !important; }
        .diagnosis-blockquote * { color: #1e293b !important; background: transparent !important; opacity: 1 !important; visibility: visible !important; }
        table { border-collapse: collapse !important; width: 100% !important; background: white !important; }
        th, td { border: 1px solid #cbd5e1 !important; background: white !important; color: #0f172a !important; }
      `;
      clone.appendChild(styleFix);

      const canvas = await html2canvas(clone, { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: 880, foreignObjectRendering: false });
      document.body.removeChild(container);

      if (type === 'image') {
        const link = document.createElement('a');
        link.download = `ME_Case_Diagnosis_${new Date().getTime()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: [210, (canvas.height / 2) * (210 / (canvas.width / 2)) + 10] });
        pdf.addImage(imgData, 'PNG', 0, 0, 210, (canvas.height / 2) * (210 / (canvas.width / 2)));
        pdf.save(`ME_Case_Diagnosis_${new Date().getTime()}.pdf`);
      }
    } catch (e) {
      alert("下载失败，请重试");
    }
  };

  const reset = () => {
    setImages([]);
    setAudio(null);
    setAudioFile(null);
    setAudioName('');
    setReport(null);
    setFollowUpMessages([]);
    setProgressStatus('');
    if (onClearImport) onClearImport();
  };

  return (
    <div className="h-full flex flex-col gap-6 w-full max-w-[95%] mx-auto p-4 md:p-0 overflow-y-auto pb-20">
      
      {/* 1. CONFIGURATION SECTION */}
      <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex-shrink-0 transition-all ${report ? 'hidden' : 'block'}`}>
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <FileText className="text-blue-600" /> 
          案例深度诊断
        </h2>
        
        {/* Settings Area */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">1. 选择业务板块</label>
                <div className="flex flex-wrap gap-2 mb-4">
                    {Object.values(ProductType).map((type) => (
                    <button
                        key={type}
                        onClick={() => setSelectedProduct(type)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                        selectedProduct === type
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {type}
                    </button>
                    ))}
                </div>

                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">2. 学员性别 (校准称呼)</label>
                <div className="flex gap-2">
                  {['男 (Male)', '女 (Female)', '不确定'].map((g) => (
                    <button
                      key={g}
                      onClick={() => setClientGender(g)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        clientGender === g
                          ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {g.split(' ')[0]}
                    </button>
                  ))}
                </div>
            </div>
            <div>
                 <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider flex items-center gap-1">
                    <Compass size={14}/> 3. 自定义分析侧重 (可选)
                 </label>
                 <input
                    type="text"
                    value={customDirection}
                    onChange={(e) => setCustomDirection(e.target.value)}
                    placeholder="例如：重点分析价格谈判环节，或挖需是否到位..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-slate-400"
                 />
            </div>
        </div>

        {/* Upload Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors group h-40"
          >
            <ImageIcon className="w-8 h-8 text-slate-400 group-hover:text-blue-500 mb-2" />
            <span className="text-sm text-slate-600 font-medium">上传聊天截图</span>
            <span className="text-xs text-slate-400 mt-1">支持多张图片</span>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
          </div>

          <div 
            onClick={() => audioInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors group h-40"
          >
            <FileAudio className="w-8 h-8 text-slate-400 group-hover:text-blue-500 mb-2" />
            <span className="text-sm text-slate-600 font-medium">上传录音文件</span>
            <span className="text-xs text-slate-400 mt-1">MP3, M4A, WAV (Max 120min)</span>
            <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} />
          </div>
        </div>

        {(images.length > 0 || audio) && (
          <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-slate-700">待分析素材</span>
              <button onClick={reset} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                <X size={12} /> 清空所有
              </button>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative w-20 h-20 group">
                  <img src={img} alt="Preview" className="w-full h-full object-cover rounded-lg border border-slate-200" />
                  <button onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100">
                    <X size={10} />
                  </button>
                </div>
              ))}
              {audio && (
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm w-full md:w-auto">
                  <FileAudio className="text-blue-500" />
                  <span className="text-sm text-slate-700 truncate max-w-[150px]">{audioName || 'Audio File'}</span>
                  <button onClick={() => { setAudio(null); setAudioName(''); if(onClearImport) onClearImport(); }} className="ml-2 text-slate-400 hover:text-red-500"><X size={14} /></button>
                </div>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleAnalysis}
          disabled={isAnalyzing || (images.length === 0 && !audio)}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99] flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="animate-spin" /> 正在深度诊断中...
            </>
          ) : (
            <>
              <Wand2 /> 开始一键诊断
            </>
          )}
        </button>
      </div>

      {/* 2. REPORT & INTERACTIVE AREA */}
      {report && (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
          
          {/* HEADER BAR */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex justify-between items-center sticky top-0 z-20">
             <div className="flex items-center gap-4">
               <button onClick={reset} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors" title="返回上传">
                 <ArrowLeft size={20}/>
               </button>
               <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                 <Wand2 className="text-indigo-600" size={20}/> 智能诊断报告
               </h2>
             </div>
             <div className="flex gap-2">
                <button onClick={() => handleDownload('image')} className="text-xs bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors font-bold shadow-sm">
                   <Download size={14} /> 图片
                </button>
                <button onClick={() => handleDownload('pdf')} className="text-xs bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors font-bold shadow-sm">
                   <Download size={14} /> PDF
                </button>
             </div>
          </div>

          {/* MAIN REPORT CARD */}
          <div ref={resultRef} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 min-h-[500px] relative">
             {/* Watermark */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-[0.05] pointer-events-none select-none">
                 <div className="text-4xl font-black text-slate-900 rotate-[-12deg] whitespace-nowrap">仅限麦迩威教育内部使用</div>
            </div>
            
            <div className="relative z-10">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={DiagnosisMarkdownComponents}>
                {report}
                </ReactMarkdown>
            </div>
            
            <div className="mt-8 pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
               Marvellous Education Intelligent System • {new Date().toLocaleDateString()}
            </div>
          </div>

          {/* 3. INTERACTIVE DEEP DIVE SECTION */}
          <div className="bg-slate-100 rounded-2xl p-6 border border-slate-200 shadow-inner">
             <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Sparkles className="text-indigo-600"/> 深度交互与复盘
             </h3>
             
             {/* Quick Actions */}
             <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex items-center text-xs font-bold text-slate-400 uppercase mr-2">
                   <Microscope size={14} className="mr-1"/> 逐句精修:
                </div>
                {['需求挖掘', '方案规划', '价值锚定', '异议处理'].map(phase => (
                   <button 
                      key={`deep-${phase}`}
                      onClick={() => handleDeepDive(phase)}
                      disabled={isFollowUpLoading}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 text-slate-600 rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
                   >
                      {phase}
                   </button>
                ))}
             </div>
             
             <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex items-center text-xs font-bold text-slate-400 uppercase mr-2">
                   <Sword size={14} className="mr-1"/> 模拟实战:
                </div>
                 {['需求挖掘', '价格谈判', '异议攻防'].map(phase => (
                   <button 
                      key={`sim-${phase}`}
                      onClick={() => handleSimulate(phase)}
                      disabled={isFollowUpLoading}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:border-red-400 hover:text-red-600 text-slate-600 rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
                   >
                      {phase}
                   </button>
                ))}
                <div className="w-px h-6 bg-slate-300 mx-2"></div>
                <button 
                   onClick={handleStrategy}
                   disabled={isFollowUpLoading}
                   className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-md hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1"
                >
                   <CheckCircle2 size={12}/> 生成挽单策略
                </button>
             </div>

             {/* Chat Area */}
             <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[300px] max-h-[600px]">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                   {followUpMessages.length === 0 && (
                      <div className="text-center py-10 text-slate-400 text-sm">
                         <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20"/>
                         <p>点击上方按钮进行深度复盘，或直接在下方提问</p>
                      </div>
                   )}
                   {followUpMessages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}>
                         <div className={`flex gap-3 max-w-[95%] md:max-w-[85%] ${msg.role === MessageRole.USER ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === MessageRole.USER ? 'bg-indigo-600' : 'bg-white border border-slate-200'}`}>
                               {msg.role === MessageRole.USER ? <User size={16} className="text-white"/> : <Bot size={16} className="text-indigo-600"/>}
                            </div>
                            <div className={`p-4 rounded-2xl text-sm shadow-sm leading-relaxed ${
                               msg.role === MessageRole.USER 
                               ? 'bg-indigo-600 text-white rounded-tr-none' 
                               : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                            }`}>
                               {/* Use distinct markdown components based on role */}
                               {msg.role === MessageRole.USER ? (
                                 <div className="whitespace-pre-wrap">{msg.text}</div>
                               ) : (
                                 <ReactMarkdown remarkPlugins={[remarkGfm]} components={DeepDiveMarkdownComponents}>
                                   {msg.text}
                                 </ReactMarkdown>
                               )}
                            </div>
                         </div>
                      </div>
                   ))}
                   {isFollowUpLoading && (
                      <div className="flex justify-start">
                         <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2 text-slate-500 text-sm">
                            <Loader2 size={14} className="animate-spin text-indigo-600"/> 正在分析...
                         </div>
                      </div>
                   )}
                   <div ref={chatEndRef}></div>
                </div>

                {/* Input Area */}
                <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
                   <input
                      type="text"
                      value={followUpInput}
                      onChange={(e) => setFollowUpInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendFollowUp(followUpInput)}
                      placeholder="针对报告内容，您可以继续追问 (例如: 这句话为什么不好?)"
                      disabled={isFollowUpLoading}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400"
                   />
                   <button 
                      onClick={() => sendFollowUp(followUpInput)}
                      disabled={!followUpInput.trim() || isFollowUpLoading}
                      className="p-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm"
                   >
                      <Send size={18}/>
                   </button>
                </div>
             </div>
          </div>
          
        </div>
      )}
    </div>
  );
};
