import { createBrowserClient } from '@supabase/ssr'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Check if Supabase is properly configured
export const isSupabaseConfigured = Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('placeholder')
)

// Create browser client for proper cookie-based session persistence
let supabase: SupabaseClient

if (isSupabaseConfigured) {
    // Use SSR browser client for proper session persistence with cookies
    supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
} else {
    // Create a mock client for build time/demo mode
    supabase = createClient('https://placeholder.supabase.co', 'placeholder-key', {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    })
}

export { supabase }

// Types for database tables
export type Database = {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    email: string
                    nombre: string
                    apellidos: string
                    avatar_url: string | null
                    rol: 'admin' | 'vendedor' | 'mecanico' | 'recepcionista'
                    permisos: string[]
                    activo: boolean
                    fecha_alta: string
                    ultimo_acceso: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>
                Update: Partial<Database['public']['Tables']['users']['Insert']>
            }
            vehicles: {
                Row: {
                    id: string
                    vin: string | null
                    matricula: string
                    stock_id: string
                    estado: 'disponible' | 'reservado' | 'vendido' | 'taller' | 'baja'
                    destacado: boolean
                    en_oferta: boolean
                    marca: string
                    modelo: string
                    version: string | null
                    año_fabricacion: number | null
                    año_matriculacion: number | null
                    tipo_motor: string | null
                    cilindrada: number | null
                    potencia_cv: number | null
                    potencia_kw: number | null
                    combustible: 'gasolina' | 'diesel' | 'hibrido' | 'electrico' | 'glp' | 'gnc' | null
                    consumo_mixto: number | null
                    emisiones_co2: number | null
                    etiqueta_dgt: '0' | 'ECO' | 'C' | 'B' | 'SIN' | null
                    transmision: 'manual' | 'automatico' | 'semiautomatico' | null
                    num_marchas: number | null
                    traccion: string | null
                    tipo_carroceria: string | null
                    num_puertas: number | null
                    num_plazas: number | null
                    color_exterior: string | null
                    color_interior: string | null
                    kilometraje: number
                    num_propietarios: number
                    es_nacional: boolean
                    primera_mano: boolean
                    precio_compra: number
                    gastos_compra: number
                    coste_reparaciones: number
                    precio_venta: number
                    descuento: number
                    margen_bruto: number
                    fecha_entrada_stock: string
                    dias_en_stock: number
                    garantia_meses: number
                    tipo_garantia: string | null
                    imagen_principal: string | null
                    url_web: string | null
                    datos_sincronizados: boolean
                    ultima_sincronizacion: string | null
                    equipamiento: string[]
                    created_at: string
                    updated_at: string
                }
                Insert: Omit<Database['public']['Tables']['vehicles']['Row'], 'id' | 'margen_bruto' | 'dias_en_stock' | 'created_at' | 'updated_at'>
                Update: Partial<Database['public']['Tables']['vehicles']['Insert']>
            }
            contacts: {
                Row: {
                    id: string
                    telefono: string
                    email: string | null
                    nombre: string | null
                    apellidos: string | null
                    dni_cif: string | null
                    direccion: string | null
                    codigo_postal: string | null
                    municipio: string | null
                    provincia: string | null
                    datos_facturacion: Record<string, unknown> | null
                    origen: string
                    estado: string
                    vehiculos_interes: string[]
                    preferencias_comunicacion: string[]
                    acepta_marketing: boolean
                    consentimiento_rgpd: boolean
                    notas: string | null
                    progreso: number
                    categoria: string | null
                    asunto: string | null
                    comercial_asignado: string | null
                    tipo_pago: string | null
                    transporte: number | null
                    es_nuevo_cliente: boolean
                    precio: number | null
                    reserva: number | null
                    fecha_registro: string
                    fecha_ultimo_contacto: string | null
                    ultima_interaccion: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: Omit<Database['public']['Tables']['contacts']['Row'], 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Database['public']['Tables']['contacts']['Insert']>
            }
            leads: {
                Row: {
                    id: string
                    cliente_id: string | null
                    vehiculo_id: string | null
                    estado: string
                    prioridad: string
                    probabilidad: number
                    tipo_interes: string | null
                    presupuesto_cliente: number | null
                    forma_pago: string | null
                    asignado_a: string | null
                    transcript_chatbot: unknown[]
                    sentimiento_ia: string
                    fecha_creacion: string
                    fecha_cierre: string | null
                    ultima_interaccion: string | null
                    proxima_accion: string | null
                    fecha_proxima_accion: string | null
                    motivo_perdida: string | null
                    notas: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: Omit<Database['public']['Tables']['leads']['Row'], 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Database['public']['Tables']['leads']['Insert']>
            }
            interactions: {
                Row: {
                    id: string
                    contact_id: string | null
                    lead_id: string | null
                    tipo: string
                    fecha: string
                    hora: string
                    duracion_minutos: number | null
                    descripcion: string | null
                    resultado: string | null
                    seguimiento_fecha: string | null
                    seguimiento_hora: string | null
                    siguiente_accion: string | null
                    fecha_siguiente_accion: string | null
                    realizada_por: string | null
                    created_at: string
                }
                Insert: Omit<Database['public']['Tables']['interactions']['Row'], 'id' | 'created_at'>
                Update: Partial<Database['public']['Tables']['interactions']['Insert']>
            }
            sales: {
                Row: {
                    id: string
                    numero_factura: string | null
                    cliente_id: string | null
                    vehiculo_id: string | null
                    vendedor_id: string | null
                    lead_id: string | null
                    fecha_venta: string
                    fecha_entrega: string | null
                    precio_venta: number
                    descuento: number
                    gastos_adicionales: number
                    precio_final: number
                    forma_pago: string | null
                    financiacion: boolean
                    entidad_financiera: string | null
                    importe_financiado: number | null
                    cuotas: number | null
                    garantia_meses: number
                    garantia_tipo: string | null
                    estado: string
                    coste_total_vehiculo: number | null
                    margen_bruto: number | null
                    porcentaje_margen: number | null
                    created_at: string
                    updated_at: string
                }
                Insert: Omit<Database['public']['Tables']['sales']['Row'], 'id' | 'precio_final' | 'created_at' | 'updated_at'>
                Update: Partial<Database['public']['Tables']['sales']['Insert']>
            }
            tasks: {
                Row: {
                    id: string
                    contact_id: string | null
                    lead_id: string | null
                    titulo: string
                    descripcion: string | null
                    tipo: string | null
                    prioridad: string
                    fecha_vencimiento: string
                    hora_vencimiento: string | null
                    asignado_a: string | null
                    completada: boolean
                    fecha_completada: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Database['public']['Tables']['tasks']['Insert']>
            }
        }
    }
}
