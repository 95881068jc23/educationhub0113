import React, { useState, useRef, useEffect } from 'react';
import { ExamType, Language, PlanItem } from '../types';
import { generateCourseware, generateTeacherGuide, generateVocabularyList, generateExamResources } from '../services/geminiService';
import { TRANSLATIONS } from '../constants';
import { Loader2, BookOpen, Upload, Download, FileText, Image as ImageIcon, ArrowDownCircle, ArrowLeft, GraduationCap, Languages, Save, Edit3, RefreshCw, X, Globe, Library } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import html2canvas from 'html2canvas';
import remarkGfm from 'remark-gfm';

interface Props {
  exam: ExamType;
  language: Language;
  plan: PlanItem[];
  onBack: () => void;
}

type Mode = 'lesson' | 'guide' | 'vocab' | 'resources';

// Progress Timer Component (Reused)
const ProgressTimer = ({ active, estimatedTime = 60 }: { active: boolean, estimatedTime?: number }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!active) {
            setProgress(0);
            return;
        }
        
        const interval = setInterval(() => {
            setProgress(old => {
                if (old >= 95) return 95; 
                const increment = old < 50 ? 2 : 1; 
                return old + increment;
            });
        }, (estimatedTime * 1000) / 100); 

        return () => clearInterval(interval);
    }, [active, estimatedTime]);

    if (!active) return null;

    return (
        <div className="w-full mt-4 animate-fade-in">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Thinking & Writing...</span>
                <span>{Math.round(progress)}% (Est. {estimatedTime}s)</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
    );
};

