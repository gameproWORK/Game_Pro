# 🎮 Game Pro

เว็บแอปค้นหาเกมจาก Steam และจัดการรายการเกมที่สนใจ ผู้ใช้ค้นหาเกม ดูรายละเอียด เพิ่มเกมลง **ตะกร้า** แล้วย้ายเข้า **คลังเกมส่วนตัว** พร้อมบันทึกชั่วโมงที่เล่นได้ เข้าสู่ระบบด้วยบัญชี Google

## 📑 สารบัญ

- [ผู้จัดทำ](#-ผู้จัดทำ)
- [ฟีเจอร์หลัก](#-ฟีเจอร์หลัก)
- [เทคโนโลยีที่ใช้](#️-เทคโนโลยีที่ใช้)
- [การติดตั้งและรันโปรเจกต์](#-การติดตั้งและรันโปรเจกต์)
- [โครงสร้างโปรเจกต์](#️-โครงสร้างโปรเจกต์)
- [API](#-api)
- [การตั้งค่าแอดมิน](#-การตั้งค่าแอดมิน)
- [ข้อจำกัด](#️-ข้อจำกัด)

---

## 🚀 ผู้จัดทำ

| ลำดับ | ชื่อ - นามสกุล | รหัสนักศึกษา |
| :---: | --- | :---: |
| 1 | ธนากร บุญสูง | 6804101344 |
| 2 | วชิรวิชญ์ ทนันไชย | 6804101374 |
| 3 | จิณณพัต จิตมโนวรรณ์ | 6804101310 |
| 4 | ธีรภัทร ปิ่นแก้ว | 6804101348 |
| 5 | นพรัตน์ เลี่ยมวิลัย | 6804101352 |

---

## ✨ ฟีเจอร์หลัก

| ฟีเจอร์ | รายละเอียด |
| --- | --- |
| 🔐 เข้าสู่ระบบ | ล็อกอินด้วยบัญชี Google ผ่าน Auth.js (NextAuth v5 beta) |
| 🗂️ หมวดหมู่เกม | เลือกดูเกมตามหมวด **แนะนำ · ขายดี · ลดราคา · มาใหม่ · เร็ว ๆ นี้** พร้อมชื่อเกม ภาพปก และราคา |
| 🔍 ค้นหาเกม | ค้นหาเกมจาก Steam ด้วยชื่อเกม มีปุ่มลัดคำค้น "กำลังฮิต" |
| 📄 รายละเอียดเกม | หน้ารายละเอียดของแต่ละเกม ดึงข้อมูลตาม App ID |
| 🛒 ตะกร้าเกม | เพิ่มเกมลงตะกร้า และนำเกมออกจากตะกร้า |
| 📚 คลังเกมส่วนตัว | ยืนยันการซื้อเพื่อย้ายเกมเข้าคลัง บันทึก/แก้ไขชั่วโมงที่เล่น และลบเกมออกจากคลัง |
| 💾 แยกข้อมูลตามผู้ใช้ | เก็บตะกร้าและคลังเกมใน `localStorage` โดยใช้คีย์แยกตามบัญชี |
| ✉️ หน้าติดต่อ | อีเมลติดต่อทีมงาน (gameproza1245@gmail.com) และรายชื่อผู้จัดทำ เข้าได้โดยไม่ต้องล็อกอิน |
| 👑 แอดมิน | บัญชีแอดมินเพิ่มเกมเข้าคลังเองได้ (กรอกชื่อ รูป และข้อมูลเกม) |
| ✅ ตรวจสอบข้อมูล | ใช้ Zod ตรวจรูปแบบข้อมูลที่ได้จาก Steam และข้อมูลที่ผู้ใช้กรอก |

---

## 🛠️ เทคโนโลยีที่ใช้

| เทคโนโลยี | หน้าที่ |
| --- | --- |
| Next.js 14 (App Router) | เฟรมเวิร์กหลักสำหรับหน้าเว็บและ API Routes |
| React 18 + TypeScript | สร้างส่วนติดต่อผู้ใช้และกำหนดชนิดข้อมูล |
| Auth.js / NextAuth v5 beta | เข้าสู่ระบบด้วย Google OAuth และจัดการเซสชัน |
| Steam Store API | ดึงเกมแนะนำ ค้นหาเกม และรายละเอียดเกม |
| Zod | กำหนด Schema และตรวจสอบความถูกต้องของข้อมูล |
| lucide-react | ไอคอนในหน้าเว็บ |
| localStorage | เก็บข้อมูลตะกร้าและคลังเกมไว้ในเบราว์เซอร์ |

---

## 💻 การติดตั้งและรันโปรเจกต์

### สิ่งที่ต้องมี

- [Node.js](https://nodejs.org/) เวอร์ชัน 18.17 ขึ้นไป (มี `npm` มาให้แล้ว)
- บัญชี Google สำหรับสร้าง OAuth Client ใน [Google Cloud Console](https://console.cloud.google.com/)

### ขั้นตอน

**1. ดาวน์โหลดโปรเจกต์** แตกไฟล์ ZIP หรือ Clone จาก GitHub แล้วเปิดโฟลเดอร์ `Game_Pro-master`

**2. ติดตั้งแพ็กเกจ**

```bash
npm install
```

**3. ตั้งค่า Environment Variables** สร้างไฟล์ `.env.local` ที่โฟลเดอร์หลักของโปรเจกต์

```env
AUTH_SECRET=<ค่าสุ่มลับสำหรับ Auth.js>
AUTH_GOOGLE_ID=<Google OAuth Client ID>
AUTH_GOOGLE_SECRET=<Google OAuth Client Secret>
```

| ตัวแปร | ได้มาจากไหน |
| --- | --- |
| `AUTH_SECRET` | รันคำสั่ง `npx auth secret` ระบบจะสร้างค่าให้ |
| `AUTH_GOOGLE_ID` | Google Cloud Console → APIs & Services → Credentials → สร้าง OAuth client ID |
| `AUTH_GOOGLE_SECRET` | ได้มาพร้อมกับ Client ID ในขั้นตอนเดียวกัน |

ตอนสร้าง OAuth Client ให้เพิ่ม **Authorized redirect URI** เป็น

```text
http://localhost:3000/api/auth/callback/google
```

> ⚠️ ห้าม commit ไฟล์ `.env.local` ขึ้น GitHub (ไฟล์นี้อยู่ใน `.gitignore` แล้ว)

**4. รันโหมดพัฒนา**

```bash
npm run dev
```

เปิดเว็บที่ <http://localhost:3000>

### คำสั่งที่ใช้ได้

| คำสั่ง | หน้าที่ |
| --- | --- |
| `npm run dev` | รันโหมดพัฒนา แก้โค้ดแล้วหน้าเว็บอัปเดตทันที |
| `npm run build` | build สำหรับใช้งานจริง และตรวจ TypeScript |
| `npm run start` | รันเว็บที่ build แล้ว (ต้อง `npm run build` ก่อน) |

---

## 🗂️ โครงสร้างโปรเจกต์

```text
src/
├── app/
│   ├── page.tsx                         # หน้าแรก (ร้านค้า)
│   ├── layout.tsx                       # Layout หลัก
│   ├── globals.css                      # สไตล์ทั้งหมดของเว็บ
│   ├── cart/page.tsx                    # หน้าตะกร้าเกม
│   ├── collection/page.tsx              # หน้าคลังเกมส่วนตัว
│   ├── contact/page.tsx                 # หน้าติดต่อทีมงาน
│   ├── games/[id]/page.tsx              # หน้ารายละเอียดเกม
│   └── api/
│       ├── auth/[...nextauth]/route.ts  # Route ของ Auth.js
│       └── steam/
│           ├── featured/route.ts        # เกมตามหมวดหมู่
│           ├── search/route.ts          # ค้นหาเกม
│           └── games/[id]/route.ts      # รายละเอียดเกม
├── components/                          # แบ่งโฟลเดอร์ตามหน้าที่ใช้งาน
│   ├── layout/
│   │   ├── SiteHeader.tsx               # แถบเมนูด้านบน (ใช้ทุกหน้า)
│   │   └── AuthButtons.tsx              # ปุ่มเข้าสู่ระบบ / ออกจากระบบ
│   ├── store/                           # หน้าแรก
│   │   ├── SteamGameSearch.tsx          # ส่วนหัว ช่องค้นหา และรายการเกม
│   │   ├── CategoryTabs.tsx             # แถบเลือกหมวดหมู่
│   │   └── GameCard.tsx                 # การ์ดเกม 1 ใบ
│   ├── game/
│   │   └── SteamGameDetailsView.tsx     # รายละเอียดเกมและปุ่มเพิ่มลงตะกร้า
│   ├── cart/
│   │   └── SteamCart.tsx                # ตะกร้าและการยืนยันซื้อ
│   └── collection/
│       └── SteamCollection.tsx          # คลังเกม ชั่วโมงเล่น และฟอร์มแอดมิน
├── lib/
│   ├── admin.ts                         # อีเมลแอดมินและการตรวจสิทธิ์
│   └── steam/                           # import ได้จาก "@/lib/steam"
│       ├── index.ts                     # รวม export ของทุกไฟล์ในโฟลเดอร์
│       ├── schemas.ts                   # Schema (Zod) และ Type ของข้อมูลเกม
│       ├── api.ts                       # เรียก Steam Store API (ฝั่ง server)
│       ├── storage.ts                   # ตะกร้า / คลังเกมใน localStorage (ฝั่ง browser)
│       └── categories.ts                # รายการหมวดหมู่เกม
├── auth.ts                              # ตั้งค่า Auth.js และ Google provider
├── middleware.ts                        # ตรวจการล็อกอินก่อนเข้าหน้าที่กำหนด
└── globals.d.ts                         # ให้ TypeScript รู้จักการ import ไฟล์ .css
```

### 🧭 อยากแก้อะไร ไปที่ไหน

| ต้องการแก้ | ไฟล์ |
| --- | --- |
| เพิ่ม / ลด / เปลี่ยนชื่อหมวดหมู่ | `src/lib/steam/categories.ts` และไอคอนใน `src/components/store/CategoryTabs.tsx` |
| เมนูด้านบน | `src/components/layout/SiteHeader.tsx` |
| อีเมลติดต่อ / รายชื่อผู้จัดทำในหน้าติดต่อ | `src/app/contact/page.tsx` (`CONTACT_EMAIL`, `TEAM_MEMBERS`) |
| ข้อความหน้าแรก, คำค้น "กำลังฮิต", แถบจุดเด่น | `src/components/store/SteamGameSearch.tsx` (`TRENDING_TERMS`, `HERO_FEATURES`) |
| หน้าตาการ์ดเกม | `src/components/store/GameCard.tsx` |
| ข้อความท้ายหน้าแรก (footer) | `src/app/page.tsx` |
| สี / การตกแต่ง | `src/app/globals.css` ส่วนตกแต่งเพิ่มเติมอยู่ท้ายไฟล์ แบ่งเป็นหัวข้อ 1–7 (เช่น "4. หน้าแรก (hero)") |

> 💡 ก่อนแก้สไตล์ ให้ค้นชื่อ class ทั้งไฟล์ `globals.css` ก่อน บาง class มีกฎแยกไว้สำหรับจอเล็ก (`@media`) หรือตอนเอาเมาส์ชี้ (`:hover`)

---

## 🔌 API

หน้าเว็บเรียก API ภายในของ Next.js ซึ่งไปเรียก Steam Store API ต่อผ่านฟังก์ชันใน `src/lib/steam/api.ts`

### API ภายในโปรเจกต์

| Endpoint | Method | หน้าที่ |
| --- | --- | --- |
| `/api/steam/featured?category=<หมวด>` | GET | เกมตามหมวด: `all` (ค่าเริ่มต้น), `top_sellers`, `specials`, `new_releases`, `coming_soon` |
| `/api/steam/search?q=<คำค้นหา>` | GET | ค้นหาเกม คำค้นหายาว 2–80 ตัวอักษร |
| `/api/steam/games/<appId>` | GET | รายละเอียดเกมตาม App ID |
| `/api/auth/[...nextauth]` | GET / POST | เส้นทางยืนยันตัวตนของ Auth.js |

### Steam Store API ที่ใช้

| URL | หน้าที่ |
| --- | --- |
| `https://store.steampowered.com/api/featuredcategories/?cc=th&l=thai` | เกมแนะนำแยกตามหมวด (แคช 5 นาที) |
| `https://store.steampowered.com/api/storesearch/` | ค้นหาเกมในร้าน Steam |
| `https://store.steampowered.com/api/appdetails` | รายละเอียดเกมตาม App ID |

---

## 👑 การตั้งค่าแอดมิน

อีเมลแอดมินกำหนดไว้ที่ค่าคงที่ `ADMIN_EMAIL` ในไฟล์ `src/lib/admin.ts` ถ้าต้องการเปลี่ยนบัญชีแอดมิน ให้แก้อีเมลในไฟล์นี้ แล้วล็อกอินด้วยบัญชีนั้น จะเห็นฟอร์มเพิ่มเกมในหน้าคลังเกม

---

## ⚠️ ข้อจำกัด

- **ข้อมูลอยู่ในเบราว์เซอร์เท่านั้น** ตะกร้าและคลังเกมเก็บใน `localStorage` (คีย์ `game-backlog:cart:<ผู้ใช้>` และ `game-backlog:collection:<ผู้ใช้>`) ไม่มีฐานข้อมูลกลาง จึงไม่ซิงก์ข้ามอุปกรณ์หรือเบราว์เซอร์ และหายได้ถ้าล้างข้อมูลเว็บไซต์
- **จำนวนเกมต่อหมวดขึ้นกับ Steam** หมวดขายดี ลดราคา และเร็ว ๆ นี้ Steam ส่งมาหมวดละประมาณ 10 เกม ส่วนหมวดแนะนำและมาใหม่ แสดงไม่เกิน 18 เกม ผลค้นหาแสดงไม่เกิน 12 เกม
- **ข้อมูลและราคาเปลี่ยนได้** อ้างอิงจาก Steam Store API จึงเปลี่ยนตามภูมิภาค เวลา และการให้บริการของ Steam
- **ภาพปกบางเกม** ถ้า Steam ไม่มีรูปขนาดใหญ่ ระบบจะใช้รูปสำรองแทน ซึ่งอาจคมชัดน้อยกว่า
- **ต้องตั้งค่า Google OAuth ก่อน** ถ้า `.env.local` ไม่ถูกต้อง จะเข้าสู่ระบบไม่ได้
