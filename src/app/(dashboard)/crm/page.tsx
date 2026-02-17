"use client"

import { useState, useEffect, useMemo, useCallback, memo, lazy, Suspense } from "react"
import dynamic from 'next/dynamic'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    MoreHorizontal,
    Phone,
    Mail,
    MessageCircle,
    Trash2,
} from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { formatRelativeTime, formatCurrency, cn } from "@/lib/utils"
import type { Lead } from "@/types"
import { StatusBadge } from "@/components/crm"
import { useFilteredData } from "@/hooks/useFilteredData"
import { deleteLead as deleteLeadFromDB } from "@/lib/supabase-service"

// Lazy load modales para reducir bundle inicial
const LeadDetailModal = dynamic(() => import('@/components/crm/LeadDetailModal').then(m => ({ default: m.LeadDetailModal })), { ssr: false })
const NewLeadModal = dynamic(() => import('@/components/crm/NewLeadModal').then(m => ({ default: m.NewLeadModal })), { ssr: false })

type FilterType = 'todos' | 'nuevos' | 'enProceso' | 'vendidos' | 'perdidos'

// Grupos de estados por categoría de filtro
const FILTER_GROUPS = {
    nuevos: ['nuevo'],
    enProceso: ['contactado', 'negociacion', 'visita_agendada', 'prueba_programada', 'prueba_conduccion', 'propuesta_enviada', 'financiacion', 'oferta_enviada'],
    vendidos: ['vendido'],
    perdidos: ['perdido'],
}

