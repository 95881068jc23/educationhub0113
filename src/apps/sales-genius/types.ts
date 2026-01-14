
export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
}

export enum ProductType {
  ADULT = '成人英语',
  CORPORATE = '企业培训',
  KIDS = '少儿英语',
  EXAM = '托福雅思',
}

export enum SalesStage {
  PRE_SALES = '售前 (Pre-sales)',
  POST_SALES = '售后 (Post-sales)',
}

export enum KnowledgeCategory {
  OBJECTION = 'OBJECTION',
  PRODUCT = 'PRODUCT',
  SALES_SKILL = 'SALES_SKILL',
  COMPETITOR = 'COMPETITOR',
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  images?: string[]; // Array of Base64 strings
  audio?: string; // Base64 string for audio
  productContext?: ProductType;
  salesStage?: SalesStage;
  subCategory?: string; // Specific scenario context (e.g., "Refund Handling")
  isError?: boolean;
  groundingUrls?: Array<{uri: string; title: string}>;
  suggestedActions?: string[]; // New: For one-click quick replies
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  initialPrompt: string;
}

export interface KnowledgeItem {
  id: string;
  category: KnowledgeCategory;
  title: string;
  summary: string;
  content: string;
  tags: string[];
}

export interface ClientProfile {
  name: string;
  ageRange: string;
  gender: string;
  industry: string;
  jobTitle: string;
  currentLevel: string;
  targetLevel: string;
  learningGoal: string;
  otherInfo: string;
}
