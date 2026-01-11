-- =====================================================
-- MidCar Database Schema - Complete SQL Migration
-- Run this in your Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. USERS TABLE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    avatar_url TEXT,
    rol TEXT NOT NULL DEFAULT 'vendedor' CHECK (rol IN ('admin', 'vendedor', 'mecanico', 'recepcionista')),
    permisos TEXT[] DEFAULT '{}',
    activo BOOLEAN DEFAULT true,
    fecha_alta TIMESTAMPTZ DEFAULT now(),
    ultimo_acceso TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 2. VEHICLES TABLE (Inventory)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vin TEXT,
    matricula TEXT NOT NULL,
    stock_id TEXT UNIQUE NOT NULL,
    
    -- Status
    estado TEXT NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible', 'reservado', 'vendido', 'taller', 'baja')),
    destacado BOOLEAN DEFAULT false,
    en_oferta BOOLEAN DEFAULT false,
    
    -- Basic Info
    marca TEXT NOT NULL,
    modelo TEXT NOT NULL,
    version TEXT,
    año_fabricacion INTEGER,
    año_matriculacion INTEGER,
    
    -- Technical
    tipo_motor TEXT,
    cilindrada INTEGER,
    potencia_cv INTEGER,
    potencia_kw INTEGER,
    combustible TEXT CHECK (combustible IN ('gasolina', 'diesel', 'hibrido', 'electrico', 'glp', 'gnc')),
    consumo_mixto DECIMAL(4,2),
    emisiones_co2 INTEGER,
    etiqueta_dgt TEXT CHECK (etiqueta_dgt IN ('0', 'ECO', 'C', 'B', 'SIN')),
    transmision TEXT CHECK (transmision IN ('manual', 'automatico', 'semiautomatico')),
    num_marchas INTEGER,
    traccion TEXT,
    
    -- Body
    tipo_carroceria TEXT,
    num_puertas INTEGER,
    num_plazas INTEGER,
    color_exterior TEXT,
    color_interior TEXT,
    
    -- History
    kilometraje INTEGER DEFAULT 0,
    num_propietarios INTEGER DEFAULT 1,
    es_nacional BOOLEAN DEFAULT true,
    primera_mano BOOLEAN DEFAULT false,
    
    -- Commercial
    precio_compra DECIMAL(12,2) DEFAULT 0,
    gastos_compra DECIMAL(12,2) DEFAULT 0,
    coste_reparaciones DECIMAL(12,2) DEFAULT 0,
    precio_venta DECIMAL(12,2) NOT NULL,
    descuento DECIMAL(12,2) DEFAULT 0,
    fecha_entrada_stock DATE DEFAULT CURRENT_DATE,
    
    -- Warranty
    garantia_meses INTEGER DEFAULT 12,
    tipo_garantia TEXT,
    
    -- Images
    imagen_principal TEXT,
    
    -- Web Integration
    url_web TEXT,
    datos_sincronizados BOOLEAN DEFAULT false,
    ultima_sincronizacion TIMESTAMPTZ,
    
    -- Equipment
    equipamiento TEXT[] DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for vehicles
CREATE INDEX IF NOT EXISTS idx_vehicles_estado ON public.vehicles(estado);
CREATE INDEX IF NOT EXISTS idx_vehicles_marca ON public.vehicles(marca);
CREATE INDEX IF NOT EXISTS idx_vehicles_precio ON public.vehicles(precio_venta);

-- =====================================================
-- 3. CLIENTS TABLE (Verified customers)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_cliente TEXT DEFAULT 'particular' CHECK (tipo_cliente IN ('particular', 'empresa')),
    
    nombre TEXT NOT NULL,
    apellidos TEXT,
    razon_social TEXT,
    
    nif_nie TEXT,
    cif TEXT,
    email TEXT,
    telefono TEXT NOT NULL,
    
    direccion TEXT,
    cp TEXT,
    municipio TEXT,
    provincia TEXT,
    
    preferencias_comunicacion TEXT[] DEFAULT '{}',
    acepta_marketing BOOLEAN DEFAULT false,
    origen_lead TEXT,
    consentimiento_rgpd BOOLEAN DEFAULT false,
    fecha_registro TIMESTAMPTZ DEFAULT now(),
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_telefono ON public.clients(telefono);

-- =====================================================
-- 4. CONTACTS TABLE (Potential customers)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    telefono TEXT NOT NULL,
    email TEXT,
    nombre TEXT,
    apellidos TEXT,
    dni_cif TEXT,
    
    direccion TEXT,
    codigo_postal TEXT,
    municipio TEXT,
    provincia TEXT,
    
    datos_facturacion JSONB,
    
    origen TEXT NOT NULL CHECK (origen IN ('web', 'telefono', 'presencial', 'whatsapp', 'coches_net', 'wallapop', 'autocasion', 'facebook', 'instagram', 'referido', 'otro')),
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'comunicado', 'tramite', 'reservado', 'postventa', 'busqueda', 'cerrado')),
    
    vehiculos_interes UUID[] DEFAULT '{}',
    
    preferencias_comunicacion TEXT[] DEFAULT '{}',
    acepta_marketing BOOLEAN DEFAULT false,
    consentimiento_rgpd BOOLEAN DEFAULT false,
    notas TEXT,
    
    progreso INTEGER DEFAULT 0 CHECK (progreso >= 0 AND progreso <= 100),
    categoria TEXT CHECK (categoria IN ('vehiculo', 'financiacion', 'postventa', 'tasacion', 'otro')),
    asunto TEXT,
    comercial_asignado UUID REFERENCES public.users(id),
    tipo_pago TEXT CHECK (tipo_pago IN ('contado', 'financiacion', 'renting')),
    transporte DECIMAL(10,2),
    es_nuevo_cliente BOOLEAN DEFAULT true,
    precio DECIMAL(12,2),
    reserva DECIMAL(12,2),
    
    fecha_registro TIMESTAMPTZ DEFAULT now(),
    fecha_ultimo_contacto TIMESTAMPTZ,
    ultima_interaccion TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contacts_estado ON public.contacts(estado);
