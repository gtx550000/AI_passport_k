import React, { useState, useRef, useEffect } from 'react';
import Login from './Login';
import Sidebar from './Sidebar';
import ChatInput from './ChatInput';
import { supabase } from './supabase';
import * as pdfjsLib from 'pdfjs-dist';
import { FileText, RefreshCw, X, AlertCircle } from 'lucide-react';
import { useAiProfiler } from './hooks/useAiProfiler'; 

// นำ Type Message กลับมาประกาศไว้ที่นี่โดยตรง เพื่อไม่ให้ Vite สับสน
export type Message = {
  role: 'user' | 'assistant';
  content: string;
  fileName?: string;
  fileText?: string; 
};

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
};

// ---------------------------------------------------------------------------
// 1. App Component (Auth Guard)
// ---------------------------------------------------------------------------
export default function App() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) return <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-gray-500">กำลังโหลดระบบ...</div>;
  if (!session) return <Login />;
  return <Workspace session={session} />;
}

// ---------------------------------------------------------------------------
// 2. Workspace Component
// ---------------------------------------------------------------------------
function Workspace({ session }: { session: any }) {
  const userId = session.user.id;
  
  const storageKeys = {
    chats: `localAiChats_${userId}`,
    currentChatId: `localAiCurrentChatId_${userId}`,
    systemPrompt: `localAiSystemPrompt_${userId}`,
    maxHistory: `localAiMaxHistory_${userId}`
  };

  // --- States ---
  const [systemPrompt, setSystemPrompt] = useState(() => localStorage.getItem(storageKeys.systemPrompt) || 'คุณคือผู้ช่วย AI...');
  const [maxHistory, setMaxHistory] = useState<number>(() => parseInt(localStorage.getItem(storageKeys.maxHistory) || '6', 10));
  const [chatHistory, setChatHistory] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem(storageKeys.chats);
    return saved ? JSON.parse(saved) : [{ id: Date.now().toString(), title: 'การสนทนาใหม่', messages: [] }];
  });
  const [currentChatId, setCurrentChatId] = useState<string>(() => localStorage.getItem(storageKeys.currentChatId) || chatHistory[0]?.id || Date.now().toString());

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [input, setInput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [aiMode, setAiMode] = useState<'standard' | 'pro'>('standard');
  const [attachedFile, setAttachedFile] = useState<{ name: string; text: string } | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null); 
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const currentChat = chatHistory.find(c => c.id === currentChatId) || chatHistory[0];

  const { userProfile, messageCounter, triggerLearning } = useAiProfiler(userId, aiMode);

  // --- Sync Effects ---
  useEffect(() => localStorage.setItem(storageKeys.chats, JSON.stringify(chatHistory)), [chatHistory, storageKeys.chats]);
  useEffect(() => localStorage.setItem(storageKeys.currentChatId, currentChatId), [currentChatId, storageKeys.currentChatId]);
  useEffect(() => localStorage.setItem(storageKeys.systemPrompt, systemPrompt), [systemPrompt, storageKeys.systemPrompt]);
  useEffect(() => localStorage.setItem(storageKeys.maxHistory, maxHistory.toString()), [maxHistory, storageKeys.maxHistory]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [currentChat.messages]);
  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // --- Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); 
      if ((input.trim() || attachedFile) && !isGenerating) {
        handleSend(undefined, false);
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
      }
    }
  };
  
  const handleNewChat = () => {
    if (isGenerating) return;
    const newChat: ChatSession = { id: Date.now().toString(), title: 'การสนทนาใหม่', messages: [] };
    setChatHistory(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
  };

  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGenerating) return;
    setChatHistory(prev => {
      const filtered = prev.filter(chat => chat.id !== id);
      if (filtered.length === 0) {
        const newChat = { id: Date.now().toString(), title: 'การสนทนาใหม่', messages: [] };
        setCurrentChatId(newChat.id);
        return [newChat];
      }
      if (id === currentChatId) setCurrentChatId(filtered[0].id);
      return filtered;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') return alert('รองรับเฉพาะไฟล์ PDF เท่านั้นครับ');
    try {
      setIsGenerating(true); 
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
      }
      setAttachedFile({ name: file.name, text: fullText });
    } catch {
      alert('เกิดข้อผิดพลาดในการอ่านไฟล์ PDF');
    } finally {
      setIsGenerating(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; 
    }
  };

  const handleSend = async (e?: React.FormEvent, isRegenerate = false) => {
    e?.preventDefault();
    if (isGenerating) return;

    let targetInput = input.trim();
    let currentMessages = [...currentChat.messages];

    if (isRegenerate) {
      if (currentMessages.length > 0 && currentMessages[currentMessages.length - 1].role === 'assistant') currentMessages.pop(); 
      const lastUserMsg = currentMessages.filter(m => m.role === 'user').pop();
      targetInput = lastUserMsg?.content || '';
    } else {
      if (!targetInput && !attachedFile) return;
      if (attachedFile) {
        currentMessages.push({ role: 'user' as const, content: targetInput || 'สรุปเนื้อหาในไฟล์นี้ให้หน่อย', fileName: attachedFile.name, fileText: attachedFile.text }); 
        setAttachedFile(null); 
      } else {
        currentMessages.push({ role: 'user' as const, content: targetInput }); 
      }
    }

    if (!targetInput && !isRegenerate && currentMessages[currentMessages.length-1].content === '') return;

    const recentMessages = currentMessages.slice(-maxHistory);
    const injectedSystemPrompt = `${systemPrompt}\n\n[ข้อมูลสำคัญเกี่ยวกับผู้ใช้ที่คุณต้องจำไว้ (JSON)]:\n${userProfile}`; 

    const apiMessages = [
      { role: 'system', content: injectedSystemPrompt }, 
      ...recentMessages.map(m => {
        if (m.fileName && m.fileText) return { role: m.role, content: `เอกสารอ้างอิง: ${m.fileName}\n\nเนื้อหาเอกสาร:\n\`\`\`\n${m.fileText}\n\`\`\`\n\nคำถาม: ${m.content}` };
        return { role: m.role, content: m.content };
      })
    ];

    const uiMessages: Message[] = [...currentMessages, { role: 'assistant' as const, content: '' }];

    setChatHistory(prev => prev.map(chat => {
      if (chat.id === currentChatId) return { ...chat, title: chat.messages.length === 0 ? targetInput.slice(0, 30) + '...' : chat.title, messages: uiMessages };
      return chat;
    }));

    if (!isRegenerate) setInput('');
    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    let aiResponseText = '';

    try {
      const aiBaseUrl = import.meta.env.VITE_AI_URL || '/api/ai';
      const response = await fetch(`${aiBaseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          model: aiMode === 'pro' ? 'google/gemma-4-e2b' : 'typhoon2.1-gemma3-4b',
          messages: apiMessages,
          temperature: aiMode === 'pro' ? 0.4 : 0.7,
          stream: true,
        }),
      });
      
      if (!response.body) throw new Error('No response body');
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.includes('[DONE]')) {
            triggerLearning(currentMessages, aiResponseText);
            return;
          }

          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.replace('data: ', ''));
              aiResponseText += parsed.choices[0]?.delta?.content || '';
              setChatHistory(prev => prev.map(chat => chat.id === currentChatId ? { ...chat, messages: chat.messages.map((m, i) => i === chat.messages.length - 1 ? { ...m, content: aiResponseText } : m) } : chat));
            } catch (err) {}
          }
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setChatHistory(prev => prev.map(chat => chat.id === currentChatId ? { ...chat, messages: chat.messages.map((m, i) => i === chat.messages.length - 1 ? { ...m, content: '❌ เกิดข้อผิดพลาด' } : m) } : chat));
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // --- Render ---
  return (
    <div className="flex h-[100dvh] bg-white dark:bg-gray-900 font-sans text-gray-800 dark:text-gray-100 transition-colors duration-200">
      <Sidebar chatHistory={chatHistory} currentChatId={currentChatId} isGenerating={isGenerating} onNewChat={handleNewChat} onSelectChat={setCurrentChatId} onDeleteChat={handleDeleteChat} onOpenSettings={() => setIsSettingsOpen(true)} />

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-gray-900 transition-colors">
        <header className="hidden md:flex bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 p-4 border-b border-gray-200 dark:border-gray-800 justify-between items-center shadow-sm z-10 transition-colors">
           <div className="font-semibold text-lg">{currentChat.title}</div>
           <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors">
             <button onClick={() => setAiMode('standard')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${aiMode === 'standard' ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Standard</button>
             <button onClick={() => setAiMode('pro')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${aiMode === 'pro' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}><span className="text-xs px-1.5 py-0.5 bg-blue-500/20 rounded text-blue-100 dark:text-blue-300">AI</span>Pro</button>
           </div>
        </header>

        <header className="md:hidden bg-gray-900 text-white p-4 flex justify-between items-center shadow-sm">
           <span className="font-semibold truncate">{currentChat.title}</span>
           <button onClick={handleNewChat} disabled={isGenerating} className="text-xl">+</button>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8 w-full max-w-4xl mx-auto space-y-6 scrollbar-hide">
          {currentChat.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 dark:text-gray-500">
              <h2 className="text-2xl font-bold text-gray-300 dark:text-gray-600 mb-2">Local AI Workspace</h2>
              <p>ขับเคลื่อนด้วย RTX 3070</p>
            </div>
          ) : (
            currentChat.messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-6 py-4 shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none whitespace-pre-wrap' : 'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-none transition-colors'}`}>
                 {msg.role === 'user' ? (
                    <div className="flex flex-col gap-2 items-end text-right">
                      {msg.fileName && (
                        <div className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-xl text-sm border border-white/10 shadow-sm w-fit max-w-full">
                          <FileText size={18} className="text-blue-100 shrink-0" />
                          <span className="font-medium text-blue-50 truncate">{msg.fileName}</span>
                        </div>
                      )}
                      <span>{msg.content}</span>
                    </div>
                  ) : (
                    typeof msg.content === 'string' ? (
                      /* 🚀 นำ ReactMarkdown ออก แล้วใช้ div ที่มี whitespace-pre-wrap แทน */
                      <div className="whitespace-pre-wrap break-words">
                        {msg.content}
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">กำลังเตรียมข้อความ...</span>
                    )
                  )}
                  {isGenerating && msg.role === 'assistant' && idx === currentChat.messages.length - 1 && <span className="inline-block w-2 h-4 mt-2 ml-1 bg-gray-400 dark:bg-gray-500 animate-pulse"></span>}
                </div>
                {msg.role === 'assistant' && idx === currentChat.messages.length - 1 && !isGenerating && (
                  <button onClick={() => handleSend(undefined, true)} className="text-xs text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mt-2 flex items-center gap-1.5 transition-colors"><RefreshCw size={14} /> <span>ตอบใหม่</span></button>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <ChatInput input={input} setInput={setInput} isGenerating={isGenerating} attachedFile={attachedFile} setAttachedFile={setAttachedFile} textareaRef={textareaRef} fileInputRef={fileInputRef} onInputChange={handleInputChange} onKeyDown={handleKeyDown} onFileUpload={handleFileUpload} onSend={(e) => handleSend(e, false)} />
        
        <div className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2 mb-8">
           ข้อมูลถูกประมวลผลบน Local | รอบการเรียนรู้: {messageCounter % 5}/5
        </div>
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col border border-gray-100 dark:border-gray-800 transition-colors">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
              <h3 className="font-bold text-gray-800 dark:text-gray-100">การตั้งค่าบัญชีและ AI</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"><X size={20} /></button>
            </div>
            
            <div className="p-6 space-y-8 overflow-y-auto max-h-[70vh]">
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">{session?.user?.email ? session.user.email.charAt(0).toUpperCase() : 'U'}</div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200">{session?.user?.email || 'ไม่พบข้อมูลบัญชี'}</p>
                      <p className="text-xs text-gray-500">สถานะ: <span className="text-green-500 font-medium">ออนไลน์</span></p>
                    </div>
                  </div>
                  <button onClick={() => setShowLogoutConfirm(true)} className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 rounded-lg text-sm font-medium transition-colors">ออกจากระบบ</button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">โหมดกลางคืน (Dark Mode)</span>
                  <button onClick={() => setIsDarkMode(!isDarkMode)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} /></button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">ระบบ AI และความจำ</h4>
                <textarea className="w-full h-20 p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm transition-colors" value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} placeholder="บทบาทของ AI..." />
                
                <div className="pt-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-500">ประวัติที่ส่งประมวลผล (Rolling Window)</span>
                    <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-md">{maxHistory} ข้อความ</span>
                  </div>
                  <input type="range" min="2" max="20" step="2" value={maxHistory} onChange={(e) => setMaxHistory(parseInt(e.target.value, 10))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600" />
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400">สิ่งที่ AI เรียนรู้เกี่ยวกับคุณ</h4>
                <p className="text-xs text-gray-500">แฟ้มประวัติส่วนตัวที่จะอัปเดตอัตโนมัติทุกๆ 5 ข้อความ</p>
                <pre className="text-[10px] sm:text-xs bg-gray-900 text-green-400 p-3 rounded-xl overflow-x-auto shadow-inner border border-gray-800">
                  {(() => {
                    try { return JSON.stringify(JSON.parse(userProfile), null, 2); } 
                    catch { return userProfile; }
                  })()}
                </pre>
              </div>

            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
              <button onClick={() => setIsSettingsOpen(false)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm">ปิด</button>
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 transition-all">
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col transform scale-100">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2"><AlertCircle size={32} /></div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">ยืนยันการออกจากระบบ</h3>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 flex gap-3 justify-center border-t border-gray-100 dark:border-gray-800">
              <button onClick={() => setShowLogoutConfirm(false)} className="px-6 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-1">ยกเลิก</button>
              <button onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }} className="px-6 py-2.5 rounded-xl font-medium bg-red-600 hover:bg-red-700 text-white transition-colors flex-1 shadow-sm">ออกจากระบบ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}