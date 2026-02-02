
import { GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { callGeminiAPI } from "../../../services/geminiProxy";

interface GeminiMessageOptions {
  message: string;
  images?: string[]; // Array of Base64 strings
  audio?: string; // Base64 string
  temperature?: number; // Control randomness (0.0 to 2.0)
  systemInstruction?: string; // Custom system instruction override
}

export const sendMessageToGemini = async (
  options: GeminiMessageOptions
): Promise<GenerateContentResponse> => {
  const { message, images = [], audio, temperature, systemInstruction } = options;

  try {
    const modelId = "gemini-3-flash-preview";

    const parts: any[] = [];
    
    // Process Images
    if (images && images.length > 0) {
      images.forEach(img => {
        // Dynamic MIME type detection
        const mimeMatch = img.match(/data:([^;]+);/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        // Strip prefix
        const cleanBase64 = img.split(',')[1] || img;
        
        parts.push({
            inlineData: {
                mimeType: mimeType,
                data: cleanBase64
            }
        });
      });
    }

    // Process Audio
    if (audio) {
      // Extract MIME type dynamically
      const mimeMatch = audio.match(/data:([^;]+);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'audio/wav';
      const cleanAudioBase64 = audio.split(',')[1] || audio;

      parts.push({
        inlineData: {
          mimeType: mimeType, 
          data: cleanAudioBase64
        }
      });
    }

    // Add text prompt
    parts.push({ text: message });

    // CRITICAL FIX: Explicitly set tools to undefined if ANY media is present.
    // Sending an empty array or tools with media often triggers "Invalid Argument".
    const hasMedia = images.length > 0 || !!audio;
    const tools = hasMedia ? undefined : [{ googleSearch: {} }];

    // 通过边缘函数调用 Gemini API
    const response = await callGeminiAPI({
      model: modelId,
      contents: [{
        role: 'user',
        parts: parts
      }],
      config: {
        systemInstruction: systemInstruction || SYSTEM_INSTRUCTION,
        tools: tools,
        temperature: temperature ?? 0.7,
      }
    });

    return response as GenerateContentResponse;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
