export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-dim)] px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-3xl font-bold">プライバシーポリシー</h1>
        <section className="space-y-6 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          <p>
            あんしん在庫（以下「本サービス」）は、ユーザーのプライバシーを尊重し、個人情報の保護に努めます。
            本プライバシーポリシーは、本サービスにおける個人情報の取扱いについて定めるものです。
          </p>

          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">1. 収集する情報</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>管理者のメールアドレスおよびパスワード（認証目的）</li>
              <li>店舗名、材料情報、商品情報、在庫データ（サービス提供目的）</li>
              <li>スタッフ名（在庫入力の記録目的）</li>
              <li>Cookieおよびセッション情報（認証状態の維持目的）</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">2. 情報の利用目的</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>本サービスの提供および運営</li>
              <li>ユーザーからのお問い合わせへの対応</li>
              <li>本サービスの改善および新機能の開発</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">3. 第三者への提供</h2>
            <p>運営者は、法令に基づく場合を除き、ユーザーの同意なく第三者に個人情報を提供することはありません。</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">4. データの保管</h2>
            <p>ユーザーデータは、Supabase（クラウドデータベース）上に安全に保管されます。データセンターは日本国内（東京リージョン）に所在しています。</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">5. アフィリエイトリンク</h2>
            <p>本サービスでは、材料購入時のURLにアフィリエイトパラメータが自動付与されます。これはユーザーの個人情報とは関連せず、サービスの運営費用に充てられます。</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">6. ポリシーの変更</h2>
            <p>運営者は、必要に応じて本ポリシーを変更することがあります。変更後のプライバシーポリシーは、本ページに掲載した時点から効力を生じるものとします。</p>
          </div>

          <p className="text-xs text-[var(--color-text-muted)] pt-4">
            最終更新日: 2026年3月11日
          </p>
        </section>
      </div>
    </div>
  );
}
