"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  getLocationsByToken,
  getMaterialsByToken,
  getInventoryByToken,
  updateInventory,
} from "@/app/actions";
import { ChefHat, Loader2, ArrowLeft, Check, Minus, Plus, Sparkles } from "lucide-react";
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
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [token, activeTab]);

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

    setSavingId(materialId);
    await updateInventory(token, materialId, staffName, count, false);
    setSavingId(null);
    setLastSaved(materialId);
    setTimeout(() => setLastSaved(null), 1500);
  };

  const filteredMaterials = materials.filter(
    (m) => m.location_id === activeTab || (!m.location_id && activeTab === "__none__")
  );

  // Materials without a location
  const hasUnassigned = materials.some((m) => !m.location_id);

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

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface-dim)] no-select">
      {/* Header */}
      <div className="bg-white border-b border-[var(--color-border)] px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={handleBack} className="p-2 -ml-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
          <ChefHat className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm leading-tight">在庫入力</p>
          <p className="text-xs text-[var(--color-text-muted)]">{staffName}</p>
        </div>
      </div>

      {/* Location Tabs */}
      <div className="bg-white border-b border-[var(--color-border)] overflow-x-auto sticky top-[57px] z-20">
        <div className="flex px-2 py-1 gap-1 min-w-max">
          {locations.map((loc) => (
            <button
              key={loc.id}
              onClick={() => setActiveTab(loc.id)}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === loc.id
                  ? "bg-[var(--color-brand-orange)] text-white shadow-sm"
                  : "text-[var(--color-text-secondary)] hover:bg-gray-100"
              }`}
            >
              {loc.name}
            </button>
          ))}
          {hasUnassigned && (
            <button
              onClick={() => setActiveTab("__none__")}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === "__none__"
                  ? "bg-[var(--color-brand-orange)] text-white"
                  : "text-[var(--color-text-secondary)] hover:bg-gray-100"
              }`}
            >
              未分類
            </button>
          )}
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
                    : isLow
                    ? "border-red-200 bg-red-50"
                    : "border-transparent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`text-lg font-bold min-w-[70px] text-center py-1 px-3 rounded-xl ${
                      isPlenty
                        ? "bg-orange-100 text-orange-700"
                        : isLow
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}>
                      {isPlenty ? "大量" : count}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">{mat.name}</p>
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
              この保管場所に材料がありません
            </div>
          )}
        </div>
      </div>

      {/* Custom Numpad (sticky bottom) */}
      <AnimatePresence>
        {selectedMaterial && (
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
                {getIsPlenty(selectedMaterial) ? "大量" : getCurrentCount(selectedMaterial)}
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
                大量
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
