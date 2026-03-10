"use client";

import { useEffect, useState, useCallback } from "react";
import { getLocations, createLocation, deleteLocation } from "@/app/actions";
import { Plus, Trash2, MapPin, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function LocationsPage() {
  const [locations, setLocations] = useState<{id:string;name:string;sort_order:number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await getLocations();
    setLocations(data as {id:string;name:string;sort_order:number}[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    await createLocation(newName.trim());
    setNewName("");
    await loadData();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この保管場所を削除しますか？")) return;
    await deleteLocation(id);
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
        <h1 className="text-3xl font-extrabold">保管場所 📍</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          材料のしまう場所を登録できます。スタッフ画面のタブになります♪
        </p>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-3">
          <input
            className="input flex-1"
            placeholder="場所の名前を入れてね（例: 冷蔵庫C）"
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
            ついか
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {locations.map((loc, i) => (
          <motion.div
            key={loc.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-medium">{loc.name}</span>
            </div>
            <button
              onClick={() => handleDelete(loc.id)}
              className="p-2 rounded-lg hover:bg-red-50 text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
