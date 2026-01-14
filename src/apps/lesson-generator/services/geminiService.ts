
import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { GeneratorFormData, ClassType, LessonPlanResponse, ModuleType, TeacherGuideResponse, VoiceConfig, ContentItem, SectionContent, HomeworkCheckResponse, PracticeOption } from "../types";

const apiKey = import.meta.env.VITE_API_KEY;

// Schemas
const contentItemSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    content: { type: Type.STRING },
    tipsForTeacher: { type: Type.STRING }
  },
  required: ["title", "content"]
};

const sectionContentSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    goal: { type: Type.STRING },
    duration: { type: Type.STRING },
    studentMaterials: { type: Type.ARRAY, items: contentItemSchema },
    teacherGuide: { type: Type.ARRAY, items: contentItemSchema }
  },
  required: ["goal", "duration", "studentMaterials", "teacherGuide"]
};

const practiceOptionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    content: { type: Type.STRING }
  },
  required: ["title", "content"]
};

const practiceOptionsArraySchema: Schema = {
    type: Type.OBJECT,
    properties: {
        practiceOptions: { type: Type.ARRAY, items: practiceOptionSchema }
    },
    required: ["practiceOptions"]
};

const moduleResultSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING },
        title: { type: Type.STRING },
        content: { type: Type.ARRAY, items: contentItemSchema },
        teacherGuide: { type: Type.ARRAY, items: contentItemSchema },
        practiceOptions: { type: Type.ARRAY, items: practiceOptionSchema }
    },
    required: ["type", "title", "content"]
};

const lessonPlanSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    meta: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        targetAudience: { type: Type.STRING },
        learningObjectives: { type: Type.ARRAY, items: { type: Type.STRING } },
        mode: { type: Type.STRING }
      },
      required: ["title", "targetAudience", "learningObjectives"]
    },
    preClass: sectionContentSchema,
    inClass: sectionContentSchema,
    postClass: sectionContentSchema,
    modules: { type: Type.ARRAY, items: moduleResultSchema }
  },
  required: ["meta", "preClass", "inClass", "postClass"]
};

const teacherGuideSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    preClass: { type: Type.ARRAY, items: contentItemSchema },
    inClass: { type: Type.ARRAY, items: contentItemSchema },
    postClass: { type: Type.ARRAY, items: contentItemSchema }
  },
  required: ["preClass", "inClass", "postClass"]
};

const singleSectionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    sectionData: sectionContentSchema
  },
  required: ["sectionData"]
};

const singleItemSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    itemData: contentItemSchema
  },
  required: ["itemData"]
};

const sectionGuideSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        guides: { type: Type.ARRAY, items: contentItemSchema }
    },
    required: ["guides"]
};

const correctionItemSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    original: { type: Type.STRING, description: "The original sentence or timestamp range" },
    correction: { type: Type.STRING, description: "The corrected version" },
    explanation: { type: Type.STRING, description: "Bilingual explanation of the error and correction" },
    audioFeedback: { type: Type.STRING, description: "Specific phonetic/pronunciation advice if applicable" }
  },
  required: ["original", "correction", "explanation"]
};

const homeworkCheckSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.STRING, description: "A score out of 100 or grade (e.g. 85/100, A-)" },
    overallFeedback: { type: Type.STRING, description: "General positive feedback and main areas for improvement (Bilingual)" },
    sentenceAnalysis: { type: Type.ARRAY, items: correctionItemSchema },
    revisedArticle: { type: Type.STRING, description: "The fully revised, natural version of the student's work." },
    suggestions: { type: Type.STRING, description: "Actionable study advice (Bilingual)" }
  },
  required: ["score", "overallFeedback", "sentenceAnalysis", "revisedArticle", "suggestions"]
};

