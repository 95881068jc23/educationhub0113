
import { Type } from "@google/genai";
import { ExamType, Language, StudentProfile, PlanItem, Question, SchoolAdmissionProfile } from '../types';
import { callGeminiAPI } from "../../../services/geminiProxy";

// Helper for file parts
const fileToPart = (base64Data: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64Data,
      mimeType
    }
  };
};

const MODEL_NAME = 'gemini-3-pro-preview';

// --- NEW: School Admission Consulting ---

export const generateSchoolAdmissionReport = async (
  profile: SchoolAdmissionProfile,
  language: Language
): Promise<string> => {
  const targetSchoolsStr = profile.targetSchools.join(', ');
  const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  const prompt = `You are a Senior International Education Consultant in China (Top-tier School Admissions Expert).
  
  **Task**: Create a "One-Stop Comprehensive School Admission Strategy Report" (一站式名校择校与升学方案).
  **Report Date**: ${today} (Use this date as the generated date).

  **Student Profile**:
  - **City**: ${profile.city}
  - **Age/Grade**: ${profile.studentAge}
  - **Current School**: ${profile.currentSchool}
  - **Academic Level (CN/Math/Eng)**: ${profile.languageLevel} / ${profile.mathLevel}
  - **Budget/Notes**: ${profile.budget}
  - **Target Schools**: ${targetSchoolsStr} (and suggest others if suitable)
  - **Other Requirements**: ${profile.otherRequirements}

  **MANDATORY**:
  - You **MUST** use Google Search to find REAL-TIME, AUTHORITATIVE data for **2025-2026 Admissions** (and 2026-2027 outlook).
  - Specifically search for: "2026 [School Name] 招生简章", "[School Name] 学费 2025-2026", "[School Name] 面试真题 2025".
  - If the user selected specific target schools (e.g. YK Pao, Wellington), focus deeply on them.
  - If no specific school selected, recommend the top 3-5 schools in ${profile.city} that fit the profile.

  **Output Format (Markdown)**:
  
  # ${profile.city} International Education & Admission Strategy
  > **Report Generated On**: ${today}
  
  ## 1. School Analysis & Fit (目标名校深度解析)
  *For each target/recommended school:*
  - **School Name**: [Name]
  - **School Features**: (Curriculum, Vibe, Strengths e.g. "Sports", "Arts", "Strict Academic")
  - **2025/26 Tuition**: [Real-time data]
  - **Admissions Difficulty**: (Star rating)
  - **Fit Analysis**: Why this fits (or doesn't fit) the student's current profile.

  ## 2. Gap Diagnosis (核心能力差距诊断)
  - **English Gap**: Based on user input vs School requirements (e.g. "Wellington requires near-native fluency...").
  - **Math/Chinese Gap**: Specific requirements for bilingual vs pure international schools.
  - **Student Persona**: What kind of student does this school look for? (e.g. "Whole person", "Academic excellence").

  ## 3. Admission Roadmap & Interview Prep (备考核心攻略)
  - **Timeline**: When to apply? Open day dates for 2026 entry?
  - **Entrance Exam**: What tests? (CAT4, MAP, MAP Growth, Written Essay, etc.)
  - **Interview Secrets**: **Reveal known interview topics/questions** for these specific schools.
  
  ## 4. Action Plan (下一步建议)
  - Immediate actions for parents.
  - Recommended prep courses/materials.

  **Tone**: Professional, Authoritative, Encouraging but Realistic.
  **Language**: Chinese (Mandarin).`;

  const response = await callGeminiAPI({
    model: MODEL_NAME,
    contents: [{ text: prompt }],
    config: {
        tools: [{ googleSearch: {} }] // Critical for real-time school data
    }
  });

  return response.text || "Report generation failed.";
};

// --- NEW: Exam Information Services ---

