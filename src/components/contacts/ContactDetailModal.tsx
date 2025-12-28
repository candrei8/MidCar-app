"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Phone,
    Mail,
    MessageCircle,
    Car,
    User,
    FileText,
    Clock,
    MapPin,
    Building2,
    Save,
    Globe,
    ExternalLink,
    UserCheck,
    Users,
    X,
    Plus,
    Star,
    UserPlus,
    CheckSquare,
    Bookmark,
    FileSignature,
    Receipt,
    Calendar,
} from "lucide-react"
import type { Contact, Vehicle } from "@/types"
import { formatDate, formatCurrency, cn } from "@/lib/utils"
import { ORIGENES_CONTACTO, ESTADOS_BACKOFFICE, TIPOS_PAGO, CATEGORIAS_CONTACTO } from "@/lib/constants"
import { mockVehicles, mockUsers } from "@/lib/mock-data"
import { VehicleSelector } from "./VehicleSelector"
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
}

export function ContactDetailModal({ contact, open, onClose }: ContactDetailModalProps) {
    const [editedContact, setEditedContact] = useState<Contact>(contact)
    const [isVehicleSelectorOpen, setIsVehicleSelectorOpen] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null)
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
        contact.vehiculos_interes[0] || null
    )

    // CRM Action Modals state
    const [showInteractionModal, setShowInteractionModal] = useState(false)
    const [showTaskModal, setShowTaskModal] = useState(false)
    const [showPriorityModal, setShowPriorityModal] = useState(false)
    const [showPostponeModal, setShowPostponeModal] = useState(false)
    const [showAssignModal, setShowAssignModal] = useState(false)
    const [showDocumentModal, setShowDocumentModal] = useState(false)
    const [documentType, setDocumentType] = useState<'proforma' | 'senal' | 'contrato' | 'factura'>('proforma')
    const [interactions, setInteractions] = useState<InteractionData[]>([])
    const [tasks, setTasks] = useState<TaskData[]>([])

    // Get vehicles data
    const contactVehicles = editedContact.vehiculos_interes
        .map(id => mockVehicles.find(v => v.id === id))
        .filter(Boolean) as Vehicle[]

    const selectedVehicle = selectedVehicleId
        ? mockVehicles.find(v => v.id === selectedVehicleId)
        : contactVehicles[0]

    const assignedCommercial = mockUsers.find(u => u.id === editedContact.comercial_asignado)

    const updateField = <K extends keyof Contact>(field: K, value: Contact[K]) => {
        setEditedContact(prev => ({ ...prev, [field]: value }))
        setHasChanges(true)
    }

    const handleAddVehicles = (vehicleIds: string[]) => {
        const combined = [...editedContact.vehiculos_interes, ...vehicleIds]
        const newVehicles = Array.from(new Set(combined))
        updateField('vehiculos_interes', newVehicles)
        setIsVehicleSelectorOpen(false)
    }

    const handleRemoveVehicle = (vehicleId: string) => {
        updateField('vehiculos_interes', editedContact.vehiculos_interes.filter(id => id !== vehicleId))
    }

    const handleSave = () => {
        // Simular guardado (en producción guardaría en base de datos)
        setNotification({ message: '✓ Contacto guardado correctamente', type: 'success' })
        setHasChanges(false)
        setTimeout(() => setNotification(null), 3000)
    }

    // CRM Action Handlers
    const handleSaveInteraction = (data: InteractionData) => {
        setInteractions(prev => [data, ...prev])
        setNotification({ message: '✓ Interacción registrada', type: 'success' })
        setTimeout(() => setNotification(null), 2000)
    }

    const handleSaveTask = (data: TaskData) => {
        setTasks(prev => [data, ...prev])
        setNotification({ message: '✓ Tarea creada', type: 'success' })
        setTimeout(() => setNotification(null), 2000)
    }

    const handleSetPriority = (priority: string | null) => {
        updateField('prioridad' as any, priority)
        setNotification({ message: `✓ Prioridad actualizada: ${priority || 'Sin prioridad'}`, type: 'success' })
        setTimeout(() => setNotification(null), 2000)
    }

    const handlePostpone = (data: { fecha: string; hora: string; motivo: string }) => {
        updateField('aplazado_hasta' as any, data.fecha)
        setNotification({ message: `✓ Contacto aplazado hasta ${data.fecha}`, type: 'success' })
        setTimeout(() => setNotification(null), 2000)
    }

    const handleAssignCommercial = (commercialId: string) => {
        updateField('comercial_asignado', commercialId)
        const commercial = mockUsers.find(u => u.id === commercialId)
        setNotification({ message: `✓ Asignado a ${commercial?.nombre || 'comercial'}`, type: 'success' })
        setTimeout(() => setNotification(null), 2000)
    }

    const handleGenerateDocument = (data: any) => {
        setNotification({ message: `✓ Documento generado: ${data.numero}`, type: 'success' })
        setTimeout(() => setNotification(null), 2000)
    }

    const openDocumentModal = (type: 'proforma' | 'senal' | 'contrato' | 'factura') => {
        setDocumentType(type)
        setShowDocumentModal(true)
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

    const getContactName = () => {
        if (editedContact.nombre && editedContact.apellidos) {
            return `${editedContact.nombre} ${editedContact.apellidos}`
        }
        if (editedContact.nombre) {
            return editedContact.nombre
        }
        return editedContact.email.split('@')[0]
    }

    // Calculate total
    const totalPago = (editedContact.precio || 0) - (editedContact.reserva || 0)

    return (
        <>
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0">
                    <DialogHeader className="p-6 pb-0">
                        <div className="flex items-start justify-between">
                            <div>
                                <DialogTitle className="text-xl">
                                    {getContactName()}
                                </DialogTitle>
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge
                                        style={{
                                            backgroundColor: `${getEstadoColor(editedContact.estado)}20`,
                                            color: getEstadoColor(editedContact.estado),
                                        }}
                                    >
                                        {ESTADOS_BACKOFFICE.find(e => e.value === editedContact.estado)?.label || editedContact.estado}
                                    </Badge>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        {getOrigenIcon(editedContact.origen)}
                                        <span>
                                            {ORIGENES_CONTACTO.find(o => o.value === editedContact.origen)?.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <Progress value={editedContact.progreso || 0} className="w-20 h-2" />
                                        <span className="text-xs text-muted-foreground">
                                            {editedContact.progreso || 0}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                    <Phone className="h-4 w-4 mr-1" />
                                    Llamar
                                </Button>
                                <Button variant="outline" size="sm">
                                    <Mail className="h-4 w-4 mr-1" />
                                    Email
                                </Button>
                                <Button variant="outline" size="sm">
                                    <MessageCircle className="h-4 w-4 mr-1" />
                                    WhatsApp
                                </Button>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="grid grid-cols-12 gap-0 h-[calc(95vh-280px)]">
                        {/* Left panel - Vehicle list */}
                        <div className="col-span-2 border-r border-card-border">
                            <div className="p-3 border-b border-card-border">
                                <h3 className="font-medium text-sm">Coches asociados</h3>
                            </div>
                            <ScrollArea className="h-full">
                                {contactVehicles.map((vehicle) => (
                                    <div
                                        key={vehicle.id}
                                        className={cn(
                                            "p-3 cursor-pointer border-b border-card-border hover:bg-muted/50 transition-colors",
                                            selectedVehicleId === vehicle.id && "bg-primary/10 border-l-2 border-l-primary"
                                        )}
                                        onClick={() => setSelectedVehicleId(vehicle.id)}
                                    >
                                        <p className="font-medium text-sm">{vehicle.marca} {vehicle.modelo}</p>
                                        <p className="text-xs text-muted-foreground">{vehicle.matricula}</p>
                                    </div>
                                ))}
                                <div className="p-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full gap-1"
                                        onClick={() => setIsVehicleSelectorOpen(true)}
                                    >
                                        <Plus className="h-3 w-3" />
                                        Añadir
                                    </Button>
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Center panel - Contact info */}
                        <div className="col-span-6 overflow-auto">
                            <div className="p-4 space-y-4">
                                {/* Vehicle avatar section */}
                                {selectedVehicle && (
                                    <div className="flex gap-4 p-4 bg-muted/30 rounded-lg">
                                        <div
                                            className="w-24 h-24 rounded-lg bg-cover bg-center flex-shrink-0"
                                            style={{ backgroundImage: `url(${selectedVehicle.imagen_principal})` }}
                                        />
                                        <div>
                                            <h4 className="font-semibold">{selectedVehicle.marca} {selectedVehicle.modelo}</h4>
                                            <p className="text-sm text-muted-foreground">{selectedVehicle.version}</p>
                                            <p className="text-lg font-bold text-primary mt-1">{formatCurrency(selectedVehicle.precio_venta)}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Contact info grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="nombre">Nombre</Label>
                                        <Input
                                            id="nombre"
                                            value={editedContact.nombre || ''}
                                            onChange={(e) => updateField('nombre', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="apellidos">Apellidos</Label>
                                        <Input
                                            id="apellidos"
                                            value={editedContact.apellidos || ''}
                                            onChange={(e) => updateField('apellidos', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="telefono">Teléfono</Label>
                                        <Input
                                            id="telefono"
                                            value={editedContact.telefono}
                                            onChange={(e) => updateField('telefono', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Tipo pago</Label>
                                        <Select
                                            value={editedContact.tipo_pago || ''}
                                            onValueChange={(value) => updateField('tipo_pago', value as Contact['tipo_pago'])}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TIPOS_PAGO.map(tipo => (
                                                    <SelectItem key={tipo.value} value={tipo.value}>
                                                        {tipo.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="transporte">Transporte (€)</Label>
                                        <Input
                                            id="transporte"
                                            type="number"
                                            value={editedContact.transporte || ''}
                                            onChange={(e) => updateField('transporte', parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2 pt-6">
                                        <Checkbox
                                            id="nuevo_cliente"
                                            checked={editedContact.es_nuevo_cliente || false}
                                            onCheckedChange={(checked) => updateField('es_nuevo_cliente', checked as boolean)}
                                        />
                                        <Label htmlFor="nuevo_cliente">Nuevo cliente</Label>
                                    </div>
                                </div>

                                {/* Summary section */}
                                <Card className="card-premium">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Resumen</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Fecha contacto</p>
                                            <p className="font-medium text-sm">{formatDate(editedContact.fecha_registro)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Comercial</p>
                                            <p className="font-medium text-sm">
                                                {assignedCommercial ? `${assignedCommercial.nombre} ${assignedCommercial.apellidos}` : 'Sin asignar'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Canal</p>
                                            <p className="font-medium text-sm">
                                                {ORIGENES_CONTACTO.find(o => o.value === editedContact.origen)?.label}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Notes */}
                                <div className="space-y-2">
                                    <Label>Notas / Mensajes</Label>
                                    <Textarea
                                        value={editedContact.notas || ''}
                                        onChange={(e) => updateField('notas', e.target.value)}
                                        placeholder="Añade notas sobre este contacto..."
                                        className="min-h-[80px]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right panel - Financial info */}
                        <div className="col-span-4 border-l border-card-border bg-muted/20">
                            <div className="p-4 space-y-4">
                                <h3 className="font-medium">Información Financiera</h3>

                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        <Label>Coche</Label>
                                        <Input
                                            value={selectedVehicle ? selectedVehicle.matricula : 'No seleccionado'}
                                            disabled
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="precio">Precio (€)</Label>
                                        <Input
                                            id="precio"
                                            type="number"
                                            value={editedContact.precio || selectedVehicle?.precio_venta || ''}
                                            onChange={(e) => updateField('precio', parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reserva">Reserva (€)</Label>
                                        <Input
                                            id="reserva"
                                            type="number"
                                            value={editedContact.reserva || 0}
                                            onChange={(e) => updateField('reserva', parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="pt-2 border-t border-card-border">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Total pago:</span>
                                            <span className="text-xl font-bold text-primary">
                                                {formatCurrency(editedContact.precio || selectedVehicle?.precio_venta || 0)}
                                            </span>
                                        </div>
                                        {(editedContact.reserva || 0) > 0 && (
                                            <div className="flex justify-between items-center mt-1">
                                                <span className="text-xs text-muted-foreground">Pendiente:</span>
                                                <span className="text-sm font-medium">
                                                    {formatCurrency(totalPago)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Estado selector */}
                                <div className="space-y-2 pt-4">
                                    <Label>Estado</Label>
                                    <Select
                                        value={editedContact.estado}
                                        onValueChange={(value) => updateField('estado', value as Contact['estado'])}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ESTADOS_BACKOFFICE.map(estado => (
                                                <SelectItem key={estado.value} value={estado.value}>
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-2 h-2 rounded-full"
                                                            style={{ backgroundColor: estado.color }}
                                                        />
                                                        {estado.label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action bar */}
                    <div className="px-4 py-3 border-t border-card-border bg-muted/30 flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowInteractionModal(true)}>
                            <MessageCircle className="h-4 w-4" />
                            Nueva interacción
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowPriorityModal(true)}>
                            <Star className="h-4 w-4" />
                            Prioridad
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowPostponeModal(true)}>
                            <Clock className="h-4 w-4" />
                            Aplazar
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowAssignModal(true)}>
                            <UserPlus className="h-4 w-4" />
                            Asignar comercial
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowTaskModal(true)}>
                            <CheckSquare className="h-4 w-4" />
                            Añadir tarea
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => openDocumentModal('proforma')}>
                            <FileText className="h-4 w-4" />
                            Proforma
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => openDocumentModal('senal')}>
                            <Bookmark className="h-4 w-4" />
                            Señal
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => openDocumentModal('contrato')}>
                            <FileSignature className="h-4 w-4" />
                            Contrato
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => openDocumentModal('factura')}>
                            <Receipt className="h-4 w-4" />
                            Factura
                        </Button>
                    </div>

                    {/* Notification Toast */}
                    {notification && (
                        <div className={cn(
                            "fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 animate-in",
                            notification.type === 'success' ? "bg-green-500/90 text-white" : "bg-blue-500/90 text-white"
                        )}>
                            {notification.message}
                        </div>
                    )}

                    {/* Footer with save button */}
                    <div className="p-4 border-t flex justify-end gap-3">
                        <Button variant="outline" onClick={onClose}>
                            Cerrar
                        </Button>
                        <Button onClick={handleSave} disabled={!hasChanges} className="gap-2">
                            <Save className="h-4 w-4" />
                            Guardar cambios
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Vehicle Selector Modal */}
            <VehicleSelector
                open={isVehicleSelectorOpen}
                onClose={() => setIsVehicleSelectorOpen(false)}
                onSelect={handleAddVehicles}
                excludeIds={editedContact.vehiculos_interes}
            />

            {/* CRM Action Modals */}
            <NewInteractionModal
                open={showInteractionModal}
                onClose={() => setShowInteractionModal(false)}
                contactId={contact.id}
                contactName={`${contact.nombre} ${contact.apellidos}`}
                onSave={handleSaveInteraction}
            />

            <AddTaskModal
                open={showTaskModal}
                onClose={() => setShowTaskModal(false)}
                contactId={contact.id}
                contactName={`${contact.nombre} ${contact.apellidos}`}
                onSave={handleSaveTask}
            />

            <SetPriorityModal
                open={showPriorityModal}
                onClose={() => setShowPriorityModal(false)}
                currentPriority={(editedContact as any).prioridad || null}
                onSave={handleSetPriority}
            />

            <PostponeContactModal
                open={showPostponeModal}
                onClose={() => setShowPostponeModal(false)}
                contactName={`${contact.nombre} ${contact.apellidos}`}
                onSave={handlePostpone}
            />

            <AssignCommercialModal
                open={showAssignModal}
                onClose={() => setShowAssignModal(false)}
                currentCommercialId={editedContact.comercial_asignado || null}
                onSave={(id) => handleAssignCommercial(id)}
            />

            <DocumentModal
                open={showDocumentModal}
                onClose={() => setShowDocumentModal(false)}
                type={documentType}
                contact={editedContact}
                vehicle={selectedVehicle}
                onGenerate={handleGenerateDocument}
            />
        </>
    )
}
