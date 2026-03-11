"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getRecipes,
  getMaterials,
  createRecipe,
  deleteRecipe,
  addRecipeMaterial,
  removeRecipeMaterial,
} from "@/app/actions";
import {
  Plus,
  Trash2,
  X,
  Loader2,
  ChevronRight,
  CookingPot,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface RecipeMaterialData {
  id: string;
  material_id: string;
  quantity: number;
  material?: { name: string; unit_cost: number; unit: string } | null;
}

interface RecipeData {
  id: string;
  name: string;
  batch_yield: number;
  yield_unit: string;
  recipe_materials: RecipeMaterialData[];
}

interface MaterialData {
  id: string;
  name: string;
  unit_cost: number;
  unit: string;
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<RecipeData[]>([]);
  const [materials, setMaterials] = useState<MaterialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // New recipe form
  const [newName, setNewName] = useState("");
  const [newYield, setNewYield] = useState(1000);
  const [newUnit, setNewUnit] = useState("g");

  // Add material form
  const [addMaterialId, setAddMaterialId] = useState("");
  const [addQuantity, setAddQuantity] = useState(0);
  const [showAddMaterial, setShowAddMaterial] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [recs, mats] = await Promise.all([getRecipes(), getMaterials()]);
    setRecipes(recs as RecipeData[]);
    setMaterials(mats as MaterialData[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateRecipe = async () => {
    if (!newName) return;
    setSaving(true);
    await createRecipe({ name: newName, batch_yield: newYield, yield_unit: newUnit });
    setShowAddModal(false);
    setNewName("");
    setNewYield(1000);
    setNewUnit("g");
    await loadData();
    setSaving(false);
  };

  const handleDeleteRecipe = async (id: string) => {
    if (!confirm("このレシピを削除しますか？")) return;
    await deleteRecipe(id);
    setSelectedRecipe(null);
    await loadData();
  };

  const handleAddMaterial = async () => {
    if (!selectedRecipe || !addMaterialId || addQuantity <= 0) return;
    setSaving(true);
    await addRecipeMaterial(selectedRecipe, addMaterialId, addQuantity);
    setAddMaterialId("");
    setAddQuantity(0);
    setShowAddMaterial(false);
    await loadData();
    setSaving(false);
  };

  const handleRemoveMaterial = async (rmId: string) => {
    setSaving(true);
    await removeRecipeMaterial(rmId);
    await loadData();
    setSaving(false);
  };

  const selectedRecipeData = recipes.find((r) => r.id === selectedRecipe);

  const calculateBatchCost = (recipe: RecipeData) => {
    return recipe.recipe_materials.reduce((sum, rm) => {
      const unitCost = rm.material ? Number(rm.material.unit_cost) : 0;
      return sum + unitCost * Number(rm.quantity);
    }, 0);
  };

  const calculatePerUnitCost = (recipe: RecipeData) => {
    const batchCost = calculateBatchCost(recipe);
    return recipe.batch_yield > 0 ? batchCost / recipe.batch_yield : 0;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">仕込みレシピ 🍳</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            仕込み時の材料配合を登録します。ここで設定したレシピを商品に紐づけて原価を計算します。
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          レシピを追加
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recipe List */}
        <div className="lg:col-span-1 space-y-2">
          {recipes.map((recipe) => {
            const batchCost = calculateBatchCost(recipe);
            const perUnit = calculatePerUnitCost(recipe);
            return (
              <button
                key={recipe.id}
                onClick={() => setSelectedRecipe(recipe.id)}
                className={`w-full text-left card p-4 transition-all hover:shadow-md ${
                  selectedRecipe === recipe.id
                    ? "border-2 border-[var(--color-brand-orange)] shadow-md"
                    : "border-2 border-transparent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">{recipe.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      出来高: {recipe.batch_yield}{recipe.yield_unit} • 材料: {recipe.recipe_materials.length}品
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[var(--color-brand-orange)]">
                      ¥{batchCost.toFixed(0)}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      1{recipe.yield_unit}=¥{perUnit.toFixed(2)}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)] absolute right-2 top-1/2 -translate-y-1/2 hidden" />
              </button>
            );
          })}

          {recipes.length === 0 && (
            <div className="card p-8 text-center text-[var(--color-text-muted)]">
              まだレシピが登録されていません
            </div>
          )}
        </div>

        {/* Recipe Detail */}
        <div className="lg:col-span-2">
          {selectedRecipeData ? (
            <div className="card p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedRecipeData.name}</h2>
                  <p className="text-[var(--color-text-secondary)]">
                    出来高: {selectedRecipeData.batch_yield}{selectedRecipeData.yield_unit}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteRecipe(selectedRecipeData.id)}
                  className="btn btn-secondary text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  削除
                </button>
              </div>

              {/* Cost Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[var(--color-surface-dim)] rounded-xl p-4 text-center">
                  <p className="text-xs text-[var(--color-text-muted)] mb-1">バッチ原価</p>
                  <p className="text-xl font-extrabold text-[var(--color-brand-orange)]">
                    ¥{calculateBatchCost(selectedRecipeData).toFixed(0)}
                  </p>
                </div>
                <div className="bg-[var(--color-surface-dim)] rounded-xl p-4 text-center">
                  <p className="text-xs text-[var(--color-text-muted)] mb-1">1{selectedRecipeData.yield_unit}あたり</p>
                  <p className="text-xl font-extrabold">
                    ¥{calculatePerUnitCost(selectedRecipeData).toFixed(2)}
                  </p>
                </div>
                <div className="bg-[var(--color-surface-dim)] rounded-xl p-4 text-center">
                  <p className="text-xs text-[var(--color-text-muted)] mb-1">材料数</p>
                  <p className="text-xl font-extrabold">
                    {selectedRecipeData.recipe_materials.length}品
                  </p>
                </div>
              </div>

              {/* Materials List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    使用材料
                  </h3>
                  <button
                    onClick={() => setShowAddMaterial(true)}
                    className="text-sm text-[var(--color-brand-orange)] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    材料を追加
                  </button>
                </div>

                {selectedRecipeData.recipe_materials.length === 0 ? (
                  <div className="p-6 bg-[var(--color-surface-dim)] rounded-xl text-center text-[var(--color-text-muted)]">
                    まだ材料が追加されていません
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedRecipeData.recipe_materials.map((rm) => (
                      <div
                        key={rm.id}
                        className="flex items-center justify-between px-4 py-3 bg-[var(--color-surface-dim)] rounded-xl"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {rm.material?.name || "不明"}
                          </p>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            使用量: {rm.quantity}{rm.material?.unit || ""}
                            {rm.material && (
                              <span className="ml-2">
                                (¥{(Number(rm.material.unit_cost) * rm.quantity).toFixed(2)})
                              </span>
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveMaterial(rm.id)}
                          className="text-red-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add material form */}
                <AnimatePresence>
                  {showAddMaterial && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 p-4 bg-orange-50 rounded-xl overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium mb-1">材料</label>
                          <select
                            className="input text-sm"
                            value={addMaterialId}
                            onChange={(e) => setAddMaterialId(e.target.value)}
                          >
                            <option value="">材料を選択...</option>
                            {materials.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} (¥{Number(m.unit_cost).toFixed(2)}/{m.unit})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">使用量</label>
                          <input
                            type="number"
                            className="input text-sm"
                            placeholder="使用量"
                            value={addQuantity || ""}
                            onChange={(e) => setAddQuantity(Number(e.target.value))}
                            step="0.1"
                            min="0"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-3">
                        <button
                          onClick={() => setShowAddMaterial(false)}
                          className="btn btn-secondary text-sm"
                        >
                          キャンセル
                        </button>
                        <button
                          onClick={handleAddMaterial}
                          disabled={saving || !addMaterialId || addQuantity <= 0}
                          className="btn btn-primary text-sm"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "追加"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center text-[var(--color-text-muted)]">
              <CookingPot className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>左のリストからレシピを選択してください</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Recipe Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
                <h2 className="text-xl font-bold">レシピを追加 🍳</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">レシピ名</label>
                  <input
                    className="input"
                    placeholder="例: ソフトクリームベース"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateRecipe()}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">出来高（バッチ量）</label>
                    <input
                      type="number"
                      className="input"
                      placeholder="例: 1000"
                      value={newYield}
                      onChange={(e) => setNewYield(Number(e.target.value))}
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">単位</label>
                    <select
                      className="input"
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                    >
                      <option value="g">g（グラム）</option>
                      <option value="ml">ml（ミリリットル）</option>
                      <option value="個">個</option>
                      <option value="杯">杯</option>
                    </select>
                  </div>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  1回の仕込みで出来上がる総量を設定してください。商品に紐づける際に1個あたりの使用量を設定します。
                </p>
              </div>
              <div className="p-6 border-t border-[var(--color-border)] flex justify-end gap-3">
                <button onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  キャンセル
                </button>
                <button
                  onClick={handleCreateRecipe}
                  disabled={saving || !newName}
                  className="btn btn-primary"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "追加する"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
