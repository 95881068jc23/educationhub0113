
import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  User, 
  Play, 
  Square, 
  Mic, 
  Send, 
  RotateCcw, 
  FileCheck, 
  Download, 
  Settings2,
  Trophy,
  Loader2,
  Sword,
  Shield,
  Lightbulb,
  Sparkles,
  Clock
} from 'lucide-react';
import { SIMULATION_PERSONAS, GET_SIMULATION_INSTRUCTION, SIMULATION_REPORT_PROMPT } from '../constants';
import { sendMessageToGemini } from '../services/gemini';
import { ChatMessage, MessageRole } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// --- Types ---
type GameState = 'setup' | 'playing' | 'report';
type Difficulty = 'standard' | 'challenge';

// Extend ChatMessage to include Coach Feedback
interface SimMessage extends ChatMessage {
  feedback?: string;
}

// --- Markdown Components ---
const ReportMarkdownComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  h1: ({ node, ...props }) => (
    <h1 className="text-2xl font-black text-slate-900 border-b-2 border-indigo-100 pb-3 mb-6" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="text-lg font-bold text-slate-800 mt-6 mb-3 flex items-center gap-2" {...props} />
  ),
  ul: ({ node, ...props }) => (
    <ul className="space-y-2 mb-4" {...props} />
  ),
  li: ({ node, ...props }) => (
    <li className="flex items-start gap-2 text-slate-700 text-sm leading-relaxed" {...props}>
       <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
       <span>{props.children}</span>
    </li>
  ),
  strong: ({ node, ...props }) => (
    <span className="font-bold text-indigo-700 bg-indigo-50 px-1 rounded" {...props} />
  ),
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-6 rounded-lg border border-slate-200 shadow-sm bg-white">
      <table className="min-w-full divide-y divide-slate-100" {...props} />
    </div>
  ),
  thead: ({ node, ...props }) => (
    <thead className="bg-indigo-50 text-indigo-900" {...props} />
  ),
  tbody: ({ node, ...props }) => (
    <tbody className="bg-white divide-y divide-slate-50" {...props} />
  ),
  th: ({ node, ...props }) => (
    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" {...props} />
  ),
  td: ({ node, ...props }) => (
    <td className="px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap" {...props} />
  ),
};

const ChatMarkdownComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
  strong: ({ node, ...props }) => <span className="font-bold text-indigo-700" {...props} />,
};

