/**
 * Dashboard Service
 * 
 * Centralized service for calculating all dashboard metrics from real data.
 * This ensures consistency across the application and proper interconnection
 * between modules.
 */

import { mockVehicles, mockLeads, mockUsers, mockContacts, mockSalesChartData } from './mock-data'
import type { Vehicle, Lead, User } from '@/types'

// ============================================================================
// TYPES
// ============================================================================

export interface StockMetrics {
    total: number
    disponible: number
    reservado: number
    vendido: number
    enTaller: number
    valorStock: number           // Sum of precio_venta for active stock
    inversionStock: number       // Sum of (precio_compra + gastos + reparaciones)
    margenPotencial: number      // valorStock - inversionStock
    margenPorcentaje: number     // (margenPotencial / inversionStock) * 100
}

export interface SalesMetrics {
    vehiculosVendidos: number
    ingresosReales: number       // Sum of precio_venta for sold vehicles
    margenBrutoReal: number      // precio_venta - coste total
    margenPorcentaje: number
    ticketMedio: number
    ventasUltimos30Dias: number
    tendenciaMensual: number     // % change vs previous period
}

export interface LeadMetrics {
    total: number
    nuevos: number
    enProceso: number
    vendidos: number
    perdidos: number
    tasaConversion: number       // (vendidos / total) * 100
    valorPipeline: number        // Sum of (vehiculo.precio_venta * probabilidad/100)
    leadsUrgentes: number        // prioridad = 'urgente' or 'alta'
    accionesPendientes: number   // leads with fecha_proxima_accion <= today
}

export interface PerformanceMetrics {
    diasPromedioStock: number
    vehiculosEnRiesgo: Vehicle[] // dias_en_stock > 60
    vehiculosNuevos7Dias: number
    rotacionMensual: number      // vendidos / stock promedio
}

export interface SellerPerformance {
    id: string
    nombre: string
    apellidos: string
    ventas: number
    leads: number
    conversionRate: number
    ingresos: number
}

export interface BrandAnalytics {
    marca: string
    cantidad: number
    valor: number
    porcentaje: number
    diasPromedioStock: number
}

export interface ActivityItem {
    id: string
    tipo: 'lead' | 'venta' | 'stock' | 'alerta'
    titulo: string
    descripcion: string
    fecha: string
    icono: string
    color: string
    enlace?: string
}

export interface CriticalAlert {
    id: string
    tipo: 'stock_aging' | 'lead_pending' | 'low_stock' | 'high_margin'
    titulo: string
    descripcion: string
    severidad: 'warning' | 'danger' | 'info'
    enlace: string
    fecha: string
}

export interface DashboardData {
    stock: StockMetrics
    sales: SalesMetrics
    leads: LeadMetrics
    performance: PerformanceMetrics
    sellers: SellerPerformance[]
    brands: BrandAnalytics[]
    activity: ActivityItem[]
    alerts: CriticalAlert[]
    chartData: {
        salesOverTime: typeof mockSalesChartData
        leadsOverTime: { date: string; leads: number; convertidos: number }[]
    }
}

// ============================================================================
// STOCK METRICS
// ============================================================================

export function getStockMetrics(): StockMetrics {
    const disponible = mockVehicles.filter(v => v.estado === 'disponible')
    const reservado = mockVehicles.filter(v => v.estado === 'reservado')
    const vendido = mockVehicles.filter(v => v.estado === 'vendido')
    const enTaller = mockVehicles.filter(v => v.estado === 'taller')

    // Active stock = not sold, not baja
    const stockActivo = mockVehicles.filter(v => v.estado !== 'vendido' && v.estado !== 'baja')

    const valorStock = stockActivo.reduce((sum, v) => sum + v.precio_venta, 0)
    const inversionStock = stockActivo.reduce((sum, v) =>
        sum + v.precio_compra + v.gastos_compra + v.coste_reparaciones, 0)
    const margenPotencial = valorStock - inversionStock

    return {
        total: mockVehicles.length,
        disponible: disponible.length,
        reservado: reservado.length,
        vendido: vendido.length,
        enTaller: enTaller.length,
        valorStock,
        inversionStock,
        margenPotencial,
        margenPorcentaje: inversionStock > 0 ? (margenPotencial / inversionStock) * 100 : 0
    }
}

// ============================================================================
// SALES METRICS
// ============================================================================

