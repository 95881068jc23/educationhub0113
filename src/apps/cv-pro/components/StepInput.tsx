import React, { useState, useRef } from 'react';
import { FileText, Clipboard, Upload, FileType, Image as ImageIcon, X } from 'lucide-react';
import mammoth from 'mammoth';
import { FileInput } from '../types';

interface Props {
  value: string;
  fileInput?: FileInput;
  onChange: (text: string, file?: FileInput) => void;
  onNext: () => void;
}

export const StepInput: React.FC<Props> = ({ value, fileInput, onChange, onNext }) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'upload'>('paste');
  const [fileName, setFileName] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const processFile = async (file: File) => {
    setIsLoading(true);
    setFileName(file.name);

    try {
      // 1. Images & PDF: Convert to Base64 for Gemini
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64String = (e.target?.result as string).split(',')[1];
          onChange("", {
            mimeType: file.type,
            data: base64String
          });
          setIsLoading(false);
        };
        reader.readAsDataURL(file);
      } 
      // 2. Word (.docx): Extract text using Mammoth
      else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const result = await mammoth.extractRawText({ arrayBuffer });
            onChange(result.value, undefined); // Store as text
          } catch (err) {
            console.error(err);
            alert("Failed to parse Word document. Please try copying the text.");
          } finally {
            setIsLoading(false);
          }
        };
        reader.readAsArrayBuffer(file);
      }
      // 3. Text/Markdown
      else if (file.type === 'text/plain' || file.name.endsWith('.md')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          onChange(e.target?.result as string, undefined);
          setIsLoading(false);
        };
        reader.readAsText(file);
      }
      // 4. Unsupported (e.g. PPT, old Word)
      else {
        alert("目前暂不支持直接解析该格式 (PPT/PPTX/DOC)。建议您将其另存为 PDF 或 图片格式上传，以获得最佳分析效果。");
        setFileName("");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("File upload error:", error);
      alert("上传出错，请重试。");
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">上传您的履历</h2>
        <p className="text-gray-500">支持 PDF, Word (.docx), 图片 (JPG/PNG) 及文本格式</p>
      </div>

      <div className="flex justify-center mb-6">
        <div className="bg-gray-100 p-1 rounded-lg inline-flex">
          <button
            onClick={() => setActiveTab('paste')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'paste' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-2"><Clipboard size={16} /> 粘贴文本</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'upload' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-2"><Upload size={16} /> 文件上传</span>
          </button>
        </div>
      </div>

      <div className="mb-6">
        {activeTab === 'paste' ? (
          <textarea
            className="w-full h-96 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 leading-relaxed bg-white shadow-inner"
            placeholder="请在此粘贴您的履历内容 (Ctrl+V)..."
            value={value}
            onChange={(e) => onChange(e.target.value, undefined)}
            style={{ color: '#111827' }} // Enforce high contrast
          />
        ) : (
          <div 
            className={`h-96 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors relative
              ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}
            `}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
          >
             {!fileName ? (
               <>
                 <input 
                    type="file" 
                    accept=".pdf,.docx,.doc,.txt,.md,.jpg,.jpeg,.png,.webp"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                 />
                 <div className="flex gap-4 mb-4 text-gray-400">
                    <FileText size={32} />
                    <ImageIcon size={32} />
                    <FileType size={32} />
                 </div>
                 <p className="text-gray-600 font-medium text-lg">点击或拖拽上传文件</p>
                 <p className="text-gray-400 text-sm mt-2">支持 PDF, Word(.docx), 图片 (JPG/PNG), 文本</p>
               </>
             ) : (
               <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  ) : (
                    <div className="bg-blue-100 p-4 rounded-full mb-4">
                      <FileText size={40} className="text-blue-600" />
                    </div>
                  )}
                  <p className="text-lg font-medium text-gray-800">{fileName}</p>
                  <p className="text-sm text-green-600 mt-1 font-medium">
                    {isLoading ? '正在解析...' : '上传成功'}
                  </p>
                  
                  {!isLoading && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setFileName(""); onChange("", undefined); }}
                      className="mt-4 text-sm text-red-500 hover:text-red-700 flex items-center gap-1 px-3 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      <X size={14} /> 移除文件
                    </button>
                  )}
               </div>
             )}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={(!value.trim() && !fileInput) || isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center gap-2"
        >
          下一步: 选择优化目标
        </button>
      </div>
    </div>
  );
};