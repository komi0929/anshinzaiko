-- ============================================
-- 002: 在庫チェックセッション
-- ============================================

CREATE TABLE inventory_check_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  staff_name TEXT NOT NULL,
  status TEXT DEFAULT 'in_progress', -- 'in_progress' | 'completed'
  checked_material_ids UUID[] DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE inventory_check_sessions ENABLE ROW LEVEL SECURITY;

-- スタッフからのアクセス: staff_token経由で store_id を取得
CREATE POLICY "Anyone can CRUD check sessions" ON inventory_check_sessions
  FOR ALL USING (true);
