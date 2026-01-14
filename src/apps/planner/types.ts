
export enum CEFRLevel {
  PreA1 = 'PreA1',
  A1 = 'A1',
  A2 = 'A2',
  A2Plus = 'A2+',
  B1 = 'B1',
  B1Plus = 'B1+',
  B2 = 'B2',
  B2Plus = 'B2+',
  C1 = 'C1',
  C1Plus = 'C1+',
  C2 = 'C2'
}

export enum CourseType {
  General = 'General',
  Business = 'Business',
  Specialty = 'Specialty'
}

export enum TopicCategory {
  Official = 'Official',
  Life = 'Life',
  BusinessSkills = 'BusinessSkills',
  Industry = 'Industry',
  JobRole = 'JobRole',
  AI_Generated = 'AI_Generated',
  Supplementary = 'Supplementary',
  Popular = 'Popular'
}

export enum CourseMode {
  Private = 'Private', // 1-on-1, Custom, 2-4h per topic
  Group = 'Group',     // Fixed 90min, 1 topic, No custom
  Combo = 'Combo'      // Official = Group, Custom = Private
}

export enum CustomContentStrategy {
  HighFrequency = 'HighFrequency', // Load all official topics
  PureCustom = 'PureCustom',       // Load NO official topics
  Hybrid = 'Hybrid'                // Load official, expect custom add
}

export enum LearningDirection {
  Life = 'Life',
  Business = 'Business',
  Exam = 'Exam',
  Other = 'Other'
}

export enum StandardTrackMode {
  Official = 'Official',     // e.g. Business (Default)
  Alternate = 'Alternate',   // e.g. Life (Alternate)
  Combined = 'Combined'      // Both
}

export interface SyllabusItem {
  en: string;
  cn: string;
}

export interface TopicSyllabus {
  coreVocab: { word: string; pronunciation: string; meaning: string; context: string }[]; // Added pronunciation
  coreSentences: { sentence: string; translation: string }[];
  advancedExpressions: { expression: string; translation: string; nuance: string }[]; // Added translation
  commonMistakes: { mistake: string; correction: string; reason: string }[];
  culturalInsight: { title: string; content: string };
  outline: { phase: string; activity: string; method: 'Input' | 'Output' | 'Feedback' }[];
}

export interface Topic {
  id: string;
  title: string;
  description?: string;
  practicalScenario?: string;
  minHours: number;
  maxHours: number;
  category: TopicCategory;
  isBusinessSkill?: boolean; 
  fixedDuration?: boolean;
  mode?: CourseMode;
  source?: 'File' | 'System' | 'AI';
  syllabus?: TopicSyllabus;
  context?: string; // New field to store Pack Name or Origin Context
}

export interface LevelConfig {
  level: CEFRLevel;
  type: CourseType;
  officialTopics: Topic[];
  alternateTopics?: Topic[];
  coreVocabCount: number;
  grammarPoints: number;
  description: string;
  baseHoursRequired: number;
}

export interface StudentProfile {
  name: string;
  currentLevel: CEFRLevel;
  targetLevel: CEFRLevel;
  
  learningDirections: LearningDirection[];
  
  industry: string;
  role: string;
  jobDescription?: string;
  interests: string[];
  goals: string[];
  
  sessionDurationMinutes: 60 | 90 | 120;
  mode: CourseMode;
  customContentStrategy?: CustomContentStrategy;
  
  weeklyFrequency: number;
  topicsPerSession: number;
}

export interface PlannedModule {
  id: string;
  level: CEFRLevel;
  topics: Topic[];
  standardTrackMode?: StandardTrackMode;
}

export interface PlanState {
  profile: StudentProfile;
  modules: PlannedModule[];
  totalHours: number;
  totalSessions: number;
}

export interface SupplementaryCourse {
  id: string;
  title: string;
  hours: number;
  isWeekly?: boolean;
  minLevel: CEFRLevel;
  maxLevel: CEFRLevel;
  category: TopicCategory;
}

export interface PackTopicData {
    title: string;
    scenario: string;
}

export interface TopicPackConfig {
  name: string;
  minLevel: CEFRLevel;
  directions: LearningDirection[];
  topics: PackTopicData[];
}
