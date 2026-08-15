import { useState, useEffect } from 'react';

// ประกาศ Type เพื่อให้รับส่งข้อมูลกับ App.tsx ได้ถูกต้อง
export type Message = {
  role: 'user' | 'assistant';
  content: string;
  fileName?: string;
  fileText?: string; 
};

export function useAiProfiler(userId: string, aiMode: 'standard' | 'pro') {
  const storageKeys = {
    userProfile: `localAiProfile_${userId}`,
    messageCounter: `localAiMsgCounter_${userId}`
  };

  // State เก็บแฟ้มประวัติ และตัวนับข้อความ
  const [userProfile, setUserProfile] = useState<string>(() => {
    return localStorage.getItem(storageKeys.userProfile) || '{"skills": [], "interests": [], "style": "ตอบกระชับ ตรงประเด็น"}';
  });

  const [messageCounter, setMessageCounter] = useState<number>(() => {
    return parseInt(localStorage.getItem(storageKeys.messageCounter) || '0', 10);
  });

  // บันทึกลง Storage ทันทีที่มีการเปลี่ยนแปลง
  useEffect(() => localStorage.setItem(storageKeys.userProfile, userProfile), [userProfile, storageKeys.userProfile]);
  useEffect(() => localStorage.setItem(storageKeys.messageCounter, messageCounter.toString()), [messageCounter, storageKeys.messageCounter]);

  // ฟังก์ชันหลัก: สกัดข้อมูลจากแชท
  const extractUserHabits = async (recentContext: Message[]) => {
    const conversationLog = recentContext.map(m => `${m.role === 'user' ? 'ผู้ใช้' : 'AI'}: ${m.content}`).join('\n');

    const extractionPrompt = `
คุณคือเครื่องจักรวิเคราะห์ข้อมูลผู้ใช้ ไม่มีตัวตน ไม่มีอารมณ์ 
จงอ่าน "ประวัติการสนทนา" และ "ข้อมูลผู้ใช้เดิม" เพื่ออัปเดตข้อมูลผู้ใช้ให้เป็นปัจจุบัน
สกัดข้อมูล เช่น ภาษาโปรแกรมมิ่งที่ใช้, ความสนใจ, นิสัย, หรือเครื่องมือที่ใช้
ข้อบังคับ: 
1. ตอบกลับมาเป็น JSON FORMAT เท่านั้น ห้ามมีคำอธิบายอื่นเจือปน
2. โครงสร้าง JSON ต้องมี keys: "skills", "interests", "style"

ข้อมูลผู้ใช้เดิม:
${userProfile}
    `;

    try {
      const aiBaseUrl = import.meta.env.VITE_AI_URL || '/api/ai';
      const response = await fetch(`${aiBaseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({
          model: aiMode === 'pro' ? 'google/gemma-4-e2b' : 'qwen/qwen3-vl-4b',
          messages: [
            { role: 'system', content: extractionPrompt },
            { role: 'user', content: `ประวัติการสนทนาล่าสุด:\n${conversationLog}\n\nจงตอบเป็น JSON เท่านั้น` }
          ],
          temperature: 0.1,
          stream: false // ไม่ต้อง Stream รอรับข้อมูลทีเดียว
        }),
      });

      const data = await response.json();
      let rawContent = data.choices[0].message.content;
      rawContent = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();

      JSON.parse(rawContent); // เช็คว่าพังไหม
      setUserProfile(rawContent);
      console.log('🎉 AI เรียนรู้นิสัยสำเร็จ อัปเดต Profile แล้ว:', rawContent);
    } catch (error) {
      console.error('การสกัดข้อมูลล้มเหลว (อาจไม่ใช่ JSON):', error);
    }
  };

  // ตัวสั่งการ (Trigger) ให้ภายนอกเรียกใช้เมื่อ AI พิมพ์เสร็จ
  const triggerLearning = (currentMessages: Message[], aiResponseText: string) => {
    const newCount = messageCounter + 1;
    setMessageCounter(newCount);
    
    // ทุกๆ 5 ข้อความ แอบส่งไปเรียนรู้
    if (newCount % 5 === 0) {
      console.log('เริ่มสกัดข้อมูลนิสัยผู้ใช้เบื้องหลัง...');
      const completeContext = [...currentMessages, { role: 'assistant' as const, content: aiResponseText }];
      const contextToAnalyze = completeContext.slice(-10);
      extractUserHabits(contextToAnalyze);
    }
  };

  // โยนตัวแปรเหล่านี้กลับไปให้ App.tsx ใช้งาน
  return { userProfile, messageCounter, triggerLearning };
}