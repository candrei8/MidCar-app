/**
 * Servicio de documentos - CRUD con Supabase
 * Maneja contratos, señales, facturas y proformas
 */

import { supabase, isSupabaseConfigured } from '../supabase';
import {
  DocumentType,
  CompraventaData,
  SenalData,
  FacturaData,
  ProformaData
} from './document-types';
import { buildDocumentIdentifier } from './identifier';

// ============================================================================
// TIPOS DE RESPUESTA
// ============================================================================

interface DocumentResponse<T> {
  data: T | null;
  error: Error | null;
}

interface DocumentListResponse<T> {
  data: T[];
  error: Error | null;
}

// ============================================================================
// GENERACIÓN DE NÚMEROS SECUENCIALES
// ============================================================================

/**
 * Genera el siguiente número de documento secuencial.
 *
 * Usa la función atómica `next_document_number` de Postgres (tabla de
 * contadores con bloqueo de fila), que garantiza numeración correlativa sin
 * duplicados aunque haya varios usuarios generando documentos a la vez
 * (requisito legal en España para facturas). Si la RPC aún no está desplegada
 * cae al método antiguo (SELECT max+1), que no es atómico pero mantiene la
 * serie correlativa.
 */
export async function getNextDocumentNumber(type: DocumentType): Promise<string> {
  const year = new Date().getFullYear();
  const prefixes: Record<DocumentType, { prefix: string; table: string; column: string }> = {
    compraventa: { prefix: 'CV', table: 'contratos', column: 'numero_contrato' },
    senal: { prefix: 'SN', table: 'senales', column: 'numero_senal' },
    factura: { prefix: 'FA', table: 'facturas', column: 'numero_factura' },
    proforma: { prefix: 'PF', table: 'proformas', column: 'numero_proforma' }
  };

  const config = prefixes[type];
  const pattern = `${config.prefix}-${year}-%`;

  if (!isSupabaseConfigured) {
    // Fallback: usar timestamp para generar número único
    const timestamp = Date.now().toString().slice(-4);
    return `${config.prefix}-${year}-${timestamp}`;
  }

  // Vía preferente: contador atómico en BD
  try {
    const { data, error } = await supabase.rpc('next_document_number', { p_doc_type: type });
    if (!error && typeof data === 'string' && data.length > 0) {
      return data;
    }
    if (error) {
      console.warn('RPC next_document_number no disponible, usando fallback:', error.message);
    }
  } catch (err) {
    console.warn('RPC next_document_number falló, usando fallback:', err);
  }

  try {
    // Fallback: obtener el último número de este año
    const { data, error } = await supabase
      .from(config.table)
      .select(config.column)
      .like(config.column, pattern)
      .order(config.column, { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error getting last document number:', error);
      const timestamp = Date.now().toString().slice(-4);
      return `${config.prefix}-${year}-${timestamp}`;
    }

    let nextNum = 1;
    if (data && data.length > 0) {
      const row = data[0] as unknown as Record<string, unknown>;
      const lastNumber = row[config.column] as string;
      if (lastNumber) {
        const match = lastNumber.match(/(\d+)$/);
        if (match) {
          nextNum = parseInt(match[1], 10) + 1;
        }
      }
    }

    return `${config.prefix}-${year}-${nextNum.toString().padStart(4, '0')}`;
  } catch (err) {
    console.error('Error generating document number:', err);
    const timestamp = Date.now().toString().slice(-4);
    return `${config.prefix}-${year}-${timestamp}`;
  }
}

// ============================================================================
// USUARIO CREADOR
// ============================================================================

/**
 * Usuario autenticado que genera el documento, para trazabilidad
 * (created_by / created_by_name en contratos, señales, facturas y proformas).
 * created_by solo se rellena si existe la fila en public.users (FK).
 */
async function getCurrentUserInfo(): Promise<{ id: string | null; name: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { id: null, name: null };

    const { data: profile } = await supabase
      .from('users')
      .select('id, nombre, apellidos')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      const name = [profile.nombre, profile.apellidos].filter(Boolean).join(' ').trim();
      return { id: profile.id, name: name || user.email || null };
    }
    return { id: null, name: user.email || null };
  } catch (err) {
    console.warn('No se pudo obtener el usuario creador del documento:', err);
    return { id: null, name: null };
  }
}

// ============================================================================
// CONTRATOS DE COMPRAVENTA
// ============================================================================

