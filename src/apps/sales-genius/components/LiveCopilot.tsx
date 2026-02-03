
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Zap, Activity, AlertCircle, Save, User, Bot, Play, ShieldAlert, Brain, VolumeX, Download, Clock, Wifi, RefreshCw, FileText, Layout } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { LIVE_SYSTEM_INSTRUCTION } from '../constants';
import { ToneSelector } from './ToneSelector';
import { ClientProfile } from '../types';
import ReactMarkdown from 'react-markdown';

// 获取 API Key（在客户端需要使用 VITE_ 前缀）
const apiKey = import.meta.env.VITE_API_KEY || '';
if (!apiKey) {
  console.error('VITE_API_KEY 未配置。请在 Vercel 环境变量中设置 VITE_API_KEY。');
}
// Use n1n.ai proxy for Gemini Live
  // @ts-ignore - baseUrl is supported in newer versions or internal config but types might be outdated
  const ai = new GoogleGenAI({ 
    apiKey,
    // @ts-ignore
    baseUrl: 'https://api.n1n.ai' // Removed /v1 as SDK appends version
  });

// --- WAV Encoding Helpers ---

const floatTo16BitPCM = (output: DataView, offset: number, input: Float32Array) => {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
};

const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

const encodeWAV = (samples: Float32Array, sampleRate: number) => {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* RIFF chunk length */
  view.setUint32(4, 36 + samples.length * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, 1, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 2, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length * 2, true);

  /* Write PCM samples */
  floatTo16BitPCM(view, 44, samples);

  return new Blob([view], { type: 'audio/wav' });
};

