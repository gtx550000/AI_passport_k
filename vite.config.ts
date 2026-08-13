import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // ดักจับทุก Request ที่ขึ้นต้นด้วย /api/ai
      '/api/ai': {
        target: 'http://localhost:1234', // ปลายทางจริงๆ ของ Local AI
        changeOrigin: true,
        // ตัดคำว่า /api/ai ทิ้งก่อนส่งไปหา Local AI (เพื่อให้เหลือแค่ /v1/chat/completions)
        rewrite: (path) => path.replace(/^\/api\/ai/, '') 
      }
    }
  }
})