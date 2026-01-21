
import React, { useState, useRef, useEffect } from 'react';
import { MessageRole, ChatMessage, ProductType, SalesStage } from '../types';
import { sendMessageToGemini } from '../services/gemini';
import { Send, Loader2, Link as LinkIcon, Bot, User, Briefcase, HeartHandshake, RefreshCw, Sparkles, MessageSquarePlus, Tag, ArrowRightCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CHAT_PROMPT_TEMPLATE, TONE_OPTIONS, SALES_SUB_CATEGORIES, SCENARIO_QUESTIONS } from '../constants';
import { ToneSelector } from './ToneSelector';

const MarkdownComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  h3: ({ node, ...props }) => (
    <div className="mt-5 mb-3">
       <h3 className="text-sm font-bold text-navy-900 bg-navy-50 px-3 py-2 rounded-lg border-l-4 border-navy-600 flex items-center gap-2" {...props} />
    </div>
  ),
  blockquote: ({ node, ...props }) => {
    const { ref, ...rest } = props as any;
    return (
      <div className="relative group my-4">
         <div className="bg-navy-50 border-l-4 border-navy-600 rounded-r-lg p-4 shadow-sm">
            <div className="text-navy-900 italic text-sm leading-relaxed" {...rest} />
         </div>
      </div>
    );
  },
  ul: ({ node, ...props }) => (
    <ul className="space-y-2 text-navy-700 mb-4" {...props} />
  ),
  li: ({ node, ...props }) => (
    <li className="flex items-start gap-2 text-sm leading-relaxed" {...props}>
      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gold-500 flex-shrink-0"></span>
      <span>{props.children}</span>
    </li>
  ),
  p: ({ node, ...props }) => (
    <p className="mb-3 text-sm leading-relaxed text-navy-700" {...props} />
  ),
  strong: ({ node, ...props }) => (
    <span className="font-bold text-navy-900 bg-gold-100 px-1 rounded-sm mx-0.5" {...props} />
  ),
};

const getWelcomeMessage = (product: ProductType, stage: SalesStage, subCategory: string): ChatMessage => {
  const suggestions = SCENARIO_QUESTIONS[subCategory] || [];
  
  return {
    id: `welcome-${product}-${stage}-${subCategory}-${Date.now()}`,
    role: MessageRole.MODEL,
    text: `### 👋 ${product} - ${subCategory.split('(')[0]} 专家顾问\n\n我是您的业务军师。针对 **${subCategory}** 场景，我为您准备了以下高频难题。\n\n**点击下方气泡**，即刻获取金牌话术：`,
    suggestedActions: suggestions
  };
};

interface GeneralChatProps {
  globalTones: string[];
  setGlobalTones: (tones: string[]) => void;
}