const Courseware: React.FC<Props> = ({ exam, language, plan, onBack }) => {
  const [topic, setTopic] = useState('');
  const [details, setDetails] = useState('');
  const [file, setFile] = useState<{ base64: string, mimeType: string } | null>(null);
  
  // Content States
  const [lessonContent, setLessonContent] = useState('');
  const [guideContent, setGuideContent] = useState('');
  const [vocabContent, setVocabContent] = useState('');
  const [resourceContent, setResourceContent] = useState('');
  
  // Settings
  const [isTAMode, setIsTAMode] = useState(false); // For Vocab
  const [vocabQuantity, setVocabQuantity] = useState<number>(20);

  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'input' | 'result'>('input');
  const [activeTab, setActiveTab] = useState<Mode>('lesson');
  const [isEditing, setIsEditing] = useState(false);
  
  // Regeneration State
  const [showRegen, setShowRegen] = useState(false);
  const [regenPrompt, setRegenPrompt] = useState('');

  const contentRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[language];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setFile({ base64: base64String, mimeType: selectedFile.type });
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleGenerate = async (targetMode: Mode = 'lesson', extraPrompt: string = '') => {
    // For resources, we don't need topic/details necessarily, but we can pass exam
    if (targetMode !== 'resources' && !topic && !details && !file && !extraPrompt) return;
    
    setLoading(true);
    
    // Close regen modal
    setShowRegen(false);
    setRegenPrompt('');

    // Append extra instructions to details/context if present
    const enhancedDetails = extraPrompt 
        ? `${details}\n\n[REGENERATION INSTRUCTIONS]: ${extraPrompt}` 
        : details;

    try {
      if (targetMode === 'lesson') {
        const text = await generateCourseware(exam, topic, enhancedDetails, language, file);
        setLessonContent(text);
        setActiveTab('lesson');
      } else if (targetMode === 'guide') {
        const text = await generateTeacherGuide(exam, topic, enhancedDetails, language);
        setGuideContent(text);
        setActiveTab('guide');
      } else if (targetMode === 'vocab') {
        const text = await generateVocabularyList(exam, topic, enhancedDetails, language, isTAMode, vocabQuantity);
        setVocabContent(text);
        setActiveTab('vocab');
      } else if (targetMode === 'resources') {
        const text = await generateExamResources(exam, language);
        setResourceContent(text);
        setActiveTab('resources');
      }
      setView('result');
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleImportFromPlan = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = e.target.value;
    if (idx === "") return;
    const item = plan[parseInt(idx)];
    if (item) {
      setTopic(item.topic);
      setDetails(`Phase: ${item.phase}\nContent: ${item.content}\nObjective: Cover this in ${item.hours} hours.`);
    }
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    // Content is already updated via textarea onChange
  };

  const updateCurrentContent = (val: string) => {
    switch (activeTab) {
      case 'lesson': setLessonContent(val); break;
      case 'guide': setGuideContent(val); break;
      case 'vocab': setVocabContent(val); break;
      case 'resources': setResourceContent(val); break;
    }
  };

  const handleExportWord = () => {
    if (!contentRef.current) return;
    const htmlContent = contentRef.current.innerHTML;

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
        <title>Courseware</title>
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
    link.download = `Courseware-${exam}-${activeTab}.doc`;
    link.click();
    document.body.removeChild(link);
  };

  const handleExportImage = async () => {
    if (!contentRef.current) return;
    try {
      const canvas = await html2canvas(contentRef.current);
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `Courseware-${exam}-${activeTab}.png`;
      link.click();
    } catch (e) {
      console.error('Image export failed', e);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const getCurrentContent = () => {
    switch (activeTab) {
      case 'lesson': return lessonContent;
      case 'guide': return guideContent;
      case 'vocab': return vocabContent;
      case 'resources': return resourceContent;
      default: return '';
    }
  };

  const getActiveTitle = () => {
    switch (activeTab) {
        case 'lesson': return "Lesson Courseware";
        case 'guide': return "Teacher's Guide";
        case 'vocab': return isTAMode && activeTab === 'vocab' ? "Vocabulary (TA Check Version)" : "Vocabulary List";
        case 'resources': return "Global Prep Resources";
    }
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
             <BookOpen className="text-indigo-600" size={28} />
             {t.courseware}
          </h2>

          <div className="space-y-6">
             {plan.length > 0 && (
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                  <label className="text-sm font-bold text-indigo-900 mb-2 block">{t.importPlan}</label>
                  <div className="relative">
                    <ArrowDownCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white z-10 pointer-events-none" size={20} />
                    <select 
                      onChange={handleImportFromPlan}
                      className="w-full pl-10 p-3 bg-black text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer font-medium"
                    >
                      <option value="" className="bg-black text-white">-- Select a lesson from your Study Plan --</option>
                      {plan.map((item, i) => (
                        <option key={i} value={i} className="bg-black text-white">
                          {item.phase} - {item.topic} ({item.hours}h)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
             )}

             <div className="space-y-2">
               <label className="text-sm font-medium text-slate-600">Lesson Topic</label>
               <input
                 type="text"
                 value={topic}
                 onChange={(e) => setTopic(e.target.value)}
                 placeholder="e.g. Introduction to Calculus Limits"
                 className="w-full p-4 bg-slate-700 text-white placeholder-slate-400 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
               />
             </div>

             <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Context / Details</label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Specific learning objectives, difficulty level, or specific problems to include..."
                  className="w-full h-40 p-4 bg-slate-700 text-white placeholder-slate-400 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
             </div>

             <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Reference Material</label>
                <label className="flex items-center justify-center w-full p-4 bg-slate-50 border border-slate-200 border-dashed rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                   <div className="flex items-center gap-3">
                      <Upload size={20} className="text-slate-400" />
                      <span className="text-sm font-medium text-slate-600">{file ? 'File Attached' : 'Upload PDF/Image for reference'}</span>
                   </div>
                   <input type="file" accept="application/pdf,image/*" onChange={handleFileUpload} className="hidden" />
                </label>
             </div>
             
             {/* Action Buttons */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
                <button
                  onClick={() => handleGenerate('lesson')}
                  disabled={loading}
                  className="py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex flex-col items-center justify-center gap-1 shadow-lg transition-transform active:scale-[0.98]"
                >
                  {loading && activeTab === 'lesson' ? <Loader2 className="animate-spin" /> : <BookOpen size={24} />}
                  <span className="text-sm">Generate Lesson</span>
                </button>

                <button
                  onClick={() => handleGenerate('guide')}
                  disabled={loading}
                  className="py-4 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 disabled:opacity-50 flex flex-col items-center justify-center gap-1 shadow-lg transition-transform active:scale-[0.98]"
                >
                   {loading && activeTab === 'guide' ? <Loader2 className="animate-spin" /> : <GraduationCap size={24} />}
                   <span className="text-sm">Teacher's Guide</span>
                </button>

                <div className="flex flex-col gap-2">
                    <div className="flex gap-1">
                        <select 
                            value={vocabQuantity} 
                            onChange={(e) => setVocabQuantity(Number(e.target.value))}
                            className="bg-black text-white text-sm rounded-lg px-2 focus:outline-none font-bold text-center"
                        >
                            {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(n => (
                                <option key={n} value={n} className="bg-black text-white">{n}</option>
                            ))}
                        </select>
                        <button
                        onClick={() => handleGenerate('vocab')}
                        disabled={loading}
                        className="flex-1 py-2 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                        >
                            {loading && activeTab === 'vocab' ? <Loader2 className="animate-spin" size={16} /> : <Languages size={18} />}
                            <span className="text-sm">Vocab</span>
                        </button>
                    </div>
                    <label className="flex items-center justify-center gap-2 text-xs font-medium text-slate-600 cursor-pointer select-none">
                        <div className={`w-10 h-5 rounded-full p-1 transition-colors ${isTAMode ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                           <div className={`bg-white w-3 h-3 rounded-full shadow-sm transform transition-transform ${isTAMode ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </div>
                        <input type="checkbox" checked={isTAMode} onChange={e => setIsTAMode(e.target.checked)} className="hidden" />
                        TA Check Mode
                    </label>
                </div>
             </div>

             {/* Resources Section - BELOW Buttons */}
             <div className="mt-8 border-t border-slate-100 pt-6 animate-fade-in-up">
                <h3 className="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2">
                   <Library className="text-indigo-500"/> {t.resourcesTitle}
                </h3>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-indigo-200 transition-colors">
                    <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                       {t.resourcesDesc}
                    </p>
                    <button
                        onClick={() => handleGenerate('resources')}
                        disabled={loading}
                        className="w-full py-3 bg-white border-2 border-indigo-100 text-indigo-700 rounded-lg font-bold hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading && activeTab === 'resources' ? <Loader2 className="animate-spin" size={18}/> : <Globe size={18} />}
                        {t.findResources}
                    </button>
                </div>
             </div>
             
             {/* Timer */}
             <ProgressTimer active={loading} estimatedTime={90} />
          </div>
        </div>
      </div>
    );
  }

  // Result View
  return (
    <div className="h-full flex flex-col relative">
       {/* Regeneration Modal */}
       {showRegen && (
         <div className="absolute top-0 left-0 w-full h-full bg-white/90 z-20 flex flex-col items-center justify-center p-6 backdrop-blur-sm rounded-xl">
             <div className="bg-black p-6 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-700 animate-fade-in-up">
                 <div className="flex justify-between items-center mb-4">
                     <h3 className="text-white font-bold text-lg flex items-center gap-2">
                         <RefreshCw size={18} className="text-indigo-400"/> Regenerate {getActiveTitle()}
                     </h3>
                     <button onClick={() => setShowRegen(false)} className="text-slate-400 hover:text-white">
                         <X size={20} />
                     </button>
                 </div>
                 <textarea
                     value={regenPrompt}
                     onChange={(e) => setRegenPrompt(e.target.value)}
                     placeholder="Enter specific instructions for regeneration (e.g., 'Make it harder', 'Add more examples')..."
                     className="w-full h-32 bg-slate-900 text-white border border-slate-700 rounded-lg p-3 outline-none focus:border-indigo-500 resize-none mb-4"
                     autoFocus
                 />
                 <div className="flex justify-end gap-3">
                     <button 
                         onClick={() => setShowRegen(false)}
                         className="px-4 py-2 text-slate-300 hover:text-white"
                     >
                         Cancel
                     </button>
                     <button 
                         onClick={() => handleGenerate(activeTab, regenPrompt)}
                         disabled={loading}
                         className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2"
                     >
                         {loading ? <Loader2 className="animate-spin" size={16}/> : 'Regenerate'}
                     </button>
                 </div>
             </div>
         </div>
       )}

       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 no-print gap-4">
          <div className="flex items-center gap-3 flex-wrap">
             <button 
                onClick={() => setView('input')} 
                className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors font-medium"
             >
                <ArrowLeft size={20} /> Back
             </button>

             <button 
                onClick={() => setShowRegen(true)} 
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-slate-800 shadow-sm transition-colors font-bold"
            >
                <RefreshCw size={18} /> Regenerate
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
                <Edit3 size={18} /> Edit Content
              </button>
            )}
          </div>
          
          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-lg flex-wrap gap-1">
             <button 
                onClick={() => { if(lessonContent) { setActiveTab('lesson'); setIsEditing(false); } else handleGenerate('lesson'); }}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'lesson' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
                Lesson
             </button>
             <button 
                onClick={() => { if(guideContent) { setActiveTab('guide'); setIsEditing(false); } else handleGenerate('guide'); }}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'guide' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
                Teacher Guide
             </button>
             <button 
                onClick={() => { if(vocabContent) { setActiveTab('vocab'); setIsEditing(false); } else handleGenerate('vocab'); }}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'vocab' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
                Vocabulary
             </button>
             <button 
                onClick={() => { if(resourceContent) { setActiveTab('resources'); setIsEditing(false); } else handleGenerate('resources'); }}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1 ${activeTab === 'resources' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
                <Globe size={14}/> Resources
             </button>
          </div>

          <div className="flex gap-2">
             <button onClick={handleExportWord} disabled={isEditing} className="p-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors disabled:opacity-50" title="Word">
                <FileText size={18} />
             </button>
             <button onClick={handleExportPDF} disabled={isEditing} className="p-2 bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors disabled:opacity-50" title="PDF">
                <Download size={18} />
             </button>
             <button onClick={handleExportImage} disabled={isEditing} className="p-2 bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors disabled:opacity-50" title="Image">
                <ImageIcon size={18} />
             </button>
          </div>
       </div>
       
       <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex-1 relative">
          {isEditing ? (
             <div className="p-0 h-full">
                <textarea 
                  value={getCurrentContent()}
                  onChange={(e) => updateCurrentContent(e.target.value)}
                  className="w-full h-[70vh] p-8 text-slate-800 font-mono text-sm leading-relaxed outline-none resize-none bg-slate-50"
                  placeholder="Content is empty..."
                />
             </div>
          ) : (
            <div ref={contentRef} className="prose prose-slate max-w-none p-8 md:p-12 bg-white relative">
                {/* Watermark for Screen/Image */}
                <div className="watermark-overlay">
                    <div className="watermark-text">麦迩威教育</div>
                </div>

                <div className="hidden print:block mb-8 border-b pb-4 relative z-10">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        {activeTab === 'resources' && <Globe className="text-blue-500"/>}
                        {getActiveTitle()}
                    </h1>
                    <p className="text-slate-500">{topic || exam} | {exam}</p>
                </div>
                {getCurrentContent() ? (
                    <div className="relative z-10">
                        <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                            h1: ({node, ...props}) => <h1 className="text-indigo-900 border-b-2 border-indigo-100 pb-4 mb-6 font-bold text-3xl" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-slate-800 font-bold mt-8 mb-4 text-2xl border-l-4 border-indigo-500 pl-4" {...props} />,
                            p: ({node, ...props}) => <p className="text-slate-700 leading-relaxed mb-4 text-lg" {...props} />,
                            li: ({node, ...props}) => <li className="text-slate-700 leading-relaxed mb-2" {...props} />,
                            strong: ({node, ...props}) => <strong className="text-indigo-900 font-bold" {...props} />,
                            blockquote: ({node, ...props}) => <blockquote className="bg-slate-50 border-l-4 border-slate-300 p-4 italic text-slate-600 my-6 rounded-r-lg" {...props} />,
                            // Style Links as buttons for Resources
                            a: ({node, ...props}) => (
                            <a 
                                className="text-blue-600 hover:text-blue-800 hover:underline break-words font-medium cursor-pointer" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                {...props} 
                            />
                            ),
                            // Robust Table Styling
                            table: ({node, ...props}) => (
                                <div className="overflow-x-auto my-8 rounded-lg border border-slate-200 shadow-sm">
                                <table className="min-w-full divide-y divide-slate-200" {...props} />
                                </div>
                            ),
                            thead: ({node, ...props}) => <thead className="bg-slate-50" {...props} />,
                            tbody: ({node, ...props}) => <tbody className="bg-white divide-y divide-slate-200" {...props} />,
                            tr: ({node, ...props}) => <tr className="hover:bg-slate-50 transition-colors" {...props} />,
                            th: ({node, ...props}) => <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50" {...props} />,
                            td: ({node, ...props}) => <td className="px-6 py-4 text-sm text-slate-700 leading-relaxed align-top" {...props} />,
                        }}
                        >
                        {getCurrentContent()}
                        </ReactMarkdown>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400 opacity-50 relative z-10">
                        <BookOpen size={48} className="mb-4"/>
                        <p>Select a tab above to generate content</p>
                    </div>
                )}
            </div>
          )}
       </div>
    </div>
  );
};

export default Courseware;