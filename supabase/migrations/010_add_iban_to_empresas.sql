-- =====================================================
-- MidCar - Migration 010: Add IBAN to empresas table
-- =====================================================

ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS iban TEXT;

COMMENT ON COLUMN public.empresas.iban IS 'IBAN / Cuenta bancaria de la empresa';
