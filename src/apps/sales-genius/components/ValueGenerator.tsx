
import React, { useState, useRef } from 'react';
import { sendMessageToGemini } from '../services/gemini';
import { VALUE_GENERATION_PROMPT, VERIFICATION_PROMPT_TEMPLATE } from '../constants';
import { Gift, Loader2, Copy, CheckCircle, Sparkles, Building2, GraduationCap, Target, Download, Edit2, Check, RefreshCw, Layers, ChevronLeft, ChevronRight, LayoutTemplate, ShieldCheck, FileText, Upload, Image as ImageIcon, FileAudio, X, AlertTriangle, AlertOctagon, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const INDUSTRIES = [
  "IT / 互联网 (IT/Tech)",
  "金融 / 银行 (Finance)",
  "医疗 / 医药 (Medical)",
  "法律 (Legal)",
  "外贸 / 进出口 (Trade)",
  "制造业 (Manufacturing)",
  "航空 / 航天 (Aerospace)",
  "教育 / 学术 (Education)",
  "通用商务 (General Business)",
  "自定义 (Custom)"
];

const LEVELS = [
  "零基础 (Zero Basis)",
  "初级 (Elementary)",
  "中级 (Intermediate)",
  "高级 (Advanced)",
  "母语水平 (Proficient)"
];

const PREFERENCES = [
  "地道表达 (Native Expressions)",
  "高阶表达 (Advanced Expressions)",
  "词汇表 (Vocabulary List)",
  "常用句型 (Sentence Patterns)",
  "短文/文章 (Articles)",
  "视频脚本/建议 (Video Scripts)",
  "对话模拟 (Dialogue)"
];

const EXPECTATIONS = [
  "商务英语 (Business English)",
  "日常口语 (Daily Speaking)",
  "少儿英语 (Kids English)",
  "学术英语 (Academic English)",
  "商务邮件 (Business Email)",
  "会议发言 (Meeting Presentation)",
  "面试技巧 (Job Interview)",
  "行业术语 (Industry Terminology)",
  "出国旅游 (Travel)"
];

// --- Markdown Components for Content Generation ---
const ContentMarkdownComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-slate-900 mb-4 mt-2" {...props} />,
  h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4 flex items-center gap-2 border-b border-purple-100 pb-2" {...props} />,
  h3: ({ node, ...props }) => <h3 className="text-lg font-bold text-purple-900 bg-purple-50 px-3 py-1.5 rounded-lg inline-block mt-6 mb-3" {...props} />,
  strong: ({ node, ...props }) => <span className="font-bold text-purple-700" {...props} />,
  ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-6 space-y-4 text-slate-700 mb-6" {...props} />,
  li: ({ node, ...props }) => <li className="pl-1 leading-relaxed marker:text-purple-400 whitespace-pre-wrap" {...props} />,
  p: ({ node, ...props }) => <p className="mb-4 leading-relaxed text-slate-700" {...props} />,
  table: ({ node, ...props }) => <div className="overflow-x-auto my-6 rounded-xl border border-purple-100 shadow-sm bg-white"><table className="min-w-full divide-y divide-purple-100" {...props} /></div>,
  thead: ({ node, ...props }) => <thead className="bg-purple-600 text-white" {...props} />,
  tbody: ({ node, ...props }) => <tbody className="bg-white divide-y divide-purple-50" {...props} />,
  tr: ({ node, ...props }) => <tr className="hover:bg-purple-50 transition-colors" {...props} />,
  th: ({ node, ...props }) => <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white border-r border-purple-500 last:border-r-0" {...props} />,
  td: ({ node, ...props }) => <td className="px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap border-r border-purple-50 last:border-r-0" {...props} />,
  blockquote: ({ node, ...props }) => <div className="bg-purple-50 border-l-4 border-purple-500 p-4 my-6 italic text-slate-700 rounded-r-lg shadow-sm"><span {...props} /></div>
};

