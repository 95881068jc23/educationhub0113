
import { Type, Schema, Modality } from "@google/genai";
import { OptimizationConfig, OptimizationResult, InterviewMode, InterviewPrep, WritingGuide, AnalysisResult, WritingExerciseFeedback, InterviewDifficulty } from "../types";
import { callGeminiAPI } from "../../../services/geminiProxy";

// --- SCHEMAS ---

const interviewQuestionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    questionCn: { type: Type.STRING },
    questionEn: { type: Type.STRING },
    type: { type: Type.STRING, enum: ["Behavioral", "Technical", "General"] },
    intentCn: { type: Type.STRING },
    keyPointsCn: { type: Type.ARRAY, items: { type: Type.STRING } },
    sampleAnswerEn: { type: Type.STRING },
  },
  required: ["questionCn", "questionEn", "intentCn", "keyPointsCn", "sampleAnswerEn"]
};

const atsIssueSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    issueCn: { type: Type.STRING, description: "Detailed description of the formatting issue in Chinese, specifically explaining WHY it is problematic for ATS (e.g., 'Complex tables confuse the reading order...')." },
    issueEn: { type: Type.STRING, description: "Detailed description of the formatting issue in English." },
    suggestionCn: { type: Type.STRING, description: "Precise, actionable step-by-step instruction in Chinese on how to resolve the issue." },
    suggestionEn: { type: Type.STRING },
    severity: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
  },
  required: ["issueCn", "issueEn", "suggestionCn", "suggestionEn", "severity"]
};

const atsDataSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.NUMBER, description: "Total ATS compatibility score out of 100." },
    keywordScore: { type: Type.NUMBER, description: "Score out of 40 based on JD keyword matching." },
    formattingScore: { type: Type.NUMBER, description: "Score out of 30 based on parsing compatibility (tables, headers, etc.)." },
    structureScore: { type: Type.NUMBER, description: "Score out of 30 based on logical section flow and detection." },
    keywordsMatched: { type: Type.ARRAY, items: { type: Type.STRING } },
    keywordsMissing: { type: Type.ARRAY, items: { type: Type.STRING } },
    formattingIssues: { 
      type: Type.ARRAY, 
      items: atsIssueSchema,
      description: "Specific obstacles like tables, graphics, headers in sidebars, or non-standard symbols."
    },
    detailedFeedbackCn: { type: Type.STRING },
    detailedFeedbackEn: { type: Type.STRING },
  },
  required: ["score", "keywordScore", "formattingScore", "structureScore", "keywordsMatched", "keywordsMissing", "formattingIssues", "detailedFeedbackCn"]
};

// Interview Structure Schema
const interviewPrepSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    part1_intro: { type: Type.ARRAY, items: interviewQuestionSchema, description: "1-2 questions: Ice breaking & simple intro." },
    part2_cv: { type: Type.ARRAY, items: interviewQuestionSchema, description: "2-3 questions: Walk through resume, highlight experience." },
    part3_behavioral: { type: Type.ARRAY, items: interviewQuestionSchema, description: "3-4 questions: STAR method deep dive." },
    part4_technical: { type: Type.ARRAY, items: interviewQuestionSchema, description: "2-3 questions: Hard skills & Motivation for this role." },
    part5_reverse: { type: Type.ARRAY, items: interviewQuestionSchema, description: "2 questions: Good questions for the candidate to ask the interviewer." },
  },
  required: ["part1_intro", "part2_cv", "part3_behavioral", "part4_technical", "part5_reverse"]
};

// Main Analysis Result Schema
const masterSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    analysis: {
      type: Type.OBJECT,
      properties: {
        overallScore: { type: Type.NUMBER },
        summaryCn: { type: Type.STRING },
        summaryEn: { type: Type.STRING },
        strengthsCn: { type: Type.ARRAY, items: { type: Type.STRING } },
        strengthsEn: { type: Type.ARRAY, items: { type: Type.STRING } },
        issues: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              section: { type: Type.STRING },
              originalTextSnippet: { type: Type.STRING },
              issueType: { type: Type.STRING, enum: ["Critical", "Improvement", "Formatting", "Language"] },
              reasonCn: { type: Type.STRING },
              reasonEn: { type: Type.STRING },
              suggestionCn: { type: Type.STRING },
              suggestionEn: { type: Type.STRING },
              exampleOriginal: { type: Type.STRING },
              exampleImprovedEn: { type: Type.STRING },
              exampleImprovedCn: { type: Type.STRING },
            },
            required: ["section", "originalTextSnippet", "issueType", "reasonCn", "suggestionCn", "exampleImprovedEn"],
          },
        },
        atsAnalysis: {
          type: Type.OBJECT,
          properties: {
            original: atsDataSchema,
            optimized: atsDataSchema,
            sectionDetection: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["original", "optimized", "sectionDetection"]
        },
        writingGuide: {
          type: Type.OBJECT,
          properties: {
            conceptExplanationCn: { type: Type.STRING, description: "Brief introduction to STAR method (1-2 sentences)." },
          },
          required: ["conceptExplanationCn"]
        },
        // Note: We define this but often generate it lazily to save tokens
        interviewPrep: interviewPrepSchema 
      },
      required: ["overallScore", "summaryCn", "issues", "atsAnalysis", "writingGuide"],
    },
    optimizedContentTarget: { 
      type: Type.STRING, 
      description: "Full resume in Target Language (Markdown)." 
    },
    optimizedContentNative: { 
      type: Type.STRING, 
      description: "Full resume in CHINESE (Markdown). Translation of optimized version." 
    },
    transcribedOriginal: { type: Type.STRING, description: "OCR/Transcription of original file." }
  },
  required: ["analysis", "optimizedContentTarget", "optimizedContentNative", "transcribedOriginal"],
};

