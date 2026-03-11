-- ============================================
-- 003: 原価計算モデル刷新
-- 仕込みレシピ（バッチ）→ 1個あたり重量ベース原価計算
-- ============================================

-- 仕込みレシピ（バッチ単位）
CREATE TABLE recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,           -- 例: 「ソフトクリームベース」
  batch_yield NUMERIC(10,3) NOT NULL DEFAULT 1000,  -- バッチ出来高
  yield_unit TEXT DEFAULT 'g',  -- g / ml / 個
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 仕込みレシピの材料構成
CREATE TABLE recipe_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE NOT NULL,
  quantity NUMERIC(10,3) NOT NULL DEFAULT 0  -- バッチ全体での使用量
);

-- 商品の構成（レシピ or 他商品の組み合わせ）
CREATE TABLE product_components (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  sub_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  portion_grams NUMERIC(10,3),     -- レシピから何g使うか
  multiplier NUMERIC(10,3) DEFAULT 1, -- サブ商品の場合の倍率
  CHECK (
    (recipe_id IS NOT NULL AND sub_product_id IS NULL)
    OR (recipe_id IS NULL AND sub_product_id IS NOT NULL)
  )
);

-- RLS
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin CRUD recipes" ON recipes
  FOR ALL USING (
    store_id IN (SELECT store_id FROM store_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin CRUD recipe_materials" ON recipe_materials
  FOR ALL USING (
    recipe_id IN (
      SELECT id FROM recipes WHERE store_id IN (
        SELECT store_id FROM store_admins WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admin CRUD product_components" ON product_components
  FOR ALL USING (
    product_id IN (
      SELECT id FROM products WHERE store_id IN (
        SELECT store_id FROM store_admins WHERE user_id = auth.uid()
      )
    )
  );
