"use client";

import { useEffect, useState, useCallback } from "react";
import { getMyStore, updateStoreSettings } from "@/app/actions";
import { Settings, Loader2, Save } from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const [store, setStore] = useState<{id:string;name:string;staff_token:string;affiliate_amazon_tag:string;affiliate_rakuten_id:string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    affiliate_amazon_tag: "",
    affiliate_rakuten_id: "",
  });
  const [saved, setSaved] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await getMyStore();
    if (data) {
      const s = data as {id:string;name:string;staff_token:string;affiliate_amazon_tag:string;affiliate_rakuten_id:string};
      setStore(s);
      setForm({
        name: s.name,
        affiliate_amazon_tag: s.affiliate_amazon_tag || "",
        affiliate_rakuten_id: s.affiliate_rakuten_id || "",
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await updateStoreSettings(form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-brand-orange)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">店舗設定</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          店舗情報とアフィリエイト設定
        </p>
      </div>

      <div className="card p-6 space-y-6 max-w-2xl">
        <div>
          <label className="block text-sm font-medium mb-1.5">店舗名</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div className="p-4 bg-[var(--color-surface-dim)] rounded-xl space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-[var(--color-text-muted)]" />
            <h3 className="font-bold text-sm">アフィリエイト設定（マネタイズ）</h3>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)]">
            材料の購入先URLがAmazon/楽天の場合、以下のIDがURLに自動付与されます。
            これにより、利用者の負担ゼロで開発者に収益が入ります。
          </p>
          <div>
            <label className="block text-sm font-medium mb-1.5">Amazon アフィリエイトタグ</label>
            <input
              className="input"
              placeholder="例: anshinzaiko-22"
              value={form.affiliate_amazon_tag}
              onChange={(e) => setForm({ ...form, affiliate_amazon_tag: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">楽天 アフィリエイトID</label>
            <input
              className="input"
              placeholder="例: abc123def"
              value={form.affiliate_rakuten_id}
              onChange={(e) => setForm({ ...form, affiliate_rakuten_id: e.target.value })}
            />
          </div>
        </div>

        {store && (
          <div className="p-4 bg-orange-50 rounded-xl">
            <p className="text-sm font-medium mb-1">スタッフ用トークン</p>
            <code className="text-xs break-all text-[var(--color-text-secondary)]">
              {store.staff_token}
            </code>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            保存
          </button>
          {saved && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-green-600 font-medium"
            >
              ✓ 保存しました
            </motion.span>
          )}
        </div>
      </div>
    </div>
  );
}
