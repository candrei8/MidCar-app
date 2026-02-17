-- =====================================================
-- MidCar - Insercion de Contratos desde PDFs
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- Contrato 1: Peugeot 5008 GT Line (comprador sin datos completos)
INSERT INTO public.contratos (
    numero_contrato,
    empresa_nombre,
    empresa_cif,
    empresa_direccion,
    vehiculo_marca,
    vehiculo_modelo,
    vehiculo_km,
    vehiculo_precio,
    comprador_tipo,
    comprador_nombre,
    comprador_documento_tipo,
    comprador_documento,
    precio_venta,
    forma_pago,
    garantia_meses,
    garantia_km,
    garantia_tipo,
    estado,
    fecha_firma,
    notas
) VALUES (
    'CV-2026-0001',
    'MIDCAR AUTOMOCION S.L.',
    'B12345678',
    'Calle Principal, 123, 28001 Madrid',
    'Peugeot',
    '5008 GT Line',
    87000,
    29950.00,
    'particular',
    '(Sin especificar)',
    'DNI',
    '(Sin especificar)',
    29950.00,
    'Transferencia bancaria',
    12,
    12000,
    'Mecanica y electrica',
    'borrador',
    '2026-01-25',
    'Contrato importado desde PDF. Datos del comprador pendientes de completar. Vehiculo: 2020, diesel, 180 CV. Base imponible: 24.752,07 EUR, IVA (21%): 5.197,93 EUR'
);

-- Contrato 2: BMW 530dA Luxury Line
INSERT INTO public.contratos (
    numero_contrato,
    empresa_nombre,
    empresa_cif,
    empresa_direccion,
    vehiculo_marca,
    vehiculo_modelo,
    vehiculo_km,
    vehiculo_precio,
    comprador_tipo,
    comprador_nombre,
    comprador_apellidos,
    comprador_documento_tipo,
    comprador_documento,
    comprador_telefono,
    precio_venta,
    forma_pago,
    garantia_meses,
    garantia_km,
    garantia_tipo,
    estado,
    fecha_firma,
    fecha_entrega,
    notas
) VALUES (
    'CV-2026-0002',
    'MIDCAR AUTOMOCION S.L.',
    'B12345678',
    'Calle Principal, 123, 28001 Madrid',
    'BMW',
    '530dA Luxury Line',
    159000,
    31950.00,
    'particular',
    'qwgf',
    'qweg',
    'DNI',
    'qweg1253',
    '135',
    31950.00,
    'Transferencia bancaria',
    12,
    12000,
    'Mecanica y electrica',
    'firmado',
    '2026-01-25',
    '2026-01-25',
    'Contrato importado desde PDF. Vehiculo: 2018, diesel, 265 CV. Base imponible: 26.404,96 EUR, IVA (21%): 5.545,04 EUR'
);

-- Verificar insercion
SELECT
    numero_contrato,
    vehiculo_marca || ' ' || vehiculo_modelo AS vehiculo,
    comprador_nombre || ' ' || COALESCE(comprador_apellidos, '') AS comprador,
    precio_venta,
    estado
FROM public.contratos
WHERE numero_contrato IN ('CV-2026-0001', 'CV-2026-0002')
ORDER BY numero_contrato;
