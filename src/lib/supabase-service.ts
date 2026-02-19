/**
 * Supabase Service
 *
 * Servicio centralizado para todas las operaciones CRUD con Supabase.
 * Reemplaza localStorage y mock data con la base de datos real.
 */

import { supabase, isSupabaseConfigured } from './supabase'
import type { Vehicle, Contact, Lead } from '@/types'

// ============================================================================
// VEHICLES
// ============================================================================

export async function getVehicles(): Promise<Vehicle[]> {
    if (!isSupabaseConfigured) {
        console.warn('Supabase not configured, returning empty array')
        return []
    }

    const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching vehicles:', error)
        return []
    }

    // Transform database format to app format
    return (data || []).map(transformVehicleFromDB)
}

export async function getVehicleById(id: string): Promise<Vehicle | null> {
    if (!isSupabaseConfigured) return null

    const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching vehicle:', error)
        return null
    }

    return data ? transformVehicleFromDB(data) : null
}

export async function createVehicle(vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle | null> {
    if (!isSupabaseConfigured) {
        console.error('Supabase not configured')
        return null
    }

    const dbVehicle = transformVehicleToDB(vehicle)

    const { data, error } = await supabase
        .from('vehicles')
        .insert(dbVehicle)
        .select()
        .single()

    if (error) {
        console.error('Error creating vehicle:', error)
        return null
    }

    return data ? transformVehicleFromDB(data) : null
}

export async function updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle | null> {
    if (!isSupabaseConfigured) return null

    const dbUpdates = transformVehicleToDB(updates)

    const { data, error } = await supabase
        .from('vehicles')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error updating vehicle:', error)
        return null
    }

    return data ? transformVehicleFromDB(data) : null
}

export async function deleteVehicle(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false

    const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting vehicle:', error)
        return false
    }

    return true
}

// Transform from DB format to app format
function transformVehicleFromDB(dbVehicle: Record<string, unknown>): Vehicle {
    return {
        id: dbVehicle.id as string,
        vin: (dbVehicle.vin as string) || '',
        matricula: dbVehicle.matricula as string,
        stock_id: dbVehicle.stock_id as string,
        estado: dbVehicle.estado as Vehicle['estado'],
        destacado: dbVehicle.destacado as boolean,
        en_oferta: dbVehicle.en_oferta as boolean,
        marca: dbVehicle.marca as string,
        modelo: dbVehicle.modelo as string,
        version: (dbVehicle.version as string) || '',
        año_fabricacion: (dbVehicle.año_fabricacion as number) || 0,
        año_matriculacion: (dbVehicle.año_matriculacion as number) || 0,
        tipo_motor: (dbVehicle.tipo_motor as string) || '',
        cilindrada: (dbVehicle.cilindrada as number) || 0,
        potencia_cv: (dbVehicle.potencia_cv as number) || 0,
        potencia_kw: (dbVehicle.potencia_kw as number) || 0,
        combustible: (dbVehicle.combustible as Vehicle['combustible']) || 'gasolina',
        consumo_mixto: (dbVehicle.consumo_mixto as number) || 0,
        emisiones_co2: (dbVehicle.emisiones_co2 as number) || 0,
        etiqueta_dgt: (dbVehicle.etiqueta_dgt as Vehicle['etiqueta_dgt']) || 'C',
        transmision: (dbVehicle.transmision as Vehicle['transmision']) || 'manual',
        num_marchas: (dbVehicle.num_marchas as number) || 5,
        traccion: (dbVehicle.traccion as string) || 'Delantera',
        tipo_carroceria: (dbVehicle.tipo_carroceria as string) || 'Berlina',
        num_puertas: (dbVehicle.num_puertas as number) || 5,
        num_plazas: (dbVehicle.num_plazas as number) || 5,
        color_exterior: (dbVehicle.color_exterior as string) || '',
        color_interior: (dbVehicle.color_interior as string) || '',
        kilometraje: (dbVehicle.kilometraje as number) || 0,
        num_propietarios: (dbVehicle.num_propietarios as number) || 1,
        es_nacional: (dbVehicle.es_nacional as boolean) ?? true,
        primera_mano: (dbVehicle.primera_mano as boolean) ?? false,
        precio_compra: Number(dbVehicle.precio_compra) || 0,
        gastos_compra: Number(dbVehicle.gastos_compra) || 0,
        coste_reparaciones: Number(dbVehicle.coste_reparaciones) || 0,
        precio_venta: Number(dbVehicle.precio_venta) || 0,
        descuento: Number(dbVehicle.descuento) || 0,
        margen_bruto: Number(dbVehicle.precio_venta) - Number(dbVehicle.descuento) - Number(dbVehicle.precio_compra) - Number(dbVehicle.gastos_compra) - Number(dbVehicle.coste_reparaciones),
        fecha_entrada_stock: (dbVehicle.fecha_entrada_stock as string) || new Date().toISOString().split('T')[0],
        dias_en_stock: calculateDaysInStock(dbVehicle.fecha_entrada_stock as string),
        garantia_meses: (dbVehicle.garantia_meses as number) || 12,
        tipo_garantia: (dbVehicle.tipo_garantia as string) || 'Mecánica completa',
        fecha_itv_vencimiento: dbVehicle.fecha_itv_vencimiento as string | undefined,
        imagen_principal: (dbVehicle.imagen_principal as string) || '/placeholder-car.svg',
        imagenes: [], // Images are stored separately or as base64 in imagen_principal
        documentos: [], // Documents are stored separately
        url_web: dbVehicle.url_web as string | undefined,
        datos_sincronizados: dbVehicle.datos_sincronizados as boolean | undefined,
        ultima_sincronizacion: dbVehicle.ultima_sincronizacion as string | undefined,
        equipamiento: (dbVehicle.equipamiento as string[]) || [],
        descripcion: (dbVehicle.descripcion as string) || undefined,
        created_at: dbVehicle.created_at as string,
        updated_at: dbVehicle.updated_at as string,
        created_by: dbVehicle.created_by as string | undefined,
        created_by_name: dbVehicle.created_by_name as string | undefined,
    }
}

