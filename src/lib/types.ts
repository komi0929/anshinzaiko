// Type definitions for Anshin Zaiko

export interface Store {
  id: string;
  name: string;
  staff_token: string;
  created_at: string;
}

export interface StoreAdmin {
  id: string;
  store_id: string;
  user_id: string;
  role: string;
  created_at: string;
}

export interface StaffMember {
  id: string;
  store_id: string;
  name: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Location {
  id: string;
  store_id: string;
  name: string;
  sort_order: number;
}

export interface Material {
  id: string;
  store_id: string;
  name: string;
  category: '食材' | '資材' | 'その他';
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
  unit_cost: number;
  created_at: string;
  // Joined
  location?: Location;
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  selling_price: number;
  image_url: string;
  total_cost: number;
  cost_ratio: number;
  created_at: string;
  // Joined
  recipe_items?: RecipeItem[];
}

export interface RecipeItem {
  id: string;
  product_id: string;
  material_id: string | null;
  sub_product_id: string | null;
  quantity: number;
  // Joined
  material?: Material;
  sub_product?: Product;
}

export interface Inventory {
  id: string;
  store_id: string;
  material_id: string;
  current_count: number;
  is_plenty: boolean;
  updated_at: string;
  // Joined
  material?: Material;
}

export interface InventoryLog {
  id: string;
  store_id: string;
  material_id: string;
  staff_name: string;
  previous_count: number;
  new_count: number;
  is_plenty: boolean;
  created_at: string;
}

// Order Alert
export interface OrderAlert {
  material: Material;
  inventory: Inventory | null;
  deficit: number;
}
