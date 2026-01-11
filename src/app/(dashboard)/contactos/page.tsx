"use client"

import { useState, useMemo, useEffect } from "react"
import { mockVehicles } from "@/lib/mock-data"
import { formatDate, cn } from "@/lib/utils"
import { ORIGENES_CONTACTO, ESTADOS_BACKOFFICE } from "@/lib/constants"
import type { Contact } from "@/types"
import { NewContactModal } from "@/components/contacts/NewContactModal"
import { ContactDetailModal } from "@/components/contacts/ContactDetailModal"
import { useFilteredData } from "@/hooks/useFilteredData"

type FilterType = 'todos' | 'nuevos' | 'enProceso' | 'cerrados'

// Estados que pertenecen a cada categoría de filtro
const FILTER_GROUPS = {
    nuevos: ['pendiente'],
    enProceso: ['comunicado', 'tramite', 'reservado', 'postventa', 'busqueda'],
    cerrados: ['cerrado'],
}

export default function ContactosPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [estadoFilter, setEstadoFilter] = useState<FilterType>("todos")
    const [origenFilter, setOrigenFilter] = useState<string>("todos")
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
    const [isNewContactOpen, setIsNewContactOpen] = useState(false)

    // Obtener contactos filtrados por usuario (Mi Vista / Visión Completa)
    const { contacts: userFilteredContacts, isFullView } = useFilteredData()

    // Estado local para gestionar contactos (permite modificar estados)
    const [contacts, setContacts] = useState<Contact[]>(userFilteredContacts)

    // Sincronizar cuando cambie la vista (Mi Vista / Visión Completa)
    useEffect(() => {
        setContacts(userFilteredContacts)
    }, [userFilteredContacts])

    // Handler para actualizar el estado de un contacto
    const handleStatusChange = (contactId: string, newStatus: string) => {
        setContacts(prev => prev.map(c =>
            c.id === contactId
                ? { ...c, estado: newStatus as Contact['estado'], updated_at: new Date().toISOString() }
                : c
        ))
        // También actualizar el contacto seleccionado si es el mismo
        if (selectedContact?.id === contactId) {
            setSelectedContact(prev => prev ? { ...prev, estado: newStatus as Contact['estado'] } : null)
        }
    }

    // Enrich contacts with vehicle data
    const enrichedContacts = contacts.map(contact => ({
        ...contact,
        vehiculos: contact.vehiculos_interes
            .map(id => mockVehicles.find(v => v.id === id))
            .filter(Boolean)
    }))

    // Filter contacts - usando los grupos de estados
    const filteredContacts = useMemo(() => {
        return enrichedContacts.filter(contact => {
            const searchLower = searchQuery.toLowerCase()
            const matchesSearch =
                contact.telefono?.toLowerCase().includes(searchLower) ||
                contact.email?.toLowerCase().includes(searchLower) ||
                contact.nombre?.toLowerCase().includes(searchLower) ||
                contact.apellidos?.toLowerCase().includes(searchLower)

            const matchesOrigen = origenFilter === "todos" || contact.origen === origenFilter

            // Filtrar por grupo de estados
            let matchesEstado = true
            if (estadoFilter !== "todos") {
                const allowedStates = FILTER_GROUPS[estadoFilter as keyof typeof FILTER_GROUPS] || []
                matchesEstado = allowedStates.includes(contact.estado)
            }

            return matchesSearch && matchesOrigen && matchesEstado
        })
    }, [enrichedContacts, searchQuery, origenFilter, estadoFilter])

    // Stats - usando los grupos correctos
    const stats = {
        total: contacts.length,
        nuevos: contacts.filter(c => FILTER_GROUPS.nuevos.includes(c.estado)).length,
        enProceso: contacts.filter(c => FILTER_GROUPS.enProceso.includes(c.estado)).length,
        cerrados: contacts.filter(c => FILTER_GROUPS.cerrados.includes(c.estado)).length,
    }

    // Group by date
    const todayContacts = filteredContacts.filter(c => {
        const date = new Date(c.fecha_ultimo_contacto || c.fecha_registro)
        const today = new Date()
        return date.toDateString() === today.toDateString()
    })

    const olderContacts = filteredContacts.filter(c => {
        const date = new Date(c.fecha_ultimo_contacto || c.fecha_registro)
        const today = new Date()
        return date.toDateString() !== today.toDateString()
    })

    const getContactName = (contact: Contact) => {
        if (contact.nombre && contact.apellidos) {
            return `${contact.nombre} ${contact.apellidos}`
        }
        if (contact.nombre) {
            return contact.nombre
        }
        return contact.email?.split('@')[0] || 'Sin nombre'
    }

    const getInitials = (contact: Contact) => {
        const name = getContactName(contact)
        const parts = name.split(' ')
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        }
        return name.substring(0, 2).toUpperCase()
    }

    const getOrigenIcon = (origen: string) => {
        switch (origen) {
            case 'web': return 'language'
            case 'telefono': return 'call'
            case 'whatsapp': return 'chat_bubble'
            case 'presencial': return 'storefront'
            case 'coches_net':
            case 'wallapop':
            case 'autocasion':
                return 'social_leaderboard'
            default: return 'person'
        }
    }

    const getEstadoBadge = (estado: string) => {
        const config: Record<string, { bg: string, text: string, label: string }> = {
            'pendiente': { bg: 'bg-green-50', text: 'text-green-700', label: 'Nuevo' },
            'comunicado': { bg: 'bg-blue-50', text: 'text-blue-700', label: 'En Proceso' },
            'tramite': { bg: 'bg-blue-50', text: 'text-blue-700', label: 'En Trámite' },
            'reservado': { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Reservado' },
            'cerrado': { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Cerrado' },
            'busqueda': { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Pendiente' },
            'postventa': { bg: 'bg-teal-50', text: 'text-teal-700', label: 'Postventa' },
        }
        return config[estado] || { bg: 'bg-slate-100', text: 'text-slate-600', label: estado }
    }

    const handleCall = (e: React.MouseEvent, phone: string) => {
        e.stopPropagation()
        window.open(`tel:${phone}`, '_self')
    }

    const handleWhatsApp = (e: React.MouseEvent, phone: string) => {
        e.stopPropagation()
        const cleanPhone = phone.replace(/\s/g, '')
        window.open(`https://wa.me/34${cleanPhone}`, '_blank')
    }

    const handleEmail = (e: React.MouseEvent, email: string) => {
        e.stopPropagation()
        window.open(`mailto:${email}`, '_self')
    }

    return (
        <div className="space-y-6 p-4 lg:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Contactos</h1>
                    <p className="text-sm text-slate-500 mt-1">Gestiona todos los contactos de clientes potenciales</p>
                </div>
                <button
                    onClick={() => setIsNewContactOpen(true)}
                    className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-[#135bec] text-white font-medium shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-colors"
                >
                    <span className="material-symbols-outlined text-xl">add</span>
                    <span>Nuevo Contacto</span>
                </button>
            </div>

            {/* Stats Cards - Desktop */}
            <div className="hidden md:grid md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                            <span className="material-symbols-outlined text-slate-500">group</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Total</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                            <span className="material-symbols-outlined text-green-600">person_add</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">{stats.nuevos}</p>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Nuevos</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#135bec]">sync</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#135bec]">{stats.enProceso}</p>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">En Proceso</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                            <span className="material-symbols-outlined text-slate-500">check_circle</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-700">{stats.cerrados}</p>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Cerrados</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#135bec] focus:border-transparent"
                            placeholder="Buscar nombre, teléfono o email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Filter Chips */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setEstadoFilter("todos")}
                            className={cn(
                                "shrink-0 flex h-10 items-center justify-center gap-2 rounded-lg px-4 font-medium transition-colors",
                                estadoFilter === "todos"
                                    ? "bg-[#135bec] text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            )}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setEstadoFilter("nuevos")}
                            className={cn(
                                "shrink-0 flex h-10 items-center justify-center gap-2 rounded-lg px-4 font-medium transition-colors",
                                estadoFilter === "nuevos"
                                    ? "bg-green-600 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            )}
                        >
                            Nuevos
                        </button>
                        <button
                            onClick={() => setEstadoFilter("enProceso")}
                            className={cn(
                                "shrink-0 flex h-10 items-center justify-center gap-2 rounded-lg px-4 font-medium transition-colors",
                                estadoFilter === "enProceso"
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            )}
                        >
                            En Proceso
                        </button>
                        <button
                            onClick={() => setEstadoFilter("cerrados")}
                            className={cn(
                                "shrink-0 flex h-10 items-center justify-center gap-2 rounded-lg px-4 font-medium transition-colors",
                                estadoFilter === "cerrados"
                                    ? "bg-slate-600 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            )}
                        >
                            Cerrados
                        </button>
                    </div>
                </div>
            </div>

            {/* Contact Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredContacts.map(contact => (
                    <ContactCard
                        key={contact.id}
                        contact={contact as Contact}
                        getContactName={getContactName}
                        getInitials={getInitials}
                        getOrigenIcon={getOrigenIcon}
                        getEstadoBadge={getEstadoBadge}
                        onCall={handleCall}
                        onWhatsApp={handleWhatsApp}
                        onEmail={handleEmail}
                        onClick={() => setSelectedContact(contact as Contact)}
                    />
                ))}
            </div>

            {/* Empty State */}
            {filteredContacts.length === 0 && (
                <div className="bg-white rounded-xl p-12 text-center border border-slate-100 shadow-sm">
                    <span className="material-symbols-outlined text-5xl text-slate-300 mb-4 block">person_search</span>
                    <h3 className="text-lg font-semibold text-slate-600 mb-1">No se encontraron contactos</h3>
                    <p className="text-sm text-slate-400">Intenta ajustar los filtros de búsqueda</p>
                    <button
                        onClick={() => { setSearchQuery(""); setEstadoFilter("todos"); }}
                        className="mt-4 text-[#135bec] font-medium hover:underline"
                    >
                        Limpiar filtros
                    </button>
                </div>
            )}

            {/* Footer count */}
            {filteredContacts.length > 0 && (
                <div className="text-center">
                    <p className="text-sm text-slate-400">
                        Mostrando {filteredContacts.length} de {contacts.length} contactos
                    </p>
                </div>
            )}

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
            {selectedContact && (
                <ContactDetailModal
                    contact={selectedContact}
                    open={!!selectedContact}
                    onClose={() => setSelectedContact(null)}
                    onStatusChange={handleStatusChange}
                />
            )}
        </div>
    )
}

// Contact Card Component
function ContactCard({
    contact,
    getContactName,
    getInitials,
    getOrigenIcon,
    getEstadoBadge,
    onCall,
    onWhatsApp,
    onEmail,
    onClick
}: {
    contact: Contact & { vehiculos?: any[] }
    getContactName: (c: Contact) => string
    getInitials: (c: Contact) => string
    getOrigenIcon: (o: string) => string
    getEstadoBadge: (e: string) => { bg: string, text: string, label: string }
    onCall: (e: React.MouseEvent, phone: string) => void
    onWhatsApp: (e: React.MouseEvent, phone: string) => void
    onEmail: (e: React.MouseEvent, email: string) => void
    onClick: () => void
}) {
    const badge = getEstadoBadge(contact.estado)
    const vehicle = contact.vehiculos?.[0]
    const isLost = contact.estado === 'cerrado'

    return (
        <div
            className={cn(
                "relative flex flex-col bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:border-slate-200 transition-all",
                isLost && "opacity-70"
            )}
            onClick={onClick}
        >
            {/* Main Content */}
            <div className="p-4 pb-3">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-[#135bec] font-bold text-lg">
                            {getInitials(contact)}
                        </div>
                        <div>
                            <h3 className="text-slate-900 text-base font-bold leading-tight">{getContactName(contact)}</h3>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="material-symbols-outlined text-[14px] text-slate-400">{getOrigenIcon(contact.origen)}</span>
                                <p className="text-slate-400 text-xs font-medium">
                                    {formatDate(contact.fecha_ultimo_contacto || contact.fecha_registro)}
                                </p>
                            </div>
                        </div>
                    </div>
                    <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ring-current/10",
                        badge.bg, badge.text
                    )}>
                        {badge.label}
                    </span>
                </div>

                {/* Contact Info */}
                <div className="space-y-1 mb-3">
                    {contact.telefono && (
                        <p className="text-sm text-slate-600 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px] text-slate-400">call</span>
                            {contact.telefono}
                        </p>
                    )}
                    {contact.email && (
                        <p className="text-sm text-slate-500 flex items-center gap-2 truncate">
                            <span className="material-symbols-outlined text-[16px] text-slate-400">mail</span>
                            {contact.email}
                        </p>
                    )}
                </div>

                {/* Vehicle Interest */}
                {vehicle && (
                    <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg">
                        <div className="bg-white p-1.5 rounded-md shadow-sm">
                            <span className="material-symbols-outlined text-[#135bec] text-[20px]">directions_car</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-slate-900 text-sm font-semibold truncate">{vehicle.marca} {vehicle.modelo}</p>
                            <p className="text-slate-400 text-xs">
                                {vehicle.año_matriculacion} • {(vehicle.kilometraje / 1000).toFixed(0)}k km
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Bar */}
            {!isLost ? (
                <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100">
                    <button
                        onClick={(e) => contact.telefono && onCall(e, contact.telefono)}
                        className="flex items-center justify-center gap-2 py-3 hover:bg-slate-50 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[#135bec] text-[20px]">call</span>
                        <span className="text-xs font-semibold text-slate-700">Llamar</span>
                    </button>
                    <button
                        onClick={(e) => contact.telefono && onWhatsApp(e, contact.telefono)}
                        className="flex items-center justify-center gap-2 py-3 hover:bg-slate-50 transition-colors"
                    >
                        <span className="material-symbols-outlined text-green-600 text-[20px]">chat_bubble</span>
                        <span className="text-xs font-semibold text-slate-700">WhatsApp</span>
                    </button>
                    <button
                        onClick={(e) => contact.email && onEmail(e, contact.email)}
                        className="flex items-center justify-center gap-2 py-3 hover:bg-slate-50 transition-colors"
                    >
                        <span className="material-symbols-outlined text-slate-400 text-[20px]">mail</span>
                        <span className="text-xs font-semibold text-slate-700">Email</span>
                    </button>
                </div>
            ) : (
                <div className="bg-slate-50 border-t border-slate-100 py-2 px-4 flex justify-center">
                    <button className="text-xs font-medium text-[#135bec] hover:underline">Reactivar contacto</button>
                </div>
            )}
        </div>
    )
}
