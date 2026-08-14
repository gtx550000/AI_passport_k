import React from 'react';
import { Plus, MessageSquare, Trash2, Settings } from 'lucide-react';

interface ChatSession {
  id: string;
  title: string;
  messages: any[];
}

interface SidebarProps {
  chatHistory: ChatSession[];
  currentChatId: string;
  isGenerating: boolean;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string, e: React.MouseEvent) => void;
  onOpenSettings: () => void;
}

export default function Sidebar({
  chatHistory,
  currentChatId,
  isGenerating,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onOpenSettings
}: SidebarProps) {
  return (
    <aside className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full transition-colors z-20 hidden md:flex">
      
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <button 
          onClick={onNewChat}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl px-4 py-3 font-medium transition-colors shadow-sm disabled:opacity-50"
        >
          <Plus size={18} />
          แชทใหม่
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-hide">
        {chatHistory.map(chat => (
          <div 
            key={chat.id}
            onClick={() => { if (!isGenerating) onSelectChat(chat.id); }}
            className={`group flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-colors ${
              chat.id === currentChatId 
                ? 'bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <MessageSquare size={16} className={chat.id === currentChatId ? "text-blue-500" : "text-gray-400"} />
              <span className="truncate text-sm">{chat.title}</span>
            </div>
            {chatHistory.length > 1 && (
              <button 
                onClick={(e) => onDeleteChat(chat.id, e)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1"
                title="ลบแชท"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button 
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Settings size={18} />
          ตั้งค่าระบบ AI
        </button>
      </div>

    </aside>
  );
}