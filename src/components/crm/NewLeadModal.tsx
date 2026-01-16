"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    User,
    Mail,
    Phone,
    Car,
    Save,
    Sparkles
} from "lucide-react"
import { ESTADOS_LEAD, PRIORIDADES_LEAD, MARCAS } from "@/lib/constants"
import { createLead } from "@/lib/supabase-service"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/toast"
import type { Lead } from "@/types"

interface NewLeadModalProps {
    open: boolean
    onClose: () => void
}

export function NewLeadModal({ open, onClose }: NewLeadModalProps) {
    const { user, profile } = useAuth()
    const { addToast } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        nombre: "",
        apellidos: "",
        email: "",
        telefono: "",
        marca: "",
        modelo: "",
        estado: "nuevo",
        prioridad: "media"
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // Obtener nombre del creador
            const creatorName = profile
                ? `${profile.nombre} ${profile.apellidos}`.trim()
                : user?.email?.split('@')[0] || 'Usuario'

            // Crear el nuevo lead en Supabase (sin id, Supabase lo genera)
            const newLead = {
                cliente_id: '', // Se generará en el backend o se puede crear un cliente primero
                vehiculo_id: null,
                estado: formData.estado as Lead['estado'],
                prioridad: formData.prioridad as Lead['prioridad'],
                probabilidad: 50,
                tipo_interes: formData.marca ? `${formData.marca} ${formData.modelo}`.trim() : 'General',
                presupuesto_cliente: 0,
                forma_pago: 'contado',
                asignado_a: user?.id || '',
                transcript_chatbot: [],
                sentimiento_ia: 'neutral' as Lead['sentimiento_ia'],
                fecha_creacion: new Date().toISOString(),
                fecha_cierre: null,
                ultima_interaccion: new Date().toISOString(),
                proxima_accion: null,
                fecha_proxima_accion: null,
                motivo_perdida: null,
                notas: '',
                created_by: user?.id || undefined,
                created_by_name: creatorName,
                // Datos del cliente embebidos
                cliente_nombre: formData.nombre,
                cliente_apellidos: formData.apellidos,
                cliente_email: formData.email || undefined,
                cliente_telefono: formData.telefono || undefined,
            }

            // Guardar en Supabase
            const result = await createLead(newLead)

            if (result) {
                // Notificar actualización de datos
                window.dispatchEvent(new CustomEvent('midcar-data-updated', { detail: { type: 'leads' } }))
                addToast('Lead creado correctamente', 'success')

                // Reset form
                setFormData({
                    nombre: "",
                    apellidos: "",
                    email: "",
                    telefono: "",
                    marca: "",
                    modelo: "",
                    estado: "nuevo",
                    prioridad: "media"
                })
                onClose()
            } else {
                throw new Error('No se pudo crear el lead')
            }
        } catch (error) {
            console.error('Error creating lead:', error)
            addToast('Error al crear el lead', 'error')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden gap-0">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-transparent pointer-events-none" />

                <DialogHeader className="px-8 pt-8 pb-6 border-b border-slate-100 relative z-10">
                    <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-[#135bec]" />
                        Nuevo Lead
                    </DialogTitle>
                    <DialogDescription className="text-slate-500">
                        Introduce los detalles del cliente potencial y su vehículo de interés.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-8 space-y-8 relative z-10">
                    {/* Contact Info Section */}
                    <div className="space-y-4">
                        <h3 className="text-xs uppercase tracking-widest text-[#135bec] font-bold flex items-center gap-2 mb-4">
                            <User className="h-3 w-3" />
                            Datos del Cliente
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nombre">Nombre</Label>
                                <Input
                                    id="nombre"
                                    placeholder="Juan"
                                    value={formData.nombre}
                                    onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="apellidos">Apellidos</Label>
                                <Input
                                    id="apellidos"
                                    placeholder="Pérez"
                                    value={formData.apellidos}
                                    onChange={e => setFormData({ ...formData, apellidos: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email (Opcional)</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="cliente@ejemplo.com"
                                        className="pl-9"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="telefono">Teléfono (Opcional)</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                    <Input
                                        id="telefono"
                                        type="tel"
                                        placeholder="+34 600 000 000"
                                        className="pl-9"
                                        value={formData.telefono}
                                        onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Vehicle Interest Section */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <h3 className="text-xs uppercase tracking-widest text-[#135bec] font-bold flex items-center gap-2 mb-4">
                            <Car className="h-3 w-3" />
                            Interés y Estado
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Marca de Interés</Label>
                                <Select value={formData.marca} onValueChange={val => setFormData({ ...formData, marca: val })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar marca" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MARCAS.map(marca => (
                                            <SelectItem key={marca} value={marca}>{marca}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="modelo">Modelo (Opcional)</Label>
                                <Input
                                    id="modelo"
                                    placeholder="Ej: Serie 3"
                                    value={formData.modelo}
                                    onChange={e => setFormData({ ...formData, modelo: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Estado Inicial</Label>
                                <Select value={formData.estado} onValueChange={val => setFormData({ ...formData, estado: val })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ESTADOS_LEAD.map(estado => (
                                            <SelectItem key={estado.value} value={estado.value}>{estado.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Prioridad</Label>
                                <Select value={formData.prioridad} onValueChange={val => setFormData({ ...formData, prioridad: val })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PRIORIDADES_LEAD.map(p => (
                                            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                        <Button
                            variant="ghost"
                            type="button"
                            onClick={onClose}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="bg-[#135bec] hover:bg-blue-700 text-white min-w-[120px]"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="animate-pulse">Guardando...</span>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Crear Lead
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
