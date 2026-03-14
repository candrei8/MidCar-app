/**
 * Sales Service
 * 
 * Handles sale transactions, updates vehicle status, and maintains sales records.
 * In a real application, this would connect to a database/API.
 */

import type { Vehicle, Lead, Client } from '@/types'
import { SaleData } from '@/components/crm/SaleConfirmationModal'

export interface SaleRecord {
    id: string
    leadId: string
    vehicleId: string
    clienteId: string
    vendedorId: string

    // Pricing
    precioVentaOriginal: number
    precioVentaFinal: number
    descuento: number
    gastosAdicionales: number

    // Cost & Margin
    costeVehiculo: number
    margenBruto: number
    margenPorcentaje: number

    // Payment
    formaPago: 'contado' | 'financiacion' | 'leasing' | 'renting'
    entradaInicial?: number
    cuotasMensuales?: number
    importeFinanciado?: number
    entidadFinanciera?: string

    // Delivery
    fechaVenta: string
    fechaEntrega: string
    garantiaMeses: number
    garantiaExtendida: boolean

    // Metadata
    notas?: string
    createdAt: string
    updatedAt: string
}

// In-memory sales store (would be replaced by database in production)
let salesRecords: SaleRecord[] = []

// Event listeners for sales updates
type SaleEventListener = (sale: SaleRecord) => void
const saleListeners: SaleEventListener[] = []

/**
 * Subscribe to sale events
 */
export function onSaleCreated(listener: SaleEventListener) {
    saleListeners.push(listener)
    return () => {
        const index = saleListeners.indexOf(listener)
        if (index > -1) saleListeners.splice(index, 1)
    }
}

/**
 * Create a new sale record
 */
export async function createSale(
    saleData: SaleData,
    vehicle: Vehicle,
    lead: Lead,
    vendedorId: string = 'user-001'
): Promise<SaleRecord> {
    // Calculate costs and margin
    const costeVehiculo = vehicle.precio_compra + vehicle.gastos_compra + vehicle.coste_reparaciones
    const margenBruto = saleData.precioVentaFinal - costeVehiculo
    const margenPorcentaje = saleData.precioVentaFinal > 0
        ? (margenBruto / saleData.precioVentaFinal) * 100
        : 0

    const saleRecord: SaleRecord = {
        id: `sale-${Date.now()}`,
        leadId: saleData.leadId,
        vehicleId: saleData.vehicleId,
        clienteId: saleData.clienteId,
        vendedorId,

        precioVentaOriginal: vehicle.precio_venta,
        precioVentaFinal: saleData.precioVentaFinal,
        descuento: saleData.descuento,
        gastosAdicionales: saleData.gastosAdicionales,

        costeVehiculo,
        margenBruto,
        margenPorcentaje,

        formaPago: saleData.formaPago,
        entradaInicial: saleData.entradaInicial,
        cuotasMensuales: saleData.cuotasMensuales,
        importeFinanciado: saleData.formaPago !== 'contado'
            ? saleData.precioVentaFinal - (saleData.entradaInicial || 0)
            : undefined,
        entidadFinanciera: saleData.entidadFinanciera,

        fechaVenta: new Date().toISOString(),
        fechaEntrega: saleData.fechaEntrega,
        garantiaMeses: saleData.garantiaMeses,
        garantiaExtendida: saleData.garantiaExtendida,

        notas: saleData.notas,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }

    // Add to store
    salesRecords.push(saleRecord)

    // Notify listeners
    saleListeners.forEach(listener => listener(saleRecord))

    // Log for debugging
    console.log('✅ Sale created:', saleRecord)

    return saleRecord
}

/**
 * Get all sales
 */
export function getAllSales(): SaleRecord[] {
    return [...salesRecords]
}

/**
 * Get sales for a specific period
 */
export function getSalesByPeriod(startDate: Date, endDate: Date): SaleRecord[] {
    return salesRecords.filter(sale => {
        const saleDate = new Date(sale.fechaVenta)
        return saleDate >= startDate && saleDate <= endDate
    })
}

/**
 * Get sales statistics
 */
export function getSalesStats() {
    const totalSales = salesRecords.length
    const totalRevenue = salesRecords.reduce((sum, s) => sum + s.precioVentaFinal, 0)
    const totalMargin = salesRecords.reduce((sum, s) => sum + s.margenBruto, 0)
    const avgMarginPercent = totalSales > 0
        ? salesRecords.reduce((sum, s) => sum + s.margenPorcentaje, 0) / totalSales
        : 0
    const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0

    // Payment method breakdown
    const byPaymentMethod = {
        contado: salesRecords.filter(s => s.formaPago === 'contado').length,
        financiacion: salesRecords.filter(s => s.formaPago === 'financiacion').length,
        leasing: salesRecords.filter(s => s.formaPago === 'leasing').length,
        renting: salesRecords.filter(s => s.formaPago === 'renting').length,
    }

    return {
        totalSales,
        totalRevenue,
        totalMargin,
        avgMarginPercent,
        avgTicket,
        byPaymentMethod,
    }
}

/**
 * Get sale by ID
 */
export function getSaleById(id: string): SaleRecord | undefined {
    return salesRecords.find(s => s.id === id)
}

/**
 * Get sales by vehicle ID
 */
export function getSaleByVehicleId(vehicleId: string): SaleRecord | undefined {
    return salesRecords.find(s => s.vehicleId === vehicleId)
}

/**
 * Get sales by seller ID
 */
export function getSalesBySellerId(vendedorId: string): SaleRecord[] {
    return salesRecords.filter(s => s.vendedorId === vendedorId)
}

/**
 * Format sale for display
 */
export function formatSaleForDisplay(sale: SaleRecord, vehicle?: Vehicle, client?: Client) {
    return {
        ...sale,
        vehicleDisplay: vehicle ? `${vehicle.marca} ${vehicle.modelo}` : 'N/A',
        clientDisplay: client ? `${client.nombre} ${client.apellidos}` : 'N/A',
        formaPagoDisplay: {
            contado: 'Contado',
            financiacion: 'Financiación',
            leasing: 'Leasing',
            renting: 'Renting',
        }[sale.formaPago],
    }
}
