"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getMaterialsPageData,
  createMaterial,
  updateMaterial,
  deleteMaterial,
} from "@/app/actions";
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  X,
  Package,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface MaterialData {
  id: string;
  name: string;
  category: string;
  location_id: string | null;
  supplier_name: string;
  supplier_url: string;
  supplier_email: string;
  purchase_price: number;
  units_per_purchase: number;
  content_amount: number;
  unit: string;
  shipping_cost: number;
  reorder_threshold: number;
  unit_cost: number;
  location?: { id: string; name: string } | null;
}

interface LocationData {
  id: string;
  name: string;
}

const emptyForm = {
  name: "",
  category: "食材",
  location_id: null as string | null,
  supplier_name: "",
  supplier_url: "",
  supplier_email: "",
  purchase_price: 0,
  units_per_purchase: 1,
  content_amount: 1,
  unit: "g",
  shipping_cost: 0,
  reorder_threshold: 0,
};

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<MaterialData[]>([]);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await getMaterialsPageData();
    if (data) {
      setMaterials(data.materials as MaterialData[]);
      setLocations(data.locations as LocationData[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        await updateMaterial(editingId, form);
      } else {
        await createMaterial(form);
      }
      setShowModal(false);
      setEditingId(null);
      setForm(emptyForm);
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (mat: MaterialData) => {
    setEditingId(mat.id);
    setForm({
      name: mat.name,
      category: mat.category,
      location_id: mat.location_id,
      supplier_name: mat.supplier_name,
      supplier_url: mat.supplier_url,
      supplier_email: mat.supplier_email,
      purchase_price: mat.purchase_price,
      units_per_purchase: mat.units_per_purchase,
      content_amount: mat.content_amount,
      unit: mat.unit,
      shipping_cost: mat.shipping_cost,
      reorder_threshold: mat.reorder_threshold,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この材料を削除しますか？")) return;
    await deleteMaterial(id);
    await loadData();
  };

  // Real-time unit cost preview
  const previewUnitCost =
    form.units_per_purchase * form.content_amount > 0
      ? (form.purchase_price + form.shipping_cost) /
        (form.units_per_purchase * form.content_amount)
      : 0;

  const filtered = materials.filter(
    (m) =>
      m.name.includes(search) ||
      m.supplier_name.includes(search) ||
      m.category.includes(search)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-brand-orange)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">材料リスト 📦</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            全{materials.length}件の材料が登録されています
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/materials/bulk" className="btn btn-secondary gap-1.5">
            <FileSpreadsheet className="w-4 h-4" />
            一括登録
          </Link>
          <button
            onClick={() => {
              setEditingId(null);
              setForm(emptyForm);
              setShowModal(true);
            }}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            材料を追加
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
        <input
          type="text"
          className="input pl-10"
          placeholder="名前や仕入先で検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-dim)]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">材料名</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">分類</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">保管場所</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">価格</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">単価</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">注文目安</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((mat, i) => (
                <motion.tr
                  key={mat.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-dim)] transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-[var(--color-text-muted)]" />
                      <span className="font-medium">{mat.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${
                      mat.category === "食材" ? "badge-success" :
                      mat.category === "資材" ? "badge-warning" : "bg-gray-100 text-gray-600"
                    }`}>
                      {mat.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                    {mat.location?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    ¥{Number(mat.purchase_price).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-mono">
                    ¥{Number(mat.unit_cost).toFixed(2)}/{mat.unit}
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    {mat.reorder_threshold > 0 ? mat.reorder_threshold : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(mat)}
                        className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(mat.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
                <h2 className="text-xl font-bold">
                  {editingId ? "材料を編集 ✏️" : "材料を追加 ➕"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Name & Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">材料の名前 *</label>
                    <input
                      className="input"
                      placeholder="例: 薄力粉"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">種類</label>
                    <select
                      className="input"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      <option value="食材">食材</option>
                      <option value="資材">資材</option>
                      <option value="その他">その他</option>
                    </select>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">保管場所</label>
                  <select
                    className="input"
                    value={form.location_id || ""}
                    onChange={(e) => setForm({ ...form, location_id: e.target.value || null })}
                  >
                    <option value="">未設定</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>

                {/* Supplier */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">仕入先</label>
                    <input
                      className="input"
                      placeholder="例: Amazon / 〇〇商店"
                      value={form.supplier_name}
                      onChange={(e) => setForm({ ...form, supplier_name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">仕入先URL</label>
                      <input
                        className="input"
                        placeholder="https://..."
                        value={form.supplier_url}
                        onChange={(e) => setForm({ ...form, supplier_url: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">仕入先メール</label>
                      <input
                        className="input"
                        placeholder="order@supplier.co.jp"
                        value={form.supplier_email}
                        onChange={(e) => setForm({ ...form, supplier_email: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="p-4 bg-[var(--color-surface-dim)] rounded-xl space-y-4">
                  <h3 className="font-bold text-sm">💰 価格情報</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">購入価格（税込）</label>
                      <input
                        type="number"
                        className="input"
                        value={form.purchase_price}
                        onChange={(e) => setForm({ ...form, purchase_price: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">送料</label>
                      <input
                        type="number"
                        className="input"
                        value={form.shipping_cost}
                        onChange={(e) => setForm({ ...form, shipping_cost: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">入り数</label>
                      <input
                        type="number"
                        className="input"
                        value={form.units_per_purchase}
                        onChange={(e) => setForm({ ...form, units_per_purchase: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">内容量</label>
                      <input
                        type="number"
                        className="input"
                        value={form.content_amount}
                        onChange={(e) => setForm({ ...form, content_amount: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">単位</label>
                      <select
                        className="input"
                        value={form.unit}
                        onChange={(e) => setForm({ ...form, unit: e.target.value })}
                      >
                        <option value="g">g（グラム）</option>
                        <option value="ml">ml（ミリリットル）</option>
                        <option value="個">個</option>
                        <option value="枚">枚</option>
                        <option value="本">本</option>
                        <option value="袋">袋</option>
                      </select>
                    </div>
                  </div>

                  {/* Unit Cost Preview */}
                  <div className="bg-white rounded-xl p-4 border border-[var(--color-border)]">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                        1{form.unit}あたりの単価
                      </span>
                      <span className="text-2xl font-extrabold text-[var(--color-brand-orange)]">
                        ¥{previewUnitCost.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                      ({form.purchase_price} + {form.shipping_cost}) ÷ ({form.units_per_purchase} × {form.content_amount}) = ¥{previewUnitCost.toFixed(4)}
                    </p>
                  </div>
                </div>

                {/* Reorder Threshold */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">注文目安（この数以下で通知）</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="この数以下になると通知されます"
                    value={form.reorder_threshold}
                    onChange={(e) => setForm({ ...form, reorder_threshold: Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-[var(--color-border)]">
                <button
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name}
                  className="btn btn-primary"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "保存する" : "追加する"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
