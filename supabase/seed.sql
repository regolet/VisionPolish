-- Insert sample services
INSERT INTO public.services (name, description, category, base_price, turnaround_time, features, image_url, is_active) VALUES
  ('Photo Retouching', 'Professional retouching to enhance portraits and remove imperfections', 'portrait', 15.00, '24-48 hours', ARRAY['Skin smoothing', 'Blemish removal', 'Teeth whitening', 'Eye enhancement', 'Color correction'], 'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=400', true),
  
  ('Background Removal', 'Clean, precise background removal for product photos and portraits', 'product', 5.00, '12-24 hours', ARRAY['Transparent background', 'White background option', 'Custom background', 'Edge refinement'], 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', true),
  
  ('Color Correction', 'Expert color grading and correction for vibrant, balanced images', 'creative', 10.00, '24 hours', ARRAY['Color balance adjustment', 'Brightness/contrast', 'Saturation enhancement', 'White balance', 'Tone mapping'], 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400', true),
  
  ('Image Restoration', 'Restore old, damaged photos to their former glory', 'restoration', 25.00, '48-72 hours', ARRAY['Damage repair', 'Color restoration', 'Scratch removal', 'Fade correction', 'Digital enhancement'], 'https://images.unsplash.com/photo-1566438480900-0609be27a4be?w=400', true);

-- Create admin role (optional, for future admin management)
-- You would need to manually set a user as admin in the profiles table
-- ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@visionpolish.com';