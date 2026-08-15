import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showPatchNotes, setShowPatchNotes] = useState(false);

  // --- ระบบ Dark Mode ---
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // เช็คค่าตอนโหลดหน้าเว็บ ว่าเคยปรับเป็น Dark ไหม
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };
  // ---------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (isLoginMode) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setMessage('✅ สมัครสมาชิกสำเร็จ! (สามารถกดเข้าสู่ระบบได้เลย)');
        setIsLoginMode(true);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] dark:bg-gray-900 transition-colors duration-300 p-4 font-sans relative">
      
      {/* ปุ่ม Toggle Dark Mode (มุมขวาบน) */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2.5 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
        title="สลับโหมดสว่าง/มืด"
      >
        {isDarkMode ? (
          // ไอคอนพระจันทร์ (สำหรับ Dark Mode)
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
             <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        ) : (
          // ไอคอนพระอาทิตย์ (สำหรับ Light Mode)
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.22 2.32a1 1 0 011.415 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM14.95 15.657a1 1 0 00-1.414 0l-.707.707a1 1 0 001.414 1.414l.707-.707a1 1 0 000-1.414zM10 18a1 1 0 01-1-1v-1a1 1 0 112 0v1a1 1 0 01-1 1zm-4.22-2.343a1 1 0 00-1.415 0l-.707.707a1 1 0 001.414 1.414l.707-.707a1 1 0 000-1.414zM2 10a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1zm2.343-4.243a1 1 0 001.414 0l.707-.707a1 1 0 00-1.414-1.414l-.707.707a1 1 0 000 1.414zM10 5a5 5 0 100 10 5 5 0 000-10z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {/* Login Card */}
      <div className="max-w-[420px] w-full bg-white dark:bg-gray-800 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700 p-8 sm:p-10 transition-colors duration-300 relative">
        
        <div className="text-center mb-8">
          <h2 className="text-[26px] font-bold text-gray-900 dark:text-white mb-2">
            {isLoginMode ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
          </h2>
          <p className="text-[15px] text-gray-500 dark:text-gray-400">
            ยินดีต้อนรับกลับสู่ Local AI Workspace
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm text-center">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 rounded-lg text-sm text-center">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[14px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              อีเมล
            </label>
            <input
              type="email"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-[14px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              รหัสผ่าน
            </label>
            <input
              type="password"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2563eb] hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'กำลังประมวลผล...' : (isLoginMode ? 'เข้าสู่ระบบ' : 'สร้างบัญชีใหม่')}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-[14px]">
          <span className="text-gray-600 dark:text-gray-400">
            {isLoginMode ? 'ยังไม่มีบัญชีใช่ไหม? ' : 'มีบัญชีอยู่แล้ว? '}
          </span>
          <button
            type="button"
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setError('');
              setMessage('');
            }}
            className="text-[#2563eb] hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
          >
            {isLoginMode ? 'สมัครสมาชิกฟรี' : 'เข้าสู่ระบบ'}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
          <button
            type="button"
            onClick={() => setShowPatchNotes(true)}
            className="text-[13px] font-medium text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors flex items-center justify-center w-full gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
            Patch Notes (อัปเดตล่าสุด)
          </button>
        </div>
      </div>

      {showPatchNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                🚀 Patch Notes
              </h3>
              <button 
                onClick={() => setShowPatchNotes(false)}
                className="text-gray-400 hover:text-red-500 transition-colors text-xl font-bold leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 text-xs font-bold rounded">v1.2.1</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">อัปเดตล่าสุด</span>
                </div>
                <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1 ml-1">
                  <li>เพิ่มปุ่มสลับ Dark Mode แบบ Manual มุมขวาบน</li>
                  <li>ปรับโฉมหน้า Login ใหม่ สไตล์ Clean & Minimal</li>
                  <li>เพิ่มระบบสลับโหมดฟอร์ม (Login/Register) ในหน้าเดียว</li>
                </ul>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-right">
              <button 
                onClick={() => setShowPatchNotes(false)}
                className="px-4 py-2 bg-[#2563eb] hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                รับทราบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}