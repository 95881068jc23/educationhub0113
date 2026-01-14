
import React, { useState, useRef } from 'react';
import { sendMessageToGemini } from '../services/gemini';
import { VALUE_GENERATION_PROMPT } from '../constants';
import { Gift, Loader2, Copy, CheckCircle, Sparkles, Building2, GraduationCap, Target, Download, Edit2, Check, RefreshCw, Layers, ChevronLeft, ChevronRight, LayoutTemplate } from 'lucide-react';
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

const MarkdownComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  h1: ({ node, ...props }) => (
    <h1 className="text-2xl font-bold text-slate-900 mb-4 mt-2" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4 flex items-center gap-2 border-b border-purple-100 pb-2" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="text-lg font-bold text-purple-900 bg-purple-50 px-3 py-1.5 rounded-lg inline-block mt-6 mb-3" {...props} />
  ),
  strong: ({ node, ...props }) => (
    <span className="font-bold text-purple-700" {...props} />
  ),
  ul: ({ node, ...props }) => (
    <ul className="list-disc list-outside ml-6 space-y-4 text-slate-700 mb-6" {...props} />
  ),
  li: ({ node, ...props }) => (
    <li className="pl-1 leading-relaxed marker:text-purple-400 whitespace-pre-wrap" {...props} />
  ),
  p: ({ node, ...props }) => (
    <p className="mb-4 leading-relaxed text-slate-700" {...props} />
  ),
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-6 rounded-xl border border-purple-100 shadow-sm bg-white">
      <table className="min-w-full divide-y divide-purple-100" {...props} />
    </div>
  ),
  thead: ({ node, ...props }) => (
    <thead className="bg-purple-600 text-white" {...props} />
  ),
  tbody: ({ node, ...props }) => (
    <tbody className="bg-white divide-y divide-purple-50" {...props} />
  ),
  tr: ({ node, ...props }) => (
    <tr className="hover:bg-purple-50 transition-colors" {...props} />
  ),
  th: ({ node, ...props }) => (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white border-r border-purple-500 last:border-r-0" {...props} />
  ),
  td: ({ node, ...props }) => (
    <td className="px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap border-r border-purple-50 last:border-r-0" {...props} />
  ),
  blockquote: ({ node, ...props }) => (
     <div className="bg-purple-50 border-l-4 border-purple-500 p-4 my-6 italic text-slate-700 rounded-r-lg shadow-sm">
       <span {...props} />
     </div>
  )
};

