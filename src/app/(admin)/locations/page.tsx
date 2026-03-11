"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getLocations, createLocation, deleteLocation, uploadLocationImage } from "@/app/actions";
import { Plus, Trash2, MapPin, Loader2, Camera, X, ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface LocationData {
  id: string;
  name: string;
  sort_order: number;
  image_url?: string;
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedLocId, setSelectedLocId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await getLocations();
    setLocations(data as LocationData[]);
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

  const handlePhotoClick = (locId: string) => {
    setSelectedLocId(locId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedLocId) return;

    // Validate
    if (!file.type.startsWith("image/")) {
      alert("画像ファイルを選択してください");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("5MB以下の画像を選択してください");
      return;
    }

    setUploadingId(selectedLocId);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      await uploadLocationImage(selectedLocId!, base64, file.name);
      await loadData();
      setUploadingId(null);
      setSelectedLocId(null);
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = "";
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
          材料の保管場所を管理できます。写真を登録するとスタッフ画面でも確認できます。
        </p>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-3">
          <input
            className="input flex-1"
            placeholder="場所の名前（例: 冷蔵庫C）"
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

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {locations.map((loc, i) => (
          <motion.div
            key={loc.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card overflow-hidden"
          >
            {/* Photo area */}
            <div className="relative group">
              {loc.image_url ? (
                <div className="relative h-40 bg-gray-100">
                  <Image
                    src={loc.image_url}
                    alt={loc.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => handlePhotoClick(loc.id)}
                      disabled={uploadingId === loc.id}
                      className="text-white flex items-center gap-2 bg-black/30 px-4 py-2 rounded-xl backdrop-blur-sm"
                    >
                      {uploadingId === loc.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                      写真を変更
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handlePhotoClick(loc.id)}
                  disabled={uploadingId === loc.id}
                  className="w-full h-32 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 hover:border-[var(--color-brand-orange)] hover:bg-orange-50/30 transition-all"
                >
                  {uploadingId === loc.id ? (
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--color-brand-orange)]" />
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-gray-300" />
                      <span className="text-xs text-[var(--color-text-muted)]">タップで写真を追加</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Info */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-bold">{loc.name}</span>
              </div>
              <button
                onClick={() => handleDelete(loc.id)}
                className="p-2 rounded-lg hover:bg-red-50 text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {locations.length === 0 && (
        <div className="card p-12 text-center text-[var(--color-text-muted)]">
          まだ保管場所が登録されていません
        </div>
      )}
    </div>
  );
}
