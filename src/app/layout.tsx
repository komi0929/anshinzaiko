import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-noto-sans-jp",
});

export const metadata: Metadata = {
  title: "あんしん在庫 | かんたん在庫管理ツール",
  description: "飲食店・お菓子屋さんのための、ずっと無料の在庫管理ツール。スマホでかんたん入力、むずかしい操作はゼロ。はじめてでもあんしんして使えます。",
  icons: {
    icon: "/images/app_logo.png",
  },
  openGraph: {
    title: "あんしん在庫 | かんたん在庫管理ツール",
    description: "スマホでポンポン入力、むずかしい操作ゼロ。ずっと無料のかんたん在庫管理。",
    images: ["/images/dashboard_hero.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={notoSansJP.variable}>
      <body className="font-[family-name:var(--font-noto-sans-jp)] antialiased">
        {children}
      </body>
    </html>
  );
}
