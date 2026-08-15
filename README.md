# 🚀 Web AI Local - Workspace

โปรเจกต์เว็บแอปพลิเคชัน AI Chat ส่วนตัว ที่ให้คุณเชื่อมต่อกับ AI Model ที่รันอยู่บนเครื่องของคุณเอง (Local AI) มาพร้อมฟีเจอร์ครบครัน ตั้งแต่ระบบสมาชิก, การจัดการไฟล์, ไปจนถึงการปรับแต่งพฤติกรรม AI



---

## ✨ ฟีเจอร์เด่น (Features)

*   **🔐 ระบบสมาชิก (Authentication):**
    *   ใช้ **Supabase** ในการจัดการการเข้าสู่ระบบ, สมัครสมาชิก, และ Session
    *   หน้า Login/Register ที่สวยงามและรองรับ Dark Mode

*   **💬 หน้าแชท (Chat Interface):**
    *   UI/UX ที่ทันสมัย สร้างด้วย **Tailwind CSS**
    *   **Streaming Response:** แสดงคำตอบของ AI แบบ Real-time ทันทีที่ได้รับ
    *   **Stop Generation:** ปุ่มสำหรับหยุดการสร้างคำตอบของ AI กลางคัน
    *   **Regenerate:** ปุ่มสำหรับสั่งให้ AI ตอบคำถามล่าสุดใหม่อีกครั้ง
    *   **Chat History:** แถบ Sidebar แสดงประวัติการสนทนาทั้งหมด สามารถสร้าง, เลือก, และลบแชทได้

*   **🤖 ฟังก์ชัน AI อัจฉริยะ:**
    *   **File Upload:** แนบไฟล์ PDF เพื่อให้ AI อ่านและใช้ข้อมูลในการตอบคำถามได้
    *   **AI Profiling:** ระบบเบื้องหลังที่เรียนรู้และจดจำข้อมูลเกี่ยวกับผู้ใช้จากบทสนทนา เพื่อนำไปปรับใช้ในการตอบครั้งถัดไป
    *   **Custom System Prompt:** กำหนดบทบาท, บุคลิก, หรือคำสั่งพื้นฐานให้กับ AI ได้
    *   **Adjustable Memory:** ปรับ "ความจำระยะสั้น" (Rolling Window) เพื่อควบคุมปริมาณข้อมูลที่ AI จะจดจำได้

*   **⚙️ การตั้งค่า (Settings):**
    *   หน้าต่างตั้งค่าที่ครอบคลุมการใช้งาน
    *   สลับโหมดสว่าง/มืด (Light/Dark Mode)
    *   จัดการบัญชีและออกจากระบบ

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

*   **Frontend:** [React](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
*   **Build Tool:** [Vite](https://vitejs.dev/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **Authentication:** [Supabase](https://supabase.io/)
*   **PDF Processing:** [PDF.js](https://mozilla.github.io/pdf.js/)

## 🏁 เริ่มต้นใช้งาน (Getting Started)

ทำตามขั้นตอนต่อไปนี้เพื่อรันโปรเจกต์บนเครื่องของคุณ

### 1. ข้อกำหนดเบื้องต้น (Prerequisites)

*   [Node.js](https://nodejs.org/) (v18 หรือสูงกว่า)
*   โปรแกรมสำหรับรัน AI Model บนเครื่องของคุณ เช่น [LM Studio](https://lmstudio.ai/), [Ollama](https://ollama.com/), หรืออื่นๆ ที่สามารถสร้าง OpenAI-compatible API endpoint ได้
*   บัญชี [Supabase](https://supabase.io/) สำหรับสร้างโปรเจกต์ใหม่

### 2. การติดตั้ง (Installation)

1.  **Clone a repository:**
    ```bash
    git clone https://github.com/your-username/web_ai_local.git
    cd web_ai_local
    ```

2.  **ติดตั้ง Dependencies:**
    ```bash
    npm install
    ```

### 3. ตั้งค่า Environment Variables

1.  สร้างไฟล์ `.env` ขึ้นมาใน root directory ของโปรเจกต์

2.  คัดลอกเนื้อหาจาก `.env.example` (ถ้ามี) หรือเพิ่มค่าตัวแปรต่อไปนี้ลงในไฟล์ `.env`:

    ```env
    # URL ของโปรเจกต์ Supabase ของคุณ
    # ไปที่ Project Settings > API > Project URL
    VITE_SUPABASE_URL="YOUR_SUPABASE_URL"

    # Anon Key ของโปรเจกต์ Supabase ของคุณ
    # ไปที่ Project Settings > API > Project API Keys > anon (public)
    VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"

    # URL ของ Local AI Server ที่คุณรันไว้
    # ตัวอย่างสำหรับ LM Studio: http://localhost:6767
    VITE_AI_URL="http://localhost:6767"
    ```

### 4. รันโปรเจกต์

1.  ตรวจสอบให้แน่ใจว่า Local AI Server ของคุณกำลังทำงานอยู่

2.  รันแอปพลิเคชันด้วยคำสั่ง:
    ```bash
    npm run dev
    ```

3.  เปิดเบราว์เซอร์และเข้าไปที่ `http://localhost:5173` (หรือ URL ที่แสดงใน Terminal)

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```
src/
├── components/      # (แนะนำ) คอมโพเนนต์ย่อยที่ใช้ซ้ำ
├── hooks/           # Custom Hooks (เช่น useAiProfiler)
├── App.tsx          # คอมโพเนนต์หลัก จัดการ State และ Logic ส่วนใหญ่
├── ChatInput.tsx    # คอมโพเนนต์สำหรับช่องพิมพ์และปุ่มส่ง
├── Login.tsx        # คอมโพเนนต์หน้า Login/Register
├── Sidebar.tsx      # คอมโพเนนต์ Sidebar แสดงประวัติแชท
├── supabase.ts      # ตั้งค่า Supabase client
└── main.tsx         # จุดเริ่มต้นของแอปพลิเคชัน
```