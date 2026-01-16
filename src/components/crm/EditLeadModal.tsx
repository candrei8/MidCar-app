"use client"

import { useState, useEffect } from "react"
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
import { Textarea } from "@/components/ui/textarea"
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
    Edit3
} from "lucide-react"
import { ESTADOS_LEAD, PRIORIDADES_LEAD, MARCAS } from "@/lib/constants"
import { updateLead } from "@/lib/supabase-service"
import { useToast } from "@/components/ui/toast"
import type { Lead } from "@/types"

interface EditLeadModalProps {
    lead: Lead
    open: boolean
    onClose: () => void
    onSave?: (updatedLead: Lead) => void
}

export function EditLeadModal({ lead, open, onClose, onSave }: EditLeadModalProps) {
    const { addToast } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        nombre: "",
        apellidos: "",
        email: "",
        telefono: "",
        tipo_interes: "",
        estado: "nuevo",
        prioridad: "media",
        notas: ""
    })

    // Initialize form with lead data
    useEffect(() => {
        if (lead && open) {
            setFormData({
                nombre: lead.cliente?.nombre || "",
                apellidos: lead.cliente?.apellidos || "",
                email: lead.cliente?.email || "",
                telefono: lead.cliente?.telefono || "",
                tipo_interes: lead.tipo_interes || "",
                estado: lead.estado || "nuevo",
                prioridad: lead.prioridad || "media",
                notas: lead.notas || ""
            })
        }
    }, [lead, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // Update lead in Supabase
            const updates: Partial<Lead> = {
                estado: formData.estado as Lead['estado'],
                prioridad: formData.prioridad as Lead['prioridad'],
                tipo_interes: formData.tipo_interes,
                notas: formData.notas,
                ultima_interaccion: new Date().toISOString(),
            }

            const result = await updateLead(lead.id, updates)

            if (result) {
                // Notify data update
                window.dispatchEvent(new CustomEvent('midcar-data-updated', { detail: { type: 'leads' } }))
                addToast('Lead actualizado correctamente', 'success')

                if (onSave) {
                    onSave({ ...lead, ...updates })
                }
                onClose()
            } else {
                throw new Error('No se pudo actualizar el lead')
            }
        } catch (error) {
            console.error('Error updating lead:', error)
            addToast('Error al actualizar el lead', 'error')
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
                        <Edit3 className="h-5 w-5 text-[#135bec]" />
                        Editar Lead
                    </DialogTitle>
                    <DialogDescription className="text-slate-500">
                        Modifica los datos del lead y guarda los cambios.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-8 space-y-8 relative z-10 max-h-[60vh] overflow-y-auto">
                    {/* Contact Info Section (Read-only display) */}
                    <div className="space-y-4">
                        <h3 className="text-xs uppercase tracking-widest text-[#135bec] font-bold flex items-center gap-2 mb-4">
                            <User className="h-3 w-3" />
                            Datos del Cliente
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-500">Nombre</Label>
                                <p className="text-sm font-medium p-2 bg-slate-50 rounded-md">
                                    {formData.nombre || '-'}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-500">Apellidos</Label>
                                <p className="text-sm font-medium p-2 bg-slate-50 rounded-md">
                                    {formData.apellidos || '-'}
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-500">Email</Label>
                                <p className="text-sm font-medium p-2 bg-slate-50 rounded-md flex items-center gap-2">
                                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                                    {formData.email || '-'}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-500">Telefono</Label>
                                <p className="text-sm font-medium p-2 bg-slate-50 rounded-md flex items-center gap-2">
                                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                                    {formData.telefono || '-'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Editable Fields */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <h3 className="text-xs uppercase tracking-widest text-[#135bec] font-bold flex items-center gap-2 mb-4">
                            <Car className="h-3 w-3" />
                            Estado y Seguimiento
                        </h3>

                        <div className="space-y-2">
                            <Label htmlFor="tipo_interes">Interes / Vehiculo</Label>
                            <Input
                                id="tipo_interes"
                                placeholder="Ej: BMW Serie 3, SUV familiar..."
                                value={formData.tipo_interes}
                                onChange={e => setFormData({ ...formData, tipo_interes: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Estado</Label>
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

                        <div className="space-y-2">
                            <Label htmlFor="notas">Notas</Label>
                            <Textarea
                                id="notas"
                                placeholder="Notas adicionales sobre el lead..."
                                className="min-h-[100px]"
                                value={formData.notas}
                                onChange={e => setFormData({ ...formData, notas: e.target.value })}
                            />
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
                                    Guardar Cambios
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
