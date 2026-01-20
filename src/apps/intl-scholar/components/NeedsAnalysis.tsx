import React, { useState, useRef, useEffect } from 'react';
import { ExamType, Language, StudentProfile } from '../types';
import { generateNeedsAnalysisReport } from '../services/geminiService';
import { TRANSLATIONS, GRADES, getScoreOptions } from '../constants';
import { Loader2, FileText, Download, Image as ImageIcon, Upload, X, ArrowLeft, Edit3, Save, Book, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import html2canvas from 'html2canvas';
import remarkGfm from 'remark-gfm';
// @ts-ignore
import mammoth from 'mammoth';
// @ts-ignore
import * as XLSX from 'xlsx';

interface Props {
  exam: ExamType;
  language: Language;
  onAnalysisComplete: (result: string) => void;
  onBack: () => void;
  initialReport?: string; // Persisted Report State
  importedScore?: string | null; // From Mock Exam
}

// Progress Timer Component
const ProgressTimer = ({ active, estimatedTime = 90 }: { active: boolean, estimatedTime?: number }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!active) {
            setProgress(0);
            return;
        }
        
        const interval = setInterval(() => {
            setProgress(old => {
                if (old >= 95) return 95; // Cap at 95% until complete
                // Increment slower as it gets higher
                const increment = old < 50 ? 2 : old < 80 ? 1 : 0.5;
                return old + increment;
            });
        }, (estimatedTime * 1000) / 100); // Spread duration over 100 ticks

        return () => clearInterval(interval);
    }, [active, estimatedTime]);

    if (!active) return null;

    return (
        <div className="w-full mt-4 animate-fade-in">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Analyzing & Generating...</span>
                <span>{Math.round(progress)}% (Est. {60}-{estimatedTime}s)</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                    className="bg-gold-500 h-2 rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
    );
};

// 1. Standard Input Field (Used for Name, Subjects, etc.)
const InputField = ({ 
  label, 
  value, 
  onChange, 
  placeholder 
}: { 
  label: string, 
  value: string, 
  onChange: (val: string) => void, 
  placeholder?: string 
}) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-slate-600">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full p-3 bg-slate-700 text-white placeholder-slate-400 border border-slate-600 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none transition-all"
    />
  </div>
);

