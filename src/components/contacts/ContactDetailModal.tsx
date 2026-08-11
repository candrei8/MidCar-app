"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { cn, formatDate, formatCurrency, isModifiedAfterCreation } from "@/lib/utils"
import { Contact, Vehicle } from "@/types"
import { useFilteredData } from "@/hooks/useFilteredData"
import { ESTADOS_BACKOFFICE, ORIGENES_CONTACTO } from "@/lib/constants"
import {
    deleteContact,
    updateContact,
    getInteractionsByContact,
    createInteraction,
    getTasksByContact,
    createTask,
    updateTask,
    InteractionDB,
    TaskDB,
} from "@/lib/supabase-service"
import { useToast } from "@/components/ui/toast"
import { useAuth } from "@/lib/auth-context"
import { parseNotes, appendNote, removeNote } from "@/lib/contact-notes"

// Modales de acción
import { NewInteractionModal, InteractionData } from "./NewInteractionModal"
import { AddTaskModal, TaskData } from "./AddTaskModal"
import { EditContactModal } from "./EditContactModal"
import { VehicleSelector } from "./VehicleSelector"
import { DocumentGeneratorModal } from "@/components/documents/DocumentGeneratorModal"

// Helper para verificar si una URL de imagen es válida (excluye Azure CDN que no existe)
const isValidImageUrl = (url: string | null | undefined): boolean => {
    if (!url) return false
    return true
}

// Helper para obtener imagen válida
const getValidImageUrl = (url: string | null | undefined): string => {
    if (!url) {
        return '/placeholder-proximamente.svg'
    }
    return url
}

type ContactTab = 'cronologia' | 'vehiculos' | 'notas'

interface ContactDetailModalProps {
    contact: Contact
    open: boolean
    /** Pestaña con la que se abre la ficha (por defecto, la cronología) */
    initialTab?: ContactTab
    onClose: () => void
    onStatusChange?: (contactId: string, newStatus: string) => void
    onDelete?: (contactId: string) => void
}

