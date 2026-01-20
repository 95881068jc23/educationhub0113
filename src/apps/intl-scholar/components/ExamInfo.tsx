import React, { useState, useEffect, useRef } from 'react';
import { ExamType, Language } from '../types';
import { generateExamBrief, generateExamFullGuide, askExamQuestion } from '../services/geminiService';
import { TRANSLATIONS, CITIES } from '../constants';
import { Loader2, BookOpen, Download, Image as ImageIcon, FileText, Sparkles, MessageCircle, Send, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import html2canvas from 'html2canvas';

interface Props {
  exam: ExamType;
  language: Language;
  // Mock Exam props removed
  mockScore?: string | null; // Optional if you still want to display it somewhere, but removal requested.
  // Not used anymore: onMockScoreUpdate, onMockScoreClear
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const ExamInfo: React.FC<Props> = ({ exam, language }) => {
  const [brief, setBrief] = useState<string>('');
  const [guide, setGuide] = useState<string>('');
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [loadingGuide, setLoadingGuide] = useState(false);
  
  // Collapse State
  const [isBriefOpen, setIsBriefOpen] = useState(true);
  const [isGuideOpen, setIsGuideOpen] = useState(true);
  
  // City selection for domestic exams
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[language];
  const contentRef = useRef<HTMLDivElement>(null);

  // Check if city selection is needed
  const isDomestic = [
      ExamType.ZHONGKAO, 
      ExamType.GAOKAO, 
      ExamType.PRIMARY_ENGLISH,
      ExamType.JUNIOR_ENGLISH
    ].includes(exam);

  // Initialize state when exam changes
  useEffect(() => {
      setBrief(''); // Clear brief
      setGuide(''); // Clear guide
      setLoadingBrief(false);
      setIsBriefOpen(true); 
      setIsGuideOpen(true);
      setSelectedCity(CITIES[0]);
      // Reset chat
      setMessages([{ role: 'model', text: t.chatIntro.replace('{exam}', exam) }]);
  }, [exam, t.chatIntro]);

  // Handle Brief Generation manually
  const handleGenerateBrief = async () => {
    setLoadingBrief(true);
    try {
        const text = await generateExamBrief(exam);
        setBrief(text);
    } catch (e) {
        console.error(e);
    } finally {
        setLoadingBrief(false);
    }
  };

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleGenerateGuide = async () => {
    setLoadingGuide(true);
    setIsGuideOpen(true); // Ensure it's open when generating
    try {
      // Pass city if domestic
      const cityToPass = isDomestic ? selectedCity : "";
      const text = await generateExamFullGuide(exam, cityToPass);
      setGuide(text);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingGuide(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    
    const newMessages: ChatMessage[] = [...messages, { role: 'user', text: userMsg }];
    setMessages(newMessages);
    setChatLoading(true);

    try {
      const response = await askExamQuestion(exam, userMsg, newMessages);
      setMessages([...newMessages, { role: 'model', text: response }]);
    } catch (e) {
      console.error(e);
      setMessages([...newMessages, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleExportWord = () => {
    if (!contentRef.current) return;
    const htmlContent = contentRef.current.innerHTML;
    
    // SVG Watermark for Word Background
    const watermarkSvg = encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="500" height="500">
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="60" fill="rgba(0,0,0,0.1)" text-anchor="middle" dominant-baseline="middle" transform="rotate(-45 250 250)">
          麦迩威教育
        </text>
      </svg>
    `.trim());
    
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Exam Guide</title>
        <style>
          body {
            background-image: url('data:image/svg+xml;utf8,${watermarkSvg}');
            background-repeat: repeat;
          }
        </style>
      </head><body>`;
      
    const footer = "</body></html>";
    const sourceHTML = header + htmlContent + footer;
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const link = document.createElement("a");
    document.body.appendChild(link);
    link.href = source;
    link.download = `${exam}_Guide.doc`;
    link.click();
    document.body.removeChild(link);
  };

  const handleExportImage = async () => {
    if (!contentRef.current) return;
    try {
      const canvas = await html2canvas(contentRef.current);
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${exam}_Guide.png`;
      link.click();
    } catch (e) {
      console.error('Image export failed', e);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-12">
      
      {/* 1. Quick Brief Section */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden transition-all duration-300">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-navy-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
        
        <div className="flex justify-between items-center mb-6 relative z-10">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-navy-100 rounded-lg text-navy-900">
                <Sparkles size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">{t.quickBrief}</h2>
              <button 
                onClick={() => setIsBriefOpen(!isBriefOpen)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-navy-700 transition-colors"
                title={isBriefOpen ? "Collapse" : "Expand"}
              >
                {isBriefOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
           </div>
        </div>
        
        {isBriefOpen && (
            !brief && !loadingBrief ? (
                <div className="flex flex-col items-center justify-center py-6">
                    <p className="text-slate-500 mb-4 text-sm">Generate a 1-minute key information card for consultants.</p>
                    <button
                        onClick={handleGenerateBrief}
                        className="px-6 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-bold hover:bg-indigo-200 transition-colors flex items-center gap-2"
                    >
                        <Sparkles size={16} /> Generate Brief
                    </button>
                </div>
            ) : loadingBrief ? (
              <div className="flex items-center gap-3 text-slate-500 py-8 animate-fade-in">
                 <Loader2 className="animate-spin" size={20} />
                 <span>Gathering intelligence on {exam}...</span>
              </div>
            ) : (
              <div className="prose prose-sm prose-slate max-w-none animate-fade-in">
                {/* Styled components for Color Blocking */}
                <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                        p: ({node, ...props}) => <p className="mb-4 text-slate-600 leading-relaxed" {...props} />,
                        strong: ({node, ...props}) => <strong className="text-indigo-900 font-bold" {...props} />,
                        // Block styling for list items
                        li: ({node, ...props}) => (
                            <li className="bg-slate-50 border-l-4 border-indigo-400 p-3 my-2 rounded-r-md text-sm text-slate-700" {...props} />
                        ),
                        ul: ({node, ...props}) => <ul className="list-none pl-0" {...props} />,
                    }}
                >
                    {brief}
                </ReactMarkdown>
              </div>
            )
        )}
      </div>

      {/* 2. Detailed Guide Section */}
      <div className="flex flex-col items-center justify-center p-8 bg-white border border-slate-200 rounded-2xl shadow-sm transition-all duration-300">
        {!guide ? (
           <div className="w-full max-w-md text-center">
             <div className="mb-4 flex justify-center text-indigo-600">
                <BookOpen size={48} strokeWidth={1.5} />
             </div>
             <h3 className="text-xl font-bold text-slate-900 mb-2">{t.detailedGuide}</h3>
             <p className="text-slate-500 text-sm mb-6">
               Generate a comprehensive whitepaper containing exam structure, scoring mechanics, prep strategies, and consultant course design guidance.
             </p>
             
             {isDomestic && (
                 <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 text-left">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                        <MapPin size={12}/> {t.selectCity}
                    </label>
                    <select 
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="w-full p-2 bg-black border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        {CITIES.map(c => <option key={c} value={c} className="bg-black text-white">{c}</option>)}
                    </select>
                    <p className="text-xs text-slate-400 mt-2">{t.selectCityPrompt}</p>
                 </div>
             )}

             <button
                onClick={handleGenerateGuide}
                disabled={loadingGuide}
                className="w-full px-8 py-3 bg-indigo-900 text-white rounded-xl font-bold hover:bg-indigo-800 transition-colors flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transform duration-200"
             >
                {loadingGuide ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                {t.generateGuide}
             </button>
           </div>
        ) : (
           <div className="w-full">
              <div className="flex justify-between items-center mb-6 no-print border-b border-slate-100 pb-4">
                 <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <BookOpen className="text-indigo-600"/> {t.detailedGuide}
                    </h2>
                    <button 
                        onClick={() => setIsGuideOpen(!isGuideOpen)}
                        className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-indigo-600 transition-colors"
                        title={isGuideOpen ? "Collapse" : "Expand"}
                    >
                        {isGuideOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                 </div>

                 <div className="flex gap-2">
                    <button onClick={handleExportWord} className="p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100" title="Word">
                        <FileText size={18} />
                    </button>
                    <button onClick={handleExportPDF} className="p-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors border border-red-100" title="PDF">
                        <Download size={18} />
                    </button>
                    <button onClick={handleExportImage} className="p-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors border border-green-100" title="Image">
                        <ImageIcon size={18} />
                    </button>
                 </div>
              </div>
              
              {isGuideOpen && (
                  <div ref={contentRef} className="bg-white p-8 md:p-12 border border-slate-200 shadow-xl rounded-2xl animate-fade-in relative overflow-hidden">
                     {/* Watermark for Screen/Image */}
                     <div className="watermark-overlay">
                        <div className="watermark-text">麦迩威教育</div>
                     </div>

                     <div className="hidden print:block mb-8 text-center border-b pb-6 relative z-10">
                        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{exam} Official Guide</h1>
                        {isDomestic && selectedCity && <p className="text-lg text-indigo-800 font-bold">{selectedCity} Region</p>}
                        <p className="text-slate-500 font-medium mt-2">Generated by Marvel Intl. Scholar AI</p>
                     </div>
                     <div className="prose prose-slate max-w-none relative z-10">
                        <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                                // Main Header Block
                                h1: ({node, ...props}) => (
                                    <div className="bg-indigo-900 text-white p-6 rounded-xl shadow-md mb-8">
                                        <h1 className="text-3xl font-bold m-0 border-none text-white" {...props} />
                                    </div>
                                ),
                                // Section Header Block
                                h2: ({node, ...props}) => (
                                    <div className="flex items-center mt-10 mb-6 pb-2 border-b-2 border-indigo-100">
                                        <div className="w-2 h-8 bg-indigo-600 mr-3 rounded-full"></div>
                                        <h2 className="text-2xl font-bold text-slate-800 m-0" {...props} />
                                    </div>
                                ),
                                // Sub-header
                                h3: ({node, ...props}) => <h3 className="text-lg font-bold text-indigo-800 mt-6 mb-3" {...props} />,
                                // Standard Paragraph
                                p: ({node, ...props}) => <p className="text-slate-700 leading-relaxed mb-4" {...props} />,
                                // Highlighted strong text
                                strong: ({node, ...props}) => <strong className="text-indigo-900 font-bold bg-indigo-50 px-1 rounded" {...props} />,
                                // Info/Warning Block for Blockquotes
                                blockquote: ({node, ...props}) => (
                                    <blockquote className="bg-amber-50 border-l-4 border-amber-400 p-4 my-6 rounded-r-lg shadow-sm">
                                        <div className="flex gap-2">
                                            <div className="text-amber-600 font-bold italic" {...props} />
                                        </div>
                                    </blockquote>
                                ),
                                // Zebra Striped Table
                                table: ({node, ...props}) => (
                                    <div className="overflow-hidden my-8 rounded-xl border border-slate-200 shadow-sm">
                                        <table className="min-w-full divide-y divide-slate-200" {...props} />
                                    </div>
                                ),
                                thead: ({node, ...props}) => <thead className="bg-slate-100" {...props} />,
                                tbody: ({node, ...props}) => <tbody className="bg-white divide-y divide-slate-100" {...props} />,
                                tr: ({node, ...props}) => <tr className="hover:bg-indigo-50 transition-colors even:bg-slate-50" {...props} />,
                                th: ({node, ...props}) => <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider" {...props} />,
                                td: ({node, ...props}) => <td className="px-6 py-4 text-sm text-slate-700 leading-relaxed border-t border-slate-100" {...props} />,
                                // List Styling
                                ul: ({node, ...props}) => <ul className="space-y-2 mb-6" {...props} />,
                                li: ({node, ...props}) => (
                                    <li className="flex items-start gap-2 text-slate-700">
                                        <span className="mt-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full flex-shrink-0"></span>
                                        <span {...props}></span>
                                    </li>
                                ),
                            }}
                        >
                            {guide}
                        </ReactMarkdown>
                     </div>
                  </div>
              )}
           </div>
        )}
      </div>

      {/* 3. Chat Section - Clean White Theme, Moved to Bottom */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden flex flex-col h-[600px]">
        <div className="p-4 border-b border-slate-100 bg-white flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-full shadow-md">
            <MessageCircle className="text-white" size={20} />
          </div>
          <div>
             <h2 className="text-slate-900 font-bold text-lg">{t.askAI}</h2>
             <p className="text-slate-500 text-xs">{exam} Expert</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[85%] p-5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-white text-slate-800 rounded-bl-none border border-slate-200'
                }`}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-invert">
                   {msg.text}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex justify-start">
               <div className="bg-white p-4 rounded-2xl rounded-bl-none border border-slate-200 shadow-sm">
                  <Loader2 className="animate-spin text-indigo-500" size={18} />
               </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        <div className="p-4 bg-white border-t border-slate-100">
          <div className="relative">
             <input 
               type="text"
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={handleKeyPress}
               placeholder={t.chatPlaceholder}
               className="w-full bg-slate-100 text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl py-4 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
             />
             <button 
               onClick={handleSendMessage}
               disabled={!input.trim() || chatLoading}
               className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-indigo-500 hover:text-white hover:bg-indigo-600 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
             >
               <Send size={20} />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamInfo;