export const ValueGenerator: React.FC = () => {
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
  const [results, setResults] = useState<string[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [refineInput, setRefineInput] = useState('');
  
  const contentRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async (refinementInstructions?: string) => {
    setIsLoading(true);
    setCopied(false);
    setIsEditing(false);
    
    if (!refinementInstructions) {
      setResults([]);
      setCurrentResultIndex(0);
      setProgress(0);
    }

    try {
      const finalIndustry = formData.industry.includes("自定义") ? formData.customIndustry : formData.industry;
      const finalExpectation = formData.customExpectation || formData.expectations;

      if (refinementInstructions && results.length > 0) {
        const prompt = VALUE_GENERATION_PROMPT({
          industry: finalIndustry,
          level: formData.level,
          preferences: formData.preferences,
          expectations: finalExpectation,
          companyInfo: formData.companyInfo,
          additionalInstructions: refinementInstructions,
          variationIndex: currentResultIndex + 1,
          totalVariations: results.length
        });

        const response = await sendMessageToGemini({ message: prompt });
        const newText = response.text || "生成失败，请重试";
        
        const newResults = [...results];
        newResults[currentResultIndex] = newText;
        setResults(newResults);
        setRefineInput('');

      } else {
        const newResults: string[] = [];
        const count = generationCount;

        for (let i = 0; i < count; i++) {
          setProgress(i + 1); 
          const prompt = VALUE_GENERATION_PROMPT({
            industry: finalIndustry,
            level: formData.level,
            preferences: formData.preferences,
            expectations: finalExpectation,
            companyInfo: formData.companyInfo,
            variationIndex: i + 1,
            totalVariations: count
          });
          
          const response = await sendMessageToGemini({ message: prompt });
          newResults.push(response.text || "生成失败");
          setResults([...newResults]);
        }
      }
      
    } catch (error) {
      console.error(error);
      alert("部分内容生成失败或网络中断");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    const text = results[currentResultIndex];
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleResultChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newResults = [...results];
    newResults[currentResultIndex] = e.target.value;
    setResults(newResults);
  };

  const handleDownload = async (type: 'image' | 'pdf') => {
    if (!contentRef.current) return;

    try {
      const originalStyle = contentRef.current.style.cssText;
      contentRef.current.style.overflow = 'visible';
      contentRef.current.style.height = 'auto';
      contentRef.current.style.background = '#ffffff';

      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      contentRef.current.style.cssText = originalStyle;

      if (type === 'image') {
        const link = document.createElement('a');
        link.download = `ME_Content_v${currentResultIndex + 1}_${new Date().getTime()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'p',
          unit: 'mm',
          format: 'a4',
        });
        
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`ME_Content_v${currentResultIndex + 1}_${new Date().getTime()}.pdf`);
      }
    } catch (e) {
      console.error("Download failed", e);
      alert("下载失败，请重试");
    }
  };

  const currentResult = results[currentResultIndex];

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 p-4 md:p-0">
      
      {/* LEFT COLUMN: Configuration Panel */}
      <div className="w-full md:w-[360px] flex-shrink-0 flex flex-col gap-4 overflow-y-auto scrollbar-hide">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <header className="mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Gift className="text-purple-600" />
              价值赋能配置
            </h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              定制高价值学习资料，维护客情，建立专家形象。
            </p>
          </header>

          <div className="space-y-5">
            {/* Industry / Background */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <Building2 size={16} className="text-purple-600" /> 客户行业 / 背景
              </label>
              <select 
                value={formData.industry} 
                onChange={(e) => updateField('industry', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {INDUSTRIES.map(i => <option key={i} value={i} className="text-black">{i}</option>)}
              </select>
              {formData.industry.includes("自定义") && (
                <input 
                  type="text" 
                  placeholder="请输入具体行业 (如: 宠物医疗)" 
                  value={formData.customIndustry}
                  onChange={(e) => updateField('customIndustry', e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-black focus:outline-none focus:ring-2 focus:ring-purple-500 animate-in fade-in"
                />
              )}
              <input 
                type="text" 
                placeholder="客户公司信息 (可选, 如: Tesla Shanghai)" 
                value={formData.companyInfo}
                onChange={(e) => updateField('companyInfo', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-black focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Level */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <GraduationCap size={16} className="text-purple-600" /> 英语程度
              </label>
              <select 
                value={formData.level} 
                onChange={(e) => updateField('level', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {LEVELS.map(l => <option key={l} value={l} className="text-black">{l}</option>)}
              </select>
            </div>

            {/* Goals & Preferences */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <Target size={16} className="text-purple-600" /> 期望内容 & 偏好
              </label>
              <select 
                value={formData.expectations} 
                onChange={(e) => updateField('expectations', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2"
              >
                {EXPECTATIONS.map(e => <option key={e} value={e} className="text-black">{e}</option>)}
              </select>
              
              <div className="flex gap-2">
                <select 
                  value={formData.preferences} 
                  onChange={(e) => updateField('preferences', e.target.value)}
                  className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {PREFERENCES.map(p => <option key={p} value={p} className="text-black">{p}</option>)}
                </select>
                
                <div className="w-20 relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2">
                    <Layers size={14} className="text-purple-600 mr-1 flex-shrink-0"/>
                    <select
                      value={generationCount}
                      onChange={(e) => setGenerationCount(Number(e.target.value))}
                      className="w-full h-full bg-transparent focus:outline-none text-sm font-bold text-slate-900 appearance-none"
                    >
                      {[1,2,3,4,5].map(n => (
                        <option key={n} value={n} className="text-black">{n}</option>
                      ))}
                    </select>
                </div>
              </div>
              <input 
                type="text" 
                placeholder="其他具体需求 (可选)" 
                value={formData.customExpectation}
                onChange={(e) => updateField('customExpectation', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-black focus:outline-none focus:ring-2 focus:ring-purple-500 mt-2"
              />
            </div>
          </div>

          <button
            onClick={() => handleGenerate()}
            disabled={isLoading}
            className="w-full mt-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg disabled:opacity-70 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" /> 
                生成 ({progress}/{generationCount})...
              </>
            ) : (
              <>
                <Sparkles className="fill-current" /> 一键生成 ({generationCount}份)
              </>
            )}
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: Results / Preview */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-[calc(100vh-140px)] md:h-auto min-h-[500px]">
        {results.length > 0 ? (
          <>
            {/* Action Bar */}
            <div className="bg-purple-50 px-4 py-3 border-b border-purple-100 flex justify-between items-center flex-wrap gap-2 flex-shrink-0">
              <div className="flex items-center gap-3">
                 <div className="flex items-center gap-2 bg-white rounded-lg px-2 py-1 shadow-sm border border-purple-100">
                    <button 
                      onClick={() => setCurrentResultIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentResultIndex === 0}
                      className="p-1 hover:bg-purple-100 rounded disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft size={16} className="text-purple-700"/>
                    </button>
                    <span className="text-xs font-bold text-purple-700 min-w-[50px] text-center">
                      {currentResultIndex + 1} / {results.length}
                    </span>
                    <button 
                      onClick={() => setCurrentResultIndex(prev => Math.min(results.length - 1, prev + 1))}
                      disabled={currentResultIndex === results.length - 1}
                      className="p-1 hover:bg-purple-100 rounded disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight size={16} className="text-purple-700"/>
                    </button>
                 </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isEditing ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                   {isEditing ? <><Check size={14}/> 完成</> : <><Edit2 size={14}/> 编辑</>}
                </button>
                
                <button 
                  onClick={copyToClipboard}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    copied ? 'bg-green-100 text-green-700' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                  {copied ? '已复制' : '复制'}
                </button>

                 <div className="h-4 w-px bg-slate-300 mx-1"></div>

                <button 
                   onClick={() => handleDownload('image')}
                   className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all"
                >
                   <Download size={14} /> 图片
                </button>
                 <button 
                   onClick={() => handleDownload('pdf')}
                   className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-100 transition-all"
                >
                   <Download size={14} /> PDF
                </button>
              </div>
            </div>

            {/* Regeneration Bar */}
            <div className="bg-white px-4 py-3 border-b border-slate-100 flex items-center gap-2 flex-shrink-0">
              <input 
                type="text" 
                value={refineInput}
                onChange={(e) => setRefineInput(e.target.value)}
                placeholder={`调整当前版本 (如: 换一批单词, 语气更专业)`}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                onKeyDown={(e) => {
                  if(e.key === 'Enter' && !isLoading) handleGenerate(refineInput);
                }}
              />
              <button 
                onClick={() => handleGenerate(refineInput)}
                disabled={isLoading || !refineInput.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 transition-all"
              >
                 {isLoading ? <Loader2 size={16} className="animate-spin"/> : <RefreshCw size={16}/>}
                 重写
              </button>
            </div>
            
            {/* Content Display */}
            <div className="flex-1 bg-white relative overflow-y-auto">
               {isEditing ? (
                 <textarea 
                   value={currentResult || ''}
                   onChange={handleResultChange}
                   className="w-full h-full p-6 text-sm font-mono text-slate-800 focus:outline-none resize-none bg-slate-50"
                 />
               ) : (
                 <div ref={contentRef} className="p-8 bg-white relative min-h-full">
                    {/* Watermark */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] select-none overflow-hidden">
                       <div className="transform -rotate-12 text-6xl font-black text-slate-900 whitespace-nowrap">
                         Marvellous Education (ME)
                       </div>
                    </div>
                     <div className="absolute inset-0 pointer-events-none opacity-[0.02] select-none overflow-hidden flex flex-wrap content-center justify-center gap-32">
                        {[...Array(6)].map((_, i) => (
                           <div key={i} className="transform -rotate-12 text-2xl font-bold text-slate-900">ME Sales Genius</div>
                        ))}
                     </div>

                    <div className="relative z-10 pb-10">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                        {currentResult || ''}
                      </ReactMarkdown>
                    </div>
                 </div>
               )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-10 text-center">
            <LayoutTemplate size={64} className="mb-6 text-slate-200" strokeWidth={1} />
            <h3 className="text-xl font-bold text-slate-300 mb-2">准备生成</h3>
            <p className="max-w-xs mx-auto text-sm text-slate-300">
              请在左侧配置客户背景与需求，点击生成按钮获取定制化的赋能资料。
            </p>
          </div>
        )}
      </div>
    </div>
  );
};