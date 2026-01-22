
import React, { useState, useRef, useEffect } from 'react';
import { ProductType } from '../types';
import { sendMessageToGemini } from '../services/gemini';
import { ANALYSIS_PROMPT_TEMPLATE } from '../constants';
import { FileAudio, Image as ImageIcon, Wand2, Loader2, FileText, Download, Compass, RefreshCw, Users, Presentation, ChevronDown, FileImage, File } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { uploadFile } from '../../../services/storageService';
import { useAuth } from '../../../contexts/AuthContext';

const cleanText = (text: string) => text.replace(/\*\*/g, '');

interface 
import React, { useState, useRef, useEffect } from 'react';
import { ProductType, MessageRole, ChatMessage } from '../types';
import { sendMessageToGemini } from '../services/gemini';
import { supabase } from '../../../services/supabaseClient';
import { useAuth } from '../../../contexts/AuthContext';
import { logUserAction } from '../../../services/storageService';
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
    <div className="border-b-2 border-navy-100 pb-4 mb-6 mt-2">
       <h1 className="text-2xl font-black text-navy-900 flex items-center gap-2" {...props} />
    </div>
  ),
  h2: ({ node, ...props }) => (
    <h2 className="text-xl font-bold text-navy-800 mt-8 mb-4 flex items-center gap-2" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 
      className="text-lg font-bold text-navy-800 mt-6 mb-3 flex items-center gap-2 bg-navy-50 px-3 py-2 rounded-lg border-l-4 border-navy-600" 
      {...props} 
    />
  ),
  blockquote: ({ node, ...props }) => (
    <div className="relative group my-4">
       <div className="diagnosis-blockquote bg-navy-50/50 border-l-4 border-navy-500 rounded-r-lg p-4 shadow-sm">
          <blockquote className="text-navy-800 italic leading-relaxed m-0" {...props} />
       </div>
    </div>
  ),
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-6 rounded-xl border border-navy-200 shadow-sm bg-white">
      <table className="min-w-full divide-y divide-navy-100" {...props} />
    </div>
  ),
  thead: ({ node, ...props }) => (
    <thead className="bg-navy-100 text-navy-700" {...props} />
  ),
  tbody: ({ node, ...props }) => (
    <tbody className="bg-white divide-y divide-navy-50" {...props} />
  ),
  tr: ({ node, ...props }) => (
    <tr className="hover:bg-navy-50 transition-colors" {...props} />
  ),
  th: ({ node, ...props }) => (
    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-navy-600" {...props} />
  ),
  td: ({ node, ...props }) => (
    <td className="px-4 py-3 text-sm text-navy-700 whitespace-pre-wrap" {...props} />
  ),
  ul: ({ node, ...props }) => (
    <ul className="space-y-2 mb-4" {...props} />
  ),
  li: ({ node, ...props }) => (
    <li className="flex items-start gap-2 text-navy-700 leading-relaxed text-sm" {...props}>
       <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gold-500 flex-shrink-0"></span>
       <span>{props.children}</span>
    </li>
  ),
  p: ({ node, ...props }) => (
    <p className="mb-3 leading-relaxed text-navy-700 text-sm" {...props} />
  ),
  strong: ({ node, ...props }) => (
    <span className="font-bold text-navy-800" {...props} />
  ),
  hr: ({ node, ...props }) => (
    <hr className="my-8 border-navy-100" {...props} />
  )
};

// 🎨 2. Deep Dive Interaction Markdown Styles (Rich, distinct blocks)
const DeepDiveMarkdownComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  h1: ({node, ...props}) => <h3 className="text-lg font-bold text-navy-800 mt-4 mb-2 border-b border-navy-100 pb-2" {...props}/>,
  h2: ({node, ...props}) => <h3 className="text-base font-bold text-navy-700 mt-3 mb-2" {...props}/>,
  h3: ({node, ...props}) => <h3 className="text-sm font-bold text-navy-700 mt-3 mb-1 uppercase tracking-wider" {...props}/>,
  
  // Strong emphasis - Color block effect for key terms
  strong: ({node, ...props}) => <span className="font-bold text-navy-700 bg-navy-50 px-1 rounded mx-0.5 border border-navy-100/50" {...props}/>,
  
  // Paragraphs
  p: ({node, ...props}) => <p className="mb-3 leading-relaxed text-navy-700 last:mb-0 text-sm" {...props}/>,
  
  // Lists
  ul: ({node, ...props}) => <ul className="space-y-2 mb-3 ml-1 list-none" {...props}/>,
  li: ({node, ...props}) => (
    <li className="flex items-start gap-2 text-sm text-navy-700" {...props}>
      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gold-400 flex-shrink-0"></span>
      <span>{props.children}</span>
    </li>
  ),

  // Blockquotes - Used for Scripts or Important Insights (Color Block)
  blockquote: ({node, ...props}) => (
    <div className="my-3 border-l-4 border-navy-500 bg-navy-50/60 p-3 rounded-r-lg shadow-sm">
      <blockquote className="text-navy-800 text-sm italic m-0" {...props} />
    </div>
  ),

  // Tables - distinct styling for "Microscope Analysis"
  table: ({node, ...props}) => (
    <div className="overflow-x-auto my-3 rounded-lg border border-navy-200 shadow-sm bg-white">
      <table className="min-w-full divide-y divide-navy-100" {...props} />
    </div>
  ),
  thead: ({node, ...props}) => <thead className="bg-navy-50" {...props}/>,
  th: ({node, ...props}) => <th className="px-3 py-2 text-left text-xs font-bold text-navy-500 uppercase tracking-wider" {...props}/>,
  tbody: ({node, ...props}) => <tbody className="bg-white divide-y divide-navy-50" {...props}/>,
  tr: ({node, ...props}) => <tr className="hover:bg-navy-50/30 transition-colors" {...props}/>,
  td: ({node, ...props}) => <td className="px-3 py-2 text-sm text-navy-600 whitespace-pre-wrap align-top" {...props}/>,
  
  // Horizontal Rule
  hr: ({node, ...props}) => <hr className="my-4 border-navy-100" {...props}/>,
  
  // Code (sometimes used for emphasis)
  code: ({node, ...props}) => <code className="bg-navy-100 text-navy-600 px-1.5 py-0.5 rounded text-xs font-mono" {...props}/>
};