export default function CRMPage() {
    const { addToast } = useToast()
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<FilterType>("todos")
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
    const [showNewLeadModal, setShowNewLeadModal] = useState(false)

    // Obtener leads filtrados por usuario (Mi Vista / Visión Completa)
    const { leads: userFilteredLeads, isFullView } = useFilteredData()

    // Estado local para gestionar leads (permite modificar estados)
    const [leads, setLeads] = useState<Lead[]>(userFilteredLeads)

    // Sincronizar cuando cambie la vista (Mi Vista / Visión Completa)
    useEffect(() => {
        setLeads(userFilteredLeads)
    }, [userFilteredLeads])

    // Handler para actualizar el estado de un lead
    const handleStatusChange = (leadId: string, newStatus: string) => {
        setLeads(prev => prev.map(l =>
            l.id === leadId
                ? { ...l, estado: newStatus as Lead['estado'] }
                : l
        ))
        // También actualizar el lead seleccionado si es el mismo
        if (selectedLead?.id === leadId) {
            setSelectedLead(prev => prev ? { ...prev, estado: newStatus as Lead['estado'] } : null)
        }
    }

    // Handler para eliminar un lead
    const handleDeleteLead = (leadId: string) => {
        setLeads(prev => prev.filter(l => l.id !== leadId))
        if (selectedLead?.id === leadId) {
            setSelectedLead(null)
        }
    }

    // Filter leads - memoizado para evitar recálculos innecesarios
    const filteredLeads = useMemo(() => {
        const searchLower = searchQuery.toLowerCase()
        return leads.filter(lead => {
            // Filtrar por búsqueda
            if (searchQuery) {
                const matchesSearch =
                    lead.cliente?.nombre?.toLowerCase().includes(searchLower) ||
                    lead.cliente?.apellidos?.toLowerCase().includes(searchLower) ||
                    lead.vehiculo?.marca?.toLowerCase().includes(searchLower) ||
                    lead.vehiculo?.modelo?.toLowerCase().includes(searchLower)
                if (!matchesSearch) return false
            }

            // Filtrar por grupo de estados
            if (statusFilter !== "todos") {
                const allowedStates = FILTER_GROUPS[statusFilter as keyof typeof FILTER_GROUPS] || []
                if (!allowedStates.includes(lead.estado)) return false
            }

            return true
        })
    }, [leads, searchQuery, statusFilter])

    // Stats - single-pass optimizado
    const stats = useMemo(() => {
        let nuevos = 0, enProceso = 0, vendidos = 0
        for (const l of leads) {
            if (FILTER_GROUPS.nuevos.includes(l.estado)) nuevos++
            else if (FILTER_GROUPS.enProceso.includes(l.estado)) enProceso++
            else if (FILTER_GROUPS.vendidos.includes(l.estado)) vendidos++
        }
        return { total: leads.length, nuevos, enProceso, vendidos }
    }, [leads])

    // Helper memoizado
    const getInitials = useCallback((nombre: string, apellidos: string) => {
        return `${nombre.charAt(0)}${apellidos.charAt(0)}`.toUpperCase()
    }, [])

    // Dynamic import de XLSX para reducir bundle inicial (~500KB)
    const handleExport = async () => {
        try {
            addToast("Generando reporte...", 'info')
            const [XLSX, { saveAs }] = await Promise.all([
                import('xlsx'),
                import('file-saver')
            ])

            const dataToExport = filteredLeads.map(lead => ({
                Fecha: new Date(lead.fecha_creacion).toLocaleDateString(),
                Cliente: `${lead.cliente?.nombre || ''} ${lead.cliente?.apellidos || ''}`,
                Email: lead.cliente?.email || '',
                Telefono: lead.cliente?.telefono || '',
                Vehiculo: lead.vehiculo ? `${lead.vehiculo.marca} ${lead.vehiculo.modelo}` : 'N/A',
                Precio: lead.vehiculo?.precio_venta || 0,
                Estado: lead.estado,
                Prioridad: lead.prioridad,
                Vendedor: lead.vendedor?.nombre || 'Sin asignar'
            }))

            const worksheet = XLSX.utils.json_to_sheet(dataToExport)
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, "Leads")

            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
            const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' })

            saveAs(data, `midcar_leads_${new Date().toISOString().split('T')[0]}.xlsx`)
            addToast("Reporte generado", 'success')
        } catch (error) {
            console.error("Error exporting report:", error)
            addToast("Error al generar el reporte", 'error')
        }
    }

    const getStatusConfig = useCallback((estado: string) => {
        const config: Record<string, { bg: string, text: string, icon: string }> = {
            'nuevo': { bg: 'bg-blue-100 text-blue-700 border-blue-200', text: 'Nuevo', icon: 'fiber_new' },
            'contactado': { bg: 'bg-cyan-100 text-cyan-700 border-cyan-200', text: 'Contactado', icon: 'call' },
            'negociacion': { bg: 'bg-amber-100 text-amber-700 border-amber-200', text: 'Negociación', icon: 'handshake' },
            'prueba_programada': { bg: 'bg-purple-100 text-purple-700 border-purple-200', text: 'Prueba', icon: 'directions_car' },
            'financiacion': { bg: 'bg-indigo-100 text-indigo-700 border-indigo-200', text: 'Financiación', icon: 'account_balance' },
            'oferta_enviada': { bg: 'bg-orange-100 text-orange-700 border-orange-200', text: 'Oferta', icon: 'send' },
            'vendido': { bg: 'bg-green-100 text-green-700 border-green-200', text: 'Vendido', icon: 'check_circle' },
            'perdido': { bg: 'bg-gray-100 text-gray-500 border-gray-200', text: 'Perdido', icon: 'cancel' },
        }
        return config[estado] || { bg: 'bg-gray-100 text-gray-600 border-gray-200', text: estado, icon: 'help' }
    }, [])

    const getPriorityConfig = useCallback((prioridad: string) => {
        const config: Record<string, { color: string, label: string }> = {
            'alta': { color: 'text-red-500', label: 'Alta' },
            'media': { color: 'text-amber-500', label: 'Media' },
            'baja': { color: 'text-gray-400', label: 'Baja' },
        }
        return config[prioridad] || { color: 'text-gray-400', label: prioridad }
    }, [])

    return (
        <div className="min-h-screen bg-[#f6f6f8] flex flex-col">
            {/* Sticky Header */}
            <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
                {/* Top App Bar */}
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center">
                        <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Gestión Comercial</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-500 hidden sm:inline">{stats.total} leads</span>
                        <button
                            onClick={handleExport}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[20px]">download</span>
                        </button>
                        <button
                            onClick={() => setShowNewLeadModal(true)}
                            className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#135bec] text-white rounded-lg font-semibold text-sm shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            Nuevo Lead
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="px-4 pb-2 md:px-6">
                    <div className="group flex w-full items-center rounded-xl bg-slate-100 h-11 border-2 border-transparent focus-within:border-[#135bec]/50 focus-within:bg-white transition-all duration-200">
                        <div className="flex items-center justify-center pl-3 pr-2 text-slate-400 group-focus-within:text-[#135bec] transition-colors">
                            <span className="material-symbols-outlined text-[22px]">search</span>
                        </div>
                        <input
                            className="flex w-full bg-transparent border-none text-base font-medium placeholder:text-slate-400 focus:ring-0 text-slate-900 h-full p-0 pr-4"
                            placeholder="Buscar cliente, vehículo..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Filter Chips */}
                <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar items-center md:px-6">
                    <button
                        onClick={() => setStatusFilter("todos")}
                        className={cn(
                            "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 h-9 shadow-sm transition active:scale-95",
                            statusFilter === "todos"
                                ? "bg-[#135bec] text-white shadow-blue-500/30"
                                : "bg-white border border-gray-200 text-slate-600 hover:border-[#135bec]/50"
                        )}
                    >
                        <span className="text-sm font-bold leading-none">Todos ({stats.total})</span>
                    </button>

                    <button
                        onClick={() => setStatusFilter("nuevos")}
                        className={cn(
                            "flex shrink-0 items-center justify-center rounded-full px-4 py-1.5 h-9 transition active:scale-95",
                            statusFilter === "nuevos"
                                ? "bg-blue-500 text-white shadow-sm shadow-blue-400/30"
                                : "bg-white border border-gray-200 text-slate-600 hover:border-blue-500/50"
                        )}
                    >
                        <span className="text-sm font-medium leading-none">Nuevos ({stats.nuevos})</span>
                    </button>

                    <button
                        onClick={() => setStatusFilter("enProceso")}
                        className={cn(
                            "flex shrink-0 items-center justify-center rounded-full px-4 py-1.5 h-9 transition active:scale-95",
                            statusFilter === "enProceso"
                                ? "bg-amber-500 text-white shadow-sm shadow-amber-500/30"
                                : "bg-white border border-gray-200 text-slate-600 hover:border-amber-500/50"
                        )}
                    >
                        <span className="text-sm font-medium leading-none">En proceso ({stats.enProceso})</span>
                    </button>

                    <button
                        onClick={() => setStatusFilter("vendidos")}
                        className={cn(
                            "flex shrink-0 items-center justify-center rounded-full px-4 py-1.5 h-9 transition active:scale-95",
                            statusFilter === "vendidos"
                                ? "bg-green-500 text-white shadow-sm shadow-green-500/30"
                                : "bg-white border border-gray-200 text-slate-600 hover:border-green-500/50"
                        )}
                    >
                        <span className="text-sm font-medium leading-none">Vendidos ({stats.vendidos})</span>
                    </button>
                </div>
            </header>

            {/* Stats Cards - Desktop Only */}
            <div className="hidden md:grid grid-cols-4 gap-4 px-6 py-4">
                <StatCard
                    icon="groups"
                    label="Total Leads"
                    value={stats.total}
                />
                <StatCard
                    icon="fiber_new"
                    label="Nuevos"
                    value={stats.nuevos}
                    highlight
                />
                <StatCard
                    icon="handshake"
                    label="En Proceso"
                    value={stats.enProceso}
                />
                <StatCard
                    icon="check_circle"
                    label="Vendidos"
                    value={stats.vendidos}
                />
            </div>

            {/* Main Content: Lead List */}
            <main className="flex-1 px-4 py-4 pb-32 md:px-6">
                <div className="flex flex-col gap-3">
                    {filteredLeads.map((lead) => (
                        <LeadCard
                            key={lead.id}
                            lead={lead}
                            getStatusConfig={getStatusConfig}
                            getPriorityConfig={getPriorityConfig}
                            getInitials={getInitials}
                            isFullView={isFullView}
                            onClick={() => setSelectedLead(lead)}
                            onDelete={handleDeleteLead}
                        />
                    ))}
                </div>

                {/* Empty State */}
                {filteredLeads.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">search_off</span>
                        <h3 className="text-lg font-semibold text-gray-600 mb-1">No se encontraron leads</h3>
                        <p className="text-sm text-gray-400">Intenta ajustar los filtros de búsqueda</p>
                        <button
                            onClick={() => { setSearchQuery(""); setStatusFilter("todos"); }}
                            className="mt-4 px-4 py-2 text-sm font-medium text-[#135bec] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                )}
            </main>

            {/* Mobile FAB */}
            <button
                onClick={() => setShowNewLeadModal(true)}
                className="md:hidden fixed bottom-24 right-4 z-20 flex items-center justify-center w-14 h-14 bg-[#135bec] text-white rounded-full shadow-lg shadow-blue-500/40 hover:bg-blue-600 transition-all active:scale-95"
            >
                <span className="material-symbols-outlined text-[28px]">add</span>
            </button>

            {/* Lead Detail Modal */}
            {selectedLead && (
                <LeadDetailModal
                    lead={selectedLead}
                    open={!!selectedLead}
                    onClose={() => setSelectedLead(null)}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDeleteLead}
                />
            )}

            {/* New Lead Modal */}
            <NewLeadModal
                open={showNewLeadModal}
                onClose={() => setShowNewLeadModal(false)}
            />
        </div>
    )
}