// Transform from app format to DB format
function transformVehicleToDB(vehicle: Partial<Vehicle>): Record<string, unknown> {
    const dbVehicle: Record<string, unknown> = {}

    // Only include fields that are set
    if (vehicle.vin !== undefined) dbVehicle.vin = vehicle.vin || null
    if (vehicle.matricula !== undefined) dbVehicle.matricula = vehicle.matricula
    if (vehicle.stock_id !== undefined) dbVehicle.stock_id = vehicle.stock_id
    if (vehicle.estado !== undefined) dbVehicle.estado = vehicle.estado
    if (vehicle.destacado !== undefined) dbVehicle.destacado = vehicle.destacado
    if (vehicle.en_oferta !== undefined) dbVehicle.en_oferta = vehicle.en_oferta
    if (vehicle.marca !== undefined) dbVehicle.marca = vehicle.marca
    if (vehicle.modelo !== undefined) dbVehicle.modelo = vehicle.modelo
    if (vehicle.version !== undefined) dbVehicle.version = vehicle.version || null
    if (vehicle.año_fabricacion !== undefined) dbVehicle.año_fabricacion = vehicle.año_fabricacion
    if (vehicle.año_matriculacion !== undefined) dbVehicle.año_matriculacion = vehicle.año_matriculacion
    if (vehicle.tipo_motor !== undefined) dbVehicle.tipo_motor = vehicle.tipo_motor || null
    if (vehicle.cilindrada !== undefined) dbVehicle.cilindrada = vehicle.cilindrada
    if (vehicle.potencia_cv !== undefined) dbVehicle.potencia_cv = vehicle.potencia_cv
    if (vehicle.potencia_kw !== undefined) dbVehicle.potencia_kw = vehicle.potencia_kw
    if (vehicle.combustible !== undefined) dbVehicle.combustible = vehicle.combustible
    if (vehicle.consumo_mixto !== undefined) dbVehicle.consumo_mixto = vehicle.consumo_mixto
    if (vehicle.emisiones_co2 !== undefined) dbVehicle.emisiones_co2 = vehicle.emisiones_co2
    if (vehicle.etiqueta_dgt !== undefined) dbVehicle.etiqueta_dgt = vehicle.etiqueta_dgt
    if (vehicle.transmision !== undefined) dbVehicle.transmision = vehicle.transmision
    if (vehicle.num_marchas !== undefined) dbVehicle.num_marchas = vehicle.num_marchas
    if (vehicle.traccion !== undefined) dbVehicle.traccion = vehicle.traccion || null
    if (vehicle.tipo_carroceria !== undefined) dbVehicle.tipo_carroceria = vehicle.tipo_carroceria || null
    if (vehicle.num_puertas !== undefined) dbVehicle.num_puertas = vehicle.num_puertas
    if (vehicle.num_plazas !== undefined) dbVehicle.num_plazas = vehicle.num_plazas
    if (vehicle.color_exterior !== undefined) dbVehicle.color_exterior = vehicle.color_exterior || null
    if (vehicle.color_interior !== undefined) dbVehicle.color_interior = vehicle.color_interior || null
    if (vehicle.kilometraje !== undefined) dbVehicle.kilometraje = vehicle.kilometraje
    if (vehicle.num_propietarios !== undefined) dbVehicle.num_propietarios = vehicle.num_propietarios
    if (vehicle.es_nacional !== undefined) dbVehicle.es_nacional = vehicle.es_nacional
    if (vehicle.primera_mano !== undefined) dbVehicle.primera_mano = vehicle.primera_mano
    if (vehicle.precio_compra !== undefined) dbVehicle.precio_compra = vehicle.precio_compra
    if (vehicle.gastos_compra !== undefined) dbVehicle.gastos_compra = vehicle.gastos_compra
    if (vehicle.coste_reparaciones !== undefined) dbVehicle.coste_reparaciones = vehicle.coste_reparaciones
    if (vehicle.precio_venta !== undefined) dbVehicle.precio_venta = vehicle.precio_venta
    if (vehicle.descuento !== undefined) dbVehicle.descuento = vehicle.descuento
    if (vehicle.fecha_entrada_stock !== undefined) dbVehicle.fecha_entrada_stock = vehicle.fecha_entrada_stock
    if (vehicle.garantia_meses !== undefined) dbVehicle.garantia_meses = vehicle.garantia_meses
    if (vehicle.tipo_garantia !== undefined) dbVehicle.tipo_garantia = vehicle.tipo_garantia || null
    if (vehicle.fecha_itv_vencimiento !== undefined) dbVehicle.fecha_itv_vencimiento = vehicle.fecha_itv_vencimiento || null
    if (vehicle.imagen_principal !== undefined) dbVehicle.imagen_principal = vehicle.imagen_principal || null
    if (vehicle.url_web !== undefined) dbVehicle.url_web = vehicle.url_web || null
    if (vehicle.datos_sincronizados !== undefined) dbVehicle.datos_sincronizados = vehicle.datos_sincronizados
    if (vehicle.ultima_sincronizacion !== undefined) dbVehicle.ultima_sincronizacion = vehicle.ultima_sincronizacion || null
    if (vehicle.equipamiento !== undefined) dbVehicle.equipamiento = vehicle.equipamiento || []
    if (vehicle.descripcion !== undefined) dbVehicle.descripcion = vehicle.descripcion || null
    if (vehicle.created_by !== undefined) dbVehicle.created_by = vehicle.created_by
    if (vehicle.created_by_name !== undefined) dbVehicle.created_by_name = vehicle.created_by_name

    return dbVehicle
}