export function getSalesMetrics(): SalesMetrics {
    const vendidos = mockVehicles.filter(v => v.estado === 'vendido')

    const ingresosReales = vendidos.reduce((sum, v) => sum + v.precio_venta, 0)
    const costeTotal = vendidos.reduce((sum, v) =>
        sum + v.precio_compra + v.gastos_compra + v.coste_reparaciones, 0)
    const margenBrutoReal = ingresosReales - costeTotal

    // Calculate sales in last 30 days (using leads with estado = 'vendido')
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const ventasUltimos30Dias = mockLeads.filter(l =>
        l.estado === 'vendido' &&
        l.fecha_cierre &&
        new Date(l.fecha_cierre) >= thirtyDaysAgo
    ).length

    // Tendencia: comparar con 30 días anteriores (simplified)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    const ventasPeriodoAnterior = mockLeads.filter(l =>
        l.estado === 'vendido' &&
        l.fecha_cierre &&
        new Date(l.fecha_cierre) >= sixtyDaysAgo &&
        new Date(l.fecha_cierre) < thirtyDaysAgo
    ).length

    const tendenciaMensual = ventasPeriodoAnterior > 0
        ? ((ventasUltimos30Dias - ventasPeriodoAnterior) / ventasPeriodoAnterior) * 100
        : ventasUltimos30Dias > 0 ? 100 : 0

    return {
        vehiculosVendidos: vendidos.length,
        ingresosReales,
        margenBrutoReal,
        margenPorcentaje: ingresosReales > 0 ? (margenBrutoReal / ingresosReales) * 100 : 0,
        ticketMedio: vendidos.length > 0 ? ingresosReales / vendidos.length : 0,
        ventasUltimos30Dias,
        tendenciaMensual
    }
}

// ============================================================================
// LEAD METRICS
// ============================================================================

export function getLeadMetrics(): LeadMetrics {
    const nuevos = mockLeads.filter(l => l.estado === 'nuevo')
    const enProceso = mockLeads.filter(l =>
        !['nuevo', 'vendido', 'perdido'].includes(l.estado)
    )
    const vendidos = mockLeads.filter(l => l.estado === 'vendido')
    const perdidos = mockLeads.filter(l => l.estado === 'perdido')

    const tasaConversion = mockLeads.length > 0
        ? (vendidos.length / mockLeads.length) * 100
        : 0

    // Pipeline value: sum of vehicle price * probability for active leads
    const leadsActivos = mockLeads.filter(l =>
        l.estado !== 'vendido' && l.estado !== 'perdido'
    )
    const valorPipeline = leadsActivos.reduce((sum, l) => {
        const vehiclePrice = l.vehiculo?.precio_venta || 0
        return sum + (vehiclePrice * (l.probabilidad / 100))
    }, 0)

    // Urgent leads
    const leadsUrgentes = mockLeads.filter(l =>
        l.estado !== 'vendido' &&
        l.estado !== 'perdido' &&
        (l.prioridad === 'urgente' || l.prioridad === 'alta')
    ).length

    // Pending actions (fecha_proxima_accion <= today)
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    const accionesPendientes = mockLeads.filter(l =>
        l.fecha_proxima_accion &&
        new Date(l.fecha_proxima_accion) <= today &&
        l.estado !== 'vendido' &&
        l.estado !== 'perdido'
    ).length

    return {
        total: mockLeads.length,
        nuevos: nuevos.length,
        enProceso: enProceso.length,
        vendidos: vendidos.length,
        perdidos: perdidos.length,
        tasaConversion,
        valorPipeline,
        leadsUrgentes,
        accionesPendientes
    }
}

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

export function getPerformanceMetrics(): PerformanceMetrics {
    const stockActivo = mockVehicles.filter(v =>
        v.estado !== 'vendido' && v.estado !== 'baja'
    )

    const diasPromedioStock = stockActivo.length > 0
        ? stockActivo.reduce((sum, v) => sum + v.dias_en_stock, 0) / stockActivo.length
        : 0

    const vehiculosEnRiesgo = stockActivo
        .filter(v => v.dias_en_stock > 60)
        .sort((a, b) => b.dias_en_stock - a.dias_en_stock)

    // Vehicles added in last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const vehiculosNuevos7Dias = mockVehicles.filter(v =>
        new Date(v.created_at) >= sevenDaysAgo
    ).length

    // Monthly rotation = vehicles sold / average stock
    const vendidos = mockVehicles.filter(v => v.estado === 'vendido').length
    const stockPromedio = stockActivo.length
    const rotacionMensual = stockPromedio > 0 ? (vendidos / stockPromedio) * 100 : 0

    return {
        diasPromedioStock: Math.round(diasPromedioStock),
        vehiculosEnRiesgo,
        vehiculosNuevos7Dias,
        rotacionMensual
    }
}

