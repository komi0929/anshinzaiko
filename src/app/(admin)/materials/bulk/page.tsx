"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getMaterials, getLocations, bulkUpsertMaterials, deleteMaterial } from "@/app/actions";
import { Save, Plus, Trash2, Loader2, ArrowLeft, FileSpreadsheet, Edit3 } from "lucide-react";
import Link from "next/link";

interface LocationData {
  id: string;
  name: string;
}

interface MaterialRow {
  id?: string; // existing material ID (empty for new rows)
  name: string;
  category: string;
  location_id: string;
  supplier_name: string;
  purchase_price: string;
  units_per_purchase: string;
  content_amount: string;
  unit: string;
  shipping_cost: string;
  reorder_threshold: string;
  _dirty: boolean; // locally modified
  _isNew: boolean;
}

const COLUMNS = [
  { key: "name", label: "材料名", width: "180px", required: true },
  { key: "category", label: "カテゴリ", width: "120px" },
  { key: "location_id", label: "保管場所", width: "130px", type: "select" },
  { key: "supplier_name", label: "仕入先", width: "130px" },
  { key: "purchase_price", label: "仕入価格(税込)", width: "120px", type: "number" },
  { key: "units_per_purchase", label: "入数", width: "80px", type: "number" },
  { key: "content_amount", label: "内容量", width: "80px", type: "number" },
  { key: "unit", label: "単位", width: "70px" },
  { key: "shipping_cost", label: "送料", width: "90px", type: "number" },
  { key: "reorder_threshold", label: "発注点", width: "80px", type: "number" },
];

function emptyRow(): MaterialRow {
  return {
    name: "",
    category: "",
    location_id: "",
    supplier_name: "",
    purchase_price: "",
    units_per_purchase: "1",
    content_amount: "1",
    unit: "個",
    shipping_cost: "0",
    reorder_threshold: "0",
    _dirty: false,
    _isNew: true,
  };
}

