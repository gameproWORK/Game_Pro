const ADMIN_EMAIL = "gameproza1245@gmail.com";

// ตรวจว่าอีเมลนี้เป็นแอดมินหรือไม่ (ไม่สนตัวพิมพ์เล็ก/ใหญ่และช่องว่างหัวท้าย)
export function isAdminEmail(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === ADMIN_EMAIL;
}
