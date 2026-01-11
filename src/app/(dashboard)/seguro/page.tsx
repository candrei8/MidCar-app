"use client"

import { useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    MoreHorizontal,
    Search,
    ShieldCheck,
    Clock,
    ShieldX,
} from "lucide-react"
import { mockInsurancePolicies, getDaysRemaining, calculateInsuranceState } from "@/lib/mock-insurance"
import { useFilteredData } from "@/hooks/useFilteredData"
import { PolizaSeguro, Vehicle, InsuranceState, INSURANCE_STATE_CONFIG } from "@/types"
import { cn, formatCurrency, formatDate } from "@/lib/utils"
import { parseInsuranceFile, matchPoliciesWithVehicles, normalizeMatricula } from "@/lib/insuranceFileParser"
import { ImportPreviewModal, ImportResult, ParsedPolicy, MatchedPolicy } from "@/components/insurance/ImportPreviewModal"
import { InsurancePolicyModal } from "@/components/insurance/InsurancePolicyModal"
import { InsuranceDetailPanel } from "@/components/insurance/InsuranceDetailPanel"
import { defaultCoverages } from "@/lib/mock-insurance"
import { useDropzone } from "react-dropzone"

// State for drag & drop
interface ParseError {
    message: string
    type: 'warning' | 'error'
}

type FilterType = 'all' | 'insured' | 'uninsured' | 'expiring' | 'expired'

// Mapeo de colores para alertas (Tailwind no soporta clases dinámicas)
const ALERT_COLORS: Record<string, { border: string; bg: string; bgIcon: string; text: string; bar: string }> = {
    red: {
        border: 'border-red-100 dark:border-red-900/30',
        bg: 'bg-red-50',
        bgIcon: 'bg-red-100 dark:bg-red-900/40',
        text: 'text-red-600 dark:text-red-400',
        bar: 'bg-red-500'
    },
    orange: {
        border: 'border-orange-100 dark:border-orange-900/30',
        bg: 'bg-orange-50',
        bgIcon: 'bg-orange-100 dark:bg-orange-900/40',
        text: 'text-orange-600 dark:text-orange-400',
        bar: 'bg-orange-500'
    },
    yellow: {
        border: 'border-yellow-100 dark:border-yellow-900/30',
        bg: 'bg-yellow-50',
        bgIcon: 'bg-yellow-100 dark:bg-yellow-900/40',
        text: 'text-yellow-600 dark:text-yellow-400',
        bar: 'bg-yellow-500'
    },
    green: {
        border: 'border-green-100 dark:border-green-900/30',
        bg: 'bg-green-50',
        bgIcon: 'bg-green-100 dark:bg-green-900/40',
        text: 'text-green-600 dark:text-green-400',
        bar: 'bg-green-500'
    }
}

