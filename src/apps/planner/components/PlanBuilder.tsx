
import React, { useState, useEffect, useRef } from 'react';
import { CEFRLevel, PlannedModule, StudentProfile, Topic, TopicCategory, CourseMode, LearningDirection, CustomContentStrategy, PackTopicData, StandardTrackMode, TopicSyllabus, CourseType } from '../types';
import { OFFICIAL_CURRICULUM, SPECIALTY_PACKS, CEFR_RANK, SUPPLEMENTARY_COURSES } from '../constants';
import { generateCustomTopics, generateTopicSyllabus, generatePathGenerationRationale } from '../services/geminiService';
import { MarvellousLogo, Watermark } from './Icons';

interface Props {
  profile: StudentProfile;
  isSystemLoaded: boolean;
  isPreviewMode?: boolean; 
}

const GLOBAL_UNIQUE_IDS = ['pronunciation', 'grammar', 'correction', 'vocab-elem', 'vocab-inter'];
const LEVEL_UNIQUE_IDS = ['rs-hybrid', 'online-group'];

enum PathGenStrategy {
  Interest = "Interest-Based (Based on Interests)",
  Career = "Career-Based (Based on Industry & Role)",
  Hybrid_InterestFirst = "Hybrid (Interests → Career)",
  Hybrid_CareerFirst = "Hybrid (Career → Interests)",
  Custom = "Custom Input"
}

// Separated Component to prevent re-rendering issues
const ModuleView: React.FC<{
  module: PlannedModule;
  profile: StudentProfile;
  showTools: boolean;
  isPreviewMode?: boolean;
  generatingTopicId: string | null;
  onRemoveTopic: (level: CEFRLevel, id: string) => void;
  onUpdateTopicHours: (level: CEFRLevel, id: string, h: number) => void;
  onHandleTopicClick: (level: CEFRLevel, topicId: string) => void;
  onUpdateStandardTrack: (level: CEFRLevel, mode: string) => void;
  onRemoveAllCustom: (level: CEFRLevel) => void;
  onRemoveAllStandard: (level: CEFRLevel) => void;
  onShowAddModal: () => void;
  onBatchGenerate: (level: CEFRLevel) => void;
  onSetAllDurations: (level: CEFRLevel, h: number) => void;
  onAddSupplementary: (id: string, all?: boolean) => void;
  onVerifyLevel: () => void;
  allModules: PlannedModule[]; 
}> = ({ 
  module, profile, showTools, isPreviewMode, generatingTopicId, 
  onRemoveTopic, onUpdateTopicHours, onHandleTopicClick, onUpdateStandardTrack,
  onRemoveAllCustom, onRemoveAllStandard, onShowAddModal, onBatchGenerate,
  onSetAllDurations, onAddSupplementary, onVerifyLevel, allModules
}) => {
    const officialConfig = OFFICIAL_CURRICULUM.find(c => c.level === module.level);
    
    // Stats calculation
    let offlinePrivateHours = 0;
    let offlineGroupHours = 0;
    let onlineHours = 0;
    
    module.topics.forEach(t => {
      const duration = (t.minHours + t.maxHours) / 2;
      const title = t.title || "";
      
      if (t.category === TopicCategory.Supplementary) {
        if (title.includes("RS Hybrid")) onlineHours += 4 * 12; 
        else if (title.includes("Online Group Class")) onlineHours += 2 * 12;
        else onlineHours += duration;
      } else if (t.mode === CourseMode.Group || t.fixedDuration) {
        offlineGroupHours += duration;
      } else {
        offlinePrivateHours += duration;
      }
    });
    const totalHours = offlinePrivateHours + offlineGroupHours + onlineHours;

    const estimatedMonths = ((totalHours / (profile.weeklyFrequency || 2)) / 4.33).toFixed(1);
    const groupTopicCount = Math.round(offlineGroupHours / 1.5);
    const privateSessionsVal = offlinePrivateHours / 0.75;
    const formattedPrivateSessions = Number.isInteger(privateSessionsVal) ? privateSessionsVal : privateSessionsVal.toFixed(1);

    const groupTopics = module.topics.filter(t => (t.mode === CourseMode.Group || t.fixedDuration) && t.category !== TopicCategory.Supplementary);
    const privateTopics = module.topics.filter(t => (t.mode === CourseMode.Private && !t.fixedDuration && t.category !== TopicCategory.Supplementary));
    const supplementaryTopics = module.topics.filter(t => t.category === TopicCategory.Supplementary);
    const canToggleTrack = officialConfig?.alternateTopics && officialConfig.alternateTopics.length > 0;
    
    const isCompact = isPreviewMode;

    const renderTopicItem = (topic: Topic, index: number, isPrivateColumn: boolean) => {
      let badgeColor = "bg-navy-50 text-navy-600";
      let badgeText = "System";
      if (topic.source === 'File') { badgeColor = "bg-navy-100 text-navy-700"; badgeText = "File"; }
      else if (topic.source === 'AI') { badgeColor = "bg-gold-100 text-gold-700"; badgeText = "AI"; }
      
      const isClickable = isPrivateColumn && !topic.fixedDuration;
      const isGeneratingThis = generatingTopicId === topic.id;

      return (
        <div 
          key={topic.id} 
          className={`
            ${isCompact ? 'p-2 mb-1.5' : 'p-3 mb-2'} 
            bg-white rounded border transition-all shadow-sm flex flex-col gap-1 break-inside-avoid relative group
            ${isClickable ? 'hover:border-gold-500 cursor-pointer hover:shadow-md' : 'border-navy-100'}`}
          onClick={() => isClickable && onHandleTopicClick(module.level, topic.id)}
        >
          {isGeneratingThis && (
             <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-10 rounded border-2 border-gold-500">
               <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gold-600 mb-1"></div>
               <span className="text-[10px] text-gold-600 font-bold">Generating...</span>
             </div>
          )}
           {topic.syllabus && (
              <div className="absolute top-1 right-1">
                 <svg className="w-3 h-3 text-gold-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              </div>
          )}
          
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className={`${isCompact ? 'text-xs' : 'text-sm'} font-medium text-navy-800`}>{topic.title}</div>
                <span className={`text-[9px] px-1 rounded uppercase font-bold ${badgeColor}`}>{badgeText}</span>
              </div>
              {topic.practicalScenario && (
                <div className="text-[10px] text-navy-500 mt-0.5 italic border-l-2 border-gold-200 pl-1.5">
                   "{topic.practicalScenario}"
                </div>
              )}
               {isClickable && !isGeneratingThis && (
                <div className="text-[10px] text-gold-500 font-medium mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {topic.syllabus ? 'View Syllabus / 查看大纲' : 'Click to Generate Syllabus / 点击生成大纲'}
                </div>
              )}
            </div>
            {showTools && (
                <div className="flex flex-col items-end gap-2 ml-2 print:hidden" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => onRemoveTopic(module.level, topic.id)} className="text-navy-300 hover:text-navy-900">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                   
                   {isPrivateColumn && !topic.fixedDuration && (
                     <div className="flex flex-col gap-1">
                        {[0.75, 1, 1.5, 2].map(h => (
                            <button key={h} onClick={() => onUpdateTopicHours(module.level, topic.id, h)} className={`text-[9px] font-bold px-1.5 py-0.5 rounded border transition-colors w-full ${topic.minHours === h ? 'bg-gold-100 text-gold-700 border-gold-300' : 'bg-navy-50 text-navy-400'}`}>
                              {h * 60}m
                            </button>
                        ))}
                     </div>
                   )}
                </div>
            )}
          </div>
        </div>
      );
    };

    return (
      <div className={`bg-white rounded-xl shadow-lg border border-navy-100 overflow-hidden print:border-none print:shadow-none print:mb-6 module-container relative ${isCompact ? 'print:border print:border-navy-200' : ''}`}>
         <div className={`${isCompact ? 'p-4' : 'p-6'} bg-gradient-to-r from-navy-50 to-white border-b border-navy-200 flex justify-between items-start relative z-10 break-inside-avoid`}>
            <div>
            <h3 className={`${isCompact ? 'text-2xl' : 'text-3xl'} font-extrabold text-navy-800`}>Level {module.level} Curriculum</h3>
            <p className="text-navy-600 text-sm mt-1 max-w-lg">{officialConfig?.description}</p>
            <div className="flex flex-col gap-1 mt-2 text-sm text-navy-600">
                <div className="flex items-center"><span className="w-32 font-bold text-navy-700">Vocab (词汇):</span> {officialConfig?.coreVocabCount} words</div>
            </div>
            </div>
            <div className={`text-right bg-white ${isCompact ? 'p-3' : 'p-4'} rounded-lg shadow-sm border border-navy-100 min-w-[140px]`}>
                <div className="text-xs text-navy-400 uppercase tracking-wider mb-1">Level Total</div>
                <div className={`${isCompact ? 'text-2xl' : 'text-3xl'} font-bold text-navy-700`}>{totalHours}h</div>
                <div className="text-xs text-gold-600 font-bold mt-1">~ {estimatedMonths} Months</div>
                <div className="flex flex-col items-end gap-1 mt-2 text-xs text-navy-500">
                    <span title="Private Hours">P: <b>{offlinePrivateHours}h ({formattedPrivateSessions} Sessions)</b></span>
                    <span title="Group Hours">G: <b>{offlineGroupHours}h ({groupTopicCount} Topics)</b></span>
                    <span title="Online/Supp Hours">O/S: <b>{onlineHours}h</b></span>
                </div>
                {showTools && (
                    <button onClick={onVerifyLevel} className="mt-3 w-full text-xs text-white bg-navy-800 px-3 py-1.5 rounded hover:bg-navy-900 print:hidden font-medium">Verify Level / 验证级别</button>
                )}
            </div>
        </div>

        {showTools && (
            <div className="p-4 bg-navy-50 border-b border-navy-200 flex justify-between items-center sticky top-0 z-10 print:hidden relative">
                <h4 className="font-bold text-navy-700 uppercase tracking-wide text-xs">Topic Distribution</h4>
                <div className="flex gap-3">
                    <button onClick={() => onRemoveAllCustom(module.level)} className="px-3 py-1.5 text-navy-500 hover:text-navy-900 text-xs border border-navy-300 rounded bg-white">Clear Custom / 清空定制</button>
                    {profile.mode !== CourseMode.Group && (
                        <button onClick={onShowAddModal} className="flex items-center px-4 py-1.5 bg-navy-800 text-white rounded hover:bg-navy-900 shadow-sm transition-all text-xs font-bold uppercase tracking-wide">+ Add 1-on-1 Custom Topics / 添加1对1定制话题</button>
                    )}
                </div>
            </div>
        )}

        <div className={`relative z-10 grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-navy-200 ${isCompact ? 'min-h-[300px]' : 'min-h-[500px]'} bg-navy-50 print:min-h-0 print:bg-white`}>
            {/* Group / Standard Column */}
            <div className={`${isCompact ? 'p-3' : 'p-4'} bg-navy-50/50 print:bg-transparent`}>
                <div className="mb-3 border-b border-navy-200 pb-2 break-inside-avoid">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-navy-700 text-sm">Standard/Group (标化/班课)</span>
                        <span className="text-xs bg-navy-200 text-navy-600 px-2 py-0.5 rounded-full font-bold">{groupTopics.length}</span>
                    </div>
                    {showTools && (
                        <div className="flex items-center justify-between gap-2 h-7">
                            {canToggleTrack ? (
                                <select 
                                value={module.standardTrackMode || StandardTrackMode.Official}
                                onChange={(e) => onUpdateStandardTrack(module.level, e.target.value)}
                                className="flex-1 text-[10px] bg-navy-50 border border-navy-200 rounded px-2 h-full text-navy-800"
                                >
                                <option value={StandardTrackMode.Official}>Official (Biz/Mix)</option>
                                <option value={StandardTrackMode.Alternate}>Alternate (Life/Daily)</option>
                                <option value={StandardTrackMode.Combined}>Combined (Both)</option>
                                </select>
                            ) : <span className="text-[10px] text-navy-400">Fixed Curriculum</span>}
                            <button onClick={() => onRemoveAllStandard(module.level)} className="text-[10px] text-navy-400 hover:text-navy-900 px-2 transition-colors">Clear / 清空</button>
                        </div>
                    )}
                </div>
                {groupTopics.length === 0 && <div className="text-sm text-navy-400 italic text-center mt-10">No standard topics.</div>}
                {groupTopics.map((t, i) => renderTopicItem(t, i, false))}
            </div>

            {/* Custom Private Column */}
            <div className={`${isCompact ? 'p-3' : 'p-4'} bg-white relative print:bg-transparent`}>
                <div className="mb-3 border-b border-navy-100 pb-2 break-inside-avoid">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-navy-800 text-sm">Custom 1v1 (定制)</span>
                        <span className="text-xs bg-navy-100 text-navy-900 px-2 py-0.5 rounded-full font-bold">{privateTopics.length}</span>
                    </div>
                    {showTools && (
                        <div className="flex items-center justify-between gap-2 print:hidden h-7">
                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onBatchGenerate(module.level);
                                }}
                                className="flex-1 text-[10px] bg-navy-100 text-navy-700 hover:bg-navy-200 border border-navy-200 rounded px-2 h-full font-bold flex items-center justify-center transition-colors cursor-pointer shadow-sm hover:shadow"
                                title="Generate syllabus for all topics in this column"
                            >
                                ✨ Gen All / 全生成
                            </button>
                            <select 
                                className="flex-1 text-[10px] bg-navy-50 border border-navy-200 rounded px-1 h-full text-navy-800 min-w-[90px]"
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    if(val > 0) onSetAllDurations(module.level, val);
                                    e.target.value = "0"; 
                                }}
                            >
                                <option value="0">Batch Set...</option>
                                <option value="0.75">All 45m / 全45分</option>
                                <option value="1">All 60m / 全60分</option>
                                <option value="1.5">All 90m / 全90分</option>
                                <option value="2">All 120m / 全2小时</option>
                            </select>
                        </div>
                    )}
                </div>
                {privateTopics.length === 0 && <div className="text-sm text-gray-400 italic text-center mt-10">No custom topics. Use 'Add Topics'.</div>}
                {privateTopics.map((t, i) => renderTopicItem(t, i, true))}
            </div>

            {/* Online Column */}
            <div className={`${isCompact ? 'p-3' : 'p-4'} bg-gold-50/30 flex flex-col print:bg-transparent`}>
                <div className="mb-3 border-b border-gold-200 pb-2 break-inside-avoid">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-gold-700 text-sm">Online/Supp (补充)</span>
                        <span className="text-xs bg-gold-100 text-gold-800 px-2 py-0.5 rounded-full font-bold">{supplementaryTopics.length}</span>
                    </div>
                </div>
                {showTools && (
                    <div className="space-y-2 mb-4 print:hidden">
                        {SUPPLEMENTARY_COURSES.map(course => {
                            const currentRank = CEFR_RANK[module.level];
                            const minRank = CEFR_RANK[course.minLevel];
                            const maxRank = CEFR_RANK[course.maxLevel];
                            
                            // Check constraints
                            const isGlobalUnique = GLOBAL_UNIQUE_IDS.includes(course.id);
                            const isLevelUnique = LEVEL_UNIQUE_IDS.includes(course.id);
                            const existsGlobally = isGlobalUnique && allModules.some(m => m.topics.some(t => t.title === course.title));
                            const existsInLevel = isLevelUnique && module.topics.some(t => t.title === course.title);
                            const isDisabled = existsGlobally || existsInLevel;

                            let displayHours = course.hours > 0 ? `${course.hours}h` : 'Add';
                            if (course.id === 'rs-hybrid') displayHours = '4h/wk';
                            if (course.id === 'online-group') displayHours = '2h/wk';

                            if (currentRank >= minRank && currentRank <= maxRank) {
                            return (
                                <div key={course.id} className="flex gap-1">
                                    <button 
                                      onClick={() => !isDisabled && onAddSupplementary(course.id)} 
                                      disabled={isDisabled}
                                      className={`flex-1 text-left text-xs py-2 px-3 border rounded transition-colors flex justify-between group
                                        ${isDisabled ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gold-800 border-gold-200 hover:border-gold-400 hover:bg-gold-50'}
                                      `}
                                    >
                                        <span>{course.title}</span>
                                        <span className={`font-bold ${isDisabled ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'}`}>
                                            {isDisabled ? 'Added' : displayHours}
                                        </span>
                                    </button>
                                    {(course.id === 'rs-hybrid' || course.id === 'online-group') && !isDisabled && (
                                        <button 
                                          onClick={() => onAddSupplementary(course.id, true)} 
                                          className="text-[10px] bg-gold-100 text-gold-700 px-2 rounded hover:bg-gold-200"
                                          title="Add to All Levels"
                                        >
                                          All
                                        </button>
                                    )}
                                </div>
                            )
                            }
                            return null;
                        })}
                    </div>
                )}
                {supplementaryTopics.map((t, i) => (
                    <div key={t.id} className="p-2 mb-2 bg-white rounded border border-gold-100 shadow-sm text-center relative group break-inside-avoid">
                    {showTools && <button onClick={() => onRemoveTopic(module.level, t.id)} className="absolute top-1 right-1 text-gray-300 hover:text-red-500 hidden group-hover:block print:hidden">×</button>}
                    <div className="font-medium text-gold-800 text-xs mb-1">{t.title}</div>
                    {t.description && <div className="text-[10px] text-gold-500 italic mb-1">{t.description}</div>}
                    {t.minHours > 0 && <div className="text-lg font-bold text-gold-600">{t.minHours}h</div>}
                    </div>
                ))}
            </div>
        </div>
      </div>
    );
};