export function ContactDetailModal({ contact, open, initialTab = 'cronologia', onClose, onStatusChange, onDelete }: ContactDetailModalProps) {
    const { addToast } = useToast()
    const [activeTab, setActiveTab] = useState<ContactTab>(initialTab)
    const { vehicles } = useFilteredData()

    // Estados mantenidos para funcionalidad
    const [showInteractionModal, setShowInteractionModal] = useState(false)
    const [showTaskModal, setShowTaskModal] = useState(false)
    const [showDocGenerator, setShowDocGenerator] = useState(false)
    const [docVehicle, setDocVehicle] = useState<Vehicle | null>(null)
    const [showDocVehiclePicker, setShowDocVehiclePicker] = useState(false)
    const [interactions, setInteractions] = useState<InteractionDB[]>([])
    const [tasks, setTasks] = useState<TaskDB[]>([])
    const [estadoLead, setEstadoLead] = useState(contact.estado)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showVehicleSelector, setShowVehicleSelector] = useState(false)
    const [currentContact, setCurrentContact] = useState<Contact>(contact)

    // Notas
    const { user, profile } = useAuth()
    const [nuevaNota, setNuevaNota] = useState('')
    const [savingNote, setSavingNote] = useState(false)
    const notas = parseNotes(currentContact.notas)

    // Si el modal se reutiliza para otro contacto, refrescamos el estado local
    useEffect(() => {
        setCurrentContact(contact)
        setEstadoLead(contact.estado)
        setNuevaNota('')
    }, [contact])

    // Al abrirse, respeta la pestaña con la que la han llamado
    useEffect(() => {
        if (open) setActiveTab(initialTab)
    }, [open, initialTab, contact.id])

    // Cronología y tareas guardadas en la BD
    useEffect(() => {
        if (!open) return
        let cancelado = false
        const cargar = async () => {
            const [ints, tsks] = await Promise.all([
                getInteractionsByContact(contact.id),
                getTasksByContact(contact.id),
            ])
            if (cancelado) return
            setInteractions(ints)
            setTasks(tsks)
        }
        cargar()
        return () => { cancelado = true }
    }, [contact.id, open])

    // Guarda el texto completo de notas en la BD y sincroniza el resto de la app
    const persistNotes = async (nuevoTexto: string): Promise<boolean> => {
        const result = await updateContact(currentContact.id, { notas: nuevoTexto })
        if (!result) return false
        setCurrentContact(prev => ({ ...prev, notas: nuevoTexto, updated_at: result.updated_at }))
        window.dispatchEvent(new CustomEvent('midcar-data-updated', { detail: { type: 'contacts' } }))
        return true
    }

    const handleSaveNote = async () => {
        if (!nuevaNota.trim() || savingNote) return
        setSavingNote(true)
        try {
            const autor = profile?.nombre || user?.email || undefined
            const ok = await persistNotes(appendNote(currentContact.notas, nuevaNota, autor))
            if (ok) {
                setNuevaNota('')
                addToast('Nota guardada', 'success')
            } else {
                addToast('Error al guardar la nota', 'error')
            }
        } catch (error) {
            console.error('Error saving note:', error)
            addToast('Error al guardar la nota', 'error')
        } finally {
            setSavingNote(false)
        }
    }

    const handleDeleteNote = async (id: string) => {
        const ok = await persistNotes(removeNote(currentContact.notas, id))
        addToast(ok ? 'Nota eliminada' : 'Error al eliminar la nota', ok ? 'success' : 'error')
    }

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const success = await deleteContact(contact.id)
            if (success) {
                addToast('Contacto eliminado correctamente', 'success')
                onDelete?.(contact.id)
                onClose()
            } else {
                addToast('Error al eliminar el contacto', 'error')
            }
        } catch (error) {
            console.error('Error deleting contact:', error)
            addToast('Error al eliminar el contacto', 'error')
        } finally {
            setIsDeleting(false)
            setShowDeleteConfirm(false)
        }
    }

    // Muchos contactos entran sin nombre; evitamos mostrar "null" en los modales
    const nombreContacto = [currentContact.nombre, currentContact.apellidos]
        .filter(Boolean)
        .join(' ')
        .trim() || currentContact.telefono || 'este contacto'

    // Obtener vehículos del contacto actual
    const contactVehicles = (currentContact.vehiculos_interes || [])
        .map(id => vehicles.find(v => v.id === id))
        .filter(Boolean) as Vehicle[]

    // Añadir vehículos al contacto
    const handleAddVehicles = async (vehicleIds: string[]) => {
        const updatedIds = [...new Set([...(currentContact.vehiculos_interes || []), ...vehicleIds])]
        const result = await updateContact(currentContact.id, { vehiculos_interes: updatedIds } as any)
        if (result) {
            setCurrentContact(prev => ({ ...prev, vehiculos_interes: updatedIds }))
            addToast(`${vehicleIds.length} vehículo${vehicleIds.length > 1 ? 's' : ''} añadido${vehicleIds.length > 1 ? 's' : ''}`, 'success')
        } else {
            addToast('Error al añadir vehículos', 'error')
        }
        setShowVehicleSelector(false)
    }

    // Quitar vehículo del contacto
    const handleRemoveVehicle = async (vehicleId: string) => {
        const updatedIds = (currentContact.vehiculos_interes || []).filter(id => id !== vehicleId)
        const result = await updateContact(currentContact.id, { vehiculos_interes: updatedIds } as any)
        if (result) {
            setCurrentContact(prev => ({ ...prev, vehiculos_interes: updatedIds }))
            addToast('Vehículo eliminado del contacto', 'success')
        }
    }

    // El modal de tareas usa etiquetas propias; la BD tiene su propio CHECK
    const TIPO_TAREA_DB: Record<string, string> = {
        llamar: 'llamada',
        email: 'email',
        documento: 'otro',
        cita: 'visita',
    }
    const PRIORIDAD_TAREA_DB: Record<string, string> = {
        baja: 'baja',
        normal: 'media',
        alta: 'alta',
        urgente: 'urgente',
    }

    const handleSaveInteraction = async (data: InteractionData) => {
        setShowInteractionModal(false)
        const creada = await createInteraction({
            contact_id: currentContact.id,
            tipo: data.tipo,
            fecha: data.fecha,
            hora: data.hora,
            descripcion: data.descripcion || null,
            resultado: data.resultado || null,
            seguimiento_fecha: data.seguimiento?.fecha || null,
            seguimiento_hora: data.seguimiento?.hora || null,
            realizada_por: profile?.id || null,
        })

        if (!creada) {
            addToast('Error al guardar la interacción', 'error')
            return
        }

        setInteractions(prev => [creada, ...prev])
        addToast('Interacción guardada', 'success')

        // La interacción cuenta como último contacto del cliente
        const ultima = new Date().toISOString()
        await updateContact(currentContact.id, { ultima_interaccion: ultima, fecha_ultimo_contacto: data.fecha })
        setCurrentContact(prev => ({ ...prev, ultima_interaccion: ultima, fecha_ultimo_contacto: data.fecha }))
        window.dispatchEvent(new CustomEvent('midcar-data-updated', { detail: { type: 'contacts' } }))
    }

    const handleSaveTask = async (data: TaskData) => {
        setShowTaskModal(false)
        const creada = await createTask({
            contact_id: currentContact.id,
            titulo: data.titulo,
            descripcion: data.descripcion || null,
            tipo: TIPO_TAREA_DB[data.tipo] || 'otro',
            prioridad: PRIORIDAD_TAREA_DB[data.prioridad] || 'media',
            fecha_vencimiento: data.fechaLimite,
            hora_vencimiento: data.horaLimite || null,
            asignado_a: profile?.id || null,
            completada: false,
        })

        if (!creada) {
            addToast('Error al guardar la tarea', 'error')
            return
        }

        setTasks(prev => [creada, ...prev])
        addToast('Tarea creada', 'success')
    }

    const handleToggleTask = async (task: TaskDB) => {
        const completada = !task.completada
        const actualizada = await updateTask(task.id, {
            completada,
            fecha_completada: completada ? new Date().toISOString() : null,
        })
        if (!actualizada) {
            addToast('Error al actualizar la tarea', 'error')
            return
        }
        setTasks(prev => prev.map(t => (t.id === task.id ? actualizada : t)))
    }

    // Cambio de estado del contacto: se guarda en la BD, no solo en pantalla
    const handleEstadoChange = async (nuevoEstado: Contact['estado']) => {
        const anterior = estadoLead
        setEstadoLead(nuevoEstado)
        const result = await updateContact(currentContact.id, { estado: nuevoEstado })
        if (!result) {
            setEstadoLead(anterior)
            addToast('Error al cambiar el estado', 'error')
            return
        }
        setCurrentContact(prev => ({ ...prev, estado: nuevoEstado, updated_at: result.updated_at }))
        onStatusChange?.(currentContact.id, nuevoEstado)
        window.dispatchEvent(new CustomEvent('midcar-data-updated', { detail: { type: 'contacts' } }))
    }

    // Generar factura / contrato de señal / compraventa / proforma
    // directamente desde la ficha del contacto
    const openDocumentGenerator = (vehicle?: Vehicle) => {
        if (vehicle) {
            setDocVehicle(vehicle)
            setShowDocGenerator(true)
            return
        }
        if (contactVehicles.length === 0) {
            setActiveTab('vehiculos')
            addToast('Asigna primero un vehículo al contacto para generar el documento', 'error')
            return
        }
        if (contactVehicles.length === 1) {
            setDocVehicle(contactVehicles[0])
            setShowDocGenerator(true)
            return
        }
        setShowDocVehiclePicker(true)
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent hideClose className="max-w-md p-0 overflow-hidden h-[90vh] flex flex-col gap-0 border-0 bg-[#f2f2f7] dark:bg-[#000000]">
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
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setShowEditModal(true)}
                                className="flex size-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-[#135bec]"
                            >
                                <span className="material-symbols-outlined text-xl">edit</span>
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="flex size-10 items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-500"
                            >
                                <span className="material-symbols-outlined text-xl">delete</span>
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
                                    {currentContact.nombre} {currentContact.apellidos}
                                </h1>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-xs font-medium text-[#3c3c4399] dark:text-[#ebebf599]">
                                        ID: #{currentContact.id.substring(0, 4)}
                                    </span>
                                    {currentContact.origen && (
                                        <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-xs font-medium text-blue-700 dark:text-blue-400 capitalize">
                                            {currentContact.origen}
                                        </span>
                                    )}
                                </div>
                                {currentContact.vehiculos_interes.length > 0 && (
                                    <p className="text-[#3c3c4399] dark:text-[#ebebf599] text-sm mt-2 font-medium text-center">
                                        {currentContact.vehiculos_interes.length} vehículo{currentContact.vehiculos_interes.length > 1 ? 's' : ''} de interés
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Creator Info Card */}
                        {(currentContact.created_by_name || currentContact.created_at) && (
                            <div className="mx-4 mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                <div className="flex items-center justify-between">
                                    {currentContact.created_by_name && (
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-sm">person</span>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-indigo-500 dark:text-indigo-400 uppercase tracking-wider font-medium">Creado por</p>
                                                <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">{currentContact.created_by_name}</p>
                                            </div>
                                        </div>
                                    )}
                                    {currentContact.created_at && (
                                        <div className="text-right">
                                            <p className="text-[10px] text-indigo-500 dark:text-indigo-400 uppercase tracking-wider font-medium">Añadido</p>
                                            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                                {new Date(currentContact.created_at).toLocaleDateString('es-ES', {
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
                                {isModifiedAfterCreation(currentContact.created_at, currentContact.updated_at) && (
                                    <div className="flex items-center justify-end gap-1.5 mt-2 pt-2 border-t border-indigo-100 dark:border-indigo-800">
                                        <span className="material-symbols-outlined text-indigo-500 dark:text-indigo-400 text-sm">edit_calendar</span>
                                        <p className="text-[10px] text-indigo-500 dark:text-indigo-400 uppercase tracking-wider font-medium">Modificado</p>
                                        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                            {new Date(currentContact.updated_at).toLocaleDateString('es-ES', {
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
                        )}

                        {/* ActionsBar */}
                        <div className="grid grid-cols-5 gap-2 px-4 mb-6">
                            <button className="flex flex-col items-center gap-2 group" onClick={() => window.open(`tel:${currentContact.telefono}`)}>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#135bec] text-white shadow-lg shadow-[#135bec]/30 active:scale-95 transition-all">
                                    <span className="material-symbols-outlined text-2xl">call</span>
                                </div>
                                <span className="text-xs font-medium text-[#3c3c4399] dark:text-[#ebebf599] group-hover:text-[#135bec] transition-colors">Llamar</span>
                            </button>
                            <button className="flex flex-col items-center gap-2 group" onClick={() => window.open(`https://wa.me/${(currentContact.telefono || '').replace(/\D/g, '').replace(/^(?!34)/, '34')}`)}>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#135bec] text-white shadow-lg shadow-[#135bec]/30 active:scale-95 transition-all">
                                    <span className="material-symbols-outlined text-2xl">chat</span>
                                </div>
                                <span className="text-xs font-medium text-[#3c3c4399] dark:text-[#ebebf599] group-hover:text-[#135bec] transition-colors">WhatsApp</span>
                            </button>
                            <button className="flex flex-col items-center gap-2 group" onClick={() => window.open(`mailto:${currentContact.email}`)}>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#135bec] text-white shadow-lg shadow-[#135bec]/30 active:scale-95 transition-all">
                                    <span className="material-symbols-outlined text-2xl">mail</span>
                                </div>
                                <span className="text-xs font-medium text-[#3c3c4399] dark:text-[#ebebf599] group-hover:text-[#135bec] transition-colors">Email</span>
                            </button>
                            <button className="flex flex-col items-center gap-2 group" onClick={() => openDocumentGenerator()}>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 active:scale-95 transition-all">
                                    <span className="material-symbols-outlined text-2xl">description</span>
                                </div>
                                <span className="text-xs font-medium text-[#3c3c4399] dark:text-[#ebebf599] group-hover:text-emerald-600 transition-colors">Documento</span>
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
                                            onClick={() => handleEstadoChange(estado.value as Contact['estado'])}
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
                                <>
                                {/* Tareas pendientes del contacto */}
                                {tasks.length > 0 && (
                                    <div className="mb-6 space-y-2">
                                        <h3 className="text-xs uppercase tracking-widest text-[#3c3c4399] dark:text-[#ebebf599] font-bold pl-1">Tareas</h3>
                                        {tasks.map(task => (
                                            <div key={task.id} className="flex items-start gap-3 bg-white dark:bg-[#1c1c1e] p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                                                <button
                                                    onClick={() => handleToggleTask(task)}
                                                    className={cn(
                                                        "mt-0.5 shrink-0 transition-colors",
                                                        task.completada ? "text-green-600" : "text-gray-300 hover:text-[#135bec]"
                                                    )}
                                                    title={task.completada ? 'Marcar como pendiente' : 'Marcar como completada'}
                                                >
                                                    <span className="material-symbols-outlined text-xl">
                                                        {task.completada ? 'check_circle' : 'radio_button_unchecked'}
                                                    </span>
                                                </button>
                                                <div className="min-w-0 flex-1">
                                                    <p className={cn(
                                                        "text-sm font-semibold text-black dark:text-white",
                                                        task.completada && "line-through text-gray-400 dark:text-gray-500"
                                                    )}>{task.titulo}</p>
                                                    {task.descripcion && (
                                                        <p className="text-xs text-[#3c3c4399] dark:text-[#ebebf599] whitespace-pre-wrap break-words">{task.descripcion}</p>
                                                    )}
                                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                                        Vence {formatDate(task.fecha_vencimiento)}{task.hora_vencimiento ? ` · ${task.hora_vencimiento.slice(0, 5)}` : ''}
                                                        {task.prioridad ? ` · Prioridad ${task.prioridad}` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-800 ml-3 space-y-8">
                                    {/* Interacciones guardadas */}
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
                                                <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                                                    <div className="flex justify-between items-start gap-2 mb-1">
                                                        <h4 className="text-base font-bold text-black dark:text-white">{config.label}</h4>
                                                        <span className="text-xs text-[#3c3c4399] dark:text-[#ebebf599] font-medium whitespace-nowrap">
                                                            {formatDate(interaction.fecha)}{interaction.hora ? ` · ${interaction.hora.slice(0, 5)}` : ''}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-[#3c3c4399] dark:text-[#ebebf599] whitespace-pre-wrap break-words">
                                                        {interaction.descripcion || 'Sin descripción'}
                                                    </p>
                                                    {interaction.seguimiento_fecha && (
                                                        <p className="text-[11px] text-[#135bec] font-medium mt-2">
                                                            Seguimiento: {formatDate(interaction.seguimiento_fecha)}{interaction.seguimiento_hora ? ` · ${interaction.seguimiento_hora.slice(0, 5)}` : ''}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}

                                    {/* Vehículo de interés si existe */}
                                    {selectedVehicleFromContact(contactVehicles) && (
                                        <div className="relative">
                                            <div className="absolute -left-[25px] mt-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 border-2 border-white dark:border-[#000000]">
                                                <span className="material-symbols-outlined text-[#135bec] text-sm">directions_car</span>
                                            </div>
                                            <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="text-base font-bold text-black dark:text-white">Vehículo de interés</h4>
                                                </div>
                                                <div className="flex gap-3 items-center bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                                                    <div
                                                        className="w-14 h-14 rounded-lg bg-cover bg-center bg-gray-100 flex-shrink-0"
                                                        style={{ backgroundImage: `url(${getValidImageUrl(selectedVehicleFromContact(contactVehicles)?.imagen_principal)})` }}
                                                    />
                                                    <div>
                                                        <p className="text-sm font-bold dark:text-white">{selectedVehicleFromContact(contactVehicles)?.marca} {selectedVehicleFromContact(contactVehicles)?.modelo}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatCurrency(selectedVehicleFromContact(contactVehicles)?.precio_venta || 0)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Contacto Creado */}
                                    <div className="relative">
                                        <div className="absolute -left-[25px] mt-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-[#000000]">
                                            <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 text-sm">person_add</span>
                                        </div>
                                        <div className="py-2">
                                            <p className="text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">Lead Creado • {formatDate(contact.fecha_registro)}</p>
                                        </div>
                                    </div>
                                </div>
                                </>
                            )}

                            {activeTab === 'vehiculos' && (
                                <div className="space-y-4">
                                    {/* Botón añadir vehículo */}
                                    <button
                                        onClick={() => setShowVehicleSelector(true)}
                                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-[#135bec]/30 text-[#135bec] font-semibold text-sm hover:bg-blue-50 hover:border-[#135bec]/50 transition-all active:scale-[0.98]"
                                    >
                                        <span className="material-symbols-outlined text-xl">add</span>
                                        Asignar vehículo del inventario
                                    </button>

                                    {/* Vehículos asignados */}
                                    {contactVehicles.length > 0 ? (
                                        <div className="space-y-3">
                                            {contactVehicles.map(vehicle => (
                                                <div key={vehicle.id} className="flex items-center gap-3 p-3 bg-white dark:bg-[#1c1c1e] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                                    <div
                                                        className="w-16 h-16 rounded-lg bg-cover bg-center bg-gray-100 flex-shrink-0"
                                                        style={{ backgroundImage: `url(${getValidImageUrl(vehicle.imagen_principal)})` }}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-sm text-black dark:text-white truncate">{vehicle.marca} {vehicle.modelo}</h4>
                                                        <p className="text-xs text-gray-500 truncate">{vehicle.combustible} • {vehicle.año_matriculacion} • {vehicle.kilometraje.toLocaleString()} km</p>
                                                        <span className="text-[#135bec] font-bold text-sm">{formatCurrency(vehicle.precio_venta)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                        <span className={cn(
                                                            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                                                            vehicle.estado === 'disponible' ? "bg-green-100 text-green-700"
                                                                : vehicle.estado === 'reservado' ? "bg-amber-100 text-amber-700"
                                                                : "bg-slate-100 text-slate-600"
                                                        )}>
                                                            {vehicle.estado}
                                                        </span>
                                                        <button
                                                            onClick={() => openDocumentGenerator(vehicle)}
                                                            className="h-8 w-8 flex items-center justify-center rounded-full text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                                            title="Generar documento (factura, señal, compraventa, proforma)"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">description</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemoveVehicle(vehicle.id)}
                                                            className="h-8 w-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                            title="Quitar vehículo"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">close</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-muted-foreground bg-white dark:bg-[#1c1c1e] rounded-xl border border-dashed border-gray-200">
                                            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">no_crash</span>
                                            <p className="text-sm">No hay vehículos asociados</p>
                                            <p className="text-xs text-gray-400 mt-1">Pulsa el botón de arriba para asignar vehículos</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'notas' && (
                                <div className="space-y-4">
                                    <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                        <textarea
                                            value={nuevaNota}
                                            onChange={e => setNuevaNota(e.target.value)}
                                            className="w-full bg-transparent border-0 p-0 text-sm text-black dark:text-white placeholder-gray-400 focus:ring-0 resize-none focus:outline-none"
                                            placeholder="Escribe una nota rápida..."
                                            rows={3}
                                        />
                                        <div className="flex justify-end items-center mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                            <button
                                                onClick={handleSaveNote}
                                                disabled={!nuevaNota.trim() || savingNote}
                                                className="bg-[#135bec] hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-colors"
                                            >
                                                {savingNote ? 'Guardando…' : 'Guardar'}
                                            </button>
                                        </div>
                                    </div>

                                    {notas.length > 0 ? (
                                        <div className="space-y-3">
                                            {notas.map(nota => (
                                                <div key={nota.id} className="bg-white dark:bg-[#1c1c1e] p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                                    <div className="flex justify-between items-start gap-2 mb-1">
                                                        <span className="text-xs font-medium text-[#3c3c4399] dark:text-[#ebebf599]">
                                                            {nota.fecha
                                                                ? `${nota.fecha}${nota.hora ? ` · ${nota.hora}` : ''}${nota.autor ? ` · ${nota.autor}` : ''}`
                                                                : 'Nota sin fecha'}
                                                        </span>
                                                        <button
                                                            onClick={() => handleDeleteNote(nota.id)}
                                                            className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
                                                            title="Eliminar nota"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">delete</span>
                                                        </button>
                                                    </div>
                                                    <p className="text-sm text-black dark:text-white whitespace-pre-wrap break-words">{nota.texto}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2 block">edit_note</span>
                                            <p className="text-sm text-gray-400 dark:text-gray-500">Sin notas aún. Añade una nota para recordar detalles importantes.</p>
                                        </div>
                                    )}
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
            <NewInteractionModal open={showInteractionModal} onClose={() => setShowInteractionModal(false)} contactId={currentContact.id} contactName={nombreContacto} onSave={handleSaveInteraction} />
            <AddTaskModal open={showTaskModal} onClose={() => setShowTaskModal(false)} contactId={currentContact.id} contactName={nombreContacto} onSave={handleSaveTask} />

            {/* Generador de documentos (factura, señal, compraventa, proforma)
                con el contacto ya preseleccionado como cliente */}
            {docVehicle && (
                <DocumentGeneratorModal
                    isOpen={showDocGenerator}
                    onClose={() => setShowDocGenerator(false)}
                    vehicle={docVehicle}
                    contacts={[currentContact]}
                    preselectedContactId={currentContact.id}
                />
            )}

            {/* Selector de vehículo cuando el contacto tiene varios de interés */}
            <Dialog open={showDocVehiclePicker} onOpenChange={setShowDocVehiclePicker}>
                <DialogContent className="max-w-sm p-0 overflow-y-auto max-h-[80dvh] gap-0">
                    <DialogTitle className="sr-only">Elegir vehículo para el documento</DialogTitle>
                    <div className="p-5">
                        <h3 className="text-lg font-bold mb-1">¿Para qué vehículo?</h3>
                        <p className="text-sm text-gray-500 mb-4">Elige el vehículo del documento</p>
                        <div className="space-y-2">
                            {contactVehicles.map(vehicle => (
                                <button
                                    key={vehicle.id}
                                    onClick={() => {
                                        setShowDocVehiclePicker(false)
                                        setDocVehicle(vehicle)
                                        setShowDocGenerator(true)
                                    }}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-[#135bec] hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors text-left"
                                >
                                    <div
                                        className="w-12 h-12 rounded-lg bg-cover bg-center bg-gray-100 flex-shrink-0"
                                        style={{ backgroundImage: `url(${getValidImageUrl(vehicle.imagen_principal)})` }}
                                    />
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold truncate">{vehicle.marca} {vehicle.modelo}</p>
                                        <p className="text-xs text-gray-500">{vehicle.matricula} • {formatCurrency(vehicle.precio_venta)}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Vehicle Selector Modal */}
            <VehicleSelector
                open={showVehicleSelector}
                onClose={() => setShowVehicleSelector(false)}
                onSelect={handleAddVehicles}
                excludeIds={currentContact.vehiculos_interes || []}
            />

            {/* Edit Contact Modal */}
            <EditContactModal
                contact={currentContact}
                open={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSave={(updatedContact) => {
                    setCurrentContact(updatedContact)
                    if (onStatusChange && updatedContact.estado !== contact.estado) {
                        onStatusChange(contact.id, updatedContact.estado)
                    }
                }}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent className="max-w-sm p-0 overflow-y-auto max-h-[90dvh] gap-0">
                    <DialogTitle className="sr-only">Eliminar Contacto</DialogTitle>
                    <div className="p-6 text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-3xl text-red-500">delete_forever</span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">Eliminar Contacto</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            ¿Estás seguro de que quieres eliminar este contacto? Esta acción no se puede deshacer.
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
            </Dialog >
        </>
    )
}

// Helper
function selectedVehicleFromContact(vehicles: Vehicle[]) {
    return vehicles.length > 0 ? vehicles[0] : null
}
