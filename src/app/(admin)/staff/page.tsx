"use client";

import { useEffect, useState, useCallback } from "react";
import { getStaffMembers, createStaffMember, deleteStaffMember } from "@/app/actions";
import { Plus, Trash2, Users, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function StaffPage() {
  const [staff, setStaff] = useState<{id:string;name:string;is_active:boolean}[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await getStaffMembers();
    setStaff(data as {id:string;name:string;is_active:boolean}[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    await createStaffMember(newName.trim());
    setNewName("");
    await loadData();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このスタッフを削除しますか？")) return;
    await deleteStaffMember(id);
    await loadData();
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
        <h1 className="text-3xl font-extrabold">スタッフ 👩‍🍳</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          ここで登録した名前が、スタッフの入力画面に表示されます
        </p>
      </div>

      {/* Add form */}
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <input
            className="input flex-1"
            placeholder="スタッフの名前を入力..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <button
            onClick={handleAdd}
            disabled={saving || !newName.trim()}
            className="btn btn-primary"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            追加
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {staff.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-green-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <span className="font-medium">{s.name}</span>
            </div>
            <button
              onClick={() => handleDelete(s.id)}
              className="p-2 rounded-lg hover:bg-red-50 text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
        {staff.length === 0 && (
          <div className="card p-8 text-center text-[var(--color-text-muted)]">
            まだスタッフが登録されていません 🙋‍♀️
          </div>
        )}
      </div>
    </div>
  );
}
