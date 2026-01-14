
import { GoogleGenAI, GenerateContentResponse, Content } from "@google/genai";
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
  images?: string[]; // Array of Base64 strings (Legacy/Small)
  files?: File[]; // Array of File objects (New/Large)
  audio?: string; // Base64 string
  temperature?: number; // Control randomness (0.0 to 2.0)
  history?: Content[]; // Add history support
}

// Helper to convert File to Base64 for inlineData
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const sendMessageToGemini = async (
  options: GeminiMessageOptions
): Promise<GenerateContentResponse> => {
  const { message, images = [], files = [], audio, temperature, history = [] } = options;

  try {
    // gemini-2.5-flash-preview or gemini-3-flash-preview
    const modelId = "gemini-3-flash-preview";

    const currentTurnParts: any[] = [];
    
    // Process Legacy Images (Base64 strings)
    if (images && images.length > 0) {
      images.forEach(img => {
        const mimeMatch = img.match(/data:([^;]+);/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const cleanBase64 = img.split(',')[1] || img;
        
        currentTurnParts.push({
            inlineData: {
                mimeType: mimeType,
                data: cleanBase64
            }
        });
      });
    }

    // Process Files (File Objects)
    if (files && files.length > 0) {
        for (const file of files) {
            // If file is large (> 10MB) or is a PDF, use Media Upload API
            // This bypasses the base64 payload size limit (approx 20MB)
            if (file.size > 10 * 1024 * 1024 || file.type.includes('pdf')) {
                try {
                    const ai = getAI();
                    const uploadResult = await ai.files.upload({
                        file: file,
                        config: { displayName: file.name }
                    });
                    
                    currentTurnParts.push({
                        fileData: {
                            mimeType: uploadResult.file.mimeType,
                            fileUri: uploadResult.file.uri
                        }
                    });
                } catch (uploadError) {
                    console.error("File upload failed, falling back to inline if possible", uploadError);
                    // Fallback to inline if upload fails (might fail due to size if it was the reason for upload, but worth a try or just throw)
                    throw new Error(`Failed to upload large file: ${file.name}`);
                }
            } else {
                // Small file, use inline base64
                const base64 = await fileToBase64(file);
                currentTurnParts.push({
                    inlineData: {
                        mimeType: file.type,
                        data: base64
                    }
                });
            }
        }
    }

    // Process Audio
    if (audio) {
      const mimeMatch = audio.match(/data:([^;]+);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'audio/wav';
      const cleanAudioBase64 = audio.split(',')[1] || audio;

      currentTurnParts.push({
        inlineData: {
          mimeType: mimeType, 
          data: cleanAudioBase64
        }
      });
    }

    // Add text prompt
    currentTurnParts.push({ text: message });

    // Explicitly set tools to undefined if ANY media is present
    const hasMedia = (images.length > 0) || (files.length > 0) || !!audio;
    const tools = hasMedia ? undefined : [{ googleSearch: {} }];

    // Construct full contents with history
    let contents: Content[] = [];
    
    if (history && history.length > 0) {
      contents = [...history];
      contents.push({ role: 'user', parts: currentTurnParts });
    } else {
      contents = [{ role: 'user', parts: currentTurnParts }];
    }

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: modelId,
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: tools,
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
