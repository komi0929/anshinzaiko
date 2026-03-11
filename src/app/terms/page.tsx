import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-dim)] px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-[var(--color-brand-orange)] hover:underline mb-6 inline-block">← トップへもどる</Link>
        <h1 className="mb-8 text-3xl font-bold">利用規約</h1>
        <section className="space-y-6 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          <p>
            この利用規約（以下「本規約」）は、株式会社ヒトコト（以下「当社」）が提供する「あんしん在庫」（以下「本サービス」）の利用条件を定めるものです。
            ユーザーの皆様には、本規約に同意いただいた上で本サービスをご利用いただきます。
          </p>

          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">第1条（適用）</h2>
            <p>本規約は、ユーザーと当社との間の本サービスの利用に関する一切の関係に適用されます。</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">第2条（利用登録）</h2>
            <p>登録希望者が本規約に同意の上、所定の方法により利用登録を申請し、当社がこれを承認することで利用登録が完了するものとします。</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">第3条（利用料金）</h2>
            <p>本サービスは無料で提供されます。ただし、当社は将来的に有料プランを導入する場合があり、その際は事前にユーザーへ通知します。</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">第4条（禁止事項）</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>サービスの運営を妨害する行為</li>
              <li>他のユーザーに迷惑をかける行為</li>
              <li>不正アクセスまたはこれを試みる行為</li>
              <li>本サービスの逆コンパイル、リバースエンジニアリングを行う行為</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">第5条（免責事項）</h2>
            <p>本サービスは「現状有姿」で提供されます。当社は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます）がないことを保証するものではありません。</p>
            <p className="mt-2">当社は、本サービスの利用により生じた損害について、当社の故意または重大な過失による場合を除き、一切の責任を負いません。</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">第6条（サービス内容の変更等）</h2>
            <p>当社は、ユーザーに通知することなく本サービスの内容を変更し、または本サービスの提供を中止することができるものとします。これによってユーザーに生じた損害について、当社は一切の責任を負いません。</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">第7条（外部リンクについて）</h2>
            <p>本サービスでは、材料の購入先として登録されたURLから外部サイトへ遷移する場合があります。外部サイトの内容やサービスについて、当社は一切の責任を負いません。</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">第8条（知的財産権）</h2>
            <p>本サービスに関する知的財産権は、すべて当社に帰属します。ユーザーは、本サービスを利用することで得られる情報を、当社の事前の同意なく、複製、販売、出版その他の方法で利用してはならないものとします。</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">第9条（準拠法・裁判管轄）</h2>
            <p>本規約は、日本法に準拠し解釈されるものとします。本サービスに関連する紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。</p>
          </div>

          <div className="card p-4 mt-8 space-y-2">
            <h3 className="font-bold text-[var(--color-text-primary)]">運営者情報</h3>
            <p>運営会社: 株式会社ヒトコト</p>
            <p>代表者: 小南優作</p>
            <p>お問い合わせ: <a href="mailto:y.kominami@hitokoto1.co.jp" className="text-[var(--color-brand-orange)] hover:underline">y.kominami@hitokoto1.co.jp</a></p>
          </div>

          <p className="text-xs text-[var(--color-text-muted)] pt-4">
            最終更新日: 2026年3月11日
          </p>
        </section>
      </div>
    </div>
  );
}
