-- =====================================================
-- MidCar - Migration 016: Contadores atómicos de numeración de documentos
-- Numeración correlativa legal (Ley 37/1992 IVA) para facturas, contratos,
-- señales y proformas. Sustituye a la numeración aleatoria en cliente y a los
-- SELECT max+1 no atómicos, que podían producir duplicados con usuarios
-- simultáneos.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.document_counters (
    doc_type TEXT NOT NULL,
    year INTEGER NOT NULL,
    last_number INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (doc_type, year)
);

ALTER TABLE public.document_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Counters manageable by authenticated users" ON public.document_counters;
CREATE POLICY "Counters manageable by authenticated users" ON public.document_counters
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================
-- Semilla: continuar cada serie a partir de los documentos ya existentes.
-- Para facturas solo se consideran las series secuenciales FA-/FAC-; el
-- formato legacy F- era ALEATORIO (podía llegar a 9999) y sembraría el
-- contador con un salto de miles de números. FA- no colisiona con F- aunque
-- compartan sufijo numérico porque el prefijo es distinto.
-- =====================================================
INSERT INTO public.document_counters (doc_type, year, last_number)
SELECT 'factura', EXTRACT(YEAR FROM CURRENT_DATE)::INT,
       COALESCE(MAX(CAST(SUBSTRING(numero_factura FROM '[0-9]+$') AS INTEGER)), 0)
FROM public.facturas
WHERE numero_factura ~ ('^(FA|FAC)-' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || '-[0-9]+$')
ON CONFLICT (doc_type, year) DO NOTHING;

INSERT INTO public.document_counters (doc_type, year, last_number)
SELECT 'compraventa', EXTRACT(YEAR FROM CURRENT_DATE)::INT,
       COALESCE(MAX(CAST(SUBSTRING(numero_contrato FROM '[0-9]+$') AS INTEGER)), 0)
FROM public.contratos
WHERE numero_contrato ~ ('^CV-' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || '-[0-9]+$')
ON CONFLICT (doc_type, year) DO NOTHING;

INSERT INTO public.document_counters (doc_type, year, last_number)
SELECT 'senal', EXTRACT(YEAR FROM CURRENT_DATE)::INT,
       COALESCE(MAX(CAST(SUBSTRING(numero_senal FROM '[0-9]+$') AS INTEGER)), 0)
FROM public.senales
WHERE numero_senal ~ ('^SN-' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || '-[0-9]+$')
ON CONFLICT (doc_type, year) DO NOTHING;

INSERT INTO public.document_counters (doc_type, year, last_number)
SELECT 'proforma', EXTRACT(YEAR FROM CURRENT_DATE)::INT,
       COALESCE(MAX(CAST(SUBSTRING(numero_proforma FROM '[0-9]+$') AS INTEGER)), 0)
FROM public.proformas
WHERE numero_proforma ~ ('^PF-' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || '-[0-9]+$')
ON CONFLICT (doc_type, year) DO NOTHING;

-- =====================================================
-- Función atómica: incrementa el contador con bloqueo de fila y devuelve el
-- siguiente número formateado (p.ej. FA-2026-0001). Dos llamadas simultáneas
-- nunca reciben el mismo número.
-- =====================================================
CREATE OR REPLACE FUNCTION public.next_document_number(p_doc_type TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE)::INT;
    v_prefix TEXT;
    v_next INTEGER;
BEGIN
    v_prefix := CASE p_doc_type
        WHEN 'factura' THEN 'FA'
        WHEN 'compraventa' THEN 'CV'
        WHEN 'senal' THEN 'SN'
        WHEN 'proforma' THEN 'PF'
        ELSE NULL
    END;

    IF v_prefix IS NULL THEN
        RAISE EXCEPTION 'Tipo de documento no válido: %', p_doc_type;
    END IF;

    INSERT INTO public.document_counters AS dc (doc_type, year, last_number)
    VALUES (p_doc_type, v_year, 1)
    ON CONFLICT (doc_type, year)
    DO UPDATE SET last_number = dc.last_number + 1,
                  updated_at = now()
    RETURNING dc.last_number INTO v_next;

    RETURN v_prefix || '-' || v_year::TEXT || '-' || LPAD(v_next::TEXT, 4, '0');
END;
$$;

-- Supabase concede EXECUTE a anon/authenticated por privilegios por defecto,
-- así que hay que revocar a anon explícitamente (no basta con PUBLIC)
REVOKE EXECUTE ON FUNCTION public.next_document_number(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.next_document_number(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.next_document_number(TEXT) TO authenticated;
