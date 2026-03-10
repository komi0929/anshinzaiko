export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-dim)] px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-3xl font-bold">利用規約</h1>
        <section className="space-y-6 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          <p>
            この利用規約（以下「本規約」）は、あんしん在庫（以下「本サービス」）の利用条件を定めるものです。
            ユーザーの皆様には、本規約に同意いただいた上で本サービスをご利用いただきます。
          </p>

          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">第1条（適用）</h2>
            <p>本規約は、ユーザーと本サービス運営者との間の本サービスの利用に関する一切の関係に適用されます。</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">第2条（利用登録）</h2>
            <p>登録希望者が本規約に同意の上、所定の方法により利用登録を申請し、運営者がこれを承認することで利用登録が完了するものとします。</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">第3条（禁止事項）</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>サービスの運営を妨害する行為</li>
              <li>他のユーザーに迷惑をかける行為</li>
              <li>不正アクセスまたはこれを試みる行為</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">第4条（免責事項）</h2>
            <p>本サービスは「現状有姿」で提供されます。運営者は、本サービスに事実上または法律上の瑕疵がないことを保証するものではありません。本サービスの利用により生じた損害について、運営者は一切の責任を負いません。</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">第5条（サービス内容の変更等）</h2>
            <p>運営者は、ユーザーに通知することなく本サービスの内容を変更し、または本サービスの提供を中止することができるものとします。</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">第6条（アフィリエイトリンクについて）</h2>
            <p>本サービスでは、材料の購入先として登録されたURLに対して、運営者のアフィリエイトIDが自動的に付与される場合があります。これにより、ユーザーの追加負担なく本サービスの運営費用が賄われています。</p>
          </div>

          <p className="text-xs text-[var(--color-text-muted)] pt-4">
            最終更新日: 2026年3月11日
          </p>
        </section>
      </div>
    </div>
  );
}
