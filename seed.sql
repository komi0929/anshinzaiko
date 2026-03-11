-- ==================================================
-- あんしん在庫 ダミーデータ投入スクリプト
-- Supabase SQL Editorでそのまま実行してください
-- ==================================================

-- Step 1: ユーザーIDを取得
DO $$
DECLARE
  v_user_id UUID;
  v_store_id UUID;
  v_loc_reiA UUID;
  v_loc_reiB UUID;
  v_loc_reito UUID;
  v_loc_kanbutsu UUID;
  v_loc_other UUID;
  v_mat_hakuriki UUID;
  v_mat_butter UUID;
  v_mat_sugar UUID;
  v_mat_egg UUID;
  v_mat_milk UUID;
  v_mat_cream UUID;
  v_mat_choco UUID;
  v_mat_vanilla UUID;
  v_mat_bp UUID;
  v_mat_ichigo UUID;
  v_mat_blueberry UUID;
  v_mat_almond UUID;
  v_mat_wrapping UUID;
  v_mat_giftbox UUID;
  v_mat_napkin UUID;
  v_prod_short UUID;
  v_prod_choco UUID;
  v_prod_macaron UUID;
  v_prod_cookie UUID;
  v_prod_tart UUID;
BEGIN
  -- ユーザーID取得
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'y.kominami@hitokoto1.co.jp';
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'ユーザーが見つかりません';
  END IF;

  -- 既存の店舗があれば削除（クリーンスタート）
  DELETE FROM store_admins WHERE user_id = v_user_id;

  -- Step 2: 店舗作成
  INSERT INTO stores (name, staff_token)
  VALUES ('ヒトコトカフェ', replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''))
  RETURNING id INTO v_store_id;

  -- Step 3: 管理者紐付け
  INSERT INTO store_admins (store_id, user_id, role) VALUES (v_store_id, v_user_id, 'admin');

  -- Step 4: 保管場所
  INSERT INTO locations (store_id, name, sort_order) VALUES (v_store_id, '冷蔵庫A', 0) RETURNING id INTO v_loc_reiA;
  INSERT INTO locations (store_id, name, sort_order) VALUES (v_store_id, '冷蔵庫B', 1) RETURNING id INTO v_loc_reiB;
  INSERT INTO locations (store_id, name, sort_order) VALUES (v_store_id, '冷凍庫', 2) RETURNING id INTO v_loc_reito;
  INSERT INTO locations (store_id, name, sort_order) VALUES (v_store_id, '乾物棚', 3) RETURNING id INTO v_loc_kanbutsu;
  INSERT INTO locations (store_id, name, sort_order) VALUES (v_store_id, 'その他', 4) RETURNING id INTO v_loc_other;

  -- Step 5: スタッフ
  INSERT INTO staff_members (store_id, name, is_active, sort_order) VALUES (v_store_id, '田中さくら', true, 0);
  INSERT INTO staff_members (store_id, name, is_active, sort_order) VALUES (v_store_id, '佐藤ゆい', true, 1);
  INSERT INTO staff_members (store_id, name, is_active, sort_order) VALUES (v_store_id, '鈴木あおい', true, 2);

  -- Step 6: 材料 (15品)
  INSERT INTO materials (store_id, name, category, location_id, supplier_name, supplier_url, purchase_price, units_per_purchase, content_amount, unit, shipping_cost, reorder_threshold)
  VALUES (v_store_id, '薄力粉 (1kg)', '食材', v_loc_kanbutsu, 'Amazon', 'https://www.amazon.co.jp/dp/B08N5WRWNW', 350, 1, 1000, 'g', 0, 3) RETURNING id INTO v_mat_hakuriki;

  INSERT INTO materials (store_id, name, category, location_id, supplier_name, supplier_url, purchase_price, units_per_purchase, content_amount, unit, shipping_cost, reorder_threshold)
  VALUES (v_store_id, '無塩バター (450g)', '食材', v_loc_reiA, 'Amazon', 'https://www.amazon.co.jp/dp/B01MXLZ45N', 780, 1, 450, 'g', 0, 4) RETURNING id INTO v_mat_butter;

  INSERT INTO materials (store_id, name, category, location_id, supplier_name, supplier_url, purchase_price, units_per_purchase, content_amount, unit, shipping_cost, reorder_threshold)
  VALUES (v_store_id, 'グラニュー糖 (1kg)', '食材', v_loc_kanbutsu, '楽天市場', 'https://item.rakuten.co.jp/tomizawa/00220201/', 420, 1, 1000, 'g', 0, 2) RETURNING id INTO v_mat_sugar;

  INSERT INTO materials (store_id, name, category, location_id, supplier_name, supplier_url, purchase_price, units_per_purchase, content_amount, unit, shipping_cost, reorder_threshold)
  VALUES (v_store_id, '卵 (10個入)', '食材', v_loc_reiA, '近所のスーパー', '', 280, 1, 10, '個', 0, 3) RETURNING id INTO v_mat_egg;

  INSERT INTO materials (store_id, name, category, location_id, supplier_name, supplier_url, purchase_price, units_per_purchase, content_amount, unit, shipping_cost, reorder_threshold)
  VALUES (v_store_id, '牛乳 (1L)', '食材', v_loc_reiA, '近所のスーパー', '', 220, 1, 1000, 'ml', 0, 3) RETURNING id INTO v_mat_milk;

  INSERT INTO materials (store_id, name, category, location_id, supplier_name, supplier_url, purchase_price, units_per_purchase, content_amount, unit, shipping_cost, reorder_threshold)
  VALUES (v_store_id, '生クリーム (200ml)', '食材', v_loc_reiB, 'Amazon', 'https://www.amazon.co.jp/dp/B01N2GE6LI', 380, 1, 200, 'ml', 0, 5) RETURNING id INTO v_mat_cream;

  INSERT INTO materials (store_id, name, category, location_id, supplier_name, supplier_url, purchase_price, units_per_purchase, content_amount, unit, shipping_cost, reorder_threshold)
  VALUES (v_store_id, 'チョコレート (1kg)', '食材', v_loc_kanbutsu, '楽天市場', 'https://item.rakuten.co.jp/tomizawa/00652101/', 2200, 1, 1000, 'g', 0, 2) RETURNING id INTO v_mat_choco;

  INSERT INTO materials (store_id, name, category, location_id, supplier_name, supplier_url, purchase_price, units_per_purchase, content_amount, unit, shipping_cost, reorder_threshold)
  VALUES (v_store_id, 'バニラエッセンス (30ml)', '食材', v_loc_kanbutsu, 'Amazon', 'https://www.amazon.co.jp/dp/B004L29SBQ', 450, 1, 30, 'ml', 0, 2) RETURNING id INTO v_mat_vanilla;

  INSERT INTO materials (store_id, name, category, location_id, supplier_name, supplier_url, purchase_price, units_per_purchase, content_amount, unit, shipping_cost, reorder_threshold)
  VALUES (v_store_id, 'ベーキングパウダー (100g)', '食材', v_loc_kanbutsu, 'Amazon', 'https://www.amazon.co.jp/dp/B000JUSF82', 320, 1, 100, 'g', 0, 2) RETURNING id INTO v_mat_bp;

  INSERT INTO materials (store_id, name, category, location_id, supplier_name, supplier_email, purchase_price, units_per_purchase, content_amount, unit, shipping_cost, reorder_threshold)
  VALUES (v_store_id, 'いちご (1パック)', '食材', v_loc_reiB, 'フルーツ山田', 'info@fruits-yamada.example.com', 600, 1, 15, '個', 0, 3) RETURNING id INTO v_mat_ichigo;

  INSERT INTO materials (store_id, name, category, location_id, supplier_name, supplier_url, purchase_price, units_per_purchase, content_amount, unit, shipping_cost, reorder_threshold)
  VALUES (v_store_id, 'ブルーベリー (100g)', '食材', v_loc_reito, 'Amazon', 'https://www.amazon.co.jp/dp/B07H8VGBKV', 480, 1, 100, 'g', 0, 3) RETURNING id INTO v_mat_blueberry;

  INSERT INTO materials (store_id, name, category, location_id, supplier_name, supplier_url, purchase_price, units_per_purchase, content_amount, unit, shipping_cost, reorder_threshold)
  VALUES (v_store_id, 'アーモンドプードル (200g)', '食材', v_loc_kanbutsu, '楽天市場', 'https://item.rakuten.co.jp/tomizawa/00070902/', 680, 1, 200, 'g', 0, 2) RETURNING id INTO v_mat_almond;

  INSERT INTO materials (store_id, name, category, location_id, supplier_name, supplier_url, purchase_price, units_per_purchase, content_amount, unit, shipping_cost, reorder_threshold)
  VALUES (v_store_id, 'ラッピング袋 (50枚)', '資材', v_loc_other, 'Amazon', 'https://www.amazon.co.jp/dp/B0BT4KXRGH', 980, 50, 1, '枚', 0, 2) RETURNING id INTO v_mat_wrapping;

  INSERT INTO materials (store_id, name, category, location_id, supplier_name, supplier_url, purchase_price, units_per_purchase, content_amount, unit, shipping_cost, reorder_threshold)
  VALUES (v_store_id, 'ギフト箱 (10枚)', '資材', v_loc_other, '楽天市場', 'https://item.rakuten.co.jp/wrapping/giftbox-10/', 1500, 10, 1, '枚', 500, 1) RETURNING id INTO v_mat_giftbox;

  INSERT INTO materials (store_id, name, category, location_id, supplier_name, supplier_url, purchase_price, units_per_purchase, content_amount, unit, shipping_cost, reorder_threshold)
  VALUES (v_store_id, '紙ナプキン (100枚)', '資材', v_loc_other, 'Amazon', 'https://www.amazon.co.jp/dp/B09HGCBTVV', 450, 100, 1, '枚', 0, 1) RETURNING id INTO v_mat_napkin;

  -- Step 7: 商品 (5品)
  INSERT INTO products (store_id, name, selling_price) VALUES (v_store_id, 'ショートケーキ', 580) RETURNING id INTO v_prod_short;
  INSERT INTO products (store_id, name, selling_price) VALUES (v_store_id, 'チョコレートケーキ', 620) RETURNING id INTO v_prod_choco;
  INSERT INTO products (store_id, name, selling_price) VALUES (v_store_id, 'マカロン (6個入)', 1200) RETURNING id INTO v_prod_macaron;
  INSERT INTO products (store_id, name, selling_price) VALUES (v_store_id, 'クッキー詰合せ', 800) RETURNING id INTO v_prod_cookie;
  INSERT INTO products (store_id, name, selling_price) VALUES (v_store_id, 'フルーツタルト', 680) RETURNING id INTO v_prod_tart;

  -- Step 8: レシピ構成
  -- ショートケーキ
  INSERT INTO recipe_items (product_id, material_id, quantity) VALUES (v_prod_short, v_mat_hakuriki, 80);
  INSERT INTO recipe_items (product_id, material_id, quantity) VALUES (v_prod_short, v_mat_butter, 30);
  INSERT INTO recipe_items (product_id, material_id, quantity) VALUES (v_prod_short, v_mat_sugar, 60);
  INSERT INTO recipe_items (product_id, material_id, quantity) VALUES (v_prod_short, v_mat_egg, 3);
  INSERT INTO recipe_items (product_id, material_id, quantity) VALUES (v_prod_short, v_mat_cream, 100);
  INSERT INTO recipe_items (product_id, material_id, quantity) VALUES (v_prod_short, v_mat_ichigo, 3);
  -- チョコレートケーキ
  INSERT INTO recipe_items (product_id, material_id, quantity) VALUES (v_prod_choco, v_mat_hakuriki, 70);
  INSERT INTO recipe_items (product_id, material_id, quantity) VALUES (v_prod_choco, v_mat_butter, 50);
  INSERT INTO recipe_items (product_id, material_id, quantity) VALUES (v_prod_choco, v_mat_sugar, 80);
  INSERT INTO recipe_items (product_id, material_id, quantity) VALUES (v_prod_choco, v_mat_egg, 3);
  INSERT INTO recipe_items (product_id, material_id, quantity) VALUES (v_prod_choco, v_mat_choco, 150);
  INSERT INTO recipe_items (product_id, material_id, quantity) VALUES (v_prod_choco, v_mat_cream, 80);
  -- マカロン
  INSERT INTO recipe_items (product_id, material_id, quantity) VALUES (v_prod_macaron, v_mat_almond, 100);
  INSERT INTO recipe_items (product_id, material_id, quantity) VALUES (v_prod_macaron, v_mat_sugar, 100);
  INSERT INTO recipe_items (product_id, material_id, quantity) VALUES (v_prod_macaron, v_mat_egg, 2);
  INSERT INTO recipe_items (product_id, material_id, quantity) VALUES (v_prod_macaron, v_mat_butter, 30);
  -- クッキー詰合せ
  INSERT INTO recipe_items (product_id, material_id, quantity) VALUES (v_prod_cookie, v_mat_hakuriki, 200);
  INSERT INTO recipe_items (product_id, material_id, quantity) VALUES (v_prod_cookie, v_mat_butter, 100);
  INSERT INTO recipe_items (product_id, material_id, quantity) VALUES (v_prod_cookie, v_mat_sugar, 80);
  INSERT INTO recipe_items (product_id, material_id, quantity) VALUES (v_prod_cookie, v_mat_egg, 1);
  INSERT INTO recipe_items (product_id, material_id, quantity) VALUES (v_prod_cookie, v_mat_vanilla, 2);
  -- フルーツタルト
  INSERT INTO recipe_items (product_id, material_id, quantity) VALUES (v_prod_tart, v_mat_hakuriki, 120);
  INSERT INTO recipe_items (product_id, material_id, quantity) VALUES (v_prod_tart, v_mat_butter, 60);
  INSERT INTO recipe_items (product_id, material_id, quantity) VALUES (v_prod_tart, v_mat_sugar, 50);
  INSERT INTO recipe_items (product_id, material_id, quantity) VALUES (v_prod_tart, v_mat_egg, 2);
  INSERT INTO recipe_items (product_id, material_id, quantity) VALUES (v_prod_tart, v_mat_cream, 60);
  INSERT INTO recipe_items (product_id, material_id, quantity) VALUES (v_prod_tart, v_mat_ichigo, 4);
  INSERT INTO recipe_items (product_id, material_id, quantity) VALUES (v_prod_tart, v_mat_blueberry, 30);

  -- Step 9: 在庫（一部を閾値以下に）
  INSERT INTO inventory (store_id, material_id, current_count, is_plenty) VALUES (v_store_id, v_mat_hakuriki, 5, false);
  INSERT INTO inventory (store_id, material_id, current_count, is_plenty) VALUES (v_store_id, v_mat_butter, 2, false);    -- 閾値4以下
  INSERT INTO inventory (store_id, material_id, current_count, is_plenty) VALUES (v_store_id, v_mat_sugar, 4, false);
  INSERT INTO inventory (store_id, material_id, current_count, is_plenty) VALUES (v_store_id, v_mat_egg, 2, false);       -- 閾値3以下
  INSERT INTO inventory (store_id, material_id, current_count, is_plenty) VALUES (v_store_id, v_mat_milk, 1, false);      -- 閾値3以下
  INSERT INTO inventory (store_id, material_id, current_count, is_plenty) VALUES (v_store_id, v_mat_cream, 3, false);     -- 閾値5以下
  INSERT INTO inventory (store_id, material_id, current_count, is_plenty) VALUES (v_store_id, v_mat_choco, 3, false);
  INSERT INTO inventory (store_id, material_id, current_count, is_plenty) VALUES (v_store_id, v_mat_vanilla, 3, false);
  INSERT INTO inventory (store_id, material_id, current_count, is_plenty) VALUES (v_store_id, v_mat_bp, 4, false);
  INSERT INTO inventory (store_id, material_id, current_count, is_plenty) VALUES (v_store_id, v_mat_ichigo, 1, false);    -- 閾値3以下
  INSERT INTO inventory (store_id, material_id, current_count, is_plenty) VALUES (v_store_id, v_mat_blueberry, 5, true);
  INSERT INTO inventory (store_id, material_id, current_count, is_plenty) VALUES (v_store_id, v_mat_almond, 3, false);
  INSERT INTO inventory (store_id, material_id, current_count, is_plenty) VALUES (v_store_id, v_mat_wrapping, 3, false);
  INSERT INTO inventory (store_id, material_id, current_count, is_plenty) VALUES (v_store_id, v_mat_giftbox, 0, false);   -- 閾値1以下
  INSERT INTO inventory (store_id, material_id, current_count, is_plenty) VALUES (v_store_id, v_mat_napkin, 2, false);

  -- Step 10: 在庫ログ
  INSERT INTO inventory_logs (store_id, material_id, staff_name, previous_count, new_count, is_plenty) VALUES (v_store_id, v_mat_hakuriki, '田中さくら', 7, 5, false);
  INSERT INTO inventory_logs (store_id, material_id, staff_name, previous_count, new_count, is_plenty) VALUES (v_store_id, v_mat_butter, '佐藤ゆい', 5, 2, false);
  INSERT INTO inventory_logs (store_id, material_id, staff_name, previous_count, new_count, is_plenty) VALUES (v_store_id, v_mat_egg, '田中さくら', 6, 2, false);
  INSERT INTO inventory_logs (store_id, material_id, staff_name, previous_count, new_count, is_plenty) VALUES (v_store_id, v_mat_cream, '鈴木あおい', 8, 3, false);
  INSERT INTO inventory_logs (store_id, material_id, staff_name, previous_count, new_count, is_plenty) VALUES (v_store_id, v_mat_ichigo, '佐藤ゆい', 4, 1, false);
  INSERT INTO inventory_logs (store_id, material_id, staff_name, previous_count, new_count, is_plenty) VALUES (v_store_id, v_mat_giftbox, '田中さくら', 2, 0, false);

  RAISE NOTICE '✅ 完了！店舗ID: %, ユーザーID: %', v_store_id, v_user_id;
END $$;
