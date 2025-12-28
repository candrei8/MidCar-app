"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
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
    CheckCircle2
} from "lucide-react"
import { mockLeads, mockUsers } from "@/lib/mock-data"
import { formatRelativeTime, formatCurrency, cn } from "@/lib/utils"
import { ESTADOS_LEAD, PRIORIDADES_LEAD } from "@/lib/constants"
import type { Lead } from "@/types"
import { LeadDetailModal, StatusBadge } from "@/components/crm"

export default function CRMPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [estadoFilter, setEstadoFilter] = useState<string>("todos")
    const [prioridadFilter, setPrioridadFilter] = useState<string>("todos")
    const [vendedorFilter, setVendedorFilter] = useState<string>("todos")
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

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

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">CRM</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Gestión avanzada de leads y oportunidades comerciales.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2 h-10 border-dashed">
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Exportar Datos</span>
                    </Button>
                    <Button className="gap-2 h-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all hover:scale-[1.02]">
                        <Plus className="h-4 w-4" />
                        <span>Nuevo Lead</span>
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatsCard 
                    title="Total Leads" 
                    value={stats.total} 
                    icon={Users} 
                    trend="+12% vs mes anterior"
                    color="blue"
                />
                <StatsCard 
                    title="Nuevos" 
                    value={stats.nuevos} 
                    icon={TrendingUp} 
                    trend="+4 hoy"
                    color="indigo"
                />
                <StatsCard 
                    title="En Negociación" 
                    value={stats.enProceso} 
                    icon={Clock} 
                    trend="8 activos"
                    color="orange"
                />
                <StatsCard 
                    title="Ventas Cerradas" 
                    value={stats.vendidos} 
                    icon={CheckCircle2} 
                    trend="+2 esta semana"
                    color="emerald"
                />
            </div>

            {/* Main Content Area */}
            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm ring-1 ring-border/50">
                <div className="p-6 space-y-6">
                    {/* Toolbar / Filters */}
                    <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-background/50 p-4 rounded-lg border border-border/50">
                        <div className="relative w-full lg:w-96 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                            <Input
                                placeholder="Buscar por cliente, vehículo..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-background border-border/60 focus-visible:ring-primary/20 transition-all"
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                                <SelectTrigger className="w-full sm:w-[160px] bg-background border-border/60">
                                    <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                    <SelectValue placeholder="Estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos los estados</SelectItem>
                                    {ESTADOS_LEAD.map(estado => (
                                        <SelectItem key={estado.value} value={estado.value}>
                                            {estado.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={prioridadFilter} onValueChange={setPrioridadFilter}>
                                <SelectTrigger className="w-full sm:w-[140px] bg-background border-border/60">
                                    <SelectValue placeholder="Prioridad" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todas</SelectItem>
                                    {PRIORIDADES_LEAD.map(p => (
                                        <SelectItem key={p.value} value={p.value}>
                                            {p.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={vendedorFilter} onValueChange={setVendedorFilter}>
                                <SelectTrigger className="w-full sm:w-[160px] bg-background border-border/60">
                                    <SelectValue placeholder="Vendedor" />
                                </SelectTrigger>
                                <SelectContent>
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

                    {/* Table */}
                    <div className="rounded-md border border-border/50 overflow-hidden bg-background">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead className="w-[120px] font-semibold text-xs uppercase tracking-wider text-muted-foreground/80">Fecha</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/80">Cliente</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground/80">Vehículo</TableHead>
                                    <TableHead className="w-[160px] font-semibold text-xs uppercase tracking-wider text-muted-foreground/80">Estado</TableHead>
                                    <TableHead className="w-[120px] font-semibold text-xs uppercase tracking-wider text-muted-foreground/80">Prioridad</TableHead>
                                    <TableHead className="w-[180px] font-semibold text-xs uppercase tracking-wider text-muted-foreground/80">Asignado a</TableHead>
                                    <TableHead className="w-[80px] text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground/80">Acción</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLeads.map((lead) => (
                                    <TableRow
                                        key={lead.id}
                                        className="group cursor-pointer hover:bg-muted/30 transition-colors border-b border-border/50 last:border-0"
                                        onClick={() => setSelectedLead(lead)}
                                    >
                                        <TableCell className="text-sm text-muted-foreground font-medium whitespace-nowrap">
                                            {formatRelativeTime(lead.fecha_creacion)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                                    {lead.cliente?.nombre} {lead.cliente?.apellidos}
                                                </span>
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Mail className="h-3 w-3" />
                                                    <span className="truncate max-w-[140px]">{lead.cliente?.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {lead.vehiculo ? (
                                                <div className="flex items-center gap-2.5">
                                                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                                                        <Car className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-medium text-sm leading-none">
                                                            {lead.vehiculo.marca} {lead.vehiculo.modelo}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatCurrency(lead.vehiculo.precio_venta)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="align-middle">
                                            <StatusBadge 
                                                status={lead.estado} 
                                                label={ESTADOS_LEAD.find(e => e.value === lead.estado)?.label}
                                            />
                                        </TableCell>
                                        <TableCell className="align-middle">
                                            <StatusBadge 
                                                status={lead.prioridad} 
                                                type="priority"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {lead.vendedor ? (
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-7 w-7 border border-border">
                                                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                                            {getInitials(lead.vendedor.nombre, lead.vendedor.apellidos)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm font-medium text-muted-foreground">
                                                        {lead.vendedor.nombre}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-muted-foreground italic">Sin asignar</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => setSelectedLead(lead)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Ver ficha completa
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Phone className="mr-2 h-4 w-4" />
                                                        Llamar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Mail className="mr-2 h-4 w-4" />
                                                        Enviar email
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <MessageCircle className="mr-2 h-4 w-4" />
                                                        WhatsApp
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem>
                                                        <Calendar className="mr-2 h-4 w-4" />
                                                        Programar cita
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {filteredLeads.length === 0 && (
                            <div className="p-16 text-center">
                                <div className="bg-muted/30 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="h-8 w-8 text-muted-foreground/50" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground mb-2">No se encontraron resultados</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto">
                                    No hay leads que coincidan con los filtros seleccionados. Intenta limpiar la búsqueda.
                                </p>
                                <Button 
                                    variant="outline" 
                                    className="mt-6"
                                    onClick={() => {
                                        setSearchQuery("")
                                        setEstadoFilter("todos")
                                        setPrioridadFilter("todos")
                                        setVendedorFilter("todos")
                                    }}
                                >
                                    Limpiar filtros
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* Lead Detail Modal */}
            {selectedLead && (
                <LeadDetailModal
                    lead={selectedLead}
                    open={!!selectedLead}
                    onClose={() => setSelectedLead(null)}
                />
            )}
        </div>
    )
}

function StatsCard({ title, value, icon: Icon, trend, color }: { title: string, value: number, icon: any, trend: string, color: string }) {
    const colorStyles = {
        blue: "text-blue-500 bg-blue-500/10",
        indigo: "text-indigo-500 bg-indigo-500/10",
        orange: "text-orange-500 bg-orange-500/10",
        emerald: "text-emerald-500 bg-emerald-500/10",
    }
    const colorClass = colorStyles[color as keyof typeof colorStyles] || colorStyles.blue

    return (
        <Card className="border-none shadow-lg bg-card/80 backdrop-blur-sm hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <h3 className="text-3xl font-bold mt-2 text-foreground">{value}</h3>
                    </div>
                    <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", colorClass)}>
                        <Icon className="h-6 w-6" />
                    </div>
                </div>
                <div className="mt-4 flex items-center text-xs">
                    <span className="text-emerald-500 font-medium flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {trend}
                    </span>
                    <span className="text-muted-foreground/60 ml-2">vs último periodo</span>
                </div>
            </CardContent>
        </Card>
    )
}