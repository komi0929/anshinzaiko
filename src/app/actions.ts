"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// ============================================
// Helper: get current user's store
// ============================================
export async function getMyStore() {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: admin } = await supabase
    .from("store_admins")
    .select("store_id")
    .eq("user_id", user.id)
    .single();

  if (!admin) return null;

  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("id", admin.store_id)
    .single();

  return store;
}

// ============================================
// Materials CRUD
// ============================================
export async function getMaterials() {
  const supabase = await createClient();
  if (!supabase) return [];
  const store = await getMyStore();
  if (!store) return [];

  const { data } = await supabase
    .from("materials")
    .select("*, location:locations(*)")
    .eq("store_id", store.id)
    .order("name");

  return data || [];
}

export async function createMaterial(formData: {
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
}) {
  const supabase = await createClient();
  if (!supabase) return { success: false, error: "Not authenticated" };
  const store = await getMyStore();
  if (!store) return { success: false, error: "Store not found" };

  const { error } = await supabase.from("materials").insert({
    store_id: store.id,
    ...formData,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateMaterial(id: string, formData: Record<string, unknown>) {
  const supabase = await createClient();
  if (!supabase) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("materials")
    .update(formData)
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteMaterial(id: string) {
  const supabase = await createClient();
  if (!supabase) return { success: false, error: "Not authenticated" };

  const { error } = await supabase.from("materials").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ============================================
// Products CRUD
// ============================================
export async function getProducts() {
  const supabase = await createClient();
  if (!supabase) return [];
  const store = await getMyStore();
  if (!store) return [];

  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", store.id)
    .order("name");

  return data || [];
}

export async function getProductWithRecipe(productId: string) {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (!product) return null;

  const { data: recipeItems } = await supabase
    .from("recipe_items")
    .select("*")
    .eq("product_id", productId);

  // Fetch material references
  const materialIds = (recipeItems || [])
    .filter((r: { material_id: string | null }) => r.material_id)
    .map((r: { material_id: string | null }) => r.material_id);

  const subProductIds = (recipeItems || [])
    .filter((r: { sub_product_id: string | null }) => r.sub_product_id)
    .map((r: { sub_product_id: string | null }) => r.sub_product_id);

  let materials: Record<string, unknown>[] = [];
  let subProducts: Record<string, unknown>[] = [];

  if (materialIds.length > 0) {
    const { data } = await supabase
      .from("materials")
      .select("*")
      .in("id", materialIds);
    materials = data || [];
  }

  if (subProductIds.length > 0) {
    const { data } = await supabase
      .from("products")
      .select("*")
      .in("id", subProductIds);
    subProducts = data || [];
  }

  const enrichedItems = (recipeItems || []).map((item: Record<string, unknown>) => ({
    ...item,
    material: materials.find((m: Record<string, unknown>) => m.id === item.material_id) || null,
    sub_product: subProducts.find((p: Record<string, unknown>) => p.id === item.sub_product_id) || null,
  }));

  return { ...product, recipe_items: enrichedItems };
}

export async function createProduct(formData: {
  name: string;
  selling_price: number;
  image_url?: string;
}) {
  const supabase = await createClient();
  if (!supabase) return { success: false, error: "Not authenticated" };
  const store = await getMyStore();
  if (!store) return { success: false, error: "Store not found" };

  const { data, error } = await supabase
    .from("products")
    .insert({ store_id: store.id, ...formData })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function updateProduct(id: string, formData: Record<string, unknown>) {
  const supabase = await createClient();
  if (!supabase) return { success: false, error: "Not authenticated" };

  const { error } = await supabase.from("products").update(formData).eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();
  if (!supabase) return { success: false, error: "Not authenticated" };

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ============================================
// Recipe Items
// ============================================
export async function addRecipeItem(productId: string, data: {
  material_id?: string | null;
  sub_product_id?: string | null;
  quantity: number;
}) {
  const supabase = await createClient();
  if (!supabase) return { success: false, error: "Not authenticated" };

  const { error } = await supabase.from("recipe_items").insert({
    product_id: productId,
    material_id: data.material_id || null,
    sub_product_id: data.sub_product_id || null,
    quantity: data.quantity,
  });

  if (error) return { success: false, error: error.message };

  // Recalculate cost
  await recalculateProductCost(productId);
  return { success: true };
}

export async function removeRecipeItem(recipeItemId: string, productId: string) {
  const supabase = await createClient();
  if (!supabase) return { success: false, error: "Not authenticated" };

  const { error } = await supabase.from("recipe_items").delete().eq("id", recipeItemId);
  if (error) return { success: false, error: error.message };

  await recalculateProductCost(productId);
  return { success: true };
}

// ============================================
// Recursive Cost Calculation Engine
// ============================================
export async function recalculateProductCost(productId: string, visited: Set<string> = new Set()) {
  if (visited.has(productId)) return 0; // Circular reference guard
  visited.add(productId);

  const supabase = await createClient();
  if (!supabase) return 0;

  const { data: recipeItems } = await supabase
    .from("recipe_items")
    .select("*")
    .eq("product_id", productId);

  if (!recipeItems || recipeItems.length === 0) {
    await supabase.from("products").update({ total_cost: 0, cost_ratio: 0 }).eq("id", productId);
    return 0;
  }

  let totalCost = 0;

  for (const item of recipeItems) {
    if (item.material_id) {
      // Material-based: unit_cost * quantity
      const { data: material } = await supabase
        .from("materials")
        .select("unit_cost")
        .eq("id", item.material_id)
        .single();
      if (material) {
        totalCost += Number(material.unit_cost) * Number(item.quantity);
      }
    } else if (item.sub_product_id) {
      // Sub-product: recursive calculation
      const subCost = await recalculateProductCost(item.sub_product_id, new Set(visited));
      totalCost += subCost * Number(item.quantity);
    }
  }

  // Update product
  const { data: product } = await supabase
    .from("products")
    .select("selling_price")
    .eq("id", productId)
    .single();

  const sellingPrice = product ? Number(product.selling_price) : 0;
  const costRatio = sellingPrice > 0 ? (totalCost / sellingPrice) * 100 : 0;

  await supabase
    .from("products")
    .update({
      total_cost: Math.round(totalCost * 10000) / 10000,
      cost_ratio: Math.round(costRatio * 100) / 100,
    })
    .eq("id", productId);

  return totalCost;
}

// ============================================
// Locations CRUD
// ============================================
export async function getLocations() {
  const supabase = await createClient();
  if (!supabase) return [];
  const store = await getMyStore();
  if (!store) return [];

  const { data } = await supabase
    .from("locations")
    .select("*")
    .eq("store_id", store.id)
    .order("sort_order");

  return data || [];
}

export async function createLocation(name: string) {
  const supabase = await createClient();
  if (!supabase) return { success: false, error: "Not authenticated" };
  const store = await getMyStore();
  if (!store) return { success: false, error: "Store not found" };

  const { error } = await supabase.from("locations").insert({
    store_id: store.id,
    name,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteLocation(id: string) {
  const supabase = await createClient();
  if (!supabase) return { success: false, error: "Not authenticated" };

  const { error } = await supabase.from("locations").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ============================================
// Staff Members CRUD
// ============================================
export async function getStaffMembers() {
  const supabase = await createClient();
  if (!supabase) return [];
  const store = await getMyStore();
  if (!store) return [];

  const { data } = await supabase
    .from("staff_members")
    .select("*")
    .eq("store_id", store.id)
    .order("sort_order");

  return data || [];
}

export async function createStaffMember(name: string) {
  const supabase = await createClient();
  if (!supabase) return { success: false, error: "Not authenticated" };
  const store = await getMyStore();
  if (!store) return { success: false, error: "Store not found" };

  const { error } = await supabase.from("staff_members").insert({
    store_id: store.id,
    name,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteStaffMember(id: string) {
  const supabase = await createClient();
  if (!supabase) return { success: false, error: "Not authenticated" };

  const { error } = await supabase.from("staff_members").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ============================================
// Inventory (read from admin)
// ============================================
export async function getInventoryWithMaterials() {
  const supabase = await createClient();
  if (!supabase) return [];
  const store = await getMyStore();
  if (!store) return [];

  // Get all materials with their inventory
  const { data: materials } = await supabase
    .from("materials")
    .select("*, location:locations(*)")
    .eq("store_id", store.id)
    .order("name");

  const { data: inventories } = await supabase
    .from("inventory")
    .select("*")
    .eq("store_id", store.id);

  const inventoryMap = new Map(
    (inventories || []).map((inv: Record<string, unknown>) => [inv.material_id, inv])
  );

  return (materials || []).map((mat: Record<string, unknown>) => ({
    material: mat,
    inventory: inventoryMap.get(mat.id) || null,
  }));
}

export async function getOrderAlerts() {
  const supabase = await createClient();
  if (!supabase) return [];
  const store = await getMyStore();
  if (!store) return [];

  const { data: materials } = await supabase
    .from("materials")
    .select("*, location:locations(*)")
    .eq("store_id", store.id)
    .gt("reorder_threshold", 0);

  const { data: inventories } = await supabase
    .from("inventory")
    .select("*")
    .eq("store_id", store.id);

  const inventoryMap = new Map(
    (inventories || []).map((inv: Record<string, unknown>) => [inv.material_id, inv])
  );

  const alerts = (materials || [])
    .map((mat: Record<string, unknown>) => {
      const inv = inventoryMap.get(mat.id) as Record<string, unknown> | undefined;
      const currentCount = inv ? Number(inv.current_count) : 0;
      const isPlenty = inv ? inv.is_plenty : false;

      if (isPlenty) return null; // Skip "大量" items
      if (currentCount >= Number(mat.reorder_threshold)) return null;

      return {
        material: mat,
        inventory: inv || null,
        deficit: Number(mat.reorder_threshold) - currentCount,
      };
    })
    .filter(Boolean);

  return alerts;
}

// ============================================
// Staff-facing actions (token-based, no auth)
// ============================================
export async function getStoreByToken(token: string) {
  const adminClient = createAdminClient();

  const { data: store } = await adminClient
    .from("stores")
    .select("*")
    .eq("staff_token", token)
    .single();

  return store;
}

export async function getStaffMembersByToken(token: string) {
  const adminClient = createAdminClient();

  const { data: store } = await adminClient
    .from("stores")
    .select("id")
    .eq("staff_token", token)
    .single();

  if (!store) return [];

  const { data } = await adminClient
    .from("staff_members")
    .select("*")
    .eq("store_id", store.id)
    .eq("is_active", true)
    .order("sort_order");

  return data || [];
}

export async function getLocationsByToken(token: string) {
  const adminClient = createAdminClient();

  const { data: store } = await adminClient
    .from("stores")
    .select("id")
    .eq("staff_token", token)
    .single();

  if (!store) return [];

  const { data } = await adminClient
    .from("locations")
    .select("*")
    .eq("store_id", store.id)
    .order("sort_order");

  return data || [];
}

export async function getMaterialsByToken(token: string) {
  const adminClient = createAdminClient();

  const { data: store } = await adminClient
    .from("stores")
    .select("id")
    .eq("staff_token", token)
    .single();

  if (!store) return [];

  const { data } = await adminClient
    .from("materials")
    .select("*, location:locations(*)")
    .eq("store_id", store.id)
    .order("name");

  return data || [];
}

export async function getInventoryByToken(token: string) {
  const adminClient = createAdminClient();

  const { data: store } = await adminClient
    .from("stores")
    .select("id")
    .eq("staff_token", token)
    .single();

  if (!store) return [];

  const { data } = await adminClient
    .from("inventory")
    .select("*")
    .eq("store_id", store.id);

  return data || [];
}

export async function updateInventory(
  token: string,
  materialId: string,
  staffName: string,
  newCount: number,
  isPlenty: boolean
) {
  const adminClient = createAdminClient();

  const { data: store } = await adminClient
    .from("stores")
    .select("id")
    .eq("staff_token", token)
    .single();

  if (!store) return { success: false, error: "Store not found" };

  // Get current inventory
  const { data: existing } = await adminClient
    .from("inventory")
    .select("*")
    .eq("store_id", store.id)
    .eq("material_id", materialId)
    .single();

  const previousCount = existing ? Number(existing.current_count) : 0;

  // Upsert inventory
  const { error: upsertError } = await adminClient
    .from("inventory")
    .upsert(
      {
        store_id: store.id,
        material_id: materialId,
        current_count: newCount,
        is_plenty: isPlenty,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "store_id,material_id" }
    );

  if (upsertError) return { success: false, error: upsertError.message };

  // Insert log
  await adminClient.from("inventory_logs").insert({
    store_id: store.id,
    material_id: materialId,
    staff_name: staffName,
    previous_count: previousCount,
    new_count: newCount,
    is_plenty: isPlenty,
  });

  return { success: true };
}

// ============================================
// Store Settings
// ============================================
export async function updateStoreSettings(data: {
  name?: string;
}) {
  const supabase = await createClient();
  if (!supabase) return { success: false, error: "Not authenticated" };
  const store = await getMyStore();
  if (!store) return { success: false, error: "Store not found" };

  const { error } = await supabase
    .from("stores")
    .update(data)
    .eq("id", store.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ============================================
// Dynamic URL Rewriting (Server-Side Only)
// Affiliate IDs are read from SYSTEM_* env vars
// and NEVER exposed to the client JavaScript bundle.
// ============================================

function isAmazonUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.hostname.includes("amazon.co.jp") ||
      u.hostname.includes("amazon.com") ||
      u.hostname.includes("amzn.to") ||
      u.hostname.includes("amzn.asia")
    );
  } catch {
    return false;
  }
}

function isRakutenUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname.includes("rakuten.co.jp");
  } catch {
    return false;
  }
}

/**
 * Server Action: Rewrites a supplier URL with system affiliate tags.
 * Amazon: appends/overwrites ?tag= parameter.
 * Rakuten: rebuilds URL via hb.afl.rakuten.co.jp redirect format.
 * Others: returns original URL unchanged.
 */
export async function getOrderUrl(supplierUrl: string): Promise<string> {
  if (!supplierUrl) return "";

  const amazonTag = process.env.SYSTEM_AMAZON_AFFILIATE_TAG || "";
  const rakutenId = process.env.SYSTEM_RAKUTEN_AFFILIATE_ID || "";

  try {
    if (isAmazonUrl(supplierUrl)) {
      if (amazonTag) {
        const u = new URL(supplierUrl);
        u.searchParams.set("tag", amazonTag); // Force overwrite
        return u.toString();
      }
      return supplierUrl;
    }

    if (isRakutenUrl(supplierUrl)) {
      if (rakutenId) {
        const encodedUrl = encodeURIComponent(supplierUrl);
        return `https://hb.afl.rakuten.co.jp/ichiba/${rakutenId}/?pc=${encodedUrl}`;
      }
      return supplierUrl;
    }

    // Other URLs: pass through unchanged
    return supplierUrl;
  } catch {
    return supplierUrl;
  }
}

/**
 * Server Action: Returns the appropriate button label for a supplier URL.
 * "Amazonで発注する" / "楽天市場で発注する" / "発注する"
 */
export async function getOrderButtonLabel(supplierUrl: string): Promise<string> {
  if (!supplierUrl) return "発注する";

  if (isAmazonUrl(supplierUrl)) return "Amazonで発注する";
  if (isRakutenUrl(supplierUrl)) return "楽天市場で発注する";
  return "発注する";
}
