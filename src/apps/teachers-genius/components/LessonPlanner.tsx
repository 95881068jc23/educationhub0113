
import React, { useState, useRef } from 'react';
import { sendMessageToGemini } from '../services/gemini';
import { LESSON_PLAN_PROMPT } from '../constants';
import { 
  Sparkles, 
  Loader2, 
  Download, 
  Edit2, 
  Check, 
  Layers, 
  LayoutTemplate,
  FileText,
  FileImage,
  Gamepad2,
  BookOpen,
  Upload,
  X,
  Paperclip
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ToneSelector } from './ToneSelector';

const MODULE_TYPES = [
  "基础架构 (Foundation - Grammar/Vocab)",
  "书面 vs 地道 (The Bridge)",
  "实战场景模拟 (Scenario/Roleplay)",
  "互动游戏 (Interaction/Games)",
  "软技能与文化 (Soft Skills)",
  "纠错与复盘 (Feedback Summary)",
  "自定义 (Custom)"
];

const CEFR_LEVELS = [
  "A0-A1 (Zero/Beginner)",
  "A2 (Elementary)",
  "B1 (Intermediate)",
  "B2 (Upper Intermediate)",
  "C1 (Advanced)"
];

// Helper to remove bold markdown
const cleanText = (text: string) => text.replace(/\*\*/g, '');

// Enhanced Markdown Components for Professional Look
const MarkdownComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  h1: ({ node, ...props }) => (
    <h1 className="text-3xl font-black text-slate-900 mb-6 pb-4 border-b-2 border-slate-200" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2 className="text-xl font-bold text-teal-800 mt-8 mb-4 flex items-center gap-2 border-l-4 border-teal-500 pl-3 bg-teal-50 py-2 rounded-r-lg" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="text-lg font-bold text-slate-800 mt-6 mb-2" {...props} />
  ),
  p: ({ node, ...props }) => (
    <p className="mb-4 text-slate-700 leading-relaxed" {...props} />
  ),
  ul: ({ node, ...props }) => (
    <ul className="list-disc ml-6 space-y-2 mb-6 text-slate-700 marker:text-teal-500" {...props} />
  ),
  ol: ({ node, ...props }) => (
    <ol className="list-decimal ml-6 space-y-2 mb-6 text-slate-700 marker:text-teal-500 font-medium" {...props} />
  ),
  li: ({ node, ...props }) => (
    <li className="leading-relaxed pl-1" {...props} />
  ),
  strong: ({ node, ...props }) => (
    <span className="font-bold text-slate-900 bg-slate-100 px-1 rounded" {...props} />
  ),
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-6 rounded-lg border border-slate-200 shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 bg-white text-sm" {...props} />
    </div>
  ),
  thead: ({ node, ...props }) => (
    <thead className="bg-slate-800 text-white" {...props} />
  ),
  th: ({ node, ...props }) => (
    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" {...props} />
  ),
  td: ({ node, ...props }) => (
    <td className="px-4 py-3 text-slate-700 border-t border-slate-100 whitespace-pre-wrap" {...props} />
  ),
  blockquote: ({ node, ...props }) => (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 my-6 italic text-slate-700 rounded-r-lg relative shadow-sm">
       <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1 not-italic">💡 Teaching Tip / 教学备注</div>
       <span {...props} />
    </div>
  ),
  code: ({ node, ...props }) => (
    <code className="bg-slate-100 text-pink-600 px-1 py-0.5 rounded text-sm font-mono" {...props} />
  )
};

interface LessonPlannerProps {
  globalTones?: string[]; 
}

