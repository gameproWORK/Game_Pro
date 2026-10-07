import "./globals.css";
export const metadata = { title: "Game Pro" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        {children}
      </body>
    </html>
  );
}
