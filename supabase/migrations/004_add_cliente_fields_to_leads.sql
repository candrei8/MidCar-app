-- =====================================================
-- MidCar Database Schema - Add cliente embedded fields to leads
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Add cliente embedded fields to leads table
-- These fields allow storing client info directly on the lead
-- without requiring a separate cliente record
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS cliente_nombre TEXT,
ADD COLUMN IF NOT EXISTS cliente_apellidos TEXT,
ADD COLUMN IF NOT EXISTS cliente_email TEXT,
ADD COLUMN IF NOT EXISTS cliente_telefono TEXT;

-- Create index for searching by client name
CREATE INDEX IF NOT EXISTS idx_leads_cliente_nombre ON public.leads(cliente_nombre);
CREATE INDEX IF NOT EXISTS idx_leads_cliente_apellidos ON public.leads(cliente_apellidos);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Cliente embedded fields added successfully to leads table!';
END $$;