export const CaseDiagnosis: React.FC<CaseDiagnosisProps> = ({ importedAudio, onClearImport }) => {
  const { user } = useAuth();
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
      setAudioFile(file);
      setAudioName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAudio(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const blobToBase64 = (blob: Blob, mimeType?: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // 如果提供了mimeType，确保使用正确的MIME类型
        if (mimeType && result.startsWith('data:application/octet-stream')) {
          // 替换错误的MIME类型
          const base64Data = result.split(',')[1];
          resolve(`data:${mimeType};base64,${base64Data}`);
        } else {
          resolve(result);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleAnalysis = async () => {
    if ((images.length === 0 && !audio) || isAnalyzing) return;
    
    setIsAnalyzing(true);
    setReport(null);
    setFollowUpMessages([]); // Clear previous chat
    setProgressStatus('正在初始化分析...');

    try {
      let fullTranscript = "";
      
      // Killer Solution: Chunking -> Transcription -> Analysis
      if (audioFile) {
        // 1. Upload original file to Supabase Storage (Background Operation)
        const uploadOriginalFile = async () => {
            try {
                const userId = user?.id || 'anonymous';
                const timestamp = Date.now();
                // Sanitize filename
                const sanitizedFileName = audioFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                const filePath = `${userId}/audio/${timestamp}-${sanitizedFileName}`;
                
                // Upload to Storage
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('user-files')
                    .upload(filePath, audioFile, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) {
                    console.error("Upload to Supabase Storage failed:", uploadError);
                    return;
                }

                // Get Public URL
                const { data: urlData } = supabase.storage
                    .from('user-files')
                    .getPublicUrl(filePath);

                // Insert into DB
                const { error: dbError } = await supabase
                    .from('user_files')
                    .insert({
                        user_id: userId,
                        file_name: sanitizedFileName,
                        file_type: 'audio',
                        file_path: filePath,
                        file_url: urlData.publicUrl,
                        file_size: audioFile.size,
                        mime_type: audioFile.type || 'audio/mpeg',
                        created_at: new Date().toISOString()
                    });
                
                if (dbError) {
                    console.error("Failed to save file metadata:", dbError);
                } else {
                    console.log("File saved successfully:", filePath);
                }
            } catch (err) {
                console.error("File save process error:", err);
            }
        };
        // Fire and forget upload to avoid blocking analysis, or await if critical.
        // User requested "save to database... failed", implying importance. 
        // We let it run but don't block the UI progress for analysis unless it fails? 
        // Let's run it.
        uploadOriginalFile();

        // Updated Strategy: Use smaller chunks (1MB) to avoid Vercel 4.5MB Payload Limit
        // 1MB * 1.33 (Base64 overhead) = ~1.33MB << 4.5MB Safe
        const CHUNK_SIZE = 1 * 1024 * 1024; 
        const totalChunks = Math.ceil(audioFile.size / CHUNK_SIZE);
        
        // Helper for delay
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, audioFile.size);
          const chunk = audioFile.slice(start, end);
          const chunkBase64 = await blobToBase64(chunk, audioFile.type || 'audio/wav');
          
          let retryCount = 0;
          const maxRetries = 3;
          let success = false;

          while (!success && retryCount <= maxRetries) {
            try {
              if (retryCount > 0) {
                 setProgressStatus(`正在处理音频片段 ${i + 1}/${totalChunks}... (重试 ${retryCount}/${maxRetries})`);
              } else {
                 setProgressStatus(`正在预处理并解析音频片段 ${i + 1}/${totalChunks}... (AI 听写中)`);
              }

              const transRes = await sendMessageToGemini({
                message: "请逐字逐句转录这段音频，不要遗漏，不要添加任何解释。直接输出原文。",
                audio: chunkBase64,
                temperature: 0.1,
                systemInstruction: "你是一个专业的速记员。你的任务是精准转录音频内容，不要进行任何总结或分析。"
              });
              
              if (transRes.text) {
                  fullTranscript += transRes.text + "\n";
              }
              success = true;

              // Throttling: Wait 1s between chunks to avoid hitting Rate Limits (RPM)
              if (i < totalChunks - 1) {
                  await delay(1000); 
              }

            } catch (chunkError: any) {
               console.error(`Error transcribing chunk ${i} (Attempt ${retryCount + 1})`, chunkError);
               
               const errorMessage = chunkError?.message || JSON.stringify(chunkError);
               
               // Check for Rate Limit (429) or Quota Exceeded
               if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Resource has been exhausted') || errorMessage.includes('API 调用次数已达上限')) {
                   retryCount++;
                   if (retryCount <= maxRetries) {
                       // Exponential Backoff: 2s, 4s, 8s
                       const waitTime = 2000 * Math.pow(2, retryCount - 1); 
                       console.warn(`Rate limit hit. Waiting ${waitTime}ms before retry...`);
                       await delay(waitTime);
                   } else {
                       console.error(`Max retries reached for chunk ${i}. Skipping.`);
                       fullTranscript += `\n[系统提示：音频片段 ${i+1} 转写失败，已跳过]\n`;
                       break; // Exit retry loop, move to next chunk
                   }
               } else {
                   // Non-retriable error (e.g. 400 Bad Request), skip immediately
                   console.error(`Non-retriable error for chunk ${i}. Skipping.`);
                   fullTranscript += `\n[系统提示：音频片段 ${i+1} 发生错误，已跳过]\n`;
                   break;
               }
            }
          }
        }
        setProgressStatus('音频转写完成，正在进行深度诊断...');
      }

      let response;
      if (fullTranscript) {
         // Analyze Text
         response = await sendMessageToGemini({
            message: ANALYSIS_PROMPT_TEMPLATE(selectedProduct, customDirection, clientGender) + `\n\n=== 录音转录内容 ===\n${fullTranscript}`,
            images: images,
            // No audio passed here
            temperature: 0.1, 
         });
      } else {
        // Fallback for no file object (e.g. legacy or import) or failed transcription
        response = await sendMessageToGemini({
            message: ANALYSIS_PROMPT_TEMPLATE(selectedProduct, customDirection, clientGender),
            images: images,
            audio: audio || undefined,
            temperature: 0.1, 
        });
      }
      
      setReport(response.text || '分析失败，请重试');
    } catch (error) {
      setReport('系统繁忙，无法完成分析，请检查文件大小或稍后重试。');
    } finally {
      setIsAnalyzing(false);
      setProgressStatus('');
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
          className="w-full py-3 bg-navy-900 text-white rounded-xl font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99] flex items-center justify-center gap-2"
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
                 <Wand2 className="text-navy-600" size={20}/> 智能诊断报告
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
                <Sparkles className="text-navy-600"/> 深度交互与复盘
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
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:border-gold-400 hover:text-navy-900 text-slate-600 rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
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
                   className="px-3 py-1.5 bg-navy-800 text-white rounded-lg text-xs font-bold shadow-md hover:bg-navy-900 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1"
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
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === MessageRole.USER ? 'bg-navy-800' : 'bg-white border border-slate-200'}`}>
                               {msg.role === MessageRole.USER ? <User size={16} className="text-white"/> : <Bot size={16} className="text-navy-800"/>}
                            </div>
                            <div className={`p-4 rounded-2xl text-sm shadow-sm leading-relaxed ${
                               msg.role === MessageRole.USER 
                               ? 'bg-navy-800 text-white rounded-tr-none' 
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
                      className="p-2.5 bg-navy-800 text-white rounded-lg hover:bg-navy-900 disabled:opacity-50 transition-all shadow-sm"
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
};osisProps {
  importedAudio?: { data: string; name: string } | null;
  onClearImport?: () => void;
  globalTones: string[];
  setGlobalTones: (tones: string[]) => void;
}

const CLASS_TYPES = ["正式课 (Regular Class)", "Demo 试讲 (Demo Class)", "等级测试 (Level Test)"];
const CLASS_SIZES = ["1对1 (1-on-1)", "小组课 (Group Class)"];

const DiagnosisMarkdownComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  h1: ({ node, ...props }) => (
    <h1 className="text-3xl font-black text-navy-900 mb-6 border-b-2 border-navy-200 pb-4" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2 className="text-xl font-bold text-navy-800 mt-8 mb-4 flex items-center gap-2" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="text-lg font-bold text-navy-700 mt-6 mb-3 bg-navy-50 px-3 py-2 rounded-lg border-l-4 border-navy-500" {...props} />
  ),
  p: ({ node, ...props }) => (
    <p className="mb-4 text-navy-700 leading-relaxed text-sm" {...props} />
  ),
  ul: ({ node, ...props }) => (
    <ul className="list-disc ml-5 space-y-2 mb-6 text-navy-700 text-sm" {...props} />
  ),
  ol: ({ node, ...props }) => (
    <ol className="list-decimal ml-5 space-y-2 mb-6 text-navy-700 text-sm" {...props} />
  ),
  li: ({ node, ...props }) => (
    <li className="pl-1 text-navy-700" {...props} />
  ),
  strong: ({ node, ...props }) => (
    <span className="font-bold text-navy-900" {...props} />
  ),
  blockquote: ({ node, ...props }) => (
    <div className="my-4 pl-4 border-l-4 border-navy-300 bg-navy-50 py-3 pr-3 rounded-r-lg italic text-navy-600 text-sm">
      {props.children}
    </div>
  ),
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-6 rounded-lg border border-navy-200 shadow-sm bg-white">
      <table className="min-w-full divide-y divide-navy-200" {...props} />
    </div>
  ),
  thead: ({ node, ...props }) => (
    <thead className="bg-navy-800 text-white" {...props} />
  ),
  th: ({ node, ...props }) => (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" {...props} />
  ),
  td: ({ node, ...props }) => (
    <td className="px-4 py-3 text-sm text-navy-700 whitespace-pre-wrap border-t border-navy-100" {...props} />
  ),
};

