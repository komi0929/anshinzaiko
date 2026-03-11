"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  MapPin,
  Settings,
  LogOut,
  ChefHat,
  CookingPot,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "ホーム", icon: LayoutDashboard },
  { href: "/materials", label: "材料リスト", icon: Package },
  { href: "/recipes", label: "仕込みレシピ", icon: CookingPot },
  { href: "/products", label: "商品メニュー", icon: ShoppingCart },
  { href: "/staff", label: "スタッフ", icon: Users },
  { href: "/locations", label: "保管場所", icon: MapPin },
  { href: "/settings", label: "お店の設定", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-[var(--color-surface-dim)]">
      {/* Sidebar - ライトフェミニンスタイル */}
      <aside className="sidebar flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-[var(--color-border-sidebar)]">
          <Link href="/dashboard" className="flex items-center gap-3 no-underline">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-brand-orange)] to-[var(--color-brand-orange-dark)] flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-[var(--color-text-primary)] font-bold text-lg leading-tight">あんしん在庫</h1>
              <p className="text-xs text-[var(--color-text-secondary)]">かんたん在庫管理</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive ? "active" : ""}`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-[var(--color-border-sidebar)]">
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-left hover:text-red-500"
          >
            <LogOut className="w-5 h-5" />
            ログアウト
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
