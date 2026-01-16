// Vehicle Types
export interface Vehicle {
    id: string
    vin: string
    matricula: string
    stock_id: string

    // Status
    estado: 'disponible' | 'reservado' | 'vendido' | 'taller' | 'baja'
    destacado: boolean
    en_oferta: boolean

    // Basic Info
    marca: string
    modelo: string
    version: string
    año_fabricacion: number
    año_matriculacion: number

    // Technical
    tipo_motor: string
    cilindrada: number
    potencia_cv: number
    potencia_kw: number
    combustible: 'gasolina' | 'diesel' | 'hibrido' | 'electrico' | 'glp' | 'gnc'
    consumo_mixto: number
    emisiones_co2: number
    etiqueta_dgt: '0' | 'ECO' | 'C' | 'B' | 'SIN'
    transmision: 'manual' | 'automatico' | 'semiautomatico'
    num_marchas: number
    traccion: string

    // Body
    tipo_carroceria: string
    num_puertas: number
    num_plazas: number
    color_exterior: string
    color_interior: string

    // History
    kilometraje: number
    num_propietarios: number
    es_nacional: boolean
    primera_mano: boolean

    // Commercial
    precio_compra: number
    gastos_compra: number
    coste_reparaciones: number
    precio_venta: number
    descuento: number
    margen_bruto: number
    fecha_entrada_stock: string
    dias_en_stock: number

    // Warranty
    garantia_meses: number
    tipo_garantia: string

    // ITV
    fecha_itv_vencimiento?: string  // Fecha de vencimiento de la ITV (ISO date)

    // Images
    imagen_principal: string
    imagenes: VehicleImage[]

    // Documents
    documentos?: VehicleDocument[]

    // Web Link
    url_web?: string
    datos_sincronizados?: boolean
    ultima_sincronizacion?: string

    // Equipment (array of equipment IDs)
    equipamiento?: string[]

    // Timestamps
    created_at: string
    updated_at: string

    // User tracking
    created_by?: string  // ID del usuario que creó el vehículo
    created_by_name?: string  // Nombre del usuario que creó el vehículo
}

export interface VehicleImage {
    id: string
    vehiculo_id: string
    url: string
    es_principal: boolean
    orden: number
    tipo: 'exterior' | 'interior' | 'motor' | 'detalle'
}

export interface VehicleDocument {
    id: string
    vehiculo_id: string
    nombre: string
    tipo: string  // ficha_tecnica, permiso_circulacion, itv, contrato, etc.
    url: string   // base64 data URL
    fecha_subida: string
}

export interface VehicleEquipment {
    vehiculo_id: string
    abs: boolean
    esp: boolean
    airbags: number
    isofix: boolean
    control_traccion: boolean
    alarma: boolean
    climatizador: boolean
    asientos_calefactados: boolean
    asientos_electricos: boolean
    tapiceria_cuero: boolean
    volante_multifuncion: boolean
    sensores_parking: boolean
    camara_trasera: boolean
    techo_panoramico: boolean
    navegador_gps: boolean
    pantalla_tactil: boolean
    bluetooth: boolean
    usb: boolean
    carplay: boolean
    android_auto: boolean
    faros_led: boolean
    faros_xenon: boolean
    luces_diurnas: boolean
    llantas_aleacion: boolean
    tamano_llantas: number
    bola_remolque: boolean
    barras_techo: boolean
    equipamiento_adicional: string[]
}

// Lead Types
export interface Lead {
    id: string
    cliente_id: string
    vehiculo_id: string | null

    estado: 'nuevo' | 'contactado' | 'visita_agendada' | 'prueba_conduccion' | 'propuesta_enviada' | 'negociacion' | 'vendido' | 'perdido'
    prioridad: 'baja' | 'media' | 'alta' | 'urgente'
    probabilidad: number

    tipo_interes: string
    presupuesto_cliente: number
    forma_pago: string

    asignado_a: string
    transcript_chatbot: ChatMessage[]
    sentimiento_ia: 'positivo' | 'neutral' | 'negativo'

    fecha_creacion: string
    fecha_cierre: string | null
    ultima_interaccion: string
    proxima_accion: string | null
    fecha_proxima_accion: string | null

    motivo_perdida: string | null
    notas: string

    // User tracking
    created_by?: string  // ID del usuario que creó el lead
    created_by_name?: string  // Nombre del usuario que creó el lead

    // Datos del cliente embebidos (para leads sin cliente_id)
    cliente_nombre?: string
    cliente_apellidos?: string
    cliente_email?: string
    cliente_telefono?: string

    // Joined data
    cliente?: Client
    vehiculo?: Vehicle
    vendedor?: User
}

export interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
    timestamp: string
}

// Client Types
export interface Client {
    id: string
    tipo_cliente: 'particular' | 'empresa'

