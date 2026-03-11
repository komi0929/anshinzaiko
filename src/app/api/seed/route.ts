import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Seed API Route - 一時的なダミーデータ投入用
 * ログイン済みユーザーの店舗にダミーデータを一括投入
 * 使い終わったらこのファイルを削除してください
 *
 * Usage: POST /api/seed
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "DB接続エラー" }, { status: 500 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "ログインしてください" }, { status: 401 });
  }

  // Get user's store
  const { data: admin } = await supabase
    .from("store_admins")
    .select("store_id")
    .eq("user_id", user.id)
    .single();

  if (!admin) {
    return NextResponse.json({ error: "店舗が見つかりません" }, { status: 404 });
  }

  const storeId = admin.store_id;

  try {
    // 1. Staff members
    const staffNames = ["田中さくら", "佐藤ゆい", "鈴木あおい"];
    for (let i = 0; i < staffNames.length; i++) {
      await supabase.from("staff_members").insert({
        store_id: storeId,
        name: staffNames[i],
        is_active: true,
        sort_order: i,
      });
    }

    // 2. Get existing locations (created during signup)
    const { data: locations } = await supabase
      .from("locations")
      .select("id, name")
      .eq("store_id", storeId)
      .order("sort_order");

    const locMap: Record<string, string> = {};
    locations?.forEach((l) => {
      locMap[l.name] = l.id;
    });

    // 3. Materials (15 items) - with realistic supplier info
    const materialsData = [
      { name: "薄力粉 (1kg)", category: "食材", location: "乾物棚", supplier_name: "Amazon", supplier_url: "https://www.amazon.co.jp/dp/B08N5WRWNW", purchase_price: 350, units_per_purchase: 1, content_amount: 1000, unit: "g", shipping_cost: 0, reorder_threshold: 3 },
      { name: "無塩バター (450g)", category: "食材", location: "冷蔵庫A", supplier_name: "Amazon", supplier_url: "https://www.amazon.co.jp/dp/B01MXLZ45N", purchase_price: 780, units_per_purchase: 1, content_amount: 450, unit: "g", shipping_cost: 0, reorder_threshold: 4 },
      { name: "グラニュー糖 (1kg)", category: "食材", location: "乾物棚", supplier_name: "楽天市場", supplier_url: "https://item.rakuten.co.jp/tomizawa/00220201/", purchase_price: 420, units_per_purchase: 1, content_amount: 1000, unit: "g", shipping_cost: 0, reorder_threshold: 2 },
      { name: "卵 (10個入)", category: "食材", location: "冷蔵庫A", supplier_name: "近所のスーパー", supplier_url: "", purchase_price: 280, units_per_purchase: 1, content_amount: 10, unit: "個", shipping_cost: 0, reorder_threshold: 3 },
      { name: "牛乳 (1L)", category: "食材", location: "冷蔵庫A", supplier_name: "近所のスーパー", supplier_url: "", purchase_price: 220, units_per_purchase: 1, content_amount: 1000, unit: "ml", shipping_cost: 0, reorder_threshold: 3 },
      { name: "生クリーム (200ml)", category: "食材", location: "冷蔵庫B", supplier_name: "Amazon", supplier_url: "https://www.amazon.co.jp/dp/B01N2GE6LI", purchase_price: 380, units_per_purchase: 1, content_amount: 200, unit: "ml", shipping_cost: 0, reorder_threshold: 5 },
      { name: "チョコレート (1kg)", category: "食材", location: "乾物棚", supplier_name: "楽天市場", supplier_url: "https://item.rakuten.co.jp/tomizawa/00652101/", purchase_price: 2200, units_per_purchase: 1, content_amount: 1000, unit: "g", shipping_cost: 0, reorder_threshold: 2 },
      { name: "バニラエッセンス (30ml)", category: "食材", location: "乾物棚", supplier_name: "Amazon", supplier_url: "https://www.amazon.co.jp/dp/B004L29SBQ", purchase_price: 450, units_per_purchase: 1, content_amount: 30, unit: "ml", shipping_cost: 0, reorder_threshold: 2 },
      { name: "ベーキングパウダー (100g)", category: "食材", location: "乾物棚", supplier_name: "Amazon", supplier_url: "https://www.amazon.co.jp/dp/B000JUSF82", purchase_price: 320, units_per_purchase: 1, content_amount: 100, unit: "g", shipping_cost: 0, reorder_threshold: 2 },
      { name: "いちご (1パック)", category: "食材", location: "冷蔵庫B", supplier_name: "フルーツ山田", supplier_email: "info@fruits-yamada.example.com", purchase_price: 600, units_per_purchase: 1, content_amount: 15, unit: "個", shipping_cost: 0, reorder_threshold: 3 },
      { name: "ブルーベリー (100g)", category: "食材", location: "冷凍庫", supplier_name: "Amazon", supplier_url: "https://www.amazon.co.jp/dp/B07H8VGBKV", purchase_price: 480, units_per_purchase: 1, content_amount: 100, unit: "g", shipping_cost: 0, reorder_threshold: 3 },
      { name: "アーモンドプードル (200g)", category: "食材", location: "乾物棚", supplier_name: "楽天市場", supplier_url: "https://item.rakuten.co.jp/tomizawa/00070902/", purchase_price: 680, units_per_purchase: 1, content_amount: 200, unit: "g", shipping_cost: 0, reorder_threshold: 2 },
      { name: "ラッピング袋 (50枚)", category: "資材", location: "その他", supplier_name: "Amazon", supplier_url: "https://www.amazon.co.jp/dp/B0BT4KXRGH", purchase_price: 980, units_per_purchase: 50, content_amount: 1, unit: "枚", shipping_cost: 0, reorder_threshold: 2 },
      { name: "ギフト箱 (10枚)", category: "資材", location: "その他", supplier_name: "楽天市場", supplier_url: "https://item.rakuten.co.jp/wrapping/giftbox-10/", purchase_price: 1500, units_per_purchase: 10, content_amount: 1, unit: "枚", shipping_cost: 500, reorder_threshold: 1 },
      { name: "紙ナプキン (100枚)", category: "資材", location: "その他", supplier_name: "Amazon", supplier_url: "https://www.amazon.co.jp/dp/B09HGCBTVV", purchase_price: 450, units_per_purchase: 100, content_amount: 1, unit: "枚", shipping_cost: 0, reorder_threshold: 1 },
    ];

    const materialIds: Record<string, string> = {};

    for (const m of materialsData) {
      const { data: inserted } = await supabase
        .from("materials")
        .insert({
          store_id: storeId,
          name: m.name,
          category: m.category,
          location_id: locMap[m.location] || null,
          supplier_name: m.supplier_name,
          supplier_url: m.supplier_url || "",
          supplier_email: (m as Record<string, unknown>).supplier_email as string || "",
          purchase_price: m.purchase_price,
          units_per_purchase: m.units_per_purchase,
          content_amount: m.content_amount,
          unit: m.unit,
          shipping_cost: m.shipping_cost,
          reorder_threshold: m.reorder_threshold,
        })
        .select("id")
        .single();

      if (inserted) {
        materialIds[m.name] = inserted.id;
      }
    }

    // 4. Products (5 items)
    const productsData = [
      { name: "ショートケーキ", selling_price: 580, recipe: [
        { material: "薄力粉 (1kg)", qty: 80 },
        { material: "無塩バター (450g)", qty: 30 },
        { material: "グラニュー糖 (1kg)", qty: 60 },
        { material: "卵 (10個入)", qty: 3 },
        { material: "生クリーム (200ml)", qty: 100 },
        { material: "いちご (1パック)", qty: 3 },
      ]},
      { name: "チョコレートケーキ", selling_price: 620, recipe: [
        { material: "薄力粉 (1kg)", qty: 70 },
        { material: "無塩バター (450g)", qty: 50 },
        { material: "グラニュー糖 (1kg)", qty: 80 },
        { material: "卵 (10個入)", qty: 3 },
        { material: "チョコレート (1kg)", qty: 150 },
        { material: "生クリーム (200ml)", qty: 80 },
      ]},
      { name: "マカロン (6個入)", selling_price: 1200, recipe: [
        { material: "アーモンドプードル (200g)", qty: 100 },
        { material: "グラニュー糖 (1kg)", qty: 100 },
        { material: "卵 (10個入)", qty: 2 },
        { material: "無塩バター (450g)", qty: 30 },
      ]},
      { name: "クッキー詰合せ", selling_price: 800, recipe: [
        { material: "薄力粉 (1kg)", qty: 200 },
        { material: "無塩バター (450g)", qty: 100 },
        { material: "グラニュー糖 (1kg)", qty: 80 },
        { material: "卵 (10個入)", qty: 1 },
        { material: "バニラエッセンス (30ml)", qty: 2 },
      ]},
      { name: "フルーツタルト", selling_price: 680, recipe: [
        { material: "薄力粉 (1kg)", qty: 120 },
        { material: "無塩バター (450g)", qty: 60 },
        { material: "グラニュー糖 (1kg)", qty: 50 },
        { material: "卵 (10個入)", qty: 2 },
        { material: "生クリーム (200ml)", qty: 60 },
        { material: "いちご (1パック)", qty: 4 },
        { material: "ブルーベリー (100g)", qty: 30 },
      ]},
    ];

    for (const p of productsData) {
      const { data: product } = await supabase
        .from("products")
        .insert({
          store_id: storeId,
          name: p.name,
          selling_price: p.selling_price,
        })
        .select("id")
        .single();

      if (product) {
        for (const r of p.recipe) {
          const matId = materialIds[r.material];
          if (matId) {
            await supabase.from("recipe_items").insert({
              product_id: product.id,
              material_id: matId,
              quantity: r.qty,
            });
          }
        }
      }
    }

    // 5. Inventory - some below threshold to trigger alerts
    const inventoryData = [
      { name: "薄力粉 (1kg)", count: 5, is_plenty: false },
      { name: "無塩バター (450g)", count: 2, is_plenty: false }, // ← below threshold(4)
      { name: "グラニュー糖 (1kg)", count: 4, is_plenty: false },
      { name: "卵 (10個入)", count: 2, is_plenty: false }, // ← below threshold(3)
      { name: "牛乳 (1L)", count: 1, is_plenty: false }, // ← below threshold(3)
      { name: "生クリーム (200ml)", count: 3, is_plenty: false }, // ← below threshold(5)
      { name: "チョコレート (1kg)", count: 3, is_plenty: false },
      { name: "バニラエッセンス (30ml)", count: 3, is_plenty: false },
      { name: "ベーキングパウダー (100g)", count: 4, is_plenty: false },
      { name: "いちご (1パック)", count: 1, is_plenty: false }, // ← below threshold(3)
      { name: "ブルーベリー (100g)", count: 5, is_plenty: true },
      { name: "アーモンドプードル (200g)", count: 3, is_plenty: false },
      { name: "ラッピング袋 (50枚)", count: 3, is_plenty: false },
      { name: "ギフト箱 (10枚)", count: 0, is_plenty: false }, // ← below threshold(1)
      { name: "紙ナプキン (100枚)", count: 2, is_plenty: false },
    ];

    for (const inv of inventoryData) {
      const matId = materialIds[inv.name];
      if (matId) {
        await supabase.from("inventory").upsert({
          store_id: storeId,
          material_id: matId,
          current_count: inv.count,
          is_plenty: inv.is_plenty,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "store_id,material_id",
        });
      }
    }

    // 6. Some inventory logs for realism
    const logEntries = [
      { material: "薄力粉 (1kg)", staff: "田中さくら", prev: 7, new_count: 5 },
      { material: "無塩バター (450g)", staff: "佐藤ゆい", prev: 5, new_count: 2 },
      { material: "卵 (10個入)", staff: "田中さくら", prev: 6, new_count: 2 },
      { material: "生クリーム (200ml)", staff: "鈴木あおい", prev: 8, new_count: 3 },
      { material: "いちご (1パック)", staff: "佐藤ゆい", prev: 4, new_count: 1 },
      { material: "ギフト箱 (10枚)", staff: "田中さくら", prev: 2, new_count: 0 },
    ];

    for (const log of logEntries) {
      const matId = materialIds[log.material];
      if (matId) {
        await supabase.from("inventory_logs").insert({
          store_id: storeId,
          material_id: matId,
          staff_name: log.staff,
          previous_count: log.prev,
          new_count: log.new_count,
          is_plenty: false,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "ダミーデータを投入しました！",
      summary: {
        staff: staffNames.length,
        materials: materialsData.length,
        products: productsData.length,
        inventory: inventoryData.length,
        logs: logEntries.length,
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "データ投入中にエラーが発生しました", details: String(error) },
      { status: 500 }
    );
  }
}
