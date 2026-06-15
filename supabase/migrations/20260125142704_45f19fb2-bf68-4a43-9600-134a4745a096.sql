-- Create storage bucket for vet certificates
INSERT INTO storage.buckets (id, name, public)
VALUES ('vet-certificates', 'vet-certificates', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: Vets can upload their own certificates
CREATE POLICY "Vets can upload their own certificates"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vet-certificates' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS: Vets can view their own certificates
CREATE POLICY "Vets can view their own certificates"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'vet-certificates' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS: Admins can view all certificates for verification
CREATE POLICY "Admins can view all vet certificates"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'vet-certificates' 
  AND has_role(auth.uid(), 'admin')
);

-- RLS: Vets can update their own certificates
CREATE POLICY "Vets can update their own certificates"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'vet-certificates' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS: Vets can delete their own certificates
CREATE POLICY "Vets can delete their own certificates"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'vet-certificates' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);