"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  getLocationsByToken,
  getMaterialsByToken,
  getInventoryByToken,
  updateInventory,
  startCheckSession,
  getActiveCheckSession,
  markMaterialChecked,
  completeCheckSession,
} from "@/app/actions";
import { ChefHat, Loader2, ArrowLeft, Check, Minus, Plus, Sparkles, CheckCircle2, Send, CircleDot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LocationData {
  id: string;
  name: string;
}

interface MaterialData {
  id: string;
  name: string;
  location_id: string | null;
  unit: string;
  reorder_threshold: number;
}

interface InventoryData {
  material_id: string;
  current_count: number;
  is_plenty: boolean;
}

interface CheckSession {
  id: string;
  checked_material_ids: string[];
  status: string;
}

function StaffInputContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = params.token as string;
  const staffName = searchParams.get("staff") || "スタッフ";

  const [locations, setLocations] = useState<LocationData[]>([]);
  const [materials, setMaterials] = useState<MaterialData[]>([]);
  const [inventoryMap, setInventoryMap] = useState<Map<string, InventoryData>>(new Map());
  const [activeTab, setActiveTab] = useState<string>("");
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Check session state
  const [session, setSession] = useState<CheckSession | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const checkedIds = new Set(session?.checked_material_ids || []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [locs, mats, invs] = await Promise.all([
        getLocationsByToken(token),
        getMaterialsByToken(token),
        getInventoryByToken(token),
      ]);

      setLocations(locs as LocationData[]);
      setMaterials(mats as MaterialData[]);

      const map = new Map<string, InventoryData>();
      (invs as InventoryData[]).forEach((inv) => {
        map.set(inv.material_id, inv);
      });
      setInventoryMap(map);

      if (locs.length > 0 && !activeTab) {
        setActiveTab((locs as LocationData[])[0].id);
      }

      // Load or create check session
      let existingSession = await getActiveCheckSession(token, staffName);
      if (!existingSession) {
        existingSession = await startCheckSession(token, staffName);
      }
      if (existingSession) {
        setSession(existingSession as CheckSession);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [token, activeTab, staffName]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getCurrentCount = (materialId: string): number => {
    const inv = inventoryMap.get(materialId);
    return inv ? Number(inv.current_count) : 0;
  };

  const getIsPlenty = (materialId: string): boolean => {
    const inv = inventoryMap.get(materialId);
    return inv ? inv.is_plenty : false;
  };

  const handleCountChange = async (materialId: string, delta: number) => {
    const current = getCurrentCount(materialId);
    const newCount = Math.max(0, current + delta);

    // Optimistic update
    setInventoryMap((prev) => {
      const next = new Map(prev);
      next.set(materialId, {
        material_id: materialId,
        current_count: newCount,
        is_plenty: false,
      });
      return next;
    });

    // Mark as checked
    if (session && !checkedIds.has(materialId)) {
      setSession((prev) => prev ? {
        ...prev,
        checked_material_ids: [...prev.checked_material_ids, materialId],
      } : prev);
      markMaterialChecked(session.id, materialId);
    }

    setSavingId(materialId);
    await updateInventory(token, materialId, staffName, newCount, false);
    setSavingId(null);
    setLastSaved(materialId);
    setTimeout(() => setLastSaved(null), 1500);
  };

  const handleTogglePlenty = async (materialId: string) => {
    const isCurrentlyPlenty = getIsPlenty(materialId);
    const newPlenty = !isCurrentlyPlenty;
    const currentCount = getCurrentCount(materialId);

    // Optimistic update
    setInventoryMap((prev) => {
      const next = new Map(prev);
      next.set(materialId, {
        material_id: materialId,
        current_count: currentCount,
        is_plenty: newPlenty,
      });
      return next;
    });

    // Mark as checked
    if (session && !checkedIds.has(materialId)) {
      setSession((prev) => prev ? {
        ...prev,
        checked_material_ids: [...prev.checked_material_ids, materialId],
      } : prev);
      markMaterialChecked(session.id, materialId);
    }

    setSavingId(materialId);
    await updateInventory(token, materialId, staffName, currentCount, newPlenty);
    setSavingId(null);
    setLastSaved(materialId);
    setTimeout(() => setLastSaved(null), 1500);
  };

  const handleSetCount = async (materialId: string, count: number) => {
    setInventoryMap((prev) => {
      const next = new Map(prev);
      next.set(materialId, {
        material_id: materialId,
        current_count: count,
        is_plenty: false,
      });
      return next;
    });

    // Mark as checked
    if (session && !checkedIds.has(materialId)) {
      setSession((prev) => prev ? {
        ...prev,
        checked_material_ids: [...prev.checked_material_ids, materialId],
      } : prev);
      markMaterialChecked(session.id, materialId);
    }

    setSavingId(materialId);
    await updateInventory(token, materialId, staffName, count, false);
    setSavingId(null);
    setLastSaved(materialId);
    setTimeout(() => setLastSaved(null), 1500);
  };

  const handleComplete = async () => {
    if (!session) return;
    setCompleting(true);
    await completeCheckSession(session.id);
    setCompleting(false);
    setCompleted(true);
    setShowCompleteModal(false);
  };

  const filteredMaterials = materials.filter(
    (m) => m.location_id === activeTab || (!m.location_id && activeTab === "__none__")
  );

  // Materials without a location
  const hasUnassigned = materials.some((m) => !m.location_id);

  // Check progress per location
  const getLocationProgress = (locationId: string) => {
    const mats = materials.filter(
      (m) => m.location_id === locationId || (!m.location_id && locationId === "__none__")
    );
    if (mats.length === 0) return { total: 0, checked: 0 };
    const checked = mats.filter((m) => checkedIds.has(m.id)).length;
    return { total: mats.length, checked };
  };

  const totalProgress = {
    total: materials.length,
    checked: materials.filter((m) => checkedIds.has(m.id)).length,
  };
  const allChecked = totalProgress.total > 0 && totalProgress.checked === totalProgress.total;

  const handleBack = () => {
    localStorage.removeItem(`anshinzaiko_staff_${token}`);
    router.push(`/s/${token}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--color-brand-orange)]" />
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-surface-dim)] p-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
        </motion.div>
        <h1 className="text-2xl font-extrabold mb-2">在庫チェック完了！</h1>
        <p className="text-[var(--color-text-secondary)] mb-6">
          {staffName}さんのチェック結果を管理者に送信しました。
        </p>
        <button onClick={handleBack} className="btn btn-primary px-8">
          戻る
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface-dim)] no-select">
      {/* Header */}
      <div className="bg-white border-b border-[var(--color-border)] px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={handleBack} className="p-2 -ml-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-brand-orange)] to-[var(--color-brand-orange-dark)] flex items-center justify-center">
          <ChefHat className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm leading-tight">在庫チェック 📋</p>
          <p className="text-xs text-[var(--color-text-muted)]">{staffName}さん</p>
        </div>
        {/* Progress indicator */}
        <div className="text-right">
          <p className="text-xs font-bold text-[var(--color-text-secondary)]">
            {totalProgress.checked}/{totalProgress.total}
          </p>
          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${totalProgress.total > 0 ? (totalProgress.checked / totalProgress.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Location Tabs with completion badges */}
      <div className="bg-white border-b border-[var(--color-border)] overflow-x-auto sticky top-[57px] z-20">
        <div className="flex px-2 py-1 gap-1 min-w-max">
          {locations.map((loc) => {
            const prog = getLocationProgress(loc.id);
            const isDone = prog.total > 0 && prog.checked === prog.total;
            return (
              <button
                key={loc.id}
                onClick={() => setActiveTab(loc.id)}
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeTab === loc.id
                    ? "bg-[var(--color-brand-orange)] text-white shadow-sm"
                    : isDone
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "text-[var(--color-text-secondary)] hover:bg-gray-100"
                }`}
              >
                {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                {loc.name}
                {!isDone && prog.total > 0 && (
                  <span className={`text-xs ${activeTab === loc.id ? "text-white/70" : "text-[var(--color-text-muted)]"}`}>
                    {prog.checked}/{prog.total}
                  </span>
                )}
              </button>
            );
          })}
          {hasUnassigned && (() => {
            const prog = getLocationProgress("__none__");
            const isDone = prog.total > 0 && prog.checked === prog.total;
            return (
              <button
                onClick={() => setActiveTab("__none__")}
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeTab === "__none__"
                    ? "bg-[var(--color-brand-orange)] text-white"
                    : isDone
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "text-[var(--color-text-secondary)] hover:bg-gray-100"
                }`}
              >
                {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                その他
              </button>
            );
          })()}
        </div>
      </div>

      {/* Material List */}
      <div className="flex-1 overflow-y-auto pb-48">
        <div className="px-4 py-3 space-y-2">
          {filteredMaterials.map((mat, i) => {
            const count = getCurrentCount(mat.id);
            const isPlenty = getIsPlenty(mat.id);
            const isLow = mat.reorder_threshold > 0 && count < mat.reorder_threshold && !isPlenty;
            const isSelected = selectedMaterial === mat.id;
            const isSaving = savingId === mat.id;
            const justSaved = lastSaved === mat.id;
            const isChecked = checkedIds.has(mat.id);

            return (
              <motion.div
                key={mat.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedMaterial(isSelected ? null : mat.id)}
                className={`bg-white rounded-2xl p-4 border-2 transition-all cursor-pointer ${
                  isSelected
                    ? "border-[var(--color-brand-orange)] shadow-lg"
                    : isChecked
                    ? "border-green-200 bg-green-50/30"
                    : isLow
                    ? "border-red-200 bg-red-50"
                    : "border-transparent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Check status icon */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isChecked
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-400"
                    }`}>
                      {isChecked ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <CircleDot className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className={`text-lg font-bold min-w-[70px] text-center py-1 px-3 rounded-xl ${
                      isPlenty
                        ? "bg-orange-100 text-orange-700"
                        : isLow
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}>
                      {isPlenty ? "たくさん" : count}
                    </div>
                    <div className="flex-1">
                      <p className={`font-bold ${isChecked ? "text-green-800" : ""}`}>{mat.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {mat.unit}
                        {mat.reorder_threshold > 0 && (
                          <span className={isLow ? " text-red-500 font-bold" : ""}>
                            {" "}• 目安: {mat.reorder_threshold}
                          </span>
                        )}
                      </p>
                    </div>
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin text-orange-500" />}
                    {justSaved && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {filteredMaterials.length === 0 && (
            <div className="text-center py-12 text-[var(--color-text-muted)]">
              この場所には材料が登録されていません
            </div>
          )}
        </div>
      </div>

      {/* Complete button - shows when all checked */}
      {allChecked && !completed && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-4 left-4 right-4 z-50"
        >
          <button
            onClick={() => setShowCompleteModal(true)}
            className="w-full btn btn-primary py-4 text-lg shadow-2xl gap-2"
          >
            <Send className="w-5 h-5" />
            在庫チェック完了を報告する
          </button>
        </motion.div>
      )}

      {/* Complete confirmation modal */}
      <AnimatePresence>
        {showCompleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowCompleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h2 className="text-xl font-bold mb-2">チェック完了を報告しますか？</h2>
              <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                {totalProgress.total}件すべての材料をチェック済みです。管理者に結果を送信します。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCompleteModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleComplete}
                  disabled={completing}
                  className="btn btn-primary flex-1 gap-1.5"
                >
                  {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  報告する
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Numpad (sticky bottom) */}
      <AnimatePresence>
        {selectedMaterial && !allChecked && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[var(--color-border)] px-4 pt-4 pb-8 z-40 shadow-2xl"
            style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
          >
            {/* Selected material name */}
            <div className="text-center mb-3">
              <p className="text-sm font-bold text-[var(--color-text-secondary)]">
                {materials.find((m) => m.id === selectedMaterial)?.name}
              </p>
              <p className="text-3xl font-extrabold">
                {getIsPlenty(selectedMaterial) ? "たくさん ✨" : getCurrentCount(selectedMaterial)}
              </p>
            </div>

            {/* Numpad buttons */}
            <div className="grid grid-cols-4 gap-3">
              <button
                onClick={() => handleCountChange(selectedMaterial, -1)}
                className="numpad-btn numpad-minus"
              >
                <Minus className="w-5 h-5 mr-1" />
                1
              </button>
              <button
                onClick={() => handleCountChange(selectedMaterial, 1)}
                className="numpad-btn numpad-plus"
              >
                <Plus className="w-5 h-5 mr-1" />
                1
              </button>
              <button
                onClick={() => handleCountChange(selectedMaterial, 10)}
                className="numpad-btn numpad-plus-ten"
              >
                <Plus className="w-5 h-5 mr-1" />
                10
              </button>
              <button
                onClick={() => handleTogglePlenty(selectedMaterial)}
                className={`numpad-btn ${
                  getIsPlenty(selectedMaterial) ? "bg-gray-200 text-gray-600" : "numpad-plenty"
                }`}
              >
                <Sparkles className="w-5 h-5 mr-1" />
                たくさん
              </button>
            </div>

            {/* Quick set buttons */}
            <div className="flex gap-2 mt-3 overflow-x-auto">
              {[0, 1, 2, 3, 5, 10, 20, 50].map((n) => (
                <button
                  key={n}
                  onClick={() => handleSetCount(selectedMaterial, n)}
                  className="flex-shrink-0 px-4 py-2 rounded-xl bg-[var(--color-surface-dim)] text-sm font-bold hover:bg-gray-200 transition-colors"
                >
                  {n}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Numpad for when allChecked and material is selected */}
      <AnimatePresence>
        {selectedMaterial && allChecked && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-20 left-0 right-0 bg-white border-t-2 border-[var(--color-border)] px-4 pt-4 pb-4 z-30 shadow-2xl"
          >
            <div className="text-center mb-3">
              <p className="text-sm font-bold text-[var(--color-text-secondary)]">
                {materials.find((m) => m.id === selectedMaterial)?.name}
              </p>
              <p className="text-3xl font-extrabold">
                {getIsPlenty(selectedMaterial) ? "たくさん ✨" : getCurrentCount(selectedMaterial)}
              </p>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <button onClick={() => handleCountChange(selectedMaterial, -1)} className="numpad-btn numpad-minus">
                <Minus className="w-5 h-5 mr-1" />1
              </button>
              <button onClick={() => handleCountChange(selectedMaterial, 1)} className="numpad-btn numpad-plus">
                <Plus className="w-5 h-5 mr-1" />1
              </button>
              <button onClick={() => handleCountChange(selectedMaterial, 10)} className="numpad-btn numpad-plus-ten">
                <Plus className="w-5 h-5 mr-1" />10
              </button>
              <button
                onClick={() => handleTogglePlenty(selectedMaterial)}
                className={`numpad-btn ${getIsPlenty(selectedMaterial) ? "bg-gray-200 text-gray-600" : "numpad-plenty"}`}
              >
                <Sparkles className="w-5 h-5 mr-1" />たくさん
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function StaffInputPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-[var(--color-brand-orange)]" />
        </div>
      }
    >
      <StaffInputContent />
    </Suspense>
  );
}