export async function saveContrato(data: CompraventaData): Promise<DocumentResponse<string>> {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase no configurado') };
  }

  try {
    const creador = await getCurrentUserInfo();
    const numeroContrato = await getNextDocumentNumber('compraventa');
    const midcarIdentifier =
      data.identifier ||
      buildDocumentIdentifier({
        type: 'compraventa',
        numeroDocumento: numeroContrato,
        vin: data.vehiculo.bastidor,
        dni: data.comprador.dni,
        fecha: data.fechaContrato
      });

    const { data: result, error } = await supabase
      .from('contratos')
      .insert({
        numero_contrato: numeroContrato,
        midcar_identifier: midcarIdentifier,
        empresa_id: data.empresaId,
        empresa_nombre: data.vendedor.nombreEmpresa || data.vendedor.nombre,
        empresa_cif: data.vendedor.cifEmpresa || data.vendedor.dni,
        empresa_direccion: data.vendedor.direccion,
        vehiculo_id: data.vehiculo.id,
        vehiculo_marca: data.vehiculo.marca,
        vehiculo_modelo: data.vehiculo.modelo,
        vehiculo_matricula: data.vehiculo.matricula,
        vehiculo_vin: data.vehiculo.bastidor,
        vehiculo_km: data.vehiculo.kilometros,
        vehiculo_precio: data.condiciones.totalConIva,
        comprador_nombre: data.comprador.nombre,
        comprador_apellidos: data.comprador.apellidos,
        comprador_documento: data.comprador.dni,
        comprador_direccion: data.comprador.direccion,
        comprador_cp: data.comprador.codigoPostal,
        comprador_localidad: data.comprador.localidad,
        comprador_provincia: data.comprador.provincia,
        comprador_telefono: data.comprador.telefono,
        comprador_email: data.comprador.email,
        precio_venta: data.condiciones.totalConIva,
        forma_pago: data.condiciones.formaPago,
        garantia_meses: data.garantia?.meses || 12,
        garantia_km: data.garantia?.kilometros,
        estado: 'borrador',
        fecha_firma: data.fechaContrato,
        fecha_entrega: data.fechaEntrega,
        clausulas_adicionales: data.clausulasAdicionales,
        created_by: creador.id,
        created_by_name: creador.name
      })
      .select('id')
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: result.id, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

// ============================================================================
// CONTRATOS DE SEÑAL
// ============================================================================

export async function saveSenal(data: SenalData): Promise<DocumentResponse<string>> {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase no configurado') };
  }

  try {
    const creador = await getCurrentUserInfo();
    const numeroSenal = await getNextDocumentNumber('senal');
    const midcarIdentifier =
      data.identifier ||
      buildDocumentIdentifier({
        type: 'senal',
        numeroDocumento: numeroSenal,
        vin: data.vehiculo.bastidor,
        dni: data.comprador.dni,
        fecha: data.fechaContrato
      });

    const { data: result, error } = await supabase
      .from('senales')
      .insert({
        numero_senal: numeroSenal,
        midcar_identifier: midcarIdentifier,
        empresa_id: data.empresaId,
        empresa_nombre: data.vendedor.nombreEmpresa || data.vendedor.nombre,
        empresa_cif: data.vendedor.cifEmpresa || data.vendedor.dni,
        vehiculo_id: data.vehiculo.id,
        vehiculo_marca: data.vehiculo.marca,
        vehiculo_modelo: data.vehiculo.modelo,
        vehiculo_matricula: data.vehiculo.matricula,
        vehiculo_vin: data.vehiculo.bastidor,
        comprador_nombre: data.comprador.nombre,
        comprador_apellidos: data.comprador.apellidos,
        comprador_documento: data.comprador.dni,
        comprador_direccion: data.comprador.direccion,
        comprador_cp: data.comprador.codigoPostal,
        comprador_localidad: data.comprador.localidad,
        comprador_provincia: data.comprador.provincia,
        comprador_telefono: data.comprador.telefono,
        comprador_email: data.comprador.email,
        precio_total: data.precioTotal,
        importe_senal: data.importeSenal,
        resto_pendiente: data.precioTotal - data.importeSenal,
        fecha_senal: data.fechaSenal,
        fecha_limite_venta: data.fechaLimiteVenta,
        cuenta_bancaria: data.cuentaBancaria,
        // El formulario de señal solo pide cláusulas adicionales; sin esto el
        // texto escrito por el comercial no se guardaba en ningún sitio
        observaciones: data.clausulasAdicionales || data.observaciones,
        estado: 'activa',
        created_by: creador.id,
        created_by_name: creador.name
      })
      .select('id')
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: result.id, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

// ============================================================================
// FACTURAS
// ============================================================================

export async function saveFactura(data: FacturaData): Promise<DocumentResponse<string>> {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase no configurado') };
  }

  try {
    const creador = await getCurrentUserInfo();
    const numeroFactura = data.numeroFactura?.trim() || await getNextDocumentNumber('factura');
    const midcarIdentifier =
      data.identifier ||
      buildDocumentIdentifier({
        type: 'factura',
        numeroDocumento: numeroFactura,
        vin: data.vehiculo.bastidor,
        dni: data.comprador.dni,
        fecha: data.fechaFactura
      });

    const { data: result, error } = await supabase
      .from('facturas')
      .insert({
        numero_factura: numeroFactura,
        midcar_identifier: midcarIdentifier,
        empresa_id: data.empresaId,
        empresa_nombre: data.vendedor.nombreEmpresa || data.vendedor.nombre,
        empresa_cif: data.vendedor.cifEmpresa || data.vendedor.dni,
        empresa_direccion: data.vendedor.direccion,
        vehiculo_id: data.vehiculo.id,
        vehiculo_descripcion: `${data.vehiculo.marca} ${data.vehiculo.modelo} - ${data.vehiculo.matricula}`,
        cliente_nombre: data.comprador.nombre,
        cliente_apellidos: data.comprador.apellidos,
        cliente_documento: data.comprador.dni,
        cliente_direccion: data.comprador.direccion,
        cliente_cp: data.comprador.codigoPostal,
        cliente_localidad: data.comprador.localidad,
        cliente_provincia: data.comprador.provincia,
        base_imponible: data.condiciones.baseImponible,
        tipo_iva: data.condiciones.ivaPercent,
        iva: data.condiciones.ivaImporte,
        total: data.condiciones.totalConIva,
        forma_pago: data.condiciones.formaPago,
        cuenta_bancaria: data.condiciones.cuentaBancaria,
        notas: data.conceptoAdicional,
        estado: 'pendiente',
        created_by: creador.id,
        created_by_name: creador.name
      })
      .select('id')
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: result.id, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

// ============================================================================
// PROFORMAS
// ============================================================================

export async function saveProforma(data: ProformaData): Promise<DocumentResponse<string>> {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase no configurado') };
  }

  try {
    const creador = await getCurrentUserInfo();
    const numeroProforma = data.numeroProforma?.trim() || await getNextDocumentNumber('proforma');
    const midcarIdentifier =
      data.identifier ||
      buildDocumentIdentifier({
        type: 'proforma',
        numeroDocumento: numeroProforma,
        vin: data.vehiculo.bastidor,
        dni: data.comprador.dni,
        fecha: data.fechaProforma
      });

    // Calcular fecha de expiración
    const fechaProforma = new Date(data.fechaProforma);
    fechaProforma.setDate(fechaProforma.getDate() + data.validezDias);
    const fechaExpiracion = fechaProforma.toISOString().split('T')[0];

    const { data: result, error } = await supabase
      .from('proformas')
      .insert({
        numero_proforma: numeroProforma,
        midcar_identifier: midcarIdentifier,
        empresa_id: data.empresaId,
        empresa_nombre: data.vendedor.nombreEmpresa || data.vendedor.nombre,
        empresa_cif: data.vendedor.cifEmpresa || data.vendedor.dni,
        vehiculo_id: data.vehiculo.id,
        vehiculo_descripcion: `${data.vehiculo.marca} ${data.vehiculo.modelo} - ${data.vehiculo.matricula}`,
        cliente_nombre: data.comprador.nombre,
        cliente_apellidos: data.comprador.apellidos,
        cliente_documento: data.comprador.dni,
        cliente_direccion: data.comprador.direccion,
        cliente_cp: data.comprador.codigoPostal,
        cliente_localidad: data.comprador.localidad,
        cliente_provincia: data.comprador.provincia,
        base_imponible: data.condiciones.baseImponible,
        tipo_iva: data.condiciones.ivaPercent,
        iva: data.condiciones.ivaImporte,
        total: data.condiciones.totalConIva,
        importe_reserva: data.importeReserva,
        fecha_proforma: data.fechaProforma,
        validez_dias: data.validezDias,
        fecha_expiracion: fechaExpiracion,
        forma_pago: data.condiciones.formaPago,
        cuenta_bancaria: data.condiciones.cuentaBancaria,
        observaciones: data.conceptoAdicional,
        estado: 'vigente',
        created_by: creador.id,
        created_by_name: creador.name
      })
      .select('id')
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: result.id, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

// ============================================================================
// FUNCIÓN GENÉRICA DE GUARDADO
// ============================================================================

export async function saveDocument(
  type: DocumentType,
  data: CompraventaData | SenalData | FacturaData | ProformaData
): Promise<DocumentResponse<string>> {
  switch (type) {
    case 'compraventa':
      return saveContrato(data as CompraventaData);
    case 'senal':
      return saveSenal(data as SenalData);
    case 'factura':
      return saveFactura(data as FacturaData);
    case 'proforma':
      return saveProforma(data as ProformaData);
    default:
      return { data: null, error: new Error('Tipo de documento no válido') };
  }
}

// ============================================================================
// CONSULTAS
// ============================================================================

export async function getDocumentsByVehicle(
  vehiculoId: string,
  type?: DocumentType
): Promise<DocumentListResponse<Record<string, unknown>>> {
  if (!isSupabaseConfigured) {
    return { data: [], error: null };
  }

  const results: Record<string, unknown>[] = [];

  try {
    const tables = type
      ? [{ name: getTableName(type), type }]
      : [
          { name: 'contratos', type: 'compraventa' as DocumentType },
          { name: 'senales', type: 'senal' as DocumentType },
          { name: 'facturas', type: 'factura' as DocumentType },
          { name: 'proformas', type: 'proforma' as DocumentType }
        ];

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table.name)
        .select('*')
        .eq('vehiculo_id', vehiculoId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        results.push(...data.map(d => ({ ...d, _type: table.type })));
      }
    }

    return { data: results, error: null };
  } catch (err) {
    return { data: [], error: err as Error };
  }
}

function getTableName(type: DocumentType): string {
  const tables: Record<DocumentType, string> = {
    compraventa: 'contratos',
    senal: 'senales',
    factura: 'facturas',
    proforma: 'proformas'
  };
  return tables[type];
}