// ============================================================================
// SELLER PERFORMANCE
// ============================================================================

export function getSellerPerformance(): SellerPerformance[] {
    const sellers = mockUsers.filter(u => u.rol === 'vendedor')

    return sellers.map(seller => {
        const sellerLeads = mockLeads.filter(l => l.asignado_a === seller.id)
        const sellerSales = sellerLeads.filter(l => l.estado === 'vendido')
        const ingresos = sellerSales.reduce((sum, l) =>
            sum + (l.vehiculo?.precio_venta || 0), 0)

        return {
            id: seller.id,
            nombre: seller.nombre,
            apellidos: seller.apellidos,
            ventas: sellerSales.length,
            leads: sellerLeads.length,
            conversionRate: sellerLeads.length > 0
                ? (sellerSales.length / sellerLeads.length) * 100
                : 0,
            ingresos
        }
    }).sort((a, b) => b.ventas - a.ventas)
}

// ============================================================================
// BRAND ANALYTICS
// ============================================================================

export function getBrandAnalytics(): BrandAnalytics[] {
    const stockActivo = mockVehicles.filter(v =>
        v.estado !== 'vendido' && v.estado !== 'baja'
    )

    const brandMap = new Map<string, Vehicle[]>()
    stockActivo.forEach(v => {
        const existing = brandMap.get(v.marca) || []
        brandMap.set(v.marca, [...existing, v])
    })

    const totalStock = stockActivo.length

    return Array.from(brandMap.entries())
        .map(([marca, vehicles]) => ({
            marca,
            cantidad: vehicles.length,
            valor: vehicles.reduce((sum, v) => sum + v.precio_venta, 0),
            porcentaje: totalStock > 0 ? (vehicles.length / totalStock) * 100 : 0,
            diasPromedioStock: vehicles.length > 0
                ? vehicles.reduce((sum, v) => sum + v.dias_en_stock, 0) / vehicles.length
                : 0
        }))
        .sort((a, b) => b.cantidad - a.cantidad)
}

// ============================================================================
// RECENT ACTIVITY
// ============================================================================

export function getRecentActivity(limit: number = 10): ActivityItem[] {
    const activities: ActivityItem[] = []

    // Add recent leads
    mockLeads
        .filter(l => l.estado !== 'vendido' && l.estado !== 'perdido')
        .slice(0, 5)
        .forEach(lead => {
            activities.push({
                id: `lead-${lead.id}`,
                tipo: 'lead',
                titulo: `Nuevo Lead: ${lead.cliente?.nombre} ${lead.cliente?.apellidos}`,
                descripcion: lead.vehiculo
                    ? `Interesado en ${lead.vehiculo.marca} ${lead.vehiculo.modelo}`
                    : 'Sin vehículo asignado',
                fecha: lead.fecha_creacion,
                icono: 'person_add',
                color: 'blue',
                enlace: '/crm'
            })
        })

    // Add sold vehicles as sales
    mockLeads
        .filter(l => l.estado === 'vendido')
        .forEach(lead => {
            activities.push({
                id: `sale-${lead.id}`,
                tipo: 'venta',
                titulo: `¡Venta cerrada!`,
                descripcion: lead.vehiculo
                    ? `${lead.vehiculo.marca} ${lead.vehiculo.modelo} - ${lead.cliente?.nombre}`
                    : 'Venta completada',
                fecha: lead.fecha_cierre || lead.ultima_interaccion,
                icono: 'sell',
                color: 'green',
                enlace: '/crm'
            })
        })

    // Add recent stock entries
    mockVehicles
        .filter(v => v.dias_en_stock <= 7 && v.estado !== 'vendido')
        .forEach(vehicle => {
            activities.push({
                id: `stock-${vehicle.id}`,
                tipo: 'stock',
                titulo: `Nuevo en stock`,
                descripcion: `${vehicle.marca} ${vehicle.modelo} - ${vehicle.version}`,
                fecha: vehicle.created_at,
                icono: 'directions_car',
                color: 'purple',
                enlace: `/inventario/${vehicle.id}`
            })
        })

    // Sort by date and limit
    return activities
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        .slice(0, limit)
}

