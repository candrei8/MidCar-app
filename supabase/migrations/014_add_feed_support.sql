-- =====================================================
-- 014: Google Merchant feed support
-- =====================================================

-- Per-vehicle opt-out flag (defaults to true so all existing inventory ships)
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS incluir_en_feed BOOLEAN DEFAULT true;

UPDATE public.vehicles SET incluir_en_feed = true WHERE incluir_en_feed IS NULL;

ALTER TABLE public.vehicles
  ALTER COLUMN incluir_en_feed SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vehicles_feed_eligible
  ON public.vehicles(incluir_en_feed, estado)
  WHERE incluir_en_feed = true AND estado IN ('disponible', 'reservado');

COMMENT ON COLUMN public.vehicles.incluir_en_feed
  IS 'Si true, el vehículo se publica en el feed XML de Google Merchant cuando cumple el resto de requisitos (estado, precio, imagen).';

-- Metadata of the last feed generation (one row per feed id, e.g. "merchant")
CREATE TABLE IF NOT EXISTS public.feed_metadata (
  id TEXT PRIMARY KEY,
  last_generated_at TIMESTAMPTZ,
  item_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ok', 'error')),
  error_message TEXT,
  triggered_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.feed_metadata (id, status)
VALUES ('merchant', 'pending')
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.feed_metadata
  IS 'Estado de la última generación de cada feed XML servido por la app.';
