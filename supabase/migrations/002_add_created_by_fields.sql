-- =====================================================
-- MidCar Database Schema - Add created_by fields
-- Run this in your Supabase SQL Editor AFTER 001_complete_schema.sql
-- =====================================================

-- Add created_by fields to vehicles
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS created_by_name TEXT;

-- Add created_by fields to contacts
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS created_by_name TEXT;

-- Add created_by fields to leads
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS created_by_name TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicles_created_by ON public.vehicles(created_by);
CREATE INDEX IF NOT EXISTS idx_contacts_created_by ON public.contacts(created_by);
CREATE INDEX IF NOT EXISTS idx_leads_created_by ON public.leads(created_by);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'created_by fields added successfully to vehicles, contacts, and leads tables!';
END $$;
