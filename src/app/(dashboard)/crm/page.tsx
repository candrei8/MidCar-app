"use client"

import { useState, useEffect } from "react"
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    MoreHorizontal,
    Phone,
    Mail,
    MessageCircle,
} from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { formatRelativeTime, formatCurrency, cn } from "@/lib/utils"
import { ESTADOS_LEAD, PRIORIDADES_LEAD } from "@/lib/constants"
import type { Lead } from "@/types"
import { LeadDetailModal, StatusBadge, NewLeadModal } from "@/components/crm"
import { useFilteredData } from "@/hooks/useFilteredData"

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

    // Filter leads - usando grupos de estados
    const filteredLeads = leads.filter(lead => {
        const matchesSearch =
            lead.cliente?.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.cliente?.apellidos?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.vehiculo?.marca?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.vehiculo?.modelo?.toLowerCase().includes(searchQuery.toLowerCase())

        // Filtrar por grupo de estados
        let matchesStatus = true
        if (statusFilter !== "todos") {
            const allowedStates = FILTER_GROUPS[statusFilter as keyof typeof FILTER_GROUPS] || []
            matchesStatus = allowedStates.includes(lead.estado)
        }

        return matchesSearch && matchesStatus
    })

    // Stats - usando los grupos correctos
    const stats = {
        total: leads.length,
        nuevos: leads.filter(l => FILTER_GROUPS.nuevos.includes(l.estado)).length,
        enProceso: leads.filter(l => FILTER_GROUPS.enProceso.includes(l.estado)).length,
        vendidos: leads.filter(l => FILTER_GROUPS.vendidos.includes(l.estado)).length,
    }

    const getInitials = (nombre: string, apellidos: string) => {
        return `${nombre.charAt(0)}${apellidos.charAt(0)}`.toUpperCase()
    }

    const handleExport = () => {
        try {
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
        } catch (error) {
            console.error("Error exporting report:", error)
            addToast("Error al generar el reporte", 'error')
        }
    }

    const getStatusConfig = (estado: string) => {
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
    }

    const getPriorityConfig = (prioridad: string) => {
        const config: Record<string, { color: string, label: string }> = {
            'alta': { color: 'text-red-500', label: 'Alta' },
            'media': { color: 'text-amber-500', label: 'Media' },
            'baja': { color: 'text-gray-400', label: 'Baja' },
        }
        return config[prioridad] || { color: 'text-gray-400', label: prioridad }
    }

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-[#111318] dark:text-white min-h-screen">
            <div className="relative flex flex-col min-h-screen w-full max-w-7xl mx-auto">

                {/* Sticky Header */}
                <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#1A202C]/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-sm">
                    {/* Top App Bar */}
                    <div className="flex items-center justify-between px-4 py-3 md:px-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3b82f6] text-white shadow-lg shadow-blue-400/30">
                                <span className="material-symbols-outlined text-[20px]">groups</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Gestión Comercial</h1>
                                <p className="text-xs text-gray-500 dark:text-gray-400 hidden md:block">Oportunidades y leads</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleExport}
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">download</span>
                            </button>
                            <button
                                onClick={() => setShowNewLeadModal(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3b82f6] text-white font-semibold text-sm shadow-lg shadow-blue-400/30 hover:bg-blue-600 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px]">add</span>
                                <span className="hidden sm:inline">Nuevo Lead</span>
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="px-4 pb-2 md:px-6">
                        <div className="group flex w-full items-center rounded-xl bg-gray-100 dark:bg-gray-800 h-11 border-2 border-transparent focus-within:border-[#3b82f6]/50 focus-within:bg-white dark:focus-within:bg-gray-900 transition-all duration-200">
                            <div className="flex items-center justify-center pl-3 pr-2 text-gray-400 group-focus-within:text-[#3b82f6] transition-colors">
                                <span className="material-symbols-outlined text-[22px]">search</span>
                            </div>
                            <input
                                className="flex w-full bg-transparent border-none text-base font-medium placeholder:text-gray-400 focus:ring-0 text-slate-900 dark:text-white h-full p-0 pr-4"
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
                                "flex shrink-0 items-center gap-1.5 rounded-full pl-3 pr-4 py-1.5 h-9 shadow-sm transition active:scale-95",
                                statusFilter === "todos"
                                    ? "bg-[#3b82f6] text-white shadow-blue-400/30"
                                    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 hover:border-[#3b82f6]/50"
                            )}
                        >
                            <span className="material-symbols-outlined text-[18px]">tune</span>
                            <span className="text-sm font-bold leading-none">Todos ({stats.total})</span>
                        </button>

                        <button
                            onClick={() => setStatusFilter("nuevos")}
                            className={cn(
                                "flex shrink-0 items-center justify-center rounded-full px-4 py-1.5 h-9 transition active:scale-95",
                                statusFilter === "nuevos"
                                    ? "bg-blue-500 text-white shadow-sm shadow-blue-400/30"
                                    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 hover:border-blue-500/50"
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
                                    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 hover:border-amber-500/50"
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
                                    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 hover:border-green-500/50"
                            )}
                        >
                            <span className="text-sm font-medium leading-none">Vendidos ({stats.vendidos})</span>
                        </button>
                    </div>
                </header>

                {/* Stats Cards - Desktop Only */}
                <div className="hidden md:grid grid-cols-4 gap-4 p-6">
                    <StatCard
                        icon="groups"
                        label="Total Leads"
                        value={stats.total}
                        trend="+12%"
                        trendUp={true}
                    />
                    <StatCard
                        icon="fiber_new"
                        label="Nuevos"
                        value={stats.nuevos}
                        trend="+4 esta semana"
                        trendUp={true}
                        highlight
                    />
                    <StatCard
                        icon="handshake"
                        label="En Proceso"
                        value={stats.enProceso}
                        trend="8 activos"
                        trendUp={null}
                    />
                    <StatCard
                        icon="check_circle"
                        label="Vendidos"
                        value={stats.vendidos}
                        trend="+2 este mes"
                        trendUp={true}
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
                                onClick={() => setSelectedLead(lead)}
                            />
                        ))}
                    </div>

                    {/* Empty State */}
                    {filteredLeads.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600 mb-4">search_off</span>
                            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-1">No se encontraron leads</h3>
                            <p className="text-sm text-gray-400 dark:text-gray-500">Intenta ajustar los filtros de búsqueda</p>
                            <button
                                onClick={() => { setSearchQuery(""); setStatusFilter("todos"); }}
                                className="mt-4 px-4 py-2 text-sm font-medium text-[#3b82f6] bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                            >
                                Limpiar filtros
                            </button>
                        </div>
                    )}
                </main>

                {/* Lead Detail Modal */}
                {selectedLead && (
                    <LeadDetailModal
                        lead={selectedLead}
                        open={!!selectedLead}
                        onClose={() => setSelectedLead(null)}
                        onStatusChange={handleStatusChange}
                    />
                )}

                {/* New Lead Modal */}
                <NewLeadModal
                    open={showNewLeadModal}
                    onClose={() => setShowNewLeadModal(false)}
                />
            </div>
        </div>
    )
}

