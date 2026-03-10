import Link from "next/link";
import Image from "next/image";
import { ChefHat, Smartphone, Monitor, Zap, Shield, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-darker)]">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/dashboard_hero.png"
            alt="Kitchen"
            fill
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-surface-darker)] via-transparent to-[var(--color-surface-darker)]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 py-24 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-orange-500/30">
            <ChefHat className="w-11 h-11 text-white" />
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-4 tracking-tight">
            あんしん在庫
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8">
            1秒の無駄も許さない。<br />
            現場の入力負荷ゼロ、管理者の手計算ゼロ。<br />
            <span className="text-[var(--color-brand-orange)] font-bold">完全無料</span>の在庫管理ツール。
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/login"
              className="btn btn-primary px-8 py-3.5 text-base shadow-lg shadow-orange-500/30"
            >
              無料で始める
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Smartphone,
              title: "スマホで秒速入力",
              description:
                "ソフトウェアキーボード不要。巨大タップボタンで片手でゲームのように在庫入力。ログイン不要でスタッフ即使用可能。",
              color: "from-green-500 to-emerald-600",
            },
            {
              icon: Monitor,
              title: "PC管理画面で一覧管理",
              description:
                "要発注リスト、原価自動計算、多階層レシピ管理。ワンクリックでAmazon/楽天注文、メールで卸業者に発注。",
              color: "from-blue-500 to-indigo-600",
            },
            {
              icon: Zap,
              title: "原価を全自動計算",
              description:
                "材料の購入額と使用量から1gあたりの原価を計算。商品レシピから「マトリョーシカ型」の再帰計算で総原価を自動算出。",
              color: "from-orange-500 to-red-600",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}
              >
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-12 text-center shadow-2xl shadow-orange-500/20">
          <Shield className="w-12 h-12 text-white/90 mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold text-white mb-3">
            今すぐ無料で始めましょう
          </h2>
          <p className="text-white/80 max-w-md mx-auto mb-6">
            アカウント登録するだけで、すべての機能が完全無料で使えます。
            クレジットカード不要。
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-white text-orange-600 font-bold px-8 py-3.5 rounded-xl hover:bg-orange-50 transition-colors shadow-lg"
          >
            無料で始める
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-sm text-slate-500">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ChefHat className="w-4 h-4" />
            <span>あんしん在庫</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-white transition-colors">
              利用規約
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              プライバシーポリシー
            </Link>
          </div>
          <p>© 2026 Anshin Zaiko</p>
        </div>
      </footer>
    </div>
  );
}
