
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

const getAI = () => {
  const apiKey = import.meta.env.VITE_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new Error("API Key 未配置。请在 Vercel 环境变量中设置 VITE_API_KEY。");
  }
  return new GoogleGenAI({ apiKey });
};

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

    const ai = getAI();
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
    
    // 提供更友好的错误信息
    if (error instanceof Error) {
      if (error.message.includes("API Key")) {
        throw new Error("API Key 未配置。请在 Vercel 环境变量中设置 VITE_API_KEY，然后重新部署应用。");
      }
      if (error.message.includes("401") || error.message.includes("unauthorized")) {
        throw new Error("API Key 无效。请检查 Vercel 环境变量中的 VITE_API_KEY 是否正确。");
      }
      if (error.message.includes("403") || error.message.includes("forbidden")) {
        throw new Error("API Key 权限不足或被限制。请检查 Google Cloud Console 中的 API Key 设置。");
      }
      if (error.message.includes("429") || error.message.includes("quota")) {
        throw new Error("API 调用次数已达上限。请稍后再试或检查 API 配额。");
      }
    }
    
    throw error;
  }
};
