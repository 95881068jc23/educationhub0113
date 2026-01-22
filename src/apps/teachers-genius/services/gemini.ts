
import { GenerateContentResponse, Content } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { callGeminiAPI } from "../../../services/geminiProxy";

interface GeminiMessageOptions {
  message: string;
  images?: string[]; // Array of Base64 strings (Legacy/Small)
  files?: File[]; // Array of File objects (New/Large)
  audio?: string; // Base64 string (for small files < 4MB)
  audioUrl?: string; // Supabase Storage URL (for large files >= 4MB)
  temperature?: number; // Control randomness (0.0 to 2.0)
  history?: Content[]; // Add history support
  systemInstruction?: string; // Add system instruction support
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
  const { message, images = [], files = [], audio, audioUrl, temperature, history = [], systemInstruction } = options;

  try {
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

    // Process Files (File Objects) - 转换为 base64
    if (files && files.length > 0) {
        for (const file of files) {
            // 注意：大文件（>10MB）可能需要特殊处理，这里先统一转换为 base64
            // 如果文件太大，可能会失败，建议用户使用较小的文件
            try {
                const base64 = await fileToBase64(file);
                currentTurnParts.push({
                    inlineData: {
                        mimeType: file.type,
                        data: base64
                    }
                });
            } catch (uploadError) {
                console.error("File conversion failed", uploadError);
                throw new Error(`文件处理失败: ${file.name}。请尝试使用较小的文件。`);
            }
        }
    }

    // Process Audio
    // 优先使用 audioUrl（大文件），如果没有则使用 audio（Base64 小文件）
    if (audioUrl) {
      // 大文件：传递 URL，让 Edge Function 处理
      currentTurnParts.push({
        fileData: {
          fileUri: audioUrl,
          mimeType: 'audio/*' // Edge Function 会从 URL 下载并检测 MIME 类型
        }
      });
    } else if (audio) {
      // 小文件：直接使用 Base64
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
    const hasMedia = (images.length > 0) || (files.length > 0) || !!audio || !!audioUrl;
    const tools = hasMedia ? undefined : [{ googleSearch: {} }];

    // Construct full contents with history
    let contents: Content[] = [];
    
    if (history && history.length > 0) {
      contents = [...history];
      contents.push({ role: 'user', parts: currentTurnParts });
    } else {
      contents = [{ role: 'user', parts: currentTurnParts }];
    }

    // 通过边缘函数调用 Gemini API
    const response = await callGeminiAPI({
      model: modelId,
      contents: contents,
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
