import React, { useState, useRef, useEffect } from 'react';
import { ExamType, Language, PlanItem } from '../types';
import { generateCoursePlan } from '../services/geminiService';
import { TRANSLATIONS } from '../constants';
import { Loader2, Upload, FileText, ArrowDownCircle, Clock, ArrowLeft, Download, Image as ImageIcon, Edit3, Save, RefreshCw, X, Book, PlusCircle } from 'lucide-react';
import html2canvas from 'html2canvas';

interface Props {
  exam: ExamType;
  language: Language;
  plan: PlanItem[];
  setPlan: (plan: PlanItem[]) => void;
  analysisResult: string; // From Needs Analysis
  onBack: () => void;
}

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
                const increment = old < 60 ? 3 : 1; 
                return old + increment;
            });
        }, (estimatedTime * 1000) / 100); 

        return () => clearInterval(interval);
    }, [active, estimatedTime]);

    if (!active) return null;

    return (
        <div className="w-full mt-4 animate-fade-in">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Planning Course...</span>
                <span>{Math.round(progress)}% (Est. {estimatedTime}s)</span>
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

const StudyPlan: React.FC<Props> = ({ exam, language, plan, setPlan, analysisResult, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [file, setFile] = useState<{ base64: string, mimeType: string } | null>(null);
  const t = TRANSLATIONS[language];
  
  // Use local view state to toggle between input form and result table
  const [view, setView] = useState<'input' | 'result'>(plan.length > 0 ? 'result' : 'input');
  const [isEditing, setIsEditing] = useState(false);
  const planRef = useRef<HTMLDivElement>(null);
  
  // Track current phase generation
  const [currentPhase, setCurrentPhase] = useState(1);

  // Regeneration State
  const [showRegen, setShowRegen] = useState(false);
  const [regenPrompt, setRegenPrompt] = useState('');

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

  const handleGeneratePhase = async (phase: number, extraPrompt: string = '') => {
    // Combine manual input + imported needs + extraPrompt
    let context = manualInput + (manualInput && analysisResult ? '\n\n' : '') + (analysisResult || '');
    
    // Append previous phases context to ensure continuity if generating subsequent phases
    if (phase > 1) {
        context += `\n\n[PREVIOUS PLAN CONTEXT]: I have already generated ${plan.length} lessons. Please continue for Phase ${phase}.`;
    }

    if (extraPrompt) {
        context += `\n\n[INSTRUCTIONS]: ${extraPrompt}`;
    }

    if (!context && !file) return;

    setLoading(true);
    setShowRegen(false); // Close modal if open
    setRegenPrompt('');

    try {
      const newItems = await generateCoursePlan(exam, language, context, file, phase);
      
      if (phase === 1) {
          setPlan(newItems); // Replace if Phase 1
      } else {
          setPlan([...plan, ...newItems]); // Append if Phase 2+
      }
      
      setCurrentPhase(phase);
      setView('result');
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      alert('Generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImportNeeds = () => {
    if (analysisResult) {
      setManualInput(prev => (prev ? prev + '\n\n' : '') + `[Imported Analysis]\n${analysisResult}`);
    }
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
  };

  const updateItem = (idx: number, field: keyof PlanItem, value: string | number) => {
    const newPlan = [...plan];
    // @ts-ignore
    newPlan[idx] = { ...newPlan[idx], [field]: value };
    setPlan(newPlan);
  };

  // Export functions
  const handleExportWord = () => {
    if (!planRef.current) return;
    const htmlContent = planRef.current.innerHTML;

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
        <title>Course Plan</title>
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
    link.download = `${exam}_Course_Plan.doc`;
    link.click();
    document.body.removeChild(link);
  };

  const handleExportImage = async () => {
    if (!planRef.current) return;
    try {
      const canvas = await html2canvas(planRef.current);
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${exam}_Course_Plan.png`;
      link.click();
    } catch (e) {
      console.error('Image export failed', e);
    }
  };

  const handleExportPDF = () => {
    window.print();
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
             {t.studyPlan}
          </h2>
          <p className="text-slate-500 mb-6 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
            {t.planPrompt}
          </p>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <button 
                onClick={handleImportNeeds}
                disabled={!analysisResult}
                className="flex-1 py-4 px-6 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200 hover:bg-indigo-100 disabled:opacity-50 text-sm font-bold flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              >
                <ArrowDownCircle size={24} /> 
                {t.importNeeds}
                {analysisResult && <span className="text-xs font-normal text-indigo-500">Analysis Data Available</span>}
              </button>
              
              <label className="flex-1 py-4 px-6 bg-slate-50 text-slate-700 rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer text-sm font-bold flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.02]">
                <Upload size={24} /> 
                {t.uploadFile}
                <span className="text-xs font-normal text-slate-500">{file ? 'File Attached' : 'PDF / Images'}</span>
                <input type="file" accept="application/pdf,image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <div className="space-y-2">
               <label className="text-sm font-medium text-slate-600">{t.manualInput}</label>
               <textarea
                 value={manualInput}
                 onChange={(e) => setManualInput(e.target.value)}
                 placeholder="Enter specific requirements, time constraints, or learning goals..."
                 className="w-full h-48 p-4 bg-slate-700 text-white placeholder-slate-400 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
               />
            </div>

            <div>
                <button
                onClick={() => handleGeneratePhase(1)} // Default start with Phase 1
                disabled={loading || (!manualInput && !file)}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg transition-transform active:scale-[0.98]"
                >
                {loading ? <Loader2 className="animate-spin" /> : t.start}
                </button>
                <ProgressTimer active={loading} estimatedTime={60} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Result View
  return (
    <div className="space-y-6 relative">
      {/* Regeneration Modal */}
      {showRegen && (
         <div className="absolute top-0 left-0 w-full h-full bg-white/90 z-20 flex flex-col items-center justify-center p-6 backdrop-blur-sm rounded-xl">
             <div className="bg-black p-6 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-700 animate-fade-in-up">
                 <div className="flex justify-between items-center mb-4">
                     <h3 className="text-white font-bold text-lg flex items-center gap-2">
                         <RefreshCw size={18} className="text-indigo-400"/> Regenerate with Instructions
                     </h3>
                     <button onClick={() => setShowRegen(false)} className="text-slate-400 hover:text-white">
                         <X size={20} />
                     </button>
                 </div>
                 <textarea
                     value={regenPrompt}
                     onChange={(e) => setRegenPrompt(e.target.value)}
                     placeholder="Enter instructions (e.g., 'Make phase 1 longer', 'Focus more on vocabulary')..."
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
                         onClick={() => handleGeneratePhase(1, regenPrompt)} // Regenerate from start
                         disabled={loading}
                         className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2"
                     >
                         {loading ? <Loader2 className="animate-spin" size={16}/> : 'Regenerate'}
                     </button>
                 </div>
             </div>
         </div>
      )}

      <div className="flex justify-between items-center no-print flex-wrap gap-4">
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
                <Save size={18} /> Save Plan
              </button>
            ) : (
              <button 
                onClick={() => setIsEditing(true)} 
                className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors font-medium"
              >
                <Edit3 size={18} /> Edit Plan
              </button>
          )}
        </div>
         
         <div className="flex gap-2">
            <button onClick={handleExportWord} disabled={isEditing} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200 font-medium transition-colors disabled:opacity-50" title={t.exportWord}>
               <FileText size={18}/> Word
            </button>
            <button onClick={handleExportPDF} disabled={isEditing} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 border border-red-200 font-medium transition-colors disabled:opacity-50" title={t.exportPDF}>
               <Download size={18}/> PDF
            </button>
            <button onClick={handleExportImage} disabled={isEditing} className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 border border-green-200 font-medium transition-colors disabled:opacity-50" title={t.exportImg}>
               <ImageIcon size={18}/> Image
            </button>
          </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden print-only relative">
        <div ref={planRef} className="p-0 relative">
          {/* Watermark for Screen/Image */}
          <div className="watermark-overlay">
             <div className="watermark-text">麦迩威教育</div>
          </div>
          
          <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center relative z-10">
             <div>
               <h2 className="text-xl font-bold text-slate-800">Course Schedule</h2>
               <span className="text-slate-500 text-sm">{exam} Curriculum</span>
             </div>
             <span className="flex items-center gap-2 bg-indigo-100 text-indigo-800 px-4 py-2 rounded-lg font-bold">
               <Clock size={18} />
               Total: {plan.reduce((acc, i) => acc + (typeof i.hours === 'number' ? i.hours : parseFloat(i.hours) || 0), 0)} Hours
             </span>
          </div>
          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-bold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 w-[15%]">{t.phase} / Class</th>
                  <th className="px-6 py-4 w-[20%]">{t.topic}</th>
                  <th className="px-6 py-4 w-[35%]">{t.content}</th>
                  <th className="px-6 py-4 w-[20%] text-amber-700"><div className="flex items-center gap-1"><Book size={14}/> Resources</div></th>
                  <th className="px-6 py-4 w-[10%] text-right">{t.hours}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-transparent">
                {plan.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    {isEditing ? (
                        <>
                            <td className="px-4 py-3 align-top">
                                <input 
                                    value={item.phase} 
                                    onChange={(e) => updateItem(idx, 'phase', e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </td>
                            <td className="px-4 py-3 align-top">
                                <input 
                                    value={item.topic} 
                                    onChange={(e) => updateItem(idx, 'topic', e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </td>
                            <td className="px-4 py-3 align-top">
                                <textarea 
                                    value={item.content} 
                                    onChange={(e) => updateItem(idx, 'content', e.target.value)}
                                    rows={3}
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none resize-vertical"
                                />
                            </td>
                            <td className="px-4 py-3 align-top">
                                <textarea 
                                    value={item.resources || ''} 
                                    onChange={(e) => updateItem(idx, 'resources', e.target.value)}
                                    rows={2}
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none resize-vertical"
                                    placeholder="Textbook references..."
                                />
                            </td>
                            <td className="px-4 py-3 align-top text-right">
                                <input 
                                    type="number"
                                    value={item.hours} 
                                    onChange={(e) => updateItem(idx, 'hours', parseFloat(e.target.value))}
                                    className="w-20 p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                                />
                            </td>
                        </>
                    ) : (
                        <>
                            <td className="px-6 py-4 font-bold text-slate-800 align-top">{item.phase}</td>
                            <td className="px-6 py-4 text-indigo-700 font-bold align-top">{item.topic}</td>
                            <td className="px-6 py-4 text-slate-600 leading-relaxed align-top whitespace-pre-line text-sm">{item.content}</td>
                            <td className="px-6 py-4 text-amber-700 font-medium align-top whitespace-pre-line text-xs bg-amber-50/50">
                                {item.resources || 'No specific reference'}
                            </td>
                            <td className="px-6 py-4 text-right font-mono font-medium text-slate-700 align-top">
                            {item.hours} h
                            </td>
                        </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Generate Next Phase Button - Visible only in Result mode and not editing */}
          {!isEditing && (
              <div className="p-6 border-t border-slate-200 bg-slate-50 relative z-10 flex flex-col items-center gap-4">
                  {loading ? (
                       <div className="w-full max-w-md">
                          <ProgressTimer active={loading} estimatedTime={60} />
                       </div>
                  ) : (
                      <button 
                        onClick={() => handleGeneratePhase(currentPhase + 1)} 
                        className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-full font-bold shadow-md hover:bg-indigo-700 transition-transform hover:scale-105"
                      >
                        <PlusCircle size={20} />
                        Generate Phase {currentPhase + 1} Plan
                      </button>
                  )}
                  <p className="text-xs text-slate-500">Generating phase by phase helps AI produce more detailed lesson plans.</p>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyPlan;