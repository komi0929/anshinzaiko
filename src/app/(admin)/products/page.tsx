"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getProducts,
  getMaterials,
  createProduct,
  deleteProduct,
  addRecipeItem,
  removeRecipeItem,
  getProductWithRecipe,
} from "@/app/actions";
import {
  Plus,
  Trash2,
  X,
  ShoppingCart,
  Loader2,
  ChevronRight,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ProductData {
  id: string;
  name: string;
  selling_price: number;
  total_cost: number;
  cost_ratio: number;
}

interface MaterialData {
  id: string;
  name: string;
  unit_cost: number;
  unit: string;
}

interface RecipeItemData {
  id: string;
  material_id: string | null;
  sub_product_id: string | null;
  quantity: number;
  material?: { name: string; unit_cost: number; unit: string } | null;
  sub_product?: { name: string; total_cost: number } | null;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [materials, setMaterials] = useState<MaterialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [recipeItems, setRecipeItems] = useState<RecipeItemData[]>([]);
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState(0);
  const [saving, setSaving] = useState(false);

  // Recipe add form
  const [addType, setAddType] = useState<"material" | "product">("material");
  const [addRefId, setAddRefId] = useState("");
  const [addQuantity, setAddQuantity] = useState(1);
  const [showAddRecipeItem, setShowAddRecipeItem] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [prods, mats] = await Promise.all([getProducts(), getMaterials()]);
    setProducts(prods as ProductData[]);
    setMaterials(mats as MaterialData[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateProduct = async () => {
    if (!newProductName) return;
    setSaving(true);
    await createProduct({ name: newProductName, selling_price: newProductPrice });
    setShowAddModal(false);
    setNewProductName("");
    setNewProductPrice(0);
    await loadData();
    setSaving(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("この商品を削除しますか？")) return;
    await deleteProduct(id);
    if (selectedProduct === id) setSelectedProduct(null);
    await loadData();
  };

  const handleSelectProduct = async (id: string) => {
    setSelectedProduct(id);
    const product = await getProductWithRecipe(id);
    if (product) {
      setRecipeItems((product.recipe_items || []) as RecipeItemData[]);
    }
  };

  const handleAddRecipeItem = async () => {
    if (!selectedProduct || !addRefId) return;
    setSaving(true);
    await addRecipeItem(selectedProduct, {
      material_id: addType === "material" ? addRefId : null,
      sub_product_id: addType === "product" ? addRefId : null,
      quantity: addQuantity,
    });
    const product = await getProductWithRecipe(selectedProduct);
    if (product) setRecipeItems((product.recipe_items || []) as RecipeItemData[]);
    await loadData();
    setShowAddRecipeItem(false);
    setAddRefId("");
    setAddQuantity(1);
    setSaving(false);
  };

  const handleRemoveRecipeItem = async (recipeItemId: string) => {
    if (!selectedProduct) return;
    await removeRecipeItem(recipeItemId, selectedProduct);
    const product = await getProductWithRecipe(selectedProduct);
    if (product) setRecipeItems((product.recipe_items || []) as RecipeItemData[]);
    await loadData();
  };

  const selectedProductData = products.find((p) => p.id === selectedProduct);

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
          <h1 className="text-3xl font-extrabold">商品メニュー 🍰</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            {products.length}件の商品があります • レシピから原価を自動で計算します
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          商品をついか
        </button>
      </div>

      <div className="flex gap-6">
        {/* Products list */}
        <div className="w-1/3 space-y-2">
          {products.map((prod) => (
            <motion.button
              key={prod.id}
              onClick={() => handleSelectProduct(prod.id)}
              className={`w-full text-left card p-4 transition-all ${
                selectedProduct === prod.id
                  ? "ring-2 ring-[var(--color-brand-orange)] bg-orange-50"
                  : ""
              }`}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-bold">{prod.name}</h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      売値 ¥{Number(prod.selling_price).toLocaleString()} • 原価率 {Number(prod.cost_ratio).toFixed(1)}%
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
              </div>
            </motion.button>
          ))}
          {products.length === 0 && (
            <div className="card p-8 text-center text-[var(--color-text-muted)]">
              まだ商品がありません ✨
            </div>
          )}
        </div>

        {/* Recipe detail */}
        <div className="flex-1">
          {selectedProductData ? (
            <div className="card p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedProductData.name}</h2>
                  <p className="text-[var(--color-text-secondary)]">
                    レシピのなかみと原価
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteProduct(selectedProductData.id)}
                  className="btn btn-danger text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  削除
                </button>
              </div>

              {/* Cost summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-[var(--color-surface-dim)] rounded-xl">
                  <p className="text-xs text-[var(--color-text-muted)] mb-1">売値</p>
                  <p className="text-xl font-extrabold">¥{Number(selectedProductData.selling_price).toLocaleString()}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-xl">
                  <p className="text-xs text-[var(--color-text-muted)] mb-1">原価</p>
                  <p className="text-xl font-extrabold text-[var(--color-brand-orange)]">
                    ¥{Number(selectedProductData.total_cost).toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-xl">
                  <p className="text-xs text-[var(--color-text-muted)] mb-1">原価率</p>
                  <p className={`text-xl font-extrabold ${
                    Number(selectedProductData.cost_ratio) > 35 ? "text-red-600" : "text-green-600"
                  }`}>
                    {Number(selectedProductData.cost_ratio).toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Recipe items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    レシピのなかみ
                  </h3>
                  <button
                    onClick={() => setShowAddRecipeItem(true)}
                    className="btn btn-secondary text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    材料をついか
                  </button>
                </div>

                {recipeItems.length === 0 ? (
                  <div className="p-6 bg-[var(--color-surface-dim)] rounded-xl text-center text-[var(--color-text-muted)]">
                    まだレシピに材料がありません
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recipeItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-[var(--color-surface-dim)] rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                            item.material_id ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"
                          }`}>
                            {item.material_id ? "材" : "品"}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {item.material?.name || item.sub_product?.name || "不明"}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)]">
                              つかう量: {item.quantity}{item.material ? item.material.unit : "割合"}
                              {item.material && (
                                <span className="ml-2">
                                  (¥{(Number(item.material.unit_cost) * item.quantity).toFixed(2)})
                                </span>
                              )}
                              {item.sub_product && (
                                <span className="ml-2">
                                  (¥{(Number(item.sub_product.total_cost) * item.quantity).toFixed(2)})
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveRecipeItem(item.id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add recipe item form */}
              <AnimatePresence>
                {showAddRecipeItem && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-3">
                      <div className="flex items-center gap-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setAddType("material"); setAddRefId(""); }}
                            className={`btn text-sm ${addType === "material" ? "btn-primary" : "btn-secondary"}`}
                          >
                            材料
                          </button>
                          <button
                            onClick={() => { setAddType("product"); setAddRefId(""); }}
                            className={`btn text-sm ${addType === "product" ? "btn-primary" : "btn-secondary"}`}
                          >
                            ほかの商品
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <select
                            className="input"
                            value={addRefId}
                            onChange={(e) => setAddRefId(e.target.value)}
                          >
                            <option value="">えらんでください</option>
                            {addType === "material"
                              ? materials.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.name} (¥{Number(m.unit_cost).toFixed(2)}/{m.unit})
                                  </option>
                                ))
                              : products
                                  .filter((p) => p.id !== selectedProduct)
                                  .map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name} (原価 ¥{Number(p.total_cost).toFixed(2)})
                                    </option>
                                  ))}
                          </select>
                        </div>
                        <div>
                          <input
                            type="number"
                            className="input"
                            placeholder={addType === "material" ? "つかう量" : "割合 (0.5=半分)"}
                            value={addQuantity}
                            onChange={(e) => setAddQuantity(Number(e.target.value))}
                            step="0.1"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setShowAddRecipeItem(false)}
                          className="btn btn-secondary text-sm"
                        >
                          やめる
                        </button>
                        <button
                          onClick={handleAddRecipeItem}
                          disabled={saving || !addRefId}
                          className="btn btn-primary text-sm"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "ついか"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="card p-12 text-center text-[var(--color-text-muted)]">
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>左の一覧から商品をえらんで、レシピを見てみましょう♪</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
                <h2 className="text-xl font-bold">商品をついか ✨</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">商品の名前 *</label>
                  <input
                    className="input"
                    placeholder="例: チーズケーキ"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">売値</label>
                  <input
                    type="number"
                    className="input"
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-[var(--color-border)]">
                <button onClick={() => setShowAddModal(false)} className="btn btn-secondary">やめる</button>
                <button
                  onClick={handleCreateProduct}
                  disabled={saving || !newProductName}
                  className="btn btn-primary"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "ついかする"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