export const 
import React, { useState, useRef, useEffect } from 'react';
import { ProductType, MessageRole, ChatMessage } from '../types';
import { sendMessageToGemini } from '../services/gemini';
import { supabase } from '../../../services/supabaseClient';
import { useAuth } from '../../../contexts/AuthContext';
import { logUserAction } from '../../../services/storageService';
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
    <div className="border-b-2 border-navy-100 pb-4 mb-6 mt-2">
       <h1 className="text-2xl font-black text-navy-900 flex items-center gap-2" {...props} />
    </div>
  ),
  h2: ({ node, ...props }) => (
    <h2 className="text-xl font-bold text-navy-800 mt-8 mb-4 flex items-center gap-2" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 
      className="text-lg font-bold text-navy-800 mt-6 mb-3 flex items-center gap-2 bg-navy-50 px-3 py-2 rounded-lg border-l-4 border-navy-600" 
      {...props} 
    />
  ),
  blockquote: ({ node, ...props }) => (
    <div className="relative group my-4">
       <div className="diagnosis-blockquote bg-navy-50/50 border-l-4 border-navy-500 rounded-r-lg p-4 shadow-sm">
          <blockquote className="text-navy-800 italic leading-relaxed m-0" {...props} />
       </div>
    </div>
  ),
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-6 rounded-xl border border-navy-200 shadow-sm bg-white">
      <table className="min-w-full divide-y divide-navy-100" {...props} />
    </div>
  ),
  thead: ({ node, ...props }) => (
    <thead className="bg-navy-100 text-navy-700" {...props} />
  ),
  tbody: ({ node, ...props }) => (
    <tbody className="bg-white divide-y divide-navy-50" {...props} />
  ),
  tr: ({ node, ...props }) => (
    <tr className="hover:bg-navy-50 transition-colors" {...props} />
  ),
  th: ({ node, ...props }) => (
    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-navy-600" {...props} />
  ),
  td: ({ node, ...props }) => (
    <td className="px-4 py-3 text-sm text-navy-700 whitespace-pre-wrap" {...props} />
  ),
  ul: ({ node, ...props }) => (
    <ul className="space-y-2 mb-4" {...props} />
  ),
  li: ({ node, ...props }) => (
    <li className="flex items-start gap-2 text-navy-700 leading-relaxed text-sm" {...props}>
       <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gold-500 flex-shrink-0"></span>
       <span>{props.children}</span>
    </li>
  ),
  p: ({ node, ...props }) => (
    <p className="mb-3 leading-relaxed text-navy-700 text-sm" {...props} />
  ),
  strong: ({ node, ...props }) => (
    <span className="font-bold text-navy-800" {...props} />
  ),
  hr: ({ node, ...props }) => (
    <hr className="my-8 border-navy-100" {...props} />
  )
};

// 🎨 2. Deep Dive Interaction Markdown Styles (Rich, distinct blocks)
const DeepDiveMarkdownComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  h1: ({node, ...props}) => <h3 className="text-lg font-bold text-navy-800 mt-4 mb-2 border-b border-navy-100 pb-2" {...props}/>,
  h2: ({node, ...props}) => <h3 className="text-base font-bold text-navy-700 mt-3 mb-2" {...props}/>,
  h3: ({node, ...props}) => <h3 className="text-sm font-bold text-navy-700 mt-3 mb-1 uppercase tracking-wider" {...props}/>,
  
  // Strong emphasis - Color block effect for key terms
  strong: ({node, ...props}) => <span className="font-bold text-navy-700 bg-navy-50 px-1 rounded mx-0.5 border border-navy-100/50" {...props}/>,
  
  // Paragraphs
  p: ({node, ...props}) => <p className="mb-3 leading-relaxed text-navy-700 last:mb-0 text-sm" {...props}/>,
  
  // Lists
  ul: ({node, ...props}) => <ul className="space-y-2 mb-3 ml-1 list-none" {...props}/>,
  li: ({node, ...props}) => (
    <li className="flex items-start gap-2 text-sm text-navy-700" {...props}>
      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gold-400 flex-shrink-0"></span>
      <span>{props.children}</span>
    </li>
  ),

  // Blockquotes - Used for Scripts or Important Insights (Color Block)
  blockquote: ({node, ...props}) => (
    <div className="my-3 border-l-4 border-navy-500 bg-navy-50/60 p-3 rounded-r-lg shadow-sm">
      <blockquote className="text-navy-800 text-sm italic m-0" {...props} />
    </div>
  ),

  // Tables - distinct styling for "Microscope Analysis"
  table: ({node, ...props}) => (
    <div className="overflow-x-auto my-3 rounded-lg border border-navy-200 shadow-sm bg-white">
      <table className="min-w-full divide-y divide-navy-100" {...props} />
    </div>
  ),
  thead: ({node, ...props}) => <thead className="bg-navy-50" {...props}/>,
  th: ({node, ...props}) => <th className="px-3 py-2 text-left text-xs font-bold text-navy-500 uppercase tracking-wider" {...props}/>,
  tbody: ({node, ...props}) => <tbody className="bg-white divide-y divide-navy-50" {...props}/>,
  tr: ({node, ...props}) => <tr className="hover:bg-navy-50/30 transition-colors" {...props}/>,
  td: ({node, ...props}) => <td className="px-3 py-2 text-sm text-navy-600 whitespace-pre-wrap align-top" {...props}/>,
  
  // Horizontal Rule
  hr: ({node, ...props}) => <hr className="my-4 border-navy-100" {...props}/>,
  
  // Code (sometimes used for emphasis)
  code: ({node, ...props}) => <code className="bg-navy-100 text-navy-600 px-1.5 py-0.5 rounded text-xs font-mono" {...props}/>
};

