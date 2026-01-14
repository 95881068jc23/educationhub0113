
import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, User, Play, Square, Mic, Send, FileCheck, Download, Settings2, Trophy, Loader2,
  Lightbulb, Volume2, BookOpen, Shield, Sword, RotateCcw, Upload, FileText, X, Layers,
  MicOff, FileType, ExternalLink, RefreshCw, FileImage
} from 'lucide-react';
import { SIMULATION_PERSONAS } from '../constants';
import { sendMessageToGemini } from '../services/gemini';
import { ChatMessage, MessageRole } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Mock Teaching types
interface SimMessage extends ChatMessage {
  feedback?: string;
}

// Markdown Styles for Report
const ReportMarkdownComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  h1: ({ node, ...props }) => (
    <h1 className="text-2xl font-black text-slate-900 mb-6 border-b-2 border-yellow-200 pb-3" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4 flex items-center gap-2 border-l-4 border-teal-500 pl-3" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="text-lg font-bold text-teal-800 mt-6 mb-3 bg-teal-50 px-3 py-2 rounded-lg" {...props} />
  ),
  ul: ({ node, ...props }) => (
    <ul className="space-y-3 mb-6 list-disc ml-5 text-slate-700" {...props} />
  ),
  li: ({ node, ...props }) => (
    <li className="leading-relaxed pl-1" {...props} />
  ),
  p: ({ node, ...props }) => (
    <p className="mb-4 text-slate-700 leading-relaxed text-sm md:text-base" {...props} />
  ),
  strong: ({ node, ...props }) => (
    <span className="font-bold text-slate-900 bg-yellow-50 px-1 rounded" {...props} />
  ),
  blockquote: ({ node, ...props }) => (
    <div className="bg-slate-50 border-l-4 border-slate-300 p-4 my-6 italic text-slate-600 rounded-r-lg shadow-sm text-sm" {...props} />
  ),
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-6 rounded-lg border border-slate-200 shadow-sm bg-white">
      <table className="min-w-full divide-y divide-slate-200" {...props} />
    </div>
  ),
  thead: ({ node, ...props }) => (
    <thead className="bg-slate-800 text-white" {...props} />
  ),
  th: ({ node, ...props }) => (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" {...props} />
  ),
  td: ({ node, ...props }) => (
    <td className="px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap border-t border-slate-100" {...props} />
  ),
};