    nombre: string
    apellidos: string
    razon_social: string | null

    nif_nie: string | null
    cif: string | null
    email: string
    telefono: string

    direccion: string | null
    cp: string | null
    municipio: string | null
    provincia: string | null

    preferencias_comunicacion: string[]
    acepta_marketing: boolean
    origen_lead: string

    consentimiento_rgpd: boolean
    fecha_registro: string
    created_at: string
}

// User Types
export interface User {
    id: string
    email: string
    nombre: string
    apellidos: string
    avatar_url: string | null

    rol: 'admin' | 'vendedor' | 'mecanico' | 'recepcionista'
    permisos: string[]

    activo: boolean
    fecha_alta: string
    ultimo_acceso: string
}

// Interaction Types
export interface Interaction {
    id: string
    cliente_id: string
    lead_id: string | null

    tipo: 'llamada' | 'email' | 'whatsapp' | 'visita' | 'prueba' | 'nota'
    fecha: string
    duracion_minutos: number | null

    descripcion: string
    resultado: string | null

    siguiente_accion: string | null
    fecha_siguiente_accion: string | null

    realizada_por: string
    created_at: string
}

// Sale Types
export interface Sale {
    id: string
    numero_factura: string

    cliente_id: string
    vehiculo_id: string
    vendedor_id: string

    fecha_venta: string
    fecha_entrega: string | null

    precio_final: number
    forma_pago: string
    financiacion: boolean

    total_venta: number
    estado: 'pendiente' | 'completada' | 'cancelada'

    created_at: string

    // Joined data
    cliente?: Client
    vehiculo?: Vehicle
    vendedor?: User
}

// Chatbot Conversation
export interface ChatbotConversation {
    id: string
    cliente_id: string | null
    lead_generado: string | null

    transcript: ChatMessage[]
    sentimiento: 'positivo' | 'neutral' | 'negativo'

    duracion_segundos: number
    abandono: boolean
    vehiculos_consultados: string[]

    created_at: string
}

// Dashboard KPI
export interface KPI {
    label: string
    value: number
    previousValue: number
    changePercent: number
    trend: 'up' | 'down' | 'neutral'
    format?: 'number' | 'currency' | 'percentage'
}

// Notification
export interface Notification {
    id: string
    tipo: 'lead' | 'venta' | 'alerta' | 'sistema'
    titulo: string
    mensaje: string
    leida: boolean
    enlace: string | null
    created_at: string
}

// Report
export interface ReportFilter {
    fechaInicio: string
    fechaFin: string
    vendedor?: string
    marca?: string
    estado?: string
}

// Contact Types (para módulo de contactos)
export interface ContactBillingData {
    tipo_cliente?: 'particular' | 'empresa' | 'autonomo'
    tipo_documento?: 'dni' | 'nie' | 'cif' | 'nif'
    razon_social?: string
    cif_nif: string
    direccion_fiscal: string
    numero?: string
    escalera_piso?: string
    codigo_postal: string
    municipio: string
    provincia: string
    comunidad?: string
    pais?: string
}

export interface Contact {
    id: string

    // Datos básicos iniciales (requeridos)
    telefono: string
    email: string

    // Datos completos (opcionales al inicio)
    nombre?: string
    apellidos?: string
    dni_cif?: string

    // Dirección (opcional)
    direccion?: string
    codigo_postal?: string
    municipio?: string
    provincia?: string

    // Datos de facturación (opcionales)
    datos_facturacion?: ContactBillingData

    // Tracking
    origen: 'web' | 'telefono' | 'presencial' | 'whatsapp' | 'coches_net' | 'wallapop' | 'autocasion' | 'facebook' | 'instagram' | 'referido' | 'otro'
    estado: 'nuevo' | 'en_seguimiento' | 'convertido_lead' | 'inactivo' | 'pendiente' | 'comunicado' | 'tramite' | 'reservado' | 'postventa' | 'busqueda' | 'cerrado'

    // Vehículos de interés
    vehiculos_interes: string[]  // Array de IDs de vehículos

    // Preferencias
    preferencias_comunicacion: string[]
    acepta_marketing: boolean
    consentimiento_rgpd: boolean

    // Notas
    notas?: string

    // Timestamps
    fecha_registro: string
    ultima_interaccion?: string
    created_at: string
    updated_at: string

    // Backoffice fields
    progreso?: number  // 0-100
    fecha_ultimo_contacto?: string
    categoria?: 'vehiculo' | 'financiacion' | 'postventa' | 'tasacion' | 'otro'
    asunto?: string
    comercial_asignado?: string
    tipo_pago?: 'contado' | 'financiacion' | 'renting'
    transporte?: number
    es_nuevo_cliente?: boolean
    precio?: number
    reserva?: number

    // User tracking
    created_by?: string  // ID del usuario que creó el contacto
    created_by_name?: string  // Nombre del usuario que creó el contacto

