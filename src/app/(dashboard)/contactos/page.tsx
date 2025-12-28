"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
    Download,
    Plus,
    Car,
    Users,
    UserPlus,
    UserCheck,
    Globe,
    ExternalLink,
    ArrowUpDown,
    Grid3X3,
} from "lucide-react"
import { mockContacts, mockVehicles } from "@/lib/mock-data"
import { formatDate, cn } from "@/lib/utils"
import { ORIGENES_CONTACTO, ESTADOS_BACKOFFICE, CATEGORIAS_CONTACTO } from "@/lib/constants"
import type { Contact } from "@/types"
import { NewContactModal } from "@/components/contacts/NewContactModal"
import { ContactDetailModal } from "@/components/contacts/ContactDetailModal"

type SortField = 'fecha_ultimo_contacto' | 'nombre' | 'progreso' | 'estado'
type SortDirection = 'asc' | 'desc'

export default function ContactosPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [origenFilter, setOrigenFilter] = useState<string>("todos")
    const [estadoFilter, setEstadoFilter] = useState<string>("todos")
    const [categoriaFilter, setCategoriaFilter] = useState<string>("todas")
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
    const [isNewContactOpen, setIsNewContactOpen] = useState(false)
    const [sortField, setSortField] = useState<SortField>('fecha_ultimo_contacto')
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

    // Enrich contacts with vehicle data
    const enrichedContacts = mockContacts.map(contact => ({
        ...contact,
        vehiculos: contact.vehiculos_interes
            .map(id => mockVehicles.find(v => v.id === id))
            .filter(Boolean)
    }))

    // Count contacts by estado
    const estadoCounts = useMemo(() => {
        const counts: Record<string, number> = {
            pendiente: 0,
            comunicado: 0,
            tramite: 0,
            reservado: 0,
            postventa: 0,
            busqueda: 0,
            cerrado: 0,
            todos: mockContacts.length,
        }
        mockContacts.forEach(contact => {
            if (counts[contact.estado] !== undefined) {
                counts[contact.estado]++
            }
        })
        return counts
    }, [])

    // Filter contacts
    const filteredContacts = useMemo(() => {
        let filtered = enrichedContacts.filter(contact => {
            const searchLower = searchQuery.toLowerCase()
            const matchesSearch =
                contact.telefono?.toLowerCase().includes(searchLower) ||
                contact.email?.toLowerCase().includes(searchLower) ||
                contact.nombre?.toLowerCase().includes(searchLower) ||
                contact.apellidos?.toLowerCase().includes(searchLower)

            const matchesOrigen = origenFilter === "todos" || contact.origen === origenFilter
            const matchesEstado = estadoFilter === "todos" || contact.estado === estadoFilter
            const matchesCategoria = categoriaFilter === "todas" || contact.categoria === categoriaFilter

            return matchesSearch && matchesOrigen && matchesEstado && matchesCategoria
        })

        // Sort
        filtered.sort((a, b) => {
            let comparison = 0
            switch (sortField) {
                case 'fecha_ultimo_contacto':
                    comparison = new Date(a.fecha_ultimo_contacto || a.fecha_registro).getTime() -
                        new Date(b.fecha_ultimo_contacto || b.fecha_registro).getTime()
                    break
                case 'nombre':
                    comparison = (a.nombre || '').localeCompare(b.nombre || '')
                    break
                case 'progreso':
                    comparison = (a.progreso || 0) - (b.progreso || 0)
                    break
                case 'estado':
                    comparison = a.estado.localeCompare(b.estado)
                    break
            }
            return sortDirection === 'asc' ? comparison : -comparison
        })

        return filtered
    }, [enrichedContacts, searchQuery, origenFilter, estadoFilter, categoriaFilter, sortField, sortDirection])

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('desc')
        }
    }

    const getOrigenIcon = (origen: string) => {
        switch (origen) {
            case 'web': return <Globe className="h-4 w-4" />
            case 'telefono': return <Phone className="h-4 w-4" />
            case 'whatsapp': return <MessageCircle className="h-4 w-4" />
            case 'presencial': return <UserCheck className="h-4 w-4" />
            case 'coches_net':
            case 'wallapop':
            case 'autocasion':
                return <ExternalLink className="h-4 w-4" />
            default: return <Users className="h-4 w-4" />
        }
    }

    const getEstadoColor = (estado: string) => {
        const estadoInfo = ESTADOS_BACKOFFICE.find(e => e.value === estado)
        return estadoInfo?.color || '#6b7280'
    }

    const getContactName = (contact: Contact) => {
        if (contact.nombre && contact.apellidos) {
            return `${contact.nombre} ${contact.apellidos}`
        }
        if (contact.nombre) {
            return contact.nombre
        }
        return contact.email.split('@')[0]
    }

    const getVehicleLabel = (contact: Contact) => {
        if (!contact.vehiculos || contact.vehiculos.length === 0) {
            return null
        }
        const v = contact.vehiculos[0]
        return `${v?.marca} ${v?.modelo} ${v?.matricula}`
    }

    return (
        <div className="space-y-6 animate-in relative">
            {/* Ambient glow effect */}
            <div className="ambient-glow" />

            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Contactos</h1>
                    <p className="text-xs text-white/30 mt-1 tracking-wide">
                        Gestiona todos los contactos de clientes potenciales
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="btn-ghost-luxury flex items-center gap-1.5">
                        <Download className="h-3.5 w-3.5" />
                        Exportar
                    </button>
                    <button className="btn-luxury flex items-center gap-1.5" onClick={() => setIsNewContactOpen(true)}>
                        <Plus className="h-3.5 w-3.5" />
                        Nuevo Contacto
                    </button>
                </div>
            </div>

            {/* Status filter badges - Luxury Pills */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setEstadoFilter("todos")}
                    className={cn(
                        "pill-luxury",
                        estadoFilter === "todos" ? "pill-luxury-active" : "pill-luxury-inactive"
                    )}
                >
                    <Grid3X3 className="h-3 w-3" />
                    Todos
                    <span className="opacity-50">({estadoCounts.todos})</span>
                </button>
                {ESTADOS_BACKOFFICE.map(estado => (
                    <button
                        key={estado.value}
                        onClick={() => setEstadoFilter(estado.value)}
                        className="pill-luxury transition-all duration-300"
                        style={{
                            backgroundColor: estadoFilter === estado.value ? `${estado.color}15` : 'rgba(255,255,255,0.02)',
                            borderColor: estadoFilter === estado.value ? `${estado.color}50` : 'rgba(255,255,255,0.06)',
                            color: estadoFilter === estado.value ? estado.color : 'rgba(255,255,255,0.4)',
                            boxShadow: estadoFilter === estado.value ? `0 0 20px ${estado.color}20` : 'none',
                        }}
                    >
                        {estado.label}
                        <span className="opacity-50">({estadoCounts[estado.value] || 0})</span>
                    </button>
                ))}
            </div>

            {/* Search & Filters - Luxury Glass */}
            <div className="card-luxury p-4">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25" />
                        <input
                            type="text"
                            placeholder="Buscar contactos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-luxury w-full pl-9"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Select value={origenFilter} onValueChange={setOrigenFilter}>
                            <SelectTrigger className="w-[150px] h-9 text-xs bg-black/40 border-white/[0.06]">
                                <Filter className="h-3 w-3 mr-2 opacity-50" />
                                <SelectValue placeholder="Origen" />
                            </SelectTrigger>
                            <SelectContent className="glass border-white/[0.06]">
                                <SelectItem value="todos">Todos los orígenes</SelectItem>
                                {ORIGENES_CONTACTO.map(origen => (
                                    <SelectItem key={origen.value} value={origen.value}>
                                        {origen.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                            <SelectTrigger className="w-[150px] h-9 text-xs bg-black/40 border-white/[0.06]">
                                <SelectValue placeholder="Categoría" />
                            </SelectTrigger>
                            <SelectContent className="glass border-white/[0.06]">
                                <SelectItem value="todas">Todas las categorías</SelectItem>
                                {CATEGORIAS_CONTACTO.map(cat => (
                                    <SelectItem key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Contacts Table - Luxury Design */}
            <div className="card-luxury overflow-hidden">
                <Table className="table-luxury">
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[160px]">Vehículo</TableHead>
                            <TableHead
                                className="cursor-pointer hover:text-white/50 transition-colors"
                                onClick={() => handleSort('nombre')}
                            >
                                <div className="flex items-center gap-1.5">
                                    Cliente
                                    <ArrowUpDown className="h-2.5 w-2.5 opacity-50" />
                                </div>
                            </TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead
                                className="w-[90px] cursor-pointer hover:text-white/50 transition-colors"
                                onClick={() => handleSort('progreso')}
                            >
                                <div className="flex items-center gap-1.5">
                                    Progreso
                                    <ArrowUpDown className="h-2.5 w-2.5 opacity-50" />
                                </div>
                            </TableHead>
                            <TableHead
                                className="w-[100px] cursor-pointer hover:text-white/50 transition-colors"
                                onClick={() => handleSort('fecha_ultimo_contacto')}
                            >
                                <div className="flex items-center gap-1.5">
                                    Último
                                    <ArrowUpDown className="h-2.5 w-2.5 opacity-50" />
                                </div>
                            </TableHead>
                            <TableHead
                                className="w-[100px] cursor-pointer hover:text-white/50 transition-colors"
                                onClick={() => handleSort('estado')}
                            >
                                <div className="flex items-center gap-1.5">
                                    Estado
                                    <ArrowUpDown className="h-2.5 w-2.5 opacity-50" />
                                </div>
                            </TableHead>
                            <TableHead className="w-[90px]">Categoría</TableHead>
                            <TableHead>Asunto</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredContacts.map((contact) => (
                            <TableRow
                                key={contact.id}
                                className="cursor-pointer group"
                                onClick={() => setSelectedContact(contact as Contact)}
                            >
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Car className="h-3.5 w-3.5 text-white/25" />
                                        <span className="text-white/60 group-hover:text-white/80 transition-colors">
                                            {getVehicleLabel(contact as Contact) || 'Sin vehículo'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-white/75 font-medium group-hover:text-white transition-colors">
                                        {getContactName(contact as Contact)}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className="text-white/50">{contact.telefono}</span>
                                </TableCell>
                                <TableCell>
                                    <span className="text-white/35">{contact.email}</span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="progress-luxury">
                                            <div
                                                className="progress-luxury-fill"
                                                style={{ width: `${contact.progreso || 0}%` }}
                                            />
                                        </div>
                                        <span className="text-white/30 text-[10px]">
                                            {contact.progreso || 0}%
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-white/35">
                                    {formatDate(contact.fecha_ultimo_contacto || contact.fecha_registro)}
                                </TableCell>
                                <TableCell>
                                    <span
                                        className="status-badge-luxury"
                                        style={{
                                            backgroundColor: `${getEstadoColor(contact.estado)}15`,
                                            color: getEstadoColor(contact.estado),
                                            boxShadow: `0 0 12px ${getEstadoColor(contact.estado)}20`,
                                        }}
                                    >
                                        {ESTADOS_BACKOFFICE.find(e => e.value === contact.estado)?.label || contact.estado}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className="text-white/40">
                                        {CATEGORIAS_CONTACTO.find(c => c.value === contact.categoria)?.label || '-'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className="text-white/30 max-w-[140px] truncate block">
                                        {contact.asunto || '-'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/[0.05]">
                                                <MoreHorizontal className="h-3.5 w-3.5 text-white/40" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="glass border-white/[0.06]">
                                            <DropdownMenuLabel className="text-xs text-white/50">Acciones</DropdownMenuLabel>
                                            <DropdownMenuSeparator className="bg-white/[0.04]" />
                                            <DropdownMenuItem onClick={() => setSelectedContact(contact as Contact)} className="text-xs hover:bg-white/[0.04]">
                                                <Eye className="mr-2 h-3.5 w-3.5" />
                                                Ver detalle
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-xs hover:bg-white/[0.04]">
                                                <Phone className="mr-2 h-3.5 w-3.5" />
                                                Llamar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-xs hover:bg-white/[0.04]">
                                                <Mail className="mr-2 h-3.5 w-3.5" />
                                                Enviar email
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-xs hover:bg-white/[0.04]">
                                                <MessageCircle className="mr-2 h-3.5 w-3.5" />
                                                WhatsApp
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {filteredContacts.length === 0 && (
                    <div className="p-12 text-center">
                        <Users className="h-10 w-10 mx-auto text-white/10 mb-4" />
                        <h3 className="text-sm font-medium text-white/60 mb-1">No se encontraron contactos</h3>
                        <p className="text-xs text-white/30">
                            Intenta ajustar los filtros de búsqueda
                        </p>
                    </div>
                )}

                {/* Footer with count */}
                <div className="px-4 py-3 border-t border-white/[0.04]">
                    <p className="text-[11px] text-white/30">
                        Mostrando {filteredContacts.length} de {mockContacts.length} contactos
                    </p>
                </div>
            </div>

            {/* New Contact Modal */}
            <NewContactModal
                open={isNewContactOpen}
                onClose={() => setIsNewContactOpen(false)}
                onContactCreated={(contact) => {
                    setIsNewContactOpen(false)
                    setSelectedContact(contact)
                }}
            />

            {/* Contact Detail Modal */}
            {
                selectedContact && (
                    <ContactDetailModal
                        contact={selectedContact}
                        open={!!selectedContact}
                        onClose={() => setSelectedContact(null)}
                    />
                )
            }
        </div >
    )
}
