-- ============================================
-- 004: 保管場所に写真を追加
-- ============================================
ALTER TABLE locations ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';

-- Storage bucket for location images (run manually in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('location-images', 'location-images', true);
-- CREATE POLICY "Anyone can view location images" ON storage.objects FOR SELECT USING (bucket_id = 'location-images');
-- CREATE POLICY "Authenticated users can upload location images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'location-images' AND auth.role() = 'authenticated');
-- CREATE POLICY "Authenticated users can delete location images" ON storage.objects FOR DELETE USING (bucket_id = 'location-images' AND auth.role() = 'authenticated');