function calculateDaysInStock(fechaEntrada: string | null): number {
    if (!fechaEntrada) return 0
    const entrada = new Date(fechaEntrada)
    const hoy = new Date()
    const diff = hoy.getTime() - entrada.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
}

// ============================================================================
// CONTACTS
// ============================================================================

// Returns only first page (50 records) — used for dashboard stats
export async function getContacts(): Promise<Contact[]> {
    if (!isSupabaseConfigured) return []

    const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(0, 49)

    if (error) {
        console.error('Error fetching contacts:', error)
        return []
    }

    return (data || []).map(transformContactFromDB)
}

// Server-side paginated search for the contacts page
export async function getContactsPage({
    page = 0,
    pageSize = 50,
    search = '',
    estado = '',
}: {
    page?: number
    pageSize?: number
    search?: string
    estado?: string
}): Promise<{ data: Contact[]; total: number }> {
    if (!isSupabaseConfigured) return { data: [], total: 0 }

    let query = supabase
        .from('contacts')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * pageSize, page * pageSize + pageSize - 1)

    if (search && search.length >= 2) {
        query = query.or(
            `nombre.ilike.%${search}%,apellidos.ilike.%${search}%,telefono.ilike.%${search}%,email.ilike.%${search}%`
        )
    }

    if (estado && estado !== 'todos') {
        // Map filter group to actual estados
        const groupMap: Record<string, string[]> = {
            nuevos: ['pendiente'],
            enProceso: ['comunicado', 'tramite', 'reservado', 'postventa', 'busqueda'],
            cerrados: ['cerrado'],
        }
        const estados = groupMap[estado]
        if (estados) {
            query = query.in('estado', estados)
        }
    }

    const { data, error, count } = await query

    if (error) {
        console.error('Error fetching contacts page:', error)
        return { data: [], total: 0 }
    }

    return {
        data: (data || []).map(transformContactFromDB),
        total: count ?? 0,
    }
}

// Get contacts counts by estado (for dashboard stats) — no bulk load
export async function getContactsStats(): Promise<{
    total: number
    pendiente: number
    comunicado: number
    tramite: number
    reservado: number
    postventa: number
    busqueda: number
    cerrado: number
}> {
    if (!isSupabaseConfigured) return { total: 0, pendiente: 0, comunicado: 0, tramite: 0, reservado: 0, postventa: 0, busqueda: 0, cerrado: 0 }

    const { data, error } = await supabase
        .from('contacts')
        .select('estado')

    if (error || !data) return { total: 0, pendiente: 0, comunicado: 0, tramite: 0, reservado: 0, postventa: 0, busqueda: 0, cerrado: 0 }

    const counts = { total: data.length, pendiente: 0, comunicado: 0, tramite: 0, reservado: 0, postventa: 0, busqueda: 0, cerrado: 0 }
    for (const c of data) {
        if (c.estado in counts) counts[c.estado as keyof typeof counts]++
    }
    return counts
}

export async function getContactById(id: string): Promise<Contact | null> {
    if (!isSupabaseConfigured) return null

    const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching contact:', error)
        return null
    }

    return data ? transformContactFromDB(data) : null
}

export async function createContact(contact: Omit<Contact, 'id'>): Promise<Contact | null> {
    if (!isSupabaseConfigured) return null

    const dbContact = transformContactToDB(contact)

    const { data, error } = await supabase
        .from('contacts')
        .insert(dbContact)
        .select()
        .single()

    if (error) {
        console.error('Error creating contact:', error)
        return null
    }

    return data ? transformContactFromDB(data) : null
}

export async function updateContact(id: string, updates: Partial<Contact>): Promise<Contact | null> {
    if (!isSupabaseConfigured) return null

    const dbUpdates = transformContactToDB(updates)

    const { data, error } = await supabase
        .from('contacts')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error updating contact:', error)
        return null
    }

    return data ? transformContactFromDB(data) : null
}

export async function deleteContact(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false

    const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting contact:', error)
        return false
    }

    return true
}

