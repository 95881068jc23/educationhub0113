
import { GoogleGenAI, GenerateContentResponse, Content } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

const apiKey = import.meta.env.VITE_API_KEY || ''; 

const ai = new GoogleGenAI({ apiKey });

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
    throw error;
  }
};