// Fallback structure for In-Class if generation fails or returns empty
const FALLBACK_FULL_LESSON = [
  "1. Framework Intro (课程框架)",
  "2. Warm-up (痛点引入)",
  "3. Core Vocabulary (核心词汇)",
  "4. Grammar Points (语法知识)",
  "5. Scenario Dialogue (场景对话)",
  "6. Native Upgrade (地道表达)",
  "7. Fixed Practice (固定场景)",
  "8. Derived Practice (衍生场景)",
  "9. Culture (文化)",
  "10. Common Chinglish Errors (常见中式英语)",
  "11. Homework (课后作业)",
  "12. Summary (总结)"
].map(title => ({
    title,
    content: "Content generation incomplete. Please click the refresh icon above to regenerate this section.",
    tipsForTeacher: "Generation failed."
}));

// --- AUDIO HELPERS ---

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function pcmToWav(base64PCM: string, sampleRate: number = 24000): string {
  const binaryString = atob(base64PCM);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const numChannels = 1;
  const buffer = new ArrayBuffer(44 + bytes.length);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + bytes.length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true); // 16 bits
  writeString(view, 36, 'data');
  view.setUint32(40, bytes.length, true);

  const dest = new Uint8Array(buffer, 44);
  dest.set(bytes);

  let binary = '';
  const resultBytes = new Uint8Array(buffer);
  for (let i = 0; i < resultBytes.byteLength; i++) {
    binary += String.fromCharCode(resultBytes[i]);
  }
  return btoa(binary);
}