// Stat Card Component - memoizado
const StatCard = memo(function StatCard({ icon, label, value, highlight = false }: {
    icon: string,
    label: string,
    value: number,
    highlight?: boolean
}) {
    return (
        <div className={cn(
            "flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 shadow-sm transition-all",
            highlight && "ring-2 ring-[#135bec]/20"
        )}>
            <div className={cn(
                "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
                highlight ? "bg-[#135bec]/10 text-[#135bec]" : "bg-slate-100 text-slate-500"
            )}>
                <span className="material-symbols-outlined text-[24px]">{icon}</span>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">{label}</p>
                <span className={cn(
                    "text-2xl font-bold",
                    highlight ? "text-[#135bec]" : "text-slate-900"
                )}>{value}</span>
            </div>
        </div>
    )
})

// Formatear fecha y hora de creación
function formatCreatedAt(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

    if (diffMins < 1) return 'Ahora mismo'
    if (diffMins < 60) return `Hace ${diffMins} min`
    if (diffHours < 24) return `Hoy ${timeStr}`
    if (diffDays === 1) return `Ayer ${timeStr}`
    if (diffDays < 7) return `Hace ${diffDays} días`

    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) + ` ${timeStr}`
}

// Lead Card Component (Mobile-optimized) - memoizado
const LeadCard = memo(function LeadCard({ lead, getStatusConfig, getPriorityConfig, getInitials, isFullView, onClick, onDelete }: {
    lead: Lead,
    getStatusConfig: (estado: string) => { bg: string, text: string, icon: string },
    getPriorityConfig: (prioridad: string) => { color: string, label: string },
    getInitials: (nombre: string, apellidos: string) => string,
    isFullView: boolean,
    onClick: () => void,
    onDelete: (leadId: string) => void
}) {
    const statusConfig = useMemo(() => getStatusConfig(lead.estado), [getStatusConfig, lead.estado])
    const priorityConfig = useMemo(() => getPriorityConfig(lead.prioridad), [getPriorityConfig, lead.prioridad])
    // Usar el nombre guardado en el lead o mostrar "Usuario"
    const creatorName = lead.created_by_name || (lead.created_by ? 'Usuario' : null)
    const createdAt = lead.fecha_creacion ? formatCreatedAt(lead.fecha_creacion) : null

    return (
        <div
            onClick={onClick}
            className="relative bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:border-gray-200 will-change-transform"
            style={{ transition: 'box-shadow 0.15s ease, border-color 0.15s ease, transform 0.1s ease' }}
        >
            {/* Creator info - always show when there's creator data */}
            {creatorName && (
                <div className="bg-indigo-50/50 border-b border-indigo-100/50 px-4 py-2">
                    <div className="flex items-center justify-between text-[11px]">
                        <span className="inline-flex items-center gap-1.5 text-indigo-600 font-medium">
                            <span className="material-symbols-outlined text-[14px]">person</span>
                            {creatorName}
                        </span>
                        {createdAt && (
                            <span className="inline-flex items-center gap-1 text-indigo-500">
                                <span className="material-symbols-outlined text-[12px]">schedule</span>
                                {createdAt}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="p-4">
            {/* Top Row: Client + Status */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar className="h-10 w-10 shrink-0 ring-2 ring-gray-100">
                        <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-[#135bec] to-blue-600 text-white">
                            {getInitials(lead.cliente?.nombre || 'N', lead.cliente?.apellidos || 'A')}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 truncate">
                            {lead.cliente?.nombre} {lead.cliente?.apellidos}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                            {lead.cliente?.email || lead.cliente?.telefono}
                        </p>
                    </div>
                </div>
                <div className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border shrink-0",
                    statusConfig.bg
                )}>
                    <span className="material-symbols-outlined text-[14px]">{statusConfig.icon}</span>
                    <span className="hidden sm:inline">{statusConfig.text}</span>
                </div>
            </div>

            {/* Middle Row: Vehicle */}
            {lead.vehiculo && (
                <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-slate-50">
                    <div className="h-8 w-8 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px] text-slate-500">directions_car</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                            {lead.vehiculo.marca} {lead.vehiculo.modelo}
                        </p>
                        <p className="text-xs text-slate-500">
                            {formatCurrency(lead.vehiculo.precio_venta)}
                        </p>
                    </div>
                </div>
            )}

            {/* Bottom Row: Meta + Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        {formatRelativeTime(lead.fecha_creacion)}
                    </span>
                    <span className={cn("flex items-center gap-1", priorityConfig.color)}>
                        <span className="material-symbols-outlined text-[14px]">flag</span>
                        {priorityConfig.label}
                    </span>
                    {lead.vendedor && (
                        <span className="hidden sm:flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">person</span>
                            {lead.vendedor.nombre}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${lead.cliente?.telefono}`; }}
                        className="h-8 w-8 flex items-center justify-center rounded-full text-slate-400 hover:text-[#135bec] hover:bg-blue-50 transition-colors"
                    >
                        <Phone className="h-4 w-4" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); window.location.href = `mailto:${lead.cliente?.email}`; }}
                        className="h-8 w-8 flex items-center justify-center rounded-full text-slate-400 hover:text-[#135bec] hover:bg-blue-50 transition-colors"
                    >
                        <Mail className="h-4 w-4" />
                    </button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <button className="h-8 w-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-white border-gray-200">
                            <DropdownMenuItem onClick={onClick} className="cursor-pointer">
                                <span className="material-symbols-outlined text-[18px] mr-2">visibility</span>
                                Ver ficha
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    window.open(`https://wa.me/${lead.cliente?.telefono?.replace(/\D/g, '')}`, '_blank')
                                }}
                            >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                onClick={async (e) => {
                                    e.stopPropagation()
                                    if (window.confirm('¿Estás seguro de que quieres eliminar este lead?')) {
                                        const success = await deleteLeadFromDB(lead.id)
                                        if (success) {
                                            onDelete(lead.id)
                                        }
                                    }
                                }}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            </div>
        </div>
    )
})
