import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "온라인 출석부",
  description: "학번 입력 및 출석 처리",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased scheme-light">
      <body className="min-h-full flex flex-col bg-[var(--canvas)] font-sans text-[var(--text-primary)]">
        {children}
      </body>
    </html>
  );
}
