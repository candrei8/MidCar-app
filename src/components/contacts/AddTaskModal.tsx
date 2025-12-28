"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    CheckSquare,
    Phone,
    Mail,
    FileText,
    Car,
    Calendar,
    Clock,
    Save
} from "lucide-react"
import { cn } from "@/lib/utils"
import { mockUsers } from "@/lib/mock-data"

const TASK_TYPES = [
    { value: 'llamar', label: 'Llamar', icon: Phone },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'documento', label: 'Documento', icon: FileText },
    { value: 'cita', label: 'Cita', icon: Car },
]

const PRIORITIES = [
    { value: 'baja', label: 'Baja', color: 'bg-gray-500' },
    { value: 'normal', label: 'Normal', color: 'bg-blue-500' },
    { value: 'alta', label: 'Alta', color: 'bg-orange-500' },
    { value: 'urgente', label: 'Urgente', color: 'bg-red-500' },
]

export interface TaskData {
    id: string
    contactoId: string
    titulo: string
    tipo: string
    fechaLimite: string
    horaLimite: string
    asignadoA: string
    descripcion: string
    prioridad: string
    recordatorio: boolean
    completada: boolean
    creadoEn: string
}

interface AddTaskModalProps {
    open: boolean
    onClose: () => void
    contactId: string
    contactName: string
    onSave: (data: TaskData) => void
}

export function AddTaskModal({
    open,
    onClose,
    contactId,
    contactName,
    onSave
}: AddTaskModalProps) {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const [titulo, setTitulo] = useState('')
    const [tipo, setTipo] = useState('llamar')
    const [fechaLimite, setFechaLimite] = useState(tomorrow)
    const [horaLimite, setHoraLimite] = useState('10:00')
    const [asignadoA, setAsignadoA] = useState('user-1')
    const [descripcion, setDescripcion] = useState('')
    const [prioridad, setPrioridad] = useState('normal')
    const [recordatorio, setRecordatorio] = useState(true)

    const handleSave = () => {
        if (!titulo.trim()) {
            alert('El título es obligatorio')
            return
        }

        const data: TaskData = {
            id: `task-${Date.now()}`,
            contactoId: contactId,
            titulo,
            tipo,
            fechaLimite,
            horaLimite,
            asignadoA,
            descripcion,
            prioridad,
            recordatorio,
            completada: false,
            creadoEn: new Date().toISOString(),
        }

        onSave(data)
        onClose()

        // Reset form
        setTitulo('')
        setTipo('llamar')
        setFechaLimite(tomorrow)
        setHoraLimite('10:00')
        setDescripcion('')
        setPrioridad('normal')
        setRecordatorio(true)
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg glass border-white/[0.06] p-0">
                <DialogHeader className="p-6 pb-4 border-b border-white/[0.04]">
                    <DialogTitle className="flex items-center gap-2 text-white/90">
                        <CheckSquare className="h-5 w-5 text-primary" />
                        Nueva Tarea
                    </DialogTitle>
                    <p className="text-xs text-white/40 mt-1">
                        Crear tarea para {contactName}
                    </p>
                </DialogHeader>

                <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                    {/* Título */}
                    <div className="space-y-2">
                        <Label className="text-xs text-white/50">Título de la tarea *</Label>
                        <Input
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            placeholder="Ej: Enviar presupuesto de financiación"
                            className="bg-white/[0.02] border-white/[0.06] text-white/80 placeholder:text-white/20"
                        />
                    </div>

                    {/* Tipo de tarea */}
                    <div className="space-y-2">
                        <Label className="text-xs text-white/50">Tipo de tarea</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {TASK_TYPES.map(t => {
                                const Icon = t.icon
                                return (
                                    <button
                                        key={t.value}
                                        onClick={() => setTipo(t.value)}
                                        className={cn(
                                            "p-3 rounded-lg border text-center transition-all",
                                            tipo === t.value
                                                ? "border-primary bg-primary/10 text-primary"
                                                : "border-white/[0.06] bg-white/[0.02] text-white/50 hover:bg-white/[0.04]"
                                        )}
                                    >
                                        <Icon className="h-4 w-4 mx-auto mb-1" />
                                        <span className="text-[10px] block">{t.label}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Fecha y hora límite */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs text-white/50">Fecha límite *</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
                                <Input
                                    type="date"
                                    value={fechaLimite}
                                    onChange={(e) => setFechaLimite(e.target.value)}
                                    className="pl-9 bg-white/[0.02] border-white/[0.06] text-white/80"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-white/50">Hora</Label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
                                <Input
                                    type="time"
                                    value={horaLimite}
                                    onChange={(e) => setHoraLimite(e.target.value)}
                                    className="pl-9 bg-white/[0.02] border-white/[0.06] text-white/80"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Asignar a */}
                    <div className="space-y-2">
                        <Label className="text-xs text-white/50">Asignar a</Label>
                        <Select value={asignadoA} onValueChange={setAsignadoA}>
                            <SelectTrigger className="bg-white/[0.02] border-white/[0.06] text-white/80">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass border-white/[0.06]">
                                {mockUsers.map(user => (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.nombre} {user.apellidos}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Descripción */}
                    <div className="space-y-2">
                        <Label className="text-xs text-white/50">Descripción</Label>
                        <Textarea
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            placeholder="Detalles de la tarea..."
                            className="min-h-[60px] bg-white/[0.02] border-white/[0.06] text-white/80 placeholder:text-white/20"
                        />
                    </div>

                    {/* Prioridad */}
                    <div className="space-y-2">
                        <Label className="text-xs text-white/50">Prioridad</Label>
                        <div className="flex gap-2">
                            {PRIORITIES.map(p => (
                                <button
                                    key={p.value}
                                    onClick={() => setPrioridad(p.value)}
                                    className={cn(
                                        "flex-1 py-2 rounded-lg border text-xs font-medium transition-all",
                                        prioridad === p.value
                                            ? "border-white/20 bg-white/10 text-white"
                                            : "border-white/[0.06] bg-white/[0.02] text-white/50 hover:bg-white/[0.04]"
                                    )}
                                >
                                    <span className={cn("inline-block w-2 h-2 rounded-full mr-1.5", p.color)} />
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Recordatorio */}
                    <div className="flex items-center space-x-2 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                        <Checkbox
                            id="recordatorio"
                            checked={recordatorio}
                            onCheckedChange={(c) => setRecordatorio(c as boolean)}
                        />
                        <Label htmlFor="recordatorio" className="text-xs text-white/70 cursor-pointer">
                            Recordarme 1 hora antes
                        </Label>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/[0.04] flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} className="text-xs">
                        Cancelar
                    </Button>
                    <button onClick={handleSave} className="btn-luxury text-xs flex items-center gap-2">
                        <Save className="h-3.5 w-3.5" />
                        Crear Tarea
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
