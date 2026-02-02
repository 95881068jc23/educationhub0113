
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Zap, Activity, Save, AlertTriangle, Lightbulb, Bot, Download, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { LIVE_SYSTEM_INSTRUCTION } from '../constants';
import { StudentProfile } from '../types';

// 获取 API Key（在客户端需要使用 VITE_ 前缀）
const apiKey = import.meta.env.VITE_API_KEY || '';
if (!apiKey) {
  console.error('VITE_API_KEY 未配置。请在 Vercel 环境变量中设置 VITE_API_KEY。');
}
// Use n1n.ai proxy for Gemini Live
 // @ts-ignore - baseUrl is supported but types might be outdated
 const ai = new GoogleGenAI({ 
   apiKey,
   // @ts-ignore
   baseUrl: 'https://api.n1n.ai' // Removed /v1 as SDK appends version
 });

const MAX_RECORDING_TIME = 7200; // 120 minutes

// --- Optimized Audio Helpers ---

const floatToInt16 = (float32: Float32Array): Int16Array => {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16;
};

const int16ToBase64 = (int16: Int16Array): string => {
  let binary = '';
  const bytes = new Uint8Array(int16.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

const encodeWAVFromInt16 = (samples: Int16Array, sampleRate: number) => {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  const length = samples.length;
  let offset = 44;
  for (let i = 0; i < length; i++) {
      view.setInt16(offset, samples[i], true);
      offset += 2;
  }
  return new Blob([view], { type: 'audio/wav' });
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

interface LiveCopilotProps {
  onSaveAndAnalyze?: (audioData: string) => void;
  globalTones: string[];
  setGlobalTones: (tones: string[]) => void;
}

export const LiveCopilot: React.FC<LiveCopilotProps> = ({ onSaveAndAnalyze, globalTones }) => {
  const [step, setStep] = useState<'setup' | 'live'>('setup');
  const [isActive, setIsActive] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'>('disconnected');
  const [duration, setDuration] = useState(0);
  
  const [studentProfile, setStudentProfile] = useState<StudentProfile>({
    name: '', age: '', level: 'A2', goal: '', struggle: '', personality: ''
  });

  const [transcriptSegments, setTranscriptSegments] = useState<{id: string, text: string, time: string}[]>([]);
  
  // Refs for State Management to avoid re-renders loop
  const currentTextRef = useRef(''); 
  const [currentSegmentDisplay, setCurrentSegmentDisplay] = useState('');
  
  const [strategyCards, setStrategyCards] = useState<{id: string, title: string, content: string, type: 'warning' | 'suggestion' | 'script'}[]>([]);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  
  // Refs
  const pcmDataRef = useRef<Int16Array[]>([]);
  const sessionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<any>(null);
  const uiIntervalRef = useRef<any>(null); 
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Critical control flags
  const isSessionActiveRef = useRef(false); 
  const isRecordingRef = useRef(false);     
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 5;

  useEffect(() => {
    return () => { stopEverything(); };
  }, []);

  // Optimized Auto-scroll logic
  useEffect(() => {
     if (scrollRef.current) {
         const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
         // Aggressive scrolling: always scroll if new text appears or user is vaguely near bottom
         const isNearBottom = scrollHeight - scrollTop - clientHeight < 400; 
         
         if (isNearBottom) {
            scrollRef.current.scrollTo({ top: scrollHeight, behavior: 'smooth' });
         }
     }
  }, [transcriptSegments, currentSegmentDisplay]);

  // Helper to commit text to history
  const commitTranscriptSegment = () => {
    if (currentTextRef.current.trim()) {
        const committedText = currentTextRef.current;
        setTranscriptSegments(prev => [
            ...prev, 
            { id: Date.now().toString(), text: committedText, time: new Date().toLocaleTimeString() }
        ]);
        currentTextRef.current = ''; 
        setCurrentSegmentDisplay(''); 
    }
  };

  // --- 1. AI Connection Logic (Resilient) ---
  const connectToGemini = async () => {
    // If user stopped recording, do not reconnect
    if (!isRecordingRef.current) return;

    // Circuit breaker for infinite loops
    if (retryCountRef.current > MAX_RETRIES) {
        setConnectionStatus('error');
        console.error("Max retries reached. AI service unavailable.");
        return;
    }

    try {
        console.log(`Initiating Gemini Connection (Attempt ${retryCountRef.current + 1})...`);
        setConnectionStatus('connecting');

        // Cleanup old session if exists
        if (sessionRef.current) {
             try { (await sessionRef.current).close(); } catch(e) {}
        }

        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            // @ts-ignore
            apiVersion: 'v1alpha',
            config: {
                responseModalities: [Modality.AUDIO], 
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                systemInstruction: { parts: [{ text: LIVE_SYSTEM_INSTRUCTION(globalTones, studentProfile) }] },
            },
            callbacks: {
                onopen: () => {
                    console.log("Gemini Connected Successfully");
                    setConnectionStatus('connected');
                    isSessionActiveRef.current = true;
                    retryCountRef.current = 0; // Reset retries on success
                    
                    // Primer Message to kickstart Insights
                    sessionPromise.then(s => s.sendRealtimeInput([{ mimeType: "text/plain", data: "Start monitoring. Please output insights using tags like 【建议】 or [Warning] immediately if you detect issues." }]));
                },
                onmessage: async (msg: LiveServerMessage) => {
                    // 1. Handle User Input Transcription
                    const userText = msg.serverContent?.inputTranscription?.text;
                    if (userText) {
                        currentTextRef.current += userText;
                        
                        // FIX: Force commit if text gets too long (prevents freezing)
                        if (currentTextRef.current.length > 150) {
                            commitTranscriptSegment();
                        }
                    }

                    // 2. Handle AI Output (Insights)
                    const modelText = msg.serverContent?.outputTranscription?.text;
                    if (modelText) {
                        // FIX: Expanded Regex to catch [Tag] and 【Tag】
                        const match = modelText.match(/(?:【|\[)(.*?)(?:】|\])(.*)/);
                        if (match) {
                            let type: 'warning' | 'suggestion' | 'script' = 'suggestion';
                            const tag = match[1].toLowerCase();
                            if (tag.includes('警报') || tag.includes('warning') || tag.includes('alert')) type = 'warning';
                            if (tag.includes('话术') || tag.includes('script') || tag.includes('say')) type = 'script';
                            
                            setStrategyCards(prev => [...prev, { id: Date.now().toString(), title: match[1], content: match[2], type }]);
                        }
                    }
                    
                    // 3. Handle Turn Complete
                    if (msg.serverContent?.turnComplete) {
                        commitTranscriptSegment();
                    }
                },
                onclose: (e) => {
                    console.log("Gemini Session Closed", e);
                    isSessionActiveRef.current = false;
                    sessionRef.current = null;
                    
                    // 1. Check for Fatal Errors in Close Event (e.g., Invalid API Key)
                    // Code 1007 = Invalid Frame Payload Data, often used for policy violations or auth failures in some WS implementations
                    if (e.code === 1007 || e.reason?.includes('API key') || e.reason?.includes('not valid')) {
                        console.error("Fatal WebSocket Error:", e.reason);
                        isRecordingRef.current = false; // Stop recording
                        setConnectionStatus('error');
                        alert(`连接断开: ${e.reason || 'API Key 无效，请检查配置'}`);
                        stopEverything();
                        return;
                    }

                    // AUTO-RECONNECT LOGIC (Exponential Backoff)
                    if (isRecordingRef.current) {
                        setConnectionStatus('reconnecting');
                        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000); // 1s, 2s, 4s, 8s, 10s...
                        console.log(`Attempting auto-reconnect in ${delay}ms...`);
                        
                        setTimeout(() => { 
                            if (isRecordingRef.current) {
                                retryCountRef.current++;
                                connectToGemini(); 
                            }
                        }, delay);
                    } else {
                        setConnectionStatus('disconnected');
                    }
                },
                onerror: (e) => { 
                    console.error("Gemini Session Error", e);
                    // Error usually triggers onclose, so we let onclose handle the retry logic
                    // to avoid double-firing retries.
                    
                    const errStr = String(e).toLowerCase();
                    if (errStr.includes('403') || errStr.includes('permission') || errStr.includes('unauthorized')) {
                        isRecordingRef.current = false; // Stop recording
                        setConnectionStatus('error');
                        alert("AI 服务权限不足 (403)。请检查 API Key 配置。");
                        stopEverything();
                    }
                }
            }
        });
        sessionRef.current = sessionPromise;
    } catch (e) {
        console.error("Connection Initialization Failed", e);
        setConnectionStatus('reconnecting');
        
        // Immediate retry for init failures
        setTimeout(() => { 
            if (isRecordingRef.current) {
                retryCountRef.current++;
                connectToGemini(); 
            }
        }, 2000);
    }
  };

  // --- 2. Main Start Logic ---
  const startRecordingSession = async () => {
    try {
      // Reset State
      setRecordedAudioUrl(null);
      setTranscriptSegments([]);
      currentTextRef.current = '';
      setCurrentSegmentDisplay('');
      setStrategyCards([]);
      pcmDataRef.current = []; 
      setDuration(0);
      retryCountRef.current = 0;
      
      // Check permission status explicitly
      if (navigator.permissions && navigator.permissions.query) {
             try {
                const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
                if (result.state === 'denied') {
                    throw new Error("PermissionDeniedExplicit");
                }
             } catch(e) {
                // Ignore query errors
             }
      }

      // Flags
      isRecordingRef.current = true; // MIC is ON
      setIsActive(true);

      // 1. Start Audio Context & Mic (Local Recording)
      const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
              sampleRate: 16000, 
              channelCount: 1,
              echoCancellation: true,
              autoGainControl: true,
              noiseSuppression: true
          } 
      });
      streamRef.current = stream;
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioContextClass({ sampleRate: 16000, latencyHint: 'interactive' });
      
      if (inputCtx.state === 'suspended') {
          await inputCtx.resume();
      }
      
      audioContextRef.current = inputCtx;

      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        if (!isRecordingRef.current) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const inputCopy = new Float32Array(inputData);
        const int16Data = floatToInt16(inputCopy);
        
        // CRITICAL: Always save to local buffer, regardless of AI connection status
        pcmDataRef.current.push(int16Data);
        
        // FIX: Safer sending logic with try/catch and Active check
        if (sessionRef.current && isSessionActiveRef.current) {
            const base64Str = int16ToBase64(int16Data);
            sessionRef.current.then((session: any) => {
                try {
                    session.sendRealtimeInput({ media: { mimeType: 'audio/pcm;rate=16000', data: base64Str } });
                } catch(sendError) {
                    // Silent fail on send, don't stop recording. Network might be jittery.
                    // The onclose handler will catch persistent failures.
                }
            }).catch(() => {
                // Ignore promise rejection from previous closed sessions
            });
        }
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);

      // 2. Start Duration Timer
      timerRef.current = setInterval(() => {
        setDuration(prev => {
            if (prev >= MAX_RECORDING_TIME - 1) {
                stopEverything(); 
                return MAX_RECORDING_TIME;
            }
            return prev + 1;
        });
      }, 1000);

      // 3. Start UI Update Loop (Throttling)
      uiIntervalRef.current = setInterval(() => {
          // Force update UI if text exists, even if turn isn't complete
          if (currentTextRef.current !== currentSegmentDisplay) {
             setCurrentSegmentDisplay(currentTextRef.current);
          }
      }, 100); 

      // 4. Connect to AI
      connectToGemini();

    } catch (e: any) {
        setIsActive(false);
        isRecordingRef.current = false;
        
        let msg = "Microphone Access Failed. Please check permissions.";
        if (e.message === "PermissionDeniedExplicit" || e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
            msg = "麦克风权限被拒绝。请点击浏览器地址栏的“锁”图标🔒，允许麦克风访问。";
        }
        alert(msg);
    }
  };

  // --- 3. Stop Logic ---
  const stopEverything = () => {
    isRecordingRef.current = false; // Stop recording flag
    isSessionActiveRef.current = false;
    setIsActive(false);
    setConnectionStatus('disconnected');

    if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
    }
    if (uiIntervalRef.current) {
        clearInterval(uiIntervalRef.current);
        uiIntervalRef.current = null;
    }

    // Force close AI session
    if (sessionRef.current) {
        sessionRef.current.then((s: any) => {
            try { s.close(); } catch(e) {}
        }).catch(() => {});
        sessionRef.current = null;
    }

    // Stop Mic Streams
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    }
    if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }

    // Generate WAV
    processAudioFile();
  };

  const processAudioFile = () => {
    if (pcmDataRef.current.length > 0) {
        const totalLength = pcmDataRef.current.reduce((acc, curr) => acc + curr.length, 0);
        const mergedBuffer = new Int16Array(totalLength);
        let offset = 0;
        for (const chunk of pcmDataRef.current) {
            mergedBuffer.set(chunk, offset);
            offset += chunk.length;
        }
        const wavBlob = encodeWAVFromInt16(mergedBuffer, 16000);
        const reader = new FileReader();
        reader.onloadend = () => setRecordedAudioUrl(reader.result as string);
        reader.readAsDataURL(wavBlob);
    }
  };

  const handleDownload = () => {
    if (!recordedAudioUrl) return;
    const link = document.createElement('a');
    link.href = recordedAudioUrl;
    link.download = `Live_Class_${new Date().toISOString().replace(/:/g, '-')}.wav`;
    link.click();
  };

  // Setup Screen
  if (step === 'setup') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 overflow-y-auto w-full">
      <div className="max-w-xl w-full p-6 md:p-8 bg-slate-900 rounded-2xl shadow-xl border border-slate-700 text-white">
         <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
             <Activity className="text-teal-400" /> Teaching Copilot Setup
         </h2>
         <div className="space-y-6">
             <div>
               <label className="block text-sm font-bold mb-2 text-slate-300">Student Level (CEFR)</label>
               <input 
                  className="w-full border border-slate-600 bg-slate-800 p-3 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-teal-500 focus:outline-none" 
                  value={studentProfile.level} 
                  onChange={e => setStudentProfile(prev => ({...prev, level: e.target.value}))} 
                  placeholder="e.g. A2 - B1"
               />
             </div>
             <div>
               <label className="block text-sm font-bold mb-2 text-slate-300">Student Goal / Context</label>
               <input 
                  className="w-full border border-slate-600 bg-slate-800 p-3 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-teal-500 focus:outline-none" 
                  value={studentProfile.goal} 
                  onChange={e => setStudentProfile(prev => ({...prev, goal: e.target.value}))} 
                  placeholder="e.g. Preparing for IELTS, Needs confidence"
               />
             </div>
             <button onClick={() => setStep('live')} className="w-full bg-teal-600 hover:bg-teal-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-teal-900/50 transition-all flex items-center justify-center gap-2">
                 <Zap size={20} /> Initialize Live Monitor
             </button>
         </div>
      </div>
      </div>
    );
  }

  // Live HUD
  return (
    <div className="h-full flex flex-col gap-3 md:gap-4 bg-slate-950 p-2 md:p-4 rounded-xl border border-slate-800 md:rounded-2xl overflow-hidden">
       {/* Control Bar */}
       <div className="bg-slate-900 p-3 md:p-4 border border-slate-800 rounded-xl flex flex-col md:flex-row justify-between items-center shadow-lg gap-3 md:gap-0 flex-shrink-0">
          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className={`w-3 h-3 rounded-full flex-shrink-0 ${isActive ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`}></div>
             <div className="flex-1 md:flex-none">
                <div className="font-bold text-slate-200 text-sm md:text-base flex items-center gap-2">
                    Live Copilot 
                    <span className="text-[10px] text-teal-400 font-normal px-2 py-0.5 rounded border border-teal-800 bg-teal-950/50">BETA</span>
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-2 mt-1">
                    {isActive ? <span className="text-red-400 font-bold">● REC</span> : <span>● Ready</span>}
                    <span className="text-slate-600">|</span>
                    <span className={`font-mono ${isActive ? 'text-white' : 'text-slate-500'}`}>{formatTime(duration)}</span>
                    <span className="text-slate-600">|</span>
                    
                    {/* Connection Status Indicator */}
                    {connectionStatus === 'connected' && (
                        <span className="text-green-400 flex items-center gap-1"><Wifi size={10}/> AI Online</span>
                    )}
                    {connectionStatus === 'connecting' && (
                        <span className="text-yellow-400 flex items-center gap-1 animate-pulse"><Loader2 size={10} className="animate-spin"/> AI Connecting...</span>
                    )}
                    {connectionStatus === 'reconnecting' && (
                        <span className="text-orange-500 flex items-center gap-1 animate-pulse"><WifiOff size={10}/> Reconnecting... (Audio Safe)</span>
                    )}
                    {connectionStatus === 'error' && (
                         <span className="text-red-500 flex items-center gap-1"><AlertTriangle size={10}/> AI Error (Recording Only)</span>
                    )}
                    {connectionStatus === 'disconnected' && isActive && (
                        <span className="text-red-500 flex items-center gap-1"><WifiOff size={10}/> AI Offline</span>
                    )}
                </div>
             </div>
          </div>
          <button onClick={isActive ? stopEverything : startRecordingSession} className={`w-full md:w-auto px-6 py-2.5 rounded-lg font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 text-sm md:text-base ${isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-teal-600 hover:bg-teal-500'}`}>
             {isActive ? <><Zap size={16} fill="white"/> End Class</> : <><Mic size={16}/> Start Class</>}
          </button>
       </div>
       
       {/* Main Content Area */}
       <div className="flex-1 flex flex-col lg:flex-row gap-3 md:gap-4 overflow-hidden min-h-0">
          {/* Transcript Panel */}
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-3 md:p-6 overflow-hidden flex flex-col shadow-inner min-h-[250px] lg:min-h-0 order-2 lg:order-1">
             <h3 className="font-bold text-slate-400 mb-2 md:mb-4 flex items-center gap-2 uppercase text-xs tracking-wider border-b border-slate-800 pb-2 flex-shrink-0">
               <Activity size={14} className="text-teal-500"/> Real-time Transcript
             </h3>
             <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent" ref={scrollRef}>
                {transcriptSegments.length === 0 && !currentSegmentDisplay && isActive && (
                    <div className="text-slate-600 text-sm italic p-4 text-center">Listening for speech... (May take ~5s to start)</div>
                )}
                {transcriptSegments.map(s => (
                   <div key={s.id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 animate-in fade-in slide-in-from-bottom-2">
                      <span className="text-[10px] text-slate-500 block mb-1 font-mono">{s.time}</span>
                      <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{s.text}</p>
                   </div>
                ))}
                {currentSegmentDisplay && (
                   <div className="p-3 rounded-lg border border-dashed border-slate-700 bg-slate-800/30">
                      <p className="text-teal-400 text-sm italic whitespace-pre-wrap">{currentSegmentDisplay}</p>
                   </div>
                )}
                {/* Spacer to ensure auto-scroll has room */}
                <div className="h-10"></div>
             </div>
          </div>

          {/* AI Feedback Panel */}
          <div className="h-[200px] lg:h-auto w-full lg:w-[350px] bg-slate-900 border border-slate-800 rounded-xl p-3 md:p-6 overflow-hidden shadow-inner flex flex-col flex-shrink-0 order-1 lg:order-2">
             <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2 md:mb-4 flex-shrink-0">
                <h3 className="font-bold text-teal-400 flex items-center gap-2 uppercase text-xs tracking-wider">
                    <Zap size={14}/> Copilot Insights
                </h3>
             </div>
             
             <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                {strategyCards.slice().reverse().map(c => { 
                  let bgClass = "bg-teal-950/30 border-teal-800/50";
                  let titleColor = "text-teal-300";
                  let icon = <Lightbulb size={16} className="text-teal-400"/>;
                  
                  if (c.type === 'warning') {
                     bgClass = "bg-red-950/30 border-red-800/50";
                     titleColor = "text-red-400";
                     icon = <AlertTriangle size={16} className="text-red-500"/>;
                  } else if (c.type === 'script') {
                     bgClass = "bg-indigo-950/30 border-indigo-800/50";
                     titleColor = "text-indigo-300";
                     icon = <Bot size={16} className="text-indigo-400"/>;
                  }

                  return (
                    <div key={c.id} className={`p-3 rounded-xl border ${bgClass} shadow-lg animate-in slide-in-from-right duration-300 backdrop-blur-sm`}>
                       <div className="flex items-center gap-2 mb-1">
                          {icon}
                          <span className={`font-bold text-xs ${titleColor}`}>{c.title}</span>
                       </div>
                       <p className="text-sm text-slate-200 font-medium leading-relaxed">{c.content}</p>
                    </div>
                  );
                })}
                {strategyCards.length === 0 && (
                   <div className="text-center text-slate-600 py-6 flex flex-col items-center">
                      <Bot size={24} className="mb-2 opacity-20"/>
                      <p className="text-xs">Listening for teaching patterns...</p>
                   </div>
                )}
             </div>
          </div>
       </div>

       {recordedAudioUrl && !isActive && (
          <div className="flex flex-col md:flex-row justify-center bg-slate-900 p-4 border border-slate-800 rounded-xl shadow-lg gap-3 animate-in slide-in-from-bottom-4 flex-shrink-0">
             <button onClick={handleDownload} className="w-full md:w-auto bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all">
                <Download size={18}/> Download WAV
             </button>
             <button onClick={() => onSaveAndAnalyze?.(recordedAudioUrl)} className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 transition-all">
                <Save size={18}/> One-Click Diagnosis
             </button>
          </div>
       )}
    </div>
  );
};
