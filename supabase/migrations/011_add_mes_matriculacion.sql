-- Add mes_matriculacion column to vehicles table
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS mes_matriculacion INTEGER;