// Helper for Gemini Input (Base64)
const createBase64PCM = (data: Float32Array): string => {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  let binary = '';
  const bytes = new Uint8Array(int16.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

interface LiveCopilotProps {
  onSaveAndAnalyze?: (audioData: string) => void;
  globalTones: string[];
  setGlobalTones: (tones: string[]) => void;
}

interface StrategyCard {
  id: string;
  type: 'risk' | 'script' | 'insight' | 'general';
  title: string;
  content: string;
  isComplete: boolean;
}

export const LiveCopilot: React.FC<LiveCopilotProps> = ({ onSaveAndAnalyze, globalTones, setGlobalTones }) => {
  const [step, setStep] = useState<'setup' | 'live'>('setup');
  const [isActive, setIsActive] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  
  // Mobile View State
  const [mobileTab, setMobileTab] = useState<'transcript' | 'strategy'>('strategy');
  
  // Profile State
  const [clientProfile, setClientProfile] = useState<ClientProfile>({
    name: '', ageRange: '', gender: '男', industry: '', jobTitle: '', currentLevel: '', targetLevel: '', learningGoal: '', otherInfo: ''
  });

  // UI State
  const [transcriptSegments, setTranscriptSegments] = useState<{id: string, text: string, time: string}[]>([]);
  const [currentSegment, setCurrentSegment] = useState('');
  
  // Strategy Dashboard State
  const [strategyCards, setStrategyCards] = useState<StrategyCard[]>([]);
  const [currentStreamBuffer, setCurrentStreamBuffer] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  
  // Timer State
  const [sessionDuration, setSessionDuration] = useState(0);

  // Refs
  const inputContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  // Session Refs
  const activeSessionRef = useRef<any>(null); // To store the current Gemini Session object
  const isUserStoppingRef = useRef(false);
  const timerRef = useRef<any>(null);
  const retryCountRef = useRef(0); // Track retries
  const MAX_RETRIES = 5; // Max reconnection attempts
  
  // PCM Data Buffer for WAV file (Cumulative across reconnections)
  const pcmDataRef = useRef<Float32Array[]>([]);

  const silenceTimeoutRef = useRef<any>(null);
  const conversationScrollRef = useRef<HTMLDivElement>(null);
  const hintsScrollRef = useRef<HTMLDivElement>(null);
  const maxDurationRef = useRef(7200); // 120 minutes limit

  // Auto-scroll logic
  useEffect(() => {
    if (conversationScrollRef.current) conversationScrollRef.current.scrollTop = conversationScrollRef.current.scrollHeight;
  }, [transcriptSegments, currentSegment, mobileTab]); // Trigger when tab changes too

  useEffect(() => {
    if (hintsScrollRef.current) hintsScrollRef.current.scrollTop = hintsScrollRef.current.scrollHeight;
  }, [strategyCards, mobileTab]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      stopEverything(true); // Force stop
    };
  }, []);

  const updateProfile = (field: keyof ClientProfile, value: string) => {
    setClientProfile(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Connects (or reconnects) to the Gemini Live API.
   * This is separate from audio recording so we can restart it without killing the mic.
   */
  const connectToGemini = async () => {
    // If user explicitly stopped, do not reconnect
    if (isUserStoppingRef.current) return;

    // Circuit breaker: Prevent infinite loops
    if (retryCountRef.current >= MAX_RETRIES) {
        setError("无法连接 AI 服务 (多次重试失败)。请检查网络或刷新页面。");
        setIsReconnecting(false);
        return;
    }

    try {
      console.log(`Initiating Gemini Connection (Attempt ${retryCountRef.current + 1})...`);
      
      // Close existing if any (cleanup)
      if (activeSessionRef.current) {
          try { (await activeSessionRef.current).close(); } catch(e) {}
      }

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        // @ts-ignore - apiVersion is not in types but might be respected by underlying client
        apiVersion: 'v1beta',
        config: {
          responseModalities: [Modality.AUDIO], 
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: { parts: [{ text: LIVE_SYSTEM_INSTRUCTION(globalTones, clientProfile) }] },
        },
        callbacks: {
          onopen: () => {
            console.log("Gemini Live Session Opened");
            setIsReconnecting(false);
            setError(null);
            retryCountRef.current = 0; // Reset retries on success
            
            // Send initial wake-up message
            sessionPromise.then(s => s.sendRealtimeInput([{ mimeType: "text/plain", data: "SESSION_START/RESUME: Monitoring active." }]));
          },
          onmessage: async (msg: LiveServerMessage) => {
            // A. Handle User Input Transcription
            const userText = msg.serverContent?.inputTranscription?.text;
            if (userText) {
               setCurrentSegment(prev => {
                 const newText = prev + userText;
                 
                 // Fix: Reduce latency by committing faster (600ms vs 1200ms)
                 // Also force commit if segment is too long to prevent large processing lags
                 if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
                 
                 const shouldForceCommit = newText.length > 200; // Force commit if > 200 chars
                 
                 if (shouldForceCommit) {
                    setTranscriptSegments(prevSegs => [...prevSegs, { 
                        id: Date.now().toString(), text: newText, time: new Date().toLocaleTimeString()
                    }]);
                    return '';
                 } else {
                     silenceTimeoutRef.current = setTimeout(() => {
                        if (newText.trim()) {
                        setTranscriptSegments(prevSegs => [...prevSegs, { 
                            id: Date.now().toString(), text: newText, time: new Date().toLocaleTimeString()
                        }]);
                        setCurrentSegment('');
                        }
                     }, 600); // Reduced delay
                     return newText;
                 }
               });
            }

            // B. Handle Model Output (Strategy)
            const modelText = msg.serverContent?.outputTranscription?.text;
            if (modelText) {
                setCurrentStreamBuffer(prev => {
                    const next = prev + modelText;
                    // Logic to parse tags like 【风险】... same as before
                    setStrategyCards(cards => {
                        const newCards = [...cards];
                        const tagMatch = modelText.match(/【(.*?)】/);
                        if (tagMatch) {
                             const cleanContent = modelText.replace(tagMatch[0], '').trim();
                             let type: StrategyCard['type'] = 'general';
                             if (tagMatch[1].includes('风险')) type = 'risk';
                             else if (tagMatch[1].includes('话术')) type = 'script';
                             else if (tagMatch[1].includes('洞察')) type = 'insight';

                             newCards.push({
                                id: Date.now().toString() + Math.random(),
                                type,
                                title: tagMatch[0],
                                content: cleanContent,
                                isComplete: false
                             });
                        } else {
                             if (newCards.length > 0) newCards[newCards.length - 1].content += modelText;
                             else if (modelText.trim().length > 0) {
                                 newCards.push({ id: Date.now().toString(), type: 'general', title: 'AI 提示', content: modelText, isComplete: false });
                             }
                        }
                        return newCards;
                    });
                    return next;
                });
            }
            if (msg.serverContent?.turnComplete) setCurrentStreamBuffer('');
          },
          onclose: (e) => {
            console.log("Gemini Session Closed", e);
            activeSessionRef.current = null; // Clear the active session ref
            
            // 1. Check for Fatal Errors in Close Event (e.g., Invalid API Key)
            if (e.code === 1007 || e.reason?.includes('API key') || e.reason?.includes('not valid')) {
                console.error("Fatal WebSocket Error:", e.reason);
                isUserStoppingRef.current = true; // Stop infinite retries
                setError(`连接断开: ${e.reason || 'API Key 无效'}`);
                stopEverything(true);
                return;
            }

            // 2. Critical Logic: If user didn't stop it, and we haven't hit 120 mins, RECONNECT.
            if (!isUserStoppingRef.current && sessionDuration < maxDurationRef.current) {
                // Exponential Backoff
                const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000); // 1s, 2s, 4s... max 10s
                console.log(`Auto-reconnecting in ${delay}ms...`);
                setIsReconnecting(true);
                retryCountRef.current++;
                setTimeout(() => connectToGemini(), delay);
            } else if (!isUserStoppingRef.current && sessionDuration >= maxDurationRef.current) {
                stopEverything(false);
                setError("已达到 120 分钟自动截止时间。录音已保存。");
            }
          },
          onerror: (err) => {
            console.error("Gemini Session Error:", err);
            // On error, we rely on onclose to handle reconnection logic
            // But if it's a permission error (403), stop immediately
            const errStr = String(err).toLowerCase();
            if (errStr.includes('403') || errStr.includes('permission') || errStr.includes('unauthorized')) {
                isUserStoppingRef.current = true; // Stop infinite retries
                setError("AI 服务权限不足 (403)。请检查 API Key 配置。");
                stopEverything(true);
            }
          }
        }
      });
      
      // Update Ref so audio processor can send data
      activeSessionRef.current = sessionPromise;
      
    } catch (e) {
      console.error("Connection Failed", e);
      // Don't just blindly retry immediately
      const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 5000);
      setIsReconnecting(true);
      retryCountRef.current++;
      setTimeout(() => connectToGemini(), delay);
    }
  };

  /**
   * Starts the Audio Context and Microphone.
   * This runs ONLY ONCE at the beginning.
   */
  const startRecordingSystem = async () => {
     try {
        // Reset Error State first
        setError(null);
        
        // Check permission status explicitly (if supported)
        if (navigator.permissions && navigator.permissions.query) {
             try {
                const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
                if (result.state === 'denied') {
                    throw new Error("PermissionDeniedExplicit");
                }
             } catch(e) {
                // Ignore query errors, proceed to getUserMedia
             }
        }

        setRecordedAudioUrl(null);
        setTranscriptSegments([]);
        setStrategyCards([]);
        setSessionDuration(0);
        isUserStoppingRef.current = false;
        retryCountRef.current = 0; // Reset retries
        pcmDataRef.current = []; // Clear audio buffer
        
        // 1. Get Stream
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true } 
        });

        // 2. Setup Audio Context
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const inputCtx = new AudioContextClass({ sampleRate: 16000 });
        await inputCtx.resume();
        inputContextRef.current = inputCtx;

        // 3. Setup Processor
        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        
        sourceRef.current = source;
        processorRef.current = processor;

        // 4. Audio Processing Loop
        processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            
            // ALWAYS Save data for WAV file (Continuous Recording)
            // Even if AI is reconnecting, this keeps running.
            const dataCopy = new Float32Array(inputData);
            pcmDataRef.current.push(dataCopy);
            
            // Send to Gemini IF session is active
            if (activeSessionRef.current) {
                const base64Str = createBase64PCM(inputData);
                // We use the promise stored in ref
                activeSessionRef.current.then((session: any) => {
                    // Check if session is usable (not closed)
                    try {
                         session.sendRealtimeInput({ 
                            media: { mimeType: 'audio/pcm;rate=16000', data: base64Str } 
                        });
                    } catch(err) {
                        // Ignore send errors during reconnection phase
                    }
                });
            }
        };

        source.connect(processor);
        processor.connect(inputCtx.destination); // Needed for script processor to run

        // 5. Start Timer
        timerRef.current = setInterval(() => {
            setSessionDuration(prev => {
                const newVal = prev + 1;
                if (newVal >= maxDurationRef.current) {
                    stopEverything(false); // Auto Stop
                }
                return newVal;
            });
        }, 1000);

        setIsActive(true);

        // 6. Connect AI
        connectToGemini();

     } catch (e: any) {
        console.error(e);
        let msg = "无法启动录音系统 (未知错误)";
        if (e.message === "PermissionDeniedExplicit" || e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
            msg = "麦克风权限被拒绝。请点击浏览器地址栏的“锁”图标🔒，允许麦克风访问，然后刷新页面重试。";
        } else if (e.name === "NotFoundError" || e.name === "DevicesNotFoundError") {
            msg = "未检测到麦克风设备。请检查硬件连接。";
        } else if (e.name === "NotReadableError" || e.name === "TrackStartError") {
            msg = "麦克风被其他程序占用。请关闭其他录音软件后重试。";
        }
        setError(msg);
     }
  };

  const stopEverything = (userInitiated: boolean) => {
    isUserStoppingRef.current = true; // Prevents auto-reconnect
    
    // 1. Close Gemini Session
    if (activeSessionRef.current) {
        activeSessionRef.current.then((s: any) => s.close());
        activeSessionRef.current = null;
    }
    
    // 2. Stop Audio & Timer
    if (sourceRef.current) { sourceRef.current.disconnect(); sourceRef.current = null; }
    if (processorRef.current) { processorRef.current.disconnect(); processorRef.current = null; }
    if (inputContextRef.current) { inputContextRef.current.close(); inputContextRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    setIsActive(false);
    setIsReconnecting(false);
    
    // 3. Save Final Audio
    saveWavFile();
  };

  const saveWavFile = () => {
    if (pcmDataRef.current.length > 0) {
        const totalLength = pcmDataRef.current.reduce((acc, curr) => acc + curr.length, 0);
        const mergedBuffer = new Float32Array(totalLength);
        let offset = 0;
        for (const chunk of pcmDataRef.current) {
            mergedBuffer.set(chunk, offset);
            offset += chunk.length;
        }

        const wavBlob = encodeWAV(mergedBuffer, 16000);
        const reader = new FileReader();
        reader.onloadend = () => setRecordedAudioUrl(reader.result as string);
        reader.readAsDataURL(wavBlob);
    }
  };

  const downloadRecordedAudio = () => {
    if (recordedAudioUrl) {
        const link = document.createElement('a');
        link.href = recordedAudioUrl;
        link.download = `ME_Live_Session_${new Date().toLocaleString().replace(/[\/\s:]/g, '_')}.wav`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Render Helpers
  const renderCard = (card: StrategyCard) => {
    let bgColor = 'bg-slate-800';
    let borderColor = 'border-slate-700';
    let icon = <Bot size={18} />;
    
    if (card.type === 'risk') {
        bgColor = 'bg-red-950/40';
        borderColor = 'border-red-500/50';
        icon = <ShieldAlert className="text-red-500" size={18} />;
    } else if (card.type === 'script') {
        bgColor = 'bg-emerald-950/40';
        borderColor = 'border-emerald-500/50';
        icon = <Play className="text-emerald-500" size={18} />;
    } else if (card.type === 'insight') {
        bgColor = 'bg-indigo-950/40';
        borderColor = 'border-indigo-500/50';
        icon = <Brain className="text-indigo-400" size={18} />;
    }

    return (
        <div key={card.id} className={`p-4 rounded-xl border-l-4 ${borderColor} ${bgColor} shadow-lg mb-4 animate-in slide-in-from-right-2`}>
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                {icon}
                <span className="font-bold text-sm text-white/90">{card.title}</span>
            </div>
            <div className="prose prose-invert prose-sm max-w-none">
                 <ReactMarkdown>{card.content}</ReactMarkdown>
            </div>
        </div>
    );
  };

  const inputClass = "w-full p-3 bg-slate-100 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-colors text-slate-900 placeholder:text-slate-500 shadow-sm";

  // Setup Step
  if (step === 'setup') {
    return (
      <div className="max-w-3xl mx-auto h-full flex flex-col p-4 md:p-6 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 md:p-8">
           <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <Zap className="text-blue-600 w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Live 纯文字看板配置</h2>
                <p className="text-slate-500 text-sm">静默模式 • <span className="text-blue-600 font-bold">120min自动续连</span> • 全程录音</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">客户称呼</label>
                <input type="text" value={clientProfile.name} onChange={(e) => updateProfile('name', e.target.value)} placeholder="例如: 王先生" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">意向产品</label>
                <input type="text" value={clientProfile.learningGoal} onChange={(e) => updateProfile('learningGoal', e.target.value)} placeholder="例如: 雅思 7 分" className={inputClass} />
              </div>
           </div>
           
           <div className="mt-6 pt-6 border-t border-slate-100">
             <ToneSelector selectedTones={globalTones} onChange={setGlobalTones} />
           </div>

           <div className="mt-8 flex justify-end">
             <button onClick={() => setStep('live')} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95 w-full md:w-auto justify-center">
               <Play fill="currentColor" size={18} /> 启动看板
             </button>
           </div>
        </div>
      </div>
    );
  }

  // Live Step
  return (
    <div className="h-full flex flex-col w-full mx-auto p-0 md:p-0 gap-3 md:gap-4 overflow-hidden">
      {/* Settings Bar */}
      <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 flex flex-wrap justify-between items-center shadow-sm flex-shrink-0 gap-2">
         <div className="flex items-center gap-2">
            <VolumeX className="text-slate-400" size={20} />
            <div className="flex flex-col md:flex-row md:items-center">
                <h2 className="font-bold text-slate-800 text-sm md:text-base">实时看板</h2>
                <div className={`text-xs px-2 py-0.5 md:px-3 md:py-1 rounded-full md:ml-2 font-bold flex items-center gap-1.5 transition-colors w-fit mt-1 md:mt-0 ${isActive ? (isReconnecting ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700') : 'bg-slate-100 text-slate-500'}`}>
                {isActive && !isReconnecting && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>}
                {isActive && isReconnecting && <RefreshCw size={10} className="animate-spin"/>}
                {isActive ? (isReconnecting ? '重连中...' : formatTime(sessionDuration)) : '已暂停'}
                </div>
            </div>
         </div>
         <button 
            onClick={isActive ? () => stopEverything(true) : startRecordingSystem}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all shadow-sm ${
            isActive ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
        >
            {isActive ? <><Square size={14} fill="currentColor"/> 停止 & 保存</> : <><Mic size={14}/> 开始 (Max 120min)</>}
        </button>
      </div>

      {/* Mobile Tabs Switcher */}
      <div className="flex md:hidden bg-white border border-slate-200 rounded-lg p-1 flex-shrink-0">
          <button 
             onClick={() => setMobileTab('strategy')}
             className={`flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 transition-all ${mobileTab === 'strategy' ? 'bg-slate-900 text-white shadow' : 'text-slate-500'}`}
          >
             <Brain size={16}/> AI 策略
             {strategyCards.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{strategyCards.length}</span>}
          </button>
          <button 
             onClick={() => setMobileTab('transcript')}
             className={`flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 transition-all ${mobileTab === 'transcript' ? 'bg-blue-600 text-white shadow' : 'text-slate-500'}`}
          >
             <FileText size={16}/> 实时文字
          </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden relative">
        {/* Left: Transcript (Hidden on mobile if tab is strategy) */}
        <div className={`flex-1 bg-white rounded-2xl border border-slate-200 flex-col overflow-hidden shadow-sm ${mobileTab === 'transcript' ? 'flex' : 'hidden md:flex'}`}>
           <div className="bg-slate-50 border-b border-slate-100 p-3 flex justify-between items-center flex-shrink-0">
             <span className="text-sm font-bold text-white bg-slate-800 px-3 py-1 rounded-lg flex items-center gap-2"><User size={16}/> 实时录入</span>
             {isReconnecting && <span className="text-[10px] text-yellow-600 font-medium flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded"><Wifi size={10}/> 保持通话，AI正在无感切换...</span>}
           </div>
           <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 space-y-4" ref={conversationScrollRef}>
              {transcriptSegments.length === 0 && !currentSegment && <div className="text-center mt-20 text-slate-400 italic text-sm">等待对话开始...</div>}
              {transcriptSegments.map((seg) => (
                 <div key={seg.id} className="bg-white border border-slate-200 p-3 rounded-xl rounded-tl-none shadow-sm w-fit max-w-[90%]">
                    <p className="text-white bg-slate-800 px-3 py-2 rounded-lg text-sm font-medium">{seg.text}</p>
                 </div>
              ))}
              {currentSegment && (
                 <div className="bg-slate-100 border border-slate-200 p-3 rounded-xl rounded-tl-none shadow-sm w-fit max-w-[90%] opacity-70">
                    <p className="text-white bg-slate-700 px-3 py-2 rounded-lg text-sm font-medium">{currentSegment} <span className="animate-pulse">|</span></p>
                 </div>
              )}
           </div>
        </div>

        {/* Right: Strategy Dashboard (Hidden on mobile if tab is transcript) */}
        <div className={`flex-1 bg-slate-900 rounded-2xl border border-slate-700 flex-col overflow-hidden shadow-xl ${mobileTab === 'strategy' ? 'flex' : 'hidden md:flex'}`}>
           <div className="bg-slate-800 border-b border-slate-700 p-3 flex justify-between items-center flex-shrink-0">
             <span className="text-sm font-bold text-white flex items-center gap-2"><Brain size={16} className="text-yellow-400"/> 策略看板</span>
           </div>
           <div className="flex-1 p-4 overflow-y-auto" ref={hintsScrollRef}>
              {strategyCards.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-30">
                  <Bot size={64} className="text-white mb-4" />
                  <p className="text-white font-bold">AI 策略准备中</p>
                </div>
              )}
              {strategyCards.map(card => renderCard(card))}
           </div>
           
           {/* Footer: Save & Download Actions */}
           {recordedAudioUrl && !isActive && (
              <div className="p-4 bg-slate-800 border-t border-slate-700 flex flex-wrap justify-center gap-3 animate-in slide-in-from-bottom-2 flex-shrink-0">
                <button 
                  onClick={() => onSaveAndAnalyze?.(recordedAudioUrl)} 
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                  <Save size={16}/> 存入并复盘
                </button>
                <button 
                  onClick={downloadRecordedAudio} 
                  className="bg-slate-700 text-slate-200 border border-slate-600 px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-600 transition-colors"
                >
                  <Download size={16}/> 下载录音 (.wav)
                </button>
              </div>
           )}
        </div>
      </div>
      
      {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 flex-shrink-0"><AlertCircle size={16}/> {error}</div>}
    </div>
  );
};
