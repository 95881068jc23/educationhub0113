
import React, { useState, useRef, useEffect } from 'react';
import { MessageRole, ChatMessage, ProductType, TeachingModule } from '../types';
import { sendMessageToGemini } from '../services/gemini';
import { Send, Loader2, Bot, User, Layers, Trash2, Lightbulb, HelpCircle, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CHAT_PROMPT_TEMPLATE } from '../constants';
import { ToneSelector } from './ToneSelector';
import { Content } from '@google/genai';

const cleanText = (text: string) => text.replace(/\*\*/g, '');

// Enhanced Markdown Components for the Chat
const MarkdownComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  h3: ({ node, ...props }) => (
    <h3 className="text-lg font-bold text-slate-800 mt-2 mb-3 flex items-center gap-2" {...props} />
  ),
  p: ({ node, ...props }) => (
    <p className="mb-3 text-sm leading-relaxed text-slate-700" {...props} />
  ),
  ul: ({ node, ...props }) => (
    <ul className="list-disc ml-4 space-y-2 text-slate-700 mb-2 mt-2" {...props} />
  ),
  li: ({ node, ...props }) => (
    <li className="pl-1 text-sm" {...props} />
  ),
  // Use Blockquote for the "Color Block" effect requested
  blockquote: ({ node, ...props }) => (
    <div className="bg-teal-50 border-l-4 border-teal-500 p-4 my-4 rounded-r-xl shadow-sm text-slate-700">
       <div className="flex items-center gap-2 mb-2 text-teal-800 font-bold text-xs uppercase tracking-wider">
          <Lightbulb size={14}/> Try Asking (你可以这样问)
       </div>
       <div className="italic text-sm space-y-1">
         {props.children}
       </div>
    </div>
  ),
  strong: ({ node, ...props }) => (
    <span className="font-bold text-teal-700" {...props} />
  ),
};

interface GeneralChatProps {
  globalTones: string[];
  setGlobalTones: (tones: string[]) => void;
}

