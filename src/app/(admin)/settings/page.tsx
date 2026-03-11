"use client";

import { useEffect, useState, useCallback } from "react";
import { getMyStore, updateStoreSettings } from "@/app/actions";
import { Settings, Loader2, Save } from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const [store, setStore] = useState<{
    id: string;
    name: string;
    staff_token: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "" });
  const [saved, setSaved] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await getMyStore();
    if (data) {
      const s = data as { id: string; name: string; staff_token: string };
      setStore(s);
      setForm({ name: s.name });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const staffUrl = store
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/s/${store.staff_token}`
    : "";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">お店の設定 ⚙️</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          お店の名前やスタッフ用URLの確認ができます
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Store Name */}
        <div className="card p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-[var(--color-text-muted)]" />
            お店の基本情報
          </h2>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              お店の名前
            </label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
        </div>

        {/* Staff URL */}
        {store && (
          <div className="card p-6">
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
              📱 スタッフ用のURL
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] mb-3">
              このURLをスタッフさんに送ると、ログインなしですぐに在庫入力できます♪
            </p>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-[var(--color-surface-dim)] px-3 py-2 rounded-lg flex-1 truncate border border-[var(--color-border)]">
                {staffUrl}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(staffUrl)}
                className="btn btn-secondary text-xs px-3 py-2 flex-shrink-0"
              >
                コピー
              </button>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary px-6"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            保存する
          </button>
          {saved && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-green-600 font-medium"
            >
              ✓ 保存しました！
            </motion.span>
          )}
        </div>
      </div>
    </div>
  );
}