function transformContactFromDB(dbContact: Record<string, unknown>): Contact {
    return {
        id: dbContact.id as string,
        telefono: dbContact.telefono as string,
        email: (dbContact.email as string) || '',
        nombre: dbContact.nombre as string | undefined,
        apellidos: dbContact.apellidos as string | undefined,
        dni_cif: dbContact.dni_cif as string | undefined,
        direccion: dbContact.direccion as string | undefined,
        codigo_postal: dbContact.codigo_postal as string | undefined,
        municipio: dbContact.municipio as string | undefined,
        provincia: dbContact.provincia as string | undefined,
        datos_facturacion: dbContact.datos_facturacion as Contact['datos_facturacion'],
        origen: dbContact.origen as Contact['origen'],
        estado: dbContact.estado as Contact['estado'],
        vehiculos_interes: (dbContact.vehiculos_interes as string[]) || [],
        preferencias_comunicacion: (dbContact.preferencias_comunicacion as string[]) || [],
        acepta_marketing: dbContact.acepta_marketing as boolean,
        consentimiento_rgpd: dbContact.consentimiento_rgpd as boolean,
        notas: dbContact.notas as string | undefined,
        fecha_registro: dbContact.fecha_registro as string,
        ultima_interaccion: dbContact.ultima_interaccion as string | undefined,
        created_at: dbContact.created_at as string,
        updated_at: dbContact.updated_at as string,
        progreso: (dbContact.progreso as number) || 0,
        fecha_ultimo_contacto: dbContact.fecha_ultimo_contacto as string | undefined,
        categoria: dbContact.categoria as Contact['categoria'],
        asunto: dbContact.asunto as string | undefined,
        comercial_asignado: dbContact.comercial_asignado as string | undefined,
        tipo_pago: dbContact.tipo_pago as Contact['tipo_pago'],
        transporte: dbContact.transporte as number | undefined,
        es_nuevo_cliente: dbContact.es_nuevo_cliente as boolean | undefined,
        precio: dbContact.precio as number | undefined,
        reserva: dbContact.reserva as number | undefined,
        created_by: dbContact.created_by as string | undefined,
        created_by_name: dbContact.created_by_name as string | undefined,
    }
}

function transformContactToDB(contact: Partial<Contact>): Record<string, unknown> {
    const dbContact: Record<string, unknown> = {}

    if (contact.telefono !== undefined) dbContact.telefono = contact.telefono
    if (contact.email !== undefined) dbContact.email = contact.email || null
    if (contact.nombre !== undefined) dbContact.nombre = contact.nombre || null
    if (contact.apellidos !== undefined) dbContact.apellidos = contact.apellidos || null
    if (contact.dni_cif !== undefined) dbContact.dni_cif = contact.dni_cif || null
    if (contact.direccion !== undefined) dbContact.direccion = contact.direccion || null
    if (contact.codigo_postal !== undefined) dbContact.codigo_postal = contact.codigo_postal || null
    if (contact.municipio !== undefined) dbContact.municipio = contact.municipio || null
    if (contact.provincia !== undefined) dbContact.provincia = contact.provincia || null
    if (contact.datos_facturacion !== undefined) dbContact.datos_facturacion = contact.datos_facturacion || null
    if (contact.origen !== undefined) dbContact.origen = contact.origen
    if (contact.estado !== undefined) dbContact.estado = contact.estado
    if (contact.vehiculos_interes !== undefined) dbContact.vehiculos_interes = contact.vehiculos_interes || []
    if (contact.preferencias_comunicacion !== undefined) dbContact.preferencias_comunicacion = contact.preferencias_comunicacion || []
    if (contact.acepta_marketing !== undefined) dbContact.acepta_marketing = contact.acepta_marketing
    if (contact.consentimiento_rgpd !== undefined) dbContact.consentimiento_rgpd = contact.consentimiento_rgpd
    if (contact.notas !== undefined) dbContact.notas = contact.notas || null
    if (contact.progreso !== undefined) dbContact.progreso = contact.progreso
    if (contact.categoria !== undefined) dbContact.categoria = contact.categoria || null
    if (contact.asunto !== undefined) dbContact.asunto = contact.asunto || null
    if (contact.comercial_asignado !== undefined) dbContact.comercial_asignado = contact.comercial_asignado || null
    if (contact.tipo_pago !== undefined) dbContact.tipo_pago = contact.tipo_pago || null
    if (contact.transporte !== undefined) dbContact.transporte = contact.transporte
    if (contact.es_nuevo_cliente !== undefined) dbContact.es_nuevo_cliente = contact.es_nuevo_cliente
    if (contact.precio !== undefined) dbContact.precio = contact.precio
    if (contact.reserva !== undefined) dbContact.reserva = contact.reserva
    if (contact.fecha_ultimo_contacto !== undefined) dbContact.fecha_ultimo_contacto = contact.fecha_ultimo_contacto || null
    if (contact.ultima_interaccion !== undefined) dbContact.ultima_interaccion = contact.ultima_interaccion || null
    if (contact.created_by !== undefined) dbContact.created_by = contact.created_by
    if (contact.created_by_name !== undefined) dbContact.created_by_name = contact.created_by_name

    return dbContact
}

// ============================================================================
// LEADS
// ============================================================================

