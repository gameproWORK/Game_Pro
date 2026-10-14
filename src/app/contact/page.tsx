import { Mail, Users } from "lucide-react";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/layout/SiteHeader";

const CONTACT_EMAIL = "gameproza1245@gmail.com";

// รายชื่อผู้จัดทำ แสดงในหน้าติดต่อ
const TEAM_MEMBERS = [
  { name: "ธนากร บุญสูง", studentId: "6804101344" },
  { name: "วชิรวิชญ์ ทนันไชย", studentId: "6804101374" },
  { name: "จิณณพัต จิตมโนวรรณ์", studentId: "6804101310" },
  { name: "ธีรภัทร ปิ่นแก้ว", studentId: "6804101348" },
  { name: "นพรัตน์ เลี่ยมวิลัย", studentId: "6804101352" },
];

// หน้าติดต่อ: เข้าได้ทุกคนโดยไม่ต้องล็อกอิน
export default async function ContactPage() {
  const session = await auth();
  const isLoggedIn = Boolean(session?.user);

  return (
    <main className="app-shell">
      <SiteHeader active="contact" tagline="ติดต่อทีมงาน" isLoggedIn={isLoggedIn} userName={session?.user?.name} />

      <div className="page-container">
        <div className="page-heading">
          <p className="page-eyebrow">ติดต่อเรา</p>
          <h1 className="page-title">ติดต่อทีม Game Pro</h1>
          <p className="page-description">มีคำถาม ข้อเสนอแนะ หรือพบปัญหาในการใช้งาน ส่งอีเมลหาเราได้เลย</p>
        </div>

        <div className="contact-layout">
          {/* การ์ดอีเมล กดแล้วเปิดโปรแกรมอีเมลของผู้ใช้ */}
          <section className="contact-card">
            <span className="contact-icon">
              <Mail aria-hidden="true" className="icon icon-large" />
            </span>
            <h2 className="contact-card-title">อีเมล</h2>
            <p className="contact-card-text">ทีมงานจะตอบกลับโดยเร็วที่สุด</p>
            <a href={`mailto:${CONTACT_EMAIL}`} className="contact-email">
              {CONTACT_EMAIL}
            </a>
          </section>

          {/* รายชื่อผู้จัดทำ */}
          <section className="contact-card">
            <span className="contact-icon">
              <Users aria-hidden="true" className="icon icon-large" />
            </span>
            <h2 className="contact-card-title">ผู้จัดทำ</h2>
            <ul className="contact-team">
              {TEAM_MEMBERS.map((member) => (
                <li key={member.studentId} className="contact-team-member">
                  <span>{member.name}</span>
                  <span className="contact-team-id">{member.studentId}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
