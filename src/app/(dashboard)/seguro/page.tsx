"use client"

import { useState, useCallback, useMemo } from "react"
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
    AlertTriangle,
    Upload,
    FileSpreadsheet,
    Shield,
    ShieldX,
    ShieldCheck,
    Search,
    RefreshCw,
    Download,
    Car,
    X,
    Plus,
    Edit,
    Eye,
    Trash2,
    MoreHorizontal,
    Clock,
    AlertCircle,
    Loader2
} from "lucide-react"
import { mockVehicles } from "@/lib/mock-data"
import { mockInsurancePolicies, getDaysRemaining, calculateInsuranceState } from "@/lib/mock-insurance"
import { formatDate, cn } from "@/lib/utils"
import { PolizaSeguro, Vehicle, INSURANCE_STATE_CONFIG, InsuranceState } from "@/types"
import { InsurancePolicyModal } from "@/components/insurance/InsurancePolicyModal"
import { InsuranceDetailPanel } from "@/components/insurance/InsuranceDetailPanel"
import { ImportPreviewModal, ImportResult, ParsedPolicy, MatchedPolicy } from "@/components/insurance/ImportPreviewModal"
import { defaultCoverages } from "@/lib/mock-insurance"
import * as XLSX from 'xlsx'

// Helper to normalize license plates
const normalizeMatricula = (mat: string): string => {
    return mat.toUpperCase().replace(/[\s\-\.]/g, '')
}

type FilterType = 'all' | 'insured' | 'uninsured' | 'expiring' | 'expired'