// Returns only first page (50 records) — used for dashboard stats
export async function getLeads(): Promise<Lead[]> {
    if (!isSupabaseConfigured) return []

    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .range(0, 49)

    if (error) {
        console.error('Error fetching leads:', error)
        return []
    }

    return (data || []).map(transformLeadFromDB)
}

// Server-side paginated search for the CRM page
export async function getLeadsPage({
    page = 0,
    pageSize = 50,
    search = '',
    statusFilter = 'todos',
}: {
    page?: number
    pageSize?: number
    search?: string
    statusFilter?: string
}): Promise<{ data: Lead[]; total: number }> {
    if (!isSupabaseConfigured) return { data: [], total: 0 }

    const FILTER_GROUPS: Record<string, string[]> = {
        nuevos: ['nuevo'],
        enProceso: ['contactado', 'negociacion', 'visita_agendada', 'prueba_programada', 'prueba_conduccion', 'propuesta_enviada', 'financiacion', 'oferta_enviada'],
        vendidos: ['vendido'],
        perdidos: ['perdido'],
    }

    let query = supabase
        .from('leads')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * pageSize, page * pageSize + pageSize - 1)

    if (search && search.length >= 2) {
        query = query.or(
            `cliente_nombre.ilike.%${search}%,cliente_apellidos.ilike.%${search}%,cliente_telefono.ilike.%${search}%`
        )
    }

    if (statusFilter !== 'todos') {
        const estados = FILTER_GROUPS[statusFilter]
        if (estados) {
            query = query.in('estado', estados)
        }
    }

    const { data, error, count } = await query

    if (error) {
        console.error('Error fetching leads page:', error)
        return { data: [], total: 0 }
    }

    return {
        data: (data || []).map(transformLeadFromDB),
        total: count ?? 0,
    }
}

// Get lead counts by estado (for dashboard stats) — fetches only estado column
export async function getLeadsStats(): Promise<{
    total: number
    nuevo: number
    contactado: number
    visita_agendada: number
    prueba_programada: number
    propuesta_enviada: number
    negociacion: number
    vendido: number
    perdido: number
    valorPipeline: number
    tasaConversion: number
}> {
    const empty = { total: 0, nuevo: 0, contactado: 0, visita_agendada: 0, prueba_programada: 0, propuesta_enviada: 0, negociacion: 0, vendido: 0, perdido: 0, valorPipeline: 0, tasaConversion: 0 }
    if (!isSupabaseConfigured) return empty

    const { data, error } = await supabase
        .from('leads')
        .select('estado, probabilidad, presupuesto_cliente')

    if (error || !data) return empty

    const counts = { ...empty, total: data.length }
    for (const l of data) {
        const estado = l.estado as string
        if (estado in counts) (counts as Record<string, number>)[estado]++
        if (estado !== 'vendido' && estado !== 'perdido') {
            counts.valorPipeline += ((l.presupuesto_cliente || 0) * (l.probabilidad || 0) / 100)
        }
    }
    counts.tasaConversion = counts.total > 0 ? (counts.vendido / counts.total) * 100 : 0
    return counts
}

export async function getLeadById(id: string): Promise<Lead | null> {
    if (!isSupabaseConfigured) return null

    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching lead:', error)
        return null
    }

    return data ? transformLeadFromDB(data) : null
}

export async function createLead(lead: Omit<Lead, 'id'>): Promise<Lead | null> {
    if (!isSupabaseConfigured) return null

    const dbLead = transformLeadToDB(lead)

    const { data, error } = await supabase
        .from('leads')
        .insert(dbLead)
        .select()
        .single()

    if (error) {
        console.error('Error creating lead:', error)
        return null
    }

    return data ? transformLeadFromDB(data) : null
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead | null> {
    if (!isSupabaseConfigured) return null

    const dbUpdates = transformLeadToDB(updates)

    const { data, error } = await supabase
        .from('leads')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error updating lead:', error)
        return null
    }

    return data ? transformLeadFromDB(data) : null
}

export async function deleteLead(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false

    const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting lead:', error)
        return false
    }

    return true
}

