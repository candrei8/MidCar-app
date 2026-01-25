"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"
import type { Lead } from "@/types"
import { formatRelativeTime, formatCurrency, formatDate, cn } from "@/lib/utils"
import { ESTADOS_LEAD } from "@/lib/constants"
import { SaleConfirmationModal, type SaleData } from "@/components/crm/SaleConfirmationModal"
import { EditLeadModal } from "@/components/crm/EditLeadModal"
import { createSale } from "@/lib/sales-service"
import { deleteLead } from "@/lib/supabase-service"
import { useToast } from "@/components/ui/toast"

// Helper para verificar si una URL de imagen es válida (excluye Azure CDN que no existe)
const isValidImageUrl = (url: string | null | undefined): boolean => {
    if (!url) return false
    return !url.includes('midcar.azureedge.net')
}

interface LeadDetailModalProps {
    lead: Lead
    open: boolean
    onClose: () => void
    onStatusChange?: (leadId: string, newStatus: string) => void
    onDelete?: (leadId: string) => void
}

export function LeadDetailModal({ lead, open, onClose, onStatusChange, onDelete }: LeadDetailModalProps) {
    const { addToast } = useToast()
    const [activeTab, setActiveTab] = useState<'cronologia' | 'vehiculos' | 'notas'>('cronologia')
    const [currentStatus, setCurrentStatus] = useState<string>(lead.estado)
    const [statusSaved, setStatusSaved] = useState(false)
    const [showSaleModal, setShowSaleModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [saleClosed, setSaleClosed] = useState(false)
    const [currentLead, setCurrentLead] = useState<Lead>(lead)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const success = await deleteLead(lead.id)
            if (success) {
                addToast('Lead eliminado correctamente', 'success')
                onDelete?.(lead.id)
                onClose()
            } else {
                addToast('Error al eliminar el lead', 'error')
            }
        } catch (error) {
            console.error('Error deleting lead:', error)
            addToast('Error al eliminar el lead', 'error')
        } finally {
            setIsDeleting(false)
            setShowDeleteConfirm(false)
        }
    }

    const handleStatusChange = (newStatus: string) => {
        // If changing to 'vendido' and has a vehicle, show sale confirmation modal
        if (newStatus === 'vendido' && lead.vehiculo) {
            setShowSaleModal(true)
            return
        }

        setCurrentStatus(newStatus)
        if (onStatusChange) {
            onStatusChange(lead.id, newStatus)
        }
        // Show feedback
        setStatusSaved(true)
        setTimeout(() => setStatusSaved(false), 2000)
    }

    const handleSaleConfirmed = async (saleData: SaleData) => {
        if (!lead.vehiculo) return

        try {
            // Create sale record
            await createSale(saleData, lead.vehiculo, lead)

            // Update status to vendido
            setCurrentStatus('vendido')
            if (onStatusChange) {
                onStatusChange(lead.id, 'vendido')
            }

            // Show success
            setSaleClosed(true)
            setShowSaleModal(false)

            // Show success message
            setStatusSaved(true)
            setTimeout(() => setStatusSaved(false), 3000)
        } catch (error) {
            console.error('Error creating sale:', error)
        }
    }

    const getInitials = (nombre: string, apellidos: string) => {
        return `${nombre?.charAt(0) || 'N'}${apellidos?.charAt(0) || 'A'}`.toUpperCase()
    }

    const getSentimentConfig = (sentiment: string) => {
        const config: Record<string, { icon: string, color: string, label: string }> = {
            'positivo': { icon: 'sentiment_satisfied', color: 'text-green-600', label: 'Positivo' },
            'negativo': { icon: 'sentiment_dissatisfied', color: 'text-red-600', label: 'Negativo' },
            'neutral': { icon: 'sentiment_neutral', color: 'text-gray-500', label: 'Neutral' },
        }
        return config[sentiment] || config['neutral']
    }

    const getStatusConfig = (estado: string) => {
        const config: Record<string, { icon: string, color: string }> = {
            'nuevo': { icon: 'fiber_new', color: 'bg-blue-100 text-blue-700' },
            'contactado': { icon: 'call', color: 'bg-cyan-100 text-cyan-700' },
            'negociacion': { icon: 'handshake', color: 'bg-amber-100 text-amber-700' },
            'prueba_programada': { icon: 'directions_car', color: 'bg-purple-100 text-purple-700' },
            'financiacion': { icon: 'account_balance', color: 'bg-indigo-100 text-indigo-700' },
            'oferta_enviada': { icon: 'send', color: 'bg-orange-100 text-orange-700' },
            'vendido': { icon: 'check_circle', color: 'bg-green-100 text-green-700' },
            'perdido': { icon: 'cancel', color: 'bg-gray-100 text-gray-500' },
        }
        return config[estado] || { icon: 'help', color: 'bg-gray-100 text-gray-600' }
    }

    const sentiment = getSentimentConfig(lead.sentimiento_ia)

    // Status options for the selector
    const statusOptions = [
        { value: 'nuevo', label: 'Nuevo' },
        { value: 'contactado', label: 'Contactado' },
        { value: 'prueba_programada', label: 'Prueba' },
        { value: 'negociacion', label: 'Negociación' },
        { value: 'vendido', label: 'Vendido' },
    ]

    // Timeline basado en datos reales del lead
    const timelineEvents = [
        // Solo mostrar interés en vehículo si existe
        ...(lead.vehiculo ? [{
            icon: 'directions_car',
            iconBg: 'bg-blue-100',
            iconColor: 'text-primary',
            title: 'Interés en vehículo',
            description: `Interesado en ${lead.vehiculo.marca} ${lead.vehiculo.modelo}`,
            time: formatRelativeTime(lead.ultima_interaccion),
            vehicle: lead.vehiculo
        }] : []),
        // Evento de creación del lead (siempre presente)
        {
            icon: 'person_add',
            iconBg: 'bg-gray-100',
            iconColor: 'text-gray-500',
            title: 'Lead Creado',
            description: lead.created_by_name ? `Por: ${lead.created_by_name}` : `Origen: ${lead.cliente?.origen_lead || 'Manual'}`,
            time: formatDate(lead.fecha_creacion),
            isStart: true
        }
    ]

    return (
        <>
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="max-w-md w-full max-h-[90vh] overflow-hidden p-0 bg-[#f2f2f7] dark:bg-background-dark rounded-2xl">
                    {/* Accessible title for screen readers */}
                    <VisuallyHidden.Root>
                        <DialogTitle>Ficha de Contacto - {lead.cliente?.nombre} {lead.cliente?.apellidos}</DialogTitle>
                    </VisuallyHidden.Root>
                    {/* TopAppBar */}
                    <div className="sticky top-0 z-50 flex items-center bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 p-4 pb-2 justify-between h-14">
                        <button
                            onClick={onClose}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <span className="material-symbols-outlined text-primary text-2xl">arrow_back</span>
                        </button>
                        <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center">Ficha de Contacto</h2>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setShowEditModal(true)}
                                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-primary"
                            >
                                <span className="material-symbols-outlined text-xl">edit</span>
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-500"
                            >
                                <span className="material-symbols-outlined text-xl">delete</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pb-24 max-h-[calc(90vh-56px)]">
                        {/* ProfileHeader */}
                        <div className="flex p-6 flex-col items-center bg-white dark:bg-[#1c1c1e] mb-4 shadow-sm">
                            <div className="relative mb-4">
                                <Avatar className="h-28 w-28 ring-4 ring-primary/10">
                                    <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-[#135bec] to-blue-600 text-white">
                                        {getInitials(lead.cliente?.nombre || '', lead.cliente?.apellidos || '')}
                                    </AvatarFallback>
                                </Avatar>
                                {lead.cliente?.origen_lead && (
                                    <div className="absolute bottom-1 right-1 bg-white dark:bg-black rounded-full p-1 border border-gray-100 dark:border-gray-800 shadow-sm">
                                        <span className="material-symbols-outlined text-gray-600 text-sm">language</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col items-center justify-center gap-1">
                                <h1 className="text-2xl font-bold leading-tight tracking-tight text-center">
                                    {lead.cliente?.nombre} {lead.cliente?.apellidos}
                                </h1>
                                <div className="flex items-center gap-2 flex-wrap justify-center">
                                    <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-500">
                                        ID: #{lead.id.slice(-4)}
                                    </span>
                                    <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium", sentiment.color, "bg-gray-100 dark:bg-gray-800")}>
                                        <span className="material-symbols-outlined text-sm">{sentiment.icon}</span>
                                        {sentiment.label}
                                    </span>
                                </div>
                                <p className="text-gray-500 text-sm mt-2 font-medium text-center">
                                    {lead.cliente?.email}
                                </p>
                            </div>
                        </div>

                        {/* Creator Info Card */}
                        {(lead.created_by_name || lead.fecha_creacion) && (
                            <div className="mx-4 mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                <div className="flex items-center justify-between">
                                    {lead.created_by_name && (
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-sm">person</span>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-indigo-500 dark:text-indigo-400 uppercase tracking-wider font-medium">Creado por</p>
                                                <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">{lead.created_by_name}</p>
                                            </div>
                                        </div>
                                    )}
                                    {lead.fecha_creacion && (
                                        <div className="text-right">
                                            <p className="text-[10px] text-indigo-500 dark:text-indigo-400 uppercase tracking-wider font-medium">Fecha</p>
                                            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                                {new Date(lead.fecha_creacion).toLocaleDateString('es-ES', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ActionsBar */}
                        <div className="grid grid-cols-4 gap-2 px-4 mb-6">
                            <button
                                onClick={() => window.location.href = `tel:${lead.cliente?.telefono}`}
                                className="flex flex-col items-center gap-2 group"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-all">
                                    <span className="material-symbols-outlined text-2xl">call</span>
                                </div>
                                <span className="text-xs font-medium text-gray-500 group-hover:text-blue-500 transition-colors">Llamar</span>
                            </button>
                            <button
                                onClick={() => window.open(`https://wa.me/${lead.cliente?.telefono?.replace(/\D/g, '')}`, '_blank')}
                                className="flex flex-col items-center gap-2 group"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-all">
                                    <span className="material-symbols-outlined text-2xl">chat</span>
                                </div>
                                <span className="text-xs font-medium text-gray-500 group-hover:text-blue-500 transition-colors">WhatsApp</span>
                            </button>
                            <button
                                onClick={() => window.location.href = `mailto:${lead.cliente?.email}`}
                                className="flex flex-col items-center gap-2 group"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-all">
                                    <span className="material-symbols-outlined text-2xl">mail</span>
                                </div>
                                <span className="text-xs font-medium text-gray-500 group-hover:text-blue-500 transition-colors">Email</span>
                            </button>
                            <button className="flex flex-col items-center gap-2 group">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 active:scale-95 transition-all">
                                    <span className="material-symbols-outlined text-2xl">add_task</span>
                                </div>
                                <span className="text-xs font-medium text-gray-500 group-hover:text-blue-500 transition-colors">Tarea</span>
                            </button>
                        </div>

                        {/* Status Selector */}
                        <div className="px-4 mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm uppercase tracking-wider text-gray-500 font-bold pl-1">Estado</h3>
                                {statusSaved && (
                                    <span className={cn(
                                        "text-xs flex items-center gap-1 animate-in fade-in",
                                        saleClosed ? "text-green-600 font-bold" : "text-green-600"
                                    )}>
                                        <span className="material-symbols-outlined text-sm">
                                            {saleClosed ? 'celebration' : 'check'}
                                        </span>
                                        {saleClosed ? '¡Venta cerrada!' : 'Guardado'}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {statusOptions.map(status => (
                                    <button
                                        key={status.value}
                                        onClick={() => handleStatusChange(status.value)}
                                        className={cn(
                                            "flex h-9 items-center justify-center gap-x-2 rounded-lg px-3 active:scale-95 transition-all duration-200",
                                            currentStatus === status.value
                                                ? "bg-blue-500 shadow-md shadow-blue-500/20"
                                                : "border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1c1c1e] shadow-sm hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                                        )}
                                    >
                                        <span className={cn(
                                            "material-symbols-outlined text-[16px]",
                                            currentStatus === status.value ? "text-white" : "text-gray-400"
                                        )}>
                                            {currentStatus === status.value ? 'check_circle' : 'radio_button_unchecked'}
                                        </span>
                                        <p className={cn(
                                            "text-xs font-medium whitespace-nowrap",
                                            currentStatus === status.value ? "text-white" : "text-gray-700 dark:text-gray-300"
                                        )}>
                                            {status.label}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Segmented Content Tabs */}
                        <div className="bg-[#f2f2f7] dark:bg-background-dark px-4 pt-2 pb-4 border-b border-gray-200 dark:border-gray-800 mb-6">
                            <div className="flex p-1 bg-gray-200/50 dark:bg-gray-800/50 rounded-lg">
                                <button
                                    onClick={() => setActiveTab('cronologia')}
                                    className={cn(
                                        "flex-1 py-1.5 rounded-[6px] text-sm font-medium text-center transition-all",
                                        activeTab === 'cronologia'
                                            ? "bg-white dark:bg-gray-700 text-blue-500 dark:text-white shadow-sm font-bold"
                                            : "text-gray-500 dark:text-gray-400 hover:text-blue-500"
                                    )}
                                >
                                    Cronología
                                </button>
                                <button
                                    onClick={() => setActiveTab('vehiculos')}
                                    className={cn(
                                        "flex-1 py-1.5 rounded-[6px] text-sm font-medium text-center transition-all",
                                        activeTab === 'vehiculos'
                                            ? "bg-white dark:bg-gray-700 text-blue-500 dark:text-white shadow-sm font-bold"
                                            : "text-gray-500 dark:text-gray-400 hover:text-blue-500"
                                    )}
                                >
                                    Vehículos
                                </button>
                                <button
                                    onClick={() => setActiveTab('notas')}
                                    className={cn(
                                        "flex-1 py-1.5 rounded-[6px] text-sm font-medium text-center transition-all",
                                        activeTab === 'notas'
                                            ? "bg-white dark:bg-gray-700 text-blue-500 dark:text-white shadow-sm font-bold"
                                            : "text-gray-500 dark:text-gray-400 hover:text-blue-500"
                                    )}
                                >
                                    Notas
                                </button>
                            </div>
                        </div>

                        {/* Timeline Section */}
                        {activeTab === 'cronologia' && (
                            <div className="px-4 mb-8">
                                <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-800 ml-3 space-y-8">
                                    {timelineEvents.map((event, idx) => (
                                        <div key={idx} className="relative">
                                            <div className={cn(
                                                "absolute -left-[25px] mt-1.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white dark:border-background-dark",
                                                event.iconBg
                                            )}>
                                                <span className={cn("material-symbols-outlined text-sm", event.iconColor)}>{event.icon}</span>
                                            </div>
                                            {event.isStart ? (
                                                <div className="py-2">
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{event.title} • {event.time}</p>
                                                </div>
                                            ) : (
                                                <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className="text-base font-bold">{event.title}</h4>
                                                        <span className="text-xs text-gray-500 font-medium">{event.time}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-500">{event.description}</p>

                                                    {/* Vehicle Mini Card */}
                                                    {event.vehicle && (
                                                        <div className="flex gap-3 items-center bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700 mt-3">
                                                            <div
                                                                className="w-12 h-12 rounded-md bg-cover bg-center bg-gray-200"
                                                                style={{ backgroundImage: isValidImageUrl(event.vehicle.imagen_principal) ? `url(${event.vehicle.imagen_principal})` : 'none' }}
                                                            >
                                                                {!isValidImageUrl(event.vehicle.imagen_principal) && (
                                                                    <div className="w-full h-full flex items-center justify-center">
                                                                        <span className="material-symbols-outlined text-gray-400">directions_car</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold">{event.vehicle.marca} {event.vehicle.modelo}</p>
                                                                <p className="text-xs text-gray-500">{formatCurrency(event.vehicle.precio_venta)}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Vehicles Section */}
                        {activeTab === 'vehiculos' && (
                            <div className="px-4 mb-8">
                                {lead.vehiculo ? (
                                    <div className="bg-white dark:bg-[#1c1c1e] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                        <div
                                            className="h-40 bg-cover bg-center relative bg-gray-200"
                                            style={{ backgroundImage: isValidImageUrl(lead.vehiculo.imagen_principal) ? `url(${lead.vehiculo.imagen_principal})` : 'none' }}
                                        >
                                            {!isValidImageUrl(lead.vehiculo.imagen_principal) && (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-6xl text-gray-300">directions_car</span>
                                                </div>
                                            )}
                                            <div className="absolute top-2 right-2 bg-green-500/80 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">
                                                INTERÉS
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <h4 className="font-bold text-lg">{lead.vehiculo.marca} {lead.vehiculo.modelo}</h4>
                                            <p className="text-sm text-gray-500 mb-2">{lead.vehiculo.version}</p>
                                            <div className="flex justify-between items-center">
                                                <span className="text-primary font-bold text-xl">{formatCurrency(lead.vehiculo.precio_venta)}</span>
                                            </div>
                                            <div className="flex gap-2 text-xs text-gray-500 mt-2">
                                                <span>{lead.vehiculo.año_matriculacion}</span>
                                                <span>•</span>
                                                <span>{lead.vehiculo.kilometraje?.toLocaleString()} km</span>
                                                <span>•</span>
                                                <span className="capitalize">{lead.vehiculo.combustible}</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">directions_car</span>
                                        <h3 className="text-lg font-semibold text-gray-600 mb-1">Sin vehículo asignado</h3>
                                        <p className="text-sm text-gray-400">Este lead no tiene un vehículo de interés registrado</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Notes Section */}
                        {activeTab === 'notas' && (
                            <div className="px-4 mb-8">
                                <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-4">
                                    <textarea
                                        className="w-full bg-transparent border-0 p-0 text-sm placeholder-gray-400 focus:ring-0 resize-none"
                                        placeholder="Escribe una nota rápida..."
                                        rows={3}
                                    />
                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                        <div className="flex gap-2">
                                            <button className="text-gray-400 hover:text-blue-500 transition-colors">
                                                <span className="material-symbols-outlined text-xl">attach_file</span>
                                            </button>
                                            <button className="text-gray-400 hover:text-blue-500 transition-colors">
                                                <span className="material-symbols-outlined text-xl">image</span>
                                            </button>
                                        </div>
                                        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-colors">
                                            Guardar
                                        </button>
                                    </div>
                                </div>

                                {/* Existing notes */}
                                {lead.notas ? (
                                    <div className="space-y-3">
                                        <div className="flex gap-3 items-start">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
                                                <span className="text-xs font-bold text-gray-600 dark:text-gray-300">YO</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="bg-white dark:bg-gray-800 p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl shadow-sm text-sm">
                                                    {lead.notas}
                                                </div>
                                                <span className="text-[10px] text-gray-400 ml-1 mt-1 block">
                                                    {formatRelativeTime(lead.ultima_interaccion)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">edit_note</span>
                                        <p className="text-sm text-gray-400">Sin notas aún</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Client Info Footer */}
                        <div className="px-4 mb-8">
                            <h3 className="text-sm uppercase tracking-wider text-gray-500 font-bold mb-3 pl-1">Información de Contacto</h3>
                            <div className="bg-white dark:bg-[#1c1c1e] rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
                                <div className="flex justify-between items-center p-4">
                                    <span className="text-sm text-gray-500">Email</span>
                                    <span className="text-sm font-medium">{lead.cliente?.email}</span>
                                </div>
                                <div className="flex justify-between items-center p-4">
                                    <span className="text-sm text-gray-500">Teléfono</span>
                                    <span className="text-sm font-medium">{lead.cliente?.telefono}</span>
                                </div>
                                <div className="flex justify-between items-center p-4">
                                    <span className="text-sm text-gray-500">Origen</span>
                                    <span className="text-sm font-medium">{lead.cliente?.origen_lead}</span>
                                </div>
                                <div className="flex justify-between items-center p-4">
                                    <span className="text-sm text-gray-500">Registro</span>
                                    <span className="text-sm font-medium">{formatDate(lead.fecha_creacion)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Sale Confirmation Modal */}
            {lead.vehiculo && (
                <SaleConfirmationModal
                    open={showSaleModal}
                    onClose={() => setShowSaleModal(false)}
                    onConfirm={handleSaleConfirmed}
                    lead={lead}
                    vehicle={lead.vehiculo}
                />
            )}

            {/* Edit Lead Modal */}
            <EditLeadModal
                lead={currentLead}
                open={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSave={(updatedLead) => {
                    setCurrentLead(updatedLead)
                    if (onStatusChange && updatedLead.estado !== currentStatus) {
                        onStatusChange(lead.id, updatedLead.estado)
                        setCurrentStatus(updatedLead.estado)
                    }
                }}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent className="max-w-sm p-0 overflow-hidden gap-0">
                    <div className="p-6 text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-3xl text-red-500">delete_forever</span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">Eliminar Lead</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            ¿Estás seguro de que quieres eliminar este lead? Esta acción no se puede deshacer.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                disabled={isDeleting}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
