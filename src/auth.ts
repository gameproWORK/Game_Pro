import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// ตั้งค่า NextAuth ให้ล็อกอินด้วยบัญชี Google
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [Google],
  callbacks: {
    // ตัดสินว่าเข้าหน้านี้ได้ไหม: หน้าแก้ไข/ลบเกมต้องล็อกอินก่อน หน้าอื่นเข้าได้ทุกคน
    authorized({ auth, request }) {
      const pathname = request.nextUrl.pathname;
      const isProtectedPage = /^\/games\/[^/]+\/(edit|delete)$/.test(pathname);
      
      if (isProtectedPage) {
        return Boolean(auth?.user);
      }
      return true;
    },
  },
});