    // Relaciones (joined data)
    vehiculos?: Vehicle[]
}

// Interaction for history tracking
export interface ContactInteraction {
    id: string
    contact_id: string
    tipo: 'llamada' | 'email' | 'whatsapp' | 'visita' | 'nota' | 'sms'
    fecha: string
    descripcion: string
    resultado?: string
    realizado_por?: string
    vehiculo_id?: string
}

// Insurance Policy Types
export type InsuranceState = 'sin_seguro' | 'asegurado' | 'por_vencer' | 'vencido' | 'en_tramite'

export type InsurancePolicyType = 'terceros_basico' | 'terceros_ampliado' | 'todo_riesgo_franquicia' | 'todo_riesgo_sin_franquicia'

export interface InsuranceCoverages {
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

export interface PolizaSeguro {
    id: string
    vehiculoId: string

    // Policy data
    companiaAseguradora: string
    numeroPoliza: string
    tipoPoliza: InsurancePolicyType

    // Dates
    fechaAlta: string
    fechaVencimiento: string

    // Costs
    primaAnual: number
    franquicia?: number

    // Policy holder
    tomadorNombre: string
    tomadorNif: string

    // Coverages
    coberturas: InsuranceCoverages

    // Documents
    documentos: {
        polizaPdf?: DocumentFile
        reciboPdf?: DocumentFile
        otros?: DocumentFile[]
    }
}

// Document file metadata
export interface DocumentFile {
    name: string
    type: string
    size: number
    dataUrl: string
    uploadedAt: string

    // State
    estado: InsuranceState

    // Metadata
    createdAt: string
    updatedAt: string
}

// Insurance Companies constant
export const INSURANCE_COMPANIES = [
    'AXA',
    'Mapfre',
    'Allianz',
    'Zurich',
    'Generali',
    'Mutua Madrileña',
    'Línea Directa',
    'Pelayo',
    'Reale',
    'Otra'
] as const

export const POLICY_TYPES: { value: InsurancePolicyType; label: string }[] = [
    { value: 'terceros_basico', label: 'Terceros Básico' },
    { value: 'terceros_ampliado', label: 'Terceros Ampliado' },
    { value: 'todo_riesgo_franquicia', label: 'Todo Riesgo con Franquicia' },
    { value: 'todo_riesgo_sin_franquicia', label: 'Todo Riesgo sin Franquicia' },
]

export const INSURANCE_STATE_CONFIG: Record<InsuranceState, { label: string; color: string; icon: string }> = {
    sin_seguro: { label: 'Sin seguro', color: '#ef4444', icon: 'alert-triangle' },
    asegurado: { label: 'Asegurado', color: '#22c55e', icon: 'shield-check' },
    por_vencer: { label: 'Por vencer', color: '#eab308', icon: 'clock' },
    vencido: { label: 'Vencido', color: '#f97316', icon: 'shield-x' },
    en_tramite: { label: 'En trámite', color: '#3b82f6', icon: 'loader' },
}

// ============================================================================
// CONTRACT TYPES (Contratos de Compraventa)
// ============================================================================

export type ContractType = 'venta' | 'compra' | 'permuta'
export type ContractStatus = 'borrador' | 'pendiente_firma' | 'firmado' | 'anulado'
export type PaymentMethod = 'contado' | 'financiacion' | 'transferencia' | 'mixto'

// Datos de la empresa (vendedor o comprador profesional)
export interface CompanyData {
    id: string
    nombre: string
    cif: string
    direccion: string
    codigo_postal: string
    municipio: string
    provincia: string
    telefono: string
    email: string
    representante_nombre: string
    representante_dni: string
    representante_cargo: string
    logo_url?: string
}

// Datos de persona física (comprador o vendedor particular)
export interface PersonData {
    nombre: string
    apellidos: string
    dni_nie: string
    direccion: string
    codigo_postal: string
    municipio: string
    provincia: string
    telefono: string
    email: string
    fecha_nacimiento?: string
    nacionalidad?: string
}

// Datos del vehículo para el contrato
export interface ContractVehicleData {
    matricula: string
    bastidor: string
    marca: string
    modelo: string
    version?: string
    fecha_matriculacion: string
    kilometros: number
    combustible: string
    color: string
    num_propietarios?: number
    // ITV
    fecha_itv?: string
    resultado_itv?: 'favorable' | 'desfavorable' | 'negativa'
    // Documentación
    tiene_permiso_circulacion: boolean
    tiene_ficha_tecnica: boolean
    tiene_itv_vigente: boolean
    tiene_justificante_pago_impuesto: boolean
}

// Condiciones económicas
export interface ContractEconomics {
    precio_venta: number
    iva_porcentaje: number // 21, 12, 4, 0 (particular)
    iva_importe: number
    precio_total: number
    // Forma de pago
    forma_pago: PaymentMethod
    // Si es financiación
    entidad_financiera?: string
    importe_financiado?: number
    entrada?: number
    num_cuotas?: number
    // Vehículo a cuenta
    vehiculo_entrega?: {
        matricula: string
        marca: string
        modelo: string
        valor_tasacion: number
    }
    // Reserva/señal
    reserva_importe?: number
    reserva_fecha?: string
}

// Garantía del vehículo
export interface ContractWarranty {
    tiene_garantia: boolean
    meses_garantia: number
    tipo_garantia: 'legal' | 'comercial' | 'extendida'
    descripcion_garantia?: string
    exclusiones?: string
}

// Contrato completo
export interface Contract {
    id: string
    numero_contrato: string
    tipo: ContractType
    estado: ContractStatus