export const SalesSimulation: React.FC = () => {
  // State: Setup
  const [gameState, setGameState] = useState<GameState>('setup');
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(SIMULATION_PERSONAS[0].id);
  const [customPersona, setCustomPersona] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('standard');

  // State: Chat
  const [messages, setMessages] = useState<SimMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [turnCount, setTurnCount] = useState(0);

  // State: Audio Recording
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // State: Report
  const [reportContent, setReportContent] = useState<string>('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // --- Effects ---
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  // --- Helpers ---
  
  // Helper to transcribe audio using Gemini
  const transcribeAudio = async (base64Audio: string): Promise<string> => {
    try {
      const prompt = "Please transcribe this Chinese audio into text strictly. Output ONLY the transcribed text. Do not add any introduction or explanation.";
      const response = await sendMessageToGemini({ 
        message: prompt, 
        audio: base64Audio,
        temperature: 0 // Lower temp for accurate transcription
      });
      return response.text?.trim() || "(无法识别语音)";
    } catch (e) {
      console.error("Transcription failed", e);
      return "(语音转文字服务暂时不可用)";
    }
  };

  // --- Handlers: Setup ---
  const startGame = async () => {
    const persona = selectedPersonaId === 'custom' 
      ? customPersona 
      : SIMULATION_PERSONAS.find(p => p.id === selectedPersonaId)?.label || 'Unknown';
    
    // Construct System Instruction
    const systemInstruction = GET_SIMULATION_INSTRUCTION(persona, difficulty);
    
    setGameState('playing');
    setMessages([]);
    setTurnCount(0);
    setIsProcessing(true);

    // Initial Trigger for AI
    try {
      const prompt = `
      [SYSTEM_INSTRUCTION]: ${systemInstruction}
      
      [ACTION]: Start the conversation now. Say hello or ask a simple opening question as the CLIENT.
      
      [OUTPUT_FORMAT]:
      <CLIENT_RESPONSE>
      (Your opening line here)
      </CLIENT_RESPONSE>
      `;
      
      const response = await sendMessageToGemini({ message: prompt });
      
      // Parse initial response (might not have feedback)
      const text = response.text?.replace(/<CLIENT_RESPONSE>|<\/CLIENT_RESPONSE>/g, '').trim() || "你好，我想咨询一下英语课程。";

      setMessages([{
        id: 'init',
        role: MessageRole.MODEL,
        text: text
      }]);
    } catch (e) {
      setMessages([{ id: 'err', role: MessageRole.MODEL, text: "系统初始化失败，请重试。" }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Handlers: Chat ---
  const handleSendMessage = async (audioData?: string) => {
    let textToSend = input.trim();
    
    // 1. Transcribe Audio if present
    if (audioData) {
      setIsProcessing(true); // Show loader during transcription
      textToSend = await transcribeAudio(audioData);
    }

    if (!textToSend) {
      setIsProcessing(false);
      return;
    }

    // 2. Add User Message (Text)
    const userMsg: SimMessage = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      text: textToSend,
      audio: audioData // Keep audio blob for potential playback, but text is primary
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsProcessing(true);
    setTurnCount(prev => prev + 1);

    // 3. Build Context for AI (Text Only)
    const historyContext = newMessages.slice(-6).map(m => 
      `${m.role === MessageRole.USER ? 'Consultant' : 'Client'}: ${m.text}`
    ).join('\n');

    const persona = selectedPersonaId === 'custom' ? customPersona : SIMULATION_PERSONAS.find(p => p.id === selectedPersonaId)?.label;
    
    // 4. Construct Simulation Prompt
    const prompt = `
[SYSTEM REMINDER]: 
- You are the CLIENT (${persona}). 
- Difficulty: ${difficulty}. 
- You are currently chatting with an English course consultant.
- **DO NOT** act as the consultant. **DO NOT** simulate the conversation for both sides. Only reply as the CLIENT.

[CONVERSATION HISTORY]:
${historyContext}

[CONSULTANT'S LATEST INPUT]: ${textToSend}

[YOUR TASK]:
1. **Act as the CLIENT**: Reply naturally to the consultant.
2. **Act as a SALES COACH**: Provide a **FULL, OPTIMIZED SCRIPT (完整金牌话术)** that the consultant *should have said* to better handle this situation. It must be specific, spoken language, and high EQ. Do not just give a hint. Give the exact words.

[STRICT OUTPUT FORMAT]:
<CLIENT_RESPONSE>
(Your reply as the client. Use Markdown for emphasis.)
</CLIENT_RESPONSE>

<COACH_FEEDBACK>
(Your optimized script suggestion. e.g. "您可以这样说: ...")
</COACH_FEEDBACK>
`;

    try {
      const response = await sendMessageToGemini({ message: prompt });
      const rawText = response.text || "";

      // 5. Parse Response
      const clientResponseMatch = rawText.match(/<CLIENT_RESPONSE>([\s\S]*?)<\/CLIENT_RESPONSE>/);
      const coachFeedbackMatch = rawText.match(/<COACH_FEEDBACK>([\s\S]*?)<\/COACH_FEEDBACK>/);

      const clientText = clientResponseMatch ? clientResponseMatch[1].trim() : rawText; // Fallback to raw if no tags
      const feedbackText = coachFeedbackMatch ? coachFeedbackMatch[1].trim() : undefined;

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: MessageRole.MODEL,
        text: clientText,
        feedback: feedbackText
      }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: MessageRole.MODEL,
        text: "网络连接中断，请重试。",
        isError: true
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Handlers: Audio ---
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop Recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    } else {
      // Start Recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = () => {
            handleSendMessage(reader.result as string);
          };
          reader.readAsDataURL(audioBlob);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        alert("无法访问麦克风，请检查浏览器权限。");
      }
    }
  };

  // --- Handlers: Report ---
  const generateReport = async () => {
    setGameState('report');
    setIsGeneratingReport(true);

    const fullTranscript = messages.map(m => 
      `${m.role === MessageRole.USER ? '顾问' : '客户(AI)'}: ${m.text}`
    ).join('\n');

    const prompt = `
${SIMULATION_REPORT_PROMPT}

**谈单背景**:
- 客户人设: ${selectedPersonaId === 'custom' ? customPersona : SIMULATION_PERSONAS.find(p => p.id === selectedPersonaId)?.label}
- 难度模式: ${difficulty}

**完整对话记录**:
${fullTranscript}
`;

    try {
      const response = await sendMessageToGemini({ message: prompt });
      setReportContent(response.text || "生成报告失败");
    } catch (e) {
      setReportContent("网络错误，无法生成报告。");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleDownloadReport = async (type: 'image' | 'pdf') => {
    if (!reportRef.current) return;
    try {
      const element = reportRef.current;
      const originalOverflow = element.style.overflow;
      element.style.overflow = 'visible';
      element.style.height = 'auto'; 
      element.style.background = '#ffffff';

      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      
      element.style.overflow = originalOverflow;

      if (type === 'image') {
        const link = document.createElement('a');
        link.download = `ME_Training_Report_${new Date().getTime()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`ME_Training_Report_${new Date().getTime()}.pdf`);
      }
    } catch (e) {
      alert("下载失败");
    }
  };

  // --- Render: Setup Screen ---
  if (gameState === 'setup') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot size={32} className="text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">AI 模拟谈单训练</h2>
            <p className="text-slate-500 mt-2">选择客户人设，开启 1对1 实战演练</p>
          </div>

          <div className="space-y-6">
            {/* Persona Selection */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">1. 选择客户类型</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SIMULATION_PERSONAS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPersonaId(p.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      selectedPersonaId === p.id 
                        ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' 
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-800">{p.label}</div>
                    <div className="text-xs text-slate-500 mt-1">{p.desc}</div>
                  </button>
                ))}
                
                {/* Custom Persona Option */}
                <button
                  onClick={() => setSelectedPersonaId('custom')}
                  className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                    selectedPersonaId === 'custom' 
                      ? 'border-pink-500 bg-pink-50 ring-1 ring-pink-500' 
                      : 'border-slate-200 hover:border-pink-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-sm text-pink-600 flex items-center gap-2">
                    <Settings2 size={16} /> 自定义客户人设
                  </div>
                  <div className="text-xs text-pink-400 mt-1">输入特定背景或刁钻性格</div>
                </button>
              </div>

              {selectedPersonaId === 'custom' && (
                <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                  <input 
                    type="text" 
                    value={customPersona}
                    onChange={(e) => setCustomPersona(e.target.value)}
                    placeholder="例如: 某大厂技术总监，预算充足但极度挑剔，只关心是否能3个月内流利沟通..."
                    className="w-full p-3 border-2 border-pink-200 rounded-lg text-sm focus:border-pink-500 focus:outline-none text-pink-700 font-medium placeholder:text-pink-300/70"
                  />
                </div>
              )}
            </div>

            {/* Difficulty Selection */}
            <div>
               <label className="block text-sm font-bold text-slate-700 mb-3">2. 选择训练难度</label>
               <div className="flex gap-4">
                 <button 
                   onClick={() => setDifficulty('standard')}
                   className={`flex-1 p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                     difficulty === 'standard' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-slate-200 text-slate-500'
                   }`}
                 >
                   <Shield size={24} />
                   <span className="font-bold">标准模式 (Standard)</span>
                   <span className="text-xs opacity-80">走完 SOP 流程 (20-25轮)</span>
                 </button>

                 <button 
                   onClick={() => setDifficulty('challenge')}
                   className={`flex-1 p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                     difficulty === 'challenge' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-slate-200 text-slate-500'
                   }`}
                 >
                   <Sword size={24} />
                   <span className="font-bold">挑战模式 (Challenge)</span>
                   <span className="text-xs opacity-80">高压异议攻防 (30-40轮)</span>
                 </button>
               </div>
            </div>

            <button 
              onClick={startGame}
              disabled={selectedPersonaId === 'custom' && !customPersona.trim()}
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-transform active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <Play fill="currentColor" /> 开始模拟
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Render: Chat Screen ---
  if (gameState === 'playing') {
    return (
      <div className="h-full flex flex-col bg-slate-50 rounded-xl overflow-hidden shadow-sm border border-slate-200">
        {/* Header */}
        <div className="bg-white p-4 border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
               <User className="text-indigo-600" size={20} />
             </div>
             <div>
               <h3 className="font-bold text-slate-800 text-sm">
                 {selectedPersonaId === 'custom' ? '自定义客户' : SIMULATION_PERSONAS.find(p => p.id === selectedPersonaId)?.label.split('(')[0]}
               </h3>
               <div className="flex items-center gap-2 text-xs text-slate-500">
                 <span className={`px-1.5 py-0.5 rounded ${difficulty === 'challenge' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {difficulty === 'challenge' ? '挑战模式' : '标准模式'}
                 </span>
                 <span>• 第 {turnCount} 轮</span>
               </div>
             </div>
          </div>
          <button 
            onClick={generateReport}
            className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 flex items-center gap-2 transition-colors"
          >
            <FileCheck size={14} /> 结束并生成报告
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-8" ref={chatScrollRef}>
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col gap-1 w-full`}>
                <div className={`flex gap-3 ${msg.role === MessageRole.USER ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === MessageRole.USER ? 'bg-blue-600' : 'bg-white border border-slate-200'}`}>
                        {msg.role === MessageRole.USER ? <User size={16} className="text-white"/> : <Bot size={16} className="text-indigo-600"/>}
                    </div>
                    <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                        msg.role === MessageRole.USER 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                    }`}>
                        {/* Render Message Text */}
                        {msg.role === MessageRole.MODEL ? (
                           <ReactMarkdown remarkPlugins={[remarkGfm]} components={ChatMarkdownComponents}>
                             {msg.text}
                           </ReactMarkdown>
                        ) : (
                           <div className="whitespace-pre-wrap">{msg.text}</div>
                        )}
                    </div>
                </div>

                {/* Render Coach Feedback (Only for Model messages that have feedback) */}
                {msg.role === MessageRole.MODEL && msg.feedback && (
                  <div className="flex flex-row ml-11 max-w-[85%] animate-in slide-in-from-top-2 fade-in">
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-3 shadow-sm relative">
                          <div className="absolute -top-1.5 left-4 w-3 h-3 bg-amber-50 border-t border-l border-amber-100 transform rotate-45"></div>
                          <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Lightbulb size={14} className="text-amber-600" />
                          </div>
                          <div className="w-full">
                              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">💡 优化话术建议 (Suggested Script)</p>
                              <div className="text-sm text-slate-800 leading-relaxed bg-white/50 p-2 rounded-lg border border-amber-100">
                                  <ReactMarkdown components={{p: ({node, ...props}) => <span {...props}/>}}>
                                     {msg.feedback}
                                  </ReactMarkdown>
                              </div>
                          </div>
                      </div>
                  </div>
                )}
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex items-center gap-2 text-slate-400 text-xs ml-12">
               <Loader2 className="animate-spin" size={14} /> 
               {isRecording ? "正在接收语音..." : "对方正在输入..."}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="bg-white p-4 border-t border-slate-200">
           <div className="flex items-end gap-2">
             <button
               onClick={toggleRecording}
               disabled={isProcessing}
               className={`p-3 rounded-xl transition-all active:scale-95 flex-shrink-0 ${
                 isRecording 
                   ? 'bg-red-500 text-white ring-4 ring-red-200 animate-pulse' 
                   : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
               }`}
             >
               {isRecording ? <Square fill="currentColor" size={20}/> : <Mic size={20}/>}
             </button>
             
             <textarea
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
               placeholder={isRecording ? "正在录音... 再次点击麦克风结束" : "输入回复..."}
               disabled={isProcessing || isRecording}
               rows={1}
               // Updated classes: bg-white for contrast, text-slate-900 for visibility
               className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm text-slate-900 placeholder:text-slate-400 disabled:bg-slate-100 disabled:text-slate-400"
             />
             
             <button
               onClick={() => handleSendMessage()}
               disabled={!input.trim() || isProcessing || isRecording}
               className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all flex-shrink-0"
             >
               <Send size={20} />
             </button>
           </div>
           <p className="text-[10px] text-center text-slate-400 mt-2">
             {isRecording ? "点击麦克风停止录音并发送" : "点击麦克风开始录音，或回车发送文字"}
           </p>
        </div>
      </div>
    );
  }

  // --- Render: Report Screen ---
  return (
    <div className="h-full flex flex-col p-4 md:p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full">
         <div className="mb-6 flex justify-between items-center">
            <button 
              onClick={() => setGameState('setup')} 
              className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold text-sm"
            >
               <RotateCcw size={16}/> 再练一次
            </button>
            <div className="flex gap-2">
               <button onClick={() => handleDownloadReport('image')} className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-slate-50 flex items-center gap-2">
                 <Download size={14}/> 导出图片
               </button>
               <button onClick={() => handleDownloadReport('pdf')} className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-slate-50 flex items-center gap-2">
                 <Download size={14}/> 导出 PDF
               </button>
            </div>
         </div>

         <div ref={reportRef} className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 min-h-[600px] relative">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-6">
               <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Trophy size={32} className="text-yellow-600" />
               </div>
               <div>
                  <h1 className="text-2xl font-black text-slate-900 m-0 border-none p-0 mb-1">模拟谈单训练报告</h1>
                  <div className="flex gap-4 text-sm text-slate-500">
                     <span className="flex items-center gap-1"><User size={14}/> 对象: {selectedPersonaId === 'custom' ? '自定义' : SIMULATION_PERSONAS.find(p => p.id === selectedPersonaId)?.label.split('(')[0]}</span>
                     <span className="flex items-center gap-1"><Clock size={14}/> 轮次: {turnCount}</span>
                     <span className={`flex items-center gap-1 font-bold ${difficulty === 'challenge' ? 'text-red-500' : 'text-green-500'}`}>
                        {difficulty === 'challenge' ? <Sword size={14}/> : <Shield size={14}/>} {difficulty === 'challenge' ? '挑战模式' : '标准模式'}
                     </span>
                  </div>
               </div>
            </div>

            {/* Content */}
            {isGeneratingReport ? (
               <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Loader2 size={48} className="animate-spin text-indigo-500 mb-4" />
                  <p className="font-medium text-slate-600">销售总监正在批改试卷...</p>
                  <p className="text-xs mt-2">正在分析 {messages.length} 条对话记录</p>
               </div>
            ) : (
               <div className="prose prose-sm max-w-none prose-slate">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={ReportMarkdownComponents}>
                    {reportContent}
                  </ReactMarkdown>
               </div>
            )}
            
            {/* Watermark */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] select-none overflow-hidden">
                <div className="transform -rotate-12 text-6xl font-black text-slate-900 whitespace-nowrap">
                  ME Training Simulation
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};