export const MockTeaching: React.FC = () => {
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'report'>('setup');
  const [personaId, setPersonaId] = useState(SIMULATION_PERSONAS[0].id);
  const [customPersona, setCustomPersona] = useState('');
  const [studentLevel, setStudentLevel] = useState<string>('beginner');
  const [classTopic, setClassTopic] = useState('');
  const [topicError, setTopicError] = useState(false);
  const [difficulty, setDifficulty] = useState<'standard' | 'challenge'>('standard');
  const [messages, setMessages] = useState<SimMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  
  // Courseware State
  const [coursewareUrl, setCoursewareUrl] = useState<string | null>(null);
  const [coursewareName, setCoursewareName] = useState<string>('');
  
  // Audio/TTS State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const reportRef = useRef<HTMLDivElement>(null);

  // --- Initialization & Effects ---

  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Initialize Voices for TTS
  useEffect(() => {
    const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            setAvailableVoices(voices);
        }
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // --- Helpers ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
        const url = URL.createObjectURL(file);
        setCoursewareUrl(url);
        setCoursewareName(file.name);
    } else {
        alert("请上传 PDF 格式的课件以保证最佳兼容性。");
    }
  };

  const getBestVoice = () => {
    let voice = availableVoices.find(v => v.name.includes("Microsoft") && v.name.includes("Online") && v.name.includes("Natural") && v.lang.includes("en"));
    if (!voice) voice = availableVoices.find(v => v.name.includes("Google US English"));
    if (!voice) voice = availableVoices.find(v => v.lang.includes("en-US"));
    if (!voice) voice = availableVoices.find(v => v.lang.includes("en"));
    return voice || availableVoices[0];
  };

  const cleanTextForTTS = (text: string) => {
      let clean = text.replace(/[\(\[\{].*?[\)\]\}]/g, "");
      return clean;
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); 
    
    const textToSpeak = cleanTextForTTS(text);
    if (!textToSpeak.trim()) return;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const selectedVoice = getBestVoice();
    
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = studentLevel === 'beginner' ? 0.85 : 0.95; 
    utterance.pitch = 1.1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
     const reader = new FileReader();
     return new Promise((resolve, reject) => {
        reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            try {
                const res = await sendMessageToGemini({ 
                    message: "TRANSCRIPTION_TASK: Transcribe audio to text. Output ONLY the English words.",
                    audio: base64Audio,
                    temperature: 0
                });
                resolve(res.text?.trim() || "(Unintelligible Audio)");
            } catch (e) {
                console.error("Transcription failed", e);
                resolve("(Audio Transcription Failed)");
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
     });
  };

  const getSystemPrompt = (persona: string, customDetails: string) => {
    let levelConfig = {
        label: "A2 (Beginner)",
        behavior: "Broken English. Short sentences. 'I no have time'.",
        comprehension: "Say 'Sorry, I don't understand' if teacher talks fast."
    };

    if (studentLevel === 'intermediate') {
        levelConfig = {
            label: "B1/B2 (Intermediate)",
            behavior: "Communicative but with Chinglish grammar.",
            comprehension: "Understand most things."
        };
    } else if (studentLevel === 'advanced') {
        levelConfig = {
            label: "C1 (Advanced)",
            behavior: "Fluent and natural.",
            comprehension: "Full understanding."
        };
    }

    const personaDetail = persona === 'Custom' ? customDetails : persona;

    return `
    You are role-playing a **CHINESE STUDENT** in an English class.
    
    **YOUR PERSONA:**
    - Role: ${personaDetail}
    - Level: ${levelConfig.label}
    
    **RULES:**
    1. **NO PINYIN**. 
    2. **NO TRANSLATION**.
    3. **OUTPUT ONLY SPOKEN WORDS**.
    4. **STYLE:** ${levelConfig.behavior}
    5. **Task:** Reply to the teacher naturally.
    
    **TOPIC:** ${classTopic}
    `;
  };

  const startGame = async () => {
    if (!classTopic.trim()) {
        setTopicError(true);
        return;
    }
    setTopicError(false);

    setGameState('playing');
    setMessages([]);
    setTurnCount(0);
    setIsProcessing(true);
    
    let personaLabel = '';
    let customDetails = '';

    if (personaId === 'custom') {
        personaLabel = 'Custom';
        customDetails = customPersona || "A student with specific needs defined by user.";
    } else {
        const p = SIMULATION_PERSONAS.find(p => p.id === personaId);
        personaLabel = p?.label || "Student";
        customDetails = p?.desc || "";
    }

    const instruction = getSystemPrompt(personaLabel, customDetails);
    
    try {
       const prompt = `
       ${instruction}
       
       [ACTION]: The class is starting about '${classTopic}'. 
       [TASK]: Say a simple greeting to your teacher.
       `;
       const res = await sendMessageToGemini({ message: prompt });
       const text = res.text?.trim() || "Hello teacher.";
       setMessages([{ id: 'init', role: MessageRole.MODEL, text: text }]);
       setTimeout(() => speakText(text), 500);
    } catch(e) { 
        console.error("Simulation failed:", e);
        setGameState('setup');
    } finally { 
        setIsProcessing(false); 
    }
  };

  const handleSend = async (audioBlob?: Blob) => {
     let text = input.trim();
     
     if (audioBlob) {
        setIsProcessing(true);
        text = await transcribeAudio(audioBlob);
     }
     
     if(!text) {
         setIsProcessing(false);
         return;
     }

     const userMsg: SimMessage = { id: Date.now().toString(), role: MessageRole.USER, text: text };
     setMessages(prev => [...prev, userMsg]);
     setInput('');
     setIsProcessing(true);
     setTurnCount(prev => prev + 1);

     // Build Prompt
     let personaLabel = '';
     let customDetails = '';
     if (personaId === 'custom') {
        personaLabel = 'Custom';
        customDetails = customPersona;
     } else {
        const p = SIMULATION_PERSONAS.find(p => p.id === personaId);
        personaLabel = p?.label || "Student";
        customDetails = p?.desc || "";
     }

     const context = messages.slice(-5).map(m => `${m.role === MessageRole.USER ? 'Teacher' : 'Student'}: ${m.text}`).join('\n');
     const instruction = getSystemPrompt(personaLabel, customDetails);
     
     const prompt = `
     ${instruction}

     [CONVERSATION HISTORY]:
     ${context}
     
     [TEACHER SAID]: "${text}"
     
     --------------------------------------------------
     **YOUR RESPONSE TASKS:**
     
     1. **Student Response**: Reply as the student (${studentLevel}). 
        - STRICTLY NO PINYIN. 
        - STRICTLY NO CHINESE TRANSLATION (Unless asking "What is X in Chinese?").
        - Natural, short, spoken English.
     
     2. **Mentor Feedback**: Act as a Senior Teaching Mentor (Academic Director).
        - Evaluate the teacher's last turn (Instruction clarity, ICQs, TTT).
        - Provide **BILINGUAL (English + Chinese)** feedback.
        - Example: "Good use of ICQs. (指令检查做得很好。)"
     
     **STRICT OUTPUT FORMAT:**
     <STUDENT_RESPONSE>
     (Spoken words only)
     </STUDENT_RESPONSE>
     
     <FEEDBACK>
     (Bilingual feedback)
     </FEEDBACK>
     --------------------------------------------------
     `;

     try {
       const res = await sendMessageToGemini({ message: prompt }); 
       const raw = res.text || "";
       
       const studentMatch = raw.match(/<STUDENT_RESPONSE>([\s\S]*?)<\/STUDENT_RESPONSE>/i);
       const feedbackMatch = raw.match(/<FEEDBACK>([\s\S]*?)<\/FEEDBACK>/i);

       const studentText = studentMatch ? studentMatch[1].trim() : raw.replace(/<FEEDBACK>[\s\S]*?<\/FEEDBACK>/i, "").trim(); 
       const feedback = feedbackMatch ? feedbackMatch[1].trim() : undefined;
       
       setMessages(prev => [...prev, { 
         id: Date.now().toString(), 
         role: MessageRole.MODEL, 
         text: studentText,
         feedback: feedback
       }]);

       speakText(studentText);

     } catch(e) {
       setMessages(prev => [...prev, { id: Date.now().toString(), role: MessageRole.MODEL, text: "Connection error.", isError: true }]);
     } finally {
       setIsProcessing(false);
     }
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = e => audioChunksRef.current.push(e.data);
        mediaRecorder.onstop = () => {
           const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
           handleSend(blob);
           stream.getTracks().forEach(t => t.stop());
        };
        mediaRecorder.start();
        setIsRecording(true);
      } catch(e) { alert("Mic Error: Please allow microphone access."); }
    } else {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    }
  };

  const generateReport = async () => {
     setGameState('report');
     setIsGeneratingReport(true);
     
     const history = messages.map(m => `[${m.role === MessageRole.USER ? 'TEACHER' : 'STUDENT'}]: ${m.text}`).join('\n');
     
     const prompt = `
     You are the Academic Director at Marvellous Education. Write a detailed teaching performance report for this mock class.
     
     **Class Details:**
     - Topic: ${classTopic}
     - Student Level: ${studentLevel}
     - Turn Count: ${turnCount}
     
     **Transcript:**
     ${history}
     
     **REPORT FORMAT (STRICT MARKDOWN):**
     
     # 🎓 Teaching Performance Review (授课评估报告)
     
     ## 1. Executive Summary (综合评价)
     (Write a summary paragraph in English & Chinese. Did the teacher achieve the goal? Was the atmosphere good?)
     
     ## 2. Key Strengths (亮点)
     - **[Strength 1]**: (Explanation in Bilingual)
     - **[Strength 2]**: ...
     
     ## 3. Areas for Improvement (改进建议)
     - **[Suggestion 1]**: (Explanation in Bilingual)
     - **[Suggestion 2]**: ...
     
     ## 4. Teaching Script Correction (话术优化)
     (Select 1 specific teacher turn that was weak, and rewrite it better)
     > Original Teacher: "..."
     > Better Version: "..."
     
     ## 5. Score (评分)
     | Dimension | Score (1-10) | Comment |
     | :--- | :---: | :--- |
     | Engagement (互动) | | |
     | Clarity (清晰度) | | |
     | Error Correction (纠错) | | |
     | Goal Achievement (目标达成) | | |
     
     **Total Score:** / 40
     `;

     try {
        const res = await sendMessageToGemini({ message: prompt });
        setReportContent(res.text || "Failed to generate report.");
     } catch (e) {
        setReportContent("Error generating report. Please check connection.");
     } finally {
        setIsGeneratingReport(false);
     }
  };

  const handleDownloadReport = async (type: 'image' | 'pdf') => {
    if (!reportRef.current) return;
    const element = reportRef.current;
    
    try {
        const originalOverflow = element.style.overflow;
        const originalHeight = element.style.height;
        element.style.overflow = 'visible';
        element.style.height = 'auto';
        
        const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        
        element.style.overflow = originalOverflow;
        element.style.height = originalHeight;

        if (type === 'image') {
            const link = document.createElement('a');
            link.download = `ME_Teaching_Report_${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } else {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
            pdf.save(`ME_Teaching_Report_${Date.now()}.pdf`);
        }
    } catch (e) {
        alert("Export failed");
    }
  };

  // --- Render ---
  if (gameState === 'setup') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-50 overflow-y-auto">
         <div className="max-w-4xl w-full bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h1 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Bot className="text-teal-600"/> 模拟上课训练 (Mock Teaching)
            </h1>
            <p className="text-slate-500 mb-8">选择学生人设，开启 1对1 沉浸式教学演练。</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Col: Config */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3">1. 选择学生人设 (Student Persona)</label>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                {SIMULATION_PERSONAS.map(p => (
                                    <button 
                                    key={p.id} 
                                    onClick={() => setPersonaId(p.id)}
                                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${personaId === p.id ? 'bg-teal-50 border-teal-500 ring-1 ring-teal-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full border-2 mt-1 flex-shrink-0 ${personaId === p.id ? 'border-teal-600 bg-teal-600' : 'border-slate-300'}`}></div>
                                        <div>
                                            <div className="font-bold text-slate-800 text-sm">{p.label}</div>
                                            <div className="text-xs text-slate-500 mt-1">{p.desc}</div>
                                        </div>
                                    </button>
                                ))}
                                <button 
                                    onClick={() => setPersonaId('custom')}
                                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${personaId === 'custom' ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                                >
                                     <div className={`w-4 h-4 rounded-full border-2 mt-1 flex-shrink-0 ${personaId === 'custom' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}></div>
                                     <div className="w-full">
                                         <div className="font-bold text-indigo-800 text-sm flex items-center gap-2"><Settings2 size={14}/> 自定义学生 (Custom)</div>
                                         <div className="text-xs text-indigo-400 mt-1">定制特定性格或背景</div>
                                         {personaId === 'custom' && (
                                             <textarea 
                                                value={customPersona}
                                                onChange={(e) => setCustomPersona(e.target.value)}
                                                placeholder="例如：35岁，金融高管，性格急躁，只想学商务英语，讨厌语法..."
                                                className="w-full mt-2 p-2 border border-indigo-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 h-20"
                                                onClick={(e) => e.stopPropagation()}
                                             />
                                         )}
                                     </div>
                                </button>
                        </div>
                    </div>
                </div>

                {/* Right Col: Details */}
                <div className="space-y-6">
                    {/* Level */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3">2. 英语水平 (English Level)</label>
                        <div className="flex gap-2">
                           {['beginner', 'intermediate', 'advanced'].map((l) => (
                               <button 
                                key={l}
                                onClick={() => setStudentLevel(l)}
                                className={`flex-1 py-3 rounded-xl border text-xs font-bold capitalize transition-all ${studentLevel === l ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                               >
                                 {l}
                               </button>
                           ))}
                        </div>
                    </div>

                    {/* Topic */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3">3. 课程主题 (Class Topic)</label>
                        <div className="relative">
                            <BookOpen className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                            <input 
                                type="text"
                                value={classTopic}
                                onChange={(e) => {
                                    setClassTopic(e.target.value);
                                    if (e.target.value.trim()) setTopicError(false);
                                }}
                                placeholder="e.g. Asking for Directions, Past Tense"
                                className={`w-full p-3 pl-10 border-2 rounded-xl bg-slate-50 text-slate-900 outline-none font-medium transition-colors ${topicError ? 'border-red-300 bg-red-50 focus:border-red-500' : 'border-slate-200 focus:border-teal-500'}`}
                            />
                        </div>
                    </div>

                    {/* Courseware */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3">4. 上传课件 (Upload Courseware)</label>
                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center hover:bg-slate-50 transition-colors relative">
                             <input 
                                type="file" 
                                accept="application/pdf"
                                onChange={handleFileUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                             />
                             <div className="flex items-center gap-2 text-slate-600 mb-1">
                                {coursewareUrl ? <FileCheck className="text-green-500"/> : <Upload className="text-slate-400"/>}
                                <span className="font-bold text-sm">{coursewareUrl ? coursewareName : "点击上传 PDF 课件"}</span>
                             </div>
                             <p className="text-xs text-slate-400 text-center">
                                {coursewareUrl ? "Ready to present" : "推荐使用 PDF 格式以防浏览器屏蔽 (PPT请导出为PDF)"}
                             </p>
                        </div>
                    </div>

                    <button 
                        onClick={startGame} 
                        disabled={isProcessing}
                        className="w-full py-4 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-all flex items-center justify-center gap-2 text-lg shadow-lg transform active:scale-[0.99] disabled:opacity-70 disabled:cursor-wait mt-4"
                    >
                        {isProcessing ? <Loader2 className="animate-spin"/> : <Play fill="currentColor"/>}
                        开始上课 (Start Class)
                    </button>
                </div>
            </div>
         </div>
      </div>
    );
  }

  if (gameState === 'playing') {
     return (
       <div className="h-full flex flex-col bg-slate-50">
          {/* Header */}
          <div className="bg-white px-4 py-3 border-b flex justify-between items-center shadow-sm z-20 flex-shrink-0">
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 font-bold">
                        <User size={20}/>
                    </div>
                    <div>
                        <div className="font-bold text-sm text-slate-800 flex items-center gap-2">
                            <span>{personaId === 'custom' ? (customPersona.slice(0, 15) + '...') : SIMULATION_PERSONAS.find(p => p.id === personaId)?.label.split('(')[0]}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded border ${
                                studentLevel === 'beginner' ? 'bg-green-50 text-green-700 border-green-200' :
                                studentLevel === 'intermediate' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                'bg-red-50 text-red-700 border-red-200'
                            }`}>
                                {studentLevel.toUpperCase()}
                            </span>
                        </div>
                        <div className="text-xs text-slate-500 max-w-[200px] truncate">{classTopic}</div>
                    </div>
                </div>
                
                {/* Voice Status Indicator */}
                <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2 ${isSpeaking ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {isSpeaking ? <Volume2 size={12} className="animate-pulse"/> : <MicOff size={12}/>}
                    {isSpeaking ? "Student Speaking..." : "Student Listening"}
                </div>
             </div>

             <div className="flex items-center gap-2">
                 {/* Re-upload in header */}
                 <div className="relative">
                     <button className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors flex items-center gap-2">
                        <FileType size={14} /> {coursewareUrl ? "更换课件" : "上传课件"}
                     </button>
                     <input type="file" accept="application/pdf" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                 </div>
                 
                 <button onClick={generateReport} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors flex items-center gap-2">
                   <FileCheck size={14}/> 下课 (End)
                 </button>
             </div>
          </div>

          {/* Main Content: Split View */}
          <div className="flex-1 flex overflow-hidden">
             
             {/* LEFT: Chat Interface */}
             <div className={`flex flex-col flex-1 min-w-0 transition-all ${coursewareUrl ? 'w-1/2 border-r border-slate-200' : 'w-full'}`}>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50" ref={chatScrollRef}>
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex flex-col w-full ${msg.role === MessageRole.USER ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[90%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === MessageRole.USER ? 'bg-teal-600 text-white rounded-br-none shadow-md' : 'bg-white border border-slate-200 rounded-bl-none text-slate-800 shadow-sm'}`}>
                                {msg.role === MessageRole.MODEL && (
                                    <div className="text-[10px] font-bold text-teal-600 mb-2 flex items-center gap-1 uppercase tracking-wide opacity-70">
                                        Student
                                    </div>
                                )}
                                {msg.role === MessageRole.USER && (
                                    <div className="mb-2 text-[10px] opacity-70 flex items-center gap-1 border-b border-white/20 pb-1 uppercase tracking-wide">
                                        Teacher
                                    </div>
                                )}
                                <div className="whitespace-pre-wrap">{msg.text}</div>
                                {msg.role === MessageRole.MODEL && (
                                   <button 
                                     onClick={() => speakText(msg.text)} 
                                     className="ml-2 mt-1 inline-block p-1 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500"
                                     title="Replay Audio"
                                   >
                                     <Volume2 size={10}/>
                                   </button>
                                )}
                            </div>
                            {msg.feedback && (
                                <div className="max-w-[90%] mt-2 bg-amber-50 border border-amber-100 p-3 rounded-xl text-xs text-slate-700 flex gap-2 animate-in fade-in slide-in-from-top-1 shadow-sm">
                                    <Lightbulb size={16} className="text-amber-600 flex-shrink-0 mt-0.5"/>
                                    <div>
                                        <span className="font-bold text-amber-700 block mb-1">💡 教学导师建议 (Mentor Feedback):</span>
                                        <div className="prose prose-sm max-w-none text-slate-700">
                                          <ReactMarkdown>{msg.feedback}</ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {isProcessing && (
                        <div className="text-slate-400 text-xs ml-4 flex gap-2 items-center">
                             <Loader2 className="animate-spin" size={12}/> 
                             {isRecording ? "Listening..." : "Student is thinking..."}
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="bg-white p-4 border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                    <div className="flex gap-2 items-end">
                        <button 
                        onClick={toggleRecording}
                        disabled={isProcessing && !isRecording}
                        className={`p-3 rounded-xl transition-all flex-shrink-0 ${isRecording ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                        {isRecording ? <Square fill="currentColor" size={20}/> : <Mic size={20}/>}
                        </button>
                        <div className="flex-1 relative">
                            <textarea 
                            value={input} 
                            onChange={e => setInput(e.target.value)} 
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            placeholder={isRecording ? "Listening... (Click Mic to stop)" : "Type what you want to say to the student..."}
                            disabled={isRecording || isProcessing}
                            className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 bg-white text-slate-900 resize-none h-[50px] leading-tight text-sm"
                            />
                        </div>
                        <button onClick={() => handleSend()} disabled={(!input && !isRecording) || isProcessing} className="p-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-all flex-shrink-0 h-[50px]">
                        <Send size={20}/>
                        </button>
                    </div>
                </div>
             </div>

             {/* RIGHT: Courseware Viewer */}
             {coursewareUrl && (
                 <div className="flex-1 bg-slate-100 relative border-l border-slate-300 flex flex-col">
                    <div className="bg-white border-b border-slate-200 px-4 py-2 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-2">
                            <FileText size={14}/> {coursewareName}
                        </span>
                        <div className="flex gap-2">
                            <a 
                                href={coursewareUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-teal-600 p-1"
                                title="Open in new tab (Use if preview blocked)"
                            >
                                <ExternalLink size={16}/>
                            </a>
                            <button onClick={() => setCoursewareUrl(null)} className="text-slate-400 hover:text-red-500 p-1">
                                <X size={16}/>
                            </button>
                        </div>
                    </div>
                    {/* Replaced iframe with embed for better local PDF compatibility in Edge/Chrome */}
                    <div className="flex-1 bg-slate-200 flex flex-col items-center justify-center relative">
                         <object 
                            data={coursewareUrl} 
                            type="application/pdf" 
                            className="w-full h-full"
                         >
                            <div className="text-center p-6">
                                <p className="text-slate-600 mb-2">Browser preview is not available.</p>
                                <a 
                                    href={coursewareUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold"
                                >
                                    Click to Open PDF
                                </a>
                            </div>
                         </object>
                    </div>
                 </div>
             )}
          </div>
       </div>
     );
  }

  // Report View
  return (
    <div className="h-full p-6 overflow-y-auto bg-slate-50">
       <div className="max-w-4xl mx-auto w-full">
           <div className="flex justify-between items-center mb-6">
                <button onClick={() => setGameState('setup')} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 flex items-center gap-2 shadow-lg">
                    <RotateCcw size={18}/> 再练一次 (New Class)
                </button>
                {reportContent && (
                    <div className="flex gap-2">
                        <button onClick={() => handleDownloadReport('image')} className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-slate-50 flex items-center gap-2">
                            <FileImage size={14}/> 导出图片
                        </button>
                        <button onClick={() => handleDownloadReport('pdf')} className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-slate-50 flex items-center gap-2">
                            <Download size={14}/> 导出 PDF
                        </button>
                    </div>
                )}
           </div>

           <div ref={reportRef} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-[600px]">
                <div className="flex items-center gap-4 mb-8 border-b pb-6">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Trophy size={32} className="text-yellow-600"/>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 mb-1">授课表现评估报告</h1>
                        <p className="text-slate-500 text-sm">Teaching Performance Evaluation Report</p>
                    </div>
                </div>
                
                <div className="flex gap-4 mb-8 text-sm">
                    <div className="bg-slate-100 px-3 py-1 rounded font-bold text-slate-600">Topic: {classTopic}</div>
                    <div className="bg-slate-100 px-3 py-1 rounded font-bold text-slate-600">Level: {studentLevel.toUpperCase()}</div>
                    <div className="bg-slate-100 px-3 py-1 rounded font-bold text-slate-600">Turns: {turnCount}</div>
                </div>

                {isGeneratingReport ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <Loader2 className="animate-spin mb-4 text-teal-600" size={40}/>
                        <p className="font-bold text-slate-600">Generating Analysis...</p>
                    </div>
                ) : (
                    <div className="prose prose-sm max-w-none prose-slate">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={ReportMarkdownComponents}>
                            {reportContent}
                        </ReactMarkdown>
                    </div>
                )}
           </div>
       </div>
    </div>
  );
};