// Retry Logic Helper
async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries === 0) throw error;
    // Check for 500/503 or specific RPC errors that indicate temporary failure
    if (error.status === 503 || error.status === 500 || error.message?.includes("Rpc failed") || error.message?.includes("Overloaded") || error.message?.includes("deadline")) {
      console.warn(`API Error, retrying in ${delay}ms... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export const polishContent = async (text: string): Promise<string> => {
    if (!apiKey) throw new Error("API Key is missing.");
    const ai = new GoogleGenAI({ apiKey });
    
    return retryWithBackoff(async () => {
       const response = await ai.models.generateContent({
           model: 'gemini-3-pro-preview',
           contents: { parts: [{ 
               text: `Act as a Professional Curriculum Editor. Polish the following text to be clear, professional, and organized. If it is a list of topics, format them nicely. Keep the original language (Chinese or English) but improve the phrasing. Text:\n${text}` 
           }]}
       });
       return response.text ? response.text.trim() : text;
    });
};

export const regenerateSectionContent = async (originalItem: ContentItem, instruction: string): Promise<ContentItem> => {
    if (!apiKey) throw new Error("API Key is missing.");
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `
      You are a Senior ESL Curriculum Designer.
      TASK: Rewrite the provided content section based on the user's specific instructions.
      
      RULES:
      1. Keep the same format (Markdown, Tables where appropriate).
      2. Maintain Bilingual (English/Chinese) style.
      3. Satisfy the user's instruction completely.
      4. Include 'tipsForTeacher'.
    `;

    const prompt = `
      Original Title: ${originalItem.title}
      Original Content:
      ${originalItem.content}

      User's New Instruction: "${instruction}"

      Return a single ContentItem object with the new content.
    `;

    return retryWithBackoff(async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: { parts: [{ text: prompt }] },
            config: { 
                responseMimeType: "application/json", 
                responseSchema: singleItemSchema, 
                systemInstruction 
            }
        });
        if (response.text) {
            return JSON.parse(response.text).itemData;
        }
        throw new Error("Failed to regenerate content.");
    });
};

export const regenerateModulePractice = async (moduleTitle: string, instruction: string): Promise<PracticeOption[]> => {
    if (!apiKey) throw new Error("API Key is missing.");
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `
      You are a Senior Adult ESL Activity Designer.
      TASK: Generate or Regenerate exactly 3 fun, adult-appropriate interactive practice options based on the module and user instructions.
      
      RULES:
      1. Adult-Friendly: Relaxed, practical, useful for work/travel.
      2. Fun & Engaging: Roleplays, Gamified drills, Debates.
      3. Bilingual: English and Chinese.
      4. Format: Title + Description/Instruction.
    `;

    const prompt = `
      Module Topic: ${moduleTitle}
      User's Specific Instruction: "${instruction}"

      Generate 3 distinct Practice Options now.
    `;

    return retryWithBackoff(async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: { parts: [{ text: prompt }] },
            config: { 
                responseMimeType: "application/json", 
                responseSchema: practiceOptionsArraySchema, 
                systemInstruction 
            }
        });
        if (response.text) {
            return JSON.parse(response.text).practiceOptions;
        }
        throw new Error("Failed to generate practice options.");
    });
};

export const generateSpeech = async (text: string, voiceConfig?: VoiceConfig): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey });

  // Extract speakers from text (assuming "Name: Message" format)
  const lines = text.split('\n');
  const detectedSpeakers = new Set<string>();
  lines.forEach(line => {
    const match = line.match(/^([A-Za-z0-9\s]+):/);
    if (match && match[1].trim().length < 20) {
      detectedSpeakers.add(match[1].trim());
    }
  });
  
  const speakerList = Array.from(detectedSpeakers);
  const isMultiSpeaker = speakerList.length >= 2;

  let config: any = {
    responseModalities: [Modality.AUDIO],
  };

  if (isMultiSpeaker) {
     const defaultVoices = ['Puck', 'Kore', 'Fenrir', 'Charon', 'Zephyr'];
     const speakerVoiceConfigs = speakerList.map((speaker, index) => {
       // Use user mapped voice or fallback to round-robin default
       const voiceName = voiceConfig?.speakerMap?.[speaker] || defaultVoices[index % defaultVoices.length];
       return {
         speaker: speaker,
         voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } }
       };
     });

     config.speechConfig = {
        multiSpeakerVoiceConfig: {
           speakerVoiceConfigs: speakerVoiceConfigs
        }
     };
  } else {
     // Single speaker default (or mapped if 1 speaker exists)
     const singleSpeakerName = speakerList[0];
     const voiceName = (singleSpeakerName && voiceConfig?.speakerMap?.[singleSpeakerName]) 
        ? voiceConfig.speakerMap[singleSpeakerName] 
        : (voiceConfig?.speakerMap?.['default'] || 'Kore');

     config.speechConfig = {
        voiceConfig: {
           prebuiltVoiceConfig: { voiceName: voiceName },
        },
     };
  }

  return retryWithBackoff(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: config,
    });
  
    const base64PCM = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64PCM) throw new Error("Failed to generate audio");
    return pcmToWav(base64PCM);
  });
};

export const checkHomework = async (data: GeneratorFormData): Promise<HomeworkCheckResponse> => {
  if (!apiKey) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey });

  // Using 3-pro for complex multimodal analysis
  const model = 'gemini-3-pro-preview';
  
  const systemInstruction = `
    You are a Senior ESL Teacher correcting homework.
    Task: Analyze the student's submission (Text, Image, or Audio) and provide corrections in 5 steps.
    Direction: ${data.generationDirection || "General Correction"}
    
    REQUIRED OUTPUT STEPS:
    1. Score: Give a score (e.g., 85/100).
    2. Overall Feedback: Bilingual General feedback.
    3. Sentence Analysis: Detailed error correction (Original -> Correction -> Explanation).
    4. Revised Example: A completely rewritten, natural version of the student's work (Model Answer).
    5. Study Suggestions: Actionable advice.

    RULES:
    1. Bilingual Feedback (English & Chinese).
    2. If AUDIO: Analyze pronunciation, intonation, fluency, AND grammar.
    3. Be encouraging but precise.
  `;

  const parts: any[] = [];
  
  if (data.syllabus.text) {
      parts.push({ text: `Student Text Submission:\n${data.syllabus.text}` });
  }

  if (data.syllabus.file) {
      parts.push({
          inlineData: {
              mimeType: data.syllabus.file.mimeType,
              data: data.syllabus.file.data
          }
      });
  }

  parts.push({ text: `Teacher's Correction Direction: ${data.generationDirection}\nAnalyze and return JSON.` });

  return retryWithBackoff(async () => {
      const response = await ai.models.generateContent({
          model: model,
          contents: { parts },
          config: {
              responseMimeType: "application/json",
              responseSchema: homeworkCheckSchema,
              systemInstruction: systemInstruction,
          }
      });
      
      if (response.text) {
          return JSON.parse(response.text) as HomeworkCheckResponse;
      }
      throw new Error("Failed to analyze homework.");
  });
};

const getContentScale = (minutes: number) => {
  if (minutes <= 45) return "Concise. ~8 Vocab words. 1 Short Dialogue (10 lines).";
  if (minutes <= 60) return "Standard. ~12 Vocab words. 1 Medium Dialogue (14 lines).";
  if (minutes <= 90) return "Extended. ~15 Vocab words. 1 Long Dialogue + 1 Scenario.";
  if (minutes >= 120) return "Intensive. ~20 Vocab words. 1 Comprehensive Dialogue + 2 Roleplays.";
  return "Standard.";
};

export const generateLessonPlan = async (data: GeneratorFormData): Promise<LessonPlanResponse> => {
  
  if (data.mode === 'audio') {
     // Ensure Audio Tool bypasses "Step 2" by providing substantial content immediately
     const scriptContent = data.syllabus.text || "Please enter text to generate audio.";
     return {
        meta: {
            title: "Audio Tool Session",
            targetAudience: "N/A",
            learningObjectives: [],
            mode: 'audio'
        },
        preClass: { goal: "", duration: "", studentMaterials: [], teacherGuide: [] },
        inClass: { 
            goal: "Audio Generation", 
            duration: "N/A", 
            studentMaterials: [
                {
                    title: "Audio Script (Ready to Generate)",
                    content: scriptContent, // Direct injection
                    tipsForTeacher: "Click the audio icon to generate speech."
                }
            ], 
            teacherGuide: [] 
        },
        postClass: { goal: "", duration: "", studentMaterials: [], teacherGuide: [] },
        modules: []
     };
  }

  if (!apiKey) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey });
  const contentScale = getContentScale(Number(data.duration));
  
  // Construct context for Multiple Students
  const formatArr = (arr?: string[]) => arr && arr.length ? arr.join(", ") : "General";
  
  const studentContext = data.studentProfiles.map((p, index) => {
      const actualIndustry = (p.industry === '其他 (Other)' || p.industry?.includes('Other')) ? p.customIndustry : p.industry;
      const actualJob = (p.job === '其他 (Other)' || p.job?.includes('Other')) ? p.customJob : p.job;

      return `
      Student ${index + 1}:
      - English Level: ${p.englishLevel || 'Auto-Detect'}
      - Age: ${p.age || 'Unspecified'}
      - Industry: ${actualIndustry || 'General'}
      - Job: ${actualJob || 'General'}
      - Goal: ${formatArr(p.goal)}
      - Interests: ${formatArr(p.interests)}
      `;
  }).join('\n');

  const systemInstruction = `
    You are a Senior Adult ESL Curriculum Designer for 'Marvellous Education'.
    
    STRICT RULES:
    1. BILINGUAL: ALL content (Titles, Explanations, Scenarios) MUST be English AND Chinese.
    2. MARKDOWN: Use Markdown tables/lists. 
    3. DIALOGUE FORMATTING: You MUST use double newlines (\\n\\n) between speakers to separate paragraphs.
    4. NO HTML TAGS: Do not use <b>, <i>, <br>, <span>. Use Markdown *italics* or **bold**.
    5. TEACHER HELPERS: For each 'studentMaterial' item, you MUST provide concise 'tipsForTeacher' (e.g., CCQs, Timing, Instruction Check) in BILINGUAL format. 
       - Do NOT leave 'tipsForTeacher' empty for core sections (Vocab, Dialogue).
       - Keep the main 'teacherGuide' array EMPTY [] (we focus on inline tips).
    6. PRE/POST CLASS: If mode is 'full', leave 'preClass.studentMaterials' and 'postClass.studentMaterials' EMPTY [] (to be generated later).
    7. CONTENT SCALE: ${contentScale}
    8. GROUP CONTEXT: There are ${data.studentProfiles.length} student(s). Fuse their profiles to create relevant, engaging content for EVERYONE in the group.
  `;

  let promptTask = "";
  const userDirection = data.additionalPrompt || data.generationDirection ? `User Direction/Focus: ${data.additionalPrompt || data.generationDirection}` : "";
  const includePracticeInstructions = data.includeRelatedPractice 
    ? "IMPORTANT: You MUST also generate 'practiceOptions' for EACH module. Provide exactly 3 fun, adult-appropriate, interactive practice ideas (Roleplay, Game, Debate) related to that module's content." 
    : "";

  if (data.mode === 'module') {
    promptTask = `
      TASK: Generate Specialized Modules (专项模块).
      Selected Modules: ${JSON.stringify(data.moduleTypes)}
      ${userDirection}
      ${includePracticeInstructions}
      
      STRICT GENERATION RULE:
      Populate the 'modules' array in the JSON response. 
      For EACH selected module type, create a separate object in the 'modules' array.
      
      Structure for EACH Module Object:
      - title: The Name of the Module (e.g., "Grammar Module / 语法模块", "Pronunciation / 发音").
      - type: The Module Type key.
      - content: An array of exactly 3 ContentItems in this specific order:
        1. Theory & Concepts (理论知识): Explain the core rules/concepts. (Bilingual)
        2. Practical Examples (实战案例): Provide AT LEAST 5 specific examples/cases. (Bilingual Markdown Table/List)
        3. Classroom Interaction (课堂互动): Create an activity/roleplay for the class. (Bilingual)
      - practiceOptions: (Optional) If requested, an array of 3 PracticeOption objects ({title, content}).

      IMPORTANT:
      - Do NOT lump everything into one big list. Separate them by Module.
      - Leave 'preClass', 'inClass', and 'postClass' empty.
      - Ensure 'tipsForTeacher' are included inside the content items.

      SPECIFIC INSTRUCTIONS:
      - ${ModuleType.INTERACTIVE}: If selected, focus Step 3 on: ${JSON.stringify(data.interactiveModes)}.
      - ${ModuleType.HUMOR}: If selected, Step 2 must be 5+ funny scripts/one-liners.
      - ${ModuleType.HOMEWORK}: If selected, Step 3 can be the assignment setup.

      FORMATTING:
      - BILINGUAL: English + Chinese for everything.
    `;
  } else {
    promptTask = `
      TASK: Full Lesson Plan (Duration: ${data.duration} min).
      ${userDirection}
      Output 'inClass' section with exactly these 12 steps.
      ENSURE OUTPUT IS COMPLETE. Do not truncate. Prioritize tables and scripts.
      LEAVE 'preClass' and 'postClass' EMPTY for now.

      1. Framework Intro (课程框架)
      2. Warm-up (痛点引入)
      3. Core Vocabulary (核心词汇) - MARKDOWN TABLE. (Word | Pronunciation | Chinese | Example).
      4. Grammar Points (语法知识) - Generate Rule | Explanation | Example. (Do NOT leave empty).
      5. Scenario Dialogue (场景对话) - STRICTLY MARKDOWN. English Script Block FIRST, then Chinese Translation Block. Use \\n\\n between speakers.
      6. Native Upgrade (地道表达) - MARKDOWN TABLE (Textbook vs Native). AT LEAST 5 ENTRIES.
      7. Fixed Practice (固定场景) - Fill-in-blanks or drills. Use Bullet Points. REQUIRED: Provide "Reference Answers" (参考答案).
      8. Derived Practice (衍生场景) - LEAVE CONTENT EMPTY (will generate later).
      9. Culture (文化) - Bilingual explanation.
      10. Common Chinglish Errors (常见中式英语) - Table: Chinglish | Native Expression | Explanation.
      11. Homework (课后作业) - LEAVE CONTENT EMPTY (will generate later).
      12. Summary (总结) - LEAVE CONTENT EMPTY (will generate later).
    `;
  }

  // Safe construction of text parts to avoid backtick nesting issues
  const parts: any[] = [
    { text: promptTask },
    { text: `Input Context:\n- Mode: ${data.classMode}\n- Students Profile:\n${studentContext}\n- Duration: ${data.duration} mins` },
    { text: `Additional User Instructions: ${data.additionalPrompt || data.generationDirection || "None"}\nRETURN JSON ONLY.` }
  ];
  
  if (data.syllabus.text) {
      parts.push({ text: `Syllabus Text (Analyze deeply):\n"${data.syllabus.text.substring(0, 10000)}"` });
  }

  if (data.syllabus.file) {
    parts.push({
      inlineData: {
        mimeType: data.syllabus.file.mimeType,
        data: data.syllabus.file.data
      }
    });
  }

  return retryWithBackoff(async () => {
    // Switched to 3-pro for complex text task
    const model = 'gemini-3-pro-preview';
    
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: lessonPlanSchema,
        systemInstruction: systemInstruction,
      }
    });

    if (response.text) {
        try {
            const parsed = JSON.parse(response.text) as LessonPlanResponse;
            parsed.meta.mode = data.mode; 

            // Fallback for Full Lesson if inClass is empty or truncated
            if (data.mode === 'full' && (!parsed.inClass.studentMaterials || parsed.inClass.studentMaterials.length === 0)) {
                parsed.inClass.studentMaterials = FALLBACK_FULL_LESSON;
            }

            // Fallback for Modules if empty
            if (data.mode === 'module' && (!parsed.modules || parsed.modules.length === 0)) {
                parsed.modules = data.moduleTypes.map(m => ({
                    type: m,
                    title: m,
                    content: [{ title: "Generation Failed", content: "Content generation incomplete. Please regenerate this module.", tipsForTeacher: "" }]
                }));
            }

            return parsed;
        } catch (e) {
            console.error("JSON Parse Error", response.text);
            throw new Error("Failed to parse generated content. The model might have been interrupted.");
        }
    }
    throw new Error("No content generated");
  });
};

