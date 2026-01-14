
export type Language = 'en' | 'zh';

export enum ExamType {
  IB = 'IB Diploma',
  AP = 'AP (Advanced Placement)',
  ALEVEL = 'A-Level',
  AMC8 = 'AMC 8',
  AMC10 = 'AMC 10',
  AMC12 = 'AMC 12',
  TOEFL = 'TOEFL iBT',
  IELTS = 'IELTS',
  PTE = 'PTE Academic',
  TOEFL_JUNIOR = 'TOEFL Junior',
  TOEFL_PRIMARY = 'TOEFL Primary',
  KET = 'KET (A2 Key)',
  PET = 'PET (B1 Preliminary)',
  FCE = 'FCE (B2 First)',
  GRE = 'GRE',
  GMAT = 'GMAT',
  PETS3 = 'PETS-3',
  CATTI = 'CATTI',
  PRIMARY_ENGLISH = 'Primary School English (CN)',
  JUNIOR_ENGLISH = 'Junior High English (CN)',
  ZHONGKAO = 'Zhongkao English',
  GAOKAO = 'Gaokao English',
  CET4 = 'CET-4',
  CET6 = 'CET-6',
  // New Kids Curricula
  OPW = 'Oxford Phonics World',
  POWER_UP = 'Power Up',
  OXFORD_DISCOVER = 'Oxford Discover',
  UNLOCK = 'Unlock',
  READING_EXPLORER = 'Reading Explorer',
  // New Feature
  INTL_SCHOOL_ADMISSION = 'Intl. School Admission'
}

export enum AppMode {
  DASHBOARD = 'dashboard',
  INFO = 'info',
  MOCK = 'mock',
  NEEDS = 'needs',
  PLAN = 'plan',
  LEARN = 'learn',
  SCHOOL = 'school' // New mode
}

export interface StudentProfile {
  name: string;
  grade: string;
  currentScore: string;
  subScores: string; // e.g., R:20 L:20
  targetScore: string;
  targetSubScores: string;
  requirements: string;
  subjects?: string; // New field for curriculum based exams (AP/IB/A-Level)
  examVariant?: string; // New field for specific exam types (e.g. IELTS A/G)
}

export interface SchoolAdmissionProfile {
  city: string;
  studentAge: string;
  currentSchool: string; // e.g., Public, Bilingual, Intl
  languageLevel: string; // e.g., Chinese: Native, English: PET Pass
  mathLevel: string; // e.g., Olympiad winner
  budget: string;
  targetSchools: string[];
  otherRequirements: string;
}

export interface PlanItem {
  id: string;
  phase: string; // Week or Month
  topic: string;
  content: string;
  hours: number;
  resources: string; // New field for Textbook/Materials references
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface MockQuestion {
  id: string;
  examType: ExamType;
  question: string;
  options: string[];
  answer: number; // Index 0-3
  explanation: string; // Bilingual explanation
  context?: string; // New: Reading passage or background info
}

export interface UserState {
  selectedExam: ExamType | null;
  language: Language;
}
