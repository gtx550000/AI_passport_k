import React, { useState } from 'react';
import { supabase } from './supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<
    'login' | 'register' | 'google' | null
  >(null);

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>(
    'error'
  );

  // ==========================================
  // Validation Helpers
  // ==========================================
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateInput = () => {
    if (!email || !password) {
      setMessage('กรุณากรอก Email และ Password');
      setMessageType('error');
      return false;
    }

    if (!validateEmail(email)) {
      setMessage('รูปแบบ Email ไม่ถูกต้อง');
      setMessageType('error');
      return false;
    }

    if (password.length < 6) {
      setMessage('Password ต้องมีอย่างน้อย 6 ตัวอักษร');
      setMessageType('error');
      return false;
    }

    return true;
  };

  // ==========================================
  // Email Login
  // ==========================================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateInput()) return;

    setLoading(true);
    setLoadingType('login');
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        setMessageType('error');
        return;
      }

      setMessage('เข้าสู่ระบบสำเร็จ');
      setMessageType('success');

      // Redirect หลัง Login สำเร็จ
      window.location.href = '/';
    } catch (error) {
      console.error('Login error:', error);
      setMessage('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      setMessageType('error');
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  // ==========================================
  // Register
  // ==========================================
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateInput()) return;

    setLoading(true);
    setLoadingType('register');
    setMessage('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        setMessageType('error');
        return;
      }

      // ถ้า Supabase เปิด Confirm Email
      if (data.user && !data.session) {
        setMessage('สมัครสมาชิกสำเร็จ กรุณาตรวจสอบ Email เพื่อยืนยันบัญชี');
        setMessageType('success');
      } else {
        setMessage('สมัครสมาชิกสำเร็จ');
        setMessageType('success');
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Register error:', error);
      setMessage('เกิดข้อผิดพลาดในการสมัครสมาชิก');
      setMessageType('error');
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  // ==========================================
  // Google Login
  // ==========================================
  const handleGoogleLogin = async () => {
    setLoading(true);
    setLoadingType('google');
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        setMessage(error.message);
        setMessageType('error');
        setLoading(false);
        setLoadingType(null);
      }
    } catch (error) {
      console.error('Google Login error:', error);
      setMessage('ไม่สามารถเข้าสู่ระบบด้วย Google ได้');
      setMessageType('error');
      setLoading(false);
      setLoadingType(null);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 font-sans px-4">
      <div className="p-8 bg-white rounded-2xl shadow-lg w-full max-w-sm border border-gray-200">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Local AI</h1>
          <p className="text-sm text-gray-500">เข้าสู่ระบบเพื่อใช้งาน RTX 3070</p>
        </div>

        <form className="space-y-4">
          
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="you@example.com"
              disabled={loading}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="••••••••"
              disabled={loading}
              required
            />
          </div>

          {/* Message */}
          {message && (
            <div
              className={`text-sm text-center p-3 rounded-md ${
                messageType === 'success'
                  ? 'bg-green-50 text-green-600'
                  : 'bg-red-50 text-red-600'
              }`}
            >
              {message}
            </div>
          )}

          {/* Email Buttons */}
          <div className="flex gap-3 pt-2">
            
            {/* Login */}
            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
            >
              {loadingType === 'login' ? 'กำลังเข้าสู่ระบบ...' : 'ล็อกอิน'}
            </button>

            {/* Register */}
            <button
              type="button"
              onClick={handleSignUp}
              disabled={loading}
              className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl font-medium hover:bg-gray-50 disabled:bg-gray-100 transition-colors"
            >
              {loadingType === 'register' ? 'กำลังสมัคร...' : 'สมัครใหม่'}
            </button>
            
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 py-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">หรือ</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Google Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-xl font-medium hover:bg-gray-50 disabled:bg-gray-100 transition-colors flex items-center justify-center gap-3"
          >
            {loadingType === 'google' ? (
              'กำลังเข้าสู่ระบบด้วย Google...'
            ) : (
              <>
                <span className="text-lg font-bold">G</span>
                <span>เข้าสู่ระบบด้วย Google</span>
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}