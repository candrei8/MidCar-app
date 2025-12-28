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
    Phone,
    PhoneIncoming,
    Mail,
    MailOpen,
    MessageCircle,
    Building2,
    FileText,
    Save,
    Calendar,
    Clock
} from "lucide-react"
import { cn } from "@/lib/utils"

const INTERACTION_TYPES = [
    { value: 'llamada_saliente', label: 'Llamada saliente', icon: Phone },
    { value: 'llamada_entrante', label: 'Llamada entrante', icon: PhoneIncoming },
    { value: 'email_enviado', label: 'Email enviado', icon: Mail },
    { value: 'email_recibido', label: 'Email recibido', icon: MailOpen },
    { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
    { value: 'visita', label: 'Visita presencial', icon: Building2 },
    { value: 'nota', label: 'Nota interna', icon: FileText },
]

const RESULTS = [
    { value: 'contactado_interesado', label: 'Contactado - Interesado', color: 'text-green-400' },
    { value: 'contactado_no_interesa', label: 'Contactado - No interesa', color: 'text-red-400' },
    { value: 'no_contesta', label: 'No contesta', color: 'text-yellow-400' },
    { value: 'buzon', label: 'Buzón de voz', color: 'text-yellow-400' },
    { value: 'cita_programada', label: 'Cita programada', color: 'text-blue-400' },
    { value: 'pendiente', label: 'Pendiente de respuesta', color: 'text-orange-400' },
    { value: 'cerrado', label: 'Cerrado', color: 'text-gray-400' },
]

export interface InteractionData {
    id: string
    contactoId: string
    tipo: string
    fecha: string
    hora: string
    resultado: string
    descripcion: string
    seguimiento?: {
        fecha: string
        hora: string
    }
    creadoPor: string
    creadoEn: string
}

interface NewInteractionModalProps {
    open: boolean
    onClose: () => void
    contactId: string
    contactName: string
    onSave: (data: InteractionData) => void
}

export function NewInteractionModal({
    open,
    onClose,
    contactId,
    contactName,
    onSave
}: NewInteractionModalProps) {
    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toTimeString().slice(0, 5)

    const [tipo, setTipo] = useState('llamada_saliente')
    const [fecha, setFecha] = useState(today)
    const [hora, setHora] = useState(now)
    const [resultado, setResultado] = useState('contactado_interesado')
    const [descripcion, setDescripcion] = useState('')
    const [programarSeguimiento, setProgramarSeguimiento] = useState(false)
    const [seguimientoFecha, setSeguimientoFecha] = useState('')
    const [seguimientoHora, setSeguimientoHora] = useState('10:00')

    const handleSave = () => {
        const data: InteractionData = {
            id: `int-${Date.now()}`,
            contactoId: contactId,
            tipo,
            fecha,
            hora,
            resultado,
            descripcion,
            creadoPor: 'Admin',
            creadoEn: new Date().toISOString(),
        }

        if (programarSeguimiento && seguimientoFecha) {
            data.seguimiento = {
                fecha: seguimientoFecha,
                hora: seguimientoHora,
            }
        }

        onSave(data)
        onClose()

        // Reset form
        setTipo('llamada_saliente')
        setFecha(today)
        setHora(now)
        setResultado('contactado_interesado')
        setDescripcion('')
        setProgramarSeguimiento(false)
        setSeguimientoFecha('')
    }

    const SelectedIcon = INTERACTION_TYPES.find(t => t.value === tipo)?.icon || Phone

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg glass border-white/[0.06] p-0">
                <DialogHeader className="p-6 pb-4 border-b border-white/[0.04]">
                    <DialogTitle className="flex items-center gap-2 text-white/90">
                        <MessageCircle className="h-5 w-5 text-primary" />
                        Nueva Interacción
                    </DialogTitle>
                    <p className="text-xs text-white/40 mt-1">
                        Registrar interacción con {contactName}
                    </p>
                </DialogHeader>

                <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                    {/* Tipo de interacción */}
                    <div className="space-y-2">
                        <Label className="text-xs text-white/50">Tipo de interacción *</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {INTERACTION_TYPES.slice(0, 4).map(type => {
                                const Icon = type.icon
                                return (
                                    <button
                                        key={type.value}
                                        onClick={() => setTipo(type.value)}
                                        className={cn(
                                            "p-3 rounded-lg border text-center transition-all",
                                            tipo === type.value
                                                ? "border-primary bg-primary/10 text-primary"
                                                : "border-white/[0.06] bg-white/[0.02] text-white/50 hover:bg-white/[0.04]"
                                        )}
                                    >
                                        <Icon className="h-4 w-4 mx-auto mb-1" />
                                        <span className="text-[10px] block">{type.label.split(' ')[0]}</span>
                                    </button>
                                )
                            })}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {INTERACTION_TYPES.slice(4).map(type => {
                                const Icon = type.icon
                                return (
                                    <button
                                        key={type.value}
                                        onClick={() => setTipo(type.value)}
                                        className={cn(
                                            "p-3 rounded-lg border text-center transition-all",
                                            tipo === type.value
                                                ? "border-primary bg-primary/10 text-primary"
                                                : "border-white/[0.06] bg-white/[0.02] text-white/50 hover:bg-white/[0.04]"
                                        )}
                                    >
                                        <Icon className="h-4 w-4 mx-auto mb-1" />
                                        <span className="text-[10px] block">{type.label}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Fecha y hora */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs text-white/50">Fecha *</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
                                <Input
                                    type="date"
                                    value={fecha}
                                    onChange={(e) => setFecha(e.target.value)}
                                    className="pl-9 bg-white/[0.02] border-white/[0.06] text-white/80"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-white/50">Hora *</Label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
                                <Input
                                    type="time"
                                    value={hora}
                                    onChange={(e) => setHora(e.target.value)}
                                    className="pl-9 bg-white/[0.02] border-white/[0.06] text-white/80"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Resultado */}
                    <div className="space-y-2">
                        <Label className="text-xs text-white/50">Resultado *</Label>
                        <Select value={resultado} onValueChange={setResultado}>
                            <SelectTrigger className="bg-white/[0.02] border-white/[0.06] text-white/80">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass border-white/[0.06]">
                                {RESULTS.map(r => (
                                    <SelectItem key={r.value} value={r.value}>
                                        <span className={r.color}>{r.label}</span>
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
                            placeholder="Detalles de la interacción..."
                            className="min-h-[80px] bg-white/[0.02] border-white/[0.06] text-white/80 placeholder:text-white/20"
                        />
                    </div>

                    {/* Seguimiento */}
                    <div className="space-y-3 p-4 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="seguimiento"
                                checked={programarSeguimiento}
                                onCheckedChange={(c) => setProgramarSeguimiento(c as boolean)}
                            />
                            <Label htmlFor="seguimiento" className="text-xs text-white/70 cursor-pointer">
                                Programar seguimiento
                            </Label>
                        </div>

                        {programarSeguimiento && (
                            <div className="grid grid-cols-2 gap-3 mt-3">
                                <div className="space-y-1">
                                    <Label className="text-[10px] text-white/40">Fecha</Label>
                                    <Input
                                        type="date"
                                        value={seguimientoFecha}
                                        onChange={(e) => setSeguimientoFecha(e.target.value)}
                                        className="h-8 text-xs bg-white/[0.02] border-white/[0.06] text-white/80"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] text-white/40">Hora</Label>
                                    <Input
                                        type="time"
                                        value={seguimientoHora}
                                        onChange={(e) => setSeguimientoHora(e.target.value)}
                                        className="h-8 text-xs bg-white/[0.02] border-white/[0.06] text-white/80"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/[0.04] flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} className="text-xs">
                        Cancelar
                    </Button>
                    <button onClick={handleSave} className="btn-luxury text-xs flex items-center gap-2">
                        <Save className="h-3.5 w-3.5" />
                        Guardar Interacción
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