export const generatePreClass = async (lessonPlan: LessonPlanResponse): Promise<SectionContent> => {
    if (!apiKey) throw new Error("API Key is missing.");
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `
      You are a Senior ESL Teacher. Generate High-Quality PRE-CLASS Materials (Bilingual).
      Goal: Prepare the student for the upcoming lesson.
      RULES:
      1. BILINGUAL: English and Chinese.
      2. TEACHER TIPS: Include brief 'tipsForTeacher' for each item.
      3. CLEAN: Do not use bold markers (**).
      Content MUST include:
      1. Course Overview (课程概要)
      2. Core Vocabulary Preview (核心词汇预习 - Table)
      3. Key Sentence Structures (核心句式预习) - IMPORTANT: Format this as a MARKDOWN TABLE (Sentence | Structure | Meaning).
      4. Oral Practice Task (口语打卡任务) - A specific task for them to record before class.
    `;

    const prompt = `
      Generate 'preClass' materials based on this Lesson Title: "${lessonPlan.meta.title}".
      Target Audience: ${lessonPlan.meta.targetAudience}.
      Return JSON object with 'sectionData'.
    `;

    return retryWithBackoff(async () => {
      // Switched to 3-pro
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts: [{ text: prompt }] },
        config: {
          responseMimeType: "application/json",
          responseSchema: singleSectionSchema,
          systemInstruction: systemInstruction,
        }
      });

      if (response.text) {
          const parsed = JSON.parse(response.text);
          return { ...parsed.sectionData, teacherGuide: [] }; // Explicitly ensure empty guide
      }
      throw new Error("Failed to generate pre-class materials");
    });
};

