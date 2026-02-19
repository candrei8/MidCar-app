"use client"

import { useState, useEffect, useCallback, useRef, memo, useMemo } from "react"
import dynamic from 'next/dynamic'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Phone, Mail, MessageCircle, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { formatCurrency, cn } from "@/lib/utils"
import type { Lead } from "@/types"
import { StatusBadge } from "@/components/crm"
import { getLeadsPage, deleteLead as deleteLeadFromDB } from "@/lib/supabase-service"

const LeadDetailModal = dynamic(() => import('@/components/crm/LeadDetailModal').then(m => ({ default: m.LeadDetailModal })), { ssr: false })
const NewLeadModal = dynamic(() => import('@/components/crm/NewLeadModal').then(m => ({ default: m.NewLeadModal })), { ssr: false })

const PAGE_SIZE = 50

type FilterType = 'todos' | 'nuevos' | 'enProceso' | 'vendidos' | 'perdidos'

export default function CRMPage() {
    const { addToast } = useToast()
    const [leads, setLeads] = useState<Lead[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<FilterType>("todos")
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
    const [showNewLeadModal, setShowNewLeadModal] = useState(false)
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const loadLeads = useCallback(async (p: number, search: string, filter: string) => {
        setIsLoading(true)
        try {
            const result = await getLeadsPage({ page: p, pageSize: PAGE_SIZE, search, statusFilter: filter })
            setLeads(result.data)
            setTotal(result.total)
        } catch (e) {
            console.error(e)
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Debounce search
    useEffect(() => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
        searchTimerRef.current = setTimeout(() => {
            setDebouncedSearch(searchQuery)
            setPage(0)
        }, 400)
        return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current) }
    }, [searchQuery])

    // Reload on filter/page change
    useEffect(() => {
        loadLeads(page, debouncedSearch, statusFilter)
    }, [page, debouncedSearch, statusFilter, loadLeads])

    const handleFilterChange = (f: FilterType) => {
        setStatusFilter(f)
        setPage(0)
    }

    const handleStatusChange = (leadId: string, newStatus: string) => {
        setLeads(prev => prev.map(l =>
            l.id === leadId ? { ...l, estado: newStatus as Lead['estado'] } : l
        ))
        if (selectedLead?.id === leadId) {
            setSelectedLead(prev => prev ? { ...prev, estado: newStatus as Lead['estado'] } : null)
        }
    }

    const handleDeleteLead = (leadId: string) => {
        setLeads(prev => prev.filter(l => l.id !== leadId))
        setTotal(prev => prev - 1)
        if (selectedLead?.id === leadId) setSelectedLead(null)
    }

    const totalPages = Math.ceil(total / PAGE_SIZE)

    const getInitials = useCallback((nombre: string, apellidos: string) => {
        return `${nombre.charAt(0)}${apellidos.charAt(0)}`.toUpperCase()
    }, [])

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

    const filterLabels: Record<FilterType, string> = {
        todos: `Todos (${total.toLocaleString()})`,
        nuevos: 'Nuevos',
        enProceso: 'En Proceso',
        vendidos: 'Vendidos',
        perdidos: 'Perdidos',
    }

    const filterColors: Record<FilterType, { active: string, inactive: string }> = {
        todos: { active: 'bg-[#135bec] text-white shadow-blue-500/30', inactive: 'bg-white border border-gray-200 text-slate-600 hover:border-[#135bec]/50' },
        nuevos: { active: 'bg-blue-500 text-white', inactive: 'bg-white border border-gray-200 text-slate-600' },
        enProceso: { active: 'bg-amber-500 text-white', inactive: 'bg-white border border-gray-200 text-slate-600' },
        vendidos: { active: 'bg-green-500 text-white', inactive: 'bg-white border border-gray-200 text-slate-600' },
        perdidos: { active: 'bg-slate-500 text-white', inactive: 'bg-white border border-gray-200 text-slate-600' },
    }

    return (
        <div className="min-h-screen bg-[#f6f6f8] flex flex-col">
            {/* Sticky Header */}
            <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Gestión Comercial</h1>
                        {!isLoading && (
                            <span className="text-sm text-slate-500">{total.toLocaleString()} leads</span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
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
                            placeholder="Buscar cliente..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Filter Chips */}
                <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar items-center md:px-6">
                    {(Object.keys(filterLabels) as FilterType[]).map(f => (
                        <button
                            key={f}
                            onClick={() => handleFilterChange(f)}
                            className={cn(
                                "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 h-9 shadow-sm transition active:scale-95 text-sm font-medium",
                                statusFilter === f ? filterColors[f].active : filterColors[f].inactive
                            )}
                        >
                            {filterLabels[f]}
                        </button>
                    ))}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 px-4 py-4 pb-32 md:px-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="animate-spin h-8 w-8 border-2 border-[#135bec] border-t-transparent rounded-full" />
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col gap-3">
                            {leads.map((lead) => (
                                <LeadCard
                                    key={lead.id}
                                    lead={lead}
                                    getStatusConfig={getStatusConfig}
                                    getPriorityConfig={getPriorityConfig}
                                    getInitials={getInitials}
                                    onClick={() => setSelectedLead(lead)}
                                    onDelete={handleDeleteLead}
                                />
                            ))}
                        </div>

                        {leads.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">search_off</span>
                                <h3 className="text-lg font-semibold text-gray-600 mb-1">No se encontraron leads</h3>
                                <p className="text-sm text-gray-400">Intenta ajustar los filtros</p>
                                <button
                                    onClick={() => { setSearchQuery(""); setStatusFilter("todos"); }}
                                    className="mt-4 px-4 py-2 text-sm font-medium text-[#135bec] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                    Limpiar filtros
                                </button>
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 shadow-sm p-4 mt-4">
                                <p className="text-sm text-slate-500">
                                    {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total.toLocaleString()}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(0, p - 1))}
                                        disabled={page === 0}
                                        className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <span className="text-sm font-medium">{page + 1} / {totalPages}</span>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                        disabled={page >= totalPages - 1}
                                        className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Mobile FAB */}
            <button
                onClick={() => setShowNewLeadModal(true)}
                className="md:hidden fixed bottom-24 right-4 z-20 flex items-center justify-center w-14 h-14 bg-[#135bec] text-white rounded-full shadow-lg shadow-blue-500/40 hover:bg-blue-600 transition-all active:scale-95"
            >
                <span className="material-symbols-outlined text-[28px]">add</span>
            </button>

            {selectedLead && (
                <LeadDetailModal
                    lead={selectedLead}
                    open={!!selectedLead}
                    onClose={() => setSelectedLead(null)}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDeleteLead}
                />
            )}

            <NewLeadModal
                open={showNewLeadModal}
                onClose={() => {
                    setShowNewLeadModal(false)
                    loadLeads(0, debouncedSearch, statusFilter)
                }}
            />
        </div>
    )
}

