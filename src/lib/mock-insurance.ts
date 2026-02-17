/**
 * Insurance Service - DEPRECATED MOCK DATA REMOVED
 *
 * All insurance data now comes from Supabase polizas_seguro table.
 * This file only contains helper functions.
 *
 * @deprecated Mock data removed. Use Supabase service instead.
 */

import { PolizaSeguro, InsuranceState } from '@/types'

// Empty array - no more mock data. All data comes from Supabase.
export const mockInsurancePolicies: PolizaSeguro[] = []

// Get policy by vehicle ID - Now returns undefined, use Supabase query instead
export function getPolicyByVehicleId(vehiculoId: string): PolizaSeguro | undefined {
    return undefined
}

// Helper to calculate insurance state based on dates
export function calculateInsuranceState(fechaVencimiento: string): InsuranceState {
    const today = new Date()
    const vencimiento = new Date(fechaVencimiento)
    const diffDays = Math.ceil((vencimiento.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'vencido'
    if (diffDays <= 30) return 'por_vencer'
    return 'asegurado'
}

// Helper to get days remaining
export function getDaysRemaining(fechaVencimiento: string): number {
    const today = new Date()
    const vencimiento = new Date(fechaVencimiento)
    return Math.ceil((vencimiento.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

// Default coverages for new policy
export const defaultCoverages = {
    rcObligatoria: true,
    rcVoluntaria: false,
    defensaJuridica: false,
    asistenciaViaje: false,
    robo: false,
    incendio: false,
    lunas: false,
    daniosPropios: false,
    ocupantes: false,
    vehiculoSustitucion: false,
}

// Coverage labels
export const COVERAGE_LABELS: Record<keyof typeof defaultCoverages, string> = {
    rcObligatoria: 'Responsabilidad Civil Obligatoria',
    rcVoluntaria: 'Responsabilidad Civil Voluntaria',
    defensaJuridica: 'Defensa Jurídica',
    asistenciaViaje: 'Asistencia en Viaje',
    robo: 'Robo',
    incendio: 'Incendio',
    lunas: 'Lunas',
    daniosPropios: 'Daños Propios',
    ocupantes: 'Ocupantes',
    vehiculoSustitucion: 'Vehículo de Sustitución',
}
