import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Zap, Save, Play, Brain, VolumeX, Download, AlertCircle, User, Wifi } from 'lucide-react';
import { ToneSelector } from './ToneSelector';
import { ClientProfile } from '../types';

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

interface LiveCopilotProps {
  onSaveAndAnalyze?: (audioData: string) => void;
  globalTones: string[];
  setGlobalTones: (tones: string[]) => void;
}

export const LiveCopilot: React.FC<LiveCopilotProps> = ({ onSaveAndAnalyze, globalTones, setGlobalTones }) => {
  const [step, setStep] = useState<'setup' | 'live'>('setup');
  const [isActive, setIsActive] = useState(false);
  
  // Mobile View State
  const [mobileTab, setMobileTab] = useState<'transcript' | 'strategy'>('strategy');
  
  // Profile State
  const [clientProfile, setClientProfile] = useState<ClientProfile>({
    name: '', ageRange: '', gender: '男', industry: '', jobTitle: '', currentLevel: '', targetLevel: '', learningGoal: '', otherInfo: ''
  });

  const [error, setError] = useState<string | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  
  // Timer State
  const [sessionDuration, setSessionDuration] = useState(0);

  // Refs
  const inputContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  const timerRef = useRef<any>(null);
  const maxDurationRef = useRef(7200); // 120 minutes limit
  
  // PCM Data Buffer for WAV file
  const pcmDataRef = useRef<Float32Array[]>([]);

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
   * Starts the Audio Context and Microphone.
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
        setSessionDuration(0);
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
            
            // Save data for WAV file
            const dataCopy = new Float32Array(inputData);
            pcmDataRef.current.push(dataCopy);
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
    // 1. Stop Audio & Timer
    if (sourceRef.current) { sourceRef.current.disconnect(); sourceRef.current = null; }
    if (processorRef.current) { processorRef.current.disconnect(); processorRef.current = null; }
    if (inputContextRef.current) { inputContextRef.current.close(); inputContextRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    setIsActive(false);
    
    // 2. Save Final Audio
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

  const inputClass = "w-full p-3 bg-slate-100 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-colors text-slate-900 placeholder:text-slate-500 shadow-sm";

  // Setup Step
  if (step === 'setup') {
    return (
      <div className="max-w-3xl mx-auto h-full flex flex-col p-4 md:p-6 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 md:p-8">
           <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <Zap className="text-blue-600 w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Live 录音分析配置</h2>
                <p className="text-slate-500 text-sm">本地录制 • <span className="text-blue-600 font-bold">120min时长限制</span> • 录音后分析</p>
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
               <Play fill="currentColor" size={18} /> 启动录音
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
                <h2 className="font-bold text-slate-800 text-sm md:text-base">实时录音</h2>
                <div className={`text-xs px-2 py-0.5 md:px-3 md:py-1 rounded-full md:ml-2 font-bold flex items-center gap-1.5 transition-colors w-fit mt-1 md:mt-0 ${isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {isActive && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>}
                {isActive ? formatTime(sessionDuration) : '已暂停'}
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
          </button>
          <button 
             onClick={() => setMobileTab('transcript')}
             className={`flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 transition-all ${mobileTab === 'transcript' ? 'bg-blue-600 text-white shadow' : 'text-slate-500'}`}
          >
             <User size={16}/> 录音状态
          </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden relative">
        {/* Left: Recording Status (Hidden on mobile if tab is strategy) */}
        <div className={`flex-1 bg-white rounded-2xl border border-slate-200 flex-col overflow-hidden shadow-sm ${mobileTab === 'transcript' ? 'flex' : 'hidden md:flex'}`}>
           <div className="bg-slate-50 border-b border-slate-100 p-3 flex justify-between items-center flex-shrink-0">
             <span className="text-sm font-bold text-white bg-slate-800 px-3 py-1 rounded-lg flex items-center gap-2"><User size={16}/> 录音状态</span>
           </div>
           <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 flex flex-col items-center justify-center space-y-4">
              {isActive ? (
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                        <Mic className="text-red-600 w-10 h-10" />
                    </div>
                    <p className="text-slate-500 font-medium">正在录音中...</p>
                    <p className="text-3xl font-mono text-slate-800">{formatTime(sessionDuration)}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 opacity-50">
                     <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center">
                        <Mic className="text-slate-400 w-10 h-10" />
                    </div>
                    <p className="text-slate-400 font-medium">等待开始录音</p>
                </div>
              )}
           </div>
        </div>

        {/* Right: Strategy Dashboard (Hidden on mobile if tab is transcript) */}
        <div className={`flex-1 bg-slate-900 rounded-2xl border border-slate-700 flex-col overflow-hidden shadow-xl ${mobileTab === 'strategy' ? 'flex' : 'hidden md:flex'}`}>
           <div className="bg-slate-800 border-b border-slate-700 p-3 flex justify-between items-center flex-shrink-0">
             <span className="text-sm font-bold text-white flex items-center gap-2"><Brain size={16} className="text-yellow-400"/> 策略看板</span>
           </div>
           <div className="flex-1 p-4 flex flex-col items-center justify-center text-center">
              <Brain size={64} className="text-slate-700 mb-6" />
              <h2 className="text-2xl md:text-3xl font-bold text-white/80 mb-2">实时分析功能</h2>
              <h2 className="text-2xl md:text-3xl font-bold text-blue-400">正在开发中</h2>
              <p className="text-slate-500 mt-4 max-w-xs">当前版本支持录音保存，请点击下方按钮进行后续分析。</p>
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
