import { supabase } from '../supabase'
import type { Sale } from '@/types'

export interface SaleRecord {
    id?: string
    numero_factura?: string
    cliente_id?: string
    vehiculo_id?: string
    vendedor_id?: string
    lead_id?: string
    fecha_venta: string
    fecha_entrega?: string
    precio_venta: number
    descuento?: number
    gastos_adicionales?: number
    forma_pago?: string
    financiacion?: boolean
    entidad_financiera?: string
    importe_financiado?: number
    cuotas?: number
    garantia_meses?: number
    garantia_tipo?: string
    estado?: string
    coste_total_vehiculo?: number
    margen_bruto?: number
    porcentaje_margen?: number
}

// Get all sales
export async function getSales() {
    const { data, error } = await supabase
        .from('sales')
        .select(`
            *,
            cliente:cliente_id (nombre, apellidos, telefono),
            vehiculo:vehiculo_id (marca, modelo, matricula, imagen_principal),
            vendedor:vendedor_id (nombre, apellidos)
        `)
        .order('fecha_venta', { ascending: false })

    if (error) {
        console.error('Error fetching sales:', error)
        throw error
    }
    return data
}

// Get sale by ID
export async function getSaleById(id: string) {
    const { data, error } = await supabase
        .from('sales')
        .select(`
            *,
            cliente:cliente_id (*),
            vehiculo:vehiculo_id (*),
            vendedor:vendedor_id (*)
        `)
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching sale:', error)
        throw error
    }
    return data
}

// Create sale
export async function createSale(sale: SaleRecord) {
    // Generate invoice number
    const invoiceNumber = `FAC-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`

    const { data, error } = await supabase
        .from('sales')
        .insert({
            ...sale,
            numero_factura: sale.numero_factura || invoiceNumber
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating sale:', error)
        throw error
    }

    // Update vehicle status to 'vendido'
    if (sale.vehiculo_id) {
        await supabase
            .from('vehicles')
            .update({ estado: 'vendido' })
            .eq('id', sale.vehiculo_id)
    }

    // Update lead status to 'vendido'
    if (sale.lead_id) {
        await supabase
            .from('leads')
            .update({
                estado: 'vendido',
                fecha_cierre: new Date().toISOString()
            })
            .eq('id', sale.lead_id)
    }

    return data
}

// Update sale
export async function updateSale(id: string, updates: Partial<SaleRecord>) {
    const { data, error } = await supabase
        .from('sales')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error updating sale:', error)
        throw error
    }
    return data
}

// Get sales stats
export async function getSalesStats(startDate?: string, endDate?: string) {
    let query = supabase
        .from('sales')
        .select('precio_venta, descuento, gastos_adicionales, margen_bruto, fecha_venta, estado')

    if (startDate) {
        query = query.gte('fecha_venta', startDate)
    }
    if (endDate) {
        query = query.lte('fecha_venta', endDate)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching sales stats:', error)
        throw error
    }

    const sales = data || []
    const completedSales = sales.filter(s => s.estado === 'completada' || s.estado === 'entregado')

    return {
        totalVentas: completedSales.length,
        facturacionTotal: completedSales.reduce((sum, s) =>
            sum + (Number(s.precio_venta) || 0) - (Number(s.descuento) || 0) + (Number(s.gastos_adicionales) || 0), 0
        ),
        margenTotal: completedSales.reduce((sum, s) => sum + (Number(s.margen_bruto) || 0), 0),
        ticketMedio: completedSales.length > 0
            ? completedSales.reduce((sum, s) =>
                sum + (Number(s.precio_venta) || 0) - (Number(s.descuento) || 0), 0
            ) / completedSales.length
            : 0,
        pendientes: sales.filter(s => s.estado === 'pendiente').length,
    }
}

// Get monthly sales
export async function getMonthlySales(year: number) {
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    const { data, error } = await supabase
        .from('sales')
        .select('fecha_venta, precio_venta, descuento')
        .gte('fecha_venta', startDate)
        .lte('fecha_venta', endDate)
        .in('estado', ['completada', 'entregado'])

    if (error) {
        console.error('Error fetching monthly sales:', error)
        throw error
    }

    // Group by month
    const monthlyData = Array(12).fill(0).map((_, i) => ({
        month: i + 1,
        ventas: 0,
        facturacion: 0,
    }))

    data?.forEach(sale => {
        const month = new Date(sale.fecha_venta).getMonth()
        monthlyData[month].ventas++
        monthlyData[month].facturacion += (Number(sale.precio_venta) || 0) - (Number(sale.descuento) || 0)
    })

    return monthlyData
}