export const generatePostClass = async (lessonPlan: LessonPlanResponse): Promise<SectionContent> => {
    if (!apiKey) throw new Error("API Key is missing.");
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `
      You are a Senior ESL Teacher. Generate High-Quality POST-CLASS Materials (Bilingual).
      Goal: Consolidate learning.
      RULES:
      1. BILINGUAL: English and Chinese for ALL explanations.
      2. STUDENT-FRIENDLY: Provide DETAILED explanations.
      3. TEACHER TIPS: Include brief 'tipsForTeacher' for each item.
      4. CLEAN: Do not use bold markers (**).
      5. FORMATTING: 
         - Vocab Review MUST be a Markdown TABLE.
         - Key Sentences MUST be a Markdown TABLE or List.
         - Use "---" (horizontal rule) to separate major items.
      
      Content MUST include:
      1. Review of Core Vocabulary (核心词汇复习 - with detailed definitions/usages)
      2. Review of Key Sentences (核心句式复习 - with usage notes)
      3. Native Expression Recap (地道表达回顾 - with context)
      4. Grammar Recap (语法回顾 - detailed bilingual explanation)
      5. Cultural Insight Summary (文化要点总结 - detailed bilingual story/fact)
    `;

    const prompt = `
      Generate 'postClass' materials based on this Lesson Title: "${lessonPlan.meta.title}".
      Target Audience: ${lessonPlan.meta.targetAudience}.
      Return JSON object with 'sectionData'.
    `;

    return retryWithBackoff(async () => {
      // Switched to 3-pro
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts: [{ text: prompt }] },
        config: {
          responseMimeType: "application/json",
          responseSchema: singleSectionSchema,
          systemInstruction: systemInstruction,
        }
      });

      if (response.text) {
          const parsed = JSON.parse(response.text);
          return { ...parsed.sectionData, teacherGuide: [] }; // Explicitly ensure empty guide
      }
      throw new Error("Failed to generate post-class materials");
    });
};