export const LessonPlanner: React.FC<LessonPlannerProps> = ({ globalTones: initialTones }) => {
  const [formData, setFormData] = useState({
    topic: '',
    level: CEFR_LEVELS[1],
    moduleType: MODULE_TYPES[0],
    customModule: '',
    studentProfile: '',
    duration: '45 mins',
    sourceText: ''
  });
  
  const [generationMode, setGenerationMode] = useState<'full_plan' | 'interaction_kit'>('full_plan');
  const [localTones, setLocalTones] = useState<string[]>(initialTones || []);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const [results, setResults] = useState<string[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        setUploadedFiles(prev => [...prev, file]);
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!formData.topic && !formData.sourceText && uploadedFiles.length === 0) {
        alert("Please provide a topic or source material.");
        return;
    }
    
    setIsLoading(true);
    setResults([]);
    
    try {
      // If full plan, ignore module selector logic, pass default.
      const moduleToUse = generationMode === 'full_plan' 
        ? "General" 
        : (formData.moduleType === '自定义 (Custom)' ? formData.customModule : formData.moduleType);

      const prompt = LESSON_PLAN_PROMPT({
        topic: formData.topic || "Generative Topic based on Content",
        level: formData.level,
        moduleType: moduleToUse,
        duration: formData.duration,
        studentProfile: formData.studentProfile || 'General Adult Student',
        tones: localTones,
        mode: generationMode,
        sourceContext: formData.sourceText
      });

      const response = await sendMessageToGemini({ 
          message: prompt,
          files: uploadedFiles 
      });
      // Clean text before setting state
      setResults([cleanText(response.text || "Generation failed.")]);
      setCurrentResultIndex(0);
    } catch (e) {
      console.error(e);
      alert("Error generating lesson plan. Please try again or check file sizes.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDownload = async (type: 'image' | 'pdf') => {
    if (!contentRef.current) return;
    const element = contentRef.current;
    
    // 1. Temporarily modify styles to ensure full capture
    const originalStyle = {
      height: element.style.height,
      overflow: element.style.overflow,
      maxHeight: element.style.maxHeight,
      background: element.style.background
    };
    
    // Force white background and full height expansion
    element.style.height = 'auto';
    element.style.overflow = 'visible';
    element.style.maxHeight = 'none';
    element.style.background = '#ffffff';

    try {
        const canvas = await html2canvas(element, { 
          scale: 2, 
          useCORS: true, 
          backgroundColor: '#ffffff',
          windowHeight: element.scrollHeight + 100 // Buffer
        });
        
        // Restore styles immediately
        element.style.height = originalStyle.height;
        element.style.overflow = originalStyle.overflow;
        element.style.maxHeight = originalStyle.maxHeight;
        element.style.background = originalStyle.background;

        if (type === 'image') {
            const link = document.createElement('a');
            link.download = `Lesson_${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } else {
             const imgData = canvas.toDataURL('image/png');
             const pdf = new jsPDF('p', 'mm', 'a4');
             const pdfWidth = pdf.internal.pageSize.getWidth();
             const pdfHeight = pdf.internal.pageSize.getHeight();
             const imgProps = pdf.getImageProperties(imgData);
             const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
             
             // Multi-page logic
             let heightLeft = imgHeight;
             let position = 0;

             // First page
             pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
             heightLeft -= pdfHeight;

             // Subsequent pages
             while (heightLeft >= 0) {
               position = heightLeft - imgHeight; // Shift the image up
               pdf.addPage();
               pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
               heightLeft -= pdfHeight;
             }
             
             pdf.save(`Lesson_${Date.now()}.pdf`);
        }
    } catch(e) { 
        console.error("Export failed:", e); 
        // Ensure restore on fail
        element.style.height = originalStyle.height;
        element.style.overflow = originalStyle.overflow;
        element.style.maxHeight = originalStyle.maxHeight;
        element.style.background = originalStyle.background;
        alert("Export failed. Please try again.");
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 p-4 md:p-0">
      {/* Config Panel */}
      <div className="w-full md:w-[360px] flex-shrink-0 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-y-auto">
         <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Layers className="text-teal-600" /> 课件内容生成器
         </h2>
         
         <div className="space-y-5">
            {/* Generation Mode Selector */}
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 flex gap-2">
               <button 
                 onClick={() => setGenerationMode('full_plan')}
                 className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${generationMode === 'full_plan' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
               >
                 <BookOpen size={14}/> 完整课件
               </button>
               <button 
                 onClick={() => setGenerationMode('interaction_kit')}
                 className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${generationMode === 'interaction_kit' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
               >
                 <Gamepad2 size={14}/> 互动指导
               </button>
            </div>

            {/* Core Info */}
            <div>
               <label className="text-sm font-bold text-slate-700 block mb-1.5">Topic (课程主题)</label>
               <input 
                 type="text" 
                 value={formData.topic} 
                 onChange={(e) => updateField('topic', e.target.value)}
                 placeholder="e.g. Asking for a refund, Networking"
                 className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:ring-2 focus:ring-teal-500 outline-none text-slate-900 font-medium"
               />
            </div>

            {/* Source Material Section */}
            <div>
               <label className="text-sm font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                  Source Material (素材 - 可选)
                  <span className="text-[10px] font-normal text-slate-400 bg-slate-100 px-1.5 rounded">PDF / IMG / Text</span>
               </label>
               <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-3">
                  {/* File Uploader */}
                  <div>
                     <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-xs font-bold text-slate-500 hover:text-teal-600 hover:border-teal-400 hover:bg-teal-50 transition-all flex items-center justify-center gap-2"
                     >
                        <Upload size={14}/> Upload PDF or Images
                     </button>
                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="application/pdf,image/*" 
                        multiple 
                        onChange={handleFileUpload}
                     />
                     {/* File List */}
                     {uploadedFiles.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                           {uploadedFiles.map((file, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-white px-2 py-1.5 rounded border border-slate-200 shadow-sm">
                                 <div className="flex items-center gap-2 overflow-hidden">
                                    {file.type.includes('pdf') ? <FileText size={14} className="text-red-500 flex-shrink-0"/> : <FileImage size={14} className="text-blue-500 flex-shrink-0"/>}
                                    <span className="text-xs text-slate-700 truncate max-w-[150px]">{file.name}</span>
                                 </div>
                                 <button onClick={() => removeFile(idx)} className="text-slate-400 hover:text-red-500"><X size={14}/></button>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
                  
                  {/* Text Input */}
                  <textarea 
                     value={formData.sourceText}
                     onChange={(e) => updateField('sourceText', e.target.value)}
                     placeholder="Paste text content here..."
                     className="w-full p-2 border border-slate-200 rounded-lg text-xs h-20 resize-none outline-none focus:border-teal-400"
                  />
               </div>
            </div>
            
            {/* Conditional Module Selector */}
            {generationMode === 'interaction_kit' && (
              <div className="animate-in fade-in slide-in-from-top-2">
                 <label className="text-sm font-bold text-indigo-700 block mb-1.5">Module (互动板块)</label>
                 <select 
                   value={formData.moduleType}
                   onChange={(e) => updateField('moduleType', e.target.value)}
                   className="w-full p-3 border border-indigo-200 rounded-xl bg-indigo-50 text-sm outline-none text-slate-900 font-medium"
                 >
                   {MODULE_TYPES.map(m => <option key={m} value={m} className="text-slate-900">{m}</option>)}
                 </select>
                 {formData.moduleType === '自定义 (Custom)' && (
                   <input 
                     type="text" 
                     value={formData.customModule}
                     onChange={(e) => updateField('customModule', e.target.value)}
                     placeholder="e.g. Debate, Phonics Review"
                     className="w-full mt-2 p-3 border border-indigo-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
                   />
                 )}
              </div>
            )}

            <div>
               <label className="text-sm font-bold text-slate-700 block mb-1.5">Student Level (CEFR)</label>
               <select 
                 value={formData.level}
                 onChange={(e) => updateField('level', e.target.value)}
                 className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none text-slate-900 font-medium"
               >
                 {CEFR_LEVELS.map(l => <option key={l} value={l} className="text-slate-900">{l}</option>)}
               </select>
            </div>
            
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
               <ToneSelector selectedTones={localTones} onChange={setLocalTones} compact label="教学风格 (Teaching Style)" />
            </div>

            <button 
              onClick={handleGenerate}
              disabled={isLoading || (!formData.topic && !formData.sourceText && uploadedFiles.length === 0)}
              className={`w-full py-4 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 mt-4 shadow-lg ${generationMode === 'full_plan' ? 'bg-teal-600 shadow-teal-100' : 'bg-indigo-600 shadow-indigo-100'}`}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles />} 
              {generationMode === 'full_plan' ? '生成完整双语课件' : '生成互动游戏指导 (5+)'}
            </button>
         </div>
      </div>

      {/* Preview Panel */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden h-[calc(100vh-140px)] md:h-auto">
         {results.length > 0 ? (
            <>
               <div className="p-3 border-b bg-slate-50 flex justify-between items-center">
                  <span className={`text-sm font-bold flex items-center gap-2 ${generationMode === 'full_plan' ? 'text-teal-700' : 'text-indigo-700'}`}>
                     {generationMode === 'full_plan' ? <FileText size={16}/> : <Gamepad2 size={16}/>}
                     {generationMode === 'full_plan' ? 'Comprehensive Lesson Plan' : 'Interactive Teaching Toolkit'}
                  </span>
                  <div className="flex gap-2">
                     <button onClick={() => setIsEditing(!isEditing)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                        {isEditing ? <><Check size={14}/> 完成</> : <><Edit2 size={14}/> 编辑</>}
                     </button>
                     <button onClick={() => handleDownload('image')} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm">
                        <FileImage size={14}/> 导出图片
                     </button>
                     <button onClick={() => handleDownload('pdf')} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors shadow-sm">
                        <Download size={14}/> 导出 PDF
                     </button>
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto bg-white relative">
                  {isEditing ? (
                     <textarea 
                        value={results[currentResultIndex]} 
                        onChange={(e) => {
                           const newRes = [...results];
                           newRes[currentResultIndex] = e.target.value;
                           setResults(newRes);
                        }}
                        className="w-full h-full p-8 outline-none font-mono text-sm text-slate-800 bg-slate-50 resize-none leading-relaxed"
                     />
                  ) : (
                     <div ref={contentRef} className="p-8 md:p-12 min-h-full bg-white max-w-4xl mx-auto">
                        <div className="prose prose-slate prose-lg max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                               {results[currentResultIndex]}
                            </ReactMarkdown>
                        </div>
                     </div>
                  )}
               </div>
            </>
         ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
               <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <LayoutTemplate size={40} className="text-slate-300"/>
               </div>
               <h3 className="text-lg font-bold text-slate-600 mb-2">准备生成</h3>
               <p className="text-sm max-w-xs text-center">
                 请在左侧选择生成模式，并可上传 PDF/图片 作为素材。
                 <br/><br/>
                 <span className="font-bold text-teal-600">完整课件</span>：适合备课，含具体Slide内容和脚本。
                 <br/>
                 <span className="font-bold text-indigo-600">互动指导</span>：适合新手，含5+个具体游戏与控场话术。
               </p>
            </div>
         )}
      </div>
    </div>
  );
};
