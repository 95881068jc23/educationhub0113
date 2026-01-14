import React, { useState } from 'react';
import { Language, ResumeStyle, OptimizationConfig, InterviewMode, InterviewDifficulty } from '../types';
import { Target, Globe2, Briefcase, Building2, Upload, FileText, X, Users, Gauge } from 'lucide-react';
import mammoth from 'mammoth';

interface Props {
  config: OptimizationConfig;
  onChange: (cfg: Partial<OptimizationConfig>) => void;
  onGenerate: () => void;
  isProcessing: boolean;
}

// Bilingual Labels Helper
const getLanguageLabel = (lang: string) => {
  const map: Record<string, string> = {
    [Language.ENGLISH]: 'English (英语)',
    [Language.CHINESE]: 'Chinese (简体中文)',
    [Language.JAPANESE]: 'Japanese (日语)',
    [Language.KOREAN]: 'Korean (韩语)',
    [Language.GERMAN]: 'German (德语)',
    [Language.FRENCH]: 'French (法语)',
    [Language.SPANISH]: 'Spanish (西班牙语)',
    [Language.ITALIAN]: 'Italian (意大利语)',
  };
  return map[lang] || lang;
};

const getStyleLabel = (style: string) => {
  const map: Record<string, string> = {
    [ResumeStyle.PROFESSIONAL]: 'Professional (专业/商务)',
    [ResumeStyle.CREATIVE]: 'Creative (创意/设计)',
    [ResumeStyle.ACADEMIC]: 'Academic (学术/科研)',
    [ResumeStyle.STARTUP]: 'Modern/Startup (现代/初创)',
    [ResumeStyle.EXECUTIVE]: 'Executive (高管/资深)',
  };
  return map[style] || style;
};

const getInterviewModeLabel = (mode: string) => {
  const map: Record<string, string> = {
    [InterviewMode.NEW_JOB]: 'New Job (新工作面试)',
    [InterviewMode.PROMOTION]: 'Promotion (内部晋升)',
  };
  return map[mode] || mode;
};

const getDifficultyLabel = (diff: string) => {
  const map: Record<string, string> = {
    [InterviewDifficulty.BASIC]: 'A2-B1 (初中级 - 基础问答)',
    [InterviewDifficulty.ADVANCED]: 'B2-C1 (中高级 - 深度探讨)',
  };
  return map[diff] || diff;
};

