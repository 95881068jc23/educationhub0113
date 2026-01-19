
import React, { useState, useRef, useEffect } from 'react';
import { LessonPlanResponse, SectionContent, AudioContentType } from '../types';
import { Printer, BookOpen, GraduationCap, CheckCircle, Image as ImageIcon, Volume2, Loader2, ArrowLeft, RefreshCw, Send, FileText, Download, Play, Pause, PlusCircle, Settings2, User, ChevronDown, Layers, Gamepad2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from "jspdf";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateSpeech, generateTeacherGuides, generatePreClass, generatePostClass, generateGrammar, generateDerivedPractice, generateHomework, generateSummary, generateSectionGuide, regenerateSectionContent, regenerateModulePractice } from '../services/geminiService';

interface Props {
  data: LessonPlanResponse;
  onBack: () => void;
  onRegenerate: (prompt: string) => void;
  onUpdateLesson: (updated: LessonPlanResponse) => void;
  onSectionUpdate: (sectionName: 'preClass' | 'inClass' | 'postClass', content: SectionContent) => void;
  isRegenerating: boolean;
}

const cleanContent = (text: string) => {
  if (!text) return "";
  // Strip HTML tags, remove ** bolding markers (as requested), fix BRs
  return text.replace(/<\/?(h\d|p|li|ul|ol|strong|em|hr|div|span|b|i)[^>]*>/gi, '')
             .replace(/<br\s*\/?>/gi, '\n')
             .replace(/\*\*/g, ''); // Removes bold markers strictly
};

const AVAILABLE_VOICES = [
  { name: 'Kore', label: 'Female (Standard) - Kore' },
  { name: 'Puck', label: 'Male (Standard) - Puck' },
  { name: 'Fenrir', label: 'Male (Deep) - Fenrir' },
  { name: 'Charon', label: 'Male (Deep) - Charon' },
  { name: 'Zephyr', label: 'Female (Soft) - Zephyr' }
];

interface ContentBlockProps {
  items: any[];
  onGenerateAudio?: (text: string, type?: 'vocab' | 'dialogue' | 'general') => void;
  onRegenerateItem?: (index: number, prompt: string) => void;
  sectionActions?: Record<string, () => Promise<void>>;
  loadingStates?: Record<string, boolean>;
  isCompact?: boolean;
  onHomeworkTypeChange?: (type: 'Written' | 'Oral' | 'Both') => void;
}

