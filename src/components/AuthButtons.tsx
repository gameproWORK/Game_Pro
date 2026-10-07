import { signIn, signOut } from "@/auth";
import { Gamepad2 } from "lucide-react";

export function AuthButtons({ isLoggedIn, userName }: { isLoggedIn: boolean; userName?: string | null }) {
  if (isLoggedIn) {
    return (
      <div className="auth-actions">
        <span className="auth-greeting">
          <span className="auth-avatar">
            <Gamepad2 aria-hidden="true" className="icon icon-small" />
          </span>
          <span className="auth-greeting-copy">
            <span className="auth-greeting-label">ยินดีต้อนรับ</span>
            <span className="auth-user-name">{userName || "เกมเมอร์"}</span>
          </span>
        </span>
        <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
          <button type="submit" className="button button-quiet">
            ออกจากระบบ
          </button>
        </form>
      </div>
    );
  }
  return (
    <form action={async () => { "use server"; await signIn("google", { redirectTo: "/" }); }}>
      <button type="submit" className="button button-primary">
        เข้าสู่ระบบด้วย Google
      </button>
    </form>
  );
}
