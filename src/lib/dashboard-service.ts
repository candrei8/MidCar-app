/**
 * Dashboard Service
 *
 * Centralized service for calculating all dashboard metrics from real data.
 * This service now returns empty/zero values since mock data has been removed.
 * Statistics are calculated dynamically from Supabase data in useFilteredData hook.
 */

import type { Vehicle, Lead, User } from '@/types'

// ============================================================================
// TYPES
// ============================================================================

export interface DashboardData {
    // Stock metrics
    stock: {
        total: number
        disponible: number
        reservado: number
        vendido: number
        enTaller: number
        valorStock: number
        inversionStock: number
        margenPotencial: number
        margenPorcentaje: number
    }
    // Sales metrics
    sales: {
        vehiculosVendidos: number
        ingresosReales: number
        margenBrutoReal: number
        margenPorcentaje: number
        ticketMedio: number
        ventasUltimos30Dias: number
        tendenciaMensual: number
    }
    // Performance metrics
    performance: {
        diasPromedioStock: number
        vehiculosEnRiesgo: Vehicle[]
        vehiculosNuevos7Dias: number
        rotacionMensual: number
    }
    // Brands data
    brands: {
        marca: string
        cantidad: number
        porcentaje: number
    }[]
    // Activity feed
    activity: {
        id: string
        titulo: string
        descripcion: string
        fecha: string
        icono: string
        color: string
        enlace?: string
    }[]
    // Critical alerts
    alerts: {
        id: string
        tipo: string
        severidad: 'danger' | 'warning' | 'info'
        titulo: string
        descripcion: string
        enlace: string
    }[]
    // Chart data
    chartData: {
        salesOverTime: { date: string; ingresos: number; ventas: number }[]
        leadsOverTime: { date: string; leads: number }[]
    }
    // Legacy fields for compatibility
    kpis: {
        vehiculosStock: { valor: number; subtitulo: string; cambio: number }
        valorStock: { valor: number; subtitulo: string; cambio: number }
        leadsActivos: { valor: number; subtitulo: string; cambio: number }
        ventasMes: { valor: number; subtitulo: string; cambio: number }
        tasaConversion: { valor: number; subtitulo: string; cambio: number }
        margenMedio: { valor: number; subtitulo: string; cambio: number }
    }
    charts: {
        leadsEvolucion: { date: string; leads: number }[]
        ventasEvolucion: { date: string; ventas: number; ingresos: number }[]
        funnelVentas: { etapa: string; valor: number; porcentaje: number }[]
    }
    rankings: {
        vendedores: {
            id: string
            nombre: string
            avatar?: string
            ventas: number
            ingresos: number
            conversion: number
        }[]
    }
    vehiculosDestacados: Vehicle[]
    alertas: {
        tipo: 'warning' | 'info' | 'success' | 'error'
        titulo: string
        descripcion: string
    }[]
}

// ============================================================================
// EMPTY DASHBOARD DATA - Returns zeros since mock data is removed
// ============================================================================

export function getDashboardData(): DashboardData {
    return {
        // New structure
        stock: {
            total: 0,
            disponible: 0,
            reservado: 0,
            vendido: 0,
            enTaller: 0,
            valorStock: 0,
            inversionStock: 0,
            margenPotencial: 0,
            margenPorcentaje: 0,
        },
        sales: {
            vehiculosVendidos: 0,
            ingresosReales: 0,
            margenBrutoReal: 0,
            margenPorcentaje: 0,
            ticketMedio: 0,
            ventasUltimos30Dias: 0,
            tendenciaMensual: 0,
        },
        performance: {
            diasPromedioStock: 0,
            vehiculosEnRiesgo: [],
            vehiculosNuevos7Dias: 0,
            rotacionMensual: 0,
        },
        brands: [],
        activity: [],
        alerts: [],
        chartData: {
            salesOverTime: [],
            leadsOverTime: [],
        },
        // Legacy structure
        kpis: {
            vehiculosStock: { valor: 0, subtitulo: 'En stock activo', cambio: 0 },
            valorStock: { valor: 0, subtitulo: 'Valor de mercado', cambio: 0 },
            leadsActivos: { valor: 0, subtitulo: 'En proceso', cambio: 0 },
            ventasMes: { valor: 0, subtitulo: 'Este mes', cambio: 0 },
            tasaConversion: { valor: 0, subtitulo: 'Media últimos 30 días', cambio: 0 },
            margenMedio: { valor: 0, subtitulo: 'Por vehículo vendido', cambio: 0 },
        },
        charts: {
            leadsEvolucion: [],
            ventasEvolucion: [],
            funnelVentas: [],
        },
        rankings: {
            vendedores: [],
        },
        vehiculosDestacados: [],
        alertas: [],
    }
}


// ============================================================================
// STATS HELPERS - Now return zeros
// ============================================================================

export function getVehicleStats() {
    return {
        total: 0,
        disponibles: 0,
        reservados: 0,
        vendidos: 0,
        taller: 0,
        valorStock: 0,
        margenPotencial: 0,
    }
}

export function getLeadStats() {
    return {
        total: 0,
        nuevos: 0,
        enProceso: 0,
        vendidos: 0,
        perdidos: 0,
        tasaConversion: 0,
        valorPipeline: 0,
    }
}

export function getSalesStats() {
    return {
        ventasMes: 0,
        ingresosMes: 0,
        margenMedio: 0,
        diasPromedioVenta: 0,
    }
}

// ============================================================================
// CHATBOT STATS
// ============================================================================

export function getChatbotStats() {
    return {
        conversacionesHoy: 0,
        conversacionesMes: 0,
        leadsGenerados: 0,
        tasaConversion: 0,
        tiempoPromedioMinutos: 0,
        satisfaccion: 0,
    }
}

// ============================================================================
// CHART DATA - Empty arrays
// ============================================================================

export function getLeadsChartData() {
    return []
}

export function getSalesChartData() {
    return []
}

export function getFunnelData() {
    return []
}

// ============================================================================
// RANKINGS - Empty
// ============================================================================

export function getSellerRankings() {
    return []
}

// ============================================================================
// ALERTS - Empty
// ============================================================================

export function getAlerts() {
    return []
}

// ============================================================================
// RECENT LEADS - Empty
// ============================================================================

export function getRecentLeads() {
    return []
}

// ============================================================================
// VEHICLES BY STATUS - Empty
// ============================================================================

export function getVehiclesByStatus() {
    return {
        disponible: [],
        reservado: [],
        vendido: [],
        taller: [],
    }
}