export const GeneralChat: React.FC<GeneralChatProps> = ({ globalTones, setGlobalTones }) => {
  const [selectedProduct, setSelectedProduct] = useState<ProductType>(ProductType.ADULT);
  const [selectedModule, setSelectedModule] = useState<TeachingModule>(TeachingModule.GUIDE);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const getWelcomeMessage = (module: TeachingModule) => {
    switch (module) {
      case TeachingModule.GUIDE:
        return `### 👋 教学指导 (Teaching Guide)
我是您的教学方法论导师。我可以帮您优化教学流程、解释核心教学法概念，或提供课堂管理建议。
I am your methodology mentor. I can help optimize lesson flows, explain teaching concepts, or give classroom management tips.

> 1. "How do I teach the Present Perfect tense to adults using TBLT?" (如何用任务型教学法教成人现在完成时？)
> 2. "What are some effective CCQs for checking understanding of 'used to'?" (检查 'used to' 理解的概念检查问题有哪些？)
> 3. "My students are very passive. How can I increase STT?" (学生很被动，如何增加学生开口时间？)
> 4. "Explain the difference between Inductive and Deductive grammar teaching." (解释归纳法和演绎法教学的区别。)
> 5. "How do I handle a mixed-level class effectively?" (如何有效管理水平参差不齐的班级？)`;

      case TeachingModule.COMMUNICATION:
        return `### 👋 学员沟通 (Student Communication)
我能帮您解答学员关于**学习方法、瓶颈期突破**等学术困惑，提供专业的学习建议话术。
I can help answer students' academic questions about learning methods and plateaus, providing professional advice scripts.

> 1. "Student asks: 'I memorize words but forget them the next day. What should I do?'" (学生问：单词背了就忘怎么办？)
> 2. "How do I explain to a student why their listening skills aren't improving?" (如何向学生解释听力为什么没长进？)
> 3. "A student feels stuck at the B1 plateau. How do I encourage them?" (学生卡在B1瓶颈期，如何鼓励？)
> 4. "What is the best way to improve spoken fluency without worrying about grammar?" (不纠结语法提高流利度的最好方法是什么？)
> 5. "A student wants to sound more 'native'. What resources should I recommend?" (学生想发音更地道，推荐什么资源？)`;

      case TeachingModule.PREP:
        return `### 👋 备课资源 (Prep Resources)
我可以为您生成创意课堂活动、热身游戏、词汇表，或推荐**免费的教学资源网站**。
I can generate creative activities, warm-up games, vocabulary lists, or recommend free teaching resource websites.

> 1. "List 5 free websites for downloading ESL worksheets and PDF textbooks." (列出5个免费下载ESL练习纸和教材的网站。)
> 2. "Design a 10-minute warm-up game for a Business English class." (为商务英语课设计一个10分钟热身游戏。)
> 3. "Give me a list of C1-level vocabulary related to 'Environmental Protection'." (给我一份关于环保的C1级词汇表。)
> 4. "Where can I find authentic audio materials for IELTS listening practice?" (哪里可以找到雅思听力的地道音频素材？)
> 5. "Create a role-play scenario script for 'Negotiating a Salary'." (为'薪资谈判'创建一个角色扮演脚本。)`;

      default:
        return `👋 Hello Teacher! I am your AI Assistant. Select a module to start.`;
    }
  };

  const [messages, setMessages] = useState<ChatMessage[]>([{
      id: 'welcome',
      role: MessageRole.MODEL,
      text: getWelcomeMessage(TeachingModule.GUIDE)
  }]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update welcome message when module changes
  useEffect(() => {
    setMessages([{
      id: 'welcome',
      role: MessageRole.MODEL,
      text: cleanText(getWelcomeMessage(selectedModule))
    }]);
  }, [selectedModule]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleClearHistory = () => {
    setMessages([{
      id: 'welcome',
      role: MessageRole.MODEL,
      text: cleanText(getWelcomeMessage(selectedModule))
    }]);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      text: input,
      productContext: selectedProduct
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // "General" subcategory as placeholder since we removed specific ones
      const prompt = CHAT_PROMPT_TEMPLATE(selectedProduct, selectedModule, "General", userMsg.text, globalTones);
      
      const history: Content[] = messages
        .filter(m => !m.isError)
        .map(m => ({
          role: m.role === MessageRole.USER ? 'user' : 'model',
          parts: [{ text: m.text }]
        }));

      const response = await sendMessageToGemini({ 
        message: prompt,
        history: history
      });
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: MessageRole.MODEL,
        text: cleanText(response.text || "No response.")
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: MessageRole.MODEL,
        text: 'Error connecting to AI service.',
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Config Header */}
      <div className="bg-white border-b border-slate-200 z-10 shadow-sm flex-shrink-0">
        <div className="flex border-b border-slate-100 overflow-x-auto scrollbar-hide">
          {Object.values(TeachingModule).map((mod) => (
             <button key={mod} onClick={() => setSelectedModule(mod)}
              className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 whitespace-nowrap px-4 transition-colors min-w-fit ${selectedModule === mod ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/50' : 'text-slate-500 hover:text-teal-500 hover:bg-slate-50'}`}>
               <Layers size={16}/> {mod.split('(')[0]}
             </button>
          ))}
        </div>
        <div className="p-3 md:p-4 bg-slate-50 space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
             {Object.values(ProductType).map(t => (
               <button key={t} onClick={() => setSelectedProduct(t)} className={`px-4 py-1.5 text-xs font-bold rounded-full border transition-all whitespace-nowrap ${selectedProduct === t ? 'bg-teal-600 text-white border-teal-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'}`}>{t}</button>
             ))}
          </div>
          {/* Sub-categories removed from UI */}
          <ToneSelector selectedTones={globalTones} onChange={setGlobalTones} compact label="教学风格 (Teaching Style)"/>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-6 bg-slate-50/30">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === MessageRole.USER ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === MessageRole.USER ? 'bg-teal-600' : 'bg-white border border-slate-200 shadow-sm'}`}>
              {msg.role === MessageRole.USER ? <User size={16} className="text-white"/> : <Bot size={16} className="text-teal-600"/>}
            </div>
            <div className={`max-w-[85%] rounded-2xl p-4 md:p-5 text-sm shadow-sm ${msg.role === MessageRole.USER ? 'bg-teal-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 rounded-tl-none text-slate-800'} ${msg.isError ? 'bg-red-50 border-red-200 text-red-600' : ''}`}>
               <ReactMarkdown 
                 remarkPlugins={[remarkGfm]} 
                 components={msg.role === MessageRole.MODEL ? MarkdownComponents : undefined}
               >
                 {msg.text}
               </ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && <Loader2 className="animate-spin text-slate-400 ml-12" size={16}/>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 md:p-4 bg-white border-t flex gap-2 items-center flex-shrink-0">
        <button 
          onClick={handleClearHistory}
          className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          title="Clear History"
        >
          <Trash2 size={20}/>
        </button>
        <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={`Ask about ${selectedModule.split('(')[0]}...`}
          className="flex-1 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none h-12 shadow-inner"
        />
        <button onClick={handleSend} disabled={!input.trim() || isLoading} className="p-3 bg-teal-600 text-white rounded-xl disabled:opacity-50 hover:bg-teal-700 transition-colors shadow-md transform active:scale-95"><Send size={20}/></button>
      </div>
    </div>
  );
};
