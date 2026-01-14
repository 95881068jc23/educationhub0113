
export enum Language {
  ENGLISH = 'English',
  CHINESE = 'Chinese (Simplified)',
  JAPANESE = 'Japanese',
  KOREAN = 'Korean',
  GERMAN = 'German',
  FRENCH = 'French',
  SPANISH = 'Spanish',
  ITALIAN = 'Italian'
}

export enum ResumeStyle {
  PROFESSIONAL = 'Professional / Corporate',
  CREATIVE = 'Creative / Design',
  ACADEMIC = 'Academic / CV',
  STARTUP = 'Modern / Startup',
  EXECUTIVE = 'Executive / Senior Management'
}

export enum InterviewMode {
  NEW_JOB = 'New Job Application (新工作面试)',
  PROMOTION = 'Internal Promotion (内部晋升面试)'
}

export enum InterviewDifficulty {
  BASIC = 'A2-B1 (Beginner/Intermediate - Basic Discussions)',
  ADVANCED = 'B2-C1 (Intermediate/Advanced - Deep Discussions)'
}

export interface FileInput {
  mimeType: string;
  data: string; // base64 encoded string
}

export interface OptimizationConfig {
  targetLanguage: Language;
  targetStyle: ResumeStyle;
  targetCompany?: string;
  jobDescription?: string;
  originalResume: string;
  fileInput?: FileInput;
  jdFile?: FileInput;
  refinementInstruction?: string; 
  interviewMode?: InterviewMode;
  interviewDifficulty?: InterviewDifficulty; // New field
}

export interface AnalysisIssue {
  section: string;
  originalTextSnippet: string;
  issueType: 'Critical' | 'Improvement' | 'Formatting' | 'Language';
  reasonCn: string;
  reasonEn: string;
  suggestionCn: string;
  suggestionEn: string;
  exampleOriginal: string;
  exampleImprovedEn: string;
  exampleImprovedCn: string;
}

export interface ATSIssue {
  issueCn: string;
  issueEn: string;
  suggestionCn: string;
  suggestionEn: string;
  severity: 'High' | 'Medium' | 'Low';
}

export interface ATSData {
  score: number;
  keywordScore: number; // New: contribution from keywords
  formattingScore: number; // New: contribution from formatting
  structureScore: number; // New: contribution from section detection
  keywordsMatched: string[];
  keywordsMissing: string[];
  formattingIssues: ATSIssue[];
  detailedFeedbackCn?: string; 
  detailedFeedbackEn?: string; 
}

export interface ATSAnalysis {
  original: ATSData;
  optimized: ATSData;
  sectionDetection: string[];
}

export interface WritingExerciseFeedback {
  score: number;
  critique: string;
  improvedVersion: string;
}

export interface WritingExercise {
  scenarioCn: string;
  scenarioEn: string;
  taskCn: string;
  taskEn: string;
}

export interface WritingGuide {
  conceptExplanationCn: string; 
  conceptExplanationEn?: string;
  exercises?: WritingExercise[];
  isGenerated?: boolean; 
}

export interface InterviewQuestion {
  questionCn: string;
  questionEn: string;
  type: 'Behavioral' | 'Technical' | 'General';
  intentCn: string; 
  keyPointsCn: string[]; 
  sampleAnswerEn: string; 
}

export interface InterviewPrep {
  part1_intro: InterviewQuestion[];
  part2_cv: InterviewQuestion[];
  part3_behavioral: InterviewQuestion[];
  part4_technical: InterviewQuestion[];
  part5_reverse: InterviewQuestion[];
  isGenerated?: boolean; 
}

export interface AnalysisResult {
  overallScore: number;
  summaryCn: string;
  summaryEn: string;
  strengthsCn: string[];
  strengthsEn: string[];
  issues: AnalysisIssue[];
  atsAnalysis: ATSAnalysis;
  writingGuide: WritingGuide;
  interviewPrep?: InterviewPrep; 
}

export interface OptimizationResult {
  analysis: AnalysisResult;
  optimizedContentTarget: string; 
  optimizedContentNative: string; 
  transcribedOriginal: string; 
}

export interface AppState {
  step: 'input' | 'analyzing' | 'results';
  config: OptimizationConfig;
  result: OptimizationResult | null;
  error: string | null;
  isProcessing: boolean;
  processingStage?: string; 
}