function transformLeadFromDB(dbLead: Record<string, unknown>): Lead {
    // Extraer datos del cliente embebidos
    const clienteNombre = (dbLead.cliente_nombre as string) || ''
    const clienteApellidos = (dbLead.cliente_apellidos as string) || ''
    const clienteEmail = (dbLead.cliente_email as string) || ''
    const clienteTelefono = (dbLead.cliente_telefono as string) || ''

    // Construir objeto cliente si hay datos embebidos
    const cliente = (clienteNombre || clienteApellidos) ? {
        id: '',
        tipo_cliente: 'particular' as const,
        nombre: clienteNombre,
        apellidos: clienteApellidos,
        razon_social: null,
        nif_nie: null,
        cif: null,
        email: clienteEmail,
        telefono: clienteTelefono,
        direccion: null,
        cp: null,
        municipio: null,
        provincia: null,
        preferencias_comunicacion: [],
        acepta_marketing: false,
        origen_lead: 'manual',
        consentimiento_rgpd: false,
        fecha_registro: dbLead.fecha_creacion as string || new Date().toISOString(),
        created_at: dbLead.created_at as string || new Date().toISOString(),
    } : undefined

    return {
        id: dbLead.id as string,
        cliente_id: (dbLead.cliente_id as string) || '',
        vehiculo_id: dbLead.vehiculo_id as string | null,
        estado: dbLead.estado as Lead['estado'],
        prioridad: dbLead.prioridad as Lead['prioridad'],
        probabilidad: (dbLead.probabilidad as number) || 50,
        tipo_interes: (dbLead.tipo_interes as string) || '',
        presupuesto_cliente: (dbLead.presupuesto_cliente as number) || 0,
        forma_pago: (dbLead.forma_pago as string) || '',
        asignado_a: (dbLead.asignado_a as string) || '',
        transcript_chatbot: (dbLead.transcript_chatbot as Lead['transcript_chatbot']) || [],
        sentimiento_ia: (dbLead.sentimiento_ia as Lead['sentimiento_ia']) || 'neutral',
        fecha_creacion: dbLead.fecha_creacion as string,
        fecha_cierre: dbLead.fecha_cierre as string | null,
        ultima_interaccion: (dbLead.ultima_interaccion as string) || '',
        proxima_accion: dbLead.proxima_accion as string | null,
        fecha_proxima_accion: dbLead.fecha_proxima_accion as string | null,
        motivo_perdida: dbLead.motivo_perdida as string | null,
        notas: (dbLead.notas as string) || '',
        created_by: dbLead.created_by as string | undefined,
        created_by_name: dbLead.created_by_name as string | undefined,
        // Datos del cliente embebidos
        cliente_nombre: clienteNombre || undefined,
        cliente_apellidos: clienteApellidos || undefined,
        cliente_email: clienteEmail || undefined,
        cliente_telefono: clienteTelefono || undefined,
        // Objeto cliente construido
        cliente,
    }
}

function transformLeadToDB(lead: Partial<Lead>): Record<string, unknown> {
    const dbLead: Record<string, unknown> = {}

    if (lead.cliente_id !== undefined) dbLead.cliente_id = lead.cliente_id || null
    if (lead.vehiculo_id !== undefined) dbLead.vehiculo_id = lead.vehiculo_id || null
    if (lead.estado !== undefined) dbLead.estado = lead.estado
    if (lead.prioridad !== undefined) dbLead.prioridad = lead.prioridad
    if (lead.probabilidad !== undefined) dbLead.probabilidad = lead.probabilidad
    if (lead.tipo_interes !== undefined) dbLead.tipo_interes = lead.tipo_interes || null
    if (lead.presupuesto_cliente !== undefined) dbLead.presupuesto_cliente = lead.presupuesto_cliente
    if (lead.forma_pago !== undefined) dbLead.forma_pago = lead.forma_pago || null
    if (lead.asignado_a !== undefined) dbLead.asignado_a = lead.asignado_a || null
    if (lead.transcript_chatbot !== undefined) dbLead.transcript_chatbot = lead.transcript_chatbot || []
    if (lead.sentimiento_ia !== undefined) dbLead.sentimiento_ia = lead.sentimiento_ia
    if (lead.fecha_cierre !== undefined) dbLead.fecha_cierre = lead.fecha_cierre
    if (lead.ultima_interaccion !== undefined) dbLead.ultima_interaccion = lead.ultima_interaccion || null
    if (lead.proxima_accion !== undefined) dbLead.proxima_accion = lead.proxima_accion || null
    if (lead.fecha_proxima_accion !== undefined) dbLead.fecha_proxima_accion = lead.fecha_proxima_accion || null
    if (lead.motivo_perdida !== undefined) dbLead.motivo_perdida = lead.motivo_perdida || null
    if (lead.notas !== undefined) dbLead.notas = lead.notas || null
    if (lead.created_by !== undefined) dbLead.created_by = lead.created_by
    if (lead.created_by_name !== undefined) dbLead.created_by_name = lead.created_by_name
    // Datos del cliente embebidos
    if (lead.cliente_nombre !== undefined) dbLead.cliente_nombre = lead.cliente_nombre || null
    if (lead.cliente_apellidos !== undefined) dbLead.cliente_apellidos = lead.cliente_apellidos || null
    if (lead.cliente_email !== undefined) dbLead.cliente_email = lead.cliente_email || null
    if (lead.cliente_telefono !== undefined) dbLead.cliente_telefono = lead.cliente_telefono || null

    return dbLead
}

// ============================================================================
// STOCK ID GENERATION
// ============================================================================

export async function generateStockId(): Promise<string> {
    if (!isSupabaseConfigured) return `STK-${Date.now()}`

    // Get the highest stock number
    const { data, error } = await supabase
        .from('vehicles')
        .select('stock_id')
        .order('created_at', { ascending: false })
        .limit(100)

    if (error) {
        console.error('Error getting stock IDs:', error)
        return `STK-${Date.now()}`
    }

    let maxNumber = 0
    for (const v of data || []) {
        const match = v.stock_id?.match(/STK-(\d+)/)
        if (match) {
            const num = parseInt(match[1], 10)
            if (num > maxNumber) maxNumber = num
        }
    }

    return `STK-${String(maxNumber + 1).padStart(4, '0')}`
}

// ============================================================================
// CONTRACTS
// ============================================================================

