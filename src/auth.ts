import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [Google],
  callbacks: {
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
