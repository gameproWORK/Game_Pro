export { auth as middleware } from "@/auth";

export const config = {
  matcher: ["/games/:id/edit", "/games/:id/delete"],
};