export const GeneralChat: React.FC<GeneralChatProps> = ({ globalTones, setGlobalTones }) => {
  const [selectedProduct, setSelectedProduct] = useState<ProductType>(ProductType.ADULT);
  const [selectedStage, setSelectedStage] = useState<SalesStage>(SalesStage.PRE_SALES);
  
  // Initialize with the first sub-category of the default stage
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>(SALES_SUB_CATEGORIES[SalesStage.PRE_SALES][0]);
  
  const [input, setInput] = useState('');
  const [lastUserMessage, setLastUserMessage] = useState<string>(''); 
  const [isLoading, setIsLoading] = useState(false);
  
  // Store chat history by key to persist state when switching tabs
  const [histories, setHistories] = useState<Record<string, ChatMessage[]>>({});

  // Dynamic Key based on detailed selection so history is isolated per scenario if desired, 
  // OR keep it by Product-Stage to allow continuity. 
  // User request implies "Scene specific", so resetting chat on scene change is usually cleaner for Q&A.
  // Let's use Product-Stage-SubCategory to ensure fresh prompts.
  const historyKey = `${selectedProduct}-${selectedStage}-${selectedSubCategory}`;
  
  // Initialize if empty
  const currentMessages = histories[historyKey] || [getWelcomeMessage(selectedProduct, selectedStage, selectedSubCategory)];
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, isLoading]);

  // Reset/Initialize history when sub-category changes
  useEffect(() => {
    // If we haven't visited this category yet, initialize it with the custom welcome message
    setHistories(prev => {
      if (!prev[historyKey]) {
        return {
          ...prev,
          [historyKey]: [getWelcomeMessage(selectedProduct, selectedStage, selectedSubCategory)]
        };
      }
      return prev;
    });
  }, [selectedProduct, selectedStage, selectedSubCategory, historyKey]);

  // Handle Stage Change -> Reset SubCategory to first available
  useEffect(() => {
    const subCategories = SALES_SUB_CATEGORIES[selectedStage];
    if (subCategories && subCategories.length > 0) {
      // Check if current subCategory is valid for new stage, if not, pick first
      if (!subCategories.includes(selectedSubCategory)) {
        setSelectedSubCategory(subCategories[0]);
      }
    }
  }, [selectedStage]);

  // Unified Send Handler
  const handleSend = async (text: string = input, overrideTones?: string[]) => {
    if (!text.trim() || isLoading) return;

    // 1. Prepare Request Data
    const tonesToUse = overrideTones || globalTones;
    
    if (overrideTones) {
      setGlobalTones(overrideTones);
    }

    // 2. Add User Message to History
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      text: text,
      productContext: selectedProduct,
      salesStage: selectedStage,
      subCategory: selectedSubCategory
    };

    setHistories(prev => ({
      ...prev,
      [historyKey]: [...(prev[historyKey] || []), userMsg]
    }));
    
    // 3. Clear Input & Set Loading
    setInput('');
    setLastUserMessage(text); 
    setIsLoading(true);

    try {
      // 4. Call API
      const prompt = CHAT_PROMPT_TEMPLATE(selectedProduct, selectedStage, selectedSubCategory, text, tonesToUse);
      
      const response = await sendMessageToGemini({
        message: prompt
      });
      
      const responseText = response.text || "抱歉，暂时无法获取回答。";
      
      const groundingUrls = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.filter((c: any) => c.web?.uri)
        .map((c: any) => ({ uri: c.web.uri, title: c.web.title }));

      // 5. Add Model Response
      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.MODEL,
        text: responseText,
        groundingUrls: groundingUrls,
      };

      setHistories(prev => ({
        ...prev,
        [historyKey]: [...(prev[historyKey] || []), modelMsg]
      }));
    } catch (error) {
      setHistories(prev => ({
        ...prev,
        [historyKey]: [...(prev[historyKey] || []), {
          id: Date.now().toString(),
          role: MessageRole.MODEL,
          text: '连接失败，请稍后重试。',
          isError: true
        }]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = (toneValue: string) => {
    if (!lastUserMessage) return;
    handleSend(lastUserMessage, [toneValue]);
  };

  const isLastMessageModel = currentMessages.length > 0 && currentMessages[currentMessages.length - 1].role === MessageRole.MODEL;

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-navy-200 overflow-hidden">
      {/* Configuration Header */}
      <div className="bg-white border-b border-navy-200 z-10 shadow-sm">
        {/* Stage Tabs */}
        <div className="flex border-b border-navy-100">
          {Object.values(SalesStage).map((stage) => (
            <button
              key={stage}
              onClick={() => setSelectedStage(stage)}
              className={`flex-1 py-3 md:py-4 text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all relative ${
                selectedStage === stage 
                  ? 'text-navy-700' 
                  : 'text-navy-400 hover:text-navy-600 hover:bg-navy-50'
              }`}
            >
               {stage === SalesStage.PRE_SALES ? <Briefcase size={16}/> : <HeartHandshake size={16}/>}
               {stage}
               {selectedStage === stage && (
                 <span className="absolute bottom-0 left-0 w-full h-1 bg-navy-700 rounded-t-full"></span>
               )}
             </button>
          ))}
        </div>

        {/* Product, Scenario & Tone Config */}
        <div className="p-3 md:p-4 bg-navy-50/50 space-y-3">
          
          <div className="flex flex-col md:flex-row gap-3">
            {/* Product Chips */}
            <div className="flex-1 min-w-0">
              <label className="text-[10px] md:text-xs font-bold text-navy-400 uppercase tracking-wider mb-2 block">1. 业务类型</label>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {Object.values(ProductType).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedProduct(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 border whitespace-nowrap ${
                      selectedProduct === type
                        ? 'bg-white text-navy-700 border-navy-200 shadow-sm ring-1 ring-navy-100'
                        : 'bg-navy-50 text-navy-500 border-transparent hover:bg-white hover:border-navy-200 hover:text-navy-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Scenario Chips (Dynamic based on Stage) */}
            <div className="flex-[2] min-w-0">
              <label className="text-[10px] md:text-xs font-bold text-navy-400 uppercase tracking-wider mb-2 block flex items-center gap-1">
                <Tag size={12}/> 2. 具体场景
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {SALES_SUB_CATEGORIES[selectedStage].map((subCat) => (
                  <button
                    key={subCat}
                    onClick={() => setSelectedSubCategory(subCat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 border whitespace-nowrap ${
                      selectedSubCategory === subCat
                        ? 'bg-navy-700 text-white border-navy-700 shadow-md transform scale-105'
                        : 'bg-white text-navy-600 border-navy-200 hover:bg-navy-50 hover:text-navy-700'
                    }`}
                  >
                    {subCat.split('(')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Prominent Tone Selector */}
          <div className="bg-white p-2 md:p-3 rounded-xl border border-navy-100 shadow-sm">
             <ToneSelector 
                selectedTones={globalTones} 
                onChange={setGlobalTones} 
                compact={true} 
                label="3. AI 语气设定"
             />
          </div>
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4 md:space-y-6 bg-navy-50/30">
        {currentMessages.map((msg, index) => (
          <div key={msg.id} className="flex flex-col">
            <div
              className={`flex gap-2 md:gap-3 ${msg.role === MessageRole.USER ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                 msg.role === MessageRole.USER ? 'bg-navy-900' : 'bg-white border border-navy-200'
              }`}>
                {msg.role === MessageRole.USER ? <User size={16} className="text-white" /> : <Bot size={16} className="text-navy-700" />}
              </div>

              <div className="flex flex-col gap-1 max-w-[85%]">
                <div
                  className={`rounded-2xl p-3 md:p-4 shadow-sm text-sm leading-relaxed ${
                    msg.role === MessageRole.USER
                      ? 'bg-navy-900 text-white rounded-tr-none'
                      : 'bg-white text-navy-800 border border-navy-200 rounded-tl-none'
                  } ${msg.isError ? 'bg-navy-50 text-navy-600 border-navy-200' : ''}`}
                >
                  {/* Context Label for User Message */}
                  {msg.role === MessageRole.USER && msg.subCategory && (
                     <div className="mb-2 pb-2 border-b border-white/20 text-[10px] font-bold text-gold-100 uppercase tracking-wide flex items-center gap-1">
                        <Tag size={10}/> {msg.subCategory}
                     </div>
                  )}

                  {msg.role === MessageRole.MODEL ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                      {msg.text}
                    </ReactMarkdown>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  )}
                  
                  {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-navy-100/50">
                      <div className="flex flex-wrap gap-2">
                        {msg.groundingUrls.map((url, idx) => (
                          <a 
                            key={idx}
                            href={url.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] bg-navy-50 hover:bg-navy-100 text-navy-600 hover:text-navy-800 px-2 py-1 rounded-full transition-colors border border-navy-200"
                          >
                            <LinkIcon size={10} /> {url.title || '来源'}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Timestamp or Info */}
                <div className={`text-[10px] text-navy-300 px-1 ${msg.role === MessageRole.USER ? 'text-right' : 'text-left'}`}>
                   {msg.role === MessageRole.MODEL && "ME Intelligent Consultant"}
                </div>
              </div>
            </div>

            {/* SUGGESTED ACTIONS GRID (Only for Model Messages that have them) */}
            {msg.role === MessageRole.MODEL && msg.suggestedActions && msg.suggestedActions.length > 0 && (
              <div className="ml-10 md:ml-11 mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 max-w-[85%] animate-in slide-in-from-top-2 fade-in duration-300">
                {msg.suggestedActions.map((action, idx) => (
                   <button
                     key={idx}
                     onClick={() => handleSend(action)}
                     disabled={isLoading}
                     className="text-left text-xs bg-white hover:bg-navy-50 border border-navy-200 hover:border-navy-300 text-navy-600 hover:text-navy-800 px-3 py-2.5 rounded-lg shadow-sm transition-all flex items-start gap-2 group"
                   >
                      <ArrowRightCircle size={14} className="mt-0.5 text-navy-300 group-hover:text-navy-600 flex-shrink-0" />
                      <span className="leading-snug">{action}</span>
                   </button>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-center gap-2 text-navy-400 text-xs ml-12 animate-pulse">
            <div className="w-2 h-2 bg-navy-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-navy-400 rounded-full animate-bounce delay-75"></div>
            <div className="w-2 h-2 bg-navy-400 rounded-full animate-bounce delay-150"></div>
            <span className="ml-2">正在思考最佳话术...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Regeneration Toolbar (Only shows when last message is AI and not loading) */}
      {!isLoading && isLastMessageModel && lastUserMessage && (
        <div className="px-4 py-2 bg-navy-50 border-t border-navy-100 flex items-center gap-3 overflow-x-auto scrollbar-hide animate-in slide-in-from-bottom-2 flex-shrink-0">
           <div className="flex items-center gap-1.5 text-navy-700 font-bold text-xs whitespace-nowrap">
             <RefreshCw size={12} />
             <span>一键换风格重答:</span>
           </div>
           {TONE_OPTIONS.filter(t => !globalTones.includes(t.value)).slice(0, 4).map(tone => (
             <button
               key={tone.id}
               onClick={() => handleRegenerate(tone.value)}
               className="flex items-center gap-1 px-3 py-1.5 bg-white border border-navy-200 rounded-full text-xs text-navy-600 hover:bg-navy-700 hover:text-white hover:border-navy-700 transition-all whitespace-nowrap shadow-sm"
             >
               {tone.label.split('(')[0]}
             </button>
           ))}
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 md:p-4 bg-white border-t border-navy-200 flex-shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`[${selectedStage} - ${selectedSubCategory.split('(')[0]}] 请输入问题...`}
            className="flex-1 resize-none bg-navy-50 border border-navy-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-navy-500 text-sm text-navy-900 placeholder:text-navy-400"
            rows={1}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-navy-900 text-white rounded-xl hover:bg-navy-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all active:scale-95 flex-shrink-0"
          >
            {input.trim() ? <Send size={18} /> : <MessageSquarePlus size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};
