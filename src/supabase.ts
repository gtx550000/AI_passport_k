import { createClient } from '@supabase/supabase-js';

// Vite จะรู้เองว่าต้องไปดึงค่า 2 ตัวนี้มาจากไฟล์ .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);