export interface ContractDB {
    id: string
    numero_contrato: string
    empresa_id?: string
    empresa_nombre?: string
    empresa_cif?: string
    empresa_direccion?: string
    vehiculo_id?: string
    vehiculo_marca?: string
    vehiculo_modelo?: string
    vehiculo_matricula?: string
    vehiculo_vin?: string
    vehiculo_km?: number
    vehiculo_precio?: number
    comprador_tipo?: string
    comprador_nombre: string
    comprador_apellidos?: string
    comprador_documento_tipo?: string
    comprador_documento: string
    comprador_direccion?: string
    comprador_cp?: string
    comprador_localidad?: string
    comprador_provincia?: string
    comprador_telefono?: string
    comprador_email?: string
    precio_venta: number
    forma_pago?: string
    entrega_inicial?: number
    financiado?: number
    garantia_meses?: number
    garantia_km?: number
    garantia_tipo?: string
    estado: string
    fecha_firma?: string
    fecha_entrega?: string
    notas?: string
    clausulas_adicionales?: string
    pdf_url?: string
    created_at: string
    updated_at: string
    created_by?: string
    created_by_name?: string
}

export async function getContracts(): Promise<ContractDB[]> {
    if (!isSupabaseConfigured) return []

    const { data, error } = await supabase
        .from('contratos')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching contracts:', error)
        return []
    }

    return data || []
}

export async function getContractsByVehicle(vehicleId: string): Promise<ContractDB[]> {
    if (!isSupabaseConfigured) return []

    const { data, error } = await supabase
        .from('contratos')
        .select('*')
        .eq('vehiculo_id', vehicleId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching contracts:', error)
        return []
    }

    return data || []
}

export async function createContract(contract: Omit<ContractDB, 'id' | 'created_at' | 'updated_at'>): Promise<ContractDB | null> {
    if (!isSupabaseConfigured) return null

    const { data, error } = await supabase
        .from('contratos')
        .insert(contract)
        .select()
        .single()

    if (error) {
        console.error('Error creating contract:', error)
        return null
    }

    return data
}

export async function updateContract(id: string, updates: Partial<ContractDB>): Promise<ContractDB | null> {
    if (!isSupabaseConfigured) return null

    const { data, error } = await supabase
        .from('contratos')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error updating contract:', error)
        return null
    }

    return data
}

export async function deleteContract(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false

    const { error } = await supabase
        .from('contratos')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting contract:', error)
        return false
    }

    return true
}

export async function generateContractNumber(): Promise<string> {
    if (!isSupabaseConfigured) {
        const year = new Date().getFullYear()
        return `CV-${year}-${Date.now().toString().slice(-4)}`
    }

    const year = new Date().getFullYear()

    const { data, error } = await supabase
        .from('contratos')
        .select('numero_contrato')
        .like('numero_contrato', `CV-${year}-%`)
        .order('created_at', { ascending: false })
        .limit(1)

    if (error || !data || data.length === 0) {
        return `CV-${year}-0001`
    }

    const lastNumber = data[0].numero_contrato
    const match = lastNumber.match(/CV-\d{4}-(\d+)/)
    const nextNum = match ? parseInt(match[1], 10) + 1 : 1

    return `CV-${year}-${String(nextNum).padStart(4, '0')}`
}

// ============================================================================
// INVOICES
// ============================================================================

export interface InvoiceDB {
    id: string
    numero_factura: string
    fecha_factura: string
    empresa_id?: string
    empresa_nombre?: string
    empresa_cif?: string
    empresa_direccion?: string
    vehiculo_id?: string
    vehiculo_descripcion?: string
    contrato_id?: string
    cliente_tipo?: string
    cliente_nombre: string
    cliente_apellidos?: string
    cliente_documento_tipo?: string
    cliente_documento: string
    cliente_direccion?: string
    cliente_cp?: string
    cliente_localidad?: string
    cliente_provincia?: string
    lineas?: unknown[]
    base_imponible: number
    tipo_iva: number
    iva: number
    total: number
    forma_pago?: string
    estado: string
    fecha_vencimiento?: string
    fecha_pago?: string
    pdf_url?: string
    notas?: string
    created_at: string
    updated_at: string
    created_by?: string
    created_by_name?: string
}

export async function getInvoices(): Promise<InvoiceDB[]> {
    if (!isSupabaseConfigured) return []

    const { data, error } = await supabase
        .from('facturas')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching invoices:', error)
        return []
    }

    return data || []
}

export async function getInvoicesByVehicle(vehicleId: string): Promise<InvoiceDB[]> {
    if (!isSupabaseConfigured) return []

    const { data, error } = await supabase
        .from('facturas')
        .select('*')
        .eq('vehiculo_id', vehicleId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching invoices:', error)
        return []
    }

    return data || []
}

export async function createInvoice(invoice: Omit<InvoiceDB, 'id' | 'created_at' | 'updated_at'>): Promise<InvoiceDB | null> {
    if (!isSupabaseConfigured) return null

    const { data, error } = await supabase
        .from('facturas')
        .insert(invoice)
        .select()
        .single()

    if (error) {
        console.error('Error creating invoice:', error)
        return null
    }

    return data
}

export async function updateInvoice(id: string, updates: Partial<InvoiceDB>): Promise<InvoiceDB | null> {
    if (!isSupabaseConfigured) return null

    const { data, error } = await supabase
        .from('facturas')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error updating invoice:', error)
        return null
    }

    return data
}

