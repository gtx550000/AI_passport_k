import React, { useState, useRef, useEffect } from 'react';
import Login from './Login';
import { supabase } from './supabase';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
};

export default function App() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const [aiMode, setAiMode] = useState<'standard' | 'pro'>('standard');

  // 1. ดึงข้อมูลจาก LocalStorage ตอนโหลดหน้าเว็บ (แก้ F5 แล้วหาย)
  const [chatHistory, setChatHistory] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('localAiChats');
    return saved ? JSON.parse(saved) : [{ id: Date.now().toString(), title: 'การสนทนาใหม่', messages: [] }];
  });

  const [currentChatId, setCurrentChatId] = useState<string>(() => {
    return localStorage.getItem('localAiCurrentChatId') || chatHistory[0]?.id || Date.now().toString();
  });

  const [input, setInput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 2. ตัวควบคุมการตัด Connection
  const abortControllerRef = useRef<AbortController | null>(null);

  const currentChat = chatHistory.find(c => c.id === currentChatId) || chatHistory[0];

  // 3. บันทึกลง LocalStorage อัตโนมัติเมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    localStorage.setItem('localAiChats', JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    localStorage.setItem('localAiCurrentChatId', currentChatId);
  }, [currentChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChat.messages]);

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

  // 4. ฟังก์ชันหยุดการทำงาน
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(); // ตัดการเชื่อมต่อทันที
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  };

  // 5. ปรับ handleSend ให้รองรับการ "ตอบใหม่ (Regenerate)"
 const handleSend = async (e?: React.FormEvent, isRegenerate = false) => {
    e?.preventDefault();
    if (isGenerating) return;

    let targetInput = input.trim();
    
    // 1. ดึงประวัติแชทของห้องปัจจุบันมาจัดการแบบ Synchronous (ป้องกัน Bug State ค้าง)
    let currentMessages = [...currentChat.messages];

    if (isRegenerate) {
      // ถ้ากดตอบใหม่ ให้ลบคำตอบ AI อันเก่าออก
      if (currentMessages.length > 0 && currentMessages[currentMessages.length - 1].role === 'assistant') {
        currentMessages.pop(); 
      }
      // ดึงคำถาม user ล่าสุดมาเป็นเป้าหมาย
      const lastUserMsg = currentMessages.filter(m => m.role === 'user').pop();
      targetInput = lastUserMsg?.content || '';
    } else {
      if (!targetInput) return;
      // ใส่คำถามใหม่ของผู้ใช้เข้าไปในประวัติ
      currentMessages.push({ role: 'user', content: targetInput }); 
    }

    if (!targetInput) return;

    // 2. ประกอบร่าง Payload ทันที! (ใช้ข้อมูลที่ชัวร์แล้วส่งไป API โดยไม่มีกล่องเปล่าของ Assistant)
    const apiMessages = [
      { role: 'system', content: 'คุณคือ AI ผู้ช่วย ตอบคำถามด้วยข้อมูลที่ถูกต้องและเป็นกลางเสมอ' },
      ...currentMessages.map(m => ({ role: m.role, content: m.content }))
    ];

    // 3. จำลอง UI: เพิ่มกล่อง Assistant เปล่าๆ เข้าไปท้ายสุด เพื่อรอรับตัวหนังสือ
    const uiMessages = [...currentMessages, { role: 'assistant', content: '' }];

    // 4. สั่งอัปเดต UI (คราวนี้ State จะอัปเดตตอนไหนก็ไม่มีผลกับ API แล้ว)
    setChatHistory(prev => prev.map(chat => {
      if (chat.id === currentChatId) {
        const newTitle = chat.messages.length === 0 ? targetInput.slice(0, 30) + '...' : chat.title;
        return { ...chat, title: newTitle, messages: uiMessages };
      }
      return chat;
    }));

    if (!isRegenerate) setInput('');
    setIsGenerating(true);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          model: aiMode === 'pro' ? 'google/gemma-4-e2b' : 'qwen/qwen3-vl-4b',
          messages: apiMessages, // ส่ง Payload ตัวจริงไปที่นี่
          temperature: aiMode === 'pro' ? 0.4 : 0.7,
          stream: true,
        }),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let aiResponseText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.includes('[DONE]')) return;
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '');
            try {
              const parsed = JSON.parse(dataStr);
              const content = parsed.choices[0]?.delta?.content || '';
              aiResponseText += content;

              setChatHistory(prev => prev.map(chat => {
                if (chat.id === currentChatId) {
                  const newMessages = [...chat.messages];
                  // แก้ไขการอัปเดต Object ให้ถูกหลัก React
                  newMessages[newMessages.length - 1] = {
                    ...newMessages[newMessages.length - 1],
                    content: aiResponseText
                  };
                  return { ...chat, messages: newMessages };
                }
                return chat;
              }));
            } catch (err) {}
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('User stopped generation'); 
      } else {
        setChatHistory(prev => prev.map(chat => {
          if (chat.id === currentChatId) {
            const newMessages = [...chat.messages];
            newMessages[newMessages.length - 1] = {
              ...newMessages[newMessages.length - 1],
              content: '❌ เกิดข้อผิดพลาดในการเชื่อมต่อ'
            };
            return { ...chat, messages: newMessages };
          }
          return chat;
        }));
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  if (!session) return <Login />;

  return (
    <div className="flex h-screen bg-white font-sans text-gray-800">
      
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-gray-200 flex flex-col hidden md:flex">
        <div className="p-3">
          <button onClick={handleNewChat} disabled={isGenerating} className="w-full flex items-center gap-2 px-3 py-3 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700">
            <span className="text-xl leading-none">+</span><span>New Chat</span>
          </button>
        </div>
        
       <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1 mt-2 scrollbar-hide">
          <p className="text-xs font-semibold text-gray-500 mb-3 px-2">หัวข้อที่ผ่านมา</p>
          {chatHistory.map(chat => (
            <div key={chat.id} onClick={() => !isGenerating && setCurrentChatId(chat.id)} className={`flex items-center justify-between px-3 py-2.5 rounded-md cursor-pointer transition-colors group ${currentChatId === chat.id ? 'bg-gray-700 text-white' : 'hover:bg-gray-800'} ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <div className="flex items-center gap-2 truncate">
                <span className="text-sm">💬</span><span className="text-sm truncate">{chat.title}</span>
              </div>
              <button onClick={(e) => handleDeleteChat(chat.id, e)} className="text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">×</button>
            </div>
          ))}
        </div>
        
        <div className="p-3 mt-auto border-t border-gray-800">
          <button onClick={() => supabase.auth.signOut()} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors">
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        <header className="hidden md:flex bg-white text-gray-800 p-4 border-b border-gray-200 justify-between items-center shadow-sm z-10">
           <div className="font-semibold text-lg">{currentChat.title}</div>
           <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
             <button onClick={() => setAiMode('standard')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${aiMode === 'standard' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
               Standard
             </button>
             <button onClick={() => setAiMode('pro')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${aiMode === 'pro' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
               <span className="text-xs px-1.5 py-0.5 bg-blue-500/20 rounded text-blue-100">AI</span>Pro
             </button>
           </div>
        </header>

        <header className="md:hidden bg-gray-900 text-white p-4 flex justify-between items-center shadow-sm">
           <span className="font-semibold truncate">{currentChat.title}</span>
           <button onClick={handleNewChat} disabled={isGenerating} className="text-xl">+</button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 w-full max-w-4xl mx-auto space-y-6 scrollbar-hide">
          {currentChat.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
              <h2 className="text-2xl font-bold text-gray-300 mb-2">Local AI Workspace</h2>
              <p>ขับเคลื่อนด้วย RTX 3070</p>
            </div>
          ) : (
        currentChat.messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div 
              className={`max-w-[85%] rounded-2xl px-6 py-4 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none whitespace-pre-wrap' // กล่อง User ไม่ต้องแปลง Markdown
                  : 'bg-gray-50 text-gray-800 border border-gray-200 rounded-bl-none' // กล่อง AI
              }`}
            >
             {msg.role === 'user' ? (
                // ฝั่งผู้ใช้ แสดง Text ธรรมดา
                msg.content 
              ) : (
                // ฝั่ง AI เช็คว่าเป็น String ไหม แล้วค่อยครอบด้วย ReactMarkdown (ชั้นเดียว)
                typeof msg.content === 'string' ? (
                  <ReactMarkdown 
                    className="prose prose-sm md:prose-base prose-blue max-w-none prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-a:text-blue-600" 
                    remarkPlugins={[remarkGfm]}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <span className="text-gray-400">กำลังเตรียมข้อความ...</span>
                )
              )}
              
              {/* เอฟเฟกต์ AI กำลังพิมพ์ */}
              {isGenerating && msg.role === 'assistant' && idx === currentChat.messages.length - 1 && (
                <span className="inline-block w-2 h-4 mt-2 ml-1 bg-gray-400 animate-pulse"></span>
              )}
            </div>

            {/* ปุ่ม ตอบใหม่ (Regenerate) */}
            {msg.role === 'assistant' && idx === currentChat.messages.length - 1 && !isGenerating && (
              <button 
                onClick={() => handleSend(undefined, true)} 
                className="text-xs text-gray-400 hover:text-blue-600 mt-2 flex items-center gap-1 transition-colors"
              >
                🔄 ตอบใหม่
              </button>
            )}
          </div>
        ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 pb-12 bg-white">
          <form onSubmit={(e) => handleSend(e, false)} className="max-w-4xl mx-auto relative">
            <input
              type="text"
              className="w-full border border-gray-300 bg-white rounded-xl pl-4 pr-24 py-4 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="ส่งข้อความไปที่ Local AI..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isGenerating}
            />
            
            {/* 7. สลับปุ่ม ส่ง / หยุด ตามสถานะ isGenerating */}
            <div className="absolute right-2 top-2 bottom-2 flex gap-2">
              {isGenerating ? (
                <button
                  type="button"
                  onClick={handleStop}
                  className="bg-red-500 text-white px-4 rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center gap-2 shadow-sm"
                >
                  ■ หยุด
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="bg-blue-600 text-white px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  ส่ง
                </button>
              )}
            </div>
          </form>
        </div>
         <div className="text-center text-xs text-gray-400 mt-2 mb-8">
            ข้อมูลทั้งหมดถูกประมวลผลบนเครื่อง Local ไม่มีการส่งออกไปยังเซิร์ฟเวอร์ภายนอก
         </div>
      </main>
    </div>
  );
}