-- =====================================================
-- MidCar - Migration 015: Identificador único de documento MidCar
-- Añade la columna `midcar_identifier` a las tablas de documentos
-- (contratos, señales, facturas, proformas) para soportar el QR
-- de verificación impreso en cada PDF generado.
-- =====================================================

ALTER TABLE IF EXISTS public.contratos
  ADD COLUMN IF NOT EXISTS midcar_identifier TEXT;

ALTER TABLE IF EXISTS public.senales
  ADD COLUMN IF NOT EXISTS midcar_identifier TEXT;

ALTER TABLE IF EXISTS public.facturas
  ADD COLUMN IF NOT EXISTS midcar_identifier TEXT;

ALTER TABLE IF EXISTS public.proformas
  ADD COLUMN IF NOT EXISTS midcar_identifier TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_contratos_midcar_identifier
  ON public.contratos (midcar_identifier)
  WHERE midcar_identifier IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_senales_midcar_identifier
  ON public.senales (midcar_identifier)
  WHERE midcar_identifier IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_facturas_midcar_identifier
  ON public.facturas (midcar_identifier)
  WHERE midcar_identifier IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_proformas_midcar_identifier
  ON public.proformas (midcar_identifier)
  WHERE midcar_identifier IS NOT NULL;
