-- ========================================
-- PORTFOLIO V2 - STORAGE BUCKET SETUP
-- ========================================
-- Storage configuration for profile pictures
-- Run this in your Supabase SQL Editor
-- ========================================

-- ========================================
-- STORAGE BUCKET: profile-pictures
-- Stores user profile pictures
-- ========================================

-- Create the storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pictures',
  'profile-pictures',
  true,  -- Public bucket (files are publicly accessible)
  5242880,  -- 5MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']  -- Allowed image types
)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- STORAGE POLICIES
-- Set up Row Level Security for the bucket
-- ========================================

-- Allow anyone to read files (public access)
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-pictures');

-- Allow authenticated uploads
CREATE POLICY "Authenticated users can upload profile pictures"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-pictures');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update profile pictures"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'profile-pictures');

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete profile pictures"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'profile-pictures');

-- ========================================
-- VERIFICATION
-- ========================================
-- Run this query to verify the bucket was created:
-- SELECT * FROM storage.buckets WHERE id = 'profile-pictures';
--
-- You should see one row with:
-- - id: profile-pictures
-- - name: profile-pictures
-- - public: true
-- - file_size_limit: 5242880
-- - allowed_mime_types: {image/jpeg, image/png, image/gif, image/webp}
-- ========================================

-- ========================================
-- NOTES FOR DEVELOPER
-- ========================================
--
-- BUCKET CONFIGURATION:
-- - Name: profile-pictures
-- - Access: Public (anyone can read, authenticated can write)
-- - Max file size: 5MB
-- - Allowed types: JPEG, PNG, GIF, WebP
--
-- USAGE IN CODE:
-- Upload: supabase.storage.from('profile-pictures').upload(filename, file)
-- Get URL: supabase.storage.from('profile-pictures').getPublicUrl(path)
-- Delete: supabase.storage.from('profile-pictures').remove([filename])
--
-- TROUBLESHOOTING:
-- If you get "bucket not found" error:
-- 1. Verify this SQL was executed successfully
-- 2. Check Supabase Dashboard > Storage to see if bucket exists
-- 3. Verify RLS policies are enabled
-- ========================================