// --- Markdown Components for Verification Report ---
const VerificationMarkdownComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  h1: ({ node, ...props }) => <h1 className="text-2xl font-black text-slate-900 border-b-2 border-slate-100 pb-3 mb-6" {...props} />,
  h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-slate-800 mt-6 mb-3 flex items-center gap-2" {...props} />,
  h3: ({ node, ...props }) => <h3 className="text-lg font-bold text-slate-700 mt-4 mb-2" {...props} />,
  // Special handling for Blockquotes to represent Alerts
  blockquote: ({ node, ...props }) => {
    // Check content to determine style if possible, or generic styling
    // Note: The prompt asks for "> 🔴" or "> 🟡". We can style the blockquote container generally.
    return (
      <div className="my-4 p-4 rounded-lg border-l-4 shadow-sm bg-slate-50 border-slate-300 verification-blockquote">
         <div className="text-slate-800 font-medium leading-relaxed" {...props} />
      </div>
    );
  },
  ul: ({ node, ...props }) => <ul className="space-y-2 mb-4" {...props} />,
  li: ({ node, ...props }) => <li className="flex items-start gap-2 text-slate-700 text-sm leading-relaxed" {...props}><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0"></span><span>{props.children}</span></li>,
  strong: ({ node, ...props }) => <span className="font-bold text-slate-900" {...props} />,
};


type ActiveTab = 'generate' | 'verify';