export const CaseDiagnosis: React.FC<CaseDiagnosisProps> = ({ importedAudio, onClearImport }) => {
  const { user } = useAuth();
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
      setAudioFile(file);
      setAudioName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAudio(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const blobToBase64 = (blob: Blob, mimeType?: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // 如果提供了mimeType，确保使用正确的MIME类型
        if (mimeType && result.startsWith('data:application/octet-stream')) {
          // 替换错误的MIME类型
          const base64Data = result.split(',')[1];
          resolve(`data:${mimeType};base64,${base64Data}`);
        } else {
          resolve(result);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleAnalysis = async () => {
    if ((images.length === 0 && !audio) || isAnalyzing) return;
    
    setIsAnalyzing(true);
    setReport(null);
    setFollowUpMessages([]); // Clear previous chat
    setProgressStatus('正在初始化分析...');

    try {
      let fullTranscript = "";
      
      // Killer Solution: Chunking -> Transcription -> Analysis
      if (audioFile) {
        // 1. Upload original file to Supabase Storage (Background Operation)
        const uploadOriginalFile = async () => {
            try {
                const userId = user?.id || 'anonymous';
                const timestamp = Date.now();
                // Sanitize filename
                const sanitizedFileName = audioFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                const filePath = `${userId}/audio/${timestamp}-${sanitizedFileName}`;
                
                // Upload to Storage
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('user-files')
                    .upload(filePath, audioFile, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) {
                    console.error("Upload to Supabase Storage failed:", uploadError);
                    return;
                }

                // Get Public URL
                const { data: urlData } = supabase.storage
                    .from('user-files')
                    .getPublicUrl(filePath);

                // Insert into DB
                const { error: dbError } = await supabase
                    .from('user_files')
                    .insert({
                        user_id: userId,
                        file_name: sanitizedFileName,
                        file_type: 'audio',
                        file_path: filePath,
                        file_url: urlData.publicUrl,
                        file_size: audioFile.size,
                        mime_type: audioFile.type || 'audio/mpeg',
                        created_at: new Date().toISOString()
                    });
                
                if (dbError) {
                    console.error("Failed to save file metadata:", dbError);
                } else {
                    console.log("File saved successfully:", filePath);
                }
            } catch (err) {
                console.error("File save process error:", err);
            }
        };
        // Fire and forget upload to avoid blocking analysis, or await if critical.
        // User requested "save to database... failed", implying importance. 
        // We let it run but don't block the UI progress for analysis unless it fails? 
        // Let's run it.
        uploadOriginalFile();

        // Updated Strategy: Use smaller chunks (1MB) to avoid Vercel 4.5MB Payload Limit
        // 1MB * 1.33 (Base64 overhead) = ~1.33MB << 4.5MB Safe
        const CHUNK_SIZE = 1 * 1024 * 1024; 
        const totalChunks = Math.ceil(audioFile.size / CHUNK_SIZE);
        
        // Helper for delay
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, audioFile.size);
          const chunk = audioFile.slice(start, end);
          const chunkBase64 = await blobToBase64(chunk, audioFile.type || 'audio/wav');
          
          let retryCount = 0;
          const maxRetries = 3;
          let success = false;

          while (!success && retryCount <= maxRetries) {
            try {
              if (retryCount > 0) {
                 setProgressStatus(`正在处理音频片段 ${i + 1}/${totalChunks}... (重试 ${retryCount}/${maxRetries})`);
              } else {
                 setProgressStatus(`正在预处理并解析音频片段 ${i + 1}/${totalChunks}... (AI 听写中)`);
              }

              const transRes = await sendMessageToGemini({
                message: "请逐字逐句转录这段音频，不要遗漏，不要添加任何解释。直接输出原文。",
                audio: chunkBase64,
                temperature: 0.1,
                systemInstruction: "你是一个专业的速记员。你的任务是精准转录音频内容，不要进行任何总结或分析。"
              });
              
              if (transRes.text) {
                  fullTranscript += transRes.text + "\n";
              }
              success = true;

              // Throttling: Wait 1s between chunks to avoid hitting Rate Limits (RPM)
              if (i < totalChunks - 1) {
                  await delay(1000); 
              }

            } catch (chunkError: any) {
               console.error(`Error transcribing chunk ${i} (Attempt ${retryCount + 1})`, chunkError);
               
               const errorMessage = chunkError?.message || JSON.stringify(chunkError);
               
               // Check for Rate Limit (429) or Quota Exceeded
               if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Resource has been exhausted') || errorMessage.includes('API 调用次数已达上限')) {
                   retryCount++;
                   if (retryCount <= maxRetries) {
                       // Exponential Backoff: 2s, 4s, 8s
                       const waitTime = 2000 * Math.pow(2, retryCount - 1); 
                       console.warn(`Rate limit hit. Waiting ${waitTime}ms before retry...`);
                       await delay(waitTime);
                   } else {
                       console.error(`Max retries reached for chunk ${i}. Skipping.`);
                       fullTranscript += `\n[系统提示：音频片段 ${i+1} 转写失败，已跳过]\n`;
                       break; // Exit retry loop, move to next chunk
                   }
               } else {
                   // Non-retriable error (e.g. 400 Bad Request), skip immediately
                   console.error(`Non-retriable error for chunk ${i}. Skipping.`);
                   fullTranscript += `\n[系统提示：音频片段 ${i+1} 发生错误，已跳过]\n`;
                   break;
               }
            }
          }
        }
        setProgressStatus('音频转写完成，正在进行深度诊断...');
      }

      let response;
      if (fullTranscript) {
         // Analyze Text
         response = await sendMessageToGemini({
            message: ANALYSIS_PROMPT_TEMPLATE(selectedProduct, customDirection, clientGender) + `\n\n=== 录音转录内容 ===\n${fullTranscript}`,
            images: images,
            // No audio passed here
            temperature: 0.1, 
         });
      } else {
        // Fallback for no file object (e.g. legacy or import) or failed transcription
        response = await sendMessageToGemini({
            message: ANALYSIS_PROMPT_TEMPLATE(selectedProduct, customDirection, clientGender),
            images: images,
            audio: audio || undefined,
            temperature: 0.1, 
        });
      }
      
      setReport(response.text || '分析失败，请重试');
    } catch (error) {
      setReport('系统繁忙，无法完成分析，请检查文件大小或稍后重试。');
    } finally {
      setIsAnalyzing(false);
      setProgressStatus('');
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
          className="w-full py-3 bg-navy-900 text-white rounded-xl font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99] flex items-center justify-center gap-2"
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
                 <Wand2 className="text-navy-600" size={20}/> 智能诊断报告
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
                <Sparkles className="text-navy-600"/> 深度交互与复盘
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
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:border-gold-400 hover:text-navy-900 text-slate-600 rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
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
                   className="px-3 py-1.5 bg-navy-800 text-white rounded-lg text-xs font-bold shadow-md hover:bg-navy-900 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1"
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
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === MessageRole.USER ? 'bg-navy-800' : 'bg-white border border-slate-200'}`}>
                               {msg.role === MessageRole.USER ? <User size={16} className="text-white"/> : <Bot size={16} className="text-navy-800"/>}
                            </div>
                            <div className={`p-4 rounded-2xl text-sm shadow-sm leading-relaxed ${
                               msg.role === MessageRole.USER 
                               ? 'bg-navy-800 text-white rounded-tr-none' 
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
                      className="p-2.5 bg-navy-800 text-white rounded-lg hover:bg-navy-900 disabled:opacity-50 transition-all shadow-sm"
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
};osis: React.FC<
import React, { useState, useRef, useEffect } from 'react';
import { ProductType, MessageRole, ChatMessage } from '../types';
import { sendMessageToGemini } from '../services/gemini';
import { supabase } from '../../../services/supabaseClient';
import { useAuth } from '../../../contexts/AuthContext';
import { logUserAction } from '../../../services/storageService';
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
    <div className="border-b-2 border-navy-100 pb-4 mb-6 mt-2">
       <h1 className="text-2xl font-black text-navy-900 flex items-center gap-2" {...props} />
    </div>
  ),
  h2: ({ node, ...props }) => (
    <h2 className="text-xl font-bold text-navy-800 mt-8 mb-4 flex items-center gap-2" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 
      className="text-lg font-bold text-navy-800 mt-6 mb-3 flex items-center gap-2 bg-navy-50 px-3 py-2 rounded-lg border-l-4 border-navy-600" 
      {...props} 
    />
  ),
  blockquote: ({ node, ...props }) => (
    <div className="relative group my-4">
       <div className="diagnosis-blockquote bg-navy-50/50 border-l-4 border-navy-500 rounded-r-lg p-4 shadow-sm">
          <blockquote className="text-navy-800 italic leading-relaxed m-0" {...props} />
       </div>
    </div>
  ),
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-6 rounded-xl border border-navy-200 shadow-sm bg-white">
      <table className="min-w-full divide-y divide-navy-100" {...props} />
    </div>
  ),
  thead: ({ node, ...props }) => (
    <thead className="bg-navy-100 text-navy-700" {...props} />
  ),
  tbody: ({ node, ...props }) => (
    <tbody className="bg-white divide-y divide-navy-50" {...props} />
  ),
  tr: ({ node, ...props }) => (
    <tr className="hover:bg-navy-50 transition-colors" {...props} />
  ),
  th: ({ node, ...props }) => (
    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-navy-600" {...props} />
  ),
  td: ({ node, ...props }) => (
    <td className="px-4 py-3 text-sm text-navy-700 whitespace-pre-wrap" {...props} />
  ),
  ul: ({ node, ...props }) => (
    <ul className="space-y-2 mb-4" {...props} />
  ),
  li: ({ node, ...props }) => (
    <li className="flex items-start gap-2 text-navy-700 leading-relaxed text-sm" {...props}>
       <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gold-500 flex-shrink-0"></span>
       <span>{props.children}</span>
    </li>
  ),
  p: ({ node, ...props }) => (
    <p className="mb-3 leading-relaxed text-navy-700 text-sm" {...props} />
  ),
  strong: ({ node, ...props }) => (
    <span className="font-bold text-navy-800" {...props} />
  ),
  hr: ({ node, ...props }) => (
    <hr className="my-8 border-navy-100" {...props} />
  )
};

