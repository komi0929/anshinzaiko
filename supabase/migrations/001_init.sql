-- ============================================
-- Anshin Zaiko - Database Schema
-- ============================================

-- 1. stores: 店舗テーブル
CREATE TABLE stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  staff_token TEXT UNIQUE NOT NULL,
  affiliate_amazon_tag TEXT DEFAULT '',
  affiliate_rakuten_id TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. store_admins: 管理者（最大3名、Supabase Auth連携）
CREATE TABLE store_admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id, user_id)
);

-- 3. staff_members: スタッフ名簿（認証不要）
CREATE TABLE staff_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. locations: 保管場所
CREATE TABLE locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- 5. materials: 材料マスター
CREATE TABLE materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '食材',
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  supplier_name TEXT DEFAULT '',
  supplier_url TEXT DEFAULT '',
  supplier_email TEXT DEFAULT '',
  purchase_price NUMERIC(10,2) DEFAULT 0,
  units_per_purchase INTEGER DEFAULT 1,
  content_amount NUMERIC(10,3) DEFAULT 1,
  unit TEXT DEFAULT 'g',
  shipping_cost NUMERIC(10,2) DEFAULT 0,
  reorder_threshold INTEGER DEFAULT 0,
  unit_cost NUMERIC(10,4) GENERATED ALWAYS AS (
    CASE WHEN units_per_purchase * content_amount > 0
      THEN (purchase_price + shipping_cost) / (units_per_purchase * content_amount)
      ELSE 0
    END
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. products: 商品マスター
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  selling_price NUMERIC(10,2) DEFAULT 0,
  image_url TEXT DEFAULT '',
  total_cost NUMERIC(10,4) DEFAULT 0,
  cost_ratio NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. recipe_items: レシピ構成要素
CREATE TABLE recipe_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  sub_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
  CHECK (
    (material_id IS NOT NULL AND sub_product_id IS NULL)
    OR (material_id IS NULL AND sub_product_id IS NOT NULL)
  )
);

-- 8. inventory: 在庫記録（最新状態）
CREATE TABLE inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE NOT NULL,
  current_count NUMERIC(10,2) DEFAULT 0,
  is_plenty BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id, material_id)
);

-- 9. inventory_logs: 在庫変更ログ
CREATE TABLE inventory_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE NOT NULL,
  staff_name TEXT NOT NULL,
  previous_count NUMERIC(10,2),
  new_count NUMERIC(10,2),
  is_plenty BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;

-- store_admins: 自分の店舗のみ
CREATE POLICY "Admin can view own store_admins" ON store_admins
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admin can insert store_admins" ON store_admins
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- stores: 管理者のみCRUD
CREATE POLICY "Admin can view own stores" ON stores
  FOR SELECT USING (
    id IN (SELECT store_id FROM store_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin can update own stores" ON stores
  FOR UPDATE USING (
    id IN (SELECT store_id FROM store_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Authenticated can create stores" ON stores
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- staff_members, locations, materials, products, recipe_items:
-- 管理者の store_id に紐づくデータのみ
CREATE POLICY "Admin CRUD staff_members" ON staff_members
  FOR ALL USING (
    store_id IN (SELECT store_id FROM store_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin CRUD locations" ON locations
  FOR ALL USING (
    store_id IN (SELECT store_id FROM store_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin CRUD materials" ON materials
  FOR ALL USING (
    store_id IN (SELECT store_id FROM store_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin CRUD products" ON products
  FOR ALL USING (
    store_id IN (SELECT store_id FROM store_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin CRUD recipe_items" ON recipe_items
  FOR ALL USING (
    product_id IN (
      SELECT id FROM products WHERE store_id IN (
        SELECT store_id FROM store_admins WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admin CRUD inventory" ON inventory
  FOR ALL USING (
    store_id IN (SELECT store_id FROM store_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin CRUD inventory_logs" ON inventory_logs
  FOR ALL USING (
    store_id IN (SELECT store_id FROM store_admins WHERE user_id = auth.uid())
  );