export const ValueGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('generate');

  // --- Generation State ---
  const [formData, setFormData] = useState({
    industry: INDUSTRIES[0],
    customIndustry: '',
    level: LEVELS[2],
    preferences: PREFERENCES[1],
    expectations: EXPECTATIONS[0],
    customExpectation: '',
    companyInfo: ''
  });
  const [generationCount, setGenerationCount] = useState(1);
  const [genResults, setGenResults] = useState<string[]>([]);
  const [currentGenIndex, setCurrentGenIndex] = useState(0);
  const [isGenLoading, setIsGenLoading] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [refineInput, setRefineInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // --- Verification State ---
  const [verifyType, setVerifyType] = useState<'planning' | 'content'>('planning');
  const [verifyTextInput, setVerifyTextInput] = useState('');
  const [verifyImages, setVerifyImages] = useState<string[]>([]);
  const [verifyAudio, setVerifyAudio] = useState<string | null>(null);
  const [verifyAudioName, setVerifyAudioName] = useState('');
  const [verifyResult, setVerifyResult] = useState<string | null>(null);
  const [isVerifyLoading, setIsVerifyLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null); // For Generation Export
  const reportRef = useRef<HTMLDivElement>(null); // For Verification Export

  // --- Generation Handlers ---
  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async (refinementInstructions?: string) => {
    setIsGenLoading(true);
    setIsEditing(false);
    
    if (!refinementInstructions) {
      setGenResults([]);
      setCurrentGenIndex(0);
      setGenProgress(0);
    }

    try {
      const finalIndustry = formData.industry.includes("自定义") ? formData.customIndustry : formData.industry;
      const finalExpectation = formData.customExpectation || formData.expectations;

      if (refinementInstructions && genResults.length > 0) {
        const prompt = VALUE_GENERATION_PROMPT({
          industry: finalIndustry,
          level: formData.level,
          preferences: formData.preferences,
          expectations: finalExpectation,
          companyInfo: formData.companyInfo,
          additionalInstructions: refinementInstructions,
          variationIndex: currentGenIndex + 1,
          totalVariations: genResults.length
        });

        const response = await sendMessageToGemini({ message: prompt });
        const newResults = [...genResults];
        newResults[currentGenIndex] = response.text || "生成失败";
        setGenResults(newResults);
        setRefineInput('');
      } else {
        const newResults: string[] = [];
        for (let i = 0; i < generationCount; i++) {
          setGenProgress(i + 1); 
          const prompt = VALUE_GENERATION_PROMPT({
            industry: finalIndustry,
            level: formData.level,
            preferences: formData.preferences,
            expectations: finalExpectation,
            companyInfo: formData.companyInfo,
            variationIndex: i + 1,
            totalVariations: generationCount
          });
          const response = await sendMessageToGemini({ message: prompt });
          newResults.push(response.text || "生成失败");
          setGenResults([...newResults]); // Update incrementally
        }
      }
    } catch (error) {
      alert("生成失败，请重试");
    } finally {
      setIsGenLoading(false);
    }
  };

  // --- Verification Handlers ---
  const handleVerifyImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => setVerifyImages(prev => [...prev, reader.result as string]);
        reader.readAsDataURL(file);
      });
    }
  };

  const handleVerifyAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVerifyAudioName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => setVerifyAudio(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleVerify = async () => {
    if ((!verifyTextInput.trim() && verifyImages.length === 0 && !verifyAudio) || isVerifyLoading) return;
    
    setIsVerifyLoading(true);
    setVerifyResult(null);

    try {
      const prompt = VERIFICATION_PROMPT_TEMPLATE(verifyType, verifyTextInput);
      const response = await sendMessageToGemini({
        message: prompt,
        images: verifyImages,
        audio: verifyAudio || undefined,
        temperature: 0.2 // Strict
      });
      setVerifyResult(response.text || "验证分析失败");
    } catch (error) {
      alert("验证失败，请检查文件大小或网络连接");
    } finally {
      setIsVerifyLoading(false);
    }
  };

  const clearVerify = () => {
    setVerifyTextInput('');
    setVerifyImages([]);
    setVerifyAudio(null);
    setVerifyAudioName('');
    setVerifyResult(null);
  };

  // --- Export Logic (Reused Clone Strategy) ---
  const handleDownload = async (targetRef: React.RefObject<HTMLDivElement>, filenamePrefix: string, type: 'image' | 'pdf') => {
    if (!targetRef.current) return;
    try {
      // 1. Clone & Isolate
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      container.style.width = '800px'; 
      document.body.appendChild(container);

      const clone = targetRef.current.cloneNode(true) as HTMLElement;
      clone.style.width = '800px';
      clone.style.height = 'auto';
      clone.style.overflow = 'visible';
      clone.style.background = '#ffffff';
      clone.style.padding = '40px';
      container.appendChild(clone);

      // 2. Style Fixes for Export
      const styleFix = document.createElement('style');
      styleFix.innerHTML = `
        .verification-blockquote { background: #f8fafc !important; border: 1px solid #e2e8f0 !important; border-left: 4px solid #64748b !important; page-break-inside: avoid; }
        /* Highlight Specific Alerts based on text content if possible, or generic */
        div, p, span, li { color: #0f172a !important; } 
        table { width: 100% !important; border-collapse: collapse !important; }
        th, td { border: 1px solid #cbd5e1 !important; }
      `;
      clone.appendChild(styleFix);

      // 3. Capture
      const canvas = await html2canvas(clone, { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: 880 });
      document.body.removeChild(container);

      // 4. Save
      if (type === 'image') {
        const link = document.createElement('a');
        link.download = `${filenamePrefix}_${new Date().getTime()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${filenamePrefix}_${new Date().getTime()}.pdf`);
      }
    } catch (e) {
      alert("导出失败，请重试");
    }
  };

  return (
    <div className="h-full flex flex-col p-0 md:p-0">
      
      {/* TABS */}
      <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 mb-4 p-1 w-fit mx-auto md:mx-0">
        <button
          onClick={() => setActiveTab('generate')}
          className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'generate' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Gift size={16} /> 500强行业资料生成
        </button>
        <button
          onClick={() => setActiveTab('verify')}
          className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'verify' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck size={16} /> 竞品课程验证 (新)
        </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
        
        {/* ======================= GENERATE TAB ======================= */}
        {activeTab === 'generate' && (
          <>
             {/* LEFT: Config */}
             <div className="w-full md:w-[360px] flex-shrink-0 flex flex-col gap-4 overflow-y-auto scrollbar-hide pb-20 md:pb-0">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                   <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Gift className="text-purple-600"/> 赋能配置</h2>
                   
                   <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-800">行业 / 背景</label>
                        <select value={formData.industry} onChange={(e) => updateField('industry', e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900">
                            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                        </select>
                        {formData.industry.includes("自定义") && (
                            <input type="text" placeholder="输入行业..." value={formData.customIndustry} onChange={(e) => updateField('customIndustry', e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400"/>
                        )}
                        <input type="text" placeholder="公司信息 (可选)" value={formData.companyInfo} onChange={(e) => updateField('companyInfo', e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400"/>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-800">英语程度</label>
                        <select value={formData.level} onChange={(e) => updateField('level', e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900">
                            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>

                      <div className="space-y-2">
                         <label className="text-sm font-bold text-slate-800">期望内容 & 数量</label>
                         <select value={formData.expectations} onChange={(e) => updateField('expectations', e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium mb-2 text-slate-900">
                            {EXPECTATIONS.map(e => <option key={e} value={e}>{e}</option>)}
                         </select>
                         <div className="flex gap-2">
                            <select value={formData.preferences} onChange={(e) => updateField('preferences', e.target.value)} className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900">
                                {PREFERENCES.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <select value={generationCount} onChange={(e) => setGenerationCount(Number(e.target.value))} className="w-20 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900">
                                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                         </div>
                      </div>
                   </div>

                   <button onClick={() => handleGenerate()} disabled={isGenLoading} className="w-full mt-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg disabled:opacity-70 transition-all flex items-center justify-center gap-2">
                      {isGenLoading ? <><Loader2 className="animate-spin" /> 生成中 ({genProgress}/{generationCount})...</> : <><Sparkles /> 一键生成</>}
                   </button>
                </div>
             </div>

             {/* RIGHT: Results */}
             <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-[500px] md:h-auto min-h-[400px]">
                {genResults.length > 0 ? (
                   <>
                      <div className="bg-purple-50 px-4 py-3 border-b border-purple-100 flex justify-between items-center flex-wrap gap-2 flex-shrink-0">
                         <div className="flex items-center gap-3">
                             <div className="flex items-center gap-2 bg-white rounded-lg px-2 py-1 shadow-sm border border-purple-100">
                                <button onClick={() => setCurrentGenIndex(prev => Math.max(0, prev - 1))} disabled={currentGenIndex === 0} className="p-1 hover:bg-purple-100 rounded disabled:opacity-30"><ChevronLeft size={16} className="text-purple-700"/></button>
                                <span className="text-xs font-bold text-purple-700">{currentGenIndex + 1} / {genResults.length}</span>
                                <button onClick={() => setCurrentGenIndex(prev => Math.min(genResults.length - 1, prev + 1))} disabled={currentGenIndex === genResults.length - 1} className="p-1 hover:bg-purple-100 rounded disabled:opacity-30"><ChevronRight size={16} className="text-purple-700"/></button>
                             </div>
                         </div>
                         <div className="flex gap-2">
                            <button onClick={() => setIsEditing(!isEditing)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold">{isEditing ? <Check size={14}/> : <Edit2 size={14}/>}</button>
                            <button onClick={() => handleDownload(contentRef, 'ME_Content', 'image')} className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex gap-1"><Download size={14}/> 图片</button>
                            <button onClick={() => handleDownload(contentRef, 'ME_Content', 'pdf')} className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-bold flex gap-1"><Download size={14}/> PDF</button>
                         </div>
                      </div>
                      
                      <div className="flex-1 bg-white relative overflow-y-auto">
                        {isEditing ? (
                             <textarea value={genResults[currentGenIndex] || ''} onChange={(e) => {const n=[...genResults]; n[currentGenIndex]=e.target.value; setGenResults(n)}} className="w-full h-full p-6 text-sm font-mono focus:outline-none resize-none bg-slate-50 text-slate-900"/>
                        ) : (
                             <div ref={contentRef} className="p-8 bg-white min-h-full">
                                <div className="absolute inset-0 pointer-events-none opacity-[0.03] select-none flex items-center justify-center"><div className="transform -rotate-12 text-6xl font-black text-slate-900">ME Sales Genius</div></div>
                                <div className="relative z-10"><ReactMarkdown remarkPlugins={[remarkGfm]} components={ContentMarkdownComponents}>{genResults[currentGenIndex] || ''}</ReactMarkdown></div>
                             </div>
                        )}
                      </div>
                   </>
                ) : (
                   <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-10"><LayoutTemplate size={64} className="mb-4"/><p>请在左侧配置并生成内容</p></div>
                )}
             </div>
          </>
        )}

        {/* ======================= VERIFY TAB ======================= */}
        {activeTab === 'verify' && (
           <>
              {/* LEFT: Verification Inputs */}
              <div className="w-full md:w-[400px] flex-shrink-0 flex flex-col gap-4 overflow-y-auto scrollbar-hide pb-20 md:pb-0">
                 <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><ShieldCheck className="text-slate-800"/> 竞品课程验证</h2>
                    
                    {/* Type Selection */}
                    <div className="grid grid-cols-2 gap-2 mb-6 bg-slate-100 p-1 rounded-lg">
                       <button onClick={() => setVerifyType('planning')} className={`py-2 text-xs font-bold rounded-md transition-all ${verifyType === 'planning' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                          课程规划验证
                       </button>
                       <button onClick={() => setVerifyType('content')} className={`py-2 text-xs font-bold rounded-md transition-all ${verifyType === 'content' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                          教学内容纠错
                       </button>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-4">
                       <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 focus-within:ring-2 focus-within:ring-slate-400 transition-all">
                          <textarea 
                             value={verifyTextInput}
                             onChange={(e) => setVerifyTextInput(e.target.value)}
                             placeholder={verifyType === 'planning' ? "在此粘贴其他机构的课程规划 (如: 100小时达到B2...)" : "在此粘贴需要检查的教学文本/课件内容..."}
                             className="w-full bg-transparent text-sm text-slate-900 focus:outline-none min-h-[100px] resize-y placeholder:text-slate-400"
                          />
                       </div>

                       <div className="grid grid-cols-2 gap-3">
                          <div onClick={() => fileInputRef.current?.click()} className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-colors">
                             <ImageIcon className="text-slate-400 mb-1"/>
                             <span className="text-xs text-slate-500">上传图片/截图</span>
                             <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleVerifyImageUpload}/>
                          </div>
                          <div onClick={() => audioInputRef.current?.click()} className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-colors">
                             <FileAudio className="text-slate-400 mb-1"/>
                             <span className="text-xs text-slate-500">上传录音文件</span>
                             <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={handleVerifyAudioUpload}/>
                          </div>
                       </div>

                       {/* Preview Uploads */}
                       {(verifyImages.length > 0 || verifyAudio) && (
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap gap-2">
                             {verifyImages.map((img, i) => (
                                <div key={i} className="relative w-12 h-12 group"><img src={img} className="w-full h-full object-cover rounded-md border border-slate-200"/><button onClick={() => setVerifyImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100"><X size={8}/></button></div>
                             ))}
                             {verifyAudio && <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-slate-200 text-xs truncate max-w-full"><FileAudio size={12}/> {verifyAudioName}</div>}
                             <button onClick={clearVerify} className="ml-auto text-xs text-red-500 underline">清空</button>
                          </div>
                       )}
                    </div>

                    <button onClick={handleVerify} disabled={isVerifyLoading || (!verifyTextInput && verifyImages.length === 0 && !verifyAudio)} className="w-full mt-6 py-3 bg-slate-800 text-white rounded-xl font-bold shadow-md hover:bg-slate-900 disabled:opacity-70 transition-all flex items-center justify-center gap-2">
                       {isVerifyLoading ? <><Loader2 className="animate-spin" /> AI 权威验证中...</> : <><ShieldCheck /> 开始验证</>}
                    </button>

                    <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700 leading-relaxed">
                       <p className="font-bold flex items-center gap-1 mb-1"><BookOpen size={12}/> 验证标准:</p>
                       {verifyType === 'planning' ? '基于 CEFR 欧洲共同语言参考标准 & 剑桥官方建议课时数。' : '基于标准英语语法体系 & 权威教育学理论。'}
                    </div>
                 </div>
              </div>

              {/* RIGHT: Verification Report */}
              <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-[500px] md:h-auto min-h-[500px]">
                 {verifyResult ? (
                    <>
                       <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex justify-between items-center">
                          <span className="text-white font-bold flex items-center gap-2 text-sm"><FileText size={16}/> 验证报告</span>
                          <div className="flex gap-2">
                             <button onClick={() => handleDownload(reportRef, 'ME_Verify_Report', 'image')} className="px-3 py-1.5 bg-slate-700 text-white border border-slate-600 rounded-lg text-xs font-bold hover:bg-slate-600 transition-all flex gap-1"><Download size={14}/> 图片</button>
                             <button onClick={() => handleDownload(reportRef, 'ME_Verify_Report', 'pdf')} className="px-3 py-1.5 bg-slate-700 text-white border border-slate-600 rounded-lg text-xs font-bold hover:bg-slate-600 transition-all flex gap-1"><Download size={14}/> PDF</button>
                          </div>
                       </div>
                       
                       <div className="flex-1 bg-white relative overflow-y-auto">
                          <div ref={reportRef} className="p-10 bg-white min-h-full relative">
                              {/* Watermark */}
                             <div className="absolute inset-0 pointer-events-none opacity-[0.03] select-none flex items-center justify-center"><div className="transform -rotate-12 text-5xl font-black text-slate-900 whitespace-nowrap">ME Verification Report</div></div>
                             
                             <div className="relative z-10">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={VerificationMarkdownComponents}>
                                   {verifyResult}
                                </ReactMarkdown>
                             </div>

                             <div className="mt-10 pt-6 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                                <span>ME Intelligent Verification System</span>
                                <span>Based on CEFR & Cambridge Standards</span>
                             </div>
                          </div>
                       </div>
                    </>
                 ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-10 text-center">
                       <ShieldCheck size={64} className="mb-4 text-slate-200"/>
                       <h3 className="text-xl font-bold text-slate-400 mb-2">等待验证</h3>
                       <p className="max-w-xs mx-auto text-sm text-slate-400">请上传竞品的课程规划或教材内容，AI 将运用权威标准为您排雷。</p>
                    </div>
                 )}
              </div>
           </>
        )}

      </div>
    </div>
  );
};
