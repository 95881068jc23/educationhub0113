
import React, { useState, useRef } from 'react';
import { ExamType, Language, SchoolAdmissionProfile } from '../types';
import { generateSchoolAdmissionReport } from '../services/geminiService';
import { TRANSLATIONS, ADMISSION_CITIES, FAMOUS_SCHOOLS_DATA } from '../constants';
import { Loader2, ArrowLeft, Save, Edit3, FileText, Download, Image as ImageIcon, MapPin, School, GraduationCap, ChevronDown, ChevronUp, Star, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import html2canvas from 'html2canvas';
import remarkGfm from 'remark-gfm';

interface Props {
  exam: ExamType;
  language: Language;
  onBack: () => void;
}

const SchoolSelection: React.FC<Props> = ({ exam, language, onBack }) => {
  const t = TRANSLATIONS[language];
  const [view, setView] = useState<'input' | 'result'>('input');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Form State
  const [profile, setProfile] = useState<SchoolAdmissionProfile>({
    city: ADMISSION_CITIES[0],
    studentAge: '',
    currentSchool: '',
    languageLevel: '',
    mathLevel: '',
    budget: '',
    targetSchools: [],
    otherRequirements: ''
  });

  // Helper to update field
  const updateField = (field: keyof SchoolAdmissionProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  // Helper for Multi-Select Schools
  const toggleSchool = (school: string) => {
    const current = profile.targetSchools;
    if (current.includes(school)) {
      updateField('targetSchools', current.filter(s => s !== school));
    } else {
      updateField('targetSchools', [...current, school]);
    }
  };

  const availableSchools = FAMOUS_SCHOOLS_DATA[profile.city] || [];

  const handleGenerate = async () => {
    if (!profile.studentAge || !profile.languageLevel) {
        alert("Please fill in at least Age and Academic Level.");
        return;
    }
    setLoading(true);
    try {
      const result = await generateSchoolAdmissionReport(profile, language);
      setReport(result);
      setView('result');
    } catch (e) {
      console.error(e);
      alert("Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Export functions (reused)
  const handleExportWord = () => {
    if (!reportRef.current) return;
    const htmlContent = reportRef.current.innerHTML;
    const watermarkSvg = encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="500" height="500">
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="60" fill="rgba(0,0,0,0.1)" text-anchor="middle" dominant-baseline="middle" transform="rotate(-45 250 250)">麦迩威教育</text>
      </svg>`.trim());
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Admission Strategy</title><style>body {background-image: url('data:image/svg+xml;utf8,${watermarkSvg}');background-repeat: repeat;}</style></head><body>`;
    const footer = "</body></html>";
    const sourceHTML = header + htmlContent + footer;
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const link = document.createElement("a");
    document.body.appendChild(link);
    link.href = source;
    link.download = `Admission_Strategy_${profile.city}.doc`;
    link.click();
    document.body.removeChild(link);
  };

  const handleExportImage = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current);
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `Admission_Strategy_${profile.city}.png`;
      link.click();
    } catch (e) {
      console.error('Image export failed', e);
    }
  };

  if (view === 'input') {
    return (
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-4 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors md:hidden">
           <ArrowLeft size={16} /> Back
        </button>
        
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
          <div className="mb-8 border-b border-slate-100 pb-6">
             <div className="flex items-center gap-3 mb-2">
                <div className="bg-indigo-600 p-2 rounded-lg text-white">
                    <School size={28} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{t.schoolGenerate}</h2>
             </div>
             <p className="text-slate-500 text-sm ml-12">{t.schoolPrompt}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Left Col: Basics */}
             <div className="space-y-5">
                <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <MapPin size={16} className="text-indigo-500"/> {t.schoolSelectCity}
                    </label>
                    <select 
                        value={profile.city}
                        onChange={(e) => {
                            updateField('city', e.target.value);
                            updateField('targetSchools', []); // Clear schools on city change
                        }}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium"
                    >
                        {ADMISSION_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">{t.schoolStudentAge}</label>
                    <input 
                        type="text" 
                        value={profile.studentAge}
                        onChange={(e) => updateField('studentAge', e.target.value)}
                        placeholder="e.g. 10 years old / G4"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">{t.schoolCurrent}</label>
                    <input 
                        type="text" 
                        value={profile.currentSchool}
                        onChange={(e) => updateField('currentSchool', e.target.value)}
                        placeholder="e.g. Local Public School / Bilingual School"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">{t.schoolLevels}</label>
                    <textarea 
                        value={profile.languageLevel}
                        onChange={(e) => updateField('languageLevel', e.target.value)}
                        rows={3}
                        placeholder="e.g. English: PET passed with Merit; Math: Ahead of grade level; Chinese: Native."
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    />
                </div>
             </div>

             {/* Right Col: Targets & Budget */}
             <div className="space-y-5">
                <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Star size={16} className="text-amber-500"/> {t.schoolTarget}
                    </label>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 h-64 overflow-y-auto custom-scrollbar">
                        {availableSchools.map(school => (
                            <label key={school} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-100">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${profile.targetSchools.includes(school) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                                    {profile.targetSchools.includes(school) && <div className="w-2 h-2 bg-white rounded-sm"></div>}
                                </div>
                                <input 
                                    type="checkbox" 
                                    className="hidden" 
                                    checked={profile.targetSchools.includes(school)} 
                                    onChange={() => toggleSchool(school)}
                                />
                                <span className={`text-sm ${profile.targetSchools.includes(school) ? 'text-indigo-900 font-bold' : 'text-slate-600'}`}>{school}</span>
                            </label>
                        ))}
                        {availableSchools.length === 0 && <p className="text-xs text-slate-400 p-2">Select a city to see school list.</p>}
                    </div>
                    {/* Manual School Input */}
                    <div className="mt-2 flex gap-2">
                        <input 
                            type="text" 
                            placeholder="Other school name..."
                            className="flex-1 p-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const val = (e.target as HTMLInputElement).value;
                                    if(val) { toggleSchool(val); (e.target as HTMLInputElement).value = ''; }
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">{t.schoolBudget}</label>
                    <textarea 
                        value={profile.budget}
                        onChange={(e) => updateField('budget', e.target.value)}
                        rows={2}
                        placeholder="e.g. Budget 300k/year. Prefer boarding."
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    />
                </div>
             </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
             <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-4 bg-indigo-900 text-white rounded-xl font-bold text-lg hover:bg-indigo-800 disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg transition-transform active:scale-[0.98]"
             >
                {loading ? <Loader2 className="animate-spin" /> : <GraduationCap size={24} />}
                {t.schoolGenerate}
             </button>
             {loading && (
                 <p className="text-center text-xs text-slate-400 mt-3 animate-pulse">
                    Scanning authoritative sources for {profile.city} schools... (2025-2026 Data)
                 </p>
             )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative">
        <div className="flex justify-between items-center mb-6 no-print">
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setView('input')} 
                    className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors font-medium"
                >
                    <ArrowLeft size={20} /> Back
                </button>
                {isEditing ? (
                    <button 
                        onClick={() => setIsEditing(false)} 
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-colors font-bold"
                    >
                        <Save size={18} /> Save
                    </button>
                ) : (
                    <button 
                        onClick={() => setIsEditing(true)} 
                        className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors font-medium"
                    >
                        <Edit3 size={18} /> Edit
                    </button>
                )}
            </div>
            <div className="flex gap-2">
                <button onClick={handleExportWord} className="p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100" title="Word"><FileText size={18}/></button>
                <button onClick={handleExportImage} className="p-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100" title="Image"><ImageIcon size={18}/></button>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex-1 relative">
            {isEditing ? (
                <div className="p-0 h-full">
                    <textarea 
                        value={report}
                        onChange={(e) => setReport(e.target.value)}
                        className="w-full h-[70vh] p-8 text-slate-800 font-mono text-sm leading-relaxed outline-none resize-none bg-slate-50"
                    />
                </div>
            ) : (
                <div ref={reportRef} className="prose prose-slate max-w-none p-8 md:p-12 bg-white relative">
                    <div className="watermark-overlay">
                        <div className="watermark-text">麦迩威教育</div>
                    </div>
                    <div className="relative z-10">
                        <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                                h1: ({node, ...props}) => <h1 className="text-3xl font-extrabold text-indigo-900 border-b-2 border-indigo-100 pb-4 mb-8" {...props} />,
                                h2: ({node, ...props}) => (
                                    <div className="bg-slate-50 border-l-4 border-indigo-600 p-4 mt-8 mb-6 rounded-r-lg">
                                        <h2 className="text-indigo-900 font-bold text-2xl m-0" {...props} />
                                    </div>
                                ),
                                strong: ({node, ...props}) => <strong className="text-indigo-900 font-bold bg-indigo-50 px-1 rounded" {...props} />,
                                table: ({node, ...props}) => (
                                    <div className="overflow-x-auto my-8 rounded-lg border border-slate-200 shadow-sm">
                                        <table className="min-w-full divide-y divide-slate-200" {...props} />
                                    </div>
                                ),
                                thead: ({node, ...props}) => <thead className="bg-indigo-50" {...props} />,
                                tbody: ({node, ...props}) => <tbody className="bg-white divide-y divide-slate-200" {...props} />,
                                th: ({node, ...props}) => <th className="px-6 py-4 text-left text-xs font-bold text-indigo-800 uppercase tracking-wider" {...props} />,
                                td: ({node, ...props}) => <td className="px-6 py-4 text-sm text-slate-700" {...props} />,
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

export default SchoolSelection;