const PlanBuilder: React.FC<Props> = ({ profile, isSystemLoaded, isPreviewMode }) => {
  const [modules, setModules] = useState<PlannedModule[]>([]);
  const [activeLevel, setActiveLevel] = useState<CEFRLevel | null>(null);
  
  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalMode, setModalMode] = useState<'packs' | 'official' | 'ai'>('packs');
  const [showVerification, setShowVerification] = useState(false);

  // Path Gen Modal
  const [showPathGenModal, setShowPathGenModal] = useState(false);
  const [pathGenLevels, setPathGenLevels] = useState<CEFRLevel[]>([]);
  const [pathGenStatus, setPathGenStatus] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({});
  
  // Path Gen Config States
  const [showPathGenConfig, setShowPathGenConfig] = useState(true);
  const [pathGenStrategy, setPathGenStrategy] = useState<PathGenStrategy>(PathGenStrategy.Interest);
  const [pathGenCustomPrompt, setPathGenCustomPrompt] = useState('');
  const [generationRationale, setGenerationRationale] = useState<string | null>(null);

  // AI & Preview States
  const [loadingAI, setLoadingAI] = useState<string | null>(null);
  const [showAIPreview, setShowAIPreview] = useState(false);
  const [aiPreviewTopics, setAiPreviewTopics] = useState<Topic[]>([]);
  const [customPromptInput, setCustomPromptInput] = useState(''); 
  const [customTopicCount, setCustomTopicCount] = useState(12); 
  const [batchPathTopicCount, setBatchPathTopicCount] = useState(24); 
  
  // Pack Search
  const [packSearchTerm, setPackSearchTerm] = useState('');

  // New: AI Target Level Selector
  const [targetAILevel, setTargetAILevel] = useState<CEFRLevel>(CEFRLevel.A2);

  // Syllabus States
  // FIX: Track by ID ONLY, NOT by Object. This ensures we always get the latest state from 'modules'.
  const [activeSyllabusTracking, setActiveSyllabusTracking] = useState<{ topicId: string, level: CEFRLevel } | null>(null);
  const [generatingTopicId, setGeneratingTopicId] = useState<string | null>(null);
  
  // Regeneration State
  const [showRegenerateInput, setShowRegenerateInput] = useState(false);
  const [syllabusRefineText, setSyllabusRefineText] = useState('');
  const [isRegeneratingSyllabus, setIsRegeneratingSyllabus] = useState(false);
  
  // Batch Gen State
  const [batchGenerating, setBatchGenerating] = useState<CEFRLevel | null>(null);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, currentTopicTitle: '' });
  
  const syllabusContentRef = useRef<HTMLDivElement>(null);

  // Derived State for Syllabus Modal (Fixes desync issues)
  const selectedTopicForSyllabus = activeSyllabusTracking 
    ? modules.find(m => m.level === activeSyllabusTracking.level)?.topics.find(t => t.id === activeSyllabusTracking.topicId) 
    : null;

  // Initialize Base Plan
  useEffect(() => {
    if (!isSystemLoaded) return;

    const start = CEFR_RANK[profile.currentLevel];
    const end = CEFR_RANK[profile.targetLevel];
    
    const newModules: PlannedModule[] = [];

    const isFullTimeParent = profile.role === "Full-time Parent / 全职家长";
    const hasBusinessFocus = profile.learningDirections.includes(LearningDirection.Business);
    const useAlternateCurriculum = isFullTimeParent && !hasBusinessFocus;
    const strategy = profile.customContentStrategy || CustomContentStrategy.HighFrequency;
    const isPureCustom = profile.mode === CourseMode.Private && strategy === CustomContentStrategy.PureCustom;

    OFFICIAL_CURRICULUM.forEach((curriculum) => {
      const rank = CEFR_RANK[curriculum.level];
      if (rank >= start && rank < end) {
        
        const isGroupOrCombo = profile.mode === CourseMode.Group || profile.mode === CourseMode.Combo;
        
        let selectedTopics: Topic[] = [];
        let initialMode = StandardTrackMode.Official;
        
        if (!isPureCustom) {
            if (useAlternateCurriculum && curriculum.alternateTopics && curriculum.alternateTopics.length > 0) {
               selectedTopics = curriculum.alternateTopics;
               initialMode = StandardTrackMode.Alternate;
            } else {
               selectedTopics = curriculum.officialTopics;
            }
        }

        const adjustedTopics = selectedTopics.map(t => ({
          ...t,
          minHours: isGroupOrCombo ? 1.5 : 2,
          maxHours: isGroupOrCombo ? 1.5 : 4,
          fixedDuration: isGroupOrCombo,
          mode: isGroupOrCombo ? CourseMode.Group : CourseMode.Private,
          source: t.source || 'File' 
        }));

        newModules.push({
          id: `mod-${curriculum.level}`,
          level: curriculum.level,
          topics: adjustedTopics,
          standardTrackMode: initialMode
        });
      }
    });

    setModules(newModules);
    if(newModules.length > 0) setActiveLevel(newModules[0].level);
    if(profile.currentLevel) setTargetAILevel(profile.currentLevel);
  }, [profile.currentLevel, profile.targetLevel, profile.mode, profile.customContentStrategy, isSystemLoaded]);

  // Sync AI Level when Modal Opens
  useEffect(() => {
    if (showAddModal && activeLevel) {
        setTargetAILevel(activeLevel);
    }
  }, [showAddModal, activeLevel]);

  const removeTopic = (level: CEFRLevel, topicId: string) => {
    setModules(prev => prev.map(m => m.level === level ? { ...m, topics: m.topics.filter(t => t.id !== topicId) } : m));
  };

  const addTopic = (level: CEFRLevel, topic: Topic) => {
    setModules(prev => prev.map(m => m.level === level ? { ...m, topics: [...m.topics, topic] } : m));
  };

  const updateTopicHours = (level: CEFRLevel, topicId: string, hours: number) => {
    setModules(prev => prev.map(m => m.level === level ? { ...m, topics: m.topics.map(t => t.id === topicId ? { ...t, minHours: hours, maxHours: hours } : t) } : m));
  };

  const handleTopicClick = async (level: CEFRLevel, topicId: string) => {
    const topic = modules.find(m => m.level === level)?.topics.find(t => t.id === topicId);
    if (!topic || topic.mode !== CourseMode.Private || topic.fixedDuration || topic.category === TopicCategory.Supplementary) return;
    
    // Set ID immediately to open modal. If syllabus exists, it renders immediately.
    setActiveSyllabusTracking({ topicId, level });
    setShowRegenerateInput(false);

    if (!topic.syllabus) {
      // Trigger async generation. Modal will show loading state because selectedTopic.syllabus is undefined.
      await generateSyllabusForTopic(level, topic.id);
    }
  };

  const generateSyllabusForTopic = async (level: CEFRLevel, topicId: string, refinementInstruction?: string) => {
    // Re-fetch topic inside the function to ensure we have the latest
    const moduleIndex = modules.findIndex(m => m.level === level);
    if (moduleIndex === -1) return;
    const topic = modules[moduleIndex].topics.find(t => t.id === topicId);
    if (!topic) return;

    if (refinementInstruction) setIsRegeneratingSyllabus(true);
    else setGeneratingTopicId(topicId);
    
    const studentContext = `Industry: ${profile.industry}, Role: ${profile.role}, JobDescription: ${profile.jobDescription || 'N/A'}, Interests: ${profile.interests.join(',')}, Goals: ${profile.goals.join(',')}`;
    
    try {
        const syllabus = await generateTopicSyllabus(
            topic.title, level, topic.practicalScenario || topic.title, studentContext, topic.context, refinementInstruction
        );
        
        if (syllabus) {
            // SAFE IMMUTABLE UPDATE: Only update the specific topic
            setModules(prev => prev.map(m => {
                if (m.level !== level) return m;
                return {
                    ...m,
                    topics: m.topics.map(t => t.id === topicId ? { ...t, syllabus } : t)
                };
            }));
            
            setSyllabusRefineText('');
            setShowRegenerateInput(false);
        }
    } catch (e) {
        console.error("Error generating syllabus", e);
        alert("Failed to generate syllabus content. Please try again.");
    } finally {
        // CRITICAL: Always reset loading states
        setGeneratingTopicId(null);
        setIsRegeneratingSyllabus(false);
    }
  };
  
  const handleBatchGenerateSyllabi = async (level: CEFRLevel) => {
      const module = modules.find(m => m.level === level);
      if (!module) return;

      const customTopics = module.topics.filter(t => 
          t.mode === CourseMode.Private && 
          !t.fixedDuration && 
          t.category !== TopicCategory.Supplementary
      );

      const missingTopics = customTopics.filter(t => !t.syllabus);
      let topicsToProcess = missingTopics;

      if (missingTopics.length === 0) {
          if (customTopics.length === 0) {
             alert("No custom topics found to generate.");
             return;
          }
          if (window.confirm("All topics already have syllabi. Do you want to regenerate ALL of them?")) {
              topicsToProcess = customTopics;
          } else {
              return;
          }
      }

      setBatchGenerating(level);

      try {
        for (let i = 0; i < topicsToProcess.length; i++) {
            const topic = topicsToProcess[i];
            
            setBatchProgress({ 
                current: i + 1, 
                total: topicsToProcess.length, 
                currentTopicTitle: topic.title 
            });

            await generateSyllabusForTopic(level, topic.id);
            
            // Short pause to prevent rate limiting
            await new Promise(r => setTimeout(r, 200));
        }
      } finally {
          setBatchGenerating(null);
      }
  };

  const downloadSyllabusPDF = () => {
    if (!selectedTopicForSyllabus || !syllabusContentRef.current) return;
    const html2pdf = (window as any).html2pdf;
    if (html2pdf) {
        html2pdf().set({
            margin: 0.2, filename: `Syllabus_${selectedTopicForSyllabus.title}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        }).from(syllabusContentRef.current).save();
    }
  };

  const downloadSyllabusImage = async () => {
    if (!selectedTopicForSyllabus || !syllabusContentRef.current) return;
    const html2canvas = (window as any).html2canvas;
    
    if (!html2canvas) {
        alert("Image generation library not loaded. Please refresh the page. / 图片生成组件未加载，请刷新页面。");
        return;
    }

    const originalElement = syllabusContentRef.current;
    
    // Using a clone to ensure high resolution rendering without affecting the view
    const clone = originalElement.cloneNode(true) as HTMLElement;
    clone.style.position = 'fixed'; 
    clone.style.top = '-9999px'; 
    clone.style.left = '-9999px';
    clone.style.width = '800px'; 
    clone.style.height = 'auto';
    clone.style.zIndex = '-1';
    // Ensure styles are copied properly if needed, but Tailwind usually handles classes.
    
    document.body.appendChild(clone);
    
    try {
        const canvas = await html2canvas(clone, { 
            scale: 2, 
            useCORS: true, 
            backgroundColor: '#ffffff', 
            windowWidth: 1000 
        });
        const link = document.createElement('a');
        link.download = `Syllabus_${selectedTopicForSyllabus.title}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (e) { 
        console.error(e); 
        alert("Image generation failed. / 生成图片失败。");
    } finally { 
        if (document.body.contains(clone)) {
            document.body.removeChild(clone); 
        }
    }
  };

  const setAllPrivateDurations = (level: CEFRLevel, hours: number) => {
    setModules(prev => prev.map(m => m.level === level ? { ...m, topics: m.topics.map(t => (t.mode === CourseMode.Private && !t.fixedDuration && t.category !== TopicCategory.Supplementary) ? { ...t, minHours: hours, maxHours: hours } : t) } : m));
  };

  const removeAllCustomTopics = (level: CEFRLevel) => {
    setModules(prev => prev.map(m => m.level === level ? { ...m, topics: m.topics.filter(t => t.category === TopicCategory.Official || t.category === TopicCategory.Supplementary) } : m));
  };
  
  const removeAllStandardTopics = (level: CEFRLevel) => {
    setModules(prev => prev.map(m => m.level === level ? { ...m, topics: m.topics.filter(t => t.category !== TopicCategory.Official) } : m));
  };

  const addSupplementaryCourse = (courseId: string, addToAll: boolean = false) => {
     if (!activeLevel) return;
     const course = SUPPLEMENTARY_COURSES.find(c => c.id === courseId);
     if (!course) return;
     
     const isGlobalUnique = GLOBAL_UNIQUE_IDS.includes(courseId);
     const isLevelUnique = LEVEL_UNIQUE_IDS.includes(courseId);

     if (isGlobalUnique) {
        const alreadyExists = modules.some(m => m.topics.some(t => t.title === course.title));
        if (alreadyExists) return;
     }

     let hours = course.hours;
     let desc = course.isWeekly ? `Weekly` : undefined;
     
     if (course.id === 'rs-hybrid') {
        hours = 48;
        desc = "4h / week";
     } else if (course.id === 'online-group') {
        hours = 24;
        desc = "2h / week";
     }

     const levelsToAdd = addToAll ? modules.map(m => m.level) : [activeLevel];
     
     const updatedModules = modules.map(m => {
        if (!levelsToAdd.includes(m.level)) return m;
        if (isLevelUnique && m.topics.some(t => t.title === course.title)) return m;

        const newTopic: Topic = {
            id: Math.random().toString(36).substr(2, 9),
            title: course.title, category: TopicCategory.Supplementary,
            minHours: hours, maxHours: hours,
            fixedDuration: true, mode: CourseMode.Private,
            description: desc, source: 'System'
        };
        return { ...m, topics: [...m.topics, newTopic] };
     });
     
     setModules(updatedModules);
  };

  const updateStandardTrack = (level: CEFRLevel, mode: string) => {
     const config = OFFICIAL_CURRICULUM.find(c => c.level === level);
     if (!config) return;
     setModules(prev => prev.map(m => {
        if (m.level !== level) return m;
        let newTopics = m.topics.filter(t => t.category !== TopicCategory.Official);
        const topicsToAdd: Topic[] = [];
        if (mode === StandardTrackMode.Official || mode === StandardTrackMode.Combined) topicsToAdd.push(...config.officialTopics);
        if ((mode === StandardTrackMode.Alternate || mode === StandardTrackMode.Combined) && config.alternateTopics) topicsToAdd.push(...config.alternateTopics);
        
        const isGroupOrCombo = profile.mode === CourseMode.Group || profile.mode === CourseMode.Combo;
        const formattedTopics = topicsToAdd.map(t => ({
            ...t, minHours: isGroupOrCombo ? 1.5 : 2, maxHours: isGroupOrCombo ? 1.5 : 4,
            fixedDuration: isGroupOrCombo, mode: isGroupOrCombo ? CourseMode.Group : CourseMode.Private, source: t.source || 'File' 
        }));
        return { ...m, topics: [...formattedTopics, ...newTopics], standardTrackMode: mode as StandardTrackMode };
     }));
  };

  // AI Generation with separated logic
  const handleAIGenerate = async (type: 'industry' | 'interest' | 'custom') => {
    setLoadingAI(type);
    let promptText = "";
    if (type === 'industry') {
        promptText = `Industry: ${profile.industry}, Role: ${profile.role}. Context/Description: ${profile.jobDescription || 'N/A'}. (Ignore Interests). Focus strictly on professional/life needs based on the description.`;
    } else if (type === 'interest') {
        promptText = `Interests: ${profile.interests.join(', ')}. (Ignore Industry/Role). Focus strictly on hobbies and personal life.`;
    } else if (type === 'custom') {
        promptText = `Custom Request: "${customPromptInput}". Combine with student level.`;
    }

    const count = type === 'custom' ? customTopicCount : 12;

    const newTopics = await generateCustomTopics(promptText, targetAILevel, count);
    const processedTopics = newTopics.map(t => ({
      ...t, minHours: 2, maxHours: 4, fixedDuration: false, mode: CourseMode.Private, source: 'AI' as const,
      context: type === 'industry' ? profile.industry : (type === 'interest' ? 'Interests' : 'Custom Request')
    }));
    setAiPreviewTopics(processedTopics);
    setLoadingAI(null);
    setShowAIPreview(true);
    setShowAddModal(false);
  };
  
  // Full Path Generation Logic (Replaced by Modal)
  const handleOpenPathGenModal = () => {
    const startRank = CEFR_RANK[profile.currentLevel];
    const endRank = CEFR_RANK[profile.targetLevel];
    const levels: CEFRLevel[] = [];

    // Identify levels present in the modules
    modules.forEach(m => {
        const r = CEFR_RANK[m.level];
        if (r >= startRank && r <= endRank) {
            levels.push(m.level);
        }
    });

    if (levels.length === 0) {
        alert("No matching levels found between Current and Target in the plan. / 在规划中未找到匹配的级别范围。");
        return;
    }

    setPathGenLevels(levels);
    // Reset statuses
    const initialStatus: Record<string, 'idle' | 'loading' | 'success' | 'error'> = {};
    levels.forEach(l => initialStatus[l] = 'idle');
    setPathGenStatus(initialStatus);
    setGenerationRationale(null);
    setShowPathGenConfig(true); // Always start with config
    
    setShowPathGenModal(true);
    setShowAddModal(false);
  };

  const generateLevelContent = async (level: CEFRLevel) => {
    setPathGenStatus(prev => ({ ...prev, [level]: 'loading' }));
    
    let promptText = "";
    const interests = profile.interests.join(', ') || "General";
    const jobInfo = `Industry: ${profile.industry}, Role: ${profile.role}, Job Desc: ${profile.jobDescription || "N/A"}`;

    switch (pathGenStrategy) {
        case PathGenStrategy.Interest:
            promptText = `Focus STRICTLY on student interests: ${interests}. Ignore job/career context unless explicitly related.`;
            break;
        case PathGenStrategy.Career:
            promptText = `Focus STRICTLY on profession: ${jobInfo}. Ignore hobbies/interests.`;
            break;
        case PathGenStrategy.Hybrid_InterestFirst:
            promptText = `Hybrid Strategy (Interest First): Primary focus on ${interests}, but weave in professional contexts (${jobInfo}) where appropriate.`;
            break;
        case PathGenStrategy.Hybrid_CareerFirst:
            promptText = `Hybrid Strategy (Career First): Primary focus on ${jobInfo}, but weave in personal interests (${interests}) to make it engaging.`;
            break;
        case PathGenStrategy.Custom:
            promptText = `Custom Strategy: ${pathGenCustomPrompt}. Student Context: ${interests}, ${jobInfo}.`;
            break;
        default:
            promptText = `General English with a mix of ${interests} and ${jobInfo}.`;
    }
    
    try {
        const topics = await generateCustomTopics(promptText, level, batchPathTopicCount);
        const processedTopics: Topic[] = topics.map(t => ({
            ...t, minHours: 2, maxHours: 4, fixedDuration: false, mode: CourseMode.Private, source: 'AI' as const,
            context: `Path Gen: ${pathGenStrategy}`
        }));

        setModules(prev => prev.map(m => {
            if (m.level !== level) return m;
            return { ...m, topics: [...m.topics, ...processedTopics] };
        }));
        
        setPathGenStatus(prev => ({ ...prev, [level]: 'success' }));
    } catch (e) {
        console.error(e);
        setPathGenStatus(prev => ({ ...prev, [level]: 'error' }));
    }
  };

  const handleGenerateAllPath = async () => {
    setShowPathGenConfig(false);
    for (const level of pathGenLevels) {
        if (pathGenStatus[level] === 'success') continue; 
        await generateLevelContent(level);
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    const rationale = await generatePathGenerationRationale(profile, pathGenStrategy);
    setGenerationRationale(rationale);
  };

  const handleRegeneratePreview = async () => {
    setShowAIPreview(false);
    setShowAddModal(true);
  };

  const confirmImport = () => {
    const levelToAdd = modalMode === 'ai' ? targetAILevel : activeLevel;
    if (levelToAdd && modules.some(m => m.level === levelToAdd)) {
       aiPreviewTopics.forEach(t => addTopic(levelToAdd, t));
       if (levelToAdd !== activeLevel) setActiveLevel(levelToAdd);
    }
    setShowAIPreview(false);
  };

  const handleAddPack = (packTopics: PackTopicData[], category: TopicCategory, packName: string) => {
     const newTopics: Topic[] = packTopics.map(pt => ({
       id: Math.random().toString(36).substr(2, 9),
       title: pt.title, category, minHours: 2, maxHours: 4, isBusinessSkill: category === TopicCategory.BusinessSkills,
       fixedDuration: false, mode: CourseMode.Private, practicalScenario: pt.scenario, source: 'System' as const, context: packName
     }));
     setAiPreviewTopics(newTopics);
     setShowAIPreview(true);
     setShowAddModal(false);
  };

  const handleAddOfficialTopicAsCustom = (t: Topic) => {
     const newTopic: Topic = {
         ...t,
         id: Math.random().toString(36).substr(2, 9),
         mode: CourseMode.Private,
         fixedDuration: false,
         minHours: 2, maxHours: 4,
         source: 'System',
         category: TopicCategory.Official
     };
     addTopic(activeLevel!, newTopic);
     alert("Topic added to Custom list!");
  };

  const adjustSupplementaryHours = (level: CEFRLevel, delta: number) => {
    setModules(prev => prev.map(m => {
      if (m.level !== level) return m;
      let suppTopic = m.topics.find(t => t.category === TopicCategory.Supplementary && t.title.includes("Supplementary Practice"));
      if (!suppTopic) {
         if (delta < 0) return m; 
         suppTopic = {
           id: Math.random().toString(36).substr(2, 9), title: "在线补充练习 / Online Supplementary Practice",
           category: TopicCategory.Supplementary, minHours: 0, maxHours: 0, fixedDuration: false, mode: CourseMode.Private, source: 'System'
         };
         return { ...m, topics: [...m.topics, { ...suppTopic, minHours: delta, maxHours: delta }] };
      } else {
         const newHours = Math.max(0, suppTopic.minHours + delta);
         if (newHours === 0) return { ...m, topics: m.topics.filter(t => t.id !== suppTopic!.id) };
         return { ...m, topics: m.topics.map(t => t.id === suppTopic!.id ? { ...t, minHours: newHours, maxHours: newHours } : t) };
      }
    }));
  };

  const calculateTotalStats = () => {
    let totalHours = 0; let totalSessions = 0; let totalPrivateHours = 0; let totalGroupHours = 0; let totalOnlineHours = 0;
    modules.forEach(m => {
       m.topics.forEach(t => {
           const duration = (t.minHours + t.maxHours) / 2;
           const title = t.title || "";
           if(t.category === TopicCategory.Supplementary) {
               if(title.includes("RS Hybrid")) totalOnlineHours += 4 * 12; 
               else if(title.includes("Online Group")) totalOnlineHours += 2 * 12;
               else totalOnlineHours += duration;
           } else if(t.mode === CourseMode.Group || t.fixedDuration) totalGroupHours += duration;
           else {
               totalPrivateHours += duration;
               totalSessions += Math.ceil(duration / ((profile.sessionDurationMinutes || 60)/60));
           }
       });
    });
    const totalOffline = totalPrivateHours + totalGroupHours;
    totalHours = totalOffline + totalOnlineHours;
    totalSessions += (totalGroupHours / 1.5); 
    const weeks = Math.ceil(totalSessions / (profile.weeklyFrequency || 2));
    const months = (weeks / 4.33).toFixed(1);
    const totalGroupTopics = Math.round(totalGroupHours / 1.5);
    return { totalHours, totalSessions, months, totalPrivateHours, totalGroupHours, totalOnlineHours, totalGroupTopics };
  }

  const isOfficialTopicRecommended = (title: string, scenario: string = '') => {
      const textToCheck = (title + " " + scenario).toLowerCase();
      const checkMatch = (sourceText: string) => {
          if(!sourceText) return false;
          const keywords = sourceText.toLowerCase().split(/[\s/&,]+/).filter(k => k.length > 2 && !['and','the','for'].includes(k));
          return keywords.some(k => textToCheck.includes(k));
      };
      if (checkMatch(profile.industry)) return true;
      if (checkMatch(profile.role)) return true;
      if (checkMatch(profile.jobDescription || '')) return true;
      if (profile.goals.some(g => checkMatch(g))) return true;
      if (profile.interests.some(i => checkMatch(i))) return true;
      return false;
  };

  const checkLevelCompatibility = (packLevel: CEFRLevel, currentLevel: CEFRLevel | null, category: string) => {
      if (!currentLevel) return true;
      const packRank = CEFR_RANK[packLevel];
      const activeRank = CEFR_RANK[currentLevel];
      const diff = activeRank - packRank; 
      if (diff < -1) return false;
      const isSpecialized = category === TopicCategory.Industry || category === TopicCategory.JobRole || category === TopicCategory.BusinessSkills;
      if (isSpecialized) {
          return diff <= 4;
      } else {
          return diff <= 2;
      }
  };

  const getRecommendedPacks = () => {
    const recs: { pack: any, reason: string }[] = [];
    const allPacks = Object.entries(SPECIALTY_PACKS).flatMap(([category, packs]) => 
        packs.map(pack => ({ ...pack, category }))
    );
    const checkMatch = (sourceText: string, packName: string) => {
        if (!sourceText) return false;
        const keywords = sourceText.toLowerCase().split(/[\s/&,]+/).filter(k => k.length > 1);
        return keywords.some(k => packName.toLowerCase().includes(k));
    };
    allPacks.forEach(pack => {
        if (!checkLevelCompatibility(pack.minLevel, activeLevel, pack.category)) return;
        const isWorkPack = pack.category === TopicCategory.Industry || pack.category === TopicCategory.JobRole || pack.category === TopicCategory.BusinessSkills;
        if (isWorkPack) {
            if (checkMatch(profile.industry, pack.name)) { recs.push({ pack, reason: "Matches Industry" }); return; }
            if (checkMatch(profile.role, pack.name)) { recs.push({ pack, reason: "Matches Role" }); return; }
            if (checkMatch(profile.jobDescription || '', pack.name)) { recs.push({ pack, reason: "Matches Job Desc" }); return; }
        } else {
            if (profile.goals.some(g => checkMatch(g, pack.name))) { recs.push({ pack, reason: "Matches Goals" }); return; }
            if (profile.interests.some(i => checkMatch(i, pack.name))) { recs.push({ pack, reason: "Matches Interests" }); return; }
        }
    });
    return recs.filter((v,i,a)=>a.findIndex(t=>(t.pack.name===v.pack.name))===i);
  };

  if (!isSystemLoaded) return null;
  const totalStats = calculateTotalStats();
  const activeModule = activeLevel ? modules.find(m => m.level === activeLevel) : undefined;
  const recommendedPacks = getRecommendedPacks();
  
  const totalPrivateSessions = totalStats.totalPrivateHours / 0.75;
  const formattedTotalSessions = Number.isInteger(totalPrivateSessions) ? totalPrivateSessions : totalPrivateSessions.toFixed(1);

  return (
    <div className="space-y-8">
      {batchGenerating && !showPathGenModal && (
        <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center">
           <div className="bg-white text-gray-900 px-10 py-8 rounded-2xl text-base font-bold flex flex-col items-center shadow-2xl border border-gray-200 max-w-sm w-full">
             <div className="animate-spin mb-4 h-10 w-10 text-gold-600 rounded-full border-4 border-gold-200 border-t-gold-600"></div>
             <div className="text-xl mb-1 text-center">Batch Generating...</div>
             <div className="text-sm text-gray-500 mb-4 text-center font-normal px-4 truncate w-full">
                Processing: {batchProgress.currentTopicTitle}
             </div>
             <div className="text-gold-600 text-3xl font-mono mb-2">{batchProgress.current} / {batchProgress.total}</div>
             <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div className="bg-gold-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}></div>
             </div>
           </div>
        </div>
      )}

      {/* Path Gen Modal */}
      {showPathGenModal && (
        <div className="fixed inset-0 bg-black/80 z-[10000] flex items-center justify-center p-4 print:hidden">
           <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full flex flex-col overflow-hidden max-h-[90vh]">
              <div className="p-5 border-b border-gray-200 bg-navy-50 flex justify-between items-center">
                 <div>
                    <h3 className="text-lg font-bold text-navy-900">Path Generation Manager</h3>
                    <p className="text-xs text-navy-600">Generating content from Level {pathGenLevels[0]} to {pathGenLevels[pathGenLevels.length-1]}</p>
                 </div>
                 <button onClick={() => setShowPathGenModal(false)} className="text-gray-400 hover:text-gray-600 font-bold p-1">X</button>
              </div>
              <div className="flex-1 overflow-y-auto bg-white p-5">
                 {showPathGenConfig ? (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-2">Generation Strategy / 生成策略</label>
                            <select 
                                value={pathGenStrategy} 
                                onChange={(e) => setPathGenStrategy(e.target.value as PathGenStrategy)}
                                className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 bg-white focus:ring-2 focus:ring-gold-500 shadow-sm font-medium"
                            >
                                {Object.values(PathGenStrategy).map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        {pathGenStrategy === PathGenStrategy.Custom && (
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">Custom Instruction / 自定义指令</label>
                                <textarea 
                                    value={pathGenCustomPrompt} 
                                    onChange={(e) => setPathGenCustomPrompt(e.target.value)}
                                    placeholder="E.g., Focus on legal terminology..."
                                    className="w-full border border-gray-300 rounded-lg p-3 h-24 text-gray-900 focus:ring-2 focus:ring-gold-500"
                                />
                            </div>
                        )}
                        <div className="bg-navy-50 border border-navy-100 p-4 rounded-lg">
                            <h4 className="font-bold text-navy-800 text-sm mb-2">Summary of Request</h4>
                            <div className="text-xs text-navy-700 space-y-1">
                                <p><strong>Student:</strong> {profile.name}</p>
                                <p><strong>Levels:</strong> {pathGenLevels.length} Levels</p>
                                <p><strong>Topics per Level:</strong> {batchPathTopicCount}</p>
                            </div>
                        </div>
                    </div>
                 ) : (
                    <div className="space-y-4">
                        <div className="space-y-3">
                            {pathGenLevels.map(level => (
                                <div key={level} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center font-bold text-xs text-gray-700 shadow-sm">{level}</div>
                                        <div className={`text-sm flex items-center gap-2 ${pathGenStatus[level] === 'success' ? 'text-green-600 font-bold' : pathGenStatus[level] === 'loading' ? 'text-navy-600 font-bold' : 'text-gray-400'}`}>
                                            {pathGenStatus[level] === 'loading' ? 'Generating...' : pathGenStatus[level] === 'success' ? 'Done' : 'Pending'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {generationRationale && (
                            <div className="mt-4 bg-navy-50 border border-navy-200 rounded-lg p-4 animate-fade-in">
                                <h4 className="text-sm font-bold text-navy-900 mb-2">Strategy Rationale</h4>
                                <p className="text-xs text-navy-800 leading-relaxed whitespace-pre-wrap">{generationRationale}</p>
                            </div>
                        )}
                    </div>
                 )}
              </div>
              <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                 <button onClick={() => setShowPathGenModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm">
                    {generationRationale ? 'Finish' : 'Cancel'}
                 </button>
                 {showPathGenConfig && (
                     <button onClick={handleGenerateAllPath} className="px-6 py-2 bg-navy-800 text-white rounded-lg hover:bg-navy-900 font-bold shadow-md text-sm">
                        Start Generation
                     </button>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 print:border-none print:shadow-none break-inside-avoid">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Learning Path Overview / 学习路径概览</h3>
        <div className="mb-6 grid grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg text-center">
           <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Total Duration / 总周期</div>
              <div className="font-bold text-gold-600 text-xl">{totalStats.months} Months (月)</div>
           </div>
           <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Private (1v1) / 私教</div>
              <div className="font-bold text-gray-800 text-xl">{totalStats.totalPrivateHours}h <span className="text-sm font-normal text-gray-500">({formattedTotalSessions} Sessions)</span></div>
           </div>
           <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Group Class / 班课</div>
              <div className="font-bold text-gray-800 text-xl">{totalStats.totalGroupHours}h <span className="text-sm font-normal text-gray-500">({totalStats.totalGroupTopics} Topics)</span></div>
           </div>
           <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Online/Supp / 在线补充</div>
              <div className="font-bold text-gold-600 text-xl">{totalStats.totalOnlineHours}h</div>
           </div>
        </div>
        {!isPreviewMode && (
        <div className="relative h-40 flex items-center justify-between px-4 sm:px-10 overflow-x-auto print:hidden">
           <div className="absolute top-1/2 left-10 right-10 h-1 bg-gray-200 -z-0 min-w-[300px]"></div>
           {modules.map((m, index) => {
             const isActive = activeLevel === m.level;
             return (
               <button 
                 key={m.id}
                 onClick={() => setActiveLevel(m.level)}
                 className={`relative z-10 flex flex-col items-center group transition-all transform flex-shrink-0 mx-4 ${isActive ? 'scale-110' : 'hover:scale-105'}`}
               >
                 <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold shadow-md border-4 transition-colors ${isActive ? 'bg-navy-800 text-white border-gold-500' : 'bg-white text-gray-600 border-gray-200'}`}>
                   {m.level}
                 </div>
                 <span className={`mt-2 text-xs font-bold uppercase ${isActive ? 'text-navy-700' : 'text-gray-500'}`}>
                   Step {index + 1}
                 </span>
               </button>
             )
           })}
        </div>
        )}
      </div>

      {showVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">CEFR Verification / 规划验证</h3>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {modules.length === 0 && <div className="text-gray-500 text-center">No modules generated yet.</div>}
              {modules.map(m => {
                 let priv = 0, grp = 0, supp = 0;
                 m.topics.forEach(t => {
                     const d = (t.minHours + t.maxHours)/2;
                     const title = t.title || "";
                     if(t.category === TopicCategory.Supplementary) {
                        if (title.includes("RS Hybrid")) supp += 48;
                        else if (title.includes("Online Group Class")) supp += 24;
                        else supp += d;
                     }
                     else if(t.mode === CourseMode.Group || t.fixedDuration) grp += d;
                     else priv += d;
                 });
                 const required = OFFICIAL_CURRICULUM.find(c => c.level === m.level)?.baseHoursRequired || 0;
                 const total = priv + grp + supp;
                 const isPassed = total >= required;

                 return (
                   <div className={`p-4 rounded border ${isPassed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                     <div className="flex justify-between font-bold items-center mb-2">
                       <span className="text-lg text-navy-800">Level {m.level}</span>
                       <span className={`text-sm border px-3 py-1 rounded-full font-bold ${isPassed ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                          {total}h / {required}h Req {isPassed ? '✅' : '⚠️'}
                       </span>
                     </div>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-700 mb-3 bg-white p-3 rounded shadow-sm">
                        <div>Private (1v1): <b className="text-gray-900">{priv}h</b></div>
                        <div>Group Class: <b className="text-gray-900">{grp}h</b></div>
                        <div>Online/Supp: <b className="text-gray-900">{supp}h</b></div>
                     </div>
                     <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                        <span className="text-xs text-gray-500 font-bold uppercase">Quick Add Supp Hours:</span>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => adjustSupplementaryHours(m.level, -2)} className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold text-gray-600">-</button>
                          <button onClick={() => adjustSupplementaryHours(m.level, 2)} className="w-8 h-8 rounded bg-gold-100 text-gold-700 hover:bg-gold-200 flex items-center justify-center font-bold">+</button>
                        </div>
                     </div>
                   </div>
                 )
              })}
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowVerification(false)} className="px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 font-bold">Close / 关闭</button>
            </div>
          </div>
        </div>
      )}

      {/* Syllabus Modal - REACTIVE RE-DESIGN */}
      {selectedTopicForSyllabus && activeSyllabusTracking && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 print:hidden">
           <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col relative overflow-hidden animate-fade-in">
              <div className="p-6 bg-gradient-to-r from-navy-900 to-navy-800 text-white rounded-t-xl flex flex-col shrink-0 relative z-10">
                 <div className="flex justify-between items-start">
                     <div>
                        <div className="text-gold-200 text-xs font-bold uppercase tracking-wider mb-1">Course Syllabus Overview</div>
                        <h2 className="text-2xl font-bold">{selectedTopicForSyllabus.title}</h2>
                        <p className="text-gray-300 mt-1 opacity-90">{selectedTopicForSyllabus.practicalScenario}</p>
                     </div>
                     <div className="flex gap-2 items-center">
                       <button onClick={() => setShowRegenerateInput(!showRegenerateInput)} className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm font-medium flex items-center transition-colors" title="Refine and Regenerate">
                          Regenerate / 重新生成
                       </button>
                       <div className="flex bg-white/10 rounded overflow-hidden">
                           <button onClick={downloadSyllabusPDF} className="px-3 py-1 hover:bg-white/20 text-white text-sm font-bold flex items-center border-r border-white/20 transition-colors">
                              PDF
                           </button>
                           <button onClick={downloadSyllabusImage} className="px-3 py-1 hover:bg-white/20 text-white text-sm font-bold flex items-center transition-colors">
                              IMG
                           </button>
                       </div>
                       <button onClick={() => setActiveSyllabusTracking(null)} className="text-white hover:bg-white/20 p-2 rounded-full ml-2 transition-colors">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                       </button>
                     </div>
                 </div>
                 {showRegenerateInput && (
                    <div className="mt-4 bg-white/10 p-3 rounded-lg flex gap-2 animate-fade-in">
                       <input 
                         type="text" 
                         value={syllabusRefineText} 
                         onChange={(e) => setSyllabusRefineText(e.target.value)} 
                         placeholder="Add specific instructions (e.g. Focus on medical terms)..." 
                         className="flex-1 bg-white/90 text-gray-800 rounded px-3 py-2 text-sm" 
                         autoFocus
                       />
                       <button 
                         onClick={() => generateSyllabusForTopic(activeSyllabusTracking.level, activeSyllabusTracking.topicId, syllabusRefineText || 'Regenerate')} 
                         className="bg-navy-800 hover:bg-navy-900 text-white px-4 py-2 rounded text-sm font-bold min-w-[100px] flex items-center justify-center disabled:opacity-50"
                         disabled={isRegeneratingSyllabus}
                       >
                         {isRegeneratingSyllabus ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                              Working
                            </>
                         ) : 'Start'}
                       </button>
                    </div>
                 )}
              </div>

              <div className="flex-1 overflow-y-auto bg-gray-50 flex justify-center relative">
                 <div className="w-full bg-white max-w-4xl min-h-full relative" ref={syllabusContentRef}>
                     <Watermark />
                     <div className="p-8 relative z-10">
                         <div className="mb-6 border-b pb-4 flex justify-between items-end">
                             <div>
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Marvellous Education Syllabus</div>
                                <h2 className="text-3xl font-bold text-gray-900">{selectedTopicForSyllabus.title}</h2>
                                <p className="text-gray-600 mt-2 text-lg">{selectedTopicForSyllabus.practicalScenario}</p>
                             </div>
                             <div className="opacity-100">
                                <MarvellousLogo className="h-12" />
                             </div>
                         </div>
                         {selectedTopicForSyllabus.syllabus && selectedTopicForSyllabus.syllabus.coreVocab ? (
                            <div className="grid grid-cols-1 gap-8 animate-fade-in">
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm">
                                     <h4 className="font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2 flex items-center justify-between">
                                      <div className="flex items-center"><span className="bg-navy-800 text-white text-xs px-2 py-0.5 rounded mr-2">01</span>Core Vocabulary</div>
                                      <span className="text-[10px] text-gray-400 font-normal">{selectedTopicForSyllabus.syllabus.coreVocab.length} items</span>
                                    </h4>
                                    <ul className="space-y-4">
                                      {(selectedTopicForSyllabus.syllabus.coreVocab || []).map((v, i) => (
                                        <li key={i} className="text-sm">
                                          <div className="flex items-center flex-wrap gap-2">
                                            <span className="font-bold text-gray-900 text-base">{v.word}</span>
                                            {v.pronunciation && <span className="text-gray-500 font-mono text-xs bg-white px-1.5 border rounded">{v.pronunciation}</span>}
                                          </div>
                                          <div className="text-gray-700 font-medium text-xs mt-1">{v.meaning}</div>
                                          <div className="text-gray-500 italic text-xs mt-0.5 border-l-2 border-gold-200 pl-2">"{v.context}"</div>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm">
                                     <h4 className="font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2 flex items-center justify-between">
                                       <div className="flex items-center"><span className="bg-navy-600 text-white text-xs px-2 py-0.5 rounded mr-2">02</span>Key Sentences</div>
                                       <span className="text-[10px] text-gray-400 font-normal">{selectedTopicForSyllabus.syllabus.coreSentences.length} items</span>
                                     </h4>
                                     <ul className="space-y-3">
                                       {(selectedTopicForSyllabus.syllabus.coreSentences || []).map((s, i) => (
                                         <li key={i} className="text-sm pl-3 border-l-2 border-navy-300 bg-white p-2 rounded shadow-sm">
                                           <div className="text-gray-900 font-medium">{s.sentence}</div>
                                           <div className="text-gray-500 text-xs mt-0.5">{s.translation}</div>
                                         </li>
                                       ))}
                                     </ul>
                                  </div>
                               </div>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm">
                                    <h4 className="font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2 flex items-center justify-between">
                                      <div className="flex items-center"><span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded mr-2">03</span>Native Expressions</div>
                                      <span className="text-[10px] text-gray-400 font-normal">{selectedTopicForSyllabus.syllabus.advancedExpressions.length} items</span>
                                    </h4>
                                    <ul className="space-y-4">
                                      {(selectedTopicForSyllabus.syllabus.advancedExpressions || []).map((e, i) => (
                                        <li key={i} className="text-sm">
                                          <div className="font-bold text-purple-700 text-base">{e.expression}</div>
                                          <div className="text-gray-700 text-xs mb-1">{e.translation}</div>
                                          <div className="text-gray-600 text-xs bg-white p-2 rounded border border-gray-100"><span className="font-bold text-purple-400 mr-1">💡 Nuance:</span>{e.nuance}</div>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div className="space-y-6">
                                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm">
                                        <h4 className="font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2 flex items-center justify-between">
                                          <div className="flex items-center"><span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded mr-2">04</span>Common Mistakes</div>
                                          <span className="text-[10px] text-gray-400 font-normal">{selectedTopicForSyllabus.syllabus.commonMistakes.length} items</span>
                                        </h4>
                                        <ul className="space-y-3">
                                          {(selectedTopicForSyllabus.syllabus.commonMistakes || []).map((m, i) => (
                                            <li key={i} className="text-sm">
                                               <div className="text-red-500 line-through text-xs mb-0.5">{m.mistake}</div>
                                               <div className="text-green-600 font-bold">✓ {m.correction}</div>
                                               <div className="text-gray-400 text-xs mt-0.5 italic">Reason: {m.reason}</div>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                      {selectedTopicForSyllabus.syllabus.culturalInsight && (
                                        <div className="bg-amber-50 p-5 rounded-lg border border-amber-100 shadow-sm">
                                           <h4 className="font-bold text-amber-900 mb-2 flex items-center text-sm uppercase tracking-wide"><span className="mr-2">🌍</span> Cultural Insight</h4>
                                           <div className="font-bold text-amber-800 mb-1">{selectedTopicForSyllabus.syllabus.culturalInsight.title}</div>
                                           <p className="text-sm text-amber-800 leading-relaxed whitespace-pre-wrap">{selectedTopicForSyllabus.syllabus.culturalInsight.content}</p>
                                        </div>
                                      )}
                                  </div>
                               </div>
                               <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm">
                                  <h4 className="font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">Learning Pyramid (学习大纲)</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                     {(selectedTopicForSyllabus.syllabus.outline || []).map((phase, i) => (
                                       <div key={i} className="bg-white p-3 rounded border border-gray-200 relative overflow-hidden">
                                          <div className={`absolute top-0 left-0 w-1 h-full ${phase.method === 'Input' ? 'bg-navy-500' : phase.method === 'Output' ? 'bg-gold-500' : 'bg-navy-300'}`}></div>
                                          <div className="pl-3">
                                              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Phase {i+1}: {phase.method}</div>
                                              <div className="font-bold text-gray-800 text-sm mb-1">{phase.phase}</div>
                                              <div className="text-gray-600 text-xs">{phase.activity}</div>
                                          </div>
                                       </div>
                                     ))}
                                  </div>
                               </div>
                            </div>
                         ) : (
                           <div className="text-center py-32 flex flex-col items-center justify-center">
                              <div className="relative">
                                 <div className="w-16 h-16 border-4 border-gold-100 border-t-gold-500 rounded-full animate-spin"></div>
                                 <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-gold-600 font-bold text-xs">AI</span>
                                 </div>
                              </div>
                              <h4 className="mt-6 text-xl font-bold text-gray-800">Generating Syllabus...</h4>
                              <p className="text-gray-500 mt-2 max-w-md text-center">Crafting personalized vocabulary, expressions, and lesson plan based on <b>{profile.industry}</b> and <b>{profile.interests.join(', ')}</b>...</p>
                           </div>
                         )}
                     </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {showAIPreview && (
         <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 print:hidden">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
               <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Review Topics / 确认话题内容</h3>
                    <p className="text-sm text-gray-500">Review descriptions and pain points before adding to plan.</p>
                  </div>
                  <button onClick={handleRegeneratePreview} className="text-sm text-gold-600 hover:text-gold-800 font-bold underline">
                     Regenerate / 重新生成
                  </button>
               </div>
               <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                  {aiPreviewTopics.map((t, idx) => (
                    <div key={idx} className="flex flex-col gap-2 mb-3 bg-white p-4 rounded shadow-sm border border-gray-100">
                       <div className="flex items-center gap-2">
                         <input type="text" value={t.title} onChange={(e) => { const newTopics = [...aiPreviewTopics]; newTopics[idx].title = e.target.value; setAiPreviewTopics(newTopics); }} className="flex-1 border border-gray-300 rounded text-sm p-2 text-gray-900 font-bold bg-white" />
                         <button onClick={() => setAiPreviewTopics(aiPreviewTopics.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 px-2 font-bold">X</button>
                       </div>
                       <input type="text" value={t.practicalScenario || ''} placeholder="Scenario / Pain point" onChange={(e) => { const newTopics = [...aiPreviewTopics]; newTopics[idx].practicalScenario = e.target.value; setAiPreviewTopics(newTopics); }} className="w-full border border-gray-200 rounded text-xs p-2 text-gray-600 bg-gray-50" />
                    </div>
                  ))}
               </div>
               <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-white rounded-b-xl">
                  <button onClick={() => setShowAIPreview(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel / 取消</button>
                  <button onClick={confirmImport} className="px-6 py-2 bg-navy-800 text-white rounded hover:bg-navy-900 shadow font-bold">Confirm & Add / 确认添加</button>
               </div>
            </div>
         </div>
      )}

      {isPreviewMode ? (
         <div className="space-y-4">
            {modules.map(module => (
               <div key={module.id}>
                 <ModuleView 
                    module={module} profile={profile} showTools={false} isPreviewMode={true}
                    generatingTopicId={null}
                    onRemoveTopic={()=>{}} onUpdateTopicHours={()=>{}} onHandleTopicClick={()=>{}}
                    onUpdateStandardTrack={()=>{}} onRemoveAllCustom={()=>{}} onRemoveAllStandard={()=>{}}
                    onShowAddModal={()=>{}} onBatchGenerate={()=>{}} onSetAllDurations={()=>{}}
                    onAddSupplementary={()=>{}} onVerifyLevel={()=>{}} allModules={modules}
                 />
               </div>
            ))}
         </div>
      ) : (
         <div className="print:hidden">
             {activeModule && (
                <ModuleView 
                    module={activeModule}
                    profile={profile}
                    showTools={true}
                    isPreviewMode={false}
                    generatingTopicId={generatingTopicId}
                    onRemoveTopic={removeTopic}
                    onUpdateTopicHours={updateTopicHours}
                    onHandleTopicClick={handleTopicClick}
                    onUpdateStandardTrack={updateStandardTrack}
                    onRemoveAllCustom={removeAllCustomTopics}
                    onRemoveAllStandard={removeAllStandardTopics}
                    onShowAddModal={() => setShowAddModal(true)}
                    onBatchGenerate={handleBatchGenerateSyllabi}
                    onSetAllDurations={setAllPrivateDurations}
                    onAddSupplementary={addSupplementaryCourse}
                    onVerifyLevel={() => setShowVerification(true)}
                    allModules={modules}
                />
             )}
         </div>
      )}
      
      {showAddModal && !isPreviewMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Add Content to Level {activeLevel}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">X</button>
            </div>
            <div className="flex border-b border-gray-100">
              <button onClick={() => setModalMode('packs')} className={`flex-1 py-3 font-medium text-sm ${modalMode === 'packs' ? 'text-navy-800 border-b-2 border-gold-500' : 'text-gray-500'}`}>Topic Packs / 话题包</button>
              <button onClick={() => setModalMode('official')} className={`flex-1 py-3 font-medium text-sm ${modalMode === 'official' ? 'text-navy-800 border-b-2 border-gold-500' : 'text-gray-500'}`}>Official Topics / 官方话题</button>
              <button onClick={() => setModalMode('ai')} className={`flex-1 py-3 font-medium text-sm ${modalMode === 'ai' ? 'text-navy-800 border-b-2 border-gold-500' : 'text-gray-500'}`}>AI Generator / AI生成</button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
              {modalMode === 'packs' && (
                <div className="space-y-6">
                   <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Search packs... / 搜索话题包关键词..." 
                        value={packSearchTerm}
                        onChange={(e) => setPackSearchTerm(e.target.value)}
                        className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg py-2 px-4 pl-10 focus:ring-2 focus:ring-gold-500 focus:border-gold-500 placeholder-gray-400"
                      />
                      <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                   </div>

                   {!packSearchTerm && recommendedPacks.length > 0 && (
                      <div key="Recommended" className="bg-gradient-to-r from-navy-50 to-white p-4 rounded-lg border border-navy-100">
                         <h4 className="text-sm font-bold text-navy-800 uppercase tracking-wider mb-3 flex items-center">
                            <span className="mr-2 text-xl">💡</span> Recommended For You / 智能推荐
                         </h4>
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {recommendedPacks.map(({ pack, reason }) => (
                                <button key={`rec-${pack.name}`} onClick={() => handleAddPack(pack.topics, TopicCategory.Popular, pack.name)} className="text-left p-4 border rounded-lg transition-all group relative bg-white hover:border-gold-500 hover:shadow-md border-navy-200">
                                    <div className="absolute top-2 right-2 text-[10px] bg-navy-100 text-navy-800 px-2 py-0.5 rounded-full font-bold">{reason}</div>
                                    <div className="font-semibold text-gray-800 mb-1 pr-6">{pack.name}</div>
                                    <div className="flex justify-between items-center text-xs text-gray-500"><span>{pack.topics.length} topics</span><span className="font-bold bg-gray-100 px-1 rounded">{pack.minLevel}</span></div>
                                </button>
                            ))}
                         </div>
                      </div>
                   )}

                   {!packSearchTerm && SPECIALTY_PACKS[TopicCategory.Popular] && (
                     <div key="Popular">
                       <h4 className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-3 flex items-center"><span className="mr-1">🔥</span> Popular for {activeLevel}</h4>
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                         {SPECIALTY_PACKS[TopicCategory.Popular].filter(pack => {
                            const packRank = CEFR_RANK[pack.minLevel];
                            const activeRank = activeLevel ? CEFR_RANK[activeLevel] : 0;
                            return Math.abs(packRank - activeRank) <= 1;
                         }).map(pack => (
                             <button key={pack.name} onClick={() => handleAddPack(pack.topics, TopicCategory.Popular, pack.name)} className="text-left p-4 border rounded-lg transition-all group relative bg-orange-50 border-orange-200 hover:border-orange-500 hover:shadow-md">
                               <div className="font-semibold text-gray-800 mb-1">{pack.name}</div>
                               <div className="flex justify-between items-center text-xs text-gray-500"><span>{pack.topics.length} topics</span><span className="font-bold bg-white px-1 rounded border border-orange-100">{pack.minLevel}</span></div>
                             </button>
                         ))}
                       </div>
                     </div>
                   )}

                   {Object.entries(SPECIALTY_PACKS).map(([cat, packs]) => {
                     if (cat === TopicCategory.Popular && !packSearchTerm) return null;
                     
                     const isFullTimeParent = profile.role === "Full-time Parent / 全职家长";
                     const hasBusinessFocus = profile.learningDirections.includes(LearningDirection.Business);
                     
                     if (!packSearchTerm && isFullTimeParent && !hasBusinessFocus && (cat === TopicCategory.BusinessSkills || cat === TopicCategory.Industry)) return null;

                     const filteredPacks = packs.filter(pack => {
                        if (packSearchTerm) {
                            const term = packSearchTerm.toLowerCase();
                            const matchesPackName = pack.name.toLowerCase().includes(term);
                            const matchesTopics = pack.topics.some(t => t.title.toLowerCase().includes(term) || t.scenario.toLowerCase().includes(term));
                            return matchesPackName || matchesTopics;
                        }
                        if (!checkLevelCompatibility(pack.minLevel, activeLevel, cat)) return false;
                        const matchesDir = pack.directions.some(dir => profile.learningDirections.includes(dir));
                        return matchesDir;
                     });
                     
                     if (filteredPacks.length === 0) return null;

                     return (
                       <div key={cat}>
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{cat}</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredPacks.map(pack => (
                                <button key={pack.name} onClick={() => handleAddPack(pack.topics, cat as TopicCategory, pack.name)} className="text-left p-4 border rounded-lg transition-all group relative bg-white hover:border-gold-500">
                                  <div className="font-semibold text-gray-800 mb-1">{pack.name}</div>
                                  <div className="flex justify-between items-center text-xs text-gray-500"><span>{pack.topics.length} topics</span><span className="font-bold bg-gray-100 px-1 rounded">{pack.minLevel}</span></div>
                                </button>
                            ))}
                          </div>
                       </div>
                     );
                   })}
                </div>
              )}
              
              {modalMode === 'official' && (
                <div>
                   {(() => {
                       const config = OFFICIAL_CURRICULUM.find(c => c.level === activeLevel);
                       const isBusiness = config?.type === CourseType.Business;
                       
                       return (
                           <div className="space-y-8">
                               <div>
                                   <h4 className="text-sm font-bold text-navy-800 mb-3 border-b border-navy-100 pb-1">
                                       Main Curriculum ({isBusiness ? 'Business Track' : 'General Track'})
                                   </h4>
                                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {config?.officialTopics.map((t, i) => {
                                         const isRecommended = isOfficialTopicRecommended(t.title, t.practicalScenario);
                                         return (
                                             <button key={i} onClick={() => handleAddOfficialTopicAsCustom(t)} className={`text-left p-3 border rounded transition-all relative group ${isRecommended ? 'bg-navy-50 border-navy-300 hover:bg-navy-100 shadow-sm' : 'bg-white border-gray-200 hover:border-gold-500 hover:bg-navy-50'}`}>
                                                 {isRecommended && <div className="absolute -top-2 -right-2 bg-gold-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-sm z-10">Recommended</div>}
                                                 <div className="font-bold text-gray-800 text-sm mb-1">{t.title}</div>
                                                 <div className="text-xs text-gray-500">{t.practicalScenario || "Standard Topic"}</div>
                                             </button>
                                         );
                                      })}
                                   </div>
                               </div>
                               
                               {config?.alternateTopics && config.alternateTopics.length > 0 && (
                                   <div>
                                       <h4 className="text-sm font-bold text-gold-800 mb-3 border-b border-gold-100 pb-1">
                                           Alternate Curriculum ({isBusiness ? 'Life/General Supplement' : 'Alternate Topics'})
                                       </h4>
                                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                          {config.alternateTopics.map((t, i) => {
                                             const isRecommended = isOfficialTopicRecommended(t.title, t.practicalScenario);
                                             return (
                                                 <button key={`alt-${i}`} onClick={() => handleAddOfficialTopicAsCustom(t)} className={`text-left p-3 border rounded transition-all relative group ${isRecommended ? 'bg-gold-50 border-gold-300 hover:bg-gold-100 shadow-sm' : 'bg-white border-gray-200 hover:border-gold-500 hover:bg-gold-50'}`}>
                                                     {isRecommended && <div className="absolute -top-2 -right-2 bg-gold-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-sm z-10">Recommended</div>}
                                                     <div className="font-bold text-gray-800 text-sm mb-1">{t.title}</div>
                                                     <div className="text-xs text-gray-500">{t.practicalScenario || "Alternate Topic"}</div>
                                                 </button>
                                             );
                                          })}
                                       </div>
                                   </div>
                               )}
                           </div>
                       );
                   })()}
                </div>
              )}

              {modalMode === 'ai' && (
                <div className="space-y-6">
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-4">
                       <label className="block text-sm font-bold text-gray-700 mb-2">Target Level for AI Generation / AI生成目标等级:</label>
                       <select className="w-full border border-gray-300 rounded p-2 text-gray-900 bg-white" value={targetAILevel} onChange={(e) => setTargetAILevel(e.target.value as CEFRLevel)}>
                         {Object.values(CEFRLevel).map(l => <option key={l} value={l}>{l}</option>)}
                       </select>
                    </div>

                    <div className="bg-gradient-to-r from-navy-900 to-navy-800 p-6 rounded-xl shadow-md text-white">
                        <h4 className="font-bold text-lg mb-2">🚀 Generate Full Learning Path / 生成完整学习路径 ({profile.currentLevel} → {profile.targetLevel})</h4>
                        <p className="text-gray-300 text-sm mb-4">
                            Automatically generate topics for <strong>ALL</strong> levels from current to target, tailored to your profile. / 根据您的档案，自动生成从当前级别到目标级别的所有话题。
                        </p>
                        <div className="flex items-center gap-3">
                           <button 
                             onClick={handleOpenPathGenModal} 
                             disabled={!!loadingAI} 
                             className="bg-white text-navy-900 px-6 py-2 rounded-lg font-bold hover:bg-gray-100 disabled:opacity-50 shadow-sm"
                           >
                              Start Full Path Gen / 开始全路径生成
                           </button>
                           <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-lg">
                               <span className="text-xs font-bold text-white uppercase">Topics per Level / 每级话题数:</span>
                               <select 
                                 className="bg-gray-900 text-white border border-gray-700 rounded p-1 text-sm font-bold focus:ring-gold-500"
                                 value={batchPathTopicCount}
                                 onChange={(e) => setBatchPathTopicCount(Number(e.target.value))}
                               >
                                   <option value={12}>12 Topics</option>
                                   <option value={24}>24 Topics</option>
                                   <option value={36}>36 Topics</option>
                                   <option value={48}>48 Topics</option>
                               </select>
                           </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-6 rounded-xl border border-navy-100 shadow-sm">
                           <h4 className="font-bold text-navy-900 mb-2">Based on Industry & Role / 基于行业与职位</h4>
                           <p className="text-xs text-gray-500 mb-3">Ignores interests. Focuses purely on professional needs for Level {targetAILevel}. / 忽略兴趣。仅关注 Level {targetAILevel} 的职业需求。</p>
                           <button onClick={() => handleAIGenerate('industry')} disabled={!!loadingAI} className="w-full py-3 bg-navy-700 text-white rounded-lg hover:bg-navy-800 disabled:bg-gray-300 font-bold">
                             {loadingAI === 'industry' ? 'Generating... / 生成中...' : 'Preview Topics / 预览话题'}
                           </button>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gold-100 shadow-sm">
                           <h4 className="font-bold text-gold-900 mb-2">Based on Interests / 基于兴趣爱好</h4>
                           <p className="text-xs text-gray-500 mb-3">Ignores job. Focuses purely on hobbies and personal life for Level {targetAILevel}. / 忽略工作。仅关注 Level {targetAILevel} 的兴趣与个人生活。</p>
                           <button onClick={() => handleAIGenerate('interest')} disabled={!!loadingAI} className="w-full py-3 bg-gold-600 text-white rounded-lg hover:bg-gold-700 disabled:bg-gold-300 font-bold">
                             {loadingAI === 'interest' ? 'Generating... / 生成中...' : 'Preview Topics / 预览话题'}
                           </button>
                        </div>
                   </div>

                   <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                       <h4 className="font-bold text-gray-800 mb-2">Pure Custom Prompt / 全自定义提示词</h4>
                       <p className="text-xs text-gray-500 mb-3">Enter any specific requirement (e.g., "Prepare for a medical conference presentation"). / 输入任何特定需求（例如：“准备医学会议演讲”）。</p>
                       
                       <div className="flex gap-2 mb-4">
                           <input 
                              type="text" 
                              className="flex-1 bg-gray-800 text-white border border-gray-600 rounded p-2 text-sm placeholder-gray-400" 
                              placeholder="Enter custom prompt / 输入自定义提示词..."
                              value={customPromptInput}
                              onChange={(e) => setCustomPromptInput(e.target.value)}
                           />
                           <button onClick={() => handleAIGenerate('custom')} disabled={!!loadingAI || !customPromptInput} className="px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 font-bold">
                              {loadingAI === 'custom' ? 'Generating... / 生成中...' : 'Generate / 生成'}
                           </button>
                       </div>

                       <div className="flex items-center gap-3 bg-gray-50 p-3 rounded border border-gray-100">
                           <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Max Topics / 最大话题数:</label>
                           <select 
                             className="bg-gray-800 text-white border border-gray-600 rounded p-2 text-sm w-40 font-medium"
                             value={customTopicCount}
                             onChange={(e) => setCustomTopicCount(Number(e.target.value))}
                           >
                               <option value={12}>12 Topics</option>
                               <option value={24}>24 Topics</option>
                               <option value={36}>36 Topics</option>
                               <option value={48}>48 Topics (Max)</option>
                           </select>
                       </div>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanBuilder;
