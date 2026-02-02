
import { Type } from "@google/genai";
import { Topic, TopicCategory, TopicSyllabus, StudentProfile, PlannedModule } from "../types";
import { callGeminiAPI } from "../../../services/geminiProxy";

/**
 * Robustly extracts JSON from a string that might contain markdown or conversational text.
 * Finds the first '{' and the last '}' to isolate the object.
 */
const extractJson = (text: string): string => {
  if (!text) return "{}";
  
  // 1. Remove markdown code blocks if present
  let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  
  // 2. Find the index of the first '{' and last '}'
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  // 3. If valid braces found, extract the substring
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  // 4. Fallback: try to find array brackets if it's a list generation
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    return cleaned.substring(firstBracket, lastBracket + 1);
  }

  return cleaned;
};

export const generateCustomTopics = async (
  instruction: string,
  level: string,
  count: number = 12
): Promise<Topic[]> => {
  const model = "gemini-3-pro-preview";
  const prompt = `
    You are a senior curriculum developer for Marvellous Education. 
    Generate a list of ${count} detailed English learning topics for a 1-on-1 private course.
    
    Instruction/Context: ${instruction}
    Target CEFR Level: ${level} (STRICT ADHERENCE REQUIRED)

    Rules:
    1. Topics MUST be SCENARIO-BASED and strictly derived from the context above.
    2. BILINGUAL MANDATE (English & Chinese):
       - "title": "中文标题 / English Title"
       - "description": "中文描述 / English Description"
       - "practicalScenario": "详细的中英双语场景描述 / Detailed bilingual scenario description"
    3. DO NOT include Pinyin.
    4. Return ONLY valid JSON array. No conversational text.
    
    Expected JSON Structure:
    [
      {
        "title": "...",
        "description": "...",
        "practicalScenario": "..."
      }
    ]
  `;

  try {
    const response = await callGeminiAPI({
      model,
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      config: { responseMimeType: "application/json" }
    });

    const jsonStr = extractJson(response.text || "[]");
    const rawTopics = JSON.parse(jsonStr);
    
    return rawTopics.map((t: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      title: t.title,
      description: t.description,
      practicalScenario: t.practicalScenario,
      minHours: 2,
      maxHours: 4,
      category: TopicCategory.AI_Generated
    }));

  } catch (error) {
    console.error("Gemini API Error:", error);
    // If we have a text response but failed to parse, log it
    if (error instanceof SyntaxError) {
       console.error("Failed to parse JSON. Raw text might be invalid.");
    }
    return generateMockTopics(count);
  }
};

export const generateTopicSyllabus = async (
  topicTitle: string,
  level: string,
  scenario: string,
  studentProfile: string,
  topicContext?: string,
  refinementInstruction?: string
): Promise<TopicSyllabus | null> => {
  const model = "gemini-3-pro-preview";
  const prompt = `
    You are an expert ESL Curriculum Designer. Create a detailed lesson syllabus.
    Topic: "${topicTitle}"
    Level: ${level}
    Scenario: ${scenario}
    Context: ${topicContext || 'General English'}
    Student: ${studentProfile}
    
    ${refinementInstruction ? `REFINEMENT REQUEST: ${refinementInstruction}` : ''}

    STRICT OUTPUT RULES:
    1. Output MUST be a SINGLE valid JSON object. 
    2. NO conversational text (e.g., "Here is your plan...").
    3. NO PINYIN.
    4. "coreVocab" MUST include IPA (e.g., /wɜːrd/).
    
    QUANTITY & LANGUAGE RULES:
    1. "coreVocab": At least 10 items. "context" (example sentence) must be Bilingual (En+Cn).
    2. "coreSentences": At least 10 items.
    3. "advancedExpressions": At least 10 items. "nuance" (usage explanation) must be Bilingual (En+Cn).
    4. "commonMistakes": At least 10 items. "reason" (grammar/culture reason) must be Bilingual (En+Cn).
    5. "culturalInsight": "title" and "content" must be Bilingual (En+Cn).
    
    Required JSON Structure:
    {
      "coreVocab": [{"word": "string", "pronunciation": "string", "meaning": "string (Chinese)", "context": "string (Bilingual Sentence)"}],
      "coreSentences": [{"sentence": "string", "translation": "string"}],
      "advancedExpressions": [{"expression": "string", "translation": "string", "nuance": "string (Bilingual Explanation)"}],
      "commonMistakes": [{"mistake": "string", "correction": "string", "reason": "string (Bilingual Explanation)"}],
      "culturalInsight": {"title": "string (Bilingual)", "content": "string (Bilingual)"},
      "outline": [{"phase": "string", "activity": "string", "method": "Input|Output|Feedback"}]
    }
  `;

  try {
    const response = await callGeminiAPI({
      model,
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      config: { 
        responseMimeType: "application/json"
      }
    });

    const cleanJson = extractJson(response.text || "{}");
    const parsed = JSON.parse(cleanJson);
    
    // Simple validation to ensure it's not empty or malformed
    if (!parsed.coreVocab || !Array.isArray(parsed.coreVocab)) {
        throw new Error("Invalid syllabus structure received.");
    }

    return parsed as TopicSyllabus;
  } catch (error) {
    console.error("Syllabus Generation Error:", error);
    return null;
  }
};

export const generatePlanRationale = async (
  profile: StudentProfile,
  modules: PlannedModule[]
): Promise<string> => {
  const model = "gemini-3-pro-preview";
  const prompt = `Write a 200-word course design rationale for ${profile.name} (${profile.industry}, ${profile.role}). Focus on how the plan meets their ${profile.learningDirections.join(',')} goals. Bilingual English/Chinese.`;

  try {
    const response = await callGeminiAPI({ 
      model, 
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ]
    });
    return response.text || "Failed to generate rationale.";
  } catch (error) {
    return "Error generating rationale.";
  }
};

export const generatePathGenerationRationale = async (
  profile: StudentProfile,
  strategy: string
): Promise<string> => {
  const model = "gemini-3-pro-preview";
  const prompt = `Explain why strategy "${strategy}" was chosen for ${profile.name}. 3-4 sentences. Professional Chinese.`;
  try {
    const response = await callGeminiAPI({ 
      model, 
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ]
    });
    return response.text || "Generated successfully.";
  } catch (e) {
    return "Generated based on selected strategy.";
  }
};

const generateMockTopics = (count: number): Topic[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `mock-${i}`,
    title: `定制话题 / Custom Topic ${i + 1}`,
    description: "Generated topic description placeholder.",
    practicalScenario: "Learn to handle this specific real-world situation / 学习处理特定现实场景。",
    minHours: 2,
    maxHours: 4,
    category: TopicCategory.AI_Generated
  }));
};
