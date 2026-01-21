import React, { useState, useRef, useEffect } from 'react';
import { MessageRole, ChatMessage, ProductType } from '../types';
import { sendMessageToGemini } from '../services/gemini';
import { uploadFile, logUserAction } from '../../../services/storageService';
import { useAuth } from '../../../contexts/AuthContext';
import { ANALYSIS_PROMPT_TEMPLATE } from '../constants';
import { Send, Image as ImageIcon, Loader2, Link as LinkIcon, Trash2, Mic, Square, Wand2, FileAudio, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Custom Markdown Components for specific styling
const MarkdownComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  // Headers: distinct sections with spacing and icons implied by the text
  h3: ({ node, ...props }) => (
    <h3 
      className="text-lg font-bold text-navy-800 mt-6 mb-3 flex items-center gap-2 border-b pb-2 border-navy-100" 
      {...props} 
    />
  ),
  // Blockquote: Used for "Scripts" / "Recommended Replies" - High visibility box
  blockquote: ({ node, ...props }) => (
    <div className="relative group my-4">
       <blockquote className="bg-navy-50 border-l-4 border-navy-600 rounded-r-lg p-4 shadow-sm text-navy-800 italic leading-relaxed" {...props} />
    </div>
  ),
  // Lists: Cleaner spacing
  ul: ({ node, ...props }) => (
    <ul className="list-disc list-outside ml-5 space-y-2 text-navy-700 mb-4" {...props} />
  ),
  li: ({ node, ...props }) => (
    <li className="pl-1 leading-relaxed" {...props} />
  ),
  // Strong: Highlight key terms
  strong: ({ node, ...props }) => (
    <span className="font-bold text-navy-800 bg-navy-100/60 px-1 rounded-sm" {...props} />
  ),
  // Paragraphs
  p: ({ node, ...props }) => (
    <p className="mb-3 leading-relaxed text-navy-700" {...props} />
  ),
  // TABLES: Styling for data comparison
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-4 rounded-lg border border-navy-200 shadow-sm">
      <table className="min-w-full divide-y divide-navy-200" {...props} />
    </div>
  ),
  thead: ({ node, ...props }) => (
    <thead className="bg-navy-600 text-white" {...props} />
  ),
  tbody: ({ node, ...props }) => (
    <tbody className="bg-white divide-y divide-navy-200" {...props} />
  ),
  tr: ({ node, ...props }) => (
    <tr className="hover:bg-navy-50 transition-colors" {...props} />
  ),
  th: ({ node, ...props }) => (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white border-r border-navy-500 last:border-r-0" {...props} />
  ),
  td: ({ node, ...props }) => (
    <td className="px-4 py-3 text-sm text-navy-700 whitespace-pre-wrap border-r border-navy-100 last:border-r-0" {...props} />
  ),
};

