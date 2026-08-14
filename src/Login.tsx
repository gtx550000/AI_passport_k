import React, { useState } from 'react';
import { supabase } from './supabase';

export default function Login() {
  // สร้าง State สำหรับแยกโหมด เข้าสู่ระบบ vs สมัครสมาชิก
  const [isLogin, setIsLogin] = useState(true); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('สมัครสมาชิกสำเร็จ! กรุณาล็อกอินเพื่อเข้าใช้งาน');
        setIsLogin(true); // สมัครเสร็จ เด้งกลับมาหน้าล็อกอินอัตโนมัติ
        setPassword('');
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[100dvh] items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        
        {/* ส่วนหัวข้อ */}
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          {isLogin ? 'เข้าสู่ระบบ' : 'สร้างบัญชีใหม่'}
        </h2>
        <p className="text-center text-gray-500 mb-6 text-sm">
          {isLogin ? 'ยินดีต้อนรับกลับสู่ Local AI Workspace' : 'สมัครสมาชิกเพื่อเริ่มใช้งาน AI บนเครื่องของคุณ'}
        </p>

        {/* กล่องแจ้งเตือน Error */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center border border-red-100">
            {errorMsg}
          </div>
        )}

        {/* ฟอร์มกรอกข้อมูล */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 mt-2"
          >
            {loading ? 'กำลังดำเนินการ...' : (isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก')}
          </button>
        </form>

        {/* ปุ่มสลับโหมด */}
        <div className="mt-6 text-center text-sm text-gray-600">
          {isLogin ? 'ยังไม่มีบัญชีใช่ไหม? ' : 'มีบัญชีอยู่แล้วใช่ไหม? '}
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }}
            className="text-blue-600 font-semibold hover:underline"
          >
            {isLogin ? 'สมัครสมาชิกฟรี' : 'เข้าสู่ระบบเลย'}
          </button>
        </div>

      </div>
    </div>
  );
}