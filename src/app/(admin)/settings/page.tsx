"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getMyStore,
  updateStoreSettings,
  getStoreAdmins,
  inviteStoreAdmin,
  removeStoreAdmin,
} from "@/app/actions";
import { Settings, Loader2, Save, UserPlus, Trash2, Shield, Users } from "lucide-react";
import { motion } from "framer-motion";

interface AdminItem {
  id: string;
  user_id: string;
  email: string;
  role: string;
  created_at: string;
}

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

  // Admin invitation
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await getMyStore();
    if (data) {
      const s = data as { id: string; name: string; staff_token: string };
      setStore(s);
      setForm({ name: s.name });
    }
    const adminList = await getStoreAdmins();
    setAdmins(adminList as AdminItem[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    // Get current user ID
    import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        setCurrentUserId(data?.user?.id || null);
      });
    });
  }, [loadData]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await updateStoreSettings(form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteError(null);
    setInviteSuccess(false);

    const result = await inviteStoreAdmin(inviteEmail.trim());
    if (result.success) {
      setInviteSuccess(true);
      setInviteEmail("");
      loadData();
      setTimeout(() => setInviteSuccess(false), 3000);
    } else {
      setInviteError(result.error || "エラーが発生しました");
    }
    setInviting(false);
  };

  const handleRemoveAdmin = async (adminId: string) => {
    if (!confirm("この管理者を削除してもよろしいですか？")) return;
    const result = await removeStoreAdmin(adminId);
    if (result.success) {
      loadData();
    } else {
      alert(result.error || "エラーが発生しました");
    }
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
              このURLをスタッフに共有すると、ログインなしで在庫入力ができます。
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

        {/* Admin Management */}
        <div className="card p-6">
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--color-text-muted)]" />
            管理者メンバー
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] mb-4">
            このお店を一緒に管理できるメンバーを招待できます。招待する方は先にアカウントを作成してもらってください。
          </p>

          {/* Current admins */}
          <div className="space-y-2 mb-4">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[var(--color-surface-dim)] border border-[var(--color-border)]"
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-[var(--color-brand-orange)]" />
                  <span className="text-sm font-medium">{admin.email}</span>
                  {admin.user_id === currentUserId && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
                      あなた
                    </span>
                  )}
                  {admin.role === "admin" && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                      オーナー
                    </span>
                  )}
                </div>
                {admin.user_id !== currentUserId && (
                  <button
                    onClick={() => handleRemoveAdmin(admin.id)}
                    className="text-red-400 hover:text-red-600 transition-colors p-1"
                    title="この管理者を削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Invite form */}
          <div className="flex items-center gap-2">
            <input
              className="input flex-1"
              placeholder="メールアドレスを入力..."
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
            />
            <button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail.trim()}
              className="btn btn-primary gap-1.5 flex-shrink-0"
            >
              {inviting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              招待する
            </button>
          </div>
          {inviteError && (
            <p className="text-xs text-red-500 mt-2">{inviteError}</p>
          )}
          {inviteSuccess && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-green-600 mt-2 font-medium"
            >
              ✓ 管理者を追加しました！
            </motion.p>
          )}
        </div>

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
