
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

interface CaseDiagnosisProps {
  importedAudio?: { data: string; name: string } | null;
  onClearImport?: () => void;
  globalTones: string[];
  setGlobalTones: (tones: string[]) => void;
}

const CLASS_TYPES = ["正式课 (Regular Class)", "Demo 试讲 (Demo Class)", "等级测试 (Level Test)"];
const CLASS_SIZES = ["1对1 (1-on-1)", "小组课 (Group Class)"];

const DiagnosisMarkdownComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  h1: ({ node, ...props }) => (
    <h1 className="text-3xl font-black text-slate-900 mb-6 border-b-2 border-slate-200 pb-4" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4 flex items-center gap-2" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="text-lg font-bold text-teal-700 mt-6 mb-3 bg-teal-50 px-3 py-2 rounded-lg border-l-4 border-teal-500" {...props} />
  ),
  p: ({ node, ...props }) => (
    <p className="mb-4 text-slate-700 leading-relaxed text-sm" {...props} />
  ),
  ul: ({ node, ...props }) => (
    <ul className="list-disc ml-5 space-y-2 mb-6 text-slate-700 text-sm" {...props} />
  ),
  ol: ({ node, ...props }) => (
    <ol className="list-decimal ml-5 space-y-2 mb-6 text-slate-700 text-sm" {...props} />
  ),
  li: ({ node, ...props }) => (
    <li className="pl-1 text-slate-700" {...props} />
  ),
  strong: ({ node, ...props }) => (
    <span className="font-bold text-slate-900" {...props} />
  ),
  blockquote: ({ node, ...props }) => (
    <div className="my-4 pl-4 border-l-4 border-slate-300 bg-slate-50 py-3 pr-3 rounded-r-lg italic text-slate-600 text-sm">
      {props.children}
    </div>
  ),
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-6 rounded-lg border border-slate-200 shadow-sm bg-white">
      <table className="min-w-full divide-y divide-slate-200" {...props} />
    </div>
  ),
  thead: ({ node, ...props }) => (
    <thead className="bg-slate-800 text-white" {...props} />
  ),
  th: ({ node, ...props }) => (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" {...props} />
  ),
  td: ({ node, ...props }) => (
    <td className="px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap border-t border-slate-100" {...props} />
  ),
};

