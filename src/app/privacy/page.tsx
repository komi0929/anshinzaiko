import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-dim)] px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-[var(--color-brand-orange)] hover:underline mb-6 inline-block">← トップへもどる</Link>
        <h1 className="mb-8 text-3xl font-bold">プライバシーポリシー</h1>
        <section className="space-y-6 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          <p>
            株式会社ヒトコト（以下「当社」）は、「あんしん在庫」（以下「本サービス」）におけるユーザーのプライバシーを尊重し、個人情報の保護に努めます。
            本プライバシーポリシーは、本サービスにおける個人情報の取扱いについて定めるものです。
          </p>

          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">1. 収集する情報</h2>
            <p className="mb-2">当社は、本サービスの提供にあたり、以下の情報を取得する場合があります。</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>管理者のメールアドレス（認証およびアカウント管理目的）</li>
              <li>Googleアカウント情報（Google認証をご利用の場合、名前・メールアドレス）</li>
              <li>店舗名、材料情報、商品情報、在庫データ（サービス提供目的）</li>
              <li>スタッフ名（在庫入力の記録目的）</li>
              <li>Cookieおよびセッション情報（認証状態の維持目的）</li>
              <li>アクセスログ（サービス改善およびセキュリティ目的）</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">2. 情報の利用目的</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>本サービスの提供および運営</li>
              <li>ユーザーからのお問い合わせへの対応</li>
              <li>本サービスの改善および新機能の開発</li>
              <li>利用状況の分析（統計データとして匿名化した上で利用）</li>
              <li>重要なお知らせやサービスの変更に関する通知</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">3. 第三者への提供</h2>
            <p>当社は、以下の場合を除き、ユーザーの同意なく第三者に個人情報を提供することはありません。</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>法令に基づく場合</li>
              <li>人の生命、身体または財産の保護のために必要がある場合</li>
              <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">4. データの保管</h2>
            <p>ユーザーデータは、Supabase（クラウドデータベース）上に安全に保管されます。通信はSSL/TLSにより暗号化されています。</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">5. 外部サイトへのリンク</h2>
            <p>本サービスには、材料の購入先として外部サイトへのリンクが含まれる場合があります。外部サイトにおける個人情報の取扱いは、各サイトのプライバシーポリシーに準拠します。</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">6. ユーザーの権利</h2>
            <p>ユーザーは、当社に対して自己の個人情報の開示、訂正、削除を請求することができます。アカウントの削除をご希望の場合は、下記のお問い合わせ先までご連絡ください。</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">7. ポリシーの変更</h2>
            <p>当社は、必要に応じて本ポリシーを変更することがあります。変更後のプライバシーポリシーは、本ページに掲載した時点から効力を生じるものとします。</p>
          </div>

          <div className="card p-4 mt-8 space-y-2">
            <h3 className="font-bold text-[var(--color-text-primary)]">お問い合わせ先</h3>
            <p>株式会社ヒトコト</p>
            <p>代表者: 小南優作</p>
            <p>メール: <a href="mailto:y.kominami@hitokoto1.co.jp" className="text-[var(--color-brand-orange)] hover:underline">y.kominami@hitokoto1.co.jp</a></p>
          </div>

          <p className="text-xs text-[var(--color-text-muted)] pt-4">
            最終更新日: 2026年3月11日
          </p>
        </section>
      </div>
    </div>
  );
}
