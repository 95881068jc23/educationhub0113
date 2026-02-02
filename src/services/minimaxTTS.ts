/**
 * n1n.ai TTS 服务 (OpenAI Compatible)
 * 使用 n1n.ai 的 OpenAI 兼容 TTS API
 */

interface MiniMaxTTSOptions {
  text: string;
  model?: string; // OpenAI TTS model, e.g., 'tts-1', 'tts-1-hd'
  voiceId?: string; // OpenAI voice ID, e.g., 'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'
  speed?: number; // 语速：0.25 - 4.0，默认 1.0
  vol?: number; // 音量 (Unused in OpenAI API, kept for compatibility)
  pitch?: number; // 音调 (Unused in OpenAI API, kept for compatibility)
  format?: 'mp3' | 'opus' | 'aac' | 'flac'; // 音频格式
  sampleRate?: number; // 采样率 (Unused in OpenAI API, kept for compatibility)
}

interface MiniMaxTTSResponse {
  success: boolean;
  audioBase64?: string; // Base64 编码的音频数据
  audioUrl?: string; // 音频文件 URL（如果使用 Supabase Storage）
  error?: string;
}

/**
 * 调用 n1n.ai TTS API 生成语音 (OpenAI Compatible)
 */
export async function generateMiniMaxTTS(options: MiniMaxTTSOptions): Promise<MiniMaxTTSResponse> {
  try {
    const {
      text,
      model = 'tts-1',
      voiceId = 'alloy',
      speed = 1.0,
      format = 'mp3',
    } = options;

    // 调用后端 API 路由
    const response = await fetch('/api/minimax-tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model,
        voiceId,
        speed,
        format,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'TTS 生成失败' }));
      throw new Error(errorData.error || `TTS 生成失败: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      audioBase64: data.audioBase64,
      audioUrl: data.audioUrl,
    };
  } catch (error) {
    console.error('TTS 生成失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

/**
 * 将音频转换为 WAV Base64（兼容现有代码）
 */
export function convertMiniMaxAudioToWav(audioBase64: string, format: string = 'mp3'): string {
  // OpenAI API returns binary data, usually handled by backend. 
  // Here we just return the base64 string provided by our backend.
  return audioBase64;
}

/**
 * OpenAI 语音 ID 映射
 * 将内部语音名称映射到 OpenAI voice_id
 */
export const MINIMAX_VOICE_MAP: Record<string, string> = {
  // Gemini/Internal Voice Name -> OpenAI voice_id
  'Kore': 'alloy', 
  'Puck': 'nova', 
  'Fenrir': 'echo',
  'Charon': 'onyx',
  'Zephyr': 'shimmer',
  'Fable': 'fable',
  // 默认值
  'default': 'alloy',
};

/**
 * 获取 OpenAI voice_id
 */
export function getMiniMaxVoiceId(geminiVoiceName: string): string {
  return MINIMAX_VOICE_MAP[geminiVoiceName] || MINIMAX_VOICE_MAP['default'];
}