// ============================================================================
// CRITICAL ALERTS
// ============================================================================

export function getCriticalAlerts(): CriticalAlert[] {
    const alerts: CriticalAlert[] = []
    const now = new Date()

    // Vehicles over 60 days in stock
    const stockActivo = mockVehicles.filter(v =>
        v.estado !== 'vendido' && v.estado !== 'baja'
    )
    const vehiculosEnRiesgo = stockActivo.filter(v => v.dias_en_stock > 60)

    if (vehiculosEnRiesgo.length > 0) {
        alerts.push({
            id: 'stock-aging',
            tipo: 'stock_aging',
            titulo: `${vehiculosEnRiesgo.length} vehículos con más de 60 días`,
            descripcion: vehiculosEnRiesgo.slice(0, 2)
                .map(v => `${v.marca} ${v.modelo}`)
                .join(', ') + (vehiculosEnRiesgo.length > 2 ? '...' : ''),
            severidad: vehiculosEnRiesgo.length > 3 ? 'danger' : 'warning',
            enlace: '/inventario?filter=aging',
            fecha: now.toISOString()
        })
    }

    // Leads with pending actions
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    const pendingLeads = mockLeads.filter(l =>
        l.fecha_proxima_accion &&
        new Date(l.fecha_proxima_accion) <= today &&
        l.estado !== 'vendido' &&
        l.estado !== 'perdido'
    )

    if (pendingLeads.length > 0) {
        alerts.push({
            id: 'leads-pending',
            tipo: 'lead_pending',
            titulo: `${pendingLeads.length} leads requieren acción`,
            descripcion: pendingLeads.slice(0, 2)
                .map(l => l.cliente?.nombre || 'Cliente')
                .join(', '),
            severidad: pendingLeads.length > 2 ? 'danger' : 'warning',
            enlace: '/crm?filter=pending',
            fecha: now.toISOString()
        })
    }

    // High margin opportunity (vehicles with margen_bruto > 8000)
    const highMargin = stockActivo.filter(v => v.margen_bruto > 8000)
    if (highMargin.length > 0) {
        alerts.push({
            id: 'high-margin',
            tipo: 'high_margin',
            titulo: `${highMargin.length} vehículos con alto margen`,
            descripcion: `Potencial: ${highMargin.reduce((s, v) => s + v.margen_bruto, 0).toLocaleString('es-ES')}€`,
            severidad: 'info',
            enlace: '/inventario?filter=high-margin',
            fecha: now.toISOString()
        })
    }

    return alerts
}

// ============================================================================
// CHART DATA
// ============================================================================

export function getSalesChartData() {
    return mockSalesChartData
}

export function getLeadsChartData() {
    const last30Days: { date: string; leads: number; convertidos: number }[] = []
    const now = new Date()

    for (let i = 29; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })

        last30Days.push({
            date: dateStr,
            leads: Math.floor(Math.random() * 5) + 2,
            convertidos: Math.floor(Math.random() * 2)
        })
    }

    return last30Days
}

// ============================================================================
// MAIN DASHBOARD DATA AGGREGATOR
// ============================================================================

export function getDashboardData(): DashboardData {
    return {
        stock: getStockMetrics(),
        sales: getSalesMetrics(),
        leads: getLeadMetrics(),
        performance: getPerformanceMetrics(),
        sellers: getSellerPerformance(),
        brands: getBrandAnalytics(),
        activity: getRecentActivity(),
        alerts: getCriticalAlerts(),
        chartData: {
            salesOverTime: getSalesChartData(),
            leadsOverTime: getLeadsChartData()
        }
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function formatTrend(value: number): { text: string; isPositive: boolean } {
    const sign = value >= 0 ? '+' : ''
    return {
        text: `${sign}${value.toFixed(1)}%`,
        isPositive: value >= 0
    }
}

export function getStatusLabel(estado: string): string {
    const labels: Record<string, string> = {
        disponible: 'Disponible',
        reservado: 'Reservado',
        vendido: 'Vendido',
        taller: 'En Taller',
        baja: 'Baja'
    }
    return labels[estado] || estado
}
