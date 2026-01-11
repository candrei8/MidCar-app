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
import { Checkbox } from "@/components/ui/checkbox"
import { Clock, Calendar, Save } from "lucide-react"
import { useToast } from "@/components/ui/toast"

interface PostponeContactModalProps {
    open: boolean
    onClose: () => void
    contactName: string
    onSave: (data: { fecha: string; hora: string; motivo: string; crearRecordatorio: boolean }) => void
}

export function PostponeContactModal({
    open,
    onClose,
    contactName,
    onSave
}: PostponeContactModalProps) {
    const { addToast } = useToast()
    const [fecha, setFecha] = useState('')
    const [hora, setHora] = useState('10:00')
    const [motivo, setMotivo] = useState('')
    const [crearRecordatorio, setCrearRecordatorio] = useState(true)

    const quickOptions = [
        { label: 'Mañana', days: 1 },
        { label: '3 días', days: 3 },
        { label: '1 semana', days: 7 },
        { label: '1 mes', days: 30 },
    ]

    const setQuickDate = (days: number) => {
        const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
        setFecha(date.toISOString().split('T')[0])
    }

    const handleSave = () => {
        if (!fecha) {
            addToast('Selecciona una fecha', 'warning')
            return
        }

        onSave({ fecha, hora, motivo, crearRecordatorio })
        onClose()

        // Reset
        setFecha('')
        setHora('10:00')
        setMotivo('')
        setCrearRecordatorio(true)
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md glass border-white/[0.06] p-0">
                <DialogHeader className="p-6 pb-4 border-b border-white/[0.04]">
                    <DialogTitle className="flex items-center gap-2 text-white/90">
                        <Clock className="h-5 w-5 text-primary" />
                        Aplazar Contacto
                    </DialogTitle>
                    <p className="text-xs text-white/40 mt-1">
                        ¿Cuándo quieres retomar a {contactName}?
                    </p>
                </DialogHeader>

                <div className="p-6 space-y-5">
                    {/* Opciones rápidas */}
                    <div className="space-y-2">
                        <Label className="text-xs text-white/50">Opciones rápidas</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {quickOptions.map(opt => (
                                <button
                                    key={opt.label}
                                    onClick={() => setQuickDate(opt.days)}
                                    className="p-2 text-xs rounded-lg border border-white/[0.06] bg-white/[0.02] text-white/60 hover:bg-white/[0.06] hover:text-white/80 transition-all"
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Fecha y hora específica */}
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
                            <Label className="text-xs text-white/50">Hora</Label>
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

                    {/* Motivo */}
                    <div className="space-y-2">
                        <Label className="text-xs text-white/50">Motivo del aplazamiento</Label>
                        <Input
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            placeholder="Ej: Cliente de vacaciones hasta enero"
                            className="bg-white/[0.02] border-white/[0.06] text-white/80 placeholder:text-white/20"
                        />
                    </div>

                    {/* Opciones */}
                    <div className="space-y-3 p-4 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="recordatorio"
                                checked={crearRecordatorio}
                                onCheckedChange={(c) => setCrearRecordatorio(c as boolean)}
                            />
                            <Label htmlFor="recordatorio" className="text-xs text-white/70 cursor-pointer">
                                Crear recordatorio en calendario
                            </Label>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/[0.04] flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} className="text-xs">
                        Cancelar
                    </Button>
                    <button onClick={handleSave} className="btn-luxury text-xs flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        Aplazar
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