export const ChatInterface: React.FC = () => {
  const { user } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<ProductType>(ProductType.ADULT);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: MessageRole.MODEL,
      text: `### 👋 欢迎使用 ME 销售百宝箱\n\n我是您的智能成交顾问。请选择上方 **${selectedProduct}** 类型，然后：\n\n- 📸 **上传截图**：分析客户心理\n- 🎙️ **对话录音**：上传文件或实时录音(支持120分钟)\n- 💬 **文字提问**：获取实时话术\n\n您可以点击 **"一键分析"** 获取专业诊断。`
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0); // seconds
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const MAX_RECORDING_TIME = 7200; // 120 minutes in seconds

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- Handlers ---

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRecordedAudio(reader.result as string);
        setRecordingDuration(0); // Reset timer for uploaded files
      };
      reader.readAsDataURL(file);
    }
    if (audioInputRef.current) audioInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      setRecordedAudio(null); // Clear previous audio
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event: any) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); // webm is standard for browser recording
        const reader = new FileReader();
        reader.onloadend = () => {
          setRecordedAudio(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
        if (timerRef.current) clearInterval(timerRef.current);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start Timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= MAX_RECORDING_TIME - 1) {
            stopRecording(); // Auto stop at 120 mins
            return MAX_RECORDING_TIME;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("无法访问麦克风，请检查权限。");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSend = async (overridePrompt?: string) => {
    const promptText = overridePrompt || input;
    
    if ((!promptText.trim() && selectedImages.length === 0 && !recordedAudio) || isLoading) return;

    // 如果有录音，先上传到 Supabase Storage
    let audioUrl = recordedAudio || undefined;
    
    if (recordedAudio && user) {
      try {
        // 将 Base64 转换为 Blob
        const audioBlob = await fetch(recordedAudio).then(r => r.blob());
        const fileName = `recording-${Date.now()}.webm`;
        
        const uploadResult = await uploadFile({
          userId: user.id,
          fileType: 'audio',
          fileName: fileName,
          fileData: audioBlob,
        });

        if (uploadResult.success && uploadResult.fileUrl) {
          audioUrl = uploadResult.fileUrl;
          // 记录上传日志
          await logUserAction(user.id, 'upload_audio', {
            fileName: fileName,
            fileSize: uploadResult.fileSize,
            fileUrl: uploadResult.fileUrl,
          });
        }
      } catch (error) {
        console.error('上传录音失败:', error);
        // 上传失败不影响发送，继续使用本地 Base64
      }
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      text: promptText,
      images: selectedImages.length > 0 ? [...selectedImages] : undefined,
      audio: audioUrl,
      productContext: selectedProduct
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSelectedImages([]);
    setRecordedAudio(null);
    setRecordingDuration(0);
    setIsLoading(true);

    // 记录聊天消息日志
    if (user) {
      try {
        await logUserAction(user.id, 'chat_message', {
          product: selectedProduct,
          hasAudio: !!audioUrl,
          hasImages: selectedImages.length > 0,
          messageLength: promptText.length,
        });
      } catch (error) {
        console.error('记录聊天日志失败:', error);
      }
    }

    try {
      const finalPrompt = `[产品上下文: ${selectedProduct}] ${promptText}`;
      
      const response = await sendMessageToGemini({
        message: finalPrompt,
        images: userMsg.images,
        audio: userMsg.audio
      });
      
      const text = response.text || "Sorry, I couldn't generate a response.";
      
      const groundingUrls = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.filter((c: any) => c.web?.uri)
        .map((c: any) => ({ uri: c.web.uri, title: c.web.title }));

      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.MODEL,
        text: text,
        groundingUrls: groundingUrls,
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: MessageRole.MODEL,
        text: '抱歉，连接服务器时出现错误或文件过大，请稍后重试。',
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOneClickAnalysis = () => {
    // Pass empty string for customDirection to usage default prompt behavior
    // Using default classType and classSize
    handleSend(ANALYSIS_PROMPT_TEMPLATE(selectedProduct, "", "Regular Class", "1-on-1"));
  };

  return (
    <div className="flex flex-col h-full bg-navy-50/50 rounded-2xl shadow-sm border border-navy-200 overflow-hidden">
      {/* Product Selector Header */}
      <div className="bg-white border-b border-navy-200 p-3 flex gap-2 overflow-x-auto scrollbar-hide shadow-sm z-10">
        {Object.values(ProductType).map((type) => (
          <button
            key={type}
            onClick={() => setSelectedProduct(type)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 ${
              selectedProduct === type
                ? 'bg-navy-600 text-white shadow-md transform scale-105'
                : 'bg-navy-50 text-navy-600 border border-navy-200 hover:bg-navy-100 hover:text-navy-900'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-navy-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[90%] md:max-w-[85%] rounded-2xl p-5 shadow-sm transition-all duration-300 ${
                msg.role === MessageRole.USER
                  ? 'bg-navy-600 text-white rounded-br-none shadow-navy-200'
                  : 'bg-white text-navy-800 border border-navy-200 rounded-bl-none shadow-sm'
              } ${msg.isError ? 'bg-gold-50 text-gold-700 border-gold-200' : ''}`}
            >
              {/* Display Images */}
              {msg.images && msg.images.length > 0 && (
                <div className={`grid gap-2 mb-3 ${msg.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {msg.images.map((img, idx) => (
                    <img 
                      key={idx}
                      src={img} 
                      alt={`Uploaded ${idx}`} 
                      className="rounded-lg w-full object-cover border border-white/20 shadow-sm" 
                    />
                  ))}
                </div>
              )}

              {/* Display Audio */}
              {msg.audio && (
                <div className="mb-3">
                  <audio controls src={msg.audio} className="w-full max-w-[240px] h-8" />
                </div>
              )}

              {/* Markdown Content */}
              <div className={`text-sm ${msg.role === MessageRole.USER ? 'text-white' : 'text-navy-800'}`}>
                {/* Only use complex markdown rendering for Model to avoid styling issues with User text */}
                {msg.role === MessageRole.MODEL ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                    {msg.text}
                  </ReactMarkdown>
                ) : (
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                )}
              </div>
              
              {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                <div className="mt-4 pt-3 border-t border-navy-100/50">
                  <p className="text-xs font-semibold mb-2 flex items-center gap-1 opacity-70">
                    <LinkIcon size={12} /> 参考来源:
                  </p>
                  <ul className="space-y-1.5">
                    {msg.groundingUrls.map((url, idx) => (
                      <li key={idx}>
                        <a 
                          href={url.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs hover:underline truncate block opacity-90 hover:opacity-100"
                        >
                          {url.title || url.uri}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-navy-200 rounded-2xl rounded-bl-none p-5 shadow-sm">
              <div className="flex items-center gap-3 text-navy-600">
                <Loader2 className="w-5 h-5 animate-spin text-navy-600" />
                <span className="text-sm font-medium">ME 智能顾问正在分析数据...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-navy-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
        
        {/* Previews */}
        {(selectedImages.length > 0 || recordedAudio) && (
          <div className="flex flex-wrap gap-2 mb-3 p-3 bg-navy-50 rounded-xl border border-navy-100 shadow-inner">
            {selectedImages.map((img, idx) => (
              <div key={idx} className="relative group">
                <img src={img} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-navy-200" />
                <button 
                  onClick={() => removeImage(idx)}
                  className="absolute -top-2 -right-2 bg-white text-gold-600 border border-navy-200 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-gold-50"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            
            {/* Audio Indicator */}
            {recordedAudio && !isRecording && (
              <div className="flex items-center gap-2 bg-navy-50 px-3 py-1 rounded-lg border border-navy-100 relative group">
                <Mic size={16} className="text-navy-600" />
                <div className="flex flex-col">
                   <span className="text-xs text-navy-800 font-bold">音频就绪</span>
                   {recordingDuration > 0 && <span className="text-[10px] text-navy-600 font-mono">{formatTime(recordingDuration)}</span>}
                </div>
                <audio src={recordedAudio} className="hidden" />
                <button 
                  onClick={() => {
                    setRecordedAudio(null);
                    setRecordingDuration(0);
                  }}
                  className="ml-2 text-navy-400 hover:text-gold-600 p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
            
            {/* One Click Analysis Button */}
            <button
              onClick={handleOneClickAnalysis}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-navy-600 to-navy-500 text-white text-xs font-bold rounded-lg hover:from-navy-700 hover:to-navy-600 shadow-md transform hover:-translate-y-0.5 transition-all duration-300"
            >
              <Wand2 size={14} /> 一键智能分析
            </button>
          </div>
        )}

        {/* Recording Active Status */}
        {isRecording && (
           <div className="mb-3 px-4 py-3 bg-gold-50 border border-gold-100 rounded-xl flex items-center justify-between animate-pulse">
             <div className="flex items-center gap-3">
               <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-gold-500"></span>
                </span>
               <span className="text-sm font-bold text-gold-800 font-mono">{formatTime(recordingDuration)} / 120:00</span>
             </div>
             <button onClick={stopRecording} className="text-xs bg-white text-gold-700 border border-gold-200 px-3 py-1.5 rounded-lg shadow-sm font-medium hover:bg-gold-50 transition-colors duration-300">
               结束录音
             </button>
           </div>
        )}

        <div className="flex items-end gap-2">
          {/* Image Upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-navy-500 hover:text-navy-600 hover:bg-navy-50 rounded-xl transition-all duration-300 active:scale-95"
            title="上传聊天截图"
            disabled={isRecording}
          >
            <ImageIcon size={22} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
          />
          
          {/* Audio File Upload */}
          <button
            onClick={() => audioInputRef.current?.click()}
            className="p-3 text-navy-500 hover:text-navy-600 hover:bg-navy-50 rounded-xl transition-all duration-300 active:scale-95"
            title="上传录音文件"
            disabled={isRecording}
          >
            <FileAudio size={22} />
          </button>
          <input
            type="file"
            ref={audioInputRef}
            className="hidden"
            accept="audio/*"
            onChange={handleAudioUpload}
          />

          {/* Audio Recorder */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-3 rounded-xl transition-all duration-300 active:scale-95 ${
              isRecording 
                ? 'bg-gold-500 text-white animate-pulse shadow-lg shadow-gold-200'
                : 'text-navy-400 bg-navy-50 hover:bg-navy-100 hover:text-navy-600'
            }`}
            title={isRecording ? "停止录音" : "开始录音"}
          >
            {isRecording ? <Square size={22} fill="currentColor" /> : <Mic size={22} />}
          </button>

          {/* Text Input */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={isRecording ? "正在录音..." : "输入您的问题，或上传图片/录音..."}
            className="flex-1 resize-none bg-white border border-navy-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent max-h-32 text-sm text-navy-900 placeholder:text-navy-400 disabled:bg-navy-50 shadow-sm"
            rows={1}
            disabled={isRecording || isLoading}
          />

          {/* Send Button */}
          <button
            onClick={() => handleSend()}
            disabled={(!input.trim() && selectedImages.length === 0 && !recordedAudio) || isLoading || isRecording}
            className="p-3 bg-navy-600 text-white rounded-xl hover:bg-navy-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md active:scale-95"
          >
            {isLoading ? <Loader2 size={22} className="animate-spin" /> : <Send size={22} />}
          </button>
        </div>
      </div>
    </div>
  );
};
