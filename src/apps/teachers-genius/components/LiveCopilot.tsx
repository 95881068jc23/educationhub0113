import React, { useState, useRef, useEffect } from 'react';
import { Mic, Zap, Activity, Save, AlertTriangle, Lightbulb, Bot, Download, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { StudentProfile } from '../types';

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
  const [duration, setDuration] = useState(0);
  
  const [studentProfile, setStudentProfile] = useState<StudentProfile>({
    name: '', age: '', level: 'A2', goal: '', struggle: '', personality: ''
  });

  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  
  // Refs
  const pcmDataRef = useRef<Int16Array[]>([]);
  const timerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Critical control flags
  const isRecordingRef = useRef(false);     

  useEffect(() => {
    return () => { stopEverything(); };
  }, []);

  // --- Main Start Logic ---
  const startRecordingSession = async () => {
    try {
      // Reset State
      setRecordedAudioUrl(null);
      pcmDataRef.current = []; 
      setDuration(0);
      
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
        
        // Save to local buffer
        pcmDataRef.current.push(int16Data);
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

  // --- Stop Logic ---
  const stopEverything = () => {
    isRecordingRef.current = false; // Stop recording flag
    setIsActive(false);

    if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
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
                    <span className="text-[10px] text-teal-400 font-normal px-2 py-0.5 rounded border border-teal-800 bg-teal-950/50">RECORDER</span>
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-2 mt-1">
                    {isActive ? <span className="text-red-400 font-bold">● REC</span> : <span>● Ready</span>}
                    <span className="text-slate-600">|</span>
                    <span className={`font-mono ${isActive ? 'text-white' : 'text-slate-500'}`}>{formatTime(duration)}</span>
                </div>
             </div>
          </div>
          <button onClick={isActive ? stopEverything : startRecordingSession} className={`w-full md:w-auto px-6 py-2.5 rounded-lg font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 text-sm md:text-base ${isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-teal-600 hover:bg-teal-500'}`}>
             {isActive ? <><Zap size={16} fill="white"/> End Class</> : <><Mic size={16}/> Start Class</>}
          </button>
       </div>
       
       {/* Main Content Area */}
       <div className="flex-1 flex flex-col lg:flex-row gap-3 md:gap-4 overflow-hidden min-h-0">
          {/* Transcript Panel -> Now Recording Status */}
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-3 md:p-6 overflow-hidden flex flex-col items-center justify-center shadow-inner min-h-[250px] lg:min-h-0 order-2 lg:order-1">
             <h3 className="font-bold text-slate-400 mb-8 flex items-center gap-2 uppercase text-xs tracking-wider border-b border-slate-800 pb-2 flex-shrink-0 w-full">
               <Activity size={14} className="text-teal-500"/> Recording Status
             </h3>
             {isActive ? (
                <div className="flex flex-col items-center gap-6 animate-pulse">
                    <div className="w-24 h-24 bg-red-950 rounded-full flex items-center justify-center border-4 border-red-500/20">
                        <Mic className="text-red-500 w-12 h-12" />
                    </div>
                    <div className="text-center">
                        <p className="text-slate-400 font-medium mb-2">Recording in progress...</p>
                        <p className="text-4xl font-mono text-white tracking-widest">{formatTime(duration)}</p>
                    </div>
                </div>
             ) : (
                <div className="flex flex-col items-center gap-6 opacity-50">
                     <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center border-4 border-slate-700">
                        <Mic className="text-slate-500 w-12 h-12" />
                    </div>
                    <p className="text-slate-500 font-medium">Ready to record</p>
                </div>
             )}
          </div>

          {/* AI Feedback Panel -> Under Development Message */}
          <div className="h-[200px] lg:h-auto w-full lg:w-[350px] bg-slate-900 border border-slate-800 rounded-xl p-3 md:p-6 overflow-hidden shadow-inner flex flex-col flex-shrink-0 order-1 lg:order-2">
             <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2 md:mb-4 flex-shrink-0">
                <h3 className="font-bold text-teal-400 flex items-center gap-2 uppercase text-xs tracking-wider">
                    <Zap size={14}/> Copilot Insights
                </h3>
             </div>
             
             <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <Bot size={48} className="text-slate-700 mb-4" />
                <h4 className="text-xl font-bold text-white mb-1">Real-time Analysis</h4>
                <h4 className="text-xl font-bold text-teal-500 mb-4">Under Development</h4>
                <p className="text-sm text-slate-500">Please record your session and use the "One-Click Diagnosis" button below.</p>
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