export default function SeguroPage() {
    // Obtener vehículos filtrados por vista (Mi Vista / Visión Completa)
    const { vehicles: filteredVehicles, isFullView } = useFilteredData()

    // State - Cargar pólizas
    const [policies, setPolicies] = useState<PolizaSeguro[]>(mockInsurancePolicies)
    const [isLoading, setIsLoading] = useState(false)
    const [showImportPreview, setShowImportPreview] = useState(false)
    const [importResult, setImportResult] = useState<ImportResult | null>(null)
    const [isImporting, setIsImporting] = useState(false)
    const [parseErrors, setParseErrors] = useState<ParseError[]>([])
    const [isDragActive, setIsDragActive] = useState(false)

    // View state
    const [viewMode, setViewMode] = useState<'dashboard' | 'list'>('dashboard')
    const [searchQuery, setSearchQuery] = useState("")
    const [filter, setFilter] = useState<FilterType>('all')

    // Modal state
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
    const [selectedPolicy, setSelectedPolicy] = useState<PolizaSeguro | null>(null)
    const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false)
    const [isDetailOpen, setIsDetailOpen] = useState(false)

    // Get policy for a vehicle
    const getPolicyForVehicle = useCallback((vehicleId: string) => {
        return policies.find(p => p.vehiculoId === vehicleId)
    }, [policies])

    // Calculate state for each policy
    const getPolicyState = useCallback((policy: PolizaSeguro | undefined): InsuranceState => {
        if (!policy) return 'sin_seguro'
        return calculateInsuranceState(policy.fechaVencimiento)
    }, [])

    // Comparison data with policies (usando vehículos filtrados)
    const comparisonData = useMemo(() => {
        return filteredVehicles
            .filter(v => v.estado !== 'vendido')
            .map(vehicle => {
                const policy = getPolicyForVehicle(vehicle.id)
                const state = getPolicyState(policy)
                return {
                    vehicle,
                    policy,
                    state,
                    daysRemaining: policy ? getDaysRemaining(policy.fechaVencimiento) : null,
                }
            })
    }, [getPolicyForVehicle, getPolicyState])

    // Filtered Data for Table
    const filteredData = useMemo(() => {
        return comparisonData
            .filter(item => {
                if (filter === 'insured') return item.state === 'asegurado'
                if (filter === 'uninsured') return item.state === 'sin_seguro'
                if (filter === 'expiring') return item.state === 'por_vencer'
                if (filter === 'expired') return item.state === 'vencido'
                return true
            })
            .filter(item => {
                if (!searchQuery) return true
                const query = searchQuery.toLowerCase()
                return (
                    item.vehicle.marca.toLowerCase().includes(query) ||
                    item.vehicle.modelo.toLowerCase().includes(query) ||
                    item.vehicle.matricula.toLowerCase().includes(query)
                )
            })
    }, [comparisonData, filter, searchQuery])

    // Stats
    const stats = useMemo(() => ({
        total: comparisonData.length,
        insured: comparisonData.filter(d => d.state === 'asegurado').length,
        expiring: comparisonData.filter(d => d.state === 'por_vencer').length,
        expired: comparisonData.filter(d => d.state === 'vencido').length,
        uninsured: comparisonData.filter(d => d.state === 'sin_seguro').length,
        soldWithInsurance: 0
    }), [comparisonData])

    // Alerts logic
    const alerts = useMemo(() => {
        const list = []
        if (stats.uninsured > 0) {
            list.push({ type: 'critical', count: stats.uninsured, title: `${stats.uninsured} Vehículos sin Seguro`, subtitle: 'Riesgo alto - Stock activo', icon: 'no_crash', color: 'red' })
        }
        if (stats.soldWithInsurance > 0) {
            list.push({ type: 'warning', count: stats.soldWithInsurance, title: `${stats.soldWithInsurance} Pólizas en Vendidos`, subtitle: 'Gasto innecesario detectado', icon: 'money_off', color: 'orange' })
        }
        if (stats.expiring > 0) {
            list.push({ type: 'attention', count: stats.expiring, title: `${stats.expiring} Próximas a Vencer`, subtitle: 'Vencen en < 30 días', icon: 'hourglass_bottom', color: 'yellow' })
        }
        return list
    }, [stats])

    // Discrepancy List (Issues)
    const discrepancies = useMemo(() => {
        return comparisonData
            .filter(d => d.state === 'sin_seguro' || d.state === 'por_vencer' || d.state === 'vencido')
            .sort((a, b) => {
                const score = (s: InsuranceState) => s === 'sin_seguro' ? 3 : s === 'vencido' ? 2 : 1
                return score(b.state) - score(a.state)
            })
    }, [comparisonData])


    // Enhanced File Upload Handler with robust parsing
    const processFile = useCallback(async (file: File) => {
        setIsLoading(true)
        setParseErrors([])

        try {
            // Use the new robust parser
            const parseResult = await parseInsuranceFile(file)

            // Show any parsing errors/warnings
            if (parseResult.errors.length > 0) {
                setParseErrors(parseResult.errors.map(e => ({
                    message: e,
                    type: parseResult.success ? 'warning' : 'error'
                })))
            }

            if (!parseResult.success || parseResult.policies.length === 0) {
                setIsLoading(false)
                return
            }

            // Match policies with vehicles
            const matchResult = matchPoliciesWithVehicles(parseResult.policies)

            setImportResult({
                totalPolicies: parseResult.policies.length,
                matched: matchResult.matched,
                unmatched: matchResult.unmatched,
                vehiclesWithoutPolicy: matchResult.vehiclesWithoutPolicy
            })
            setShowImportPreview(true)

        } catch (error) {
            console.error('Error processing file:', error)
            setParseErrors([{
                message: `Error procesando archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                type: 'error'
            }])
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Handle file input change
    const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            await processFile(file)
        }
    }, [processFile])

    // Drag & Drop handlers
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (file) {
            await processFile(file)
        }
    }, [processFile])

    const { getRootProps, getInputProps, open: openFilePicker } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'text/csv': ['.csv'],
        },
        maxFiles: 1,
        noClick: false,
        noKeyboard: false,
        onDragEnter: () => setIsDragActive(true),
        onDragLeave: () => setIsDragActive(false),
        onDropAccepted: () => setIsDragActive(false),
    })

    // Confirm import - Creates real policies and updates state
    const handleConfirmImport = async () => {
        if (!importResult) return
        setIsImporting(true)

        try {
            // Create new policies from matched data
            const newPolicies: PolizaSeguro[] = importResult.matched.map(match => ({
                id: `ins-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                vehiculoId: match.vehicleId,
                companiaAseguradora: 'AXA', // Default, could be from file
                numeroPoliza: match.policy.numeroPoliza,
                tipoPoliza: (match.policy.tipoPoliza?.toLowerCase().includes('terceros') ? 'terceros_basico' : 'todo_riesgo_franquicia') as any,
                fechaAlta: match.policy.fechaAlta || new Date().toISOString().split('T')[0],
                fechaVencimiento: match.policy.fechaVencimiento || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                primaAnual: match.policy.prima || 350,
                franquicia: 300,
                tomadorNombre: 'MidCar Concesionario S.L.',
                tomadorNif: 'B12345678',
                coberturas: defaultCoverages,
                documentos: {},
            }))

            // Update policies state - replace existing for same vehicle or add new
            setPolicies(prev => {
                const updatedVehicleIds = new Set(newPolicies.map(p => p.vehiculoId))
                const filtered = prev.filter(p => !updatedVehicleIds.has(p.vehiculoId))
                return [...filtered, ...newPolicies]
            })

            // Clear modal and show success
            setShowImportPreview(false)
            setImportResult(null)
            setParseErrors([{ message: `✅ ${newPolicies.length} pólizas importadas correctamente`, type: 'warning' }])

            // Clear success message after 3 seconds
            setTimeout(() => setParseErrors([]), 3000)

        } catch (error) {
            setParseErrors([{ message: 'Error al guardar las pólizas', type: 'error' }])
        } finally {
            setIsImporting(false)
        }
    }

    // Modal Handlers
    const handleAddPolicy = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle)
        setSelectedPolicy(null)
        setIsPolicyModalOpen(true)
    }

    const handleEditPolicy = (vehicle: Vehicle, policy: PolizaSeguro) => {
        setSelectedVehicle(vehicle)
        setSelectedPolicy(policy)
        setIsPolicyModalOpen(true)
    }

    const handleViewPolicy = (vehicle: Vehicle, policy: PolizaSeguro) => {
        if (!policy) return
        setSelectedVehicle(vehicle)
        setSelectedPolicy(policy)
        setIsDetailOpen(true)
    }

    const handleDeletePolicy = (policyId: string) => {
        if (confirm('¿Estás seguro de que quieres eliminar esta póliza?')) {
            setPolicies(prev => prev.filter(p => p.id !== policyId))
            setIsDetailOpen(false)
        }
    }

    const handleSavePolicy = (policyData: Partial<PolizaSeguro>) => {
        const existingIndex = policies.findIndex(p => p.id === policyData.id)
        if (existingIndex >= 0) {
            setPolicies(prev => prev.map((p, i) => i === existingIndex ? { ...p, ...policyData } as PolizaSeguro : p))
        } else {
            setPolicies(prev => [...prev, policyData as PolizaSeguro])
        }
    }

    // State icon component
    const StateIcon = ({ state }: { state: InsuranceState }) => {
        const config = INSURANCE_STATE_CONFIG[state]
        switch (state) {
            case 'asegurado': return <ShieldCheck className="h-4 w-4" style={{ color: config.color }} />
            case 'por_vencer': return <Clock className="h-4 w-4" style={{ color: config.color }} />
            case 'vencido': return <ShieldX className="h-4 w-4" style={{ color: config.color }} />
            default: return <ShieldX className="h-4 w-4" style={{ color: config.color }} />
        }
    }

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-[#111318] dark:text-white overflow-x-hidden min-h-screen">
            <div className="relative flex flex-col h-full min-h-screen w-full md:max-w-7xl md:mx-auto bg-white dark:bg-[#1A202C] shadow-xl md:shadow-none overflow-hidden md:bg-transparent md:dark:bg-transparent">

                {/* Header */}
                <div className="flex items-center bg-white dark:bg-[#1A202C] p-4 pb-2 justify-between sticky md:relative top-0 z-50 border-b border-gray-100 dark:border-gray-800 md:bg-transparent md:dark:bg-transparent md:border-b-0 md:mb-6">
                    <h2 className="text-[#111318] dark:text-white text-xl md:text-3xl font-bold leading-tight tracking-[-0.015em] flex-1">Seguros</h2>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto pb-24 md:pb-6 no-scrollbar md:grid md:grid-cols-12 md:gap-6 md:px-6">

                    {/* LEFT COLUMN (Desktop) / TOP (Mobile) */}
                    <div className="flex flex-col md:col-span-4 lg:col-span-3 space-y-6">

                        {/* Stats Section */}
                        <div className="grid grid-cols-3 md:grid-cols-1 gap-3 p-4 pt-2 md:p-0">
                            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 rounded-xl p-4 bg-[#f0f2f4] dark:bg-gray-800 md:bg-white shadow-sm border border-transparent dark:border-gray-700 cursor-pointer hover:border-gray-300 transition-colors" onClick={() => setFilter('all')}>
                                <span className="material-symbols-outlined hidden md:block text-gray-400">directions_car</span>
                                <div>
                                    <p className="text-[#616f89] dark:text-gray-400 text-xs font-medium uppercase tracking-wider">Stock Total</p>
                                    <p className="text-[#111318] dark:text-white text-2xl font-bold leading-tight">{stats.total}</p>
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 rounded-xl p-4 bg-[#f0f2f4] dark:bg-gray-800 md:bg-white shadow-sm border border-transparent dark:border-gray-700 cursor-pointer hover:border-gray-300 transition-colors" onClick={() => setFilter('insured')}>
                                <span className="material-symbols-outlined hidden md:block text-primary">verified_user</span>
                                <div>
                                    <p className="text-[#616f89] dark:text-gray-400 text-xs font-medium uppercase tracking-wider">Asegurados</p>
                                    <p className="text-primary text-2xl font-bold leading-tight">{stats.insured}</p>
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 rounded-xl p-4 bg-red-50 dark:bg-red-900/20 md:bg-white md:border-red-100 shadow-sm border border-red-100 dark:border-red-900/30 cursor-pointer hover:border-red-300 transition-colors" onClick={() => setFilter('uninsured')}>
                                <span className="material-symbols-outlined hidden md:block text-red-500">warning</span>
                                <div>
                                    <p className="text-red-600 dark:text-red-400 text-xs font-medium uppercase tracking-wider">Diferencia</p>
                                    <p className="text-red-600 dark:text-red-400 text-2xl font-bold leading-tight">-{stats.uninsured}</p>
                                </div>
                            </div>
                        </div>

                        {/* Import Section with Drag & Drop */}
                        <div className="flex flex-col p-4 pb-0 md:p-0 space-y-3">
                            <div
                                {...getRootProps()}
                                className={cn(
                                    "group relative flex flex-col items-center gap-4 rounded-xl border-2 border-dashed px-6 py-8 transition-all cursor-pointer shadow-sm",
                                    isDragActive
                                        ? "border-primary bg-primary/5 scale-[1.02]"
                                        : "border-[#dbdfe6] dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 md:bg-white hover:border-primary/50",
                                    isLoading && "opacity-50 pointer-events-none"
                                )}
                            >
                                <input {...getInputProps()} />
                                <div className={cn(
                                    "h-12 w-12 rounded-full flex items-center justify-center mb-2 transition-all",
                                    isDragActive ? "bg-primary/20 scale-110" : "bg-primary/10",
                                    "text-primary"
                                )}>
                                    <span className="material-symbols-outlined text-3xl">
                                        {isLoading ? 'sync' : isDragActive ? 'download' : 'cloud_upload'}
                                    </span>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <p className="text-[#111318] dark:text-white text-base font-bold leading-tight text-center">
                                        {isLoading ? 'Procesando...' : isDragActive ? 'Suelta el archivo aquí' : 'Importar Pólizas'}
                                    </p>
                                    <p className="text-[#616f89] dark:text-gray-400 text-xs font-normal leading-normal text-center max-w-[240px]">
                                        {isDragActive ? 'Archivo Excel o CSV compatible' : 'Arrastra un archivo o haz clic para seleccionar'}
                                    </p>
                                </div>
                                {!isLoading && !isDragActive && (
                                    <div className="flex items-center justify-center overflow-hidden rounded-lg h-9 px-6 bg-primary text-white text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors w-full sm:w-auto">
                                        <span className="truncate">Seleccionar Archivo</span>
                                    </div>
                                )}
                                {isLoading && (
                                    <div className="flex items-center gap-2 text-primary">
                                        <span className="material-symbols-outlined animate-spin">sync</span>
                                        <span className="text-sm font-medium">Analizando archivo...</span>
                                    </div>
                                )}
                            </div>

                            {/* Parse Errors/Success Messages */}
                            {parseErrors.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    {parseErrors.map((error, idx) => (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "flex items-start gap-2 p-3 rounded-lg text-xs",
                                                error.type === 'error'
                                                    ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                                                    : "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300"
                                            )}
                                        >
                                            <span className="material-symbols-outlined text-sm shrink-0">
                                                {error.type === 'error' ? 'error' : 'info'}
                                            </span>
                                            <span>{error.message}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Supported formats hint */}
                            <div className="flex items-center justify-center gap-4 text-[10px] text-gray-400">
                                <span className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[12px]">table_chart</span>
                                    Excel (.xlsx, .xls)
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[12px]">csv</span>
                                    CSV
                                </span>
                            </div>
                        </div>

                        {alerts.length > 0 && (
                            <div className="flex flex-col gap-3 px-4 md:px-0 mt-4 md:mt-0">
                                <div className="flex items-center justify-between pb-2">
                                    <h3 className="text-[#111318] dark:text-white text-lg font-bold leading-tight">Alertas Activas</h3>
                                    <span className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100 text-xs font-bold px-2 py-1 rounded-full">{alerts.length}</span>
                                </div>
                                {alerts.map((alert, i) => {
                                    const colors = ALERT_COLORS[alert.color] || ALERT_COLORS.red
                                    return (
                                        <div key={i} className={cn(
                                            "flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm relative overflow-hidden group cursor-pointer hover:shadow-md transition-shadow border",
                                            colors.border
                                        )}>
                                            <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", colors.bar)}></div>
                                            <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", colors.bgIcon, colors.text)}>
                                                <span className="material-symbols-outlined">{alert.icon}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[#111318] dark:text-white text-base font-bold truncate">{alert.title}</p>
                                                <p className="text-[#616f89] dark:text-gray-400 text-sm truncate">{alert.subtitle}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN (Desktop) / BOTTOM (Mobile) */}
                    <div className="md:col-span-8 lg:col-span-9 flex flex-col md:h-full mt-6 md:mt-0">
                        {/* Desktop: Full Table Layout | Mobile: Default Discrepancy List */}
                        <div className="flex flex-col md:bg-white md:dark:bg-[#1A202C] md:rounded-xl md:shadow-sm md:border md:border-gray-100 md:dark:border-gray-800 md:h-full md:overflow-hidden">

                            {/* Toolbar (Desktop Only usually, but let's make it responsive) */}
                            <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-gray-800 gap-4">
                                <div>
                                    <h3 className="text-[#111318] dark:text-white text-lg font-bold leading-tight">
                                        {viewMode === 'dashboard' ? 'Detalle de Discrepancias' : 'Listado Completo'}
                                    </h3>
                                    <p className="text-xs text-gray-500 hidden md:block">Gestiona el estado de seguro de cada vehículo</p>
                                </div>
                                <div className="flex gap-2 w-full xs:w-auto">
                                    <div className="relative flex-1 xs:flex-none">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                        <input
                                            placeholder="Buscar matrícula..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="h-9 w-full xs:w-48 pl-8 pr-3 text-xs bg-gray-50 dark:bg-gray-800 border-none rounded-lg focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                    <button
                                        onClick={() => setViewMode(viewMode === 'dashboard' ? 'list' : 'dashboard')}
                                        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-blue-700 whitespace-nowrap"
                                    >
                                        {viewMode === 'dashboard' ? 'Ver Todo' : 'Ver Resumen'}
                                    </button>
                                </div>
                            </div>

                            {/* TABLE VIEW (Active when viewMode === 'list' OR on Desktop implicitly if wanted, but toggled for now) */}
                            {viewMode === 'list' ? (
                                <div className="flex-1 overflow-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent border-gray-100 dark:border-gray-800">
                                                <TableHead>Estado</TableHead>
                                                <TableHead>Vehículo</TableHead>
                                                <TableHead>Matrícula</TableHead>
                                                <TableHead>Póliza</TableHead>
                                                <TableHead>Vencimiento</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredData.map((item) => (
                                                <TableRow key={item.vehicle.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 border-gray-100 dark:border-gray-800 cursor-pointer" onClick={() => item.policy ? handleViewPolicy(item.vehicle, item.policy) : handleAddPolicy(item.vehicle)}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <StateIcon state={item.state} />
                                                            <span className="text-xs font-bold" style={{ color: INSURANCE_STATE_CONFIG[item.state].color }}>
                                                                {INSURANCE_STATE_CONFIG[item.state].label}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-12 rounded bg-cover bg-center bg-gray-100" style={{ backgroundImage: `url(${item.vehicle.imagen_principal})` }} />
                                                            <div>
                                                                <p className="font-bold text-xs text-gray-900 dark:text-white">{item.vehicle.marca} {item.vehicle.modelo}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs">{item.vehicle.matricula}</TableCell>
                                                    <TableCell className="text-xs text-gray-500">{item.policy?.numeroPoliza || '-'}</TableCell>
                                                    <TableCell className="text-xs">{item.policy ? formatDate(item.policy.fechaVencimiento) : '-'}</TableCell>
                                                    <TableCell>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                                                    <MoreHorizontal className="h-3.5 w-3.5 text-gray-500" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                {item.policy ? (
                                                                    <>
                                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewPolicy(item.vehicle, item.policy!) }}>Ver detalle</DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditPolicy(item.vehicle, item.policy!) }}>Editar</DropdownMenuItem>
                                                                        <DropdownMenuItem className="text-red-500" onClick={(e) => { e.stopPropagation(); handleDeletePolicy(item.policy!.id) }}>Eliminar</DropdownMenuItem>
                                                                    </>
                                                                ) : (
                                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleAddPolicy(item.vehicle) }}>Añadir seguro</DropdownMenuItem>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                /* DASHBOARD DISCREPANCY VIEW (Default) */
                                <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-800/50 overflow-y-auto md:flex-1">
                                    {discrepancies.length > 0 ? discrepancies.map((item) => (
                                        <div
                                            key={item.vehicle.id}
                                            className="flex gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group items-center"
                                            onClick={() => item.policy ? handleViewPolicy(item.vehicle, item.policy) : handleAddPolicy(item.vehicle)}
                                        >
                                            <div className="h-14 w-14 md:h-16 md:w-16 rounded-lg bg-gray-200 overflow-hidden shrink-0 relative">
                                                <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${item.vehicle.imagen_principal})` }}></div>
                                            </div>
                                            <div className="flex-1 flex flex-col justify-center min-w-0 gap-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-[#111318] dark:text-white font-bold text-sm md:text-base truncate">{item.vehicle.marca} {item.vehicle.modelo}</p>
                                                        <p className="text-[#616f89] dark:text-gray-400 text-xs md:text-sm">{item.vehicle.version}</p>
                                                    </div>
                                                    <span className={cn(
                                                        "text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                                                        item.state === 'sin_seguro' ? "text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-300" :
                                                            item.state === 'por_vencer' ? "text-yellow-700 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-300" :
                                                                "text-gray-600 bg-gray-50 dark:bg-gray-800"
                                                    )}>
                                                        {item.state === 'sin_seguro' ? 'Sin Seguro' : item.state === 'por_vencer' ? 'Vence pronto' : 'Revisar'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-[#616f89] dark:text-gray-400 text-xs mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[14px]">pin</span>
                                                        {item.vehicle.matricula}
                                                    </span>
                                                    <span className="hidden md:flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                                                        {item.state === 'sin_seguro' ? `Entrada: ${item.vehicle.fecha_entrada_stock}` : `Vence: ${item.policy?.fechaVencimiento}`}
                                                    </span>
                                                    <span className="hidden md:flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[14px]">sell</span>
                                                        {formatCurrency(item.vehicle.precio_venta)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="hidden md:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-primary">
                                                    <span className="material-symbols-outlined">edit</span>
                                                </button>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="p-16 text-center text-gray-400 flex flex-col items-center">
                                            <div className="h-16 w-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                                                <span className="material-symbols-outlined text-green-500 text-3xl">check</span>
                                            </div>
                                            <p className="text-lg font-medium text-gray-900">¡Todo en orden!</p>
                                            <p className="text-sm">No hay discrepancias pendientes en el stock asegurado.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Mobile Footer for Detail View */}
                            <div className="p-4 border-t border-gray-100 dark:border-gray-800 md:hidden">
                                <button
                                    onClick={() => setViewMode(viewMode === 'dashboard' ? 'list' : 'dashboard')}
                                    className="flex items-center justify-center text-primary text-sm font-bold h-10 w-full rounded-lg hover:bg-primary/5 transition-colors"
                                >
                                    {viewMode === 'dashboard' ? 'Ver todos los vehículos' : 'Volver a Resumen'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Navigation - Hidden on Desktop */}
                <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A202C] px-6 py-3 flex justify-between items-center fixed bottom-0 w-full md:hidden z-40">
                    <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-2xl">grid_view</span>
                        <span className="text-[10px] font-medium">Inicio</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-2xl">directions_car</span>
                        <span className="text-[10px] font-medium">Stock</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 text-primary">
                        <span className="material-symbols-outlined text-2xl fill-1 filled">verified_user</span>
                        <span className="text-[10px] font-bold">Seguros</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-2xl">payments</span>
                        <span className="text-[10px] font-medium">Ventas</span>
                    </button>
                </div>
            </div>

            {/* Hidden Modals */}
            <ImportPreviewModal
                open={showImportPreview}
                onClose={() => setShowImportPreview(false)}
                result={importResult}
                onConfirm={handleConfirmImport}
                isImporting={isImporting}
            />

            {selectedVehicle && (
                <InsurancePolicyModal
                    open={isPolicyModalOpen}
                    onClose={() => setIsPolicyModalOpen(false)}
                    vehicle={selectedVehicle}
                    existingPolicy={selectedPolicy}
                    onSave={handleSavePolicy}
                />
            )}

            {isDetailOpen && selectedVehicle && selectedPolicy && (
                <InsuranceDetailPanel
                    vehicle={selectedVehicle}
                    policy={selectedPolicy}
                    onClose={() => setIsDetailOpen(false)}
                    onEdit={() => {
                        setIsDetailOpen(false)
                        setIsPolicyModalOpen(true)
                    }}
                    onDelete={() => handleDeletePolicy(selectedPolicy.id)}
                />
            )}
        </div>
    )
}
