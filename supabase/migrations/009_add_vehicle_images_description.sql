-- Add missing columns to vehicles table for images, description, and ITV date
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS imagenes JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS descripcion TEXT,
  ADD COLUMN IF NOT EXISTS fecha_itv_vencimiento DATE;

-- Comment on the imagenes column to document the expected structure
COMMENT ON COLUMN public.vehicles.imagenes IS 'Array of image objects: [{"url": "https://...", "es_principal": true, "orden": 0}]';