// Stat Card Component
function StatCard({ icon, label, value, trend, trendUp, highlight = false }: {
    icon: string,
    label: string,
    value: number,
    trend?: string,
    trendUp?: boolean | null,
    highlight?: boolean
}) {
    return (
        <div className={cn(
            "flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 shadow-sm transition-all",
            highlight && "ring-2 ring-[#3b82f6]/20"
        )}>
            <div className={cn(
                "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
                highlight ? "bg-[#3b82f6]/10 text-[#3b82f6]" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
            )}>
                <span className="material-symbols-outlined text-[24px]">{icon}</span>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">{label}</p>
                <div className="flex items-baseline gap-2">
                    <span className={cn(
                        "text-2xl font-bold",
                        highlight ? "text-[#3b82f6]" : "text-slate-900 dark:text-white"
                    )}>{value}</span>
                    {trend && (
                        <span className={cn(
                            "text-xs font-medium",
                            trendUp === true ? "text-green-500" : trendUp === false ? "text-red-500" : "text-gray-400"
                        )}>
                            {trend}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}

// Lead Card Component (Mobile-optimized)
function LeadCard({ lead, getStatusConfig, getPriorityConfig, getInitials, onClick }: {
    lead: Lead,
    getStatusConfig: (estado: string) => { bg: string, text: string, icon: string },
    getPriorityConfig: (prioridad: string) => { color: string, label: string },
    getInitials: (nombre: string, apellidos: string) => string,
    onClick: () => void
}) {
    const statusConfig = getStatusConfig(lead.estado)
    const priorityConfig = getPriorityConfig(lead.prioridad)

    return (
        <div
            onClick={onClick}
            className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 cursor-pointer hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700 transition-all active:scale-[0.99]"
        >
            {/* Top Row: Client + Status */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar className="h-10 w-10 shrink-0 ring-2 ring-gray-100 dark:ring-gray-700">
                        <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-[#3b82f6] to-blue-600 text-white">
                            {getInitials(lead.cliente?.nombre || 'N', lead.cliente?.apellidos || 'A')}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">
                            {lead.cliente?.nombre} {lead.cliente?.apellidos}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
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
                <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="h-8 w-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px] text-gray-500 dark:text-gray-400">directions_car</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {lead.vehiculo.marca} {lead.vehiculo.modelo}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatCurrency(lead.vehiculo.precio_venta)}
                        </p>
                    </div>
                </div>
            )}

            {/* Bottom Row: Meta + Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
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
                        className="h-8 w-8 flex items-center justify-center rounded-full text-gray-400 hover:text-[#3b82f6] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                        <Phone className="h-4 w-4" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); window.location.href = `mailto:${lead.cliente?.email}`; }}
                        className="h-8 w-8 flex items-center justify-center rounded-full text-gray-400 hover:text-[#3b82f6] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                        <Mail className="h-4 w-4" />
                    </button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <button className="h-8 w-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-surface-dark border-gray-200 dark:border-gray-700">
                            <DropdownMenuItem onClick={onClick} className="cursor-pointer">
                                <span className="material-symbols-outlined text-[18px] mr-2">visibility</span>
                                Ver ficha
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                                <MessageCircle className="h-4 w-4 mr-2" />
                                WhatsApp
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    )
}
