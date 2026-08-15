import React from 'react';
import { Paperclip, Send, FileText, X, Square } from 'lucide-react'; // 1. นำเข้า Square icon

interface ChatInputProps {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  isGenerating: boolean;
  attachedFile: { name: string; text: string } | null;
  setAttachedFile: React.Dispatch<React.SetStateAction<{ name: string; text: string } | null>>;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSend: (e?: React.FormEvent) => void;
  onStop: () => void; // 2. เพิ่ม Prop สำหรับฟังก์ชันหยุด AI
}

export default function ChatInput({
  input,
  setInput,
  isGenerating,
  attachedFile,
  setAttachedFile,
  textareaRef,
  fileInputRef,
  onInputChange,
  onKeyDown,
  onFileUpload,
  onSend,
  onStop // 3. รับ Prop onStop เข้ามาใช้งาน
}: ChatInputProps) {
  return (
    <div className="p-4 pb-12 bg-white dark:bg-gray-900 transition-colors">
      <form onSubmit={onSend} className="max-w-4xl mx-auto w-full px-4">
        <div className="relative flex flex-col bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-2xl shadow-sm focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 overflow-hidden transition-all">
          
          {/* แถบแสดงไฟล์ที่แนบไว้ (Lucide Icons) */}
          {attachedFile && (
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 border-b border-gray-200 dark:border-gray-700 text-sm">
              <FileText size={16} />
              <span className="truncate flex-1">แนบไฟล์: {attachedFile.name}</span>
              <button 
                type="button" 
                onClick={() => setAttachedFile(null)} 
                className="hover:text-red-500 font-medium flex items-center gap-1 transition-colors"
              >
                <X size={16} /> ลบ
              </button>
            </div>
          )}

          <textarea
            ref={textareaRef}
            rows={1}
            className="w-full bg-transparent border-none focus:ring-0 focus:outline-none resize-none pl-14 pr-24 py-4 overflow-y-auto scrollbar-hide text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            style={{ minHeight: '56px', maxHeight: '200px' }}
            placeholder="คุยกับ AI PassPort ของคุณ..."
            value={input}
            onChange={onInputChange}
            onKeyDown={onKeyDown}
            disabled={isGenerating}
          />

          <input 
            type="file" 
            accept="application/pdf"
            ref={fileInputRef}
            className="hidden"
            onChange={onFileUpload}
          />

          {/* ปุ่มเพิ่มไฟล์ (Lucide Icons) */}
          <div className="absolute bottom-2 left-2 flex items-center">
            <button
              type="button"
              title="แนบไฟล์"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              <Paperclip size={20} />
            </button>
          </div>

          {/* 4. สลับแสดงปุ่มส่ง และ ปุ่มหยุด ตามสถานะ isGenerating */}
          <div className="absolute bottom-2 right-2 flex items-center">
            {isGenerating ? (
              <button
                type="button"
                onClick={onStop}
                className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-4 py-2 font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span>หยุด</span>
                <Square size={14} className="fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() && !attachedFile}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 font-medium disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span>ส่ง</span>
                <Send size={16} />
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}