export const generateGrammar = async (lessonPlan: LessonPlanResponse): Promise<ContentItem> => {
    if (!apiKey) throw new Error("API Key is missing.");
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `Generate Grammar Points (Bilingual). Format: Rule | Explanation | Example. Include 'tipsForTeacher' (CCQs).`;
    const prompt = `Generate specific 'Grammar Points' for lesson: "${lessonPlan.meta.title}". Audience: ${lessonPlan.meta.targetAudience}. Return ContentItem.`;

    return retryWithBackoff(async () => {
        // Switched to 3-pro
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: { parts: [{ text: prompt }] },
            config: { responseMimeType: "application/json", responseSchema: singleItemSchema, systemInstruction }
        });
        if (response.text) {
           const data = JSON.parse(response.text).itemData;
           return data;
        }
        throw new Error("Failed");
    });
};

export const generateDerivedPractice = async (lessonPlan: LessonPlanResponse): Promise<ContentItem> => {
    if (!apiKey) throw new Error("API Key is missing.");
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `Generate Derived Practice (Bilingual). Create a new scenario different from the main one. Include 'tipsForTeacher'.`;
    const prompt = `Generate 'Derived Practice' for lesson: "${lessonPlan.meta.title}". Return ContentItem.`;
    return retryWithBackoff(async () => {
        // Switched to 3-pro
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: { parts: [{ text: prompt }] },
            config: { responseMimeType: "application/json", responseSchema: singleItemSchema, systemInstruction }
        });
        if (response.text) return JSON.parse(response.text).itemData;
        throw new Error("Failed");
    });
};

