// รวมทุกอย่างของ Steam ไว้ที่เดียว ใช้ import จาก "@/lib/steam" ได้เลย
// schemas.ts    → รูปแบบข้อมูลเกม (zod) และ type
// api.ts        → ดึงข้อมูลจาก Steam Store (ฝั่ง server)
// storage.ts    → ตะกร้า / คลังเกม ที่เก็บใน localStorage (ฝั่ง browser)
// categories.ts → หมวดหมู่เกมในหน้าแรก
export * from "./schemas";
export * from "./api";
export * from "./storage";
export * from "./categories";
