-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('images', 'images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('videos', 'videos', true, 104857600, ARRAY['video/mp4', 'video/webm', 'video/quicktime']),
  ('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('private', 'private', false, 10485760, ARRAY['application/json', 'text/plain']);

-- Storage policies for images bucket
CREATE POLICY "Images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'images' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = get_user_name()
  );

CREATE POLICY "Users can update their own images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'images' AND 
    (storage.foldername(name))[1] = get_user_name()
  );

CREATE POLICY "Users can delete their own images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'images' AND 
    (storage.foldername(name))[1] = get_user_name()
  );

-- Storage policies for videos bucket
CREATE POLICY "Videos are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'videos');

CREATE POLICY "Authenticated users can upload videos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'videos' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = get_user_name()
  );

CREATE POLICY "Users can update their own videos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'videos' AND 
    (storage.foldername(name))[1] = get_user_name()
  );

CREATE POLICY "Users can delete their own videos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'videos' AND 
    (storage.foldername(name))[1] = get_user_name()
  );

-- Storage policies for documents bucket
CREATE POLICY "Users can view their own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND 
    (storage.foldername(name))[1] = get_user_name()
  );

CREATE POLICY "Authenticated users can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = get_user_name()
  );

CREATE POLICY "Users can update their own documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents' AND 
    (storage.foldername(name))[1] = get_user_name()
  );

CREATE POLICY "Users can delete their own documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND 
    (storage.foldername(name))[1] = get_user_name()
  );

-- Storage policies for private bucket
CREATE POLICY "Users can view their own private files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'private' AND 
    (storage.foldername(name))[1] = get_user_name()
  );

CREATE POLICY "Authenticated users can upload private files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'private' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = get_user_name()
  );

CREATE POLICY "Users can update their own private files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'private' AND 
    (storage.foldername(name))[1] = get_user_name()
  );

CREATE POLICY "Users can delete their own private files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'private' AND 
    (storage.foldername(name))[1] = get_user_name()
  );

-- Service role can access all storage
CREATE POLICY "Service role can access all storage" ON storage.objects
  FOR ALL USING (auth.role() = 'service_role');
