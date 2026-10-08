-- ============================================================
-- AVALON DATING — STORAGE BUCKET SETUP (Phase 2)
-- Migration: 20260917152531_avalon_storage_setup.sql
-- ============================================================

-- Create the profile-photos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profile-photos',
    'profile-photos',
    false,
    5242880,  -- 5MB limit per file
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ---- STORAGE RLS POLICIES ----

-- Allow authenticated users to read any profile photo (needed for discovery)
DROP POLICY IF EXISTS "profile_photos_storage_select" ON storage.objects;
CREATE POLICY "profile_photos_storage_select"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'profile-photos');

-- Allow authenticated users to upload their own photos
-- Path convention: profile-photos/{user_id}/{filename}
DROP POLICY IF EXISTS "profile_photos_storage_insert" ON storage.objects;
CREATE POLICY "profile_photos_storage_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
);

-- Allow users to update only their own photos
DROP POLICY IF EXISTS "profile_photos_storage_update" ON storage.objects;
CREATE POLICY "profile_photos_storage_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
)
WITH CHECK (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
);

-- Allow users to delete only their own photos
DROP POLICY IF EXISTS "profile_photos_storage_delete" ON storage.objects;
CREATE POLICY "profile_photos_storage_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
);
