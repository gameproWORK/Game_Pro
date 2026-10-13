// ใช้ auth ของ NextAuth เป็น middleware เพื่อตรวจการล็อกอินก่อนเข้าหน้าที่กำหนด
export { auth as middleware } from "@/auth";

// เส้นทางที่ middleware จะทำงาน (หน้าแก้ไข/ลบเกม)
export const config = {
  matcher: ["/games/:id/edit", "/games/:id/delete"],
};