export const generateHomework = async (lessonPlan: LessonPlanResponse, type: 'Written' | 'Oral' | 'Both'): Promise<ContentItem> => {
    if (!apiKey) throw new Error("API Key is missing.");
    const ai = new GoogleGenAI({ apiKey });
    // Explicitly forbid HTML
    const systemInstruction = `Generate Homework (Bilingual). Type: ${type}. IMPORTANT: USE PURE MARKDOWN ONLY. NO HTML TAGS. Include 'tipsForTeacher' (Grading criteria).`;
    const prompt = `Generate 'Homework' tasks for lesson: "${lessonPlan.meta.title}". Return ContentItem.`;
    return retryWithBackoff(async () => {
        // Switched to 3-pro
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: { parts: [{ text: prompt }] },
            config: { responseMimeType: "application/json", responseSchema: singleItemSchema, systemInstruction }
        });
        if (response.text) {
            const data = JSON.parse(response.text).itemData;
            return data;
        }
        throw new Error("Failed");
    });
};

export const generateSummary = async (lessonPlan: LessonPlanResponse): Promise<ContentItem> => {
    if (!apiKey) throw new Error("API Key is missing.");
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `
        Generate Lesson Summary (Bilingual). 
        Format as:
        1. Vocabulary List (词汇表)
        2. Key Sentences (重点句型)
        3. Cultural Insight (文化要点)
        Include 'tipsForTeacher' (Recap questions).
    `;
    const prompt = `Generate 'Summary' for lesson: "${lessonPlan.meta.title}". Return ContentItem.`;
    return retryWithBackoff(async () => {
        // Switched to 3-pro
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: { parts: [{ text: prompt }] },
            config: { responseMimeType: "application/json", responseSchema: singleItemSchema, systemInstruction }
        });
        if (response.text) {
            const data = JSON.parse(response.text).itemData;
            return data;
        }
        throw new Error("Failed");
    });
};