// 0.1 Generate Quick Brief (Consultant Cheat Sheet)
export const generateExamBrief = async (exam: ExamType): Promise<string> => {
  const prompt = `You are a Senior Educational Consultant at "Intl. Scholar 麦迩威AI+教育团队".
  Provide a "1-Minute Consultant Quick Brief" for the exam: ${exam}.
  
  **Language: Chinese (Mandarin) - Casual yet Professional, Easy to understand.**
  
  Structure (Use Markdown):
  1. **What is it? (一句话介绍)**: Simple definition.
  2. **Who is it for? (适合人群)**: Target age/grade.
  3. **Core Challenges (核心难点)**: Key pain points for students.
  4. **Latest Trends (2025-2026新趋势)**: Any recent changes.
  
  Goal: Help a sales consultant explain this to a parent in 1 minute.`;

  const response = await callGeminiAPI({
    model: MODEL_NAME,
    contents: [{ text: prompt }],
    config: {
        tools: [{ googleSearch: {} }] // Use search to get latest trends
    }
  });

  return response.text || "Brief generation failed.";
};

// 0.2 Generate Detailed Official Guide & Course Design
export const generateExamFullGuide = async (exam: ExamType, city: string = ""): Promise<string> => {
  let examContext: string = exam;
  if (city && city !== "National (Universal)") {
    examContext = `${city} ${exam}`;
  }

  const prompt = `You are a Senior Educational Consultant at "Intl. Scholar 麦迩威AI+教育团队".
  Create a comprehensive "Official Guide Whitepaper & Consultant Course Design" for: ${examContext}.
  
  **Language: Chinese (Mandarin) - Professional, Detailed, Authoritative.**
  
  **Crucial Requirement**:
  - If the exam is Primary School English (Primary School English (CN)), strict reference to the "2025 New Curriculum Standards (2025新课标)".
  - If the exam is Domestic (Zhongkao/Gaokao) and a city is provided (${city}), strictly focus on that city's specific policy, difficulty, and question types for the 2025/2026 cycle.
  
  Structure (Use Markdown with Clear Headings):
  1. **Exam Overview (考试全貌)**: History, purpose, authority. (If city selected, mention local policy).
  2. **Test Structure (题型与结构详解)**: Break down by section (Time, Question Count, Content). Use Tables.
  3. **Scoring System (评分标准深度解读)**: How it's scored, what do scores mean.
  4. **Preparation Timeline (备考时间轴建议)**: 3-month or 6-month plan.
  5. **Common Myths & Pitfalls (常见误区粉碎)**.
  6. **FAQ (家长常问问题)**.
  
  --- SEPARATOR ---
  
  7. **Consultant Course Design Guidance (顾问课程设计指导)**:
     - **Course Philosophy**: How to position the course.
     - **Recommended Hours**: Breakdown of hours per phase (Foundation -> Improvement -> Sprint).
     - **Teaching Methodology**: Recommended forms (1v1, Small Group) and methods.
     - **Textbook Recommendations**: List specific authoritative books/materials suitable for this exam.
  
  Make it visually appealing with bullet points and bold text.`;

  const response = await callGeminiAPI({
    model: MODEL_NAME,
    contents: [{ text: prompt }],
    config: {
        tools: [{ googleSearch: {} }] // Use search for accuracy
    }
  });

  return response.text || "Guide generation failed.";
};

// 0.3 Ask AI a question about the exam
export const askExamQuestion = async (
  exam: ExamType, 
  question: string, 
  history: {role: string, text: string}[]
): Promise<string> => {
  // Construct a prompt that includes history context
  let historyContext = "";
  if (history.length > 0) {
    historyContext = "Previous conversation history:\n" + 
      history.map(msg => `${msg.role === 'user' ? 'User' : 'Consultant'}: ${msg.text}`).join('\n') + 
      "\n\n";
  }

  const prompt = `You are an expert AI Consultant specializing in the ${exam} exam.
  ${historyContext}
  User Question: ${question}
  
  Please provide a helpful, accurate, and professional answer in Chinese (Mandarin).
  If the question requires up-to-date data (dates, fees, policy changes), rely on the Google Search tool (Look for 2025-2026 data).
  Keep the answer concise unless asked for details.`;

  const response = await callGeminiAPI({
    model: MODEL_NAME,
    contents: [{ text: prompt }],
    config: {
        tools: [{ googleSearch: {} }]
    }
  });

  return response.text || "I couldn't generate an answer.";
};