export async function deleteInvoice(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false

    const { error } = await supabase
        .from('facturas')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting invoice:', error)
        return false
    }

    return true
}

export async function generateInvoiceNumber(): Promise<string> {
    if (!isSupabaseConfigured) {
        const year = new Date().getFullYear()
        return `FAC-${year}-${Date.now().toString().slice(-6)}`
    }

    const year = new Date().getFullYear()

    const { data, error } = await supabase
        .from('facturas')
        .select('numero_factura')
        .like('numero_factura', `FAC-${year}-%`)
        .order('created_at', { ascending: false })
        .limit(1)

    if (error || !data || data.length === 0) {
        return `FAC-${year}-000001`
    }

    const lastNumber = data[0].numero_factura
    const match = lastNumber.match(/FAC-\d{4}-(\d+)/)
    const nextNum = match ? parseInt(match[1], 10) + 1 : 1

    return `FAC-${year}-${String(nextNum).padStart(6, '0')}`
}

// ============================================================================
// INSURANCE POLICIES
// ============================================================================

export interface PolicyDB {
    id: string
    vehiculo_id?: string
    vehiculo_matricula?: string
    numero_poliza: string
    compania_aseguradora: string
    tipo_poliza?: 'terceros_basico' | 'terceros_ampliado' | 'todo_riesgo_franquicia' | 'todo_riesgo_sin_franquicia'
    fecha_alta: string
    fecha_vencimiento: string
    prima_anual?: number
    franquicia?: number
    tomador_nombre?: string
    tomador_nif?: string
    coberturas?: {
        rcObligatoria: boolean
        rcVoluntaria: boolean
        defensaJuridica: boolean
        asistenciaViaje: boolean
        robo: boolean
        incendio: boolean
        lunas: boolean
        daniosPropios: boolean
        ocupantes: boolean
        vehiculoSustitucion: boolean
    }
    documento_poliza?: string
    documento_recibo?: string
    estado: string
    notas?: string
    created_at: string
    updated_at: string
    created_by?: string
    created_by_name?: string
}

export async function getPolicies(): Promise<PolicyDB[]> {
    if (!isSupabaseConfigured) return []

    const { data, error } = await supabase
        .from('polizas_seguro')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching policies:', error)
        return []
    }

    return data || []
}

export async function getPolicyByVehicle(vehiculoId: string): Promise<PolicyDB | null> {
    if (!isSupabaseConfigured) return null

    const { data, error } = await supabase
        .from('polizas_seguro')
        .select('*')
        .eq('vehiculo_id', vehiculoId)
        .eq('estado', 'activa')
        .order('fecha_vencimiento', { ascending: false })
        .limit(1)
        .single()

    if (error) {
        // No policy found is not an error
        if (error.code === 'PGRST116') return null
        console.error('Error fetching policy:', error)
        return null
    }

    return data
}

export async function createPolicy(policy: Omit<PolicyDB, 'id' | 'created_at' | 'updated_at'>): Promise<PolicyDB | null> {
    if (!isSupabaseConfigured) return null

    const { data, error } = await supabase
        .from('polizas_seguro')
        .insert(policy)
        .select()
        .single()

    if (error) {
        console.error('Error creating policy:', error)
        return null
    }

    return data
}

export async function updatePolicy(id: string, updates: Partial<PolicyDB>): Promise<PolicyDB | null> {
    if (!isSupabaseConfigured) return null

    const { data, error } = await supabase
        .from('polizas_seguro')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error updating policy:', error)
        return null
    }

    return data
}

export async function deletePolicy(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false

    const { error } = await supabase
        .from('polizas_seguro')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting policy:', error)
        return false
    }

    return true
}

export async function generatePolicyNumber(): Promise<string> {
    if (!isSupabaseConfigured) {
        const year = new Date().getFullYear()
        return `POL-${year}-${Date.now().toString().slice(-6)}`
    }

    const year = new Date().getFullYear()

    const { data, error } = await supabase
        .from('polizas_seguro')
        .select('numero_poliza')
        .like('numero_poliza', `POL-${year}-%`)
        .order('created_at', { ascending: false })
        .limit(1)

    if (error || !data || data.length === 0) {
        return `POL-${year}-000001`
    }

    const lastNumber = data[0].numero_poliza
    const match = lastNumber.match(/POL-\d{4}-(\d+)/)
    const nextNum = match ? parseInt(match[1], 10) + 1 : 1

    return `POL-${year}-${String(nextNum).padStart(6, '0')}`
}

// Helper functions for insurance state calculation (moved from mock-insurance.ts)
export type InsuranceState = 'sin_seguro' | 'asegurado' | 'por_vencer' | 'vencido' | 'en_tramite'

export function calculateInsuranceState(fechaVencimiento: string): InsuranceState {
    const today = new Date()
    const vencimiento = new Date(fechaVencimiento)
    const diffDays = Math.ceil((vencimiento.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'vencido'
    if (diffDays <= 30) return 'por_vencer'
    return 'asegurado'
}

export function getDaysRemaining(fechaVencimiento: string): number {
    const today = new Date()
    const vencimiento = new Date(fechaVencimiento)
    return Math.ceil((vencimiento.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}