// Generates guides ONLY for a specific section (pre, in, or post) based on its current content
export const generateSectionGuide = async (sectionName: string, title: string, studentMaterials: ContentItem[]): Promise<ContentItem[]> => {
    if (!apiKey) throw new Error("API Key is missing.");
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `
      You are a Senior Teacher Trainer for Marvellous Education.
      Generate DETAILED, BILINGUAL (English + Chinese) teaching guides for the provided student materials.
      Rules:
      1. Provide instruction steps, CCQs, timing, and error correction advice.
      2. Bilingual: English first, then Chinese.
      3. Format: Markdown.
    `;

    const prompt = `
      Generate Teacher Guides for the '${sectionName}' section of lesson: "${title}".
      
      Student Materials to cover:
      ${JSON.stringify(studentMaterials.map(m => ({ title: m.title, content: m.content.substring(0, 500) })))}

      RETURN JSON with 'guides' array.
    `;

    return retryWithBackoff(async () => {
      // Switched to 3-pro
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts: [{ text: prompt }] },
        config: {
          responseMimeType: "application/json",
          responseSchema: sectionGuideSchema,
          systemInstruction: systemInstruction,
        }
      });

      if (response.text) {
          const parsed = JSON.parse(response.text);
          return parsed.guides || [];
      }
      throw new Error("Failed to generate section guide");
    });
};

export const generateTeacherGuides = async (lessonPlan: LessonPlanResponse): Promise<TeacherGuideResponse> => {
  if (!apiKey) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey });
  const systemInstruction = `
    You are a Senior Teacher Trainer. Generate DETAILED, BILINGUAL teaching guides.
    Rules: Bilingual (EN/CN), Markdown.
  `;
  const prompt = `Generate Teacher Guides for "${lessonPlan.meta.title}". Return JSON with preClass, inClass, postClass arrays.`;

  return retryWithBackoff(async () => {
    // Switched to 3-pro
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: teacherGuideSchema,
        systemInstruction: systemInstruction,
      }
    });
    if (response.text) return JSON.parse(response.text) as TeacherGuideResponse;
    throw new Error("Failed to generate teacher guides");
  });
};
