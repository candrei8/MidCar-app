-- =====================================================
-- MidCar - Migration 006: Documentos Generados (Señales y Proformas)
-- Run this in your Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. CONTRATOS DE SEÑAL (Deposit Contracts)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.senales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_senal TEXT UNIQUE NOT NULL,

    -- Empresa vendedora
    empresa_id UUID REFERENCES public.empresas(id),
    empresa_nombre TEXT,
    empresa_cif TEXT,

    -- Vehículo
    vehiculo_id UUID REFERENCES public.vehicles(id),
    vehiculo_marca TEXT,
    vehiculo_modelo TEXT,
    vehiculo_matricula TEXT,
    vehiculo_vin TEXT,

    -- Comprador
    comprador_nombre TEXT NOT NULL,
    comprador_apellidos TEXT,
    comprador_documento TEXT NOT NULL,
    comprador_direccion TEXT,
    comprador_cp TEXT,
    comprador_localidad TEXT,
    comprador_provincia TEXT,
    comprador_telefono TEXT,
    comprador_email TEXT,

    -- Económico
    precio_total DECIMAL(12,2) NOT NULL,
    importe_senal DECIMAL(12,2) NOT NULL,
    resto_pendiente DECIMAL(12,2) NOT NULL,

    -- Fechas
    fecha_senal DATE NOT NULL,
    fecha_limite_venta DATE NOT NULL,

    -- Estado
    estado TEXT DEFAULT 'activa' CHECK (estado IN ('activa', 'convertida', 'cancelada', 'vencida')),

    -- Cuenta bancaria
    cuenta_bancaria TEXT,

    -- Notas
    observaciones TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.users(id),
    created_by_name TEXT
);

-- =====================================================
-- 2. FACTURAS PROFORMA
-- =====================================================
CREATE TABLE IF NOT EXISTS public.proformas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_proforma TEXT UNIQUE NOT NULL,

    -- Empresa emisora
    empresa_id UUID REFERENCES public.empresas(id),
    empresa_nombre TEXT,
    empresa_cif TEXT,

    -- Vehículo
    vehiculo_id UUID REFERENCES public.vehicles(id),
    vehiculo_descripcion TEXT,

    -- Cliente
    cliente_nombre TEXT NOT NULL,
    cliente_apellidos TEXT,
    cliente_documento TEXT NOT NULL,
    cliente_direccion TEXT,
    cliente_cp TEXT,
    cliente_localidad TEXT,
    cliente_provincia TEXT,

    -- Totales
    base_imponible DECIMAL(12,2) NOT NULL,
    tipo_iva INTEGER DEFAULT 21,
    iva DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,

    -- Reserva sugerida
    importe_reserva DECIMAL(12,2),

    -- Validez
    fecha_proforma DATE NOT NULL,
    validez_dias INTEGER DEFAULT 15,
    fecha_expiracion DATE,

    -- Estado
    estado TEXT DEFAULT 'vigente' CHECK (estado IN ('vigente', 'aceptada', 'rechazada', 'expirada')),

    -- Forma de pago
    forma_pago TEXT,
    cuenta_bancaria TEXT,

    -- Notas
    observaciones TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.users(id),
    created_by_name TEXT
);

-- =====================================================
-- 3. SECUENCIAS PARA NUMERACIÓN
-- =====================================================

-- Crear función para generar números secuenciales
CREATE OR REPLACE FUNCTION generate_document_number(prefix TEXT, table_name TEXT)
RETURNS TEXT AS $$
DECLARE
    year_str TEXT;
    next_num INTEGER;
    result TEXT;
BEGIN
    year_str := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;

    -- Obtener el siguiente número para este año
    EXECUTE format(
        'SELECT COALESCE(MAX(CAST(SUBSTRING(numero_%s FROM ''[0-9]+$'') AS INTEGER)), 0) + 1
         FROM public.%s
         WHERE numero_%s LIKE %L',
        table_name, table_name || 's', table_name, prefix || '-' || year_str || '-%'
    ) INTO next_num;

    -- Formatear el resultado
    result := prefix || '-' || year_str || '-' || LPAD(next_num::TEXT, 4, '0');

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_senales_estado ON public.senales(estado);
CREATE INDEX IF NOT EXISTS idx_senales_vehiculo ON public.senales(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_senales_fecha ON public.senales(fecha_senal);
CREATE INDEX IF NOT EXISTS idx_proformas_estado ON public.proformas(estado);
CREATE INDEX IF NOT EXISTS idx_proformas_vehiculo ON public.proformas(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_proformas_fecha ON public.proformas(fecha_proforma);

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================
ALTER TABLE public.senales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proformas ENABLE ROW LEVEL SECURITY;

-- Señales
CREATE POLICY "Senales viewable by authenticated users" ON public.senales
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Senales manageable by authenticated users" ON public.senales
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Proformas
CREATE POLICY "Proformas viewable by authenticated users" ON public.proformas
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Proformas manageable by authenticated users" ON public.proformas
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================
-- 6. AÑADIR CAMPOS FALTANTES A FACTURAS (si no existen)
-- =====================================================
DO $$
BEGIN
    -- Añadir campo cuenta_bancaria si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'facturas' AND column_name = 'cuenta_bancaria') THEN
        ALTER TABLE public.facturas ADD COLUMN cuenta_bancaria TEXT;
    END IF;
END $$;
