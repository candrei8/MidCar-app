/**
 * Mock Data - DEPRECATED
 *
 * Este archivo ha sido limpiado. Todos los datos ahora se obtienen de Supabase.
 * Las exportaciones vacías se mantienen temporalmente por compatibilidad mientras
 * se migran todos los componentes a usar el servicio de Supabase.
 *
 * @deprecated Use supabase-service.ts instead
 */

import type { Vehicle, Lead, Client, User, KPI, Contact } from '@/types'

// Empty arrays - no more mock data
export const mockUsers: User[] = []
export const mockVehicles: Vehicle[] = []
export const mockClients: Client[] = []
export const mockLeads: Lead[] = []
export const mockContacts: Contact[] = []

// Empty KPIs - will be calculated from real data
export const mockKPIs: KPI[] = []

// Empty chart data - will be generated from real data
export const mockLeadsChartData: { date: string; leads: number }[] = []
export const mockSalesChartData: { date: string; ventas: number; ingresos: number }[] = []

// Empty chatbot stats
export const mockChatbotStats = {
    conversacionesHoy: 0,
    conversacionesMes: 0,
    leadsGenerados: 0,
    tasaConversion: 0,
    tiempoPromedioMinutos: 0,
    satisfaccion: 0,
}

// Empty funnel data
export const mockFunnelData: { etapa: string; valor: number; porcentaje: number }[] = []