// 2. Black Select Input (Custom Combobox)
// Ensures "Black Background, White Text" visibility at all times
const BlackSelectInput = ({
    label,
    value,
    onChange,
    options,
    placeholder
}: {
    label: string,
    value: string,
    onChange: (val: string) => void,
    options: string[],
    placeholder?: string
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="space-y-1" ref={containerRef}>
            <label className="text-sm font-medium text-slate-600">{label}</label>
            <div className="relative group">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    className="w-full p-3 pr-10 bg-navy-950 text-white placeholder-slate-500 border border-slate-700 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none transition-all font-medium"
                />
                
                {/* Toggle Button */}
                <div 
                    className="absolute right-0 top-0 h-full w-10 flex items-center justify-center cursor-pointer text-slate-400 hover:text-white"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>

                {/* Custom Dropdown Options */}
                {isOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-navy-950 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-fade-in">
                        {options.map((opt) => (
                            <div
                                key={opt}
                                className="px-4 py-3 text-white hover:bg-slate-800 cursor-pointer text-sm border-b border-slate-800 last:border-0 transition-colors"
                                onClick={() => {
                                    onChange(opt);
                                    setIsOpen(false);
                                }}
                            >
                                {opt}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const NeedsAnalysis: React.FC<Props> = ({ exam, language, onAnalysisComplete, onBack, initialReport, importedScore }) => {
  const t = TRANSLATIONS[language];
  const [loading, setLoading] = useState(false);
  // View mode: 'input' or 'result'. If initialReport exists, start in result mode.
  const [view, setView] = useState<'input' | 'result'>(initialReport ? 'result' : 'input');
  const [isEditing, setIsEditing] = useState(false);
  
  const [profile, setProfile] = useState<StudentProfile>({
    name: '',
    grade: '',
    currentScore: '',
    subScores: '',
    targetScore: '',
    targetSubScores: '',
    requirements: '',
    subjects: '',
    examVariant: ''
  });
  
  // Auto-fill imported mock score if available and not yet set
  useEffect(() => {
    if (importedScore && !profile.currentScore) {
        setProfile(prev => ({ ...prev, currentScore: importedScore }));
    }
  }, [importedScore]); // Only run when importedScore changes
  
  // Transcript File state
  const [file, setFile] = useState<{ base64: string, mimeType: string, name: string } | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');

  // Syllabus File state
  const [syllabusFile, setSyllabusFile] = useState<{ base64: string, mimeType: string, name: string } | null>(null);
  const [syllabusText, setSyllabusText] = useState<string>('');

  const [report, setReport] = useState(initialReport || '');
  const reportRef = useRef<HTMLDivElement>(null);

  // Logic to determine which fields to show
  const showSubjects = [ExamType.AP, ExamType.IB, ExamType.ALEVEL].includes(exam);
  const showSubScores = [ExamType.TOEFL, ExamType.IELTS].includes(exam);
  const showDomesticVariant = [ExamType.ZHONGKAO, ExamType.GAOKAO].includes(exam);

  // Get options dynamically based on exam and selected variant
  const scoreOptions = getScoreOptions(exam, profile.examVariant);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'transcript' | 'syllabus') => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Reset previous file state based on type
    if (type === 'transcript') {
        setFile(null);
        setExtractedText('');
    } else {
        setSyllabusFile(null);
        setSyllabusText('');
    }

    const fileType = selectedFile.type;
    const fileName = selectedFile.name;

    // Handle .docx (Word)
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          try {
            const result = await mammoth.extractRawText({ arrayBuffer });
            const text = result.value;
            if (type === 'transcript') {
                setExtractedText(text);
                setFile({ base64: '', mimeType: fileType, name: fileName });
            } else {
                setSyllabusText(text);
                setSyllabusFile({ base64: '', mimeType: fileType, name: fileName });
            }
          } catch (err) {
            console.error("Mammoth error:", err);
            alert("Failed to read Word document.");
          }
        };
        reader.readAsArrayBuffer(selectedFile);
    } 
    // Handle Excel (.xlsx, .xls)
    else if (
        fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        fileName.endsWith('.xlsx') || 
        fileName.endsWith('.xls')
    ) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target?.result;
            try {
                const workbook = XLSX.read(data, { type: 'array' });
                // Read all sheets
                let fullText = "";
                workbook.SheetNames.forEach((sheetName: string) => {
                    const sheet = workbook.Sheets[sheetName];
                    const csv = XLSX.utils.sheet_to_csv(sheet);
                    fullText += `--- Sheet: ${sheetName} ---\n${csv}\n\n`;
                });
                
                if (type === 'transcript') {
                    setExtractedText(fullText);
                    setFile({ base64: '', mimeType: fileType, name: fileName });
                } else {
                    setSyllabusText(fullText);
                    setSyllabusFile({ base64: '', mimeType: fileType, name: fileName });
                }
            } catch (err) {
                 console.error("Excel error:", err);
                 alert("Failed to read Excel document.");
            }
        };
        reader.readAsArrayBuffer(selectedFile);
    }
    // Handle PDF or Image
    else {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        const fileObj = { 
          base64: base64String, 
          mimeType: fileType,
          name: fileName
        };
        if (type === 'transcript') {
            setFile(fileObj);
        } else {
            setSyllabusFile(fileObj);
        }
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const clearFile = (type: 'transcript' | 'syllabus') => {
    if (type === 'transcript') {
        setFile(null);
        setExtractedText('');
    } else {
        setSyllabusFile(null);
        setSyllabusText('');
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const result = await generateNeedsAnalysisReport(
        exam, 
        profile, 
        language, 
        // Transcript: Pass data only if no extracted text (implies PDF/Image), otherwise pass null for data and string for text
        file && !extractedText ? { base64: file.base64, mimeType: file.mimeType } : null,
        extractedText,
        // Syllabus
        syllabusFile && !syllabusText ? { base64: syllabusFile.base64, mimeType: syllabusFile.mimeType } : null,
        syllabusText
      );
      setReport(result);
      onAnalysisComplete(result); 
      setView('result'); // Switch to result view
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    onAnalysisComplete(report); // Update shared state
  };

  const handleExportWord = () => {
    if (!reportRef.current) return;
    const htmlContent = reportRef.current.innerHTML;

    // SVG Watermark for Word Background
    const watermarkSvg = encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="500" height="500">
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="60" fill="rgba(0,0,0,0.1)" text-anchor="middle" dominant-baseline="middle" transform="rotate(-45 250 250)">
          麦迩威教育
        </text>
      </svg>
    `.trim());

    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Needs Analysis</title>
        <style>
          body {
            background-image: url('data:image/svg+xml;utf8,${watermarkSvg}');
            background-repeat: repeat;
          }
        </style>
      </head><body>`;

    const footer = "</body></html>";
    const sourceHTML = header + htmlContent + footer;
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const link = document.createElement("a");
    document.body.appendChild(link);
    link.href = source;
    link.download = `${profile.name}_NeedsAnalysis.doc`;
    link.click();
    document.body.removeChild(link);
  };

  const handleExportImage = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current);
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${profile.name}_NeedsAnalysis.png`;
      link.click();
    } catch (e) {
      console.error('Image export failed', e);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const updateField = (field: keyof StudentProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  // Input View
  if (view === 'input') {
    return (
      <div className="max-w-3xl mx-auto">
        <button 
           onClick={onBack} 
           className="mb-4 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors md:hidden"
        >
           <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
            <FileText className="text-indigo-600" size={28} />
            {t.needsAnalysis}
          </h2>

          {/* Alert if Mock Score detected */}
          {importedScore && !profile.currentScore && (
            <div className="bg-indigo-50 p-4 rounded-lg mb-6 border border-indigo-200 flex items-center gap-3 animate-fade-in">
                <Sparkles className="text-indigo-600" size={24} />
                <div className="text-sm text-indigo-900">
                    <strong>Mock Exam Score Detected:</strong> We found a recent mock exam score of <strong>{importedScore}</strong>. 
                    It has been automatically applied to the current score field.
                </div>
            </div>
          )}
          
          <div className="space-y-6">
            <InputField 
              label={t.studentName} 
              value={profile.name} 
              onChange={(v) => updateField('name', v)} 
            />
            
            {/* Grade Selection - Black Theme with Dropdown */}
            <BlackSelectInput
                label={t.grade}
                value={profile.grade}
                onChange={(v) => updateField('grade', v)}
                options={GRADES}
                placeholder="Select or type grade (e.g. G10)"
            />
            
            {showSubjects && (
               <InputField 
                  label={t.subjects} 
                  value={profile.subjects || ''} 
                  onChange={(v) => updateField('subjects', v)} 
                  placeholder="e.g. Math AA HL, Physics HL, Economics SL..."
               />
            )}

            {/* SPECIAL IELTS SELECTOR */}
            {exam === ExamType.IELTS && (
                <div className="bg-black text-white p-4 rounded-lg shadow-md border border-slate-700">
                    <label className="block text-sm font-bold mb-3 text-indigo-300">Select IELTS Module (雅思类别)</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer bg-slate-800 px-4 py-2 rounded-md hover:bg-slate-700 transition-colors border border-slate-600 has-[:checked]:border-indigo-500 has-[:checked]:bg-slate-700">
                            <input 
                                type="radio" 
                                name="ieltsType" 
                                value="Academic (A类)" 
                                checked={profile.examVariant === "Academic (A类)"}
                                onChange={(e) => updateField('examVariant', e.target.value)}
                                className="accent-indigo-500"
                            />
                            <span className="font-medium">Academic (A类)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer bg-slate-800 px-4 py-2 rounded-md hover:bg-slate-700 transition-colors border border-slate-600 has-[:checked]:border-indigo-500 has-[:checked]:bg-slate-700">
                            <input 
                                type="radio" 
                                name="ieltsType" 
                                value="General Training (G类)" 
                                checked={profile.examVariant === "General Training (G类)"}
                                onChange={(e) => updateField('examVariant', e.target.value)}
                                className="accent-indigo-500"
                            />
                            <span className="font-medium">General Training (G类)</span>
                        </label>
                    </div>
                </div>
            )}

            {/* SPECIAL DOMESTIC EXAM SELECTOR (Shanghai vs National) */}
            {showDomesticVariant && (
                <div className="bg-black text-white p-4 rounded-lg shadow-md border border-slate-700">
                    <label className="block text-sm font-bold mb-3 text-indigo-300">Select Paper Type (试卷类型)</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer bg-slate-800 px-4 py-2 rounded-md hover:bg-slate-700 transition-colors border border-slate-600 has-[:checked]:border-indigo-500 has-[:checked]:bg-slate-700">
                            <input 
                                type="radio" 
                                name="paperType" 
                                value="Shanghai Paper (上海卷)" 
                                checked={profile.examVariant === "Shanghai Paper (上海卷)"}
                                onChange={(e) => {
                                   updateField('examVariant', e.target.value);
                                   updateField('currentScore', ''); // Reset score to force re-selection with new options
                                   updateField('targetScore', '');
                                }}
                                className="accent-indigo-500"
                            />
                            <span className="font-medium">Shanghai Paper (上海卷)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer bg-slate-800 px-4 py-2 rounded-md hover:bg-slate-700 transition-colors border border-slate-600 has-[:checked]:border-indigo-500 has-[:checked]:bg-slate-700">
                            <input 
                                type="radio" 
                                name="paperType" 
                                value="National Paper (全国卷)" 
                                checked={profile.examVariant === "National Paper (全国卷)"}
                                onChange={(e) => {
                                   updateField('examVariant', e.target.value);
                                   updateField('currentScore', '');
                                   updateField('targetScore', '');
                                }}
                                className="accent-indigo-500"
                            />
                            <span className="font-medium">National Paper (全国卷)</span>
                        </label>
                    </div>
                </div>
            )}

            <div className={`grid grid-cols-1 ${showSubScores ? 'md:grid-cols-2' : ''} gap-6`}>
              {/* Current Score - Black Theme with Dropdown */}
              <BlackSelectInput 
                label={t.currentScore} 
                value={profile.currentScore} 
                onChange={(v) => updateField('currentScore', v)} 
                options={scoreOptions}
                placeholder="Select or type current score"
              />

              {showSubScores && (
                <InputField 
                    label={t.subScores} 
                    value={profile.subScores} 
                    onChange={(v) => updateField('subScores', v)} 
                    placeholder="e.g. R:20, L:21..." 
                />
              )}
            </div>

            <div className={`grid grid-cols-1 ${showSubScores ? 'md:grid-cols-2' : ''} gap-6`}>
              {/* Target Score - Black Theme with Dropdown */}
              <BlackSelectInput 
                label={t.targetScore} 
                value={profile.targetScore} 
                onChange={(v) => updateField('targetScore', v)} 
                options={scoreOptions}
                placeholder="Select or type target score"
              />

              {showSubScores && (
                <InputField 
                    label={t.targetSubScores} 
                    value={profile.targetSubScores} 
                    onChange={(v) => updateField('targetSubScores', v)} 
                />
              )}
            </div>

            {/* Transcript Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">
                Upload Transcript / Score Report (上传成绩单/学习报告)
              </label>
              {!file ? (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                        <Upload className="w-8 h-8 text-slate-400 mb-3" />
                        <p className="text-sm text-slate-500 font-medium">Click to upload (点击上传) - PDF, Word, Excel, Image</p>
                        <p className="text-xs text-slate-400 mt-1">Supports intelligent text extraction (支持智能文本提取)</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="application/pdf,image/*,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                      onChange={(e) => handleFileUpload(e, 'transcript')} 
                    />
                </label>
              ) : (
                <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <div className="flex items-center gap-3 text-indigo-700 truncate">
                      <FileText size={20} />
                      <div className="flex flex-col">
                        <span className="font-medium text-sm truncate max-w-[200px]">{file.name}</span>
                        {extractedText && <span className="text-[10px] bg-indigo-200 px-1.5 py-0.5 rounded text-indigo-800 w-fit">Text Extracted</span>}
                      </div>
                    </div>
                    <button onClick={() => clearFile('transcript')} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                      <X size={20} />
                    </button>
                </div>
              )}
            </div>

            {/* Syllabus Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                Upload Course Syllabus / Outline (上传课程大纲/教学进度表)
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">New</span>
              </label>
              {!syllabusFile ? (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                        <Book className="w-8 h-8 text-slate-400 mb-3" />
                        <p className="text-sm text-slate-500 font-medium">Click to upload (点击上传) - PDF, Word, Excel, Image</p>
                        <p className="text-xs text-slate-400 mt-1">AI will analyze needs based on this curriculum (AI将基于大纲进行学情分析)</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="application/pdf,image/*,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                      onChange={(e) => handleFileUpload(e, 'syllabus')} 
                    />
                </label>
              ) : (
                <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-3 text-amber-700 truncate">
                      <Book size={20} />
                      <div className="flex flex-col">
                        <span className="font-medium text-sm truncate max-w-[200px]">{syllabusFile.name}</span>
                        {syllabusText && <span className="text-[10px] bg-amber-200 px-1.5 py-0.5 rounded text-amber-800 w-fit">Text Extracted</span>}
                      </div>
                    </div>
                    <button onClick={() => clearFile('syllabus')} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                      <X size={20} />
                    </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">{t.requirements}</label>
              <textarea
                value={profile.requirements}
                onChange={(e) => updateField('requirements', e.target.value)}
                rows={4}
                className="w-full p-4 bg-slate-700 text-white placeholder-slate-400 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>

            <div className="mt-4">
                <button
                onClick={handleAnalyze}
                disabled={loading || !profile.name}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg transition-transform active:scale-[0.98]"
                >
                    {loading ? <Loader2 className="animate-spin" /> : t.analyze}
                </button>
                {/* Progress Bar */}
                <ProgressTimer active={loading} estimatedTime={90} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Result View
  return (
    <div className="h-full flex flex-col relative">
       <div className="flex justify-between items-center mb-6 no-print">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setView('input')} 
              className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors font-medium"
            >
              <ArrowLeft size={20} /> <span className="hidden md:inline">Back</span>
            </button>

            {isEditing ? (
              <button 
                onClick={handleSaveEdit} 
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-colors font-bold"
              >
                <Save size={18} /> Save Changes
              </button>
            ) : (
              <button 
                onClick={() => setIsEditing(true)} 
                className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors font-medium"
              >
                <Edit3 size={18} /> Edit Report
              </button>
            )}
          </div>
          
          <div className="flex gap-2">
            <button onClick={handleExportWord} disabled={isEditing} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title={t.exportWord}>
               <FileText size={18}/> Word
            </button>
            <button onClick={handleExportPDF} disabled={isEditing} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 border border-red-200 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title={t.exportPDF}>
               <Download size={18}/> PDF
            </button>
            <button onClick={handleExportImage} disabled={isEditing} className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 border border-green-200 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title={t.exportImg}>
               <ImageIcon size={18}/> Image
            </button>
          </div>
       </div>

       <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex-1 relative">
          {isEditing ? (
            <div className="p-0 h-full">
              <textarea 
                value={report}
                onChange={(e) => setReport(e.target.value)}
                className="w-full h-[70vh] p-8 text-slate-800 font-mono text-sm leading-relaxed outline-none resize-none bg-slate-50"
                placeholder="Markdown content..."
              />
            </div>
          ) : (
            <div ref={reportRef} className="prose prose-slate max-w-none p-8 md:p-12 bg-white relative">
              {/* Watermark for Screen/Image */}
              <div className="watermark-overlay">
                  <div className="watermark-text">麦迩威教育</div>
              </div>

              {/* Simple Header for Export */}
              <div className="hidden print:block mb-8 border-b pb-4 relative z-10">
                  <h1 className="text-2xl font-bold">Needs Analysis Report</h1>
                  <p className="text-slate-500">{profile.name} | {exam} {profile.examVariant && `(${profile.examVariant})`} | {profile.grade}</p>
              </div>
              
              <div className="relative z-10">
                <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                    // Style H1 - Main Title
                    h1: ({node, ...props}) => (
                        <h1 className="text-3xl font-extrabold text-indigo-900 border-b-2 border-indigo-200 pb-4 mb-8" {...props} />
                    ),
                    // Style H2 - Color Blocks (Sections)
                    h2: ({node, ...props}) => (
                        <div className="bg-indigo-50 border-l-4 border-indigo-600 p-4 mt-8 mb-6 rounded-r-lg shadow-sm">
                            <h2 className="text-indigo-900 font-bold text-2xl m-0" {...props} />
                        </div>
                    ),
                    // Style H3 - Subsections
                    h3: ({node, ...props}) => (
                        <h3 className="text-slate-800 font-bold mt-6 mb-3 text-xl border-b border-slate-100 pb-1" {...props} />
                    ),
                    // Style Blockquotes - Highlights
                    blockquote: ({node, ...props}) => (
                        <blockquote className="bg-amber-50 border-l-4 border-amber-500 p-4 my-6 text-amber-900 italic rounded-r-lg shadow-sm" {...props} />
                    ),
                    ul: ({node, ...props}) => <ul className="list-disc pl-6 space-y-2 my-4 text-slate-700" {...props} />,
                    li: ({node, ...props}) => <li className="text-slate-700 leading-relaxed" {...props} />,
                    strong: ({node, ...props}) => <strong className="text-indigo-900 font-bold bg-indigo-50 px-1 rounded" {...props} />,
                    // Enhanced Table Styles
                    table: ({node, ...props}) => (
                        <div className="overflow-x-auto my-8 rounded-lg border border-slate-200 shadow-sm">
                            <table className="min-w-full divide-y divide-slate-200" {...props} />
                        </div>
                    ),
                    thead: ({node, ...props}) => <thead className="bg-slate-100" {...props} />,
                    tbody: ({node, ...props}) => <tbody className="bg-white divide-y divide-slate-200" {...props} />,
                    tr: ({node, ...props}) => <tr className="hover:bg-slate-50 transition-colors" {...props} />,
                    th: ({node, ...props}) => <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50" {...props} />,
                    td: ({node, ...props}) => <td className="px-6 py-4 text-sm text-slate-700 leading-relaxed align-top" {...props} />,
                    }}
                >
                    {report}
                </ReactMarkdown>
              </div>
            </div>
          )}
       </div>
    </div>
  );
};

export default NeedsAnalysis;