// Lead Card Component - memoizado
const LeadCard = memo(function LeadCard({ lead, getStatusConfig, getPriorityConfig, getInitials, onClick, onDelete }: {
    lead: Lead,
    getStatusConfig: (estado: string) => { bg: string, text: string, icon: string },
    getPriorityConfig: (prioridad: string) => { color: string, label: string },
    getInitials: (nombre: string, apellidos: string) => string,
    onClick: () => void,
    onDelete: (leadId: string) => void
}) {
    const statusConfig = useMemo(() => getStatusConfig(lead.estado), [getStatusConfig, lead.estado])
    const priorityConfig = useMemo(() => getPriorityConfig(lead.prioridad), [getPriorityConfig, lead.prioridad])

    const nombre = lead.cliente?.nombre || lead.cliente_nombre || 'N'
    const apellidos = lead.cliente?.apellidos || lead.cliente_apellidos || 'A'
    const email = lead.cliente?.email || lead.cliente_email || ''
    const telefono = lead.cliente?.telefono || lead.cliente_telefono || ''

    return (
        <div
            onClick={onClick}
            className="relative bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:border-gray-200 will-change-transform"
            style={{ transition: 'box-shadow 0.15s ease, border-color 0.15s ease' }}
        >
            <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar className="h-10 w-10 shrink-0 ring-2 ring-gray-100">
                            <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-[#135bec] to-blue-600 text-white">
                                {getInitials(nombre, apellidos)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900 truncate">{nombre} {apellidos}</p>
                            <p className="text-xs text-slate-500 truncate">{email || telefono}</p>
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

                <div className="flex items-center justify-between">
                    <span className={cn("flex items-center gap-1 text-xs", priorityConfig.color)}>
                        <span className="material-symbols-outlined text-[14px]">flag</span>
                        {priorityConfig.label}
                    </span>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); if (telefono) window.location.href = `tel:${telefono}` }}
                            className="h-8 w-8 flex items-center justify-center rounded-full text-slate-400 hover:text-[#135bec] hover:bg-blue-50 transition-colors"
                        >
                            <Phone className="h-4 w-4" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); if (email) window.location.href = `mailto:${email}` }}
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
                                    <span className="material-symbols-outlined text-[18px] mr-2">visibility</span>Ver ficha
                                </DropdownMenuItem>
                                {telefono && (
                                    <DropdownMenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${telefono.replace(/\D/g, '')}`, '_blank') }}>
                                        <MessageCircle className="h-4 w-4 mr-2" />WhatsApp
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                    onClick={async (e) => {
                                        e.stopPropagation()
                                        if (window.confirm('¿Eliminar este lead?')) {
                                            const success = await deleteLeadFromDB(lead.id)
                                            if (success) onDelete(lead.id)
                                        }
                                    }}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />Eliminar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </div>
    )
})
