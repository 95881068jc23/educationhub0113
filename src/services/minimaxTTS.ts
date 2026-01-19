/**
 * MiniMax TTS 服务
 * 使用 MiniMax 的文本转语音 API
 */

import { logUserAction } from './storageService';

const CURRENT_USER_KEY = 'marvel_education_current_user';

interface MiniMaxTTSOptions {
  text: string;
  model?: 'speech-2.6-hd' | 'speech-2.6-turbo' | 'speech-02-hd' | 'speech-02-turbo';
  voiceId?: string; // MiniMax 语音 ID，如 'male-qn-qingse', 'female-shaonv' 等
  speed?: number; // 语速：0.5 - 2.0，默认 1.0
  vol?: number; // 音量：0.1 - 5.0，默认 1.0
  pitch?: number; // 音调：-12 - 12，默认 0
  format?: 'mp3' | 'wav' | 'pcm'; // 音频格式
  sampleRate?: 16000 | 24000 | 32000 | 44100 | 48000; // 采样率
}

interface MiniMaxTTSResponse {
  success: boolean;
  audioBase64?: string; // Base64 编码的音频数据
  audioUrl?: string; // 音频文件 URL（如果使用 Supabase Storage）
  error?: string;
}

/**
 * 调用 MiniMax TTS API 生成语音
 */
export async function generateMiniMaxTTS(options: MiniMaxTTSOptions): Promise<MiniMaxTTSResponse> {
  try {
    const {
      text,
      model = 'speech-2.6-hd',
      voiceId = 'male-qn-qingse',
      speed = 1.0,
      vol = 1.0,
      pitch = 0,
      format = 'mp3',
      sampleRate = 32000,
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
        vol,
        pitch,
        format,
        sampleRate,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'TTS 生成失败' }));
      throw new Error(errorData.error || `TTS 生成失败: ${response.status}`);
    }

    const data = await response.json();
    
    // 记录 TTS 调用日志
    try {
      const storedUser = localStorage.getItem(CURRENT_USER_KEY);
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user && user.id) {
          logUserAction(user.id, 'ai_service_usage', {
            service: 'minimax_tts',
            model: model,
            voice_id: voiceId,
            text_length: text.length,
            status: 'success'
          });
        }
      }
    } catch (logError) {
      console.error('Failed to log TTS usage:', logError);
    }

    return {
      success: true,
      audioBase64: data.audioBase64,
      audioUrl: data.audioUrl,
    };
  } catch (error) {
    console.error('MiniMax TTS 生成失败:', error);
    
    // 记录失败日志
    try {
      const storedUser = localStorage.getItem(CURRENT_USER_KEY);
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user && user.id) {
          logUserAction(user.id, 'ai_service_usage', {
            service: 'minimax_tts',
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    } catch (logError) {
      console.error('Failed to log TTS usage failure:', logError);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

/**
 * 将 MiniMax 返回的音频转换为 WAV Base64（兼容现有代码）
 */
export function convertMiniMaxAudioToWav(audioBase64: string, format: string = 'mp3'): string {
  // 如果已经是 WAV 格式，直接返回
  if (format === 'wav') {
    return audioBase64;
  }

  // 对于 MP3 格式，需要转换为 WAV
  // 注意：这是一个简化的实现，实际可能需要使用 AudioContext 进行转换
  // 由于浏览器限制，这里先返回原始 Base64，让前端处理
  return audioBase64;
}

/**
 * MiniMax 语音 ID 映射
 * 将 Gemini 语音名称映射到 MiniMax voice_id
 */
export const MINIMAX_VOICE_MAP: Record<string, string> = {
  // Gemini 语音 -> MiniMax voice_id
  'Kore': 'male-qn-qingse', // 默认男声
  'Puck': 'female-shaonv', // 女声
  'Fenrir': 'male-qn-qingse',
  'Charon': 'male-qn-qingse',
  'Zephyr': 'female-shaonv',
  // 默认值
  'default': 'male-qn-qingse',
};

/**
 * 获取 MiniMax voice_id
 */
export function getMiniMaxVoiceId(geminiVoiceName: string): string {
  return MINIMAX_VOICE_MAP[geminiVoiceName] || MINIMAX_VOICE_MAP['default'];
}
