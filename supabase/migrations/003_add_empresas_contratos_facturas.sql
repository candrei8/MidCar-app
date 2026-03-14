-- =====================================================
-- MidCar - Migration 003: Empresas, Contratos, Facturas
-- Run this in your Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. EMPRESAS VENDEDORAS (Company Configuration)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_comercial TEXT NOT NULL,
    razon_social TEXT NOT NULL,
    cif TEXT NOT NULL UNIQUE,
    direccion TEXT NOT NULL,
    codigo_postal TEXT NOT NULL,
    localidad TEXT NOT NULL,
    provincia TEXT NOT NULL,
    telefono TEXT,
    email TEXT,
    web TEXT,
    logo TEXT,
    activa BOOLEAN DEFAULT true,
    es_ejemplo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.users(id),
    created_by_name TEXT
);

-- =====================================================
-- 2. CONTRATOS (Sales Contracts)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.contratos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_contrato TEXT UNIQUE NOT NULL,

    -- Empresa vendedora
    empresa_id UUID REFERENCES public.empresas(id),
    empresa_nombre TEXT,
    empresa_cif TEXT,
    empresa_direccion TEXT,

    -- Vehículo
    vehiculo_id UUID REFERENCES public.vehicles(id),
    vehiculo_marca TEXT,
    vehiculo_modelo TEXT,
    vehiculo_matricula TEXT,
    vehiculo_vin TEXT,
    vehiculo_km INTEGER,
    vehiculo_precio DECIMAL(12,2),

    -- Comprador
    comprador_tipo TEXT CHECK (comprador_tipo IN ('particular', 'empresa', 'autonomo')),
    comprador_nombre TEXT NOT NULL,
    comprador_apellidos TEXT,
    comprador_documento_tipo TEXT,
    comprador_documento TEXT NOT NULL,
    comprador_direccion TEXT,
    comprador_cp TEXT,
    comprador_localidad TEXT,
    comprador_provincia TEXT,
    comprador_telefono TEXT,
    comprador_email TEXT,

    -- Economía
    precio_venta DECIMAL(12,2) NOT NULL,
    forma_pago TEXT,
    entrega_inicial DECIMAL(12,2) DEFAULT 0,
    financiado DECIMAL(12,2) DEFAULT 0,

    -- Garantía
    garantia_meses INTEGER DEFAULT 12,
    garantia_km INTEGER,
    garantia_tipo TEXT,

    -- Estado
    estado TEXT DEFAULT 'borrador' CHECK (estado IN ('borrador', 'firmado', 'entregado', 'cancelado')),
    fecha_firma DATE,
    fecha_entrega DATE,

    -- Notas
    notas TEXT,
    clausulas_adicionales TEXT,

    -- PDF
    pdf_url TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.users(id),
    created_by_name TEXT
);

-- =====================================================
-- 3. FACTURAS (Invoices)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.facturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_factura TEXT UNIQUE NOT NULL,

    -- Empresa emisora
    empresa_id UUID REFERENCES public.empresas(id),
    empresa_nombre TEXT,
    empresa_cif TEXT,
    empresa_direccion TEXT,

    -- Vehículo (opcional, puede ser factura de servicios)
    vehiculo_id UUID REFERENCES public.vehicles(id),
    vehiculo_descripcion TEXT,

    -- Contrato relacionado (opcional)
    contrato_id UUID REFERENCES public.contratos(id),

    -- Cliente
    cliente_tipo TEXT CHECK (cliente_tipo IN ('particular', 'empresa', 'autonomo')),
    cliente_nombre TEXT NOT NULL,
    cliente_apellidos TEXT,
    cliente_documento_tipo TEXT,
    cliente_documento TEXT NOT NULL,
    cliente_direccion TEXT,
    cliente_cp TEXT,
    cliente_localidad TEXT,
    cliente_provincia TEXT,

    -- Líneas de factura (JSON array)
    lineas JSONB DEFAULT '[]',

    -- Totales
    base_imponible DECIMAL(12,2) NOT NULL,
    tipo_iva INTEGER DEFAULT 21,
    iva DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,

    -- Pago
    forma_pago TEXT,
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagada', 'vencida', 'anulada')),
    fecha_vencimiento DATE,
    fecha_pago DATE,

    -- PDF
    pdf_url TEXT,

    -- Notas
    notas TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.users(id),
    created_by_name TEXT
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_empresas_activa ON public.empresas(activa);
CREATE INDEX IF NOT EXISTS idx_empresas_cif ON public.empresas(cif);
CREATE INDEX IF NOT EXISTS idx_contratos_estado ON public.contratos(estado);
CREATE INDEX IF NOT EXISTS idx_contratos_vehiculo ON public.contratos(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_facturas_estado ON public.facturas(estado);
CREATE INDEX IF NOT EXISTS idx_facturas_numero ON public.facturas(numero_factura);

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all empresas
CREATE POLICY "Empresas viewable by authenticated users" ON public.empresas
    FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to manage empresas
CREATE POLICY "Empresas manageable by authenticated users" ON public.empresas
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow authenticated users to read all contratos
CREATE POLICY "Contratos viewable by authenticated users" ON public.contratos
    FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to manage contratos
CREATE POLICY "Contratos manageable by authenticated users" ON public.contratos
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow authenticated users to read all facturas
CREATE POLICY "Facturas viewable by authenticated users" ON public.facturas
    FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to manage facturas
CREATE POLICY "Facturas manageable by authenticated users" ON public.facturas
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
