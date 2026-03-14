-- =====================================================
-- MidCar - Migration 005: Pólizas de Seguro
-- Run this in your Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. POLIZAS DE SEGURO (Insurance Policies)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.polizas_seguro (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Vehículo vinculado
    vehiculo_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
    vehiculo_matricula TEXT,
    
    -- Datos de la póliza
    numero_poliza TEXT NOT NULL,
    compania_aseguradora TEXT NOT NULL DEFAULT 'AXA',
    tipo_poliza TEXT CHECK (tipo_poliza IN ('terceros_basico', 'terceros_ampliado', 'todo_riesgo_franquicia', 'todo_riesgo_sin_franquicia')),
    
    -- Fechas
    fecha_alta DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    
    -- Económico
    prima_anual DECIMAL(10,2),
    franquicia DECIMAL(10,2),
    
    -- Tomador
    tomador_nombre TEXT,
    tomador_nif TEXT,
    
    -- Coberturas (JSON)
    coberturas JSONB DEFAULT '{
        "rcObligatoria": true,
        "rcVoluntaria": false,
        "defensaJuridica": false,
        "asistenciaViaje": false,
        "robo": false,
        "incendio": false,
        "lunas": false,
        "daniosPropios": false,
        "ocupantes": false,
        "vehiculoSustitucion": false
    }'::jsonb,
    
    -- Documentos (URLs)
    documento_poliza TEXT,
    documento_recibo TEXT,
    
    -- Estado
    estado TEXT DEFAULT 'activa' CHECK (estado IN ('activa', 'vencida', 'cancelada', 'pendiente')),
    
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
CREATE INDEX IF NOT EXISTS idx_polizas_vehiculo ON public.polizas_seguro(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_polizas_vencimiento ON public.polizas_seguro(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_polizas_estado ON public.polizas_seguro(estado);
CREATE UNIQUE INDEX IF NOT EXISTS idx_polizas_numero ON public.polizas_seguro(numero_poliza);

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE public.polizas_seguro ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all policies
CREATE POLICY "Polizas viewable by authenticated users" ON public.polizas_seguro
    FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to manage policies
CREATE POLICY "Polizas manageable by authenticated users" ON public.polizas_seguro
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================
-- TRIGGER for updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_polizas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_polizas_updated_at
    BEFORE UPDATE ON public.polizas_seguro
    FOR EACH ROW
    EXECUTE FUNCTION update_polizas_updated_at();
