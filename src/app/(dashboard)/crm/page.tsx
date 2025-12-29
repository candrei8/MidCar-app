"use client"

import { useState } from "react"
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Search,
    Filter,
    MoreHorizontal,
    Phone,
    Mail,
    MessageCircle,
    Eye,
    Calendar,
    Download,
    Plus,
    Car,
    Users,
    TrendingUp,
    Clock,
    CheckCircle2,
    SlidersHorizontal
} from "lucide-react"
import { mockLeads, mockUsers } from "@/lib/mock-data"
import { formatRelativeTime, formatCurrency, cn } from "@/lib/utils"
import { ESTADOS_LEAD, PRIORIDADES_LEAD } from "@/lib/constants"
import type { Lead } from "@/types"
import { LeadDetailModal, StatusBadge, NewLeadModal } from "@/components/crm"

export default function CRMPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [estadoFilter, setEstadoFilter] = useState<string>("todos")
    const [prioridadFilter, setPrioridadFilter] = useState<string>("todos")
    const [vendedorFilter, setVendedorFilter] = useState<string>("todos")
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
    const [showNewLeadModal, setShowNewLeadModal] = useState(false)

    // Filter leads
    const filteredLeads = mockLeads.filter(lead => {
        const matchesSearch =
            lead.cliente?.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.cliente?.apellidos?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.vehiculo?.marca?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.vehiculo?.modelo?.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesEstado = estadoFilter === "todos" || lead.estado === estadoFilter
        const matchesPrioridad = prioridadFilter === "todos" || lead.prioridad === prioridadFilter
        const matchesVendedor = vendedorFilter === "todos" || lead.asignado_a === vendedorFilter

        return matchesSearch && matchesEstado && matchesPrioridad && matchesVendedor
    })

    // Stats
    const stats = {
        total: mockLeads.length,
        nuevos: mockLeads.filter(l => l.estado === 'nuevo').length,
        enProceso: mockLeads.filter(l => !['nuevo', 'vendido', 'perdido'].includes(l.estado)).length,
        vendidos: mockLeads.filter(l => l.estado === 'vendido').length,
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
            alert("Hubo un error al generar el reporte.")
        }
    }

    return (
        <div className="space-y-10 animate-in">
            {/* Header Section - Clean & Minimal */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-2 border-b border-white/5">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                        Gestión Comercial
                    </h1>
                    <p className="text-muted-foreground text-lg font-light">
                        Vista unificada de oportunidades y rendimiento.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        className="btn-ghost-luxury gap-2"
                        onClick={handleExport}
                    >
                        <Download className="h-4 w-4" />
                        <span>Reporte</span>
                    </Button>
                    <Button 
                        className="btn-luxury gap-2 px-6"
                        onClick={() => setShowNewLeadModal(true)}
                    >
                        <Plus className="h-4 w-4" />
                        <span>Nuevo Lead</span>
                    </Button>
                </div>
            </div>

            {/* Stats Overview - Floating & Minimal */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 px-2">
                <MinimalStat 
                    label="Total Oportunidades" 
                    value={stats.total} 
                    trend="+12%" 
                    trendUp={true}
                />
                <MinimalStat 
                    label="Nuevos Leads" 
                    value={stats.nuevos} 
                    trend="+4" 
                    trendUp={true}
                    highlight
                />
                <MinimalStat 
                    label="En Negociación" 
                    value={stats.enProceso} 
                    trend="8 activos" 
                    trendUp={null}
                />
                <MinimalStat 
                    label="Ventas Cerradas" 
                    value={stats.vendidos} 
                    trend="+2" 
                    trendUp={true}
                />
            </div>

            {/* Main Content Area - Unified Glass Container */}
            <div className="card-luxury p-0 overflow-hidden min-h-[600px] flex flex-col">
                {/* Unified Toolbar */}
                <div className="p-5 border-b border-white/5 bg-white/[0.02] flex flex-col lg:flex-row gap-4 justify-between items-center backdrop-blur-sm sticky top-0 z-10">
                    <div className="relative w-full lg:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary z-10" />
                        <Input
                            placeholder="Buscar cliente, marca, modelo..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-luxury pl-12 w-full"
                        />
                    </div>
                    
                    <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
                        <FilterSelect 
                            value={estadoFilter} 
                            onChange={setEstadoFilter} 
                            placeholder="Estado" 
                            icon={Filter}
                            options={ESTADOS_LEAD}
                        />
                        <FilterSelect 
                            value={prioridadFilter} 
                            onChange={setPrioridadFilter} 
                            placeholder="Prioridad" 
                            icon={SlidersHorizontal}
                            options={PRIORIDADES_LEAD}
                        />
                        <Select value={vendedorFilter} onValueChange={setVendedorFilter}>
                            <SelectTrigger className="w-[160px] input-luxury border-0 bg-white/5 hover:bg-white/10">
                                <Users className="h-3.5 w-3.5 mr-2 opacity-70" />
                                <SelectValue placeholder="Vendedor" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                                <SelectItem value="todos">Todos</SelectItem>
                                {mockUsers.filter(u => u.rol === 'vendedor').map(user => (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.nombre} {user.apellidos}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Table Content */}
                <div className="flex-1 overflow-auto">
                    <Table className="table-luxury w-full">
                        <TableHeader>
                            <TableRow className="border-b border-white/5 hover:bg-transparent">
                                <TableHead className="pl-6 w-[140px]">Fecha</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Vehículo</TableHead>
                                <TableHead className="w-[180px]">Estado</TableHead>
                                <TableHead className="w-[140px]">Prioridad</TableHead>
                                <TableHead className="w-[180px]">Asignado</TableHead>
                                <TableHead className="w-[80px] text-right pr-6">Acción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLeads.map((lead) => (
                                <TableRow
                                    key={lead.id}
                                    className="group cursor-pointer border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-all duration-300"
                                    onClick={() => setSelectedLead(lead)}
                                >
                                    <TableCell className="pl-6 text-muted-foreground font-medium text-xs">
                                        {formatRelativeTime(lead.fecha_creacion)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col py-1">
                                            <span className="text-sm font-medium text-white/90 group-hover:text-primary transition-colors">
                                                {lead.cliente?.nombre} {lead.cliente?.apellidos}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground font-light tracking-wide mt-0.5">
                                                {lead.cliente?.email}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {lead.vehiculo ? (
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                                                    <Car className="h-4 w-4 text-white/60" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-semibold text-white/80">
                                                        {lead.vehiculo.marca} {lead.vehiculo.modelo}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {formatCurrency(lead.vehiculo.precio_venta)}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge 
                                            status={lead.estado} 
                                            className="bg-transparent border-0 ring-1 ring-white/10"
                                            label={ESTADOS_LEAD.find(e => e.value === lead.estado)?.label}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge 
                                            status={lead.prioridad} 
                                            type="priority"
                                            className="bg-transparent border-0 opacity-90"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {lead.vendedor ? (
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6 ring-1 ring-white/10">
                                                    <AvatarFallback className="text-[9px] bg-gradient-to-br from-neutral-800 to-neutral-900 text-white/70">
                                                        {getInitials(lead.vendedor.nombre, lead.vendedor.apellidos)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs text-white/60">
                                                    {lead.vendedor.nombre}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic opacity-50">--</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 bg-[#1a1a1a] border-white/10 text-white">
                                                <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">Acciones</DropdownMenuLabel>
                                                <DropdownMenuSeparator className="bg-white/10" />
                                                <DropdownMenuItem onClick={() => setSelectedLead(lead)} className="hover:bg-white/5 cursor-pointer">
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    Ver ficha completa
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="hover:bg-white/5 cursor-pointer">
                                                    <Phone className="mr-2 h-4 w-4" />
                                                    Llamar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="hover:bg-white/5 cursor-pointer">
                                                    <Mail className="mr-2 h-4 w-4" />
                                                    Enviar email
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="hover:bg-white/5 cursor-pointer">
                                                    <MessageCircle className="mr-2 h-4 w-4" />
                                                    WhatsApp
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {filteredLeads.length === 0 && (
                        <div className="h-64 flex flex-col items-center justify-center text-center p-8">
                            <div className="h-16 w-16 rounded-full bg-white/[0.02] flex items-center justify-center mb-4 ring-1 ring-white/5">
                                <Search className="h-6 w-6 text-muted-foreground/40" />
                            </div>
                            <h3 className="text-lg font-medium text-white/80 mb-1">Sin resultados</h3>
                            <p className="text-sm text-muted-foreground max-w-xs">
                                No encontramos leads con los filtros actuales.
                            </p>
                            <Button 
                                variant="link" 
                                className="text-primary mt-2"
                                onClick={() => {
                                    setSearchQuery("")
                                    setEstadoFilter("todos")
                                    setPrioridadFilter("todos")
                                    setVendedorFilter("todos")
                                }}
                            >
                                Limpiar todos los filtros
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Lead Detail Modal */}
            {selectedLead && (
                <LeadDetailModal
                    lead={selectedLead}
                    open={!!selectedLead}
                    onClose={() => setSelectedLead(null)}
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

function MinimalStat({ label, value, trend, trendUp, highlight = false }: { 
    label: string, 
    value: number, 
    trend?: string, 
    trendUp?: boolean | null,
    highlight?: boolean 
}) {
    return (
        <div className={cn(
            "flex flex-col gap-1 p-4 rounded-xl transition-all duration-300",
            highlight ? "bg-white/[0.03] border border-white/5" : "hover:bg-white/[0.01]"
        )}>
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                {label}
            </span>
            <div className="flex items-baseline gap-3">
                <span className={cn(
                    "text-3xl font-light tracking-tight",
                    highlight ? "text-primary drop-shadow-[0_0_15px_rgba(220,38,38,0.3)]" : "text-white"
                )}>
                    {value}
                </span>
                {trend && (
                    <span className={cn(
                        "text-xs font-medium flex items-center gap-0.5",
                        trendUp === true ? "text-emerald-500" : trendUp === false ? "text-rose-500" : "text-amber-500"
                    )}>
                        {trendUp === true ? <TrendingUp className="h-3 w-3" /> : null}
                        {trend}
                    </span>
                )}
            </div>
        </div>
    )
}

function FilterSelect({ value, onChange, placeholder, icon: Icon, options }: any) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-[160px] input-luxury border-0 bg-white/5 hover:bg-white/10">
                <Icon className="h-3.5 w-3.5 mr-2 opacity-70" />
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                <SelectItem value="todos">Todos</SelectItem>
                {options.map((opt: any) => (
                    <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}