// 🎨 2. Deep Dive Interaction Markdown Styles (Rich, distinct blocks)
const DeepDiveMarkdownComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  h1: ({node, ...props}) => <h3 className="text-lg font-bold text-navy-800 mt-4 mb-2 border-b border-navy-100 pb-2" {...props}/>,
  h2: ({node, ...props}) => <h3 className="text-base font-bold text-navy-700 mt-3 mb-2" {...props}/>,
  h3: ({node, ...props}) => <h3 className="text-sm font-bold text-navy-700 mt-3 mb-1 uppercase tracking-wider" {...props}/>,
  
  // Strong emphasis - Color block effect for key terms
  strong: ({node, ...props}) => <span className="font-bold text-navy-700 bg-navy-50 px-1 rounded mx-0.5 border border-navy-100/50" {...props}/>,
  
  // Paragraphs
  p: ({node, ...props}) => <p className="mb-3 leading-relaxed text-navy-700 last:mb-0 text-sm" {...props}/>,
  
  // Lists
  ul: ({node, ...props}) => <ul className="space-y-2 mb-3 ml-1 list-none" {...props}/>,
  li: ({node, ...props}) => (
    <li className="flex items-start gap-2 text-sm text-navy-700" {...props}>
      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gold-400 flex-shrink-0"></span>
      <span>{props.children}</span>
    </li>
  ),

  // Blockquotes - Used for Scripts or Important Insights (Color Block)
  blockquote: ({node, ...props}) => (
    <div className="my-3 border-l-4 border-navy-500 bg-navy-50/60 p-3 rounded-r-lg shadow-sm">
      <blockquote className="text-navy-800 text-sm italic m-0" {...props} />
    </div>
  ),

  // Tables - distinct styling for "Microscope Analysis"
  table: ({node, ...props}) => (
    <div className="overflow-x-auto my-3 rounded-lg border border-navy-200 shadow-sm bg-white">
      <table className="min-w-full divide-y divide-navy-100" {...props} />
    </div>
  ),
  thead: ({node, ...props}) => <thead className="bg-navy-50" {...props}/>,
  th: ({node, ...props}) => <th className="px-3 py-2 text-left text-xs font-bold text-navy-500 uppercase tracking-wider" {...props}/>,
  tbody: ({node, ...props}) => <tbody className="bg-white divide-y divide-navy-50" {...props}/>,
  tr: ({node, ...props}) => <tr className="hover:bg-navy-50/30 transition-colors" {...props}/>,
  td: ({node, ...props}) => <td className="px-3 py-2 text-sm text-navy-600 whitespace-pre-wrap align-top" {...props}/>,
  
  // Horizontal Rule
  hr: ({node, ...props}) => <hr className="my-4 border-navy-100" {...props}/>,
  
  // Code (sometimes used for emphasis)
  code: ({node, ...props}) => <code className="bg-navy-100 text-navy-600 px-1.5 py-0.5 rounded text-xs font-mono" {...props}/>
};

