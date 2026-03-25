-- Add documentos JSONB column to vehicles table for storing vehicle documents
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS documentos JSONB DEFAULT '[]';

COMMENT ON COLUMN public.vehicles.documentos IS 'Array of document objects: [{"id": "...", "nombre": "...", "tipo": "ficha_tecnica", "url": "https://...", "fecha_subida": "2024-01-01"}]';
