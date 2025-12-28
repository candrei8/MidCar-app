"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
    Users
} from "lucide-react"
import { mockLeads, mockUsers } from "@/lib/mock-data"
import { formatRelativeTime, formatCurrency, cn } from "@/lib/utils"
import { ESTADOS_LEAD, PRIORIDADES_LEAD } from "@/lib/constants"
import type { Lead } from "@/types"
import { LeadDetailModal } from "@/components/crm/LeadDetailModal"

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
        <div className="space-y-6 animate-in">
            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">CRM - Gestión de Leads</h1>
                    <p className="text-muted-foreground">
                        Gestiona los leads de la web y otros canales
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        Exportar
                    </Button>
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Nuevo Lead
                    </Button>
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="card-premium p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                            <p className="text-xs text-muted-foreground">Total leads</p>
                        </div>
                    </div>
                </Card>
                <Card className="card-premium p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{stats.nuevos}</p>
                            <p className="text-xs text-muted-foreground">Nuevos</p>
                        </div>
                    </div>
                </Card>
                <Card className="card-premium p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-warning" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{stats.enProceso}</p>
                            <p className="text-xs text-muted-foreground">En proceso</p>
                        </div>
                    </div>
                </Card>
                <Card className="card-premium p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-success" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{stats.vendidos}</p>
                            <p className="text-xs text-muted-foreground">Vendidos</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <Card className="card-premium">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                            <Input
                                placeholder="Buscar por nombre, vehículo..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                                <SelectTrigger className="w-[160px]">
                                    <Filter className="h-4 w-4 mr-2" />
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
                                <SelectTrigger className="w-[140px]">
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
                                <SelectTrigger className="w-[160px]">
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
                </CardContent>
            </Card>

            {/* Leads Table */}
            <Card className="card-premium overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-background hover:bg-background">
                            <TableHead className="w-[140px]">Fecha</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Vehículo de interés</TableHead>
                            <TableHead className="w-[140px]">Estado</TableHead>
                            <TableHead className="w-[100px]">Prioridad</TableHead>
                            <TableHead className="w-[150px]">Asignado a</TableHead>
                            <TableHead className="w-[100px] text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLeads.map((lead) => (
                            <TableRow
                                key={lead.id}
                                className="cursor-pointer"
                                onClick={() => setSelectedLead(lead)}
                            >
                                <TableCell className="text-muted-foreground">
                                    {formatRelativeTime(lead.fecha_creacion)}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-foreground">
                                            {lead.cliente?.nombre} {lead.cliente?.apellidos}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {lead.cliente?.email}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {lead.vehiculo ? (
                                        <div className="flex items-center gap-2">
                                            <Car className="h-4 w-4 text-muted-foreground" />
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {lead.vehiculo.marca} {lead.vehiculo.modelo}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatCurrency(lead.vehiculo.precio_venta)}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={lead.estado as 'nuevo' | 'contactado' | 'vendido'}>
                                        {ESTADOS_LEAD.find(e => e.value === lead.estado)?.label || lead.estado}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={lead.prioridad as 'alta' | 'media' | 'baja' | 'urgente'}>
                                        {lead.prioridad}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {lead.vendedor && (
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarFallback className="text-xs">
                                                    {getInitials(lead.vendedor.nombre, lead.vendedor.apellidos)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm">{lead.vendedor.nombre}</span>
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => setSelectedLead(lead)}>
                                                <Eye className="mr-2 h-4 w-4" />
                                                Ver detalle
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
                                                Programar seguimiento
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {filteredLeads.length === 0 && (
                    <div className="p-12 text-center">
                        <Users className="h-12 w-12 mx-auto text-muted mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">No se encontraron leads</h3>
                        <p className="text-muted-foreground">
                            Intenta ajustar los filtros de búsqueda
                        </p>
                    </div>
                )}
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
