import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Campos públicos que se exponen en la API (excluye datos internos sensibles)
const PUBLIC_VEHICLE_FIELDS = `
  id,
  matricula,
  estado,
  destacado,
  en_oferta,
  marca,
  modelo,
  version,
  año_fabricacion,
  año_matriculacion,
  tipo_motor,
  cilindrada,
  potencia_cv,
  potencia_kw,
  combustible,
  consumo_mixto,
  emisiones_co2,
  etiqueta_dgt,
  transmision,
  num_marchas,
  traccion,
  tipo_carroceria,
  num_puertas,
  num_plazas,
  color_exterior,
  color_interior,
  kilometraje,
  num_propietarios,
  es_nacional,
  primera_mano,
  precio_venta,
  descuento,
  garantia_meses,
  tipo_garantia,
  fecha_itv_vencimiento,
  imagen_principal,
  imagenes,
  equipamiento,
  url_web,
  created_at
`

// Headers CORS para permitir peticiones desde cualquier origen
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

// Manejo de preflight requests (OPTIONS)
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() })
}

// GET /api/vehicles - Lista vehículos públicos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parámetros de query opcionales
    const estado = searchParams.get('estado') || 'disponible' // Por defecto solo disponibles
    const marca = searchParams.get('marca')
    const combustible = searchParams.get('combustible')
    const precioMin = searchParams.get('precio_min')
    const precioMax = searchParams.get('precio_max')
    const kmMax = searchParams.get('km_max')
    const añoMin = searchParams.get('año_min')
    const destacados = searchParams.get('destacados')
    const enOferta = searchParams.get('en_oferta')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const orderBy = searchParams.get('order_by') || 'created_at'
    const orderDir = searchParams.get('order_dir') || 'desc'

    // Construir query
    let query = supabase
      .from('vehicles')
      .select(PUBLIC_VEHICLE_FIELDS)

    // Filtros
    if (estado && estado !== 'todos') {
      query = query.eq('estado', estado)
    }

    if (marca) {
      query = query.ilike('marca', `%${marca}%`)
    }

    if (combustible) {
      query = query.eq('combustible', combustible)
    }

    if (precioMin) {
      query = query.gte('precio_venta', parseInt(precioMin))
    }

    if (precioMax) {
      query = query.lte('precio_venta', parseInt(precioMax))
    }

    if (kmMax) {
      query = query.lte('kilometraje', parseInt(kmMax))
    }

    if (añoMin) {
      query = query.gte('año_matriculacion', parseInt(añoMin))
    }

    if (destacados === 'true') {
      query = query.eq('destacado', true)
    }

    if (enOferta === 'true') {
      query = query.eq('en_oferta', true)
    }

    // Ordenamiento
    const ascending = orderDir === 'asc'
    query = query.order(orderBy, { ascending })

    // Paginación
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching vehicles:', error)
      return NextResponse.json(
        { error: 'Error al obtener vehículos', details: error.message },
        { status: 500, headers: corsHeaders() }
      )
    }

    // Obtener conteo total para paginación
    const { count: totalCount } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
      .eq('estado', estado || 'disponible')

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (totalCount || 0)
      }
    }, { headers: corsHeaders() })

  } catch (error) {
    console.error('Error in vehicles API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: corsHeaders() }
    )
  }
}