// --- FUNCTIONS ---

export const processResume = async (config: OptimizationConfig): Promise<OptimizationResult> => {
  const modelId = "gemini-3-flash-preview"; 

  const contentParts: any[] = [];

  if (config.fileInput) {
    contentParts.push({ inlineData: { mimeType: config.fileInput.mimeType, data: config.fileInput.data } });
  } else if (config.originalResume) {
    contentParts.push({ text: `RESUME CONTENT:\n${config.originalResume}` });
  }

  if (config.jdFile) {
    contentParts.push({ inlineData: { mimeType: config.jdFile.mimeType, data: config.jdFile.data } });
  } else if (config.jobDescription) {
    contentParts.push({ text: `TARGET JOB DESCRIPTION:\n${config.jobDescription}` });
  }

  // Add refinement instruction if present
  if (config.refinementInstruction) {
    contentParts.push({ text: `Refine based on: ${config.refinementInstruction}` });
  } else {
    contentParts.push({ text: "Analyze and optimize this resume." });
  }

  const systemInstruction = `
    You are GlobalCV Pro, an expert resume optimizer and ATS specialist.
    
    IMPORTANT: You must return a COMPLETE JSON object matching the provided schema. 

    ATS ANALYSIS & SCORING RULES:
    1. Score Calculation:
       - Keyword Match (Max 40): Based on how well the skills match the provided Job Description.
       - Formatting (Max 30): Deduct for tables, images, multiple columns, or non-standard headers in the original.
       - Structure (Max 30): Check for clear sections, dates, and logical hierarchy.
    2. Formatting Diagnosis:
       - For each identified formatting issue:
         - Identify the specific element (e.g., 'Sidebar header', 'Background image').
         - Explain WHY it breaks ATS (e.g., 'ATS systems read left-to-right; sidebar text may be merged into the middle of experience descriptions').
         - Provide a Step-by-Step ACTIONABLE FIX for the user.
    3. Optimized Resume:
       - The optimized version MUST be single-column, Markdown-formatted, and table-free to maximize the formatting score.

    LANGUAGE RULES:
    1. 'optimizedContentTarget': MUST be in ${config.targetLanguage}.
    2. 'optimizedContentNative': MUST be in CHINESE (简体中文). 

    FORMATTING (CRITICAL):
    - Name: # Name
    - Contact: Location | Phone | Email
    - Sections: ## SECTION NAME
    - Entries: ### Job Title, Company **Date Range**
    - Use double newlines (\\n\\n) before every ## and ### header.

    Rewrites MUST use the STAR method.
    
    NOTE: For the 'interviewPrep' field in the schema, you can leave it empty or minimal for this initial pass, as the user will generate it specifically later.
  `;

  try {
    const response = await callGeminiAPI({
      model: modelId,
      contents: [
        {
          role: "user",
          parts: contentParts
        }
      ],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: masterSchema
      },
    });

    const text = response.text || "{}";
    let result: OptimizationResult;
    
    try {
      result = JSON.parse(text) as OptimizationResult;
    } catch (parseError) {
      console.error("JSON Parse Error. Raw response:", text);
      throw new Error("AI returned invalid JSON. Please try again.");
    }
    
    if (!result.analysis) {
        throw new Error("AI failed to generate analysis data. Please try again.");
    }
    
    if (!result.analysis.atsAnalysis) {
        result.analysis.atsAnalysis = {
            original: { score: 0, keywordScore: 0, formattingScore: 0, structureScore: 0, keywordsMatched: [], keywordsMissing: [], formattingIssues: [], detailedFeedbackCn: "Analysis unavailable" },
            optimized: { score: 0, keywordScore: 0, formattingScore: 0, structureScore: 0, keywordsMatched: [], keywordsMissing: [], formattingIssues: [], detailedFeedbackCn: "Analysis unavailable" },
            sectionDetection: []
        };
    }

    const cleanMd = (s: string) => s?.replace(/^```markdown\n/, '').replace(/^```\n/, '').replace(/\n```$/, '');
    result.optimizedContentTarget = cleanMd(result.optimizedContentTarget);
    result.optimizedContentNative = cleanMd(result.optimizedContentNative);
    result.transcribedOriginal = cleanMd(result.transcribedOriginal);

    return result;

  } catch (error) {
    console.error("Gemini API Error Detail:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to process resume. Please try again.");
  }
};

export const regenerateInterviewQuestions = async (
    currentResult: OptimizationResult,
    config: OptimizationConfig,
    prompt: string
): Promise<InterviewPrep> => {
    const modelId = "gemini-3-flash-preview";
    
    const difficulty = config.interviewDifficulty || InterviewDifficulty.ADVANCED;
    const isBasic = difficulty === InterviewDifficulty.BASIC;

    const systemInstruction = `
        You are an elite Interview Coach simulating a full structured interview.
        Context: User is applying for a job using the provided resume.
        Difficulty: ${isBasic ? 'Basic' : 'Advanced'}.
        Target: "${config.targetCompany || "Global Company"}".
        
        Generate a comprehensive 5-Part Interview Script matching the JSON schema exactly:
        
        Part 1: Introduction & Ice-breaking (开场与暖场)
        - Casual but professional questions to settle nerves (e.g., "Tell me a bit about yourself", "How did you hear about us?").
        
        Part 2: Self-Introduction & CV Walkthrough (自我介绍与简历核实)
        - Specific questions probing the timeline or key transitions in the resume.
        
        Part 3: Behavioral Interview (核心环节：行为面试)
        - TOUGH questions requiring STAR method responses (e.g., conflict, failure, leadership).
        
        Part 4: Role-specific & Motivation (岗位专业性与动机考察)
        - Why this company? Why this role? Technical/Industry specific knowledge checks.
        
        Part 5: Reverse Interviewing (Q&A 候选人提问环节)
        - Suggest smart, impressive questions the CANDIDATE should ask the interviewer.
        
        For "sampleAnswerEn", provide a high-scoring answer example.
    `;

    const response = await callGeminiAPI({
        model: modelId,
        contents: [
            {
              role: "user",
              parts: [
                { text: `Resume Content: ${currentResult.optimizedContentTarget.substring(0, 5000)}` },
                { text: `Job Description: ${config.jobDescription || "Standard role in industry"}` },
                { text: `Generate the 5-part interview script.` }
              ]
            }
        ],
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: interviewPrepSchema
        }
    });

    const data = JSON.parse(response.text || "{}");
    return { ...data, isGenerated: true };
};

export const generateWritingGuide = async (config: OptimizationConfig): Promise<WritingGuide> => {
    const modelId = "gemini-3-flash-preview";

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            conceptExplanationCn: { type: Type.STRING },
            conceptExplanationEn: { type: Type.STRING },
            exercises: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  scenarioCn: { type: Type.STRING },
                  scenarioEn: { type: Type.STRING },
                  taskCn: { type: Type.STRING },
                  taskEn: { type: Type.STRING },
                }
              }
            }
        },
        required: ["conceptExplanationCn", "conceptExplanationEn", "exercises"]
    };

    const response = await callGeminiAPI({
        model: modelId,
        contents: [
          {
            role: "user",
            parts: [{ text: "Generate detailed STAR method exercises based on typical resume weaknesses." }]
          }
        ],
        config: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    return { ...JSON.parse(response.text || "{}"), isGenerated: true };
};

export const evaluateWritingExercise = async (task: string, answer: string): Promise<WritingExerciseFeedback> => {
  const modelId = "gemini-3-flash-preview";

  const systemInstruction = `
    Resume Writing Coach. Evaluate draft based on STAR.
    Task: "${task}"
    Draft: "${answer}"
    Output JSON (score, critique, improvedVersion).
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.NUMBER },
      critique: { type: Type.STRING },
      improvedVersion: { type: Type.STRING },
    },
    required: ["score", "critique", "improvedVersion"]
  };

  try {
    const response = await callGeminiAPI({
      model: modelId,
      contents: [
        {
          role: "user",
          parts: [{ text: "Evaluate." }]
        }
      ],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });
    return JSON.parse(response.text || "{}") as WritingExerciseFeedback;
  } catch (e) {
    console.error(e);
    return { score: 0, critique: "Evaluation failed.", improvedVersion: "" };
  }
};

export const processVoiceInterview = async (audioBase64: string, question: string, resumeContext: string): Promise<{ textResponse: string }> => {
  const modelId = "gemini-3-flash-preview"; 

  const prompt = `
    Question: "${question}". Respond to the user's audio answer.
  `;

  try {
    const response = await callGeminiAPI({
      model: modelId,
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }, { inlineData: { mimeType: "audio/wav", data: audioBase64 } }]
        }
      ],
    });
    return { textResponse: response.text || "Could you repeat that?" };
  } catch (error) {
    throw new Error("Voice processing failed.");
  }
};