export default function BulkMaterialsPage() {
  const [rows, setRows] = useState<MaterialRow[]>([]);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [mats, locs] = await Promise.all([getMaterials(), getLocations()]);
    setLocations(locs as LocationData[]);

    if (mode === "edit") {
      // Load existing materials into the grid
      const existingRows: MaterialRow[] = (mats as Record<string, unknown>[]).map((m) => ({
        id: m.id as string,
        name: (m.name as string) || "",
        category: (m.category as string) || "",
        location_id: (m.location_id as string) || "",
        supplier_name: (m.supplier_name as string) || "",
        purchase_price: String(m.purchase_price || ""),
        units_per_purchase: String(m.units_per_purchase || "1"),
        content_amount: String(m.content_amount || "1"),
        unit: (m.unit as string) || "個",
        shipping_cost: String(m.shipping_cost || "0"),
        reorder_threshold: String(m.reorder_threshold || "0"),
        _dirty: false,
        _isNew: false,
      }));
      // Add a few empty rows at the bottom for adding new ones
      for (let i = 0; i < 5; i++) existingRows.push(emptyRow());
      setRows(existingRows);
    } else {
      // Fresh bulk add: start with 10 empty rows
      setRows(Array.from({ length: 10 }, () => emptyRow()));
    }
    setLoading(false);
  }, [mode]);

  useEffect(() => { loadData(); }, [loadData]);

  const updateCell = (rowIdx: number, key: string, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[rowIdx] = { ...next[rowIdx], [key]: value, _dirty: true };
      return next;
    });
    // Auto-save to localStorage
    setTimeout(() => {
      try {
        localStorage.setItem("anshinzaiko_bulk_draft", JSON.stringify(rows));
      } catch { /* ignore */ }
    }, 100);
  };

  const addRows = (count: number) => {
    setRows((prev) => [...prev, ...Array.from({ length: count }, () => emptyRow())]);
  };

  const deleteRow = async (rowIdx: number) => {
    const row = rows[rowIdx];
    if (row.id) {
      // Delete from DB
      if (!confirm(`「${row.name}」を削除しますか？`)) return;
      await deleteMaterial(row.id);
    }
    setRows((prev) => prev.filter((_, i) => i !== rowIdx));
  };

  const handleSave = async () => {
    // Filter only dirty rows with a name
    const dirtyRows = rows.filter((r) => r._dirty && r.name.trim());
    if (dirtyRows.length === 0) {
      setMessage("変更がありません");
      setTimeout(() => setMessage(null), 2000);
      return;
    }

    setSaving(true);
    const result = await bulkUpsertMaterials(
      dirtyRows.map((r) => ({
        id: r.id || undefined,
        name: r.name.trim(),
        category: r.category,
        location_id: r.location_id || null,
        supplier_name: r.supplier_name,
        purchase_price: Number(r.purchase_price) || 0,
        units_per_purchase: Number(r.units_per_purchase) || 1,
        content_amount: Number(r.content_amount) || 1,
        unit: r.unit || "個",
        shipping_cost: Number(r.shipping_cost) || 0,
        reorder_threshold: Number(r.reorder_threshold) || 0,
      }))
    );

    setSaving(false);
    if (result.success) {
      const res = result as { inserted?: number; updated?: number };
      setMessage(`保存完了！ 新規${res.inserted || 0}件 / 更新${res.updated || 0}件`);
      localStorage.removeItem("anshinzaiko_bulk_draft");
      await loadData();
    } else {
      setMessage(`エラー: ${result.error}`);
    }
    setTimeout(() => setMessage(null), 3000);
  };

  // Handle paste from Excel/Sheets (tab-separated)
  const handlePaste = (e: React.ClipboardEvent, rowIdx: number, colIdx: number) => {
    const text = e.clipboardData.getData("text/plain");
    if (!text.includes("\t") && !text.includes("\n")) return; // Single cell paste, let default work

    e.preventDefault();
    const pasteRows = text.split("\n").filter((l) => l.trim());

    setRows((prev) => {
      const next = [...prev];
      // Possibly need to add rows
      const neededRows = rowIdx + pasteRows.length;
      while (next.length < neededRows) {
        next.push(emptyRow());
      }

      for (let ri = 0; ri < pasteRows.length; ri++) {
        const cells = pasteRows[ri].split("\t");
        for (let ci = 0; ci < cells.length; ci++) {
          const targetCol = colIdx + ci;
          if (targetCol >= COLUMNS.length) break;
          const colKey = COLUMNS[targetCol].key;
          const targetRow = rowIdx + ri;
          next[targetRow] = { ...next[targetRow], [colKey]: cells[ci].trim(), _dirty: true };
        }
      }
      return next;
    });
  };

  // Keyboard navigation (arrow keys between cells)
  const handleKeyDown = (e: React.KeyboardEvent, rowIdx: number, colIdx: number) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const nextCol = e.shiftKey ? colIdx - 1 : colIdx + 1;
      if (nextCol >= 0 && nextCol < COLUMNS.length) {
        setFocusedCell({ row: rowIdx, col: nextCol });
      } else if (nextCol >= COLUMNS.length) {
        // Move to next row
        if (rowIdx + 1 < rows.length) {
          setFocusedCell({ row: rowIdx + 1, col: 0 });
        }
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (rowIdx + 1 < rows.length) {
        setFocusedCell({ row: rowIdx + 1, col: colIdx });
      }
    } else if (e.key === "ArrowDown" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (rowIdx + 1 < rows.length) setFocusedCell({ row: rowIdx + 1, col: colIdx });
    } else if (e.key === "ArrowUp" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (rowIdx > 0) setFocusedCell({ row: rowIdx - 1, col: colIdx });
    }
  };

  // Focus management
  useEffect(() => {
    if (focusedCell && tableRef.current) {
      const input = tableRef.current.querySelector(
        `[data-row="${focusedCell.row}"][data-col="${focusedCell.col}"]`
      ) as HTMLInputElement | HTMLSelectElement;
      if (input) {
        input.focus();
        if (input instanceof HTMLInputElement) input.select();
      }
    }
  }, [focusedCell]);

  const dirtyCount = rows.filter((r) => r._dirty && r.name.trim()).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-brand-orange)]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link href="/materials" className="btn btn-secondary p-2">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-[var(--color-brand-orange)]" />
              材料 一括{mode === "edit" ? "編集" : "登録"}
            </h1>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Excelからコピペで一括入力。Tab/Enterでセル移動。
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Mode Toggle */}
          <div className="flex bg-[var(--color-surface-dim)] rounded-xl p-1">
            <button
              onClick={() => setMode("add")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                mode === "add" ? "bg-white shadow text-[var(--color-brand-orange)]" : "text-[var(--color-text-muted)]"
              }`}
            >
              <Plus className="w-4 h-4 inline mr-1" />
              一括登録
            </button>
            <button
              onClick={() => setMode("edit")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                mode === "edit" ? "bg-white shadow text-[var(--color-brand-orange)]" : "text-[var(--color-text-muted)]"
              }`}
            >
              <Edit3 className="w-4 h-4 inline mr-1" />
              一括編集
            </button>
          </div>

          {dirtyCount > 0 && (
            <span className="text-xs text-[var(--color-text-muted)] bg-orange-100 px-3 py-1.5 rounded-full font-bold">
              {dirtyCount}件の変更あり
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || dirtyCount === 0}
            className="btn btn-primary gap-1.5"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            一括保存
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
          message.includes("エラー") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
        }`}>
          {message}
        </div>
      )}

      {/* Spreadsheet */}
      <div ref={tableRef} className="overflow-x-auto bg-white rounded-2xl border border-[var(--color-border)] shadow-sm">
        <table className="w-full border-collapse" style={{ minWidth: "1200px" }}>
          <thead>
            <tr className="bg-[var(--color-surface-dim)] border-b-2 border-[var(--color-border)]">
              <th className="w-10 px-2 py-3 text-center text-xs font-bold text-[var(--color-text-muted)] sticky left-0 bg-[var(--color-surface-dim)]">
                #
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="px-1 py-3 text-left text-xs font-bold text-[var(--color-text-secondary)] whitespace-nowrap"
                  style={{ minWidth: col.width }}
                >
                  {col.label}
                  {col.required && <span className="text-red-400 ml-0.5">*</span>}
                </th>
              ))}
              <th className="w-10 px-2 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr
                key={ri}
                className={`border-b border-[var(--color-border)] hover:bg-orange-50/30 transition-colors ${
                  row._dirty ? "bg-orange-50/50" : ""
                } ${row.id && !row._isNew ? "" : "bg-blue-50/20"}`}
              >
                <td className="px-2 py-1 text-center text-xs text-[var(--color-text-muted)] font-mono sticky left-0 bg-white border-r border-[var(--color-border)]">
                  {ri + 1}
                </td>
                {COLUMNS.map((col, ci) => (
                  <td key={col.key} className="px-0.5 py-0.5">
                    {col.type === "select" && col.key === "location_id" ? (
                      <select
                        data-row={ri}
                        data-col={ci}
                        className="w-full px-2 py-2 text-sm border-0 bg-transparent focus:bg-white focus:ring-2 focus:ring-[var(--color-brand-orange)] rounded outline-none"
                        value={row.location_id}
                        onChange={(e) => updateCell(ri, col.key, e.target.value)}
                        onFocus={() => setFocusedCell({ row: ri, col: ci })}
                        onKeyDown={(e) => handleKeyDown(e, ri, ci)}
                      >
                        <option value="">-</option>
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        data-row={ri}
                        data-col={ci}
                        type={col.type === "number" ? "text" : "text"}
                        inputMode={col.type === "number" ? "decimal" : "text"}
                        className={`w-full px-2 py-2 text-sm border-0 bg-transparent focus:bg-white focus:ring-2 focus:ring-[var(--color-brand-orange)] rounded outline-none ${
                          col.type === "number" ? "text-right font-mono" : ""
                        } ${col.required && !row[col.key as keyof MaterialRow] && row._dirty ? "bg-red-50" : ""}`}
                        value={row[col.key as keyof MaterialRow] as string}
                        onChange={(e) => updateCell(ri, col.key, e.target.value)}
                        onPaste={(e) => handlePaste(e, ri, ci)}
                        onFocus={() => setFocusedCell({ row: ri, col: ci })}
                        onKeyDown={(e) => handleKeyDown(e, ri, ci)}
                        placeholder={col.type === "number" ? "0" : ""}
                      />
                    )}
                  </td>
                ))}
                <td className="px-1 py-1">
                  <button
                    onClick={() => deleteRow(ri)}
                    className="p-1.5 rounded hover:bg-red-100 text-gray-300 hover:text-red-500 transition-colors"
                    title="行を削除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button onClick={() => addRows(5)} className="btn btn-secondary text-sm gap-1">
            <Plus className="w-3.5 h-3.5" /> 5行追加
          </button>
          <button onClick={() => addRows(20)} className="btn btn-secondary text-sm gap-1">
            <Plus className="w-3.5 h-3.5" /> 20行追加
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || dirtyCount === 0}
          className="btn btn-primary gap-1.5"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          一括保存 {dirtyCount > 0 && `(${dirtyCount}件)`}
        </button>
      </div>

      {/* Usage tips */}
      <div className="card p-4 bg-blue-50/50 border-blue-100">
        <p className="text-sm font-bold mb-2">💡 使い方</p>
        <ul className="text-xs text-[var(--color-text-secondary)] space-y-1">
          <li>• <strong>Excelからコピペ</strong>: 複数セルを選択してコピー → ここに貼り付けると一括入力</li>
          <li>• <strong>Tab</strong>: 次のセルへ移動 / <strong>Shift+Tab</strong>: 前のセルへ</li>
          <li>• <strong>Enter</strong>: 次の行へ移動</li>
          <li>• <strong>一括編集モード</strong>: 既存データも含めて編集可能</li>
          <li>• 入力内容は<strong>自動で一時保存</strong>されます</li>
        </ul>
      </div>
    </div>
  );
}
