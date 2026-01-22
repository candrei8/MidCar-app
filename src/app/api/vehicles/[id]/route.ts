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

// GET /api/vehicles/[id] - Obtener detalle de un vehículo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'ID de vehículo requerido' },
        { status: 400, headers: corsHeaders() }
      )
    }

    const { data, error } = await supabase
      .from('vehicles')
      .select(PUBLIC_VEHICLE_FIELDS)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Vehículo no encontrado' },
          { status: 404, headers: corsHeaders() }
        )
      }
      console.error('Error fetching vehicle:', error)
      return NextResponse.json(
        { error: 'Error al obtener vehículo', details: error.message },
        { status: 500, headers: corsHeaders() }
      )
    }

    return NextResponse.json({
      success: true,
      data
    }, { headers: corsHeaders() })

  } catch (error) {
    console.error('Error in vehicle detail API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: corsHeaders() }
    )
  }
}
