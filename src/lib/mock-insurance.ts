import { PolizaSeguro, InsuranceState } from '@/types'

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

// Mock insurance policies (linked to some vehicles from mock-data)
export const mockInsurancePolicies: PolizaSeguro[] = [
    {
        id: 'ins-001',
        vehiculoId: 'v1', // BMW Serie 3
        companiaAseguradora: 'AXA',
        numeroPoliza: 'POL-2024-001234',
        tipoPoliza: 'todo_riesgo_franquicia',
        fechaAlta: '2024-01-15',
        fechaVencimiento: '2025-01-15',
        primaAnual: 450,
        franquicia: 300,
        tomadorNombre: 'MidCar Concesionario S.L.',
        tomadorNif: 'B12345678',
        coberturas: {
            rcObligatoria: true,
            rcVoluntaria: true,
            defensaJuridica: true,
            asistenciaViaje: true,
            robo: true,
            incendio: true,
            lunas: true,
            daniosPropios: true,
            ocupantes: true,
            vehiculoSustitucion: false,
        },
        documentos: {
            polizaPdf: '/docs/poliza-001.pdf',
        },
        estado: 'asegurado',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
    },
    {
        id: 'ins-002',
        vehiculoId: 'v2', // Mercedes Clase A
        companiaAseguradora: 'Mapfre',
        numeroPoliza: 'POL-2024-005678',
        tipoPoliza: 'terceros_ampliado',
        fechaAlta: '2024-03-20',
        fechaVencimiento: '2025-03-20',
        primaAnual: 320,
        tomadorNombre: 'MidCar Concesionario S.L.',
        tomadorNif: 'B12345678',
        coberturas: {
            rcObligatoria: true,
            rcVoluntaria: true,
            defensaJuridica: true,
            asistenciaViaje: true,
            robo: false,
            incendio: false,
            lunas: true,
            daniosPropios: false,
            ocupantes: false,
            vehiculoSustitucion: false,
        },
        documentos: {},
        estado: 'asegurado',
        createdAt: '2024-03-20T10:00:00Z',
        updatedAt: '2024-03-20T10:00:00Z',
    },
    {
        id: 'ins-003',
        vehiculoId: 'v3', // Audi A4
        companiaAseguradora: 'AXA',
        numeroPoliza: 'POL-2024-009012',
        tipoPoliza: 'todo_riesgo_sin_franquicia',
        fechaAlta: '2024-06-01',
        fechaVencimiento: '2025-01-10', // About to expire soon
        primaAnual: 580,
        tomadorNombre: 'MidCar Concesionario S.L.',
        tomadorNif: 'B12345678',
        coberturas: {
            rcObligatoria: true,
            rcVoluntaria: true,
            defensaJuridica: true,
            asistenciaViaje: true,
            robo: true,
            incendio: true,
            lunas: true,
            daniosPropios: true,
            ocupantes: true,
            vehiculoSustitucion: true,
        },
        documentos: {
            polizaPdf: '/docs/poliza-003.pdf',
            reciboPdf: '/docs/recibo-003.pdf',
        },
        estado: 'por_vencer',
        createdAt: '2024-06-01T10:00:00Z',
        updatedAt: '2024-06-01T10:00:00Z',
    },
    {
        id: 'ins-004',
        vehiculoId: 'v4', // Volkswagen Golf
        companiaAseguradora: 'Allianz',
        numeroPoliza: 'POL-2023-003456',
        tipoPoliza: 'terceros_basico',
        fechaAlta: '2023-11-15',
        fechaVencimiento: '2024-11-15', // Expired
        primaAnual: 250,
        tomadorNombre: 'MidCar Concesionario S.L.',
        tomadorNif: 'B12345678',
        coberturas: {
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
        },
        documentos: {},
        estado: 'vencido',
        createdAt: '2023-11-15T10:00:00Z',
        updatedAt: '2023-11-15T10:00:00Z',
    },
    {
        id: 'ins-005',
        vehiculoId: 'v6', // Toyota RAV4
        companiaAseguradora: 'Generali',
        numeroPoliza: 'POL-2024-007890',
        tipoPoliza: 'todo_riesgo_franquicia',
        fechaAlta: '2024-08-10',
        fechaVencimiento: '2025-08-10',
        primaAnual: 420,
        franquicia: 250,
        tomadorNombre: 'MidCar Concesionario S.L.',
        tomadorNif: 'B12345678',
        coberturas: {
            rcObligatoria: true,
            rcVoluntaria: true,
            defensaJuridica: true,
            asistenciaViaje: true,
            robo: true,
            incendio: true,
            lunas: true,
            daniosPropios: true,
            ocupantes: false,
            vehiculoSustitucion: false,
        },
        documentos: {
            polizaPdf: '/docs/poliza-005.pdf',
        },
        estado: 'asegurado',
        createdAt: '2024-08-10T10:00:00Z',
        updatedAt: '2024-08-10T10:00:00Z',
    },
]

// Get policy by vehicle ID
export function getPolicyByVehicleId(vehiculoId: string): PolizaSeguro | undefined {
    return mockInsurancePolicies.find(p => p.vehiculoId === vehiculoId)
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
