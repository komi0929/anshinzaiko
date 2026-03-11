"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

// ============================================
// Helper: get current user's store (cached per request)
// React cache() deduplicates calls within the same server request,
// eliminating redundant DB round-trips when multiple actions call getMyStore().
// ============================================
export const getMyStore = cache(async () => {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Single query: join store_admins → stores
  const { data: admin } = await supabase
    .from("store_admins")
    .select("store_id, stores(*)")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!admin) return null;
  return (admin as Record<string, unknown>).stores as Record<string, unknown> | null;
});

// Fast store_id-only helper (also cached via getMyStore)
async function getStoreId(): Promise<string | null> {
  const store = await getMyStore();
  return store ? (store.id as string) : null;
}

// ============================================
// Integrated Data Fetching (1 Server Action = all page data)
// Eliminates multiple Server Action round-trips per page.
// ============================================

export async function getDashboardData() {
  const supabase = await createClient();
  if (!supabase) return null;
  const store = await getMyStore();
  if (!store) return null;
  const storeId = store.id as string;

  const adminClient = createAdminClient();

  // Parallel DB queries (1 network hop each, all in parallel)
  const [materialsRes, inventoriesRes, checkSessionRes] = await Promise.all([
    supabase
      .from("materials")
      .select("*, location:locations(*)")
      .eq("store_id", storeId)
      .gt("reorder_threshold", 0),
    supabase
      .from("inventory")
      .select("*")
      .eq("store_id", storeId),
    adminClient
      .from("inventory_check_sessions")
      .select("*")
      .eq("store_id", storeId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const materials = materialsRes.data || [];
  const inventories = inventoriesRes.data || [];
  const inventoryMap = new Map(
    inventories.map((inv: Record<string, unknown>) => [inv.material_id, inv])
  );

  const alerts = materials
    .map((mat: Record<string, unknown>) => {
      const inv = inventoryMap.get(mat.id) as Record<string, unknown> | undefined;
      const currentCount = inv ? Number(inv.current_count) : 0;
      const isPlenty = inv ? inv.is_plenty : false;
      if (isPlenty) return null;
      if (currentCount >= Number(mat.reorder_threshold)) return null;
      return {
        material: mat,
        inventory: inv || null,
        deficit: Number(mat.reorder_threshold) - currentCount,
      };
    })
    .filter(Boolean);

  return {
    store,
    alerts,
    lastCheck: checkSessionRes.data || null,
  };
}

export async function getMaterialsPageData() {
  const supabase = await createClient();
  if (!supabase) return null;
  const store = await getMyStore();
  if (!store) return null;
  const storeId = store.id as string;

  const [materialsRes, locationsRes] = await Promise.all([
    supabase
      .from("materials")
      .select("*, location:locations(*)")
      .eq("store_id", storeId)
      .order("name"),
    supabase
      .from("locations")
      .select("*")
      .eq("store_id", storeId)
      .order("sort_order"),
  ]);

  return {
    materials: materialsRes.data || [],
    locations: locationsRes.data || [],
  };
}

export async function getSettingsPageData() {
  const supabase = await createClient();
  if (!supabase) return null;
  const store = await getMyStore();
  if (!store) return null;

  const admins = await (async () => {
    const { data } = await supabase
      .from("store_admins")
      .select("id, user_id, role, created_at")
      .eq("store_id", store.id as string)
      .order("created_at", { ascending: true });
    if (!data || data.length === 0) return [];
    try {
      const adminClient = createAdminClient();
      return await Promise.all(
        data.map(async (a) => {
          const { data: ud } = await adminClient.auth.admin.getUserById(a.user_id);
          return { ...a, email: ud?.user?.email || "不明" };
        })
      );
    } catch {
      return data.map((a) => ({ ...a, email: "不明" }));
    }
  })();

  return { store, admins };
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

// Bulk upsert materials (一括登録/編集)
export async function bulkUpsertMaterials(rows: {
  id?: string;
  name: string;
  category?: string;
  location_id?: string | null;
  supplier_name?: string;
  supplier_url?: string;
  supplier_email?: string;
  purchase_price?: number;
  units_per_purchase?: number;
  content_amount?: number;
  unit?: string;
  shipping_cost?: number;
  reorder_threshold?: number;
}[]) {
  const supabase = await createClient();
  if (!supabase) return { success: false, error: "Not authenticated" };
  const store = await getMyStore();
  if (!store) return { success: false, error: "Store not found" };

  const toInsert = rows.filter((r) => !r.id && r.name?.trim());
  const toUpdate = rows.filter((r) => r.id && r.name?.trim());

  let insertError = null;
  let updateError = null;

  if (toInsert.length > 0) {
    const { error } = await supabase.from("materials").insert(
      toInsert.map((r) => ({
        store_id: store.id,
        name: r.name,
        category: r.category || "",
        location_id: r.location_id || null,
        supplier_name: r.supplier_name || "",
        supplier_url: r.supplier_url || "",
        supplier_email: r.supplier_email || "",
        purchase_price: r.purchase_price || 0,
        units_per_purchase: r.units_per_purchase || 1,
        content_amount: r.content_amount || 1,
        unit: r.unit || "個",
        shipping_cost: r.shipping_cost || 0,
        reorder_threshold: r.reorder_threshold || 0,
      }))
    );
    insertError = error;
  }

  for (const r of toUpdate) {
    const { error } = await supabase
      .from("materials")
      .update({
        name: r.name,
        category: r.category || "",
        location_id: r.location_id || null,
        supplier_name: r.supplier_name || "",
        supplier_url: r.supplier_url || "",
        supplier_email: r.supplier_email || "",
        purchase_price: r.purchase_price || 0,
        units_per_purchase: r.units_per_purchase || 1,
        content_amount: r.content_amount || 1,
        unit: r.unit || "個",
        shipping_cost: r.shipping_cost || 0,
        reorder_threshold: r.reorder_threshold || 0,
      })
      .eq("id", r.id!);
    if (error) updateError = error;
  }

  if (insertError) return { success: false, error: insertError.message };
  if (updateError) return { success: false, error: updateError.message };
  return { success: true, inserted: toInsert.length, updated: toUpdate.length };
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
// Recipes (仕込みレシピ) CRUD
// ============================================
export async function getRecipes() {
  const supabase = await createClient();
  if (!supabase) return [];
  const store = await getMyStore();
  if (!store) return [];

  const { data } = await supabase
    .from("recipes")
    .select("*, recipe_materials(*, material:materials(name, unit_cost, unit))")
    .eq("store_id", store.id)
    .order("name");

  return data || [];
}

export async function createRecipe(formData: {
  name: string;
  batch_yield: number;
  yield_unit: string;
}) {
  const supabase = await createClient();
  if (!supabase) return { success: false, error: "Not authenticated" };
  const store = await getMyStore();
  if (!store) return { success: false, error: "Store not found" };

  const { data, error } = await supabase
    .from("recipes")
    .insert({ store_id: store.id, ...formData })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function updateRecipe(id: string, formData: {
  name?: string;
  batch_yield?: number;
  yield_unit?: string;
}) {
  const supabase = await createClient();
  if (!supabase) return { success: false, error: "Not authenticated" };

  const { error } = await supabase.from("recipes").update(formData).eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteRecipe(id: string) {
  const supabase = await createClient();
  if (!supabase) return { success: false, error: "Not authenticated" };

  const { error } = await supabase.from("recipes").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// Recipe Materials (仕込みレシピの材料構成)
export async function addRecipeMaterial(recipeId: string, materialId: string, quantity: number) {
  const supabase = await createClient();
  if (!supabase) return { success: false, error: "Not authenticated" };

  const { error } = await supabase.from("recipe_materials").insert({
    recipe_id: recipeId,
    material_id: materialId,
    quantity,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function removeRecipeMaterial(id: string) {
  const supabase = await createClient();
  if (!supabase) return { success: false, error: "Not authenticated" };

  const { error } = await supabase.from("recipe_materials").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ============================================
// Product Components (商品構成: レシピ or サブ商品)
// ============================================
export async function getProductComponents(productId: string) {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("product_components")
    .select("*, recipe:recipes(name, batch_yield, yield_unit), sub_product:products!product_components_sub_product_id_fkey(name, total_cost)")
    .eq("product_id", productId);

  return data || [];
}

export async function addProductComponent(productId: string, data: {
  recipe_id?: string | null;
  sub_product_id?: string | null;
  portion_grams?: number | null;
  multiplier?: number;
}) {
  const supabase = await createClient();
  if (!supabase) return { success: false, error: "Not authenticated" };

  const { error } = await supabase.from("product_components").insert({
    product_id: productId,
    recipe_id: data.recipe_id || null,
    sub_product_id: data.sub_product_id || null,
    portion_grams: data.portion_grams || null,
    multiplier: data.multiplier || 1,
  });

  if (error) return { success: false, error: error.message };

  // Recalculate cost
  await recalculateProductCost(productId);
  return { success: true };
}

export async function removeProductComponent(componentId: string, productId: string) {
  const supabase = await createClient();
  if (!supabase) return { success: false, error: "Not authenticated" };

  const { error } = await supabase.from("product_components").delete().eq("id", componentId);
  if (error) return { success: false, error: error.message };

  await recalculateProductCost(productId);
  return { success: true };
}

// Keep old recipe_items functions for backward compatibility
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
  return { success: true };
}

export async function removeRecipeItem(recipeItemId: string, _productId: string) {
  const supabase = await createClient();
  if (!supabase) return { success: false, error: "Not authenticated" };

  const { error } = await supabase.from("recipe_items").delete().eq("id", recipeItemId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ============================================
// New Cost Calculation Engine (Batch-Based)
// バッチ原価 = Σ(material.unit_cost × recipe_material.quantity)
// 1gあたり原価 = バッチ原価 / batch_yield
// 商品原価 = Σ(1g原価 × portion_grams) + Σ(sub_product.total_cost × multiplier)
// ============================================
async function calculateRecipeBatchCost(recipeId: string): Promise<number> {
  const supabase = await createClient();
  if (!supabase) return 0;

  const { data: recipeMats } = await supabase
    .from("recipe_materials")
    .select("quantity, material:materials(unit_cost)")
    .eq("recipe_id", recipeId);

  if (!recipeMats) return 0;

  let batchCost = 0;
  for (const rm of recipeMats) {
    const mat = rm.material as unknown as { unit_cost: number } | null;
    if (mat) {
      batchCost += Number(mat.unit_cost) * Number(rm.quantity);
    }
  }
  return batchCost;
}

export async function recalculateProductCost(productId: string, visited: Set<string> = new Set()) {
  if (visited.has(productId)) return 0; // Circular reference guard
  visited.add(productId);

  const supabase = await createClient();
  if (!supabase) return 0;

  const { data: components } = await supabase
    .from("product_components")
    .select("*, recipe:recipes(batch_yield)")
    .eq("product_id", productId);

  let totalCost = 0;

  if (components && components.length > 0) {
    for (const comp of components) {
      if (comp.recipe_id) {
        // Recipe-based: batchCost * (portion_grams / batch_yield)
        const batchCost = await calculateRecipeBatchCost(comp.recipe_id);
        const batchYield = comp.recipe ? Number((comp.recipe as { batch_yield: number }).batch_yield) : 1;
        const portionGrams = Number(comp.portion_grams || 0);
        if (batchYield > 0 && portionGrams > 0) {
          totalCost += batchCost * (portionGrams / batchYield);
        }
      } else if (comp.sub_product_id) {
        // Sub-product: recursive
        const subCost = await recalculateProductCost(comp.sub_product_id, new Set(visited));
        totalCost += subCost * Number(comp.multiplier || 1);
      }
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
// Inventory Check Sessions
// ============================================

export async function startCheckSession(token: string, staffName: string) {
  const adminClient = createAdminClient();
  const { data: store } = await adminClient
    .from("stores")
    .select("id")
    .eq("staff_token", token)
    .single();
  if (!store) return null;

  // Create a new session
  const { data } = await adminClient
    .from("inventory_check_sessions")
    .insert({ store_id: store.id, staff_name: staffName })
    .select()
    .single();

  return data;
}

export async function getActiveCheckSession(token: string, staffName: string) {
  const adminClient = createAdminClient();
  const { data: store } = await adminClient
    .from("stores")
    .select("id")
    .eq("staff_token", token)
    .single();
  if (!store) return null;

  // Find active (in_progress) session for this staff
  const { data } = await adminClient
    .from("inventory_check_sessions")
    .select("*")
    .eq("store_id", store.id)
    .eq("staff_name", staffName)
    .eq("status", "in_progress")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

export async function markMaterialChecked(sessionId: string, materialId: string) {
  const adminClient = createAdminClient();

  // Get current session
  const { data: session } = await adminClient
    .from("inventory_check_sessions")
    .select("checked_material_ids")
    .eq("id", sessionId)
    .single();

  if (!session) return { success: false };

  const currentIds: string[] = session.checked_material_ids || [];
  if (currentIds.includes(materialId)) return { success: true };

  const { error } = await adminClient
    .from("inventory_check_sessions")
    .update({ checked_material_ids: [...currentIds, materialId] })
    .eq("id", sessionId);

  return { success: !error };
}

export async function completeCheckSession(sessionId: string) {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("inventory_check_sessions")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", sessionId);

  return { success: !error };
}

export async function getLatestCheckSession() {
  const supabase = await createClient();
  if (!supabase) return null;
  const store = await getMyStore();
  if (!store) return null;

  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("inventory_check_sessions")
    .select("*")
    .eq("store_id", store.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
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
// Store Admin Management (Invitation)
// ============================================

export async function getStoreAdmins() {
  const supabase = await createClient();
  if (!supabase) return [];
  const store = await getMyStore();
  if (!store) return [];

  const { data: admins } = await supabase
    .from("store_admins")
    .select("id, user_id, role, created_at")
    .eq("store_id", store.id)
    .order("created_at", { ascending: true });

  if (!admins || admins.length === 0) return [];

  // Resolve emails via admin client
  try {
    const adminClient = createAdminClient();
    const results = await Promise.all(
      admins.map(async (a) => {
        const { data } = await adminClient.auth.admin.getUserById(a.user_id);
        return {
          ...a,
          email: data?.user?.email || "不明",
        };
      })
    );
    return results;
  } catch {
    return admins.map((a) => ({ ...a, email: "不明" }));
  }
}

const MAX_ADMINS = 3;

export async function inviteStoreAdmin(email: string) {
  const supabase = await createClient();
  if (!supabase) return { success: false, error: "認証エラー" };
  const store = await getMyStore();
  if (!store) return { success: false, error: "店舗が見つかりません" };

  // Check admin count limit
  const { count } = await supabase
    .from("store_admins")
    .select("id", { count: "exact", head: true })
    .eq("store_id", store.id);

  if ((count ?? 0) >= MAX_ADMINS) {
    return {
      success: false,
      error: `管理者は最大${MAX_ADMINS}名までです。追加するには既存の管理者を削除してください。`,
    };
  }

  // Find user by email via admin client
  const adminClient = createAdminClient();
  const { data: userList } = await adminClient.auth.admin.listUsers();
  const targetUser = userList?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (!targetUser) {
    return {
      success: false,
      error: "このメールアドレスのアカウントが見つかりません。先にアカウントを作成してもらってください。",
    };
  }

  // Check if already added
  const { data: existing } = await supabase
    .from("store_admins")
    .select("id")
    .eq("store_id", store.id)
    .eq("user_id", targetUser.id)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "このユーザーはすでに管理者として追加されています。" };
  }

  // Add as admin (all admins have equal permissions)
  const { error } = await supabase.from("store_admins").insert({
    store_id: store.id,
    user_id: targetUser.id,
    role: "admin",
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function removeStoreAdmin(adminId: string) {
  const supabase = await createClient();
  if (!supabase) return { success: false, error: "認証エラー" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "ログインしてください" };

  // Prevent self-deletion
  const { data: target } = await supabase
    .from("store_admins")
    .select("user_id")
    .eq("id", adminId)
    .single();

  if (target?.user_id === user.id) {
    return { success: false, error: "自分自身は削除できません。" };
  }

  const { error } = await supabase
    .from("store_admins")
    .delete()
    .eq("id", adminId);

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
