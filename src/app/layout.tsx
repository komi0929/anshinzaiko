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
  title: "あんしん在庫 | 飲食店向け在庫管理ツール",
  description: "飲食店・菓子製造業向けの完全無料在庫管理SaaS。「1秒の無駄も許さない」をコンセプトに、現場スタッフの入力負荷ゼロと管理者の手計算ゼロを実現。",
  icons: {
    icon: "/images/app_logo.png",
  },
  openGraph: {
    title: "あんしん在庫 | 飲食店向け在庫管理ツール",
    description: "現場の入力負荷ゼロ。管理者の手計算ゼロ。完全無料の在庫管理SaaS。",
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