export const StepConfig: React.FC<Props> = ({ config, onChange, onGenerate, isProcessing }) => {
  const [customLang, setCustomLang] = useState("");
  const [customStyle, setCustomStyle] = useState("");
  
  // JD File Upload State
  const [jdTab, setJdTab] = useState<'text' | 'file'>('text');
  const [jdFileName, setJdFileName] = useState("");
  const [isJdLoading, setIsJdLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const processJdFile = async (file: File) => {
    setIsJdLoading(true);
    setJdFileName(file.name);

    try {
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64String = (e.target?.result as string).split(',')[1];
          onChange({
             jdFile: { mimeType: file.type, data: base64String },
             jobDescription: "" 
          });
          setIsJdLoading(false);
        };
        reader.readAsDataURL(file);
      } 
      else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const result = await mammoth.extractRawText({ arrayBuffer });
            onChange({ jobDescription: result.value }); 
            setJdFileName(""); 
            setJdTab('text');
            alert("JD 文档已解析为文本");
          } catch (err) {
            console.error(err);
            alert("文档解析失败");
          } finally {
            setIsJdLoading(false);
          }
        };
        reader.readAsArrayBuffer(file);
      }
      else if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => {
            onChange({ jobDescription: e.target?.result as string });
            setJdFileName("");
            setJdTab('text');
            setIsJdLoading(false);
        };
        reader.readAsText(file);
      }
      else {
        alert("不支持的文件格式");
        setJdFileName("");
        setIsJdLoading(false);
      }
    } catch (error) {
      console.error(error);
      setIsJdLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">定制您的优化方案</h2>
        <p className="text-gray-500">针对目标企业与职位进行精准打击</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Language Selection */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Globe2 size={18} className="text-blue-600" />
            目标语言 (Target Language)
          </label>
          <select
            value={Object.values(Language).includes(config.targetLanguage as Language) ? config.targetLanguage : 'Custom'}
            onChange={(e) => {
              if (e.target.value === 'Custom') {
                onChange({ targetLanguage: customLang as any });
              } else {
                onChange({ targetLanguage: e.target.value as Language });
              }
            }}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {Object.values(Language).map((lang) => (
              <option key={lang} value={lang}>{getLanguageLabel(lang)}</option>
            ))}
            <option value="Custom">Custom (自定义)...</option>
          </select>
          {(!Object.values(Language).includes(config.targetLanguage as Language) || customLang) && (
             <input 
               type="text"
               placeholder="输入目标语言..."
               value={customLang}
               onChange={(e) => { setCustomLang(e.target.value); onChange({ targetLanguage: e.target.value as any }); }}
               className="w-full p-3 mt-2 border border-gray-200 rounded-lg bg-gray-50 text-sm"
             />
          )}
        </div>

        {/* Style Selection */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Target size={18} className="text-blue-600" />
            履历风格 (Style)
          </label>
          <select
            value={Object.values(ResumeStyle).includes(config.targetStyle as ResumeStyle) ? config.targetStyle : 'Custom'}
            onChange={(e) => {
               if (e.target.value === 'Custom') {
                 onChange({ targetStyle: customStyle as any });
               } else {
                 onChange({ targetStyle: e.target.value as ResumeStyle });
               }
            }}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {Object.values(ResumeStyle).map((style) => (
              <option key={style} value={style}>{getStyleLabel(style)}</option>
            ))}
             <option value="Custom">Custom (自定义)...</option>
          </select>
           {(!Object.values(ResumeStyle).includes(config.targetStyle as ResumeStyle) || customStyle) && (
             <input 
               type="text"
               placeholder="输入自定义风格..."
               value={customStyle}
               onChange={(e) => { setCustomStyle(e.target.value); onChange({ targetStyle: e.target.value as any }); }}
               className="w-full p-3 mt-2 border border-gray-200 rounded-lg bg-gray-50 text-sm"
             />
          )}
        </div>
      </div>

      {/* Advanced Targeting */}
      <div className="space-y-6 mb-8">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Building2 size={18} className="text-blue-600" />
            目标公司 / 官网 (Target Company)
          </label>
          <input
            type="text"
            value={config.targetCompany || ''}
            onChange={(e) => onChange({ targetCompany: e.target.value })}
            placeholder="例如: Google, TikTok, McKinsey..."
            className="w-full p-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-slate-800 text-white placeholder-gray-400"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Interview Mode Selection */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Users size={18} className="text-blue-600" />
              面试场景 (Context)
            </label>
            <select
              value={config.interviewMode || InterviewMode.NEW_JOB}
              onChange={(e) => onChange({ interviewMode: e.target.value as InterviewMode })}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {Object.values(InterviewMode).map((mode) => (
                <option key={mode} value={mode}>{getInterviewModeLabel(mode)}</option>
              ))}
            </select>
          </div>

          {/* Interview Difficulty Selection */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Gauge size={18} className="text-blue-600" />
              面试难度 (Difficulty)
            </label>
            <select
              value={config.interviewDifficulty || InterviewDifficulty.ADVANCED}
              onChange={(e) => onChange({ interviewDifficulty: e.target.value as InterviewDifficulty })}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {Object.values(InterviewDifficulty).map((diff) => (
                <option key={diff} value={diff}>{getDifficultyLabel(diff)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Briefcase size={18} className="text-blue-600" />
              目标职位 JD (Job Description)
            </label>
            <div className="flex bg-gray-100 rounded-lg p-0.5">
               <button 
                 onClick={() => setJdTab('text')}
                 className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${jdTab === 'text' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
               >
                 文本粘贴
               </button>
               <button 
                 onClick={() => setJdTab('file')}
                 className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${jdTab === 'file' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
               >
                 上传文件
               </button>
            </div>
          </div>

          {jdTab === 'text' ? (
            <textarea
              value={config.jobDescription || ''}
              onChange={(e) => onChange({ jobDescription: e.target.value, jdFile: undefined })}
              placeholder="粘贴职位的 Job Description，我们将提取关键词优化您的履历..."
              className="w-full h-32 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none text-sm"
            />
          ) : (
            <div 
              className={`h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors relative
                ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}
              `}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => { 
                e.preventDefault(); 
                setIsDragOver(false); 
                if(e.dataTransfer.files?.[0]) processJdFile(e.dataTransfer.files[0]); 
              }}
            >
              {!jdFileName ? (
                 <>
                   <input 
                      type="file" 
                      accept=".pdf,.docx,.txt,.jpg,.png"
                      onChange={(e) => e.target.files?.[0] && processJdFile(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                   />
                   <div className="flex flex-col items-center text-gray-400">
                      <Upload size={24} className="mb-2" />
                      <p className="text-sm font-medium">点击或拖拽上传 JD 文件</p>
                      <p className="text-xs mt-1">支持 PDF, Word, 图片</p>
                   </div>
                 </>
              ) : (
                 <div className="flex flex-col items-center">
                    {isJdLoading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
                    ) : (
                      <FileText size={24} className="text-blue-600 mb-2" />
                    )}
                    <p className="text-sm font-medium text-gray-800">{jdFileName}</p>
                    {!isJdLoading && (
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setJdFileName(""); 
                          onChange({ jdFile: undefined }); 
                        }}
                        className="mt-2 text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                      >
                        <X size={12} /> 移除
                      </button>
                    )}
                 </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-500 italic">
          * 智能模型将根据以上信息重新构建您的履历
        </p>
        <button
          onClick={onGenerate}
          disabled={isProcessing}
          className={`
            bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 
            text-white px-10 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all
            flex items-center gap-2
            ${isProcessing ? 'opacity-75 cursor-wait' : ''}
          `}
        >
          {isProcessing ? (
            'AI 思考中...' 
          ) : (
            '开始一键优化'
          )}
        </button>
      </div>
    </div>
  );
};