// --- Existing Services ---

// 1. Generate Needs Analysis Report
export const generateNeedsAnalysisReport = async (
  exam: ExamType,
  profile: StudentProfile,
  language: Language,
  transcriptData?: { base64: string, mimeType: string } | null,
  transcriptText?: string,
  syllabusData?: { base64: string, mimeType: string } | null,
  syllabusText?: string
): Promise<string> => {
  const ai = getAI();
  const langStr = language === 'zh' ? 'Chinese (Simplified)' : 'English';
  const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  
  let prompt = `You are a Senior Educational Consultant at "Intl. Scholar 麦迩威AI+教育团队".
  Analyze the following student profile for the ${exam} curriculum.
  
  Student: ${profile.name} (Grade: ${profile.grade})
  `;

  // Add exam variant (e.g. IELTS A/G)
  if (profile.examVariant) {
    prompt += `**Specific Exam Module: ${profile.examVariant}**\n`;
  }
  
  // Add subjects if available
  if (profile.subjects) {
    prompt += `Selected Subjects: ${profile.subjects}\n`;
  }

  prompt += `Current Score: ${profile.currentScore}`;
  
  // Only add subscores if provided (they are now conditional)
  if (profile.subScores) {
    prompt += ` (Subs: ${profile.subScores})`;
  }
  
  prompt += `\nTarget Score: ${profile.targetScore}`;
  
  if (profile.targetSubScores) {
     prompt += ` (Subs: ${profile.targetSubScores})`;
  }

  prompt += `\nRequirements: ${profile.requirements}`;

  // Append extracted text from files (Word/Excel)
  if (transcriptText) {
    prompt += `\n\n[Attached Transcript/Score Report Content]:\n${transcriptText}`;
  }

  if (syllabusText) {
    prompt += `\n\n[Attached Course Syllabus/Outline Content]:\n${syllabusText}`;
  }

  if (transcriptData) {
    prompt += `\n\n[Attached File 1]: A document (Transcript/Score Report) is attached. Please use information from this file to enhance the analysis, identifying specific weak topics or trends if visible.`;
  }

  if (syllabusData) {
    prompt += `\n\n[Attached File 2]: A Course Syllabus/Outline is attached. Please ALIGN your analysis and study plan with the topics and structure presented in this syllabus.`;
  }
  
  prompt += `\n\nPlease generate a professional "Needs Analysis Report" in Markdown format.
  **Date of Analysis**: ${today} (Display this at the top).

  **CRITICAL LANGUAGE REQUIREMENT**:
  **Output MUST BE BILINGUAL (Chinese & English).**
  - Every heading, section, and key point must have Chinese text followed by English text (or vice versa).
  - Example: "**Weakness (劣势)**: Vocabulary range is limited..."

  **REAL-TIME DATA REQUEST (MANDATORY)**:
  - You MUST use Google Search to find the absolute latest information for **2025-2026** regarding ${exam}.
  - Check for the release of new official prep books (e.g., verify if "Cambridge IELTS 21" or latest TOEFL Official Guide 2025/26 is available).
  - Check for any recent changes to exam scoring, trends, or format in late 2025/2026.
  - Incorporate this real-time data into your advice and resource recommendations.
  
  Structure requirements:
  1. **Student Profile Analysis**: Summary of current status vs target.
     - *If a syllabus was provided, explicitly mention how the student's current status relates to the syllabus requirements.*
  2. **Gap Diagnosis & Scoring Mechanics**: 
     - Identify weak points.
     - **CRITICAL**: Include detailed exam scoring mechanics relevant to the student. e.g. "For Reading, missing X questions results in a band score of Y. To reach the target, you can only afford Z mistakes."
  3. **Phase-based Study Plan (Overview Table)**:
     - You MUST use a standard Markdown Table for this section.
     - **PHASE TARGETS**: In the "Phase" column, you MUST include the target score range for that phase (e.g. "Phase 1 (Target: 4.5-5.0)").
     - *If a syllabus was provided, map the study phases to the syllabus modules/units.*
     
     **HOURS CALCULATION STANDARDS (OFFLINE INSTITUTION)**:
     You MUST calculate "Recommended Class Hours" based on the student's gap and specific logic for the exam type:

     **Logic 1: For IELTS / TOEFL (Standard Protocol)**:
       - IELTS 3.0 → 5.0: 40-60 hours.
       - IELTS 5.0 → 6.0: 48-72 hours.
       - IELTS 6.0 → 6.5: 24-36 hours.
       - IELTS 6.5 → 7.0: 24-36 hours.
       - TOEFL: Similar logic (0-60: 40-60h, 60-80: 48-72h, 80-90: 24-36h, 90-100: 24-36h).
       - *Note*: Use these ranges directly for the class hours.

     **Logic 2: For ALL OTHER EXAMS (AP, IB, A-Level, KET, PET, Domestic Exams, etc.)**:
       - **Step A**: Search for the **Official Recommended Guided Learning Hours (GLH)** for this subject/level (e.g. Cambridge Official suggestions, IB subject guide hours).
       - **Step B**: Apply the **Institution Ratio**: Calculate **60-80%** of that official GLH as the "Offline Class Hours".
       - **Step C**: Explicitly state in the report: "Official recommended study time is [X] hours. Our offline course is designed for [Y] hours (60-80%), with the remaining time arranged for supplementary exercises and self-study."

     - Columns: | Phase (Target Score) | Recommended Hours | Goals | Key Topics | Recommended Resources |
     - The "Recommended Hours" column must be the second column.

  4. **Final Advice**: Strategic tips for success.
  5. **Signature**: Sign off as "Intl. Scholar 麦迩威AI+教育团队".

  **STRICT FORMATTING RULES (CRITICAL)**:
  - **PURE MARKDOWN ONLY**: DO NOT OUTPUT RAW HTML. 
  - **FORBIDDEN TAGS**: Do NOT use <br>, <table>, <tbody>, <tr>, <td>, <p> or <hr>.
  - **LINE BREAKS**: Use double newlines for paragraph breaks.
  - **USE STANDARD MARKDOWN TABLES ONLY**:
    Example:
    | Header 1 | Header 2 |
    | :--- | :--- |
    | Row 1 Col 1 | Row 1 Col 2 |
  - Ensure there is a blank line before and after the table.
  - **Inside Table Cells**: Use the "•" (bullet point character) separated by spaces to list multiple items. Do NOT try to force new lines.
  
  Make the output visually appealing using specific Markdown features:
  - Use **# Heading 1** for main titles.
  - Use **## Heading 2** for sections (Color blocks will be applied here in UI).
  - Use **> Blockquotes** for key takeaways (Highlight blocks will be applied here in UI).
  
  Language: ${langStr} (use professional educational terminology).`;

  const parts: any[] = [{ text: prompt }];
  
  if (transcriptData) {
    parts.push(fileToPart(transcriptData.base64, transcriptData.mimeType));
  }
  
  if (syllabusData) {
    parts.push(fileToPart(syllabusData.base64, syllabusData.mimeType));
  }

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: { parts },
    config: {
      tools: [{ googleSearch: {} }], // Enable Real-time Search
    }
  });

  // Return text directly without appending sources
  return response.text || "Analysis failed.";
};

// 2. Generate Course Plan (Structured JSON) - Phased Generation
export const generateCoursePlan = async (
  exam: ExamType,
  language: Language,
  context: string,
  fileData?: { base64: string, mimeType: string } | null,
  targetPhase: number = 1 // New parameter to control phase generation
): Promise<PlanItem[]> => {
  const ai = getAI();
  
  const prompt = `Create a detailed **Lesson-by-Lesson** Course Plan for ${exam}.
  Context/Requirements: ${context}
  
  **CURRENT TASK: GENERATE PHASE ${targetPhase} ONLY.**
  Do not generate other phases. Focus exclusively on Phase ${targetPhase} lessons.
  If this is Phase 1, start from Lesson 1.
  If this is Phase 2 or 3, assume Phase 1 is complete and continue the lesson numbering.

  **PLANNING LOGIC (MANDATORY)**:
  1. **Granularity**: The plan MUST be broken down into individual **Classes/Lessons** (e.g., "Lesson 1", "Lesson 2").
  2. **STRICT RULE**: **ONE LESSON PER ITEM**. NEVER group lessons (e.g., "Lesson 1-2" is FORBIDDEN). 
     - Incorrect: "Lesson 1-2: Intro"
     - Correct: "Lesson 1: Intro Part 1", "Lesson 2: Intro Part 2"
  3. **Duration**: Assume standard tutoring sessions (e.g., 2 hours per lesson).
  
  **CRITICAL REQUIREMENT 1 (Syllabus)**:
  If a syllabus is provided, strictly follow its order.
  
  **CRITICAL REQUIREMENT 2 (Format)**:
  - **Language**: All output text (Topic, Content, Resources) MUST be **Bilingual (English and Chinese)**.
  
  **CRITICAL REQUIREMENT 3 (Textbooks)**:
  - For EVERY session, you MUST provide specific "Textbook References" (e.g., "Official Guide P.20-25").
  
  Output a JSON Array where each item has:
  - phase (string): e.g. "Phase ${targetPhase} - Lesson X"
  - topic (string): The main topic (Bilingual)
  - content (string): Specific detailed bullet points of what will be taught.
  - hours (number): Duration (usually 2).
  - resources (string): Specific textbook chapters or materials.
  `;

  const parts: any[] = [{ text: prompt }];
  if (fileData) {
    parts.push(fileToPart(fileData.base64, fileData.mimeType));
  }

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            phase: { type: Type.STRING },
            topic: { type: Type.STRING },
            content: { type: Type.STRING },
            hours: { type: Type.NUMBER },
            resources: { type: Type.STRING, description: "Textbook chapters/pages or materials" }
          },
          required: ["phase", "topic", "content", "hours", "resources"]
        }
      }
    }
  });

  if (response.text) {
    const data = JSON.parse(response.text) as any[];
    return data.map((item, idx) => ({ ...item, id: `${targetPhase}-${idx}` })); // Ensure unique IDs
  }
  return [];
};

// 3. Generate Courseware (Lesson Plan)
export const generateCourseware = async (
  exam: ExamType,
  topic: string,
  details: string,
  language: Language,
  fileData?: { base64: string, mimeType: string } | null
): Promise<string> => {
  const ai = getAI();

  const prompt = `Create a professional lesson plan / courseware for ${exam}.
  Topic: ${topic}
  Details/Context: ${details}
  
  Output Format: Markdown. 
  - Use clear # Heading 1 and ## Heading 2.
  - Use Markdown Tables for any data/vocabulary lists.
  - Use Bullet points for lists.
  - Ensure visual separation between sections.
  - **NO HTML TAGS**: Do not use <br> or similar.
  
  Language: Bilingual (English and Chinese).
  Include: Learning Objectives, Key Concepts, Example Problems (with steps), and Homework.`;

  const parts: any[] = [{ text: prompt }];
  if (fileData) {
    parts.push(fileToPart(fileData.base64, fileData.mimeType));
  }

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: { parts }
  });

  return response.text || "Failed to generate content.";
};

// 4. Generate Teacher Guide
export const generateTeacherGuide = async (
  exam: ExamType,
  topic: string,
  details: string,
  language: Language
): Promise<string> => {
  const ai = getAI();

  const prompt = `Create a "Teacher's Instruction Guide" for the ${exam} topic: "${topic}".
  Context: ${details}

  The guide is for the instructor, NOT the student.
  Output Format: Markdown. Do not use HTML tags.
  Language: Bilingual (English and Chinese).

  Include:
  1. **Teaching Strategy**: How to introduce this concept effectively.
  2. **Common Pitfalls**: What mistakes students usually make on this topic.
  3. **Time Management**: Suggested breakdown of the class time.
  4. **Classroom Activities**: Interactive ideas to engage students.
  5. **Differentiation**: How to help struggling students vs advanced students.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt
  });

  return response.text || "Failed to generate guide.";
};

// 5. Generate Vocabulary List (Student vs TA)
export const generateVocabularyList = async (
  exam: ExamType,
  topic: string,
  details: string,
  language: Language,
  isForTA: boolean,
  quantity: number
): Promise<string> => {
  const ai = getAI();

  let prompt = `Generate a specific vocabulary list of exactly ${quantity} words for the ${exam} topic: "${topic}".
  Context: ${details}
  Language: Bilingual (English and Chinese).
  
  Output MUST be a Markdown Table.
  Do NOT use HTML tags. Use bullet points or spaces inside table cells if needed.
  `;

  if (isForTA) {
    prompt += `
    **Mode: Teaching Assistant (TA) Check Version**
    This version is for the TA to test the student.
    Columns: | Word | Pronunciation | Chinese Meaning (Hidden/Check) | Dictation Status |
    - "Chinese Meaning" column should be present but easy to cover.
    - "Dictation Status" column should be empty or have checkboxes like "[ ] Pass / [ ] Fail".
    - Include a "Dictation Answer Key" at the very bottom.
    `;
  } else {
    prompt += `
    **Mode: Student Recitation Version**
    This version is for the student to memorize.
    Columns: | Word | Pronunciation | Definition (CN) | Definition (EN) | Example Sentence |
    `;
  }

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt
  });

  return response.text || "Failed to generate vocabulary.";
};

// 6. Generate Placement Test
export const generatePlacementTest = async (
  exam: ExamType,
  language: Language
): Promise<Question[]> => {
  const ai = getAI();
  const langStr = language === 'zh' ? 'Chinese (Simplified)' : 'English';

  const prompt = `Generate a placement test for ${exam}.
  The test should contain 5 multiple-choice questions to assess the student's level.
  Each question should have 4 options.
  
  Output a JSON Array where each item has:
  - id (number): unique id (start from 1)
  - text (string): question text
  - options (string[]): array of 4 options
  - correctAnswerIndex (number): index of the correct answer (0-3)
  - explanation (string): brief explanation of the correct answer

  Language: ${langStr}.`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.NUMBER },
            text: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            correctAnswerIndex: { type: Type.NUMBER },
            explanation: { type: Type.STRING }
          },
          required: ["id", "text", "options", "correctAnswerIndex", "explanation"]
        }
      }
    }
  });

  if (response.text) {
    return JSON.parse(response.text) as Question[];
  }
  return [];
};

// 7. Generate Free Global Preparation Resources (Treasury)
export const generateExamResources = async (
  exam: ExamType,
  language: Language
): Promise<string> => {
  const ai = getAI();
  const langPrompt = language === 'zh' ? 'Chinese (with English source names)' : 'English';

  const prompt = `Find and list the top 10 "Global Free Preparation Resources" (websites, pdf archives, tools) for the ${exam} exam.
  Target audience: Teachers and students looking for high-quality supplementary materials.
  Language: ${langPrompt}.
  
  Requirements:
  1. **Official Authority Sites** (e.g. CollegeBoard, ETS, British Council).
  2. **Free Question Banks / Past Papers** (Real archives).
  3. **Teaching resource communities / Blogs**.
  4. **YouTube Channels** (if highly relevant).
  
  Format: Markdown. Use bullet points.
  * **[Site Name](URL)**: Description of what materials can be found here.
  
  **MANDATORY**: 
  - Use Google Search to ensure URLs are valid, active, and recent.
  - **Output MUST use standard Markdown Link format: [Title](URL)**.
  - Do not use plain text URLs.`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
        tools: [{ googleSearch: {} }] // Essential for finding links
    }
  });

  return response.text || "Failed to generate resources.";
};
