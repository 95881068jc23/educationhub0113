
export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
}

export enum ProductType {
  ADULT = '成人英语',
  KIDS = '少儿英语',
  EXAM = '托福雅思',
  CORPORATE = '企业培训',
}

export enum TeachingModule {
  GUIDE = '教学指导 (Teaching Guide)',
  COMMUNICATION = '学员沟通 (Student Comm)',
  PREP = '备课资源 (Prep Resources)',
}

export enum KnowledgeCategory {
  THEORY = 'THEORY',
  TECHNIQUE = 'TECHNIQUE',
  ACTIVITY = 'ACTIVITY',
  MANAGEMENT = 'MANAGEMENT',
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  images?: string[]; // Array of Base64 strings
  audio?: string; // Base64 string for audio
  productContext?: ProductType;
  teachingModule?: TeachingModule;
  subCategory?: string; 
  isError?: boolean;
  groundingUrls?: Array<{uri: string; title: string}>;
  feedback?: string; // For mock teaching feedback
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  initialPrompt: string;
}

export interface KnowledgeItem {
  id: string;
  category: string;
  title: string;
  content: string;
  purpose: string; // "Why this matters"
  example: string; // "Concrete Example"
}

export interface StudentProfile {
  name: string;
  age: string;
  level: string; // CEFR
  goal: string;
  struggle: string; // Main difficulty
  personality: string;
}
