
import React, { useState, useRef, useEffect } from 'react';
import { GeneratorFormData, ClassMode, ClassType, Duration, StudentProfile, SyllabusInput, ModuleType, AGE_RANGES, CEFR_LEVELS, INDUSTRIES, JOBS, GOALS, INTERESTS, GeneratorMode, INTERACTIVE_MODES, HUMOR_TYPES, HOMEWORK_TYPES } from '../types';
import { Upload, BookOpen, Clock, User, Loader2, FileText, X, Layout, Layers, ChevronDown, Mic, Plus, Check, Wand2, Compass, CheckSquare, Sparkles, Trash2, Users } from 'lucide-react';
import { extractRawText } from 'mammoth';
import { polishContent } from '../services/geminiService';

interface Props {
  initialValues?: GeneratorFormData | null;
  onSubmit: (data: GeneratorFormData) => void;
  isLoading: boolean;
}

const SelectWithOtherInput: React.FC<{
  label: string;
  value: string | undefined;
  options: string[];
  onChange: (val: string) => void;
  customValue: string;
  setCustomValue: (val: string) => void;
  icon?: React.ReactNode;
}> = ({ label, value, options, onChange, customValue, setCustomValue, icon }) => (
  <div className="space-y-2">
    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
      {icon} {label}
    </label>
    <div className="relative">
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-brand-500 appearance-none"
      >
        <option value="" disabled>Select {label} (请选择)...</option>
        {options.map(opt => <option key={opt} value={opt} className="text-slate-900 bg-white">{opt}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
    {value && value.includes('Other') && (
      <input
        type="text"
        value={customValue}
        onChange={(e) => setCustomValue(e.target.value)}
        placeholder={`Enter custom ${label.toLowerCase()} (请输入)...`}
        className="w-full p-2.5 border border-slate-700 rounded-lg bg-slate-800 text-white mt-2 focus:ring-2 focus:ring-brand-500 placeholder:text-slate-400"
      />
    )}
  </div>
);

const MultiSelectInput: React.FC<{
  label: string;
  currentSelection: string[] | undefined;
  options: string[];
  updateSelection: (newSel: string[]) => void;
}> = ({ label, currentSelection, options, updateSelection }) => {
  const safeSelection = currentSelection || [];
  const safeOptions = options || [];
  const [newItem, setNewItem] = useState('');

  const toggleItem = (item: string) => {
    if (safeSelection.includes(item)) {
      updateSelection(safeSelection.filter(i => i !== item));
    } else {
      updateSelection([...safeSelection, item]);
    }
  };

  const addCustom = () => {
    if (newItem.trim() && !safeSelection.includes(newItem)) {
      updateSelection([...safeSelection, newItem.trim()]);
      setNewItem('');
    }
  };

  return (
    <div className="space-y-2 md:col-span-2">
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {safeOptions.slice(0, 8).map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => toggleItem(opt)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                safeSelection.includes(opt)
                ? 'bg-brand-50 text-white border-brand-500'
                : 'bg-white text-slate-600 border-slate-300 hover:border-brand-400'
              }`}
            >
              {opt.split(' (')[0]} {safeSelection.includes(opt) && <Check className="inline w-3 h-3 ml-1"/>}
            </button>
        ))}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {safeSelection.filter(s => !safeOptions.slice(0, 8).includes(s)).map(s => (
            <span key={s} className="px-3 py-1.5 rounded-full text-xs font-medium bg-brand-500 text-white border border-brand-500 flex items-center gap-1">
              {s} <button type="button" onClick={() => toggleItem(s)}><X className="w-3 h-3"/></button>
            </span>
        ))}
      </div>

      <div className="flex gap-2 mt-2">
        <input 
          type="text" 
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustom())}
          placeholder="Add custom... (添加自定义)"
          className="flex-1 p-2 text-sm border border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 bg-slate-800 text-white placeholder:text-slate-400"
        />
        <button 
            type="button" 
            onClick={addCustom}
            className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
        >
            <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const InputForm: React.FC<Props> = ({ initialValues, onSubmit, isLoading }) => {
  const [mode, setMode] = useState<GeneratorMode>('full');
  const [syllabusText, setSyllabusText] = useState('');
  const [attachedFile, setAttachedFile] = useState<SyllabusInput['file'] | undefined>(undefined);
  const [isPolishing, setIsPolishing] = useState(false);
  
  const [classMode, setClassMode] = useState<ClassMode>(ClassMode.OFFLINE);
  const [classType, setClassType] = useState<ClassType>(ClassType.ONE_ON_ONE);
  const [duration, setDuration] = useState<Duration>(Duration.MIN_60);
  
  // Directions
  const [courseDirection, setCourseDirection] = useState('');
  const [moduleDirection, setModuleDirection] = useState('');

  // Multi-select for modules
  const [selectedModules, setSelectedModules] = useState<ModuleType[]>([]);
  const [interactiveModes, setInteractiveModes] = useState<string[]>([]);
  const [humorTypes, setHumorTypes] = useState<string[]>([]);
  const [homeworkTypes, setHomeworkTypes] = useState<string[]>([]);
  
  // New: Practice Checkbox
  const [includeRelatedPractice, setIncludeRelatedPractice] = useState(false);
  
  // Profiles State (Array)
  const [profiles, setProfiles] = useState<StudentProfile[]>([{
    age: '',
    industry: '',
    job: '',
    goal: [], 
    interests: [], 
    englishLevel: '',
    customIndustry: '',
    customJob: ''
  }]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialValues) {
      setSyllabusText(initialValues.syllabus.text);
      setAttachedFile(initialValues.syllabus.file);
      setClassMode(initialValues.classMode);
      setClassType(initialValues.classType);
      setDuration(initialValues.duration);
      
      // Handle legacy or array profiles
      if (initialValues.studentProfiles && initialValues.studentProfiles.length > 0) {
          setProfiles(initialValues.studentProfiles);
      } else if ((initialValues as any).studentProfile) {
          // Backward compat
          setProfiles([(initialValues as any).studentProfile]);
      }

      setMode(initialValues.mode);
      setCourseDirection(initialValues.additionalPrompt || '');
      setModuleDirection(initialValues.generationDirection || '');
      setIncludeRelatedPractice(initialValues.includeRelatedPractice || false);
      
      if (initialValues.moduleTypes && initialValues.moduleTypes.length > 0) {
        setSelectedModules(initialValues.moduleTypes);
      } else {
        setSelectedModules([]);
      }
      if (initialValues.interactiveModes) setInteractiveModes(initialValues.interactiveModes);
      if (initialValues.humorTypes) setHumorTypes(initialValues.humorTypes);
      if (initialValues.homeworkTypes) setHomeworkTypes(initialValues.homeworkTypes);
    }
  }, [initialValues]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    e.target.value = '';

    if (fileName.endsWith('.docx')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await extractRawText({ arrayBuffer });
        setSyllabusText(prev => prev + (prev ? '\n\n' : '') + `[Imported from ${file.name}]:\n` + result.value);
      } catch (err) {
        console.error("Failed to parse docx", err);
        alert("Could not parse Word document. (无法解析 Word 文档)");
      }
      return;
    }

    if (fileType === 'application/pdf' || fileType.startsWith('image/') || fileType.startsWith('audio/')) {
       const reader = new FileReader();
       reader.onloadend = () => {
         const base64String = reader.result as string;
         const base64Data = base64String.split(',')[1];
         setAttachedFile({
            mimeType: fileType,
            data: base64Data,
            name: file.name
         });
       };
       reader.readAsDataURL(file);
    } else {
       alert("Unsupported file type. Please upload PDF, Word, Image or Audio. (不支持的文件类型)");
    }
  };

  const removeFile = () => setAttachedFile(undefined);

  const toggleModule = (type: ModuleType) => {
    setSelectedModules(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handlePolish = async () => {
    if (!syllabusText.trim()) return;
    setIsPolishing(true);
    try {
        const polished = await polishContent(syllabusText);
        setSyllabusText(polished);
    } catch(e) {
        alert("Failed to polish content (润色失败)");
    } finally {
        setIsPolishing(false);
    }
  };

  // Profile Helpers
  const addProfile = () => {
      setProfiles(prev => [...prev, {
        age: '', industry: '', job: '', goal: [], interests: [], englishLevel: '', customIndustry: '', customJob: ''
      }]);
  };

  const removeProfile = (index: number) => {
      setProfiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateProfile = (index: number, field: keyof StudentProfile, value: any) => {
      setProfiles(prev => {
          const newProfiles = [...prev];
          newProfiles[index] = { ...newProfiles[index], [field]: value };
          return newProfiles;
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clean up profiles
    const cleanProfiles = profiles.map(p => {
        const cleanP = { ...p };
        // Ensure custom fields are handled if "Other" is selected, though we usually just read custom* fields in processing
        return cleanP;
    });

    // Use specific direction based on mode
    const finalAdditionalPrompt = mode === 'full' ? courseDirection : '';
    const finalGenerationDirection = mode === 'module' || mode === 'homework_check' ? moduleDirection : '';

    onSubmit({
      mode,
      syllabus: { text: syllabusText, file: attachedFile },
      classMode,
      classType,
      duration,
      studentProfiles: cleanProfiles, // Send Array
      studentProfile: cleanProfiles[0], // Keep singular for legacy type safety if needed (but we updated types)
      moduleTypes: mode === 'module' ? selectedModules : [],
      interactiveModes: mode === 'module' ? interactiveModes : [],
      humorTypes: mode === 'module' ? humorTypes : [],
      homeworkTypes: mode === 'module' ? homeworkTypes : [],
      additionalPrompt: finalAdditionalPrompt,
      generationDirection: finalGenerationDirection,
      includeRelatedPractice: mode === 'module' ? includeRelatedPractice : false
    } as any);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
      <div className="flex flex-col sm:flex-row border-b border-slate-200">
        <button
          type="button"
          onClick={() => setMode('full')}
          className={`flex-1 py-4 text-center font-semibold text-sm transition-colors ${mode === 'full' ? 'bg-brand-50 text-brand-700 border-b-4 sm:border-b-2 border-brand-600' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <div className="flex items-center justify-center gap-2">
            <Layout className="w-4 h-4" /> 
            <span>Full Lesson (完整课件)</span>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setMode('module')}
          className={`flex-1 py-4 text-center font-semibold text-sm transition-colors ${mode === 'module' ? 'bg-brand-50 text-brand-700 border-b-4 sm:border-b-2 border-brand-600' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <div className="flex items-center justify-center gap-2">
            <Layers className="w-4 h-4" /> 
            <span>Modules (专项模块)</span>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setMode('audio')}
          className={`flex-1 py-4 text-center font-semibold text-sm transition-colors ${mode === 'audio' ? 'bg-brand-50 text-brand-700 border-b-4 sm:border-b-2 border-brand-600' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <div className="flex items-center justify-center gap-2">
            <Mic className="w-4 h-4" /> 
            <span>Audio Tool (语音生成)</span>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setMode('homework_check')}
          className={`flex-1 py-4 text-center font-semibold text-sm transition-colors ${mode === 'homework_check' ? 'bg-brand-50 text-brand-700 border-b-4 sm:border-b-2 border-brand-600' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <div className="flex items-center justify-center gap-2">
            <CheckSquare className="w-4 h-4" /> 
            <span>Homework Check (作业批改)</span>
          </div>
        </button>
      </div>

      <div className="p-8 space-y-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
             <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-brand-600" />
                {mode === 'audio' ? 'Dialogue Script' : mode === 'homework_check' ? 'Homework Content (作业内容)' : 'Syllabus / Topic Input (大纲/主题)'}
             </label>
             {mode !== 'audio' && mode !== 'homework_check' && (
                <button 
                  type="button"
                  onClick={handlePolish}
                  disabled={isPolishing || !syllabusText}
                  className="text-xs flex items-center gap-1 bg-brand-50 text-brand-700 px-2 py-1 rounded hover:bg-brand-100 disabled:opacity-50 transition-colors"
                >
                  {isPolishing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                  AI Polish (一键润色)
                </button>
             )}
          </div>
          
          {mode === 'audio' && (
             <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-xs md:text-sm text-amber-800 mb-2">
                <strong>Format for Multi-Speaker Audio (多人对话格式):</strong>
                <p className="mt-1">Please use the format "Name: Text" for each line. Detects up to 2 speakers.<br/>(请使用 "名字: 内容" 的格式，系统将自动识别并生成双人对话语音。)</p>
                <div className="mt-2 font-mono bg-white p-2 rounded border border-amber-100 text-slate-600">
                   Joe: Hello, how are you today?<br/>
                   Jane: I am doing great, thanks for asking!
                </div>
             </div>
          )}

          <div className="relative">
            <textarea
              value={syllabusText}
              onChange={(e) => setSyllabusText(e.target.value)}
              placeholder={mode === 'homework_check' 
                ? "Paste student's written homework here... (在此粘贴学生作业)" 
                : "Paste syllabus or topic here. The AI will auto-detect level and structure... (在此粘贴大纲，AI将自动识别并生成)"}
              className="w-full h-32 p-4 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-white placeholder:text-slate-400 leading-relaxed font-mono text-sm"
            />
            {attachedFile && (
              <div className="absolute bottom-4 right-4 bg-white border border-brand-200 text-brand-700 text-xs px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
                <FileText className="w-3 h-3" />
                <span className="max-w-[150px] truncate">{attachedFile.name}</span>
                <button type="button" onClick={removeFile} className="hover:text-red-500"><X className="w-3 h-3" /></button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload {mode === 'homework_check' ? 'File (PDF/Word/Image/Audio)' : 'File (PDF/Word/Image)'}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept={mode === 'homework_check' ? ".txt,.md,.pdf,.png,.jpg,.jpeg,.docx,.mp3,.wav,.m4a" : ".txt,.md,.pdf,.png,.jpg,.jpeg,.docx"}
              onChange={handleFileUpload}
            />
          </div>

          {/* Full Lesson Direction Input */}
          {(mode === 'full' || mode === 'homework_check') && (
             <div className="space-y-2 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
                <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Compass className="w-4 h-4 text-brand-600" />
                    {mode === 'homework_check' ? 'Correction Direction (批改方向)' : 'Course Generation Direction (课程生成方向)'}
                </label>
                <textarea
                  value={mode === 'full' ? courseDirection : moduleDirection}
                  onChange={(e) => mode === 'full' ? setCourseDirection(e.target.value) : setModuleDirection(e.target.value)}
                  placeholder={mode === 'homework_check' 
                    ? "E.g., Focus on grammar; Check for pronunciation issues; Strict correction... (例如：侧重语法；检查发音问题；严格批改...)"
                    : "E.g., Focus on business negotiation; Use formal tone... (例如：侧重商务谈判；使用正式语气...)"}
                  className="w-full h-24 p-4 bg-black border border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-white placeholder:text-slate-400 text-sm"
                />
             </div>
          )}
        </div>

        {mode !== 'audio' && mode !== 'homework_check' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Class Mode (上课模式)</label>
                <select
                  value={classMode}
                  onChange={(e) => setClassMode(e.target.value as ClassMode)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-brand-500"
                >
                  {Object.values(ClassMode).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                 <label className="text-sm font-semibold text-slate-700">Class Type (班级类型)</label>
                 <select
                   value={classType}
                   onChange={(e) => setClassType(e.target.value as ClassType)}
                   className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-brand-500"
                 >
                   {Object.values(ClassType).map(t => <option key={t} value={t}>{t}</option>)}
                 </select>
              </div>
              {mode === 'full' && (
                <div className="space-y-2">
                   <label className="text-sm font-semibold text-slate-700">Duration (正课时长)</label>
                   <select
                     value={duration}
                     onChange={(e) => setDuration(Number(e.target.value) as Duration)}
                     className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-brand-500"
                   >
                     {Object.values(Duration).filter(d => typeof d === 'number').map(d => (
                       <option key={d} value={d}>{d} Minutes (分钟)</option>
                     ))}
                   </select>
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-6">
               <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-brand-600" />
                    <h3 className="font-bold text-slate-800">Student Profile / 学员画像 (Optional)</h3>
                  </div>
                  <button 
                    type="button" 
                    onClick={addProfile}
                    className="flex items-center gap-1 text-xs font-bold bg-brand-600 text-white px-3 py-1.5 rounded-full hover:bg-brand-700 transition-colors shadow-sm"
                  >
                    <Plus className="w-3 h-3" /> Add Student
                  </button>
               </div>
               
               <div className="space-y-8">
                 {profiles.map((profile, index) => (
                    <div key={index} className="relative bg-white p-5 rounded-lg border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                       {/* Header for each profile */}
                       <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                          <h4 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                             <Users className="w-4 h-4" /> Student {index + 1}
                          </h4>
                          {index > 0 && (
                              <button 
                                type="button" 
                                onClick={() => removeProfile(index)}
                                className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                title="Remove Student"
                              >
                                  <Trash2 className="w-4 h-4" />
                              </button>
                          )}
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <label className="text-sm font-bold text-slate-700">English Level (CEFR 级别)</label>
                             <div className="relative">
                                <select 
                                  value={profile.englishLevel || ''}
                                  onChange={(e) => updateProfile(index, 'englishLevel', e.target.value)}
                                  className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 appearance-none focus:ring-2 focus:ring-brand-500"
                                >
                                  <option value="">Auto-Detect (智能识别)</option>
                                  {CEFR_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                             </div>
                          </div>

                          <div className="space-y-2">
                             <label className="text-sm font-semibold text-slate-700">Age Range (年龄段)</label>
                             <div className="relative">
                                <select 
                                  value={profile.age || ''}
                                  onChange={(e) => updateProfile(index, 'age', e.target.value)}
                                  className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 appearance-none focus:ring-2 focus:ring-brand-500"
                                >
                                  <option value="">Select Age (请选择)...</option>
                                  {AGE_RANGES.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                             </div>
                          </div>

                          <SelectWithOtherInput 
                            label="Industry (行业)" 
                            value={profile.industry} 
                            options={INDUSTRIES} 
                            onChange={(v) => updateProfile(index, 'industry', v)} 
                            customValue={profile.customIndustry || ''} 
                            setCustomValue={(v) => updateProfile(index, 'customIndustry', v)} 
                          />
                          
                          <SelectWithOtherInput 
                            label="Job/Role (职业)" 
                            value={profile.job} 
                            options={JOBS} 
                            onChange={(v) => updateProfile(index, 'job', v)} 
                            customValue={profile.customJob || ''} 
                            setCustomValue={(v) => updateProfile(index, 'customJob', v)} 
                          />
                          
                          <MultiSelectInput 
                            label="Learning Goals (学习目的 - Multi-Select)" 
                            currentSelection={profile.goal} 
                            options={GOALS} 
                            updateSelection={(vals) => updateProfile(index, 'goal', vals)} 
                          />
                          
                          <MultiSelectInput 
                            label="Interests (兴趣爱好 - Multi-Select)" 
                            currentSelection={profile.interests} 
                            options={INTERESTS} 
                            updateSelection={(vals) => updateProfile(index, 'interests', vals)} 
                          />
                       </div>
                    </div>
                 ))}
               </div>
            </div>
          </>
        )}

        {mode === 'module' && (
          <div className="bg-brand-50/50 p-6 rounded-xl border border-brand-100">
             <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-600" /> Select Modules (选择模块)
             </h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
               {Object.values(ModuleType).map(m => (
                 <label 
                   key={m} 
                   className={`
                     relative flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-white
                     ${selectedModules.includes(m) 
                        ? 'bg-white border-brand-500 shadow-sm ring-1 ring-brand-500' 
                        : 'bg-slate-50 border-slate-200 hover:border-brand-300'
                     }
                   `}
                 >
                   <input
                     type="checkbox"
                     checked={selectedModules.includes(m)}
                     onChange={() => toggleModule(m)}
                     className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 border-slate-300 flex-shrink-0"
                   />
                   <span className="text-sm font-medium text-slate-800 leading-snug">{m}</span>
                 </label>
               ))}
             </div>
             
             {/* New Practice Checkbox */}
             {selectedModules.length > 0 && (
                 <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg animate-in fade-in">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input 
                            type="checkbox"
                            checked={includeRelatedPractice}
                            onChange={(e) => setIncludeRelatedPractice(e.target.checked)}
                            className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 border-orange-300 mt-0.5"
                        />
                        <div>
                            <span className="block font-bold text-orange-800 text-sm">Generate interactive practice based on selected modules (生成基于上述勾选模块的互动练习)</span>
                            <span className="block text-xs text-orange-700 mt-1">
                                Will generate 3 fun, adult-friendly practice activities for each module. (将为每个模块生成3个有趣的互动练习)
                            </span>
                        </div>
                    </label>
                 </div>
             )}

             {selectedModules.length > 0 && (
                <div className="space-y-2 mb-6 pt-4 border-t border-brand-200 animate-in fade-in slide-in-from-top-2">
                    <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Compass className="w-4 h-4 text-brand-600" />
                        Module Generation Direction (模块生成方向)
                    </label>
                    <textarea
                      value={moduleDirection}
                      onChange={(e) => setModuleDirection(e.target.value)}
                      placeholder="E.g., For Dialogue: Use airport scenario; For Vocab: Focus on medical terms... (例如：对话模块请使用机场场景；词汇模块请侧重医学术语...)"
                      className="w-full h-24 p-4 bg-black border border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-white placeholder:text-slate-400 text-sm"
                    />
                </div>
             )}

             {selectedModules.includes(ModuleType.INTERACTIVE) && (
                <div className="mb-6 animate-in fade-in">
                   <MultiSelectInput 
                      label="Interactive Practice Modes (互动练习模式)" 
                      currentSelection={interactiveModes} 
                      options={INTERACTIVE_MODES} 
                      updateSelection={setInteractiveModes} 
                   />
                </div>
             )}
             
             {selectedModules.includes(ModuleType.HUMOR) && (
                <div className="mb-6 animate-in fade-in">
                   <MultiSelectInput 
                      label="Humor Types (幽默话术类型)" 
                      currentSelection={humorTypes} 
                      options={HUMOR_TYPES} 
                      updateSelection={setHumorTypes} 
                   />
                </div>
             )}

             {selectedModules.includes(ModuleType.HOMEWORK) && (
                <div className="mb-6 animate-in fade-in">
                   <MultiSelectInput 
                      label="Homework Types (作业类型)" 
                      currentSelection={homeworkTypes} 
                      options={HOMEWORK_TYPES} 
                      updateSelection={setHomeworkTypes} 
                   />
                </div>
             )}

             {selectedModules.length === 0 && (
               <p className="text-xs text-red-500 mt-2 font-medium">Please select at least one module. (请至少选择一个模块)</p>
             )}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || (!syllabusText && !attachedFile) || (mode === 'module' && selectedModules.length === 0)}
          className="w-full py-4 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-lg shadow-brand-200 transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" /> Generating (生成中)...
            </>
          ) : (
            <>
              <SparklesIcon /> 
              {mode === 'full' ? 'Generate Courseware (生成课件)' : mode === 'audio' ? 'Prepare Audio Tool (准备语音工具)' : mode === 'homework_check' ? 'Start Correction (开始批改)' : 'Generate Modules (生成专项)'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

const SparklesIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3C12 3 14 9 19 12C14 15 12 21 12 21C12 21 10 15 5 12C10 9 12 3 12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default InputForm;