export const CaseDiagnosis: React.FC<CaseDiagnosisProps> = ({ importedAudio, onClearImport }) => {
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
        <img src={fileData} alt={`upload-${index}`} className="w-12 h-12 object-cover rounded-lg border border-slate-200" />
      );
    }
    // For docs, pdfs, excel
    return (
      <div className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded-lg border border-slate-200 text-slate-500">
        <FileText size={20} />
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col gap-6 w-full max-w-[95%] mx-auto p-4 md:p-0 overflow-y-auto pb-20">
      
      {/* Configuration & Upload Area */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-teal-600" /> 教学质量 AI 深度诊断
            </h2>
            {result && (
                <button onClick={reset} className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1 transition-colors">
                    <RefreshCw size={12}/> 重置
                </button>
            )}
        </div>
        
        {/* Row 1: Product & Focus */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">1. 课程类型 (Product Line)</label>
                <div className="flex flex-wrap gap-2">
                    {Object.values(ProductType).map((type) => (
                    <button key={type} onClick={() => setSelectedProduct(type)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                        selectedProduct === type ? 'bg-teal-600 text-white shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                        {type}
                    </button>
                    ))}
                </div>
            </div>
            <div>
                 <label className="block text-xs font-bold text-slate-500 mb-2 uppercase flex items-center gap-1">
                    <Compass size={14}/> 重点关注 (Custom Focus)</label>
                 <input type="text" value={customDirection} onChange={(e) => setCustomDirection(e.target.value)}
                    placeholder="例如: 重点分析中文比例, 或 TTT 时间..."
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-200"
                 />
            </div>
        </div>

        {/* Row 2: Class Type & Size */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
               <label className="block text-xs font-bold text-slate-500 mb-2 uppercase flex items-center gap-1"><Presentation size={14}/> 授课性质 (Class Type)</label>
               <div className="flex gap-2">
                  {CLASS_TYPES.map(t => (
                     <button key={t} onClick={() => setClassType(t)} className={`flex-1 px-2 py-2 rounded-lg text-xs font-bold border transition-all ${classType === t ? 'bg-teal-100 text-teal-700 border-teal-300' : 'bg-white text-slate-600 border-slate-200'}`}>
                       {t}
                     </button>
                  ))}
               </div>
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-500 mb-2 uppercase flex items-center gap-1"><Users size={14}/> 班级人数 (Class Size)</label>
               <div className="flex gap-2">
                  {CLASS_SIZES.map(s => (
                     <button key={s} onClick={() => setClassSize(s)} className={`flex-1 px-2 py-2 rounded-lg text-xs font-bold border transition-all ${classSize === s ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'bg-white text-slate-600 border-slate-200'}`}>
                       {s}
                     </button>
                  ))}
               </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div onClick={() => fileInputRef.current?.click()} className="group border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-teal-50 hover:border-teal-300 transition-all h-32 relative overflow-hidden">
            <div className="absolute inset-0 bg-teal-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 flex flex-col items-center">
                <div className="flex gap-2 mb-2 text-slate-400 group-hover:text-teal-500 transition-colors">
                   <ImageIcon /> <FileText />
                </div>
                <span className="text-sm font-bold text-slate-600 group-hover:text-teal-600">上传课件/板书</span>
                <span className="text-xs text-slate-400 mt-1">支持 Images, PDF, Doc, Excel</span>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx" multiple className="hidden" onChange={handleImageUpload} />
          </div>
          
          <div onClick={() => audioInputRef.current?.click()} className="group border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition-all h-32 relative overflow-hidden">
            <div className="absolute inset-0 bg-purple-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 flex flex-col items-center">
                <FileAudio className="text-slate-400 group-hover:text-purple-500 mb-2 transition-colors" />
                <span className="text-sm font-bold text-slate-600 group-hover:text-purple-600">上传课程录音</span>
                <span className="text-xs text-slate-400 mt-1">{audioName ? audioName : "支持 mp3, wav, m4a"}</span>
            </div>
            <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} />
          </div>
        </div>

        {(images.length > 0 || audio) && (
          <div className="bg-slate-50 p-3 rounded-lg mb-4 flex justify-between items-center border border-slate-100">
             <div className="flex gap-3 overflow-x-auto">
                {images.length > 0 && (
                  <div className="flex gap-1 items-center">
                    {images.map((img, idx) => (
                      <div key={idx}>{renderFilePreview(img, idx)}</div>
                    ))}
                  </div>
                )}
                {(audio || audioUrl) && (
                  <div className="flex items-center gap-2 bg-purple-100 px-3 py-1 rounded-lg border border-purple-200">
                    <FileAudio size={16} className="text-purple-600"/>
                    <span className="text-xs font-bold text-purple-700">
                      {audioUrl ? 'Audio Ready (Large File)' : 'Audio Ready'}
                    </span>
                  </div>
                )}
             </div>
             <button onClick={reset} className="text-xs text-slate-400 hover:text-red-500 font-bold px-2 whitespace-nowrap">Clear All</button>
          </div>
        )}

        <button onClick={handleAnalysis} disabled={isAnalyzing || isUploading || (images.length === 0 && !audio && !audioUrl)}
          className="w-full py-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-teal-200 hover:shadow-teal-300 transform active:scale-[0.99] transition-all">
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
                <button onClick={() => handleDownload('image')} className="bg-white/90 hover:bg-white backdrop-blur border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm flex items-center gap-2 transition-all">
                    <FileImage size={14}/> 导出长图
                </button>
                <button onClick={() => handleDownload('pdf')} className="bg-white/90 hover:bg-white backdrop-blur border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm flex items-center gap-2 transition-all">
                    <Download size={14}/> 导出 PDF
                </button>
            </div>
            <div ref={resultRef} className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 min-h-[500px] text-slate-800">
                {/* Watermark */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.02] select-none overflow-hidden">
                    <div className="transform -rotate-12 text-6xl font-black text-slate-900 whitespace-nowrap">
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