export default function SeguroPage() {
    // State
    const [policies, setPolicies] = useState<PolizaSeguro[]>(mockInsurancePolicies)
    const [isLoading, setIsLoading] = useState(false)
    const [fileName, setFileName] = useState<string | null>(null)
    const [filter, setFilter] = useState<FilterType>('all')

    // Import state
    const [importResult, setImportResult] = useState<ImportResult | null>(null)
    const [showImportPreview, setShowImportPreview] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const [importError, setImportError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")

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
        if (policy.estado === 'en_tramite') return 'en_tramite'
        return calculateInsuranceState(policy.fechaVencimiento)
    }, [])

    // Comparison data with policies
    const comparisonData = useMemo(() => {
        return mockVehicles
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

    // Apply filters
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
    }), [comparisonData])

    // Alerts (expiring + expired)
    const alerts = useMemo(() => {
        return comparisonData
            .filter(d => d.state === 'por_vencer' || d.state === 'vencido')
            .sort((a, b) => (a.daysRemaining || 0) - (b.daysRemaining || 0))
    }, [comparisonData])

    // File handlers - FULL AXA IMPORT
    const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
            setImportError('Por favor, sube un archivo Excel (.xlsx, .xls) o CSV')
            return
        }

        setIsLoading(true)
        setFileName(file.name)
        setImportError(null)

        try {
            const data = await file.arrayBuffer()
            const workbook = XLSX.read(data, { cellDates: true })
            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]
            const jsonData = XLSX.utils.sheet_to_json(worksheet)

            // Parse policies from Excel
            const parsedPolicies: ParsedPolicy[] = []
            jsonData.forEach((row: any) => {
                // Try multiple column name variations
                const matricula =
                    row['Matrícula'] || row['MATRICULA'] || row['matricula'] ||
                    row['Matrícula vehículo'] || row['MATRICULA VEHICULO'] ||
                    row['Placa'] || row['PLACA'] || row['Registration'] || row['Plate']

                if (!matricula) return

                const numeroPoliza =
                    row['Nº Póliza'] || row['Número Póliza'] || row['NUMERO POLIZA'] ||
                    row['Poliza'] || row['POLIZA'] || row['Policy'] || row['Póliza'] || `AXA-${Date.now()}`

                const fechaAlta =
                    row['Fecha Alta'] || row['FECHA ALTA'] || row['Alta'] ||
                    row['Inicio'] || row['Start'] || new Date().toISOString().split('T')[0]

                const fechaVencimiento =
                    row['Fecha Vencimiento'] || row['FECHA VENCIMIENTO'] || row['Vencimiento'] ||
                    row['VENCIMIENTO'] || row['Expiry'] || row['Fin'] || null

                const tipoPoliza =
                    row['Tipo'] || row['TIPO'] || row['Tipo Póliza'] || row['TIPO POLIZA'] ||
                    row['Cobertura'] || row['Type'] || 'Todo Riesgo'

                const prima = parseFloat(
                    row['Prima'] || row['PRIMA'] || row['Importe'] || row['Amount'] || '0'
                ) || undefined

                const marcaModelo =
                    row['Vehículo'] || row['Vehiculo'] || row['VEHICULO'] ||
                    row['Marca Modelo'] || row['Vehicle'] || undefined

                parsedPolicies.push({
                    numeroPoliza: String(numeroPoliza).trim(),
                    matricula: normalizeMatricula(String(matricula)),
                    marcaModelo: marcaModelo ? String(marcaModelo).trim() : undefined,
                    fechaAlta: fechaAlta ? String(fechaAlta).split('T')[0] : null,
                    fechaVencimiento: fechaVencimiento ? String(fechaVencimiento).split('T')[0] : null,
                    tipoPoliza: String(tipoPoliza).trim(),
                    prima,
                })
            })

            if (parsedPolicies.length === 0) {
                setImportError('No se encontraron pólizas en el archivo. Verifica que tenga una columna "Matrícula".')
                setIsLoading(false)
                return
            }

            // Match with vehicles in stock
            const activeVehicles = mockVehicles.filter(v => v.estado !== 'vendido')
            const vehiclesByMatricula = new Map<string, Vehicle>()
            activeVehicles.forEach(v => {
                vehiclesByMatricula.set(normalizeMatricula(v.matricula), v)
            })

            const matched: MatchedPolicy[] = []
            const unmatched: ParsedPolicy[] = []
            const matchedVehicleIds = new Set<string>()

            parsedPolicies.forEach(policy => {
                const vehicle = vehiclesByMatricula.get(policy.matricula)
                if (vehicle) {
                    matched.push({
                        policy,
                        vehicleId: vehicle.id,
                        vehicleName: `${vehicle.marca} ${vehicle.modelo}`,
                        matricula: vehicle.matricula,
                    })
                    matchedVehicleIds.add(vehicle.id)
                } else {
                    unmatched.push(policy)
                }
            })

            const vehiclesWithoutPolicy = activeVehicles
                .filter(v => !matchedVehicleIds.has(v.id))
                .map(v => v.matricula)

            // Set result and show preview modal
            setImportResult({
                totalPolicies: parsedPolicies.length,
                matched,
                unmatched,
                vehiclesWithoutPolicy,
            })
            setShowImportPreview(true)

        } catch (error) {
            console.error('Error parsing file:', error)
            setImportError(`Error procesando archivo: ${error}`)
        } finally {
            setIsLoading(false)
        }
    }, [])

    const handleDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault()
        const file = event.dataTransfer.files?.[0]
        if (file) {
            const dataTransfer = new DataTransfer()
            dataTransfer.items.add(file)
            handleFileUpload({ target: { files: dataTransfer.files } } as any)
        }
    }, [handleFileUpload])

    const clearFile = () => {
        setFileName(null)
        setImportResult(null)
        setImportError(null)
    }

    // Confirm import - create policies for matched vehicles
    const handleConfirmImport = async () => {
        if (!importResult) return

        setIsImporting(true)

        try {
            const newPolicies: PolizaSeguro[] = importResult.matched.map(match => ({
                id: `ins-import-${Date.now()}-${match.vehicleId}`,
                vehiculoId: match.vehicleId,
                companiaAseguradora: 'AXA',
                numeroPoliza: match.policy.numeroPoliza,
                tipoPoliza: match.policy.tipoPoliza?.toLowerCase().includes('tercero')
                    ? 'terceros_ampliado'
                    : 'todo_riesgo_franquicia',
                fechaAlta: match.policy.fechaAlta || new Date().toISOString().split('T')[0],
                fechaVencimiento: match.policy.fechaVencimiento || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                primaAnual: match.policy.prima || 0,
                franquicia: 300,
                tomadorNombre: 'MidCar Concesionario S.L.',
                tomadorNif: 'B12345678',
                coberturas: {
                    ...defaultCoverages,
                    rcObligatoria: true,
                    rcVoluntaria: true,
                    asistenciaViaje: true,
                },
                documentos: {},
                estado: 'asegurado',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }))

            // Add new policies (avoiding duplicates by vehiculoId)
            setPolicies(prev => {
                const existingVehicleIds = new Set(prev.map(p => p.vehiculoId))
                const uniqueNew = newPolicies.filter(p => !existingVehicleIds.has(p.vehiculoId))
                const updated = prev.map(p => {
                    const match = newPolicies.find(np => np.vehiculoId === p.vehiculoId)
                    return match ? { ...p, ...match, id: p.id } : p
                })
                return [...updated, ...uniqueNew]
            })

            // Close modal and show success
            setShowImportPreview(false)
            setImportResult(null)
            setFileName(null)
            alert(`✅ ${importResult.matched.length} vehículos actualizados con pólizas de AXA`)

        } catch (error) {
            setImportError(`Error guardando pólizas: ${error}`)
        } finally {
            setIsImporting(false)
        }
    }

    const exportUninsured = () => {
        const uninsuredData = comparisonData
            .filter(d => d.state === 'sin_seguro')
            .map(d => ({
                'Matrícula': d.vehicle.matricula,
                'Marca': d.vehicle.marca,
                'Modelo': d.vehicle.modelo,
                'Versión': d.vehicle.version,
                'Bastidor': d.vehicle.vin,
                'Estado Stock': d.vehicle.estado,
                'Fecha Alta Stock': d.vehicle.fecha_entrada_stock,
            }))

        const ws = XLSX.utils.json_to_sheet(uninsuredData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Sin Seguro')
        XLSX.writeFile(wb, 'vehiculos_sin_seguro.xlsx')
    }

    // Policy handlers
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
            case 'asegurado':
                return <ShieldCheck className="h-4 w-4" style={{ color: config.color }} />
            case 'por_vencer':
                return <Clock className="h-4 w-4" style={{ color: config.color }} />
            case 'vencido':
                return <ShieldX className="h-4 w-4" style={{ color: config.color }} />
            case 'en_tramite':
                return <Loader2 className="h-4 w-4 animate-spin" style={{ color: config.color }} />
            default:
                return <AlertTriangle className="h-4 w-4" style={{ color: config.color }} />
        }
    }

    return (
        <div className="space-y-6 animate-in relative">
            {/* Ambient glow */}
            <div className="ambient-glow" />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                        <Shield className="h-6 w-6 text-primary" />
                        Control del Seguro
                    </h1>
                    <p className="text-xs text-white/30 mt-1">
                        Gestiona las pólizas de seguro de tu stock
                    </p>
                </div>
                <div className="flex gap-2">
                    {stats.uninsured > 0 && (
                        <button onClick={exportUninsured} className="btn-ghost-luxury flex items-center gap-1.5 text-xs">
                            <Download className="h-3.5 w-3.5" />
                            Exportar sin seguro
                        </button>
                    )}
                </div>
            </div>

            {/* Alerts Banner */}
            {alerts.length > 0 && (
                <div className="card-luxury p-4 border-l-4 border-l-yellow-500">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-white/80">Atención: {alerts.length} póliza(s) requieren acción</h3>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {alerts.slice(0, 3).map(item => (
                                    <span
                                        key={item.vehicle.id}
                                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium"
                                        style={{
                                            backgroundColor: INSURANCE_STATE_CONFIG[item.state].color + '15',
                                            color: INSURANCE_STATE_CONFIG[item.state].color
                                        }}
                                    >
                                        {item.vehicle.matricula} - {item.daysRemaining && item.daysRemaining > 0 ? `${item.daysRemaining} días` : 'Vencido'}
                                    </span>
                                ))}
                                {alerts.length > 3 && (
                                    <span className="text-[10px] text-white/40">+{alerts.length - 3} más</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="card-luxury p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-white/[0.04] flex items-center justify-center">
                            <Car className="h-4 w-4 text-white/40" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-white/90">{stats.total}</p>
                            <p className="text-[10px] text-white/30 uppercase tracking-wider">Total stock</p>
                        </div>
                    </div>
                </div>
                <div className="card-luxury p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <ShieldCheck className="h-4 w-4 text-green-500" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-green-400">{stats.insured}</p>
                            <p className="text-[10px] text-white/30 uppercase tracking-wider">Asegurados</p>
                        </div>
                    </div>
                </div>
                <div className="card-luxury p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-yellow-500" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-yellow-400">{stats.expiring + stats.expired}</p>
                            <p className="text-[10px] text-white/30 uppercase tracking-wider">Por vencer</p>
                        </div>
                    </div>
                </div>
                <div className="card-luxury p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                            <ShieldX className="h-4 w-4 text-red-500" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-red-400">{stats.uninsured}</p>
                            <p className="text-[10px] text-white/30 uppercase tracking-wider">Sin seguro</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upload Area */}
            <div className="card-luxury p-4">
                {!fileName ? (
                    <div
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        className="border-2 border-dashed border-white/[0.06] rounded-lg p-8 text-center cursor-pointer hover:border-white/[0.12] transition-colors"
                    >
                        <Upload className="h-8 w-8 mx-auto text-white/20 mb-3" />
                        <h3 className="text-sm font-medium text-white/60 mb-1">
                            Importar desde AXA
                        </h3>
                        <p className="text-xs text-white/30 mb-3">
                            Arrastra un archivo Excel o haz clic para seleccionar
                        </p>
                        <label htmlFor="file-upload">
                            <span className="btn-ghost-luxury text-xs cursor-pointer inline-flex items-center gap-1.5">
                                <FileSpreadsheet className="h-3.5 w-3.5" />
                                Seleccionar archivo
                            </span>
                        </label>
                        <input
                            id="file-upload"
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                    </div>
                ) : (
                    <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg">
                        <div className="flex items-center gap-3">
                            <FileSpreadsheet className="h-6 w-6 text-primary" />
                            <div>
                                <p className="text-xs font-medium text-white/70">{fileName}</p>
                                <p className="text-[10px] text-white/30">
                                    {importResult ? `${importResult.matched.length} coincidencias encontradas` : 'Procesando...'}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <label htmlFor="file-reupload">
                                <span className="btn-ghost-luxury text-[10px] cursor-pointer inline-flex items-center gap-1">
                                    <RefreshCw className="h-3 w-3" />
                                    Cambiar
                                </span>
                            </label>
                            <input
                                id="file-reupload"
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                            <button onClick={clearFile} className="p-1.5 hover:bg-white/[0.04] rounded-md transition-colors">
                                <X className="h-3.5 w-3.5 text-white/40" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Import Error */}
                {importError && (
                    <p className="mt-3 text-xs text-red-400 text-center">{importError}</p>
                )}
            </div>

            {/* Table */}
            <div className="card-luxury overflow-hidden">
                {/* Table Header */}
                <div className="p-4 border-b border-white/[0.04] flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <h2 className="text-sm font-medium text-white/70">Comparativa Stock vs Seguro</h2>
                    <div className="flex gap-2">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-white/20" />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-[160px] h-8 pl-7 pr-3 text-[11px] bg-white/[0.02] border border-white/[0.04] rounded-md text-white/80 placeholder:text-white/20 focus:outline-none focus:border-white/[0.08]"
                            />
                        </div>
                        {/* Filter Pills */}
                        <div className="flex bg-white/[0.02] rounded-md p-0.5">
                            {[
                                { value: 'all', label: 'Todos', count: stats.total },
                                { value: 'insured', label: 'Asegurados', count: stats.insured },
                                { value: 'expiring', label: 'Por vencer', count: stats.expiring + stats.expired },
                                { value: 'uninsured', label: 'Sin seguro', count: stats.uninsured },
                            ].map((f) => (
                                <button
                                    key={f.value}
                                    onClick={() => setFilter(f.value as FilterType)}
                                    className={cn(
                                        "px-2.5 py-1 text-[10px] font-medium rounded transition-all",
                                        filter === f.value
                                            ? "bg-white/[0.06] text-white/80"
                                            : "text-white/40 hover:text-white/60"
                                    )}
                                >
                                    {f.label} ({f.count})
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table Content */}
                <Table className="table-luxury">
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[100px]">Estado</TableHead>
                            <TableHead>Vehículo</TableHead>
                            <TableHead>Matrícula</TableHead>
                            <TableHead>Estado Stock</TableHead>
                            <TableHead>Póliza</TableHead>
                            <TableHead>Vencimiento</TableHead>
                            <TableHead className="w-[80px]">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.map((item) => (
                            <TableRow
                                key={item.vehicle.id}
                                className={cn(
                                    "group cursor-pointer",
                                    item.state === 'sin_seguro' && "bg-red-500/[0.02]",
                                    item.state === 'vencido' && "bg-orange-500/[0.02]",
                                    item.state === 'por_vencer' && "bg-yellow-500/[0.02]"
                                )}
                            >
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <StateIcon state={item.state} />
                                        <span
                                            className="text-xs font-medium"
                                            style={{ color: INSURANCE_STATE_CONFIG[item.state].color }}
                                        >
                                            {INSURANCE_STATE_CONFIG[item.state].label}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="h-8 w-12 rounded bg-cover bg-center"
                                            style={{ backgroundImage: `url(${item.vehicle.imagen_principal})` }}
                                        />
                                        <div>
                                            <p className="text-xs font-medium text-white/70">
                                                {item.vehicle.marca} {item.vehicle.modelo}
                                            </p>
                                            <p className="text-[10px] text-white/30">{item.vehicle.version}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="font-mono text-xs text-white/60">
                                    {item.vehicle.matricula}
                                </TableCell>
                                <TableCell>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/[0.04] text-white/50">
                                        {item.vehicle.estado}
                                    </span>
                                </TableCell>
                                <TableCell className="text-xs text-white/50">
                                    {item.policy?.numeroPoliza || '-'}
                                </TableCell>
                                <TableCell className="text-xs">
                                    {item.policy ? (
                                        <span className={cn(
                                            item.state === 'por_vencer' && "text-yellow-400",
                                            item.state === 'vencido' && "text-red-400",
                                            item.state === 'asegurado' && "text-white/50"
                                        )}>
                                            {formatDate(item.policy.fechaVencimiento)}
                                        </span>
                                    ) : '-'}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/[0.04]">
                                                <MoreHorizontal className="h-3.5 w-3.5 text-white/40" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="glass border-white/[0.06]">
                                            {item.policy ? (
                                                <>
                                                    <DropdownMenuItem
                                                        onClick={() => handleViewPolicy(item.vehicle, item.policy!)}
                                                        className="text-xs hover:bg-white/[0.04]"
                                                    >
                                                        <Eye className="mr-2 h-3.5 w-3.5" />
                                                        Ver detalle
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleEditPolicy(item.vehicle, item.policy!)}
                                                        className="text-xs hover:bg-white/[0.04]"
                                                    >
                                                        <Edit className="mr-2 h-3.5 w-3.5" />
                                                        Editar póliza
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeletePolicy(item.policy!.id)}
                                                        className="text-xs text-red-400 hover:bg-red-500/10"
                                                    >
                                                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                                                        Eliminar
                                                    </DropdownMenuItem>
                                                </>
                                            ) : (
                                                <DropdownMenuItem
                                                    onClick={() => handleAddPolicy(item.vehicle)}
                                                    className="text-xs hover:bg-white/[0.04]"
                                                >
                                                    <Plus className="mr-2 h-3.5 w-3.5" />
                                                    Añadir seguro
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {filteredData.length === 0 && (
                    <div className="p-12 text-center">
                        <Search className="h-8 w-8 mx-auto text-white/10 mb-3" />
                        <p className="text-xs text-white/30">No se encontraron vehículos</p>
                    </div>
                )}

                {/* Footer */}
                <div className="px-4 py-3 border-t border-white/[0.04]">
                    <p className="text-[10px] text-white/20">
                        Mostrando {filteredData.length} de {comparisonData.length} vehículos
                    </p>
                </div>
            </div>

            {/* Policy Modal */}
            {selectedVehicle && (
                <InsurancePolicyModal
                    open={isPolicyModalOpen}
                    onClose={() => setIsPolicyModalOpen(false)}
                    vehicle={selectedVehicle}
                    existingPolicy={selectedPolicy}
                    onSave={handleSavePolicy}
                />
            )}

            {/* Detail Panel */}
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

            {/* Import Preview Modal */}
            <ImportPreviewModal
                open={showImportPreview}
                onClose={() => setShowImportPreview(false)}
                result={importResult}
                onConfirm={handleConfirmImport}
                isImporting={isImporting}
            />
        </div>
    )
}