CREATE INDEX IF NOT EXISTS idx_contacts_origen ON public.contacts(origen);
CREATE INDEX IF NOT EXISTS idx_contacts_telefono ON public.contacts(telefono);

-- =====================================================
-- 5. LEADS TABLE (CRM Pipeline)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    vehiculo_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    
    estado TEXT DEFAULT 'nuevo' CHECK (estado IN ('nuevo', 'contactado', 'visita_agendada', 'prueba_programada', 'propuesta_enviada', 'negociacion', 'vendido', 'perdido')),
    prioridad TEXT DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente')),
    probabilidad INTEGER DEFAULT 50 CHECK (probabilidad >= 0 AND probabilidad <= 100),
    
    tipo_interes TEXT,
    presupuesto_cliente DECIMAL(12,2),
    forma_pago TEXT,
    
    asignado_a UUID REFERENCES public.users(id),
    
    transcript_chatbot JSONB DEFAULT '[]',
    sentimiento_ia TEXT DEFAULT 'neutral' CHECK (sentimiento_ia IN ('positivo', 'neutral', 'negativo')),
    
    fecha_creacion TIMESTAMPTZ DEFAULT now(),
    fecha_cierre TIMESTAMPTZ,
    ultima_interaccion TIMESTAMPTZ,
    proxima_accion TEXT,
    fecha_proxima_accion DATE,
    
    motivo_perdida TEXT,
    notas TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_estado ON public.leads(estado);
CREATE INDEX IF NOT EXISTS idx_leads_prioridad ON public.leads(prioridad);
CREATE INDEX IF NOT EXISTS idx_leads_cliente ON public.leads(cliente_id);
CREATE INDEX IF NOT EXISTS idx_leads_vehiculo ON public.leads(vehiculo_id);

-- =====================================================
-- 6. INTERACTIONS TABLE (Communication history)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    
    tipo TEXT NOT NULL CHECK (tipo IN ('llamada_saliente', 'llamada_entrante', 'email_enviado', 'email_recibido', 'whatsapp', 'visita', 'nota', 'prueba')),
    
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    hora TIME NOT NULL DEFAULT CURRENT_TIME,
    duracion_minutos INTEGER,
    descripcion TEXT,
    resultado TEXT,
    
    seguimiento_fecha DATE,
    seguimiento_hora TIME,
    siguiente_accion TEXT,
    fecha_siguiente_accion DATE,
    
    realizada_por UUID REFERENCES public.users(id),
    
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interactions_contact ON public.interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_interactions_lead ON public.interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_interactions_fecha ON public.interactions(fecha DESC);

-- =====================================================
-- 7. SALES TABLE (Transactions)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_factura TEXT UNIQUE,
    
    cliente_id UUID REFERENCES public.clients(id),
    vehiculo_id UUID REFERENCES public.vehicles(id),
    vendedor_id UUID REFERENCES public.users(id),
    lead_id UUID REFERENCES public.leads(id),
    
    fecha_venta DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_entrega DATE,
    
    precio_venta DECIMAL(12,2) NOT NULL,
    descuento DECIMAL(12,2) DEFAULT 0,
    gastos_adicionales DECIMAL(12,2) DEFAULT 0,
    
    forma_pago TEXT CHECK (forma_pago IN ('contado', 'financiacion', 'leasing', 'renting')),
    financiacion BOOLEAN DEFAULT false,
    entidad_financiera TEXT,
    importe_financiado DECIMAL(12,2),
    cuotas INTEGER,
    
    garantia_meses INTEGER DEFAULT 12,
    garantia_tipo TEXT,
    
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'entregado', 'completada', 'cancelada')),
    
    coste_total_vehiculo DECIMAL(12,2),
    margen_bruto DECIMAL(12,2),
    porcentaje_margen DECIMAL(5,2),
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_fecha ON public.sales(fecha_venta DESC);
CREATE INDEX IF NOT EXISTS idx_sales_estado ON public.sales(estado);

-- =====================================================
-- 8. TASKS TABLE (Follow-ups, reminders)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    
    titulo TEXT NOT NULL,
    descripcion TEXT,
    tipo TEXT CHECK (tipo IN ('llamada', 'email', 'visita', 'entrega', 'seguimiento', 'otro')),
    prioridad TEXT DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente')),
    
    fecha_vencimiento DATE NOT NULL,
    hora_vencimiento TIME,
    
    asignado_a UUID REFERENCES public.users(id),
    
    completada BOOLEAN DEFAULT false,
    fecha_completada TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_vencimiento ON public.tasks(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_tasks_completada ON public.tasks(completada);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES (Allow all for authenticated users)
-- =====================================================
-- For development, allow all operations for authenticated users
-- In production, you should create more restrictive policies

CREATE POLICY "Enable all for authenticated users" ON public.users FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.vehicles FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.clients FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.contacts FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.leads FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.interactions FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.sales FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.tasks FOR ALL USING (true);

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'MidCar database schema created successfully!';
    RAISE NOTICE 'Tables created: users, vehicles, clients, contacts, leads, interactions, sales, tasks';
END $$;
