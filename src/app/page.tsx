import Link from "next/link";
import Image from "next/image";
import { ChefHat, Smartphone, Monitor, Zap, ArrowRight, Heart } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-dim)]">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/dashboard_hero.png"
            alt="Kitchen"
            fill
            className="object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-surface-dim)] via-transparent to-[var(--color-surface-dim)]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 py-24 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[var(--color-brand-orange)] to-[var(--color-brand-orange-dark)] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-orange-300/30">
            <ChefHat className="w-11 h-11 text-white" />
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-[var(--color-text-primary)] mb-4 tracking-tight">
            あんしん在庫
          </h1>
          <p className="text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed mb-8">
            もう在庫管理で悩まない。<br />
            スマホでポンポン入力、むずかしい操作はゼロ。<br />
            <span className="text-[var(--color-brand-orange-dark)] font-bold">ずっと無料</span>であんしんの在庫管理を。
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/login"
              className="btn btn-primary px-8 py-3.5 text-base shadow-lg shadow-orange-300/20"
            >
              無料ではじめる
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
              title: "スマホでかんたん入力",
              description:
                "大きなボタンをポンポンタップするだけ♪ キーボード入力はいりません。スタッフさんもすぐに使えます。",
              color: "from-emerald-400 to-emerald-500",
              bg: "bg-emerald-50",
            },
            {
              icon: Monitor,
              title: "パソコンでらくらく管理",
              description:
                "「足りないものリスト」がひと目でわかる。ボタンひとつでネット注文、メールで仕入先へ発注もできます。",
              color: "from-blue-400 to-indigo-500",
              bg: "bg-blue-50",
            },
            {
              icon: Zap,
              title: "原価もおまかせ計算",
              description:
                "材料の値段を入れておくだけで、商品ごとの原価を自動で出してくれます。めんどうな計算はおまかせ♪",
              color: "from-[var(--color-brand-orange)] to-orange-500",
              bg: "bg-orange-50",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className={`${feature.bg} border border-[var(--color-border)] rounded-2xl p-6 hover:shadow-lg transition-all`}
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}
              >
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-[var(--color-text-primary)] font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="bg-gradient-to-r from-[var(--color-brand-orange)] to-orange-400 rounded-3xl p-12 text-center shadow-2xl shadow-orange-300/20">
          <Heart className="w-12 h-12 text-white/90 mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold text-white mb-3">
            まずは気軽にはじめてみませんか？
          </h2>
          <p className="text-white/80 max-w-md mx-auto mb-6">
            登録するだけで、すべての機能がずっと無料で使えます。
            クレジットカードもいりません。
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-white text-orange-600 font-bold px-8 py-3.5 rounded-xl hover:bg-orange-50 transition-colors shadow-lg"
          >
            無料ではじめる
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-8 text-center text-sm text-[var(--color-text-secondary)]">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ChefHat className="w-4 h-4" />
            <span>あんしん在庫</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-[var(--color-text-primary)] transition-colors">
              利用規約
            </Link>
            <Link href="/privacy" className="hover:text-[var(--color-text-primary)] transition-colors">
              プライバシーポリシー
            </Link>
          </div>
          <p>© 2026 株式会社ヒトコト</p>
        </div>
      </footer>
    </div>
  );
}