const ContentBlock: React.FC<ContentBlockProps> = ({ items, onGenerateAudio, onRegenerateItem, sectionActions, loadingStates, isCompact = true, onHomeworkTypeChange }) => {
  const [regenOpenIndex, setRegenOpenIndex] = useState<number | null>(null);
  const [regenPrompt, setRegenPrompt] = useState("");
  const [localRegenLoading, setLocalRegenLoading] = useState<number | null>(null);

  const handleRegenSubmit = async (idx: number) => {
      if (!regenPrompt.trim() || !onRegenerateItem) return;
      setLocalRegenLoading(idx);
      try {
          await onRegenerateItem(idx, regenPrompt);
          setRegenOpenIndex(null);
          setRegenPrompt("");
      } finally {
          setLocalRegenLoading(null);
      }
  };

  return (
  <div className={isCompact ? "space-y-8" : "space-y-12"}>
     {items.map((item, idx) => {
       const lowerTitle = item.title.toLowerCase();
       // Detect if this is an empty/placeholder section
       const isPlaceholder = !item.content || item.content.length < 50 || item.content.includes("LEAVE CONTENT EMPTY");
       // Check if we have an action for this section
       const actionKey = sectionActions ? Object.keys(sectionActions).find(k => lowerTitle.includes(k)) : null;
       const isLoading = actionKey ? loadingStates?.[actionKey] : false;
       const isSummary = lowerTitle.includes('summary') || lowerTitle.includes('总结');
       const isHomework = lowerTitle.includes('homework') || lowerTitle.includes('作业');

       let themeClass = "bg-white border-slate-100";
       let headerClass = "text-slate-800";
       
       if (lowerTitle.includes("vocab") || lowerTitle.includes("词汇")) {
         themeClass = "bg-blue-50/40 border-blue-100";
         headerClass = "text-blue-700";
       } else if (lowerTitle.includes("dialogue") || lowerTitle.includes("conversation") || lowerTitle.includes("对话")) {
         themeClass = "bg-green-50/40 border-green-100";
         headerClass = "text-green-700";
       } else if (lowerTitle.includes("culture") || lowerTitle.includes("文化")) {
         themeClass = "bg-purple-50/40 border-purple-100";
         headerClass = "text-purple-700";
       } else if (lowerTitle.includes("practice") || lowerTitle.includes("exercise") || lowerTitle.includes("练习") || lowerTitle.includes("interactive")) {
         themeClass = "bg-orange-50/40 border-orange-100";
         headerClass = "text-orange-700";
       } else if (lowerTitle.includes("upgrade") || lowerTitle.includes("地道")) {
          themeClass = "bg-indigo-50/40 border-indigo-100";
          headerClass = "text-indigo-700";
       } else if (lowerTitle.includes("humor") || lowerTitle.includes("幽默")) {
          themeClass = "bg-pink-50/40 border-pink-100";
          headerClass = "text-pink-700";
       } else if (isSummary) {
          themeClass = "bg-teal-50/40 border-teal-100";
          headerClass = "text-teal-700";
       } else if (isHomework) {
          themeClass = "bg-rose-50/40 border-rose-100";
          headerClass = "text-rose-700";
       }

       // Show "Generate" Button if placeholder
       if (isPlaceholder && actionKey) {
          return (
             <div key={idx} className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6 text-center">
                 <h4 className={`font-bold text-sm ${headerClass} mb-3`}>{item.title}</h4>
                 <p className="text-xs text-slate-400 mb-4">Step 2: Generate Details</p>
                 {isHomework && onHomeworkTypeChange && (
                    <div className="mb-3 max-w-xs mx-auto">
                        <select 
                          className="w-full text-xs p-1.5 rounded border border-slate-300"
                          onChange={(e) => onHomeworkTypeChange(e.target.value as any)}
                          defaultValue="Both"
                        >
                          <option value="Both">Written & Oral (书面+口头)</option>
                          <option value="Written">Written Only (仅书面)</option>
                          <option value="Oral">Oral Only (仅口头)</option>
                        </select>
                    </div>
                 )}
                 <button 
                   onClick={sectionActions![actionKey]} 
                   disabled={isLoading}
                   className={`
                      px-4 py-2 rounded-full font-bold shadow-sm transition-all flex items-center gap-2 mx-auto text-sm
                      ${isLoading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white border border-brand-200 text-brand-700 hover:bg-brand-50'}
                   `}
                 >
                   {isLoading ? (
                     <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                     </>
                   ) : (
                     <>
                        <PlusCircle className="w-4 h-4" /> Generate Content
                     </>
                   )}
                 </button>
             </div>
          );
       }

       const isVocab = lowerTitle.includes("vocab") || lowerTitle.includes("词汇");
       const isDialogue = lowerTitle.includes("dialogue") || lowerTitle.includes("对话");
       
       // Show Audio Button for specific sections
       const showAudioBtn = onGenerateAudio && (
            isVocab || 
            isDialogue || 
            lowerTitle.includes("upgrade") || 
            lowerTitle.includes("sentences") || 
            lowerTitle.includes("地道") ||
            lowerTitle.includes("句式") ||
            item.title.includes("Audio Script") // Explicitly for Audio Tool
       );

       // Helper to download summary
       const downloadSummaryWord = () => {
         const html = `<html><body><h2>${item.title}</h2>${item.content}</body></html>`;
         const url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(html);
         const link = document.createElement('a');
         link.href = url;
         link.download = `Summary_${Date.now()}.doc`;
         link.click();
       };

       const contentPadding = isCompact ? "p-6" : "p-8";
       const proseSize = isCompact ? "prose-sm" : "prose-base";

       return (
       <div key={idx} className="space-y-3 relative group">
          <div className="flex items-center gap-2 w-full flex-wrap">
             <span className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-sm border ${headerClass.replace('text', 'bg').replace('700', '100').replace('text', 'border')}`}>
               {idx + 1}
             </span>
             <h4 className={`font-bold text-lg ${headerClass} break-words leading-tight max-w-full`}>
              {item.title}
             </h4>
             
             {/* Action Buttons */}
             <div className="flex items-center gap-1 ml-2">
                 {showAudioBtn && (
                     <button 
                       onClick={() => onGenerateAudio!(item.content, isVocab ? 'vocab' : isDialogue ? 'dialogue' : 'general')}
                       className="p-1.5 bg-brand-50 text-brand-600 rounded-full hover:bg-brand-100 transition-colors"
                       title="Generate Audio"
                     >
                        <Volume2 className="w-3 h-3" />
                     </button>
                 )}
                 
                 {onRegenerateItem && (
                    <button 
                       onClick={() => {
                           setRegenOpenIndex(regenOpenIndex === idx ? null : idx);
                           setRegenPrompt("");
                       }}
                       className="p-1.5 bg-slate-50 text-slate-500 rounded-full hover:bg-slate-100 transition-colors"
                       title="Regenerate Section"
                    >
                        {localRegenLoading === idx ? <Loader2 className="w-3 h-3 animate-spin"/> : <RefreshCw className="w-3 h-3" />}
                    </button>
                 )}
             </div>

             {isSummary && (
                <div className="ml-auto flex gap-2">
                   <button onClick={downloadSummaryWord} className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded hover:bg-slate-50 flex items-center gap-1">
                      <FileText className="w-3 h-3"/> Word
                   </button>
                </div>
             )}
          </div>
          
          {/* Regeneration Input Popover */}
          {regenOpenIndex === idx && (
              <div className="animate-in fade-in slide-in-from-top-1 mb-4 p-4 bg-white border border-brand-200 rounded-xl shadow-lg relative z-10 w-full max-w-lg">
                  <h5 className="text-xs font-bold text-brand-600 mb-2 uppercase tracking-wide">Regenerate Content</h5>
                  <div className="flex gap-2">
                      <input 
                          type="text" 
                          value={regenPrompt}
                          onChange={(e) => setRegenPrompt(e.target.value)}
                          placeholder="How should we change this? (e.g., Make it funnier, add more examples...)"
                          className="flex-1 text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500"
                          onKeyDown={(e) => e.key === 'Enter' && handleRegenSubmit(idx)}
                      />
                      <button 
                          onClick={() => handleRegenSubmit(idx)}
                          disabled={!regenPrompt.trim() || localRegenLoading === idx}
                          className="bg-brand-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50"
                      >
                         {localRegenLoading === idx ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
                      </button>
                  </div>
              </div>
          )}
          
          <div className={`border rounded-xl ${contentPadding} shadow-sm ${themeClass} relative overflow-hidden`} id={isSummary ? "summary-content-block" : undefined}>
             <div className="w-full overflow-x-auto pb-2">
                <div className={`prose ${proseSize} prose-slate max-w-none prose-p:my-2 prose-strong:text-slate-900 prose-headings:text-slate-800 text-slate-700 leading-relaxed prose-li:my-1 prose-table:my-4 min-w-[300px]`}>
                   <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {cleanContent(item.content)}
                   </ReactMarkdown>
                </div>
             </div>
          </div>

          {item.tipsForTeacher && (
             <div className="ml-2 md:ml-6 bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg text-amber-900 shadow-sm">
                <strong className="block text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-2 flex items-center gap-1">
                   <GraduationCap className="w-3 h-3" /> Teacher Guide
                </strong>
                <div className="text-sm leading-relaxed font-medium opacity-90 prose prose-amber max-w-none">
                   <ReactMarkdown>{cleanContent(item.tipsForTeacher)}</ReactMarkdown>
                </div>
             </div>
          )}
       </div>
     )})}
  </div>
  );
};

const SectionRenderer: React.FC<{ 
    content: SectionContent; 
    title: string; 
    sectionName: string; // 'preClass' | 'inClass' | 'postClass'
    mode?: string; // Passed from parent to handle special cases like audio
    onGenerate?: () => void; 
    isGenerating?: boolean; 
    onGenerateAudio?: (text: string, type?: 'vocab' | 'dialogue' | 'general') => void;
    onRegenerateItem?: (index: number, prompt: string) => void;
    sectionActions?: Record<string, () => Promise<void>>;
    loadingStates?: Record<string, boolean>;
    onGenerateGuide: () => void;
    isGeneratingGuide: boolean;
    isCompact?: boolean;
    onHomeworkTypeChange?: (type: 'Written' | 'Oral' | 'Both') => void;
}> = ({ content, title, sectionName, mode, onGenerate, isGenerating, onGenerateAudio, onRegenerateItem, sectionActions, loadingStates, onGenerateGuide, isGeneratingGuide, isCompact = true, onHomeworkTypeChange }) => (
  <div className="print:break-inside-avoid">
     <div className="flex flex-col items-start border-b-2 border-slate-100 pb-4 mb-6">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight break-words max-w-full">{title}</h2>
        {content.duration && <span className="mt-2 bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-xs font-bold border border-slate-200 shadow-sm whitespace-nowrap">{content.duration}</span>}
     </div>
     
     {/* If audio mode, always show content view even if materials might appear empty (fallback) */}
     {(!content.studentMaterials || content.studentMaterials.length === 0) && mode !== 'audio' ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-8 text-center flex-1 flex flex-col justify-center items-center">
            <h3 className="text-lg font-bold text-slate-700 mb-2">Step 2: Generate Section</h3>
            <p className="text-slate-500 mb-6 text-sm">Create high-quality content for this section.</p>
            {onGenerate && (
               <button 
                 onClick={onGenerate}
                 disabled={isGenerating}
                 className="px-5 py-2.5 bg-brand-600 text-white rounded-full font-bold shadow-lg shadow-brand-200 hover:bg-brand-700 hover:shadow-xl transition-all flex items-center gap-2 text-sm"
               >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <SparklesIcon className="w-4 h-4" />}
                  Generate Content
               </button>
            )}
        </div>
     ) : (
        <div>
            <ContentBlock 
               items={content.studentMaterials || []} 
               onGenerateAudio={onGenerateAudio} 
               onRegenerateItem={onRegenerateItem}
               sectionActions={sectionActions} 
               loadingStates={loadingStates}
               isCompact={isCompact} 
               onHomeworkTypeChange={onHomeworkTypeChange}
            />
            {(!content.teacherGuide || content.teacherGuide.length === 0) && mode !== 'audio' && (
                 <div className="mt-8 flex justify-end no-print">
                      <button 
                        onClick={onGenerateGuide} 
                        disabled={isGeneratingGuide}
                        className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg font-semibold hover:bg-amber-100 flex items-center gap-2 border border-amber-100"
                      >
                         {isGeneratingGuide ? <Loader2 className="w-3 h-3 animate-spin"/> : <GraduationCap className="w-3 h-3" />}
                         Expand Teacher Guides
                      </button>
                 </div>
            )}
            {content.teacherGuide && content.teacherGuide.length > 0 && (
                <div className="mt-8 p-6 bg-amber-50 rounded-xl border border-amber-200">
                    <h3 className="text-lg font-bold text-amber-800 mb-4 flex items-center gap-2">
                        <GraduationCap className="w-5 h-5" /> Detailed Teacher Guides
                    </h3>
                    <div className="space-y-6">
                       {content.teacherGuide.map((g, i) => (
                          <div key={i}>
                             <h4 className="font-bold text-amber-900 mb-1 text-sm">{g.title}</h4>
                             <div className="prose prose-sm prose-amber text-amber-800 max-w-none">
                                <ReactMarkdown>{cleanContent(g.content)}</ReactMarkdown>
                             </div>
                          </div>
                       ))}
                    </div>
                </div>
            )}
        </div>
     )}
  </div>
);

const SparklesIcon = ({className}: {className?: string}) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3C12 3 14 9 19 12C14 15 12 21 12 21C12 21 10 15 5 12C10 9 12 3 12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LessonView: React.FC<Props> = ({ data, onBack, onRegenerate, onUpdateLesson, onSectionUpdate, isRegenerating }) => {
  const [currentTab, setCurrentTab] = useState<'preClass' | 'inClass' | 'postClass'>('inClass');
  const [isGeneratingPre, setIsGeneratingPre] = useState(false);
  const [isGeneratingPost, setIsGeneratingPost] = useState(false);
  
  // Section loading states
  const [loadingSections, setLoadingSections] = useState<Record<string, boolean>>({});

  // Audio State
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [speakerMap, setSpeakerMap] = useState<Record<string, string>>({});
  const [detectedSpeakers, setDetectedSpeakers] = useState<string[]>([]);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);

  // Practice Regeneration States
  const [practiceRegenPrompt, setPracticeRegenPrompt] = useState("");
  const [practiceRegenIndex, setPracticeRegenIndex] = useState<number | null>(null);

  // Homework options
  const [homeworkType, setHomeworkType] = useState<'Written' | 'Oral' | 'Both'>('Both');
  
  // Ref for content capture
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Basic speaker detection from Dialogue content or Audio Script
    let contentToAnalyze = "";
    
    // Priority 1: Audio Script (for Audio Tool)
    const audioScript = data.inClass.studentMaterials.find(m => m.title.includes("Audio Script"));
    
    // Priority 2: Dialogue (for Full Lesson)
    const dialogue = data.inClass.studentMaterials.find(m => m.title.toLowerCase().includes('dialogue'));

    if (data.meta.mode === 'audio' && audioScript) {
        contentToAnalyze = audioScript.content;
    } else if (dialogue) {
        contentToAnalyze = dialogue.content;
    }

    if (contentToAnalyze) {
       const lines = contentToAnalyze.split('\n');
       const speakers = new Set<string>();
       lines.forEach(line => {
          // Regex matching: Start of line, Name (letters, numbers, spaces, dots), Colon
          // Added \s and \. to support names like "Mr. Smith" or "Jane Doe"
          const match = line.match(/^([A-Za-z0-9\s\.]+):/);
          if (match) {
             const name = match[1].trim();
             // Sanity check: name shouldn't be too long (avoid capturing sentences)
             if (name.length > 0 && name.length < 25) {
                speakers.add(name);
             }
          }
       });
       setDetectedSpeakers(Array.from(speakers));
    } else {
       setDetectedSpeakers([]);
    }
  }, [data]);

  const handleGenerateSection = async (sectionName: 'preClass' | 'postClass') => {
    const isPre = sectionName === 'preClass';
    if (isPre) setIsGeneratingPre(true);
    else setIsGeneratingPost(true);

    try {
        const result = isPre ? await generatePreClass(data) : await generatePostClass(data);
        onSectionUpdate(sectionName, result);
    } catch (e) {
        alert("Failed to generate section.");
    } finally {
        if (isPre) setIsGeneratingPre(false);
        else setIsGeneratingPost(false);
    }
  };

  const handleGenerateModuleContent = async (key: string, generatorFn: (data: LessonPlanResponse, ...args: any[]) => Promise<any>) => {
      setLoadingSections(prev => ({...prev, [key]: true}));
      try {
          // Pass specific arguments if needed (e.g., homeworkType)
          const newContent = key === 'homework' 
             ? await generatorFn(data, homeworkType)
             : await generatorFn(data);

          const updatedInClass = { ...data.inClass };
          // Find the item and update it
          updatedInClass.studentMaterials = updatedInClass.studentMaterials.map(item => {
              if (item.title.toLowerCase().includes(key)) {
                  return { ...item, ...newContent };
              }
              return item;
          });
          onSectionUpdate('inClass', updatedInClass);
      } catch (e) {
          alert("Failed to generate content.");
      } finally {
          setLoadingSections(prev => ({...prev, [key]: false}));
      }
  };

  const handleRegenerateItem = async (sectionName: 'preClass' | 'inClass' | 'postClass' | number, itemIndex: number, prompt: string) => {
      try {
          // Determine target content and update method
          let currentItem;
          let updateCallback;
          
          if (typeof sectionName === 'number') {
              // It's a module index
              if (!data.modules) return;
              currentItem = data.modules[sectionName].content[itemIndex];
          } else {
              currentItem = data[sectionName].studentMaterials[itemIndex];
          }
          
          const newContent = await regenerateSectionContent(currentItem, prompt);

          if (typeof sectionName === 'number') {
               // Update module
               const newModules = [...(data.modules || [])];
               const targetModule = { ...newModules[sectionName] };
               targetModule.content = [...targetModule.content];
               targetModule.content[itemIndex] = newContent;
               newModules[sectionName] = targetModule;
               onUpdateLesson({ ...data, modules: newModules });
          } else {
               // Update regular section
               const section = { ...data[sectionName] };
               section.studentMaterials = [...section.studentMaterials];
               section.studentMaterials[itemIndex] = newContent;
               onSectionUpdate(sectionName, section);
          }

      } catch (e) {
          alert("Regeneration failed. Please try again.");
          console.error(e);
      }
  };

  const handleRegeneratePractice = async (moduleIndex: number) => {
      if (!practiceRegenPrompt.trim() || !data.modules) return;
      
      const key = `practice_regen_${moduleIndex}`;
      setLoadingSections(prev => ({...prev, [key]: true}));

      try {
          const mod = data.modules[moduleIndex];
          const newPractice = await regenerateModulePractice(mod.title, practiceRegenPrompt);
          
          const newModules = [...data.modules];
          newModules[moduleIndex] = {
              ...mod,
              practiceOptions: newPractice
          };
          
          onUpdateLesson({ ...data, modules: newModules });
          setPracticeRegenIndex(null);
          setPracticeRegenPrompt("");
      } catch(e) {
          alert("Failed to regenerate practice.");
      } finally {
          setLoadingSections(prev => ({...prev, [key]: false}));
      }
  };

  const handleGenerateGuide = async (sectionName: 'preClass' | 'inClass' | 'postClass') => {
      setLoadingSections(prev => ({...prev, [`guide_${sectionName}`]: true}));
      try {
          const guides = await generateSectionGuide(sectionName, data.meta.title, data[sectionName].studentMaterials);
          const updatedSection = { ...data[sectionName], teacherGuide: guides };
          onSectionUpdate(sectionName, updatedSection);
      } catch(e) {
          alert("Failed to generate guide.");
      } finally {
          setLoadingSections(prev => ({...prev, [`guide_${sectionName}`]: false}));
      }
  };

  const handleGenerateModuleGuide = async (index: number) => {
      if (!data.modules) return;
      const mod = data.modules[index];
      const key = `guide_module_${index}`;
      
      setLoadingSections(prev => ({...prev, [key]: true}));
      try {
          const guides = await generateSectionGuide(mod.title, mod.title, mod.content);
          
          const newModules = [...data.modules];
          newModules[index] = {
              ...mod,
              teacherGuide: guides
          };
          
          onUpdateLesson({
              ...data,
              modules: newModules
          });
      } catch (e) {
          console.error(e);
          alert("Failed to generate teacher guides.");
      } finally {
          setLoadingSections(prev => ({...prev, [key]: false}));
      }
  };

  const sectionActions = {
      'grammar': () => handleGenerateModuleContent('grammar', generateGrammar),
      'derived': () => handleGenerateModuleContent('derived', generateDerivedPractice),
      'homework': () => handleGenerateModuleContent('homework', generateHomework),
      'summary': () => handleGenerateModuleContent('summary', generateSummary),
  };

  const handleAudio = async (text: string, type: 'vocab' | 'dialogue' | 'general' = 'general') => {
    setIsGeneratingAudio(true);
    let textToProcess = text;

    if (type === 'vocab') {
        const lines = text.split('\n');
        const processedLines: string[] = [];
        
        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('|') && !trimmed.includes('---')) {
                 const cols = trimmed.split('|').map(c => c.trim()).filter(c => c);
                 if (cols.length >= 3) {
                     const word = cols[0];
                     const meaning = cols[2];
                     const example = cols.length > 3 ? cols[3] : '';
                     if (!word.toLowerCase().includes('word') && !word.includes('词汇')) {
                         processedLines.push(`${word}. ${meaning}. ${example}`);
                     }
                 }
            }
        });
        if (processedLines.length > 0) {
            textToProcess = processedLines.join('\n');
        }
    } else if (type === 'dialogue') {
        const lines = text.split('\n');
        const englishLines = lines.filter(line => {
            return !/[\u4e00-\u9fa5]/.test(line);
        });
        textToProcess = englishLines.join('\n');
    }

    try {
        // MiniMax 返回的是 MP3 Base64，需要调整 MIME 类型
        const audioBase64 = await generateSpeech(cleanContent(textToProcess), { speakerMap });
        
        if (!audioBase64 || audioBase64.length < 100) {
            throw new Error('从 TTS 服务接收到的音频数据无效或为空');
        }

        // 清理 Base64 字符串（移除前缀和空白字符）
        let cleanBase64 = audioBase64;
        
        // 移除 data URL 前缀（如果有）
        if (cleanBase64.startsWith('data:')) {
          cleanBase64 = cleanBase64.split(',')[1];
        }
        
        // 移除空白字符（换行符、空格）
        cleanBase64 = cleanBase64.replace(/\s/g, '');
        
        // 检测 Base64 数据格式（MP3 或 WAV）
        // 使用更稳健的方式转换 Base64
        const binaryString = atob(cleanBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const blob = new Blob([bytes], { 
          type: 'audio/mpeg' // MP3 MIME 类型
        });
        
        if (blob.size === 0) {
             throw new Error('生成的音频文件大小为 0');
        }

        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setIsPlaying(true);
    } catch(e) {
        console.error("Audio generation failed:", e);
        alert(`音频生成失败: ${e instanceof Error ? e.message : '未知错误'}`);
    } finally {
        setIsGeneratingAudio(false);
    }
  };

  const downloadAudio = () => {
     if (!audioUrl) return;
     const a = document.createElement('a');
     a.href = audioUrl;
     a.download = `Audio_${Date.now()}.mp3`; // MiniMax 返回 MP3 格式
     a.click();
  };

  const exportToPDF = async () => {
    // Hide buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(b => b.style.display = 'none');
    
    // Temporarily show all sections for export
    if (contentRef.current) contentRef.current.classList.add('show-all-sections');

    // Use html2canvas + jsPDF
    const element = document.getElementById('lesson-content-root');
    if (!element) return;

    try {
       const canvas = await html2canvas(element, { 
           scale: 2,
           useCORS: true 
       });
       const imgData = canvas.toDataURL('image/png');
       
       const pdf = new jsPDF('p', 'mm', 'a4');
       const pdfWidth = pdf.internal.pageSize.getWidth();
       const pdfHeight = pdf.internal.pageSize.getHeight();
       const imgWidth = canvas.width;
       const imgHeight = canvas.height;
       const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
       const imgX = (pdfWidth - imgWidth * ratio) / 2;
       const imgY = 10; // Top padding

       // If long content, we might need multiple pages, but basic implementation fits on one scaled or use simple single page logic
       const imgHeightPdf = (imgHeight * pdfWidth) / imgWidth;
       let heightLeft = imgHeightPdf;
       let position = 0;

       pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightPdf);
       heightLeft -= pdfHeight;

       while (heightLeft >= 0) {
         position = heightLeft - imgHeightPdf;
         pdf.addPage();
         pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightPdf);
         heightLeft -= pdfHeight;
       }
       
       pdf.save(`Lesson_${data.meta.title}.pdf`);
    } catch(e) {
       alert("PDF Export failed.");
    } finally {
       buttons.forEach(b => b.style.display = '');
       // Restore hidden sections
       if (contentRef.current) contentRef.current.classList.remove('show-all-sections');
    }
  };

  const exportToWord = () => {
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Lesson Plan</title><style>body { font-family: 'Times New Roman', serif; } h1 { font-size: 24pt; font-weight: bold; } h2 { font-size: 18pt; font-weight: bold; color: #333; } h3 { font-size: 14pt; font-weight: bold; } table { border-collapse: collapse; width: 100%; margin-bottom: 20px; } td, th { border: 1px solid #999; padding: 8px; } th { background-color: #eee; } .section-title { color: #0044cc; }</style></head><body>";
    const footer = "</body></html>";
    
    // WORKAROUND: Temporarily unhide for Word export logic string generation
    const root = document.getElementById('lesson-content-root');
    if (root) root.classList.add('show-all-sections');
    
    const sourceHTML = header + root?.innerHTML + footer;
    
    if (root) root.classList.remove('show-all-sections');
    
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `Lesson_${data.meta.title.replace(/\s+/g, '_')}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  const exportToImage = async (fullPage: boolean) => {
    const element = document.getElementById('lesson-content-root');
    if (!element) return;
    
    setIsExportingImage(true);
    setShowImageOptions(false); // hide dropdown

    // Show all sections if full page
    if (fullPage && contentRef.current) contentRef.current.classList.add('show-all-sections');

    // Wait for DOM updates
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const canvas = await html2canvas(element, {
         scale: 2,
         useCORS: true,
         logging: false,
         backgroundColor: '#ffffff'
      });
      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement('a');
      link.download = `Lesson_${data.meta.title.replace(/\s+/g, '_')}.png`;
      link.href = image;
      link.click();
    } catch (err) {
      console.error(err);
      alert("Image export failed. Try exporting as PDF.");
    } finally {
      setIsExportingImage(false);
      if (fullPage && contentRef.current) contentRef.current.classList.remove('show-all-sections');
    }
  };

  useEffect(() => {
    if (audioUrl && audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
    }
  }, [audioUrl]);

  return (
    <div className="max-w-[95%] mx-auto animate-in fade-in slide-in-from-bottom-4 pb-20">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 no-print" data-html2canvas-ignore="true">
        <button 
          onClick={onBack}
          type="button"
          className="flex items-center gap-2 text-slate-600 hover:text-brand-600 font-semibold transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Generator
        </button>

        <div className="flex items-center gap-3">
           <button 
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className="p-2 bg-slate-800 text-white border border-slate-700 rounded-lg hover:bg-slate-900"
              title="Voice Settings"
              type="button"
           >
              <Settings2 className="w-5 h-5" />
           </button>

           <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
              <button 
                onClick={exportToPDF}
                type="button"
                className="p-2 hover:bg-slate-100 rounded text-slate-600 hover:text-brand-600" 
                title="Save as PDF"
              >
                <Printer className="w-5 h-5" />
              </button>
              <button 
                onClick={exportToWord}
                type="button"
                className="p-2 hover:bg-slate-100 rounded text-slate-600 hover:text-blue-600" 
                title="Save as Word"
              >
                <FileText className="w-5 h-5" />
              </button>
              <div className="relative">
                  <button 
                    onClick={() => !isExportingImage && setShowImageOptions(!showImageOptions)}
                    className="p-2 hover:bg-slate-100 rounded text-slate-600 hover:text-purple-600 disabled:opacity-50" 
                    title="Save as Image"
                    type="button"
                    disabled={isExportingImage}
                  >
                    {isExportingImage ? <Loader2 className="w-5 h-5 animate-spin"/> : <ImageIcon className="w-5 h-5" />}
                  </button>
                  {showImageOptions && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-50 py-1">
                       <button onClick={() => exportToImage(false)} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-slate-700">Capture Visible Area</button>
                       <button onClick={() => exportToImage(true)} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-slate-700">Capture Full Lesson</button>
                    </div>
                  )}
              </div>
           </div>
        </div>
      </div>

      {showVoiceSettings && (
          <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 shadow-lg mb-8 no-print">
             <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-brand-400" /> Voice Settings
             </h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {detectedSpeakers.length > 0 ? detectedSpeakers.map(speaker => (
                   <div key={speaker} className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400">{speaker}</label>
                      <select 
                         className="w-full p-2 border border-slate-700 bg-slate-800 text-white rounded-md text-sm"
                         value={speakerMap[speaker] || ''}
                         onChange={(e) => setSpeakerMap(prev => ({...prev, [speaker]: e.target.value}))}
                      >
                         <option value="">Auto (Default)</option>
                         {AVAILABLE_VOICES.map(v => <option key={v.name} value={v.name}>{v.label}</option>)}
                      </select>
                   </div>
                )) : (
                   <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400">Default Voice</label>
                      <select 
                         className="w-full p-2 border border-slate-700 bg-slate-800 text-white rounded-md text-sm"
                         value={speakerMap['default'] || 'Kore'}
                         onChange={(e) => setSpeakerMap(prev => ({...prev, 'default': e.target.value}))}
                      >
                         {AVAILABLE_VOICES.map(v => <option key={v.name} value={v.name}>{v.label}</option>)}
                      </select>
                   </div>
                )}
             </div>
          </div>
      )}

      {/* Main Content */}
      <div id="lesson-content-root" ref={contentRef} className="bg-white rounded-2xl shadow-xl min-h-[80vh] p-8 md:p-12 print:shadow-none print:p-0">
         {/* Title Page */}
         <div className="text-center border-b-2 border-brand-100 pb-8 mb-8 print:break-after-page">
            <div className="inline-block bg-brand-50 text-brand-700 px-4 py-1.5 rounded-full text-sm font-bold mb-4 border border-brand-100 uppercase tracking-wider">
               {data.meta.mode === 'module' ? 'Specialized Module' : data.meta.mode === 'audio' ? 'Audio Tool' : 'Comprehensive Lesson Plan'}
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight leading-tight break-words max-w-4xl mx-auto">
               {data.meta.title}
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-6 font-light">
               Designed for <span className="font-semibold text-slate-800">{data.meta.targetAudience}</span>
            </p>
            <div className="flex flex-wrap justify-center gap-3">
               {data.meta.learningObjectives.map((obj, i) => (
                  <span key={i} className="bg-slate-50 text-slate-600 px-3 py-1 rounded text-sm border border-slate-200">
                     {obj}
                  </span>
               ))}
            </div>
         </div>

         {/* Audio Player Floating */}
         {audioUrl && (
            <div className="fixed bottom-8 right-8 bg-white p-4 rounded-full shadow-2xl border border-slate-200 flex items-center gap-4 z-50 no-print animate-in slide-in-from-bottom-2" data-html2canvas-ignore="true">
               <button onClick={() => {
                  if (audioRef.current?.paused) { audioRef.current.play(); setIsPlaying(true); }
                  else { audioRef.current?.pause(); setIsPlaying(false); }
               }}>
                  {isPlaying ? <Pause className="w-6 h-6 text-brand-600" /> : <Play className="w-6 h-6 text-brand-600" />}
               </button>
               <audio ref={audioRef} onEnded={() => setIsPlaying(false)} className="hidden" />
               <div className="text-sm font-semibold text-slate-700 pr-2">Playing Audio...</div>
               <button onClick={downloadAudio} className="text-slate-500 hover:text-brand-600" title="Download Audio">
                  <Download className="w-5 h-5"/>
               </button>
               <button onClick={() => setAudioUrl(null)} className="text-slate-400 hover:text-slate-600"><Settings2 className="w-4 h-4"/></button>
            </div>
         )}
         {isGeneratingAudio && (
            <div className="fixed bottom-8 right-8 bg-brand-600 text-white px-6 py-3 rounded-full shadow-xl z-50 flex items-center gap-3 no-print">
               <Loader2 className="w-5 h-5 animate-spin" /> Generating Audio...
            </div>
         )}

         {/* TAB NAVIGATION (Only for Full Mode) */}
         {data.meta.mode !== 'module' && data.meta.mode !== 'audio' && (
            <div className="flex justify-center border-b border-slate-200 mb-8 no-print">
                <nav className="flex -mb-px space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setCurrentTab('preClass')}
                        className={`
                        whitespace-nowrap py-4 px-1 border-b-2 font-bold text-base transition-colors
                        ${currentTab === 'preClass' 
                            ? 'border-brand-600 text-brand-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                        `}
                    >
                        1. Pre-Class (预习)
                    </button>
                    <button
                        onClick={() => setCurrentTab('inClass')}
                        className={`
                        whitespace-nowrap py-4 px-1 border-b-2 font-bold text-base transition-colors
                        ${currentTab === 'inClass' 
                            ? 'border-brand-600 text-brand-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                        `}
                    >
                        2. In-Class (正课)
                    </button>
                    <button
                        onClick={() => setCurrentTab('postClass')}
                        className={`
                        whitespace-nowrap py-4 px-1 border-b-2 font-bold text-base transition-colors
                        ${currentTab === 'postClass' 
                            ? 'border-brand-600 text-brand-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                        `}
                    >
                        3. Post-Class (复习)
                    </button>
                </nav>
            </div>
         )}

         {/* Sections Container - Single Page View */}
         <div className="max-w-5xl mx-auto">
            {/* Pre-Class */}
            {data.meta.mode !== 'module' && data.meta.mode !== 'audio' && (
                <div className={`${currentTab === 'preClass' ? 'block animate-in fade-in slide-in-from-left-4' : 'hidden'} print:block [&.show-all-sections]:block print:break-after-page`}>
                    <SectionRenderer 
                        title="1. Pre-Class (预习)" 
                        content={data.preClass} 
                        sectionName="preClass"
                        onGenerate={() => handleGenerateSection('preClass')}
                        isGenerating={isGeneratingPre}
                        onGenerateAudio={handleAudio}
                        onRegenerateItem={(idx, prompt) => handleRegenerateItem('preClass', idx, prompt)}
                        onGenerateGuide={() => handleGenerateGuide('preClass')}
                        isGeneratingGuide={loadingSections['guide_preClass']}
                        isCompact={true} 
                    />
                </div>
            )}

            {/* In-Class (or Module Content) */}
            <div className={`${(currentTab === 'inClass' || data.meta.mode === 'module' || data.meta.mode === 'audio') ? 'block animate-in fade-in zoom-in-95' : 'hidden'} print:block [&.show-all-sections]:block print:break-after-page`}>
                {data.meta.mode === 'module' && data.modules && data.modules.length > 0 ? (
                    <div>
                       {data.modules.map((mod, index) => (
                           <div key={index} className="mb-12 border-b-2 border-slate-100 pb-8 last:border-0 print:break-inside-avoid">
                               <div className="flex items-center gap-3 mb-6">
                                   <div className="p-2 bg-brand-100 text-brand-700 rounded-lg shadow-sm">
                                       <Layers className="w-6 h-6" />
                                   </div>
                                   <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{mod.title}</h2>
                               </div>
                               <ContentBlock 
                                   items={mod.content}
                                   onGenerateAudio={handleAudio}
                                   onRegenerateItem={(itemIdx, prompt) => handleRegenerateItem(index, itemIdx, prompt)}
                                   isCompact={true}
                               />
                               
                               {/* Practice Options Section */}
                               {mod.practiceOptions && mod.practiceOptions.length > 0 && (
                                   <div className="mt-8 bg-orange-50 border border-orange-200 rounded-xl p-6 relative group">
                                       <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold text-orange-900 flex items-center gap-2">
                                                <Gamepad2 className="w-5 h-5 text-orange-600" /> 
                                                Adult Interactive Practice (互动练习)
                                            </h3>
                                            
                                            {/* Practice Regeneration Trigger */}
                                            <button 
                                                onClick={() => {
                                                    setPracticeRegenIndex(practiceRegenIndex === index ? null : index);
                                                    setPracticeRegenPrompt("");
                                                }}
                                                className="text-xs flex items-center gap-1 text-orange-700 bg-white border border-orange-200 px-2 py-1 rounded hover:bg-orange-100"
                                            >
                                                <RefreshCw className="w-3 h-3" /> Regenerate
                                            </button>
                                       </div>

                                       {/* Practice Regeneration Popover */}
                                       {practiceRegenIndex === index && (
                                            <div className="mb-4 p-4 bg-white border border-orange-200 rounded-xl shadow-lg relative z-10 w-full animate-in fade-in slide-in-from-top-1">
                                                <h5 className="text-xs font-bold text-orange-600 mb-2 uppercase tracking-wide">Generate New Practice Ideas</h5>
                                                <div className="flex gap-2">
                                                    <input 
                                                        type="text" 
                                                        value={practiceRegenPrompt}
                                                        onChange={(e) => setPracticeRegenPrompt(e.target.value)}
                                                        placeholder="E.g., Make it a roleplay about shopping; Focus on debates..."
                                                        className="flex-1 text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                                                        onKeyDown={(e) => e.key === 'Enter' && handleRegeneratePractice(index)}
                                                    />
                                                    <button 
                                                        onClick={() => handleRegeneratePractice(index)}
                                                        disabled={!practiceRegenPrompt.trim() || loadingSections[`practice_regen_${index}`]}
                                                        className="bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700 disabled:opacity-50"
                                                    >
                                                       {loadingSections[`practice_regen_${index}`] ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                           {mod.practiceOptions.map((opt, i) => (
                                               <div key={i} className="bg-white p-4 rounded-lg border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
                                                   <h4 className="font-bold text-orange-800 mb-2 text-sm">{i+1}. {opt.title}</h4>
                                                   <div className="text-sm text-slate-600 prose prose-sm prose-orange max-w-none">
                                                       <ReactMarkdown>{opt.content}</ReactMarkdown>
                                                   </div>
                                               </div>
                                           ))}
                                       </div>
                                   </div>
                               )}
                               
                               {/* Module Teacher Guide Expansion */}
                               {(!mod.teacherGuide || mod.teacherGuide.length === 0) && (
                                   <div className="mt-8 flex justify-end no-print">
                                        <button 
                                          onClick={() => handleGenerateModuleGuide(index)} 
                                          disabled={loadingSections[`guide_module_${index}`]}
                                          className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg font-semibold hover:bg-amber-100 flex items-center gap-2 border border-amber-100"
                                        >
                                           {loadingSections[`guide_module_${index}`] ? <Loader2 className="w-3 h-3 animate-spin"/> : <GraduationCap className="w-3 h-3" />}
                                           Expand Teacher Guides
                                        </button>
                                   </div>
                               )}
                               {mod.teacherGuide && mod.teacherGuide.length > 0 && (
                                   <div className="mt-8 p-6 bg-amber-50 rounded-xl border border-amber-200 animate-in fade-in">
                                       <h3 className="text-lg font-bold text-amber-800 mb-4 flex items-center gap-2">
                                           <GraduationCap className="w-5 h-5" /> Detailed Teacher Guides
                                       </h3>
                                       <div className="space-y-6">
                                          {mod.teacherGuide.map((g, i) => (
                                             <div key={i}>
                                                <h4 className="font-bold text-amber-900 mb-1 text-sm">{g.title}</h4>
                                                <div className="prose prose-sm prose-amber text-amber-800 max-w-none">
                                                   <ReactMarkdown>{cleanContent(g.content)}</ReactMarkdown>
                                                </div>
                                             </div>
                                          ))}
                                       </div>
                                   </div>
                               )}
                           </div>
                       ))}
                    </div>
                ) : (
                    <SectionRenderer 
                        title={data.meta.mode === 'module' ? "2. Specialized Module (专项模块)" : data.meta.mode === 'audio' ? "Audio Content" : "2. In-Class (正课)"}
                        content={data.inClass} 
                        sectionName="inClass"
                        mode={data.meta.mode} // Pass mode to handle audio case
                        onGenerateAudio={handleAudio}
                        onRegenerateItem={(idx, prompt) => handleRegenerateItem('inClass', idx, prompt)}
                        sectionActions={sectionActions}
                        loadingStates={loadingSections}
                        onGenerateGuide={() => handleGenerateGuide('inClass')}
                        isGeneratingGuide={loadingSections['guide_inClass']}
                        isCompact={true}
                        onHomeworkTypeChange={setHomeworkType}
                    />
                )}
            </div>

            {/* Post-Class */}
            {data.meta.mode !== 'module' && data.meta.mode !== 'audio' && (
                <div className={`${currentTab === 'postClass' ? 'block animate-in fade-in slide-in-from-right-4' : 'hidden'} print:block [&.show-all-sections]:block`}>
                    <SectionRenderer 
                        title="3. Post-Class (复习)" 
                        content={data.postClass} 
                        sectionName="postClass"
                        onGenerate={() => handleGenerateSection('postClass')}
                        isGenerating={isGeneratingPost}
                        onGenerateAudio={handleAudio}
                        onRegenerateItem={(idx, prompt) => handleRegenerateItem('postClass', idx, prompt)}
                        onGenerateGuide={() => handleGenerateGuide('postClass')}
                        isGeneratingGuide={loadingSections['guide_postClass']}
                        isCompact={true}
                    />
                </div>
            )}
         </div>
      </div>
      
      {/* Watermark for Print */}
      <div className="watermark no-print-display" aria-hidden="true"></div>
    </div>
  );
};

export default LessonView;
