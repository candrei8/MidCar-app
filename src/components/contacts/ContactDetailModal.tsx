"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { cn, formatDate, formatCurrency } from "@/lib/utils"
import { Contact, Vehicle } from "@/types"
import { mockVehicles } from "@/lib/mock-data"
import { ESTADOS_BACKOFFICE, ORIGENES_CONTACTO } from "@/lib/constants" // Removed unused constants

// Modales de acción (se mantienen logicamente, visualmente se activan desde los botones nuevos)
import { NewInteractionModal, InteractionData } from "./NewInteractionModal"
import { AddTaskModal, TaskData } from "./AddTaskModal"
import { SetPriorityModal } from "./SetPriorityModal"
import { PostponeContactModal } from "./PostponeContactModal"
import { AssignCommercialModal } from "./AssignCommercialModal"
import { DocumentModal } from "./DocumentModal"

interface ContactDetailModalProps {
    contact: Contact
    open: boolean
    onClose: () => void
    onStatusChange?: (contactId: string, newStatus: string) => void
}

export function ContactDetailModal({ contact, open, onClose, onStatusChange }: ContactDetailModalProps) {
    const [activeTab, setActiveTab] = useState<'cronologia' | 'vehiculos' | 'notas'>('cronologia')

    // Estados mantenidos para funcionalidad
    const [showInteractionModal, setShowInteractionModal] = useState(false)
    const [showTaskModal, setShowTaskModal] = useState(false)
    const [showDocumentModal, setShowDocumentModal] = useState(false)
    const [documentType, setDocumentType] = useState<'proforma' | 'senal' | 'contrato' | 'factura'>('proforma')
    const [interactions, setInteractions] = useState<InteractionData[]>([]) // Mocked timeline for now
    const [tasks, setTasks] = useState<TaskData[]>([])
    const [estadoLead, setEstadoLead] = useState(contact.estado)

    // Obtener vehículos
    const contactVehicles = contact.vehiculos_interes
        .map(id => mockVehicles.find(v => v.id === id))
        .filter(Boolean) as Vehicle[]

    // Handlers (simplificados para la demo visual, manteniendo lógica básica)
    const handleSaveInteraction = (data: InteractionData) => {
        setInteractions(prev => [data, ...prev])
        setShowInteractionModal(false)
    }
    const handleSaveTask = (data: TaskData) => {
        setTasks(prev => [data, ...prev])
        setShowTaskModal(false)
    }

    const openDocument = (type: 'proforma' | 'senal' | 'contrato' | 'factura') => {
        setDocumentType(type)
        setShowDocumentModal(true)
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="max-w-md p-0 overflow-hidden h-[90vh] flex flex-col gap-0 border-0 bg-[#f2f2f7] dark:bg-[#000000]">
                    <DialogTitle className="sr-only">Ficha de Contacto</DialogTitle>

                    {/* TopAppBar */}
                    <div className="sticky top-0 z-50 flex items-center bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 p-4 pb-2 justify-between h-14 transition-colors shrink-0">
                        <button
                            onClick={onClose}
                            className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[#135bec] text-2xl">arrow_back</span>
                        </button>
                        <h2 className="text-black dark:text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center">Ficha de Contacto</h2>
                        <div className="flex w-10 items-center justify-end">
                            <button className="flex size-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-[#135bec]">
                                <span className="material-symbols-outlined text-xl">edit</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pb-24 no-scrollbar">
                        {/* ProfileHeader */}
                        <div className="flex p-6 flex-col items-center bg-white dark:bg-[#1c1c1e] mb-4 shadow-sm transition-colors">
                            <div className="relative mb-4">
                                <div
                                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-28 w-28 ring-4 ring-[#135bec]/10"
                                    style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCrWZBbKoZYFn-3a-QTTJ4ZrJ4W7OeyRssQuFXu8MIq_jyOBUOiEYr87GXgf4VeP24jyGRitNlK-YcBZo0ixvIbV3rH4tZMnMzfLrqvsUqCuqEOsN_NcX5H6CQxiunfvA8worjFBJ5jz1QICUiNRrpI6QcD0I_XCybfH4zynfKFbBdpzJaLPoxAli0AkEPS6rDoojoWieJOP-D4BdD7VBiDzOJRTDc38iy-p9UTmMHJWsyCqi83U_mNtzOGYcP3nDzo5eyWd0DY40h1")' }}
                                ></div>
                                <div className="absolute bottom-1 right-1 bg-white dark:bg-black rounded-full p-1 border border-gray-100 dark:border-gray-800 shadow-sm">
                                    <span className="material-symbols-outlined text-[#135bec] text-sm">public</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-center justify-center gap-1">
                                <h1 className="text-2xl font-bold leading-tight tracking-tight text-center text-black dark:text-white">
                                    {contact.nombre} {contact.apellidos}
                                </h1>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-xs font-medium text-[#3c3c4399] dark:text-[#ebebf599]">
                                        ID: #{contact.id.substring(0, 4)}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-900/30 text-xs font-medium text-green-700 dark:text-green-400">
                                        Online hace 2h
                                    </span>
                                </div>
                                <p className="text-[#3c3c4399] dark:text-[#ebebf599] text-sm mt-2 font-medium text-center">
                                    Interesado en {contact.vehiculos_interes.length > 0 ? 'Vehículo seleccionado' : 'Varios'} • Madrid
                                </p>
                            </div>
                        </div>

                        {/* ActionsBar */}
                        <div className="grid grid-cols-4 gap-2 px-4 mb-6">
                            <button className="flex flex-col items-center gap-2 group" onClick={() => window.open(`tel:${contact.telefono}`)}>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#135bec] text-white shadow-lg shadow-[#135bec]/30 active:scale-95 transition-all">
                                    <span className="material-symbols-outlined text-2xl">call</span>
                                </div>
                                <span className="text-xs font-medium text-[#3c3c4399] dark:text-[#ebebf599] group-hover:text-[#135bec] transition-colors">Llamar</span>
                            </button>
                            <button className="flex flex-col items-center gap-2 group">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#135bec] text-white shadow-lg shadow-[#135bec]/30 active:scale-95 transition-all">
                                    <span className="material-symbols-outlined text-2xl">chat</span>
                                </div>
                                <span className="text-xs font-medium text-[#3c3c4399] dark:text-[#ebebf599] group-hover:text-[#135bec] transition-colors">WhatsApp</span>
                            </button>
                            <button className="flex flex-col items-center gap-2 group" onClick={() => window.open(`mailto:${contact.email}`)}>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#135bec] text-white shadow-lg shadow-[#135bec]/30 active:scale-95 transition-all">
                                    <span className="material-symbols-outlined text-2xl">mail</span>
                                </div>
                                <span className="text-xs font-medium text-[#3c3c4399] dark:text-[#ebebf599] group-hover:text-[#135bec] transition-colors">Email</span>
                            </button>
                            <button className="flex flex-col items-center gap-2 group" onClick={() => setShowTaskModal(true)}>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 active:scale-95 transition-all">
                                    <span className="material-symbols-outlined text-2xl">add_task</span>
                                </div>
                                <span className="text-xs font-medium text-[#3c3c4399] dark:text-[#ebebf599] group-hover:text-[#135bec] transition-colors">Tarea</span>
                            </button>
                        </div>

                        {/* Status Selector */}
                        <div className="px-4 mb-6">
                            <h3 className="text-sm uppercase tracking-wider text-[#3c3c4399] dark:text-[#ebebf599] font-bold mb-3 pl-1">Estado</h3>
                            <div className="flex flex-wrap gap-2">
                                {ESTADOS_BACKOFFICE.map(estado => {
                                    const isActive = estadoLead === estado.value
                                    return (
                                        <button
                                            key={estado.value}
                                            onClick={() => {
                                                setEstadoLead(estado.value)
                                                // Notificar al padre del cambio
                                                onStatusChange?.(contact.id, estado.value)
                                            }}
                                            className={cn(
                                                "flex h-9 items-center justify-center gap-x-2 rounded-lg px-3 shadow-sm active:scale-95 transition-all duration-200",
                                                isActive
                                                    ? "bg-[#135bec] shadow-md shadow-[#135bec]/20"
                                                    : "border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1c1c1e] hover:border-[#135bec]/50 hover:bg-[#135bec]/5"
                                            )}
                                        >
                                            <span className={cn(
                                                "material-symbols-outlined text-[16px] transition-colors",
                                                isActive ? "text-white filled" : "text-gray-400"
                                            )}>
                                                {isActive ? 'check_circle' : 'radio_button_unchecked'}
                                            </span>
                                            <p className={cn(
                                                "text-xs font-medium transition-colors whitespace-nowrap",
                                                isActive ? "text-white" : "text-black dark:text-white"
                                            )}>{estado.label}</p>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Segmented Content Tabs */}
                        <div className="sticky top-0 z-40 bg-[#f2f2f7]/95 dark:bg-[#000000]/95 backdrop-blur-sm px-4 pt-2 pb-4 border-b border-gray-200 dark:border-gray-800 mb-6">
                            <div className="flex p-1 bg-gray-200/50 dark:bg-gray-800/50 rounded-lg">
                                {[
                                    { id: 'cronologia', label: 'Cronología' },
                                    { id: 'vehiculos', label: 'Vehículos' },
                                    { id: 'notas', label: 'Notas' }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={cn(
                                            "flex-1 py-1.5 rounded-[6px] text-sm font-medium text-center transition-all",
                                            activeTab === tab.id
                                                ? "bg-white dark:bg-gray-700 text-[#135bec] dark:text-white shadow-sm font-bold"
                                                : "text-[#3c3c4399] dark:text-gray-400 hover:text-[#135bec]"
                                        )}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content Sections */}
                        <div className="px-4 mb-8">
                            {activeTab === 'cronologia' && (
                                <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-800 ml-3 space-y-8">
                                    {/* Nuevas interacciones guardadas */}
                                    {interactions.map((interaction) => {
                                        const tipoConfig: Record<string, { icon: string, bg: string, color: string, label: string }> = {
                                            'llamada_saliente': { icon: 'call', bg: 'bg-green-100', color: 'text-green-600', label: 'Llamada saliente' },
                                            'llamada_entrante': { icon: 'phone_callback', bg: 'bg-blue-100', color: 'text-blue-600', label: 'Llamada entrante' },
                                            'email_enviado': { icon: 'mail', bg: 'bg-purple-100', color: 'text-purple-600', label: 'Email enviado' },
                                            'email_recibido': { icon: 'mark_email_read', bg: 'bg-indigo-100', color: 'text-indigo-600', label: 'Email recibido' },
                                            'whatsapp': { icon: 'chat', bg: 'bg-emerald-100', color: 'text-emerald-600', label: 'WhatsApp' },
                                            'visita': { icon: 'storefront', bg: 'bg-orange-100', color: 'text-orange-600', label: 'Visita presencial' },
                                            'nota': { icon: 'sticky_note_2', bg: 'bg-yellow-100', color: 'text-yellow-600', label: 'Nota interna' },
                                        }
                                        const config = tipoConfig[interaction.tipo] || { icon: 'event', bg: 'bg-gray-100', color: 'text-gray-600', label: interaction.tipo }

                                        return (
                                            <div key={interaction.id} className="relative">
                                                <div className={`absolute -left-[25px] mt-1.5 flex h-8 w-8 items-center justify-center rounded-full ${config.bg} border-2 border-white dark:border-[#000000]`}>
                                                    <span className={`material-symbols-outlined ${config.color} text-sm`}>{config.icon}</span>
                                                </div>
                                                <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 ring-2 ring-green-500/20">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-base font-bold text-black dark:text-white">{config.label}</h4>
                                                            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Nuevo</span>
                                                        </div>
                                                        <span className="text-xs text-[#3c3c4399] dark:text-[#ebebf599] font-medium">{interaction.fecha} {interaction.hora}</span>
                                                    </div>
                                                    <p className="text-sm text-[#3c3c4399] dark:text-[#ebebf599]">
                                                        {interaction.descripcion || 'Sin descripción'}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })}

                                    {/* Mock Timeline Item 1 */}
                                    <div className="relative">
                                        <div className="absolute -left-[25px] mt-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 border-2 border-white dark:border-[#000000]">
                                            <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-sm">phone_missed</span>
                                        </div>
                                        <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="text-base font-bold text-black dark:text-white">Llamada perdida</h4>
                                                <span className="text-xs text-[#3c3c4399] dark:text-[#ebebf599] font-medium">Hace 2 horas</span>
                                            </div>
                                            <p className="text-sm text-[#3c3c4399] dark:text-[#ebebf599]">Llamada saliente sin respuesta. Dejar mensaje de voz.</p>
                                        </div>
                                    </div>

                                    {/* Mock Timeline Item 2 */}
                                    <div className="relative">
                                        <div className="absolute -left-[25px] mt-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 border-2 border-white dark:border-[#000000]">
                                            <span className="material-symbols-outlined text-[#135bec] text-sm">directions_car</span>
                                        </div>
                                        <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="text-base font-bold text-black dark:text-white">Prueba de Vehículo</h4>
                                                <span className="text-xs text-[#3c3c4399] dark:text-[#ebebf599] font-medium">Ayer, 16:30</span>
                                            </div>
                                            <p className="text-sm text-[#3c3c4399] dark:text-[#ebebf599] mb-3">Realizó prueba del Audi Q3. Comentó que le gusta el espacio del maletero pero duda del color.</p>

                                            {selectedVehicleFromContact(contactVehicles) && (
                                                <div className="flex gap-3 items-center bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                                                    <div className="w-12 h-12 rounded-md bg-cover bg-center" style={{ backgroundImage: `url(${selectedVehicleFromContact(contactVehicles)?.imagen_principal})` }}></div>
                                                    <div>
                                                        <p className="text-sm font-bold dark:text-white">{selectedVehicleFromContact(contactVehicles)?.marca} {selectedVehicleFromContact(contactVehicles)?.modelo}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Ref: {selectedVehicleFromContact(contactVehicles)?.id.substring(0, 5)} • {formatCurrency(selectedVehicleFromContact(contactVehicles)?.precio_venta || 0)}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Start Item */}
                                    <div className="relative">
                                        <div className="absolute -left-[25px] mt-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-[#000000]">
                                            <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 text-sm">person_add</span>
                                        </div>
                                        <div className="py-2">
                                            <p className="text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">Lead Creado • {formatDate(contact.fecha_registro)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'vehiculos' && (
                                <div className="space-y-4">
                                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                                        {contactVehicles.length > 0 ? contactVehicles.map(vehicle => (
                                            <div key={vehicle.id} className="w-64 flex-shrink-0 bg-white dark:bg-[#1c1c1e] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden group">
                                                <div className="h-32 bg-cover bg-center relative" style={{ backgroundImage: `url(${vehicle.imagen_principal})` }}>
                                                    <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm uppercase">{vehicle.estado}</div>
                                                </div>
                                                <div className="p-3">
                                                    <h4 className="font-bold text-black dark:text-white">{vehicle.marca} {vehicle.modelo}</h4>
                                                    <p className="text-xs text-[#3c3c4399] dark:text-[#ebebf599] mb-2">{vehicle.tipo_motor || vehicle.combustible} • {vehicle.año_matriculacion} • {vehicle.kilometraje.toLocaleString()}km</p>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[#135bec] font-bold text-lg">{formatCurrency(vehicle.precio_venta)}</span>
                                                        <button className="bg-gray-100 dark:bg-gray-700 p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                                                            <span className="material-symbols-outlined text-gray-600 dark:text-gray-300 text-sm">visibility</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="col-span-full p-8 text-center text-muted-foreground bg-white dark:bg-[#1c1c1e] rounded-xl border border-dashed border-gray-200">
                                                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">no_crash</span>
                                                <p>No hay vehículos asociados</p>
                                            </div>
                                        )}
                                    </div>

                                    <h3 className="text-lg font-bold text-black dark:text-white mt-6 mb-3">Sugerencias (Mock)</h3>
                                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar opacity-60 grayscale hover:grayscale-0 transition-all">
                                        {mockVehicles.slice(0, 2).map(vehicle => (
                                            <div key={vehicle.id} className="w-64 flex-shrink-0 bg-white dark:bg-[#1c1c1e] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden group">
                                                <div className="h-32 bg-cover bg-center relative" style={{ backgroundImage: `url(${vehicle.imagen_principal})` }}>
                                                </div>
                                                <div className="p-3">
                                                    <h4 className="font-bold text-black dark:text-white">{vehicle.marca} {vehicle.modelo}</h4>
                                                    <div className="flex justify-between items-center mt-2">
                                                        <span className="text-gray-500 font-bold">{formatCurrency(vehicle.precio_venta)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notas' && (
                                <div className="space-y-4">
                                    <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                        <textarea className="w-full bg-transparent border-0 p-0 text-sm text-black dark:text-white placeholder-gray-400 focus:ring-0 resize-none focus:outline-none" placeholder="Escribe una nota rápida..." rows={3}></textarea>
                                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                            <div className="flex gap-2">
                                                <button className="text-gray-400 hover:text-[#135bec] transition-colors"><span className="material-symbols-outlined text-xl">attach_file</span></button>
                                                <button className="text-gray-400 hover:text-[#135bec] transition-colors"><span className="material-symbols-outlined text-xl">image</span></button>
                                            </div>
                                            <button className="bg-[#135bec] hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-colors">Guardar</button>
                                        </div>
                                    </div>

                                    {/* Saved Notes List */}
                                    <div className="space-y-3">
                                        <div className="flex gap-3 items-start">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
                                                <span className="text-xs font-bold text-gray-600 dark:text-gray-300">YO</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="bg-white dark:bg-gray-800 p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl shadow-sm text-sm text-black dark:text-white">
                                                    Cliente prefiere contacto por las tardes a partir de las 18:00h. Está mirando financiación con su banco también.
                                                </div>
                                                <span className="text-[10px] text-gray-400 ml-1 mt-1 block">Ayer, 10:15 AM</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Floating Action Button */}
                    <div className="absolute bottom-6 right-6 z-50">
                        <button
                            onClick={() => setShowInteractionModal(true)}
                            className="flex h-14 w-14 items-center justify-center rounded-full bg-[#135bec] text-white shadow-xl shadow-[#135bec]/40 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-3xl">add</span>
                        </button>
                    </div>

                </DialogContent>
            </Dialog>

            {/* Hidden Modals reused logic */}
            <NewInteractionModal open={showInteractionModal} onClose={() => setShowInteractionModal(false)} contactId={contact.id} contactName={`${contact.nombre}`} onSave={handleSaveInteraction} />
            <AddTaskModal open={showTaskModal} onClose={() => setShowTaskModal(false)} contactId={contact.id} contactName={`${contact.nombre}`} onSave={handleSaveTask} />
            <DocumentModal open={showDocumentModal} onClose={() => setShowDocumentModal(false)} type={documentType} contact={contact} vehicle={contactVehicles[0]} onGenerate={() => { }} />

        </>
    )
}

// Helper
function selectedVehicleFromContact(vehicles: Vehicle[]) {
    return vehicles.length > 0 ? vehicles[0] : null
}