    // Fecha y lugar
    fecha_contrato: string
    lugar_firma: string

    // Partes del contrato
    vendedor: CompanyData | PersonData
    vendedor_tipo: 'empresa' | 'particular'
    comprador: PersonData
    comprador_tipo: 'empresa' | 'particular'

    // Vehículo
    vehiculo: ContractVehicleData
    vehiculo_id?: string // Referencia al vehículo en inventario

    // Económico
    economico: ContractEconomics

    // Garantía
    garantia: ContractWarranty

    // Cláusulas adicionales
    clausulas_adicionales?: string
    observaciones?: string

    // Entrega
    fecha_entrega_prevista?: string
    fecha_entrega_real?: string
    lugar_entrega?: string

    // Firmas
    firma_vendedor?: string // Base64 de la firma
    firma_comprador?: string
    fecha_firma_vendedor?: string
    fecha_firma_comprador?: string

    // Tracking
    created_at: string
    updated_at: string
    created_by?: string
    created_by_name?: string
}

// Configuración de empresa por defecto
export const DEFAULT_COMPANY: CompanyData = {
    id: 'default',
    nombre: 'MidCar Automoción S.L.',
    cif: 'B12345678',
    direccion: 'Calle Principal, 123',
    codigo_postal: '28001',
    municipio: 'Madrid',
    provincia: 'Madrid',
    telefono: '912 345 678',
    email: 'ventas@midcar.es',
    representante_nombre: 'Juan García López',
    representante_dni: '12345678A',
    representante_cargo: 'Gerente',
}

// ============================================================================
// EMPRESA VENDEDORA (Configurable por el usuario)
// ============================================================================

export interface EmpresaVendedora {
    id: string
    nombre_comercial: string
    razon_social: string
    cif: string
    direccion: string
    codigo_postal: string
    localidad: string
    provincia: string
    telefono: string
    email: string
    web?: string
    logo?: string // Base64 o URL
    activa: boolean
    es_ejemplo: boolean
    created_at: string
    updated_at: string
}

// ============================================================================
// INVOICE / FACTURACIÓN
// ============================================================================

export type InvoiceStatus = 'pendiente' | 'pagada' | 'parcial' | 'anulada'

export interface Invoice {
    id: string
    numero_factura: string
    fecha_factura: string
    fecha_vencimiento?: string

    // Relaciones
    empresa_id: string
    vehiculo_id: string
    contrato_id?: string // Vinculación opcional con contrato

    // Cliente
    cliente: PersonData
    tipo_cliente: 'particular' | 'empresa'

    // Concepto
    concepto: string

    // Desglose económico
    base_imponible: number
    descuento?: number // Descuento aplicado
    iva_porcentaje: number
    iva_importe: number
    total: number

    // Estado y pago
    estado: InvoiceStatus
    forma_pago: string
    fecha_pago?: string
    importe_pagado?: number
    iban?: string // IBAN para transferencias

    // Observaciones
    notas?: string

    // Tracking
    created_at: string
    updated_at: string
    created_by?: string
    created_by_name?: string
}

// ============================================================================
// CONTRATO EXTENDIDO (campos adicionales solicitados)
// ============================================================================

export type TipoDocumentoIdentidad = 'DNI' | 'NIE' | 'Pasaporte' | 'CIF'
export type TipoCliente = 'particular' | 'empresa'
export type EstadoITV = 'Auto' | 'Manual' | 'Pendiente'

export interface ContractExtended extends Contract {
    // Empresa vendedora dinámica
    empresa_id?: string

    // Cliente extendido
    tipo_cliente: TipoCliente
    tipo_documento: TipoDocumentoIdentidad

    // Dirección extendida
    escalera_piso?: string
    comunidad?: string

    // ITV
    estado_itv?: EstadoITV
    km_venta?: number
    proximo_itv?: string

    // Transacción
    fecha_transaccion?: string
    reserva?: number
    total_pago?: number // precio_venta - reserva
    distribuidor?: string
}
