
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

const apiKey = import.meta.env.VITE_API_KEY || ''; 

const ai = new GoogleGenAI({ apiKey });

interface GeminiMessageOptions {
  message: string;
  images?: string[]; // Array of Base64 strings
  audio?: string; // Base64 string
  temperature?: number; // Control randomness (0.0 to 2.0)
}

export const sendMessageToGemini = async (
  options: GeminiMessageOptions
): Promise<GenerateContentResponse> => {
  const { message, images = [], audio, temperature } = options;

  try {
    // Use gemini-2.5-flash for better tool use/multimodal stability in some regions, 
    // or gemini-3-flash-preview. 
    // Switching to 2.5-flash specifically for better stability with mixed inputs in this context.
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

    const response = await ai.models.generateContent({
      model: modelId,
      contents: [{
        role: 'user',
        parts: parts
      }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: tools,
        // Use provided temperature or default to 0.7
        temperature: temperature ?? 0.7,
      }
    });

    return response;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
