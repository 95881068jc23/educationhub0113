
export enum ClassMode {
  OFFLINE = '线下课程 (Offline Class)',
  ONLINE = '在线课程 (Online Class)'
}

export enum ClassType {
  ONE_ON_ONE = '1对1 (1-on-1)',
  SMALL_GROUP = '小班课 (Small Group)',
  PUBLIC_CLASS = '公开课 (Public Class)'
}

export enum Duration {
  MIN_45 = 45,
  MIN_60 = 60,
  MIN_90 = 90,
  MIN_120 = 120,
  MIN_180 = 180
}

export type GeneratorMode = 'full' | 'module' | 'audio' | 'homework_check';
export type AudioContentType = 'dialogue' | 'vocabulary' | 'sentences';

export enum ModuleType {
  GRAMMAR = '语法知识点 (Grammar Points)',
  PRONUNCIATION = '发音技巧 (Pronunciation Skills)',
  VOCAB = '核心词汇详解 (Core Vocabulary)',
  SENTENCES = '核心句式详解 (Key Sentence Structures)',
  IDIOMS = '地道表达详解 (Native Expressions)',
  NATIVE_VS_TEXTBOOK = '地道表达vs书本表达 (Native vs Textbook)',
  CULTURE = '文化背景详解 (Cultural Insights)',
  SYNONYMS = '近义词辨析 (Synonyms Distinction)',
  DIALOGUE = '地道对话编写 (Dialogue Writing)',
  INTERACTIVE = '互动练习 (Interactive Practice)',
  HUMOR = '幽默话术 (Humor Scripts)',
  SUMMARY = '总结及概览 (Summary & Overview)',
  HOMEWORK = '作业生成与布置 (Homework Assignment)'
}

export const INTERACTIVE_MODES = [
  "Pair Work (两两练习)", "Group Discussion (小组讨论)", "Role Play (角色扮演)", 
  "Game (游戏)", "Practice (练习)", "Debate (辩论)"
];

export const HUMOR_TYPES = [
  "Self-deprecating (自嘲)", "Observational (观察式)", "Wordplay/Puns (谐音梗)", 
  "Exaggeration (夸张)", "Call-back (呼应)", "Unexpected Twist (反转)"
];

export const HOMEWORK_TYPES = [
  "Writing Task (写作任务)", "Reading Comprehension (阅读理解)", "Speaking Practice (口语练习)",
  "Vocabulary Drill (词汇训练)", "Grammar Exercise (语法练习)", "Video/Audio Task (视听任务)"
];

export const AGE_RANGES = ["3-6岁 (3-6 Yrs)", "7-12岁 (7-12 Yrs)", "13-17岁 (13-17 Yrs)", "18-30岁 (18-30 Yrs)", "30-40岁 (30-40 Yrs)", "40-50岁 (40-50 Yrs)", "50岁以上 (50+ Yrs)"];
export const CEFR_LEVELS = ["Pre-A1 (Zero Beginner)", "A1 (Beginner)", "A2 (Elementary)", "B1 (Intermediate)", "B2 (Upper Intermediate)", "C1 (Advanced)", "C2 (Proficient)"];

export const INDUSTRIES = [
  "互联网/IT (Internet/IT)", "金融/银行 (Finance/Banking)", "制造业 (Manufacturing)", 
  "教育培训 (Education/Training)", "医疗健康 (Healthcare)", "零售/电商 (Retail/E-commerce)", 
  "房地产/建筑 (Real Estate/Construction)", "传媒/娱乐 (Media/Entertainment)", 
  "物流/运输 (Logistics/Transport)", "政府/公共事业 (Government/Public Sector)", "其他 (Other)"
];

export const JOBS = [
  "软件工程师 (Software Engineer)", "产品经理 (Product Manager)", "销售/客户经理 (Sales/Account Mgr)", 
  "人力资源 (HR)", "市场营销 (Marketing)", "会计/财务分析 (Accounting/Finance)", 
  "项目经理 (Project Manager)", "咨询顾问 (Consultant)", "教师/培训师 (Teacher/Trainer)", 
  "创始人/高管 (Founder/Executive)", "其他 (Other)"
];

export const GOALS = [
  "商务沟通 (Business Comm)", "日常会话 (Daily Convo)", "出国旅游 (Travel)", 
  "考试备考 (IELTS/TOEFL)", "求职面试 (Job Interview)", "邮件/写作 (Email/Writing)", 
  "演讲/展示 (Presentation)", "发音纠正 (Pronunciation)", "词汇扩展 (Vocab Expansion)", 
  "文化理解 (Cultural Insight)", "其他 (Other)"
];

export const INTERESTS = [
  "旅行 (Travel)", "电影/美剧 (Movies/TV)", "音乐 (Music)", "阅读 (Reading)", 
  "运动/健身 (Sports/Fitness)", "科技/数码 (Tech)", "烹饪/美食 (Cooking/Food)", 
  "艺术/设计 (Art/Design)", "理财/投资 (Finance/Investing)", "游戏/电竞 (Gaming)", "其他 (Other)"
];

export interface StudentProfile {
  age?: string;
  industry?: string;
  job?: string;
  goal?: string[]; 
  interests?: string[]; 
  englishLevel?: string;
  // UI helpers for "Other" inputs
  customIndustry?: string;
  customJob?: string;
}

export interface SyllabusInput {
  text: string;
  file?: {
    mimeType: string;
    data: string; // Base64 encoded data
    name: string;
  };
}

export interface GeneratorFormData {
  mode: GeneratorMode;
  syllabus: SyllabusInput;
  classMode: ClassMode;
  classType: ClassType;
  duration: Duration;
  studentProfiles: StudentProfile[]; // Array of profiles
  moduleTypes: ModuleType[]; 
  interactiveModes?: string[];
  humorTypes?: string[];
  homeworkTypes?: string[];
  additionalPrompt?: string; 
  generationDirection?: string; // New field for user direction
  includeRelatedPractice?: boolean; // New flag for generating 3 practice options
}

export interface ContentItem {
  title: string;
  content: string; // Markdown supported
  tipsForTeacher?: string; // Specific guidance for the teacher
}

export interface SectionContent {
  goal: string;
  duration: string;
  studentMaterials: ContentItem[];
  teacherGuide: ContentItem[];
}

export interface PracticeOption {
  title: string;
  content: string; // The practice instruction/scenario
}

export interface ModuleResult {
  type: string; 
  title: string;
  content: ContentItem[];
  teacherGuide?: ContentItem[];
  practiceOptions?: PracticeOption[]; // The 3 generated practice options
}

export interface LessonPlanResponse {
  meta: {
    title: string;
    targetAudience: string;
    learningObjectives: string[];
    mode: GeneratorMode; 
  };
  preClass: SectionContent;
  inClass: SectionContent;
  postClass: SectionContent;
  modules?: ModuleResult[]; 
}

export interface TeacherGuideResponse {
  preClass: ContentItem[];
  inClass: ContentItem[];
  postClass: ContentItem[];
}

export interface VoiceConfig {
  speakerMap: Record<string, string>;
}

export interface CorrectionItem {
  original: string;
  correction: string;
  explanation: string;
  audioFeedback?: string; // For pronunciation
}

export interface HomeworkCheckResponse {
  score: string; // "85/100" or similar
  overallFeedback: string;
  sentenceAnalysis: CorrectionItem[];
  revisedArticle: string; // The fully corrected/rewritten version
  suggestions: string;
}
