"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getStaffMembersByToken, getStoreByToken } from "@/app/actions";
import { ChefHat, Loader2, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

interface StaffData {
  id: string;
  name: string;
}

interface StoreData {
  id: string;
  name: string;
}

export default function StaffSelectPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [staff, setStaff] = useState<StaffData[]>([]);
  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [storeData, staffData] = await Promise.all([
        getStoreByToken(token),
        getStaffMembersByToken(token),
      ]);

      if (!storeData) {
        setError("お店がみつかりません");
        setLoading(false);
        return;
      }

      setStore(storeData as StoreData);
      setStaff(staffData as StaffData[]);
    } catch {
      setError("データの読み込みに失敗しました");
    }
    setLoading(false);
  };

  useEffect(() => {
    // Check if staff name is already saved in localStorage
    const savedName = localStorage.getItem(`anshinzaiko_staff_${token}`);
    if (savedName) {
      router.replace(`/s/${token}/input?staff=${encodeURIComponent(savedName)}`);
      return;
    }

    loadData();
  }, [token, router]);

  const handleSelectStaff = (name: string) => {
    // Save to localStorage for next visit auto-skip
    localStorage.setItem(`anshinzaiko_staff_${token}`, name);
    router.push(`/s/${token}/input?staff=${encodeURIComponent(name)}`);
  };

  const handleReset = () => {
    localStorage.removeItem(`anshinzaiko_staff_${token}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--color-brand-orange)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-lg font-bold text-red-600 mb-2">{error}</p>
          <p className="text-sm text-[var(--color-text-secondary)]">
            URLがあっているか確認してみてくださいね
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-6 safe-area-inset">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 pt-4"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-brand-orange)] to-[var(--color-brand-orange-dark)] flex items-center justify-center mx-auto mb-4 shadow-lg">
          <ChefHat className="w-9 h-9 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold">{store?.name}</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">在庫チェック 📋</p>
      </motion.div>

      {/* Staff Name Selection */}
      <div className="flex-1">
        <p className="text-center text-lg font-bold mb-6">あなたのお名前をえらんでね 🙋‍♀️</p>

        <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
          {staff.map((s, i) => (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => handleSelectStaff(s.name)}
              className="staff-name-btn"
            >
              {s.name}
            </motion.button>
          ))}
        </div>

        {staff.length === 0 && (
          <div className="text-center py-12 text-[var(--color-text-muted)]">
            <p>まだスタッフが登録されていません</p>
            <p className="text-sm mt-1">管理者の方に聞いてみてくださいね</p>
          </div>
        )}
      </div>

      {/* Reset button */}
      <div className="text-center mt-8 pb-4">
        <button
          onClick={handleReset}
          className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 mx-auto"
        >
          <RefreshCw className="w-3 h-3" />
          名前の記憶をリセット
        </button>
      </div>
    </div>
  );
}
