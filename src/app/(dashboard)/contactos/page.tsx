"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { cn, formatShortDate, formatCurrency, isModifiedAfterCreation } from "@/lib/utils"
import type { Contact, Vehicle } from "@/types"
import { NewContactModal } from "@/components/contacts/NewContactModal"
import { ContactDetailModal } from "@/components/contacts/ContactDetailModal"
import { DocumentGeneratorModal } from "@/components/documents/DocumentGeneratorModal"
import { useFilteredData } from "@/hooks/useFilteredData"
import { modeloCorto } from "@/lib/vehicle-name"
import { useToast } from "@/components/ui/toast"
import { getContactsPage } from "@/lib/supabase-service"
import { deleteContact as deleteContactFromDB } from "@/lib/supabase-service"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Trash2, Eye, Phone, MessageCircle, Mail, ChevronLeft, ChevronRight, FileText } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

const PAGE_SIZE = 50

type FilterType = 'todos' | 'nuevos' | 'enProceso' | 'cerrados'

export default function ContactosPage() {
    const [contacts, setContacts] = useState<Contact[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [estadoFilter, setEstadoFilter] = useState<FilterType>("todos")
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
    const [isNewContactOpen, setIsNewContactOpen] = useState(false)
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [debouncedSearch, setDebouncedSearch] = useState("")

    // Inventario (cacheado) para pintar la foto del vehículo de interés
    const { vehicles } = useFilteredData()
    const { addToast } = useToast()
    const vehiclesById = useMemo(() => {
        const map = new Map<string, Vehicle>()
        vehicles.forEach(v => map.set(v.id, v))
        return map
    }, [vehicles])
    const getContactVehicles = useCallback((c: Contact): Vehicle[] => {
        return (c.vehiculos_interes || [])
            .map(id => vehiclesById.get(id))
            .filter(Boolean) as Vehicle[]
    }, [vehiclesById])

    // Generar factura / contrato / señal / proforma sin entrar en la ficha
    const [docContact, setDocContact] = useState<Contact | null>(null)
    const [docVehicle, setDocVehicle] = useState<Vehicle | null>(null)
    const [vehiclePickerContact, setVehiclePickerContact] = useState<Contact | null>(null)
    const [detailInitialTab, setDetailInitialTab] = useState<'cronologia' | 'vehiculos' | 'notas'>('cronologia')

    const openDocumentGenerator = (contact: Contact) => {
        const suyos = getContactVehicles(contact)
        if (suyos.length === 0) {
            addToast('Asigna primero un vehículo al contacto para generar el documento', 'error')
            setDetailInitialTab('vehiculos')
            setSelectedContact(contact)
            return
        }
        if (suyos.length === 1) {
            setDocContact(contact)
            setDocVehicle(suyos[0])
            return
        }
        setVehiclePickerContact(contact)
    }

    const loadContacts = useCallback(async (p: number, search: string, estado: string) => {
        setIsLoading(true)
        try {
            const result = await getContactsPage({ page: p, pageSize: PAGE_SIZE, search, estado })
            setContacts(result.data)
            setTotal(result.total)
        } catch (e) {
            console.error(e)
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Debounce search input
    useEffect(() => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
        searchTimerRef.current = setTimeout(() => {
            setDebouncedSearch(searchQuery)
            setPage(0)
        }, 400)
        return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current) }
    }, [searchQuery])

    // Reload when filters/page change
    useEffect(() => {
        loadContacts(page, debouncedSearch, estadoFilter)
    }, [page, debouncedSearch, estadoFilter, loadContacts])

    // Refresh the list when a contact is edited elsewhere (e.g. EditContactModal)
    useEffect(() => {
        const handler = (e: Event) => {
            if ((e as CustomEvent).detail?.type === 'contacts') {
                loadContacts(page, debouncedSearch, estadoFilter)
            }
        }
        window.addEventListener('midcar-data-updated', handler)
        return () => window.removeEventListener('midcar-data-updated', handler)
    }, [page, debouncedSearch, estadoFilter, loadContacts])

    const handleFilterChange = (f: FilterType) => {
        setEstadoFilter(f)
        setPage(0)
    }

    const handleDeleteContact = async (contactId: string) => {
        const success = await deleteContactFromDB(contactId)
        if (success) {
            setContacts(prev => prev.filter(c => c.id !== contactId))
            setTotal(prev => prev - 1)
            if (selectedContact?.id === contactId) setSelectedContact(null)
        }
    }

    const handleStatusChange = (contactId: string, newStatus: string) => {
        setContacts(prev => prev.map(c =>
            c.id === contactId ? { ...c, estado: newStatus as Contact['estado'] } : c
        ))
        if (selectedContact?.id === contactId) {
            setSelectedContact(prev => prev ? { ...prev, estado: newStatus as Contact['estado'] } : null)
        }
    }

    const totalPages = Math.ceil(total / PAGE_SIZE)

    const getContactName = (contact: Contact) => {
        if (contact.nombre && contact.apellidos) return `${contact.nombre} ${contact.apellidos}`
        if (contact.nombre) return contact.nombre
        return contact.email?.split('@')[0] || 'Sin nombre'
    }

    const getInitials = (contact: Contact) => {
        const name = getContactName(contact).trim()
        const parts = name.split(/\s+/).filter(Boolean)
        if (parts.length >= 2 && parts[0][0] && parts[1][0]) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        }
        if (parts[0]) return parts[0].substring(0, 2).toUpperCase()
        return '?'
    }

    const getOrigenIcon = (origen: string) => {
        switch (origen) {
            case 'web': return 'language'
            case 'telefono': return 'call'
            case 'whatsapp': return 'chat_bubble'
            case 'presencial': return 'storefront'
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

    return (
        <div className="space-y-6 p-4 lg:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Contactos</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {total.toLocaleString()} contactos en total
                    </p>
                </div>
                <button
                    onClick={() => setIsNewContactOpen(true)}
                    className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-[#135bec] text-white font-medium shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-colors"
                >
                    <span className="material-symbols-outlined text-xl">add</span>
                    <span>Nuevo Contacto</span>
                </button>
            </div>

            {/* Search & Filters */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex flex-col lg:flex-row gap-4 p-4">
                    <div className="flex-1 relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#135bec] focus:border-transparent"
                            placeholder="Buscar nombre, teléfono o email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Filter Chips */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-4 -mt-2">
                    {(['todos', 'nuevos', 'enProceso', 'cerrados'] as FilterType[]).map(f => (
                        <button
                            key={f}
                            onClick={() => handleFilterChange(f)}
                            className={cn(
                                "shrink-0 flex h-9 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition-colors",
                                estadoFilter === f
                                    ? "bg-[#135bec] text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            )}
                        >
                            {f === 'todos' ? `Todos (${total.toLocaleString()})` :
                                f === 'nuevos' ? 'Nuevos' :
                                    f === 'enProceso' ? 'En Proceso' : 'Cerrados'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin h-8 w-8 border-2 border-[#135bec] border-t-transparent rounded-full" />
                </div>
            )}

            {/* Contact Cards Grid */}
            {!isLoading && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {contacts.map(contact => (
                            <ContactCard
                                key={contact.id}
                                contact={contact}
                                getContactName={getContactName}
                                getInitials={getInitials}
                                getOrigenIcon={getOrigenIcon}
                                getEstadoBadge={getEstadoBadge}
                                vehicles={getContactVehicles(contact)}
                                onClick={() => { setDetailInitialTab('cronologia'); setSelectedContact(contact) }}
                                onDelete={handleDeleteContact}
                                onGenerateDocument={() => openDocumentGenerator(contact)}
                            />
                        ))}
                    </div>

                    {contacts.length === 0 && (
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

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                            <p className="text-sm text-slate-500">
                                Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total.toLocaleString()}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                    className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <span className="text-sm font-medium text-slate-700">
                                    {page + 1} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                    disabled={page >= totalPages - 1}
                                    className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modals */}
            <NewContactModal
                open={isNewContactOpen}
                onClose={() => setIsNewContactOpen(false)}
                onContactCreated={(contact) => {
                    setIsNewContactOpen(false)
                    setSelectedContact(contact)
                    loadContacts(0, debouncedSearch, estadoFilter)
                }}
            />

            {selectedContact && (
                <ContactDetailModal
                    contact={selectedContact}
                    open={!!selectedContact}
                    initialTab={detailInitialTab}
                    onClose={() => setSelectedContact(null)}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDeleteContact}
                />
            )}

            {/* Elegir vehículo cuando el contacto tiene más de uno */}
            <Dialog open={!!vehiclePickerContact} onOpenChange={() => setVehiclePickerContact(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>¿Para qué vehículo?</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                        {vehiclePickerContact && getContactVehicles(vehiclePickerContact).map(v => (
                            <button
                                key={v.id}
                                onClick={() => {
                                    setDocContact(vehiclePickerContact)
                                    setDocVehicle(v)
                                    setVehiclePickerContact(null)
                                }}
                                className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-[#135bec] hover:bg-blue-50/50 transition-colors text-left"
                            >
                                <div
                                    className="w-14 h-14 rounded-lg bg-cover bg-center bg-slate-100 shrink-0"
                                    style={{ backgroundImage: `url(${v.imagen_principal || '/placeholder-proximamente.svg'})` }}
                                />
                                <div className="min-w-0">
                                    <p className="font-semibold text-sm text-slate-900 truncate">{v.marca} {modeloCorto(v.modelo)}</p>
                                    <p className="text-xs text-slate-500">{v.matricula || 'Sin matrícula'} · {formatCurrency(v.precio_venta)}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {docContact && docVehicle && (
                <DocumentGeneratorModal
                    isOpen={!!docVehicle}
                    onClose={() => { setDocVehicle(null); setDocContact(null) }}
                    vehicle={docVehicle}
                    contacts={[docContact]}
                    preselectedContactId={docContact.id}
                />
            )}
        </div>
    )
}

// Compact Contact Card Component
function ContactCard({
    contact,
    getContactName,
    getInitials,
    getOrigenIcon,
    getEstadoBadge,
    vehicles,
    onClick,
    onDelete,
    onGenerateDocument,
}: {
    contact: Contact
    getContactName: (c: Contact) => string
    getInitials: (c: Contact) => string
    getOrigenIcon: (o: string) => string
    getEstadoBadge: (e: string) => { bg: string, text: string, label: string }
    vehicles: Vehicle[]
    onClick: () => void
    onDelete: (id: string) => void
    onGenerateDocument: () => void
}) {
    const badge = getEstadoBadge(contact.estado)
    const principal = vehicles[0]
    const restantes = vehicles.length - 1

    return (
        <div
            className="relative flex flex-col bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:border-slate-200 transition-all"
            onClick={onClick}
        >
            <div className="p-4 pb-3">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-[#135bec] font-bold text-lg shrink-0">
                            {getInitials(contact)}
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-slate-900 text-base font-bold leading-tight truncate">{getContactName(contact)}</h3>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="material-symbols-outlined text-[14px] text-slate-400">{getOrigenIcon(contact.origen)}</span>
                                <p className="text-slate-400 text-xs font-medium truncate">
                                    {contact.telefono || contact.email || 'Sin contacto'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <span className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold",
                            badge.bg, badge.text
                        )}>
                            {badge.label}
                        </span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <button className="h-8 w-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                                    <MoreVertical className="h-4 w-4" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-white border-gray-200">
                                <DropdownMenuItem onClick={onClick} className="cursor-pointer">
                                    <Eye className="h-4 w-4 mr-2" />Ver ficha
                                </DropdownMenuItem>
                                {contact.telefono && (
                                    <DropdownMenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); window.open(`tel:${contact.telefono}`, '_self') }}>
                                        <Phone className="h-4 w-4 mr-2" />Llamar
                                    </DropdownMenuItem>
                                )}
                                {contact.telefono && (
                                    <DropdownMenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/34${contact.telefono?.replace(/\s/g, '')}`, '_blank') }}>
                                        <MessageCircle className="h-4 w-4 mr-2" />WhatsApp
                                    </DropdownMenuItem>
                                )}
                                {contact.email && (
                                    <DropdownMenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); window.open(`mailto:${contact.email}`, '_self') }}>
                                        <Mail className="h-4 w-4 mr-2" />Email
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={(e) => { e.stopPropagation(); onGenerateDocument() }}
                                >
                                    <FileText className="h-4 w-4 mr-2" />Generar documento
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        if (window.confirm('¿Eliminar este contacto?')) onDelete(contact.id)
                                    }}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />Eliminar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Vehículo de interés: la foto ayuda a reconocer al cliente de un vistazo */}
                {principal && (
                    <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <div
                            className="w-14 h-11 rounded-md bg-cover bg-center bg-slate-200 shrink-0"
                            style={{ backgroundImage: `url(${principal.imagen_principal || '/placeholder-proximamente.svg'})` }}
                        />
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 truncate">{principal.marca} {modeloCorto(principal.modelo)}</p>
                            <p className="text-[11px] text-slate-500 truncate">
                                {principal.matricula || 'Sin matrícula'} · {formatCurrency(principal.precio_venta)}
                            </p>
                        </div>
                        {restantes > 0 && (
                            <span className="shrink-0 text-[11px] font-bold text-[#135bec] bg-blue-50 rounded-full px-2 py-0.5">
                                +{restantes}
                            </span>
                        )}
                    </div>
                )}

                {/* Fechas de alta y modificación */}
                {contact.created_at && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">event</span>
                            Añadido {formatShortDate(contact.created_at)}
                        </span>
                        {isModifiedAfterCreation(contact.created_at, contact.updated_at) && (
                            <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px]">edit_calendar</span>
                                Modificado {formatShortDate(contact.updated_at)}
                            </span>
                        )}
                    </div>
                )}

                {/* Action Bar */}
                <div className="grid grid-cols-4 divide-x divide-slate-100 border-t border-slate-100 -mx-4 mt-3">
                    <button
                        onClick={(e) => { e.stopPropagation(); if (contact.telefono) window.open(`tel:${contact.telefono}`, '_self') }}
                        className="flex items-center justify-center gap-1.5 py-2.5 hover:bg-slate-50 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[#135bec] text-[18px]">call</span>
                        <span className="text-xs font-semibold text-slate-700">Llamar</span>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); if (contact.telefono) window.open(`https://wa.me/34${contact.telefono.replace(/\s/g, '')}`, '_blank') }}
                        className="flex items-center justify-center gap-1.5 py-2.5 hover:bg-slate-50 transition-colors"
                    >
                        <span className="material-symbols-outlined text-green-600 text-[18px]">chat_bubble</span>
                        <span className="text-xs font-semibold text-slate-700">WhatsApp</span>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); if (contact.email) window.open(`mailto:${contact.email}`, '_self') }}
                        className="flex items-center justify-center gap-1.5 py-2.5 hover:bg-slate-50 transition-colors"
                    >
                        <span className="material-symbols-outlined text-slate-400 text-[18px]">mail</span>
                        <span className="text-xs font-semibold text-slate-700">Email</span>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onGenerateDocument() }}
                        className="flex items-center justify-center gap-1.5 py-2.5 hover:bg-slate-50 transition-colors"
                        title="Generar factura, contrato, señal o proforma"
                    >
                        <span className="material-symbols-outlined text-emerald-600 text-[18px]">description</span>
                        <span className="text-xs font-semibold text-slate-700">Documento</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
