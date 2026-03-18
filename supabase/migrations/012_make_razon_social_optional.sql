-- Hacer razon_social opcional para autónomos que no tienen razón social
ALTER TABLE public.empresas ALTER COLUMN razon_social DROP NOT NULL;