export const CaseDiagnosis: React.FC<CaseDiagnosisProps> = ({ importedAudio, onClearImport }) => {
  const { user } = useAuth();
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
      setAudioFile(file);
      setAudioName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAudio(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const blobToBase64 = (blob: Blob, mimeType?: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // 如果提供了mimeType，确保使用正确的MIME类型
        if (mimeType && result.startsWith('data:application/octet-stream')) {
          // 替换错误的MIME类型
          const base64Data = result.split(',')[1];
          resolve(`data:${mimeType};base64,${base64Data}`);
        } else {
          resolve(result);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleAnalysis = async () => {
    if ((images.length === 0 && !audio) || isAnalyzing) return;
    
    setIsAnalyzing(true);
    setReport(null);
    setFollowUpMessages([]); // Clear previous chat
    setProgressStatus('正在初始化分析...');

    try {
      let fullTranscript = "";
      
      // Killer Solution: Chunking -> Transcription -> Analysis
      if (audioFile) {
        // 1. Upload original file to Supabase Storage (Background Operation)
        const uploadOriginalFile = async () => {
            try {
                const userId = user?.id || 'anonymous';
                const timestamp = Date.now();
                // Sanitize filename
                const sanitizedFileName = audioFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                const filePath = `${userId}/audio/${timestamp}-${sanitizedFileName}`;
                
                // Upload to Storage
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('user-files')
                    .upload(filePath, audioFile, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) {
                    console.error("Upload to Supabase Storage failed:", uploadError);
                    return;
                }

                // Get Public URL
                const { data: urlData } = supabase.storage
                    .from('user-files')
                    .getPublicUrl(filePath);

                // Insert into DB
                const { error: dbError } = await supabase
                    .from('user_files')
                    .insert({
                        user_id: userId,
                        file_name: sanitizedFileName,
                        file_type: 'audio',
                        file_path: filePath,
                        file_url: urlData.publicUrl,
                        file_size: audioFile.size,
                        mime_type: audioFile.type || 'audio/mpeg',
                        created_at: new Date().toISOString()
                    });
                
                if (dbError) {
                    console.error("Failed to save file metadata:", dbError);
                } else {
                    console.log("File saved successfully:", filePath);
                }
            } catch (err) {
                console.error("File save process error:", err);
            }
        };
        // Fire and forget upload to avoid blocking analysis, or await if critical.
        // User requested "save to database... failed", implying importance. 
        // We let it run but don't block the UI progress for analysis unless it fails? 
        // Let's run it.
        uploadOriginalFile();

        // Updated Strategy: Use smaller chunks (1MB) to avoid Vercel 4.5MB Payload Limit
        // 1MB * 1.33 (Base64 overhead) = ~1.33MB << 4.5MB Safe
        const CHUNK_SIZE = 1 * 1024 * 1024; 
        const totalChunks = Math.ceil(audioFile.size / CHUNK_SIZE);
        
        // Helper for delay
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, audioFile.size);
          const chunk = audioFile.slice(start, end);
          const chunkBase64 = await blobToBase64(chunk, audioFile.type || 'audio/wav');
          
          let retryCount = 0;
          const maxRetries = 3;
          let success = false;

          while (!success && retryCount <= maxRetries) {
            try {
              if (retryCount > 0) {
                 setProgressStatus(`正在处理音频片段 ${i + 1}/${totalChunks}... (重试 ${retryCount}/${maxRetries})`);
              } else {
                 setProgressStatus(`正在预处理并解析音频片段 ${i + 1}/${totalChunks}... (AI 听写中)`);
              }

              const transRes = await sendMessageToGemini({
                message: "请逐字逐句转录这段音频，不要遗漏，不要添加任何解释。直接输出原文。",
                audio: chunkBase64,
                temperature: 0.1,
                systemInstruction: "你是一个专业的速记员。你的任务是精准转录音频内容，不要进行任何总结或分析。"
              });
              
              if (transRes.text) {
                  fullTranscript += transRes.text + "\n";
              }
              success = true;

              // Throttling: Wait 1s between chunks to avoid hitting Rate Limits (RPM)
              if (i < totalChunks - 1) {
                  await delay(1000); 
              }

            } catch (chunkError: any) {
               console.error(`Error transcribing chunk ${i} (Attempt ${retryCount + 1})`, chunkError);
               
               const errorMessage = chunkError?.message || JSON.stringify(chunkError);
               
               // Check for Rate Limit (429) or Quota Exceeded
               if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Resource has been exhausted') || errorMessage.includes('API 调用次数已达上限')) {
                   retryCount++;
                   if (retryCount <= maxRetries) {
                       // Exponential Backoff: 2s, 4s, 8s
                       const waitTime = 2000 * Math.pow(2, retryCount - 1); 
                       console.warn(`Rate limit hit. Waiting ${waitTime}ms before retry...`);
                       await delay(waitTime);
                   } else {
                       console.error(`Max retries reached for chunk ${i}. Skipping.`);
                       fullTranscript += `\n[系统提示：音频片段 ${i+1} 转写失败，已跳过]\n`;
                       break; // Exit retry loop, move to next chunk
                   }
               } else {
                   // Non-retriable error (e.g. 400 Bad Request), skip immediately
                   console.error(`Non-retriable error for chunk ${i}. Skipping.`);
                   fullTranscript += `\n[系统提示：音频片段 ${i+1} 发生错误，已跳过]\n`;
                   break;
               }
            }
          }
        }
        setProgressStatus('音频转写完成，正在进行深度诊断...');
      }

      let response;
      if (fullTranscript) {
         // Analyze Text
         response = await sendMessageToGemini({
            message: ANALYSIS_PROMPT_TEMPLATE(selectedProduct, customDirection, clientGender) + `\n\n=== 录音转录内容 ===\n${fullTranscript}`,
            images: images,
            // No audio passed here
            temperature: 0.1, 
         });
      } else {
        // Fallback for no file object (e.g. legacy or import) or failed transcription
        response = await sendMessageToGemini({
            message: ANALYSIS_PROMPT_TEMPLATE(selectedProduct, customDirection, clientGender),
            images: images,
            audio: audio || undefined,
            temperature: 0.1, 
        });
      }
      
      setReport(response.text || '分析失败，请重试');
    } catch (error) {
      setReport('系统繁忙，无法完成分析，请检查文件大小或稍后重试。');
    } finally {
      setIsAnalyzing(false);
      setProgressStatus('');
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
          className="w-full py-3 bg-navy-900 text-white rounded-xl font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99] flex items-center justify-center gap-2"
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
                 <Wand2 className="text-navy-600" size={20}/> 智能诊断报告
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
                <Sparkles className="text-navy-600"/> 深度交互与复盘
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
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:border-gold-400 hover:text-navy-900 text-slate-600 rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
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
                   className="px-3 py-1.5 bg-navy-800 text-white rounded-lg text-xs font-bold shadow-md hover:bg-navy-900 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1"
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
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === MessageRole.USER ? 'bg-navy-800' : 'bg-white border border-slate-200'}`}>
                               {msg.role === MessageRole.USER ? <User size={16} className="text-white"/> : <Bot size={16} className="text-navy-800"/>}
                            </div>
                            <div className={`p-4 rounded-2xl text-sm shadow-sm leading-relaxed ${
                               msg.role === MessageRole.USER 
                               ? 'bg-navy-800 text-white rounded-tr-none' 
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
                      className="p-2.5 bg-navy-800 text-white rounded-lg hover:bg-navy-900 disabled:opacity-50 transition-all shadow-sm"
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
};osisProps> = ({ importedAudio, onClearImport }) => {
  const { user } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<ProductType>(ProductType.ADULT);
  const [classType, setClassType] = useState(CLASS_TYPES[0]);
  const [classSize, setClassSize] = useState(CLASS_SIZES[0]);
  const [images, setImages] = useState<string[]>([]);
  const [audio, setAudio] = useState<string | null>(null);
  const [audioName, setAudioName] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null); // Supabase Storage URL
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [customDirection, setCustomDirection] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (importedAudio) {
      setAudio(importedAudio.data);
      setAudioName(importedAudio.name);
    }
  }, [importedAudio]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => setImages(prev => [...prev, reader.result as string]);
        reader.readAsDataURL(file);
      });
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件大小（限制为 100MB，因为使用 Supabase Storage）
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      alert(`文件太大（${(file.size / 1024 / 1024).toFixed(2)}MB）。请使用小于 100MB 的音频文件。`);
      if (audioInputRef.current) audioInputRef.current.value = '';
      return;
    }

    setAudioName(file.name);
    setIsUploading(true);

    try {
      // 如果文件小于 3.4MB（Base64 编码后约 4.5MB），可以直接使用 Base64
      // Vercel Edge Function 限制为 4.5MB，所以原始文件应该小于约 3.4MB
      const smallFileThreshold = 3.4 * 1024 * 1024; // 3.4MB
      
      if (file.size < smallFileThreshold) {
        // 小文件：直接读取为 Base64
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudio(reader.result as string);
          setAudioUrl(null);
          setIsUploading(false);
        };
        reader.onerror = () => {
          alert('文件读取失败，请重试。');
          setAudio(null);
          setAudioName('');
          setIsUploading(false);
        };
        reader.readAsDataURL(file);
      } else {
        // 大文件：先上传到 Supabase Storage
        if (!user) {
          alert('请先登录后再上传文件。');
          setIsUploading(false);
          return;
        }

        const uploadResult = await uploadFile({
          userId: user.id,
          fileType: 'audio',
          fileName: file.name,
          fileData: file,
        });

        if (uploadResult.success && uploadResult.fileUrl) {
          setAudioUrl(uploadResult.fileUrl);
          setAudio(null); // 清空 Base64，使用 URL
          setIsUploading(false);
        } else {
          throw new Error(uploadResult.error || '上传失败');
        }
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      alert(`文件上传失败：${error instanceof Error ? error.message : '未知错误'}\n\n请检查网络连接后重试。`);
      setAudio(null);
      setAudioUrl(null);
      setAudioName('');
      setIsUploading(false);
    } finally {
      if (audioInputRef.current) audioInputRef.current.value = '';
    }
  };

  const handleAnalysis = async () => {
    if ((images.length === 0 && !audio && !audioUrl) || isAnalyzing) return;
    setIsAnalyzing(true);
    setResult(null); // 清除之前的结果
    try {
      const response = await sendMessageToGemini({
        message: ANALYSIS_PROMPT_TEMPLATE(selectedProduct, customDirection, classType, classSize),
        images: images,
        audio: audio || undefined, // Base64 格式（小文件）
        audioUrl: audioUrl || undefined, // Supabase Storage URL（大文件）
        temperature: 0.4, // Increased temperature to 0.4 for richer, less robotic output
      });
      setResult(cleanText(response.text || 'Analysis failed. Please try again.'));
    } catch (error: any) {
      console.error('深度诊断错误:', error);
      // 提供更详细的错误信息
      let errorMessage = '连接 AI 服务失败，请检查网络连接。';
      if (error?.message) {
        if (error.message.includes('413') || error.message.includes('Payload Too Large') || error.message.includes('too large')) {
          errorMessage = '文件太大，无法处理。如果文件超过 100MB，请压缩后重试。';
        } else if (error.message.includes('400') || error.message.includes('Invalid')) {
          errorMessage = '文件格式不支持或数据无效。请检查文件格式是否正确。';
        } else if (error.message.includes('429') || error.message.includes('rate limit')) {
          errorMessage = '请求过于频繁，请稍后再试。';
        } else {
          errorMessage = `错误：${error.message}`;
        }
      }
      setResult(`**错误**\n\n${errorMessage}\n\n请尝试：\n- 检查网络连接\n- 稍后重试`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setImages([]);
    setAudio(null);
    setAudioUrl(null);
    setAudioName('');
    setResult(null);
    if (onClearImport) onClearImport();
  };

  const handleDownload = async (type: 'image' | 'pdf') => {
    if (!resultRef.current) return;
    
    const element = resultRef.current;
    
    try {
        // Temporarily expand element to full height to ensure html2canvas captures everything
        const prevOverflow = element.style.overflow;
        const prevHeight = element.style.height;
        const prevMaxHeight = element.style.maxHeight;
        
        // Force full expansion
        element.style.overflow = 'visible';
        element.style.height = 'auto';
        element.style.maxHeight = 'none';
        
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            windowHeight: element.scrollHeight + 100 // Extra buffer
        });
        
        // Restore styles
        element.style.overflow = prevOverflow;
        element.style.height = prevHeight;
        element.style.maxHeight = prevMaxHeight;

        if (type === 'image') {
            const link = document.createElement('a');
            link.download = `ME_Teaching_Diagnosis_${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } else {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            // Handle multi-page PDF for long reports
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft >= 0) {
              position = heightLeft - imgHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
              heightLeft -= pdfHeight;
            }
            
            pdf.save(`ME_Teaching_Diagnosis_${Date.now()}.pdf`);
        }

    } catch (e) {
        console.error("Export failed", e);
        alert("导出失败，请重试 (Export Failed)");
    }
  };

  const renderFilePreview = (fileData: string, index: number) => {
    // Check if it's an image
    if (fileData.startsWith('data:image')) {
      return (
        <img src={fileData} alt={`upload-${index}`} className="w-12 h-12 object-cover rounded-lg border border-navy-200" />
      );
    }
    // For docs, pdfs, excel
    return (
      <div className="w-12 h-12 flex items-center justify-center bg-navy-50 rounded-lg border border-navy-200 text-navy-500">
        <FileText size={20} />
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col gap-6 w-full max-w-[95%] mx-auto p-4 md:p-0 overflow-y-auto pb-20">
      
      {/* Configuration & Upload Area */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-navy-200">
        <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-bold text-navy-800 flex items-center gap-2">
            <FileText className="text-navy-600" /> 教学质量 AI 深度诊断
            </h2>
            {result && (
                <button onClick={reset} className="text-xs text-navy-500 hover:text-gold-600 flex items-center gap-1 transition-colors">
                    <RefreshCw size={12}/> 重置
                </button>
            )}
        </div>
        
        {/* Row 1: Product & Focus */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-xs font-bold text-navy-500 mb-2 uppercase">1. 课程类型 (Product Line)</label>
                <div className="flex flex-wrap gap-2">
                    {Object.values(ProductType).map((type) => (
                    <button key={type} onClick={() => setSelectedProduct(type)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all duration-300 ${
                        selectedProduct === type ? 'bg-navy-600 text-white shadow-md' : 'bg-white text-navy-600 border-navy-200 hover:bg-navy-50'}`}>
                        {type}
                    </button>
                    ))}
                </div>
            </div>
            <div>
                 <label className="block text-xs font-bold text-navy-500 mb-2 uppercase flex items-center gap-1">
                    <Compass size={14}/> 重点关注 (Custom Focus)</label>
                 <input type="text" value={customDirection} onChange={(e) => setCustomDirection(e.target.value)}
                    placeholder="例如: 重点分析中文比例, 或 TTT 时间..."
                    className="w-full px-4 py-2 bg-navy-50 border border-navy-200 rounded-lg text-sm text-navy-800 outline-none focus:border-navy-500 focus:ring-1 focus:ring-navy-200 transition-all duration-300"
                 />
            </div>
        </div>

        {/* Row 2: Class Type & Size */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
               <label className="block text-xs font-bold text-navy-500 mb-2 uppercase flex items-center gap-1"><Presentation size={14}/> 授课性质 (Class Type)</label>
               <div className="flex gap-2">
                  {CLASS_TYPES.map(t => (
                     <button key={t} onClick={() => setClassType(t)} className={`flex-1 px-2 py-2 rounded-lg text-xs font-bold border transition-all duration-300 ${classType === t ? 'bg-navy-100 text-navy-700 border-navy-300' : 'bg-white text-navy-600 border-navy-200'}`}>
                       {t}
                     </button>
                  ))}
               </div>
            </div>
            <div>
               <label className="block text-xs font-bold text-navy-500 mb-2 uppercase flex items-center gap-1"><Users size={14}/> 班级人数 (Class Size)</label>
               <div className="flex gap-2">
                  {CLASS_SIZES.map(s => (
                     <button key={s} onClick={() => setClassSize(s)} className={`flex-1 px-2 py-2 rounded-lg text-xs font-bold border transition-all duration-300 ${classSize === s ? 'bg-gold-100 text-gold-700 border-gold-300' : 'bg-white text-navy-600 border-navy-200'}`}>
                       {s}
                     </button>
                  ))}
               </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div onClick={() => fileInputRef.current?.click()} className="group border-2 border-dashed border-navy-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-navy-50 hover:border-navy-300 transition-all duration-300 h-32 relative overflow-hidden">
            <div className="absolute inset-0 bg-navy-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 flex flex-col items-center">
                <div className="flex gap-2 mb-2 text-navy-400 group-hover:text-navy-500 transition-colors">
                   <ImageIcon /> <FileText />
                </div>
                <span className="text-sm font-bold text-navy-600 group-hover:text-navy-600">上传课件/板书</span>
                <span className="text-xs text-navy-400 mt-1">支持 Images, PDF, Doc, Excel</span>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx" multiple className="hidden" onChange={handleImageUpload} />
          </div>
          
          <div onClick={() => audioInputRef.current?.click()} className="group border-2 border-dashed border-navy-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gold-50 hover:border-gold-300 transition-all duration-300 h-32 relative overflow-hidden">
            <div className="absolute inset-0 bg-gold-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 flex flex-col items-center">
                <FileAudio className="text-navy-400 group-hover:text-gold-500 mb-2 transition-colors" />
                <span className="text-sm font-bold text-navy-600 group-hover:text-gold-600">上传课程录音</span>
                <span className="text-xs text-navy-400 mt-1">{audioName ? audioName : "支持 mp3, wav, m4a"}</span>
            </div>
            <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} />
          </div>
        </div>

        {(images.length > 0 || audio) && (
          <div className="bg-navy-50 p-3 rounded-lg mb-4 flex justify-between items-center border border-navy-100">
             <div className="flex gap-3 overflow-x-auto">
                {images.length > 0 && (
                  <div className="flex gap-1 items-center">
                    {images.map((img, idx) => (
                      <div key={idx}>{renderFilePreview(img, idx)}</div>
                    ))}
                  </div>
                )}
                {(audio || audioUrl) && (
                  <div className="flex items-center gap-2 bg-gold-100 px-3 py-1 rounded-lg border border-gold-200">
                    <FileAudio size={16} className="text-gold-600"/>
                    <span className="text-xs font-bold text-gold-700">
                      {audioUrl ? 'Audio Ready (Large File)' : 'Audio Ready'}
                    </span>
                  </div>
                )}
             </div>
             <button onClick={reset} className="text-xs text-navy-400 hover:text-gold-600 font-bold px-2 whitespace-nowrap">Clear All</button>
          </div>
        )}

        <button onClick={handleAnalysis} disabled={isAnalyzing || isUploading || (images.length === 0 && !audio && !audioUrl)}
          className="w-full py-4 bg-navy-600 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-navy-200 hover:shadow-navy-300 transform active:scale-[0.99] hover:bg-navy-700 transition-all duration-300">
          {isAnalyzing ? (
              <>
                <Loader2 className="animate-spin" /> 教学总监正在听课中...
              </>
          ) : (
              <>
                <Wand2 className="fill-current" /> 开始深度诊断
              </>
          )}
        </button>
      </div>

      {/* Report Result Area */}
      {result && (
        <div className="relative animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button onClick={() => handleDownload('image')} className="bg-white/90 hover:bg-white backdrop-blur border border-navy-200 text-navy-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm flex items-center gap-2 transition-all">
                    <FileImage size={14}/> 导出长图
                </button>
                <button onClick={() => handleDownload('pdf')} className="bg-white/90 hover:bg-white backdrop-blur border border-navy-200 text-navy-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm flex items-center gap-2 transition-all">
                    <Download size={14}/> 导出 PDF
                </button>
            </div>
            <div ref={resultRef} className="bg-white rounded-2xl shadow-xl border border-navy-200 p-8 min-h-[500px] text-navy-800">
                {/* Watermark */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.02] select-none overflow-hidden">
                    <div className="transform -rotate-12 text-6xl font-black text-navy-900 whitespace-nowrap">
                        ME Quality Control
                    </div>
                </div>
                
                <ReactMarkdown 
                    remarkPlugins={[remarkGfm]} 
                    components={DiagnosisMarkdownComponents}
                >
                    {result}
                </ReactMarkdown>
            </div>
        </div>
      )}
    </div>
  );
};
