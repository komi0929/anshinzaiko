"use client";

import { useEffect, useState } from "react";
import { getOrderAlerts, getMyStore, getOrderUrl } from "@/app/actions";
import { buildMailtoUrl } from "@/lib/utils";
import {
  AlertTriangle,
  ExternalLink,
  Mail,
  Package,
  ShoppingCart,
  TrendingDown,
  Loader2,
  ChefHat,
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

interface OrderAlertItem {
  material: {
    id: string;
    name: string;
    supplier_name: string;
    supplier_url: string;
    supplier_email: string;
    reorder_threshold: number;
    unit: string;
    purchase_price: number;
    category: string;
  };
  inventory: {
    current_count: number;
    is_plenty: boolean;
  } | null;
  deficit: number;
}

interface StoreData {
  id: string;
  name: string;
  staff_token: string;
}

// Determine button label from URL (client-side, no secrets involved)
function getButtonLabel(url: string): string {
  try {
    const u = new URL(url);
    if (
      u.hostname.includes("amazon.co.jp") ||
      u.hostname.includes("amazon.com") ||
      u.hostname.includes("amzn.to") ||
      u.hostname.includes("amzn.asia")
    )
      return "Amazonで発注する";
    if (u.hostname.includes("rakuten.co.jp")) return "楽天市場で発注する";
  } catch {
    // ignore
  }
  return "発注する";
}

export default function DashboardPage() {
  const [alerts, setAlerts] = useState<OrderAlertItem[]>([]);
  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [alertsData, storeData] = await Promise.all([
        getOrderAlerts(),
        getMyStore(),
      ]);
      setAlerts(alertsData as OrderAlertItem[]);
      setStore(storeData as StoreData | null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = async (alert: OrderAlertItem) => {
    const mat = alert.material;

    if (mat.supplier_url) {
      // Server-side URL rewriting (affiliate IDs never leave the server)
      const url = await getOrderUrl(mat.supplier_url);
      window.open(url, "_blank", "noopener,noreferrer");
    } else if (mat.supplier_email) {
      const mailtoUrl = buildMailtoUrl(
        mat.supplier_email,
        store?.name || "",
        mat.name,
        mat.reorder_threshold
      );
      window.location.href = mailtoUrl;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-brand-orange)]" />
      </div>
    );
  }

  const staffUrl = store
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/s/${store.staff_token}`
    : "";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">ホーム 🏠</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            {store?.name || "マイ店舗"} の在庫状況です
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-brand-orange)] to-[var(--color-brand-orange-dark)] flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Staff URL Card */}
      {store && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-5 bg-gradient-to-r from-orange-50 to-green-50 border-orange-200"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm">📱 スタッフ用のURL</h3>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 mb-2">
                このURLをスタッフに共有すると、ログインなしで在庫入力ができます。
              </p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-white/60 px-3 py-1.5 rounded-lg flex-1 truncate">
                  {staffUrl}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(staffUrl)}
                  className="btn btn-secondary text-xs px-3 py-1.5 flex-shrink-0"
                >
                  コピー
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Order Alerts */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          <h2 className="text-xl font-bold">そろそろ注文リスト</h2>
          {alerts.length > 0 && (
            <span className="badge badge-danger">{alerts.length}件</span>
          )}
        </div>

        {alerts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card p-12 text-center"
          >
            <div className="w-32 h-32 mx-auto mb-4 relative">
              <Image
                src="/images/empty_state.png"
                alt="No alerts"
                fill
                className="object-contain"
              />
            </div>
            <h3 className="text-lg font-bold mb-1">在庫はすべて足りています 🎉</h3>
            <p className="text-[var(--color-text-secondary)] text-sm">
              在庫が少なくなると、ここにお知らせが出ます
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert, i) => (
              <motion.div
                key={alert.material.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card p-4 flex items-center gap-4 hover:shadow-lg"
              >
                {/* Status indicator */}
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                  <TrendingDown className="w-6 h-6 text-red-500" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{alert.material.name}</h3>
                    <span className="badge badge-warning text-xs">
                      {alert.material.category}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    現在: <span className="font-bold text-red-600">
                      {alert.inventory?.current_count ?? 0}
                    </span>
                    {alert.material.unit} ／ 目安: {alert.material.reorder_threshold}{alert.material.unit}
                    {alert.material.supplier_name && (
                      <span className="ml-2">• {alert.material.supplier_name}</span>
                    )}
                  </p>
                </div>

                {/* Action button */}
                <div className="flex-shrink-0">
                  {alert.material.supplier_url ? (
                    <button
                      onClick={() => handleOrder(alert)}
                      className="btn btn-primary gap-1.5"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {getButtonLabel(alert.material.supplier_url)}
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  ) : alert.material.supplier_email ? (
                    <button
                      onClick={() => handleOrder(alert)}
                      className="btn btn-success gap-1.5"
                    >
                      <Mail className="w-4 h-4" />
                      メールで発注
                    </button>
                  ) : (
                    <span className="text-xs text-[var(--color-text-muted)]">
                      注文先が未登録です
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
