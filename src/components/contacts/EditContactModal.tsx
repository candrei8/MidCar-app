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
    MapPin,
    Save,
    Edit3
} from "lucide-react"
import { ESTADOS_BACKOFFICE, ORIGENES_CONTACTO } from "@/lib/constants"
import { updateContact } from "@/lib/supabase-service"
import { useToast } from "@/components/ui/toast"
import type { Contact } from "@/types"

interface EditContactModalProps {
    contact: Contact
    open: boolean
    onClose: () => void
    onSave?: (updatedContact: Contact) => void
}

export function EditContactModal({ contact, open, onClose, onSave }: EditContactModalProps) {
    const { addToast } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        nombre: "",
        apellidos: "",
        email: "",
        telefono: "",
        dni_cif: "",
        direccion: "",
        codigo_postal: "",
        municipio: "",
        provincia: "",
        origen: "web" as Contact['origen'],
        estado: "pendiente" as Contact['estado'],
        notas: ""
    })

    // Initialize form with contact data
    useEffect(() => {
        if (contact && open) {
            setFormData({
                nombre: contact.nombre || "",
                apellidos: contact.apellidos || "",
                email: contact.email || "",
                telefono: contact.telefono || "",
                dni_cif: contact.dni_cif || "",
                direccion: contact.direccion || "",
                codigo_postal: contact.codigo_postal || "",
                municipio: contact.municipio || "",
                provincia: contact.provincia || "",
                origen: contact.origen || "web",
                estado: contact.estado || "pendiente",
                notas: contact.notas || ""
            })
        }
    }, [contact, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // Update contact in Supabase
            const updates: Partial<Contact> = {
                nombre: formData.nombre,
                apellidos: formData.apellidos,
                email: formData.email,
                telefono: formData.telefono,
                dni_cif: formData.dni_cif || undefined,
                direccion: formData.direccion || undefined,
                codigo_postal: formData.codigo_postal || undefined,
                municipio: formData.municipio || undefined,
                provincia: formData.provincia || undefined,
                origen: formData.origen,
                estado: formData.estado,
                notas: formData.notas || undefined,
                ultima_interaccion: new Date().toISOString(),
            }

            const result = await updateContact(contact.id, updates)

            if (result) {
                // Notify data update
                window.dispatchEvent(new CustomEvent('midcar-data-updated', { detail: { type: 'contacts' } }))
                addToast('Contacto actualizado correctamente', 'success')

                if (onSave) {
                    onSave({ ...contact, ...updates })
                }
                onClose()
            } else {
                throw new Error('No se pudo actualizar el contacto')
            }
        } catch (error) {
            console.error('Error updating contact:', error)
            addToast('Error al actualizar el contacto', 'error')
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
                        Editar Contacto
                    </DialogTitle>
                    <DialogDescription className="text-slate-500">
                        Modifica los datos del contacto y guarda los cambios.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-8 space-y-8 relative z-10 max-h-[60vh] overflow-y-auto">
                    {/* Personal Info Section */}
                    <div className="space-y-4">
                        <h3 className="text-xs uppercase tracking-widest text-[#135bec] font-bold flex items-center gap-2 mb-4">
                            <User className="h-3 w-3" />
                            Datos Personales
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nombre">Nombre</Label>
                                <Input
                                    id="nombre"
                                    placeholder="Nombre"
                                    value={formData.nombre}
                                    onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="apellidos">Apellidos</Label>
                                <Input
                                    id="apellidos"
                                    placeholder="Apellidos"
                                    value={formData.apellidos}
                                    onChange={e => setFormData({ ...formData, apellidos: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="email@ejemplo.com"
                                        className="pl-10"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="telefono">Teléfono</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="telefono"
                                        placeholder="612 345 678"
                                        className="pl-10"
                                        value={formData.telefono}
                                        onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dni_cif">DNI/CIF</Label>
                            <Input
                                id="dni_cif"
                                placeholder="12345678A"
                                value={formData.dni_cif}
                                onChange={e => setFormData({ ...formData, dni_cif: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Address Section */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <h3 className="text-xs uppercase tracking-widest text-[#135bec] font-bold flex items-center gap-2 mb-4">
                            <MapPin className="h-3 w-3" />
                            Dirección
                        </h3>
                        <div className="space-y-2">
                            <Label htmlFor="direccion">Dirección</Label>
                            <Input
                                id="direccion"
                                placeholder="Calle, número, piso..."
                                value={formData.direccion}
                                onChange={e => setFormData({ ...formData, direccion: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="codigo_postal">Código Postal</Label>
                                <Input
                                    id="codigo_postal"
                                    placeholder="28001"
                                    value={formData.codigo_postal}
                                    onChange={e => setFormData({ ...formData, codigo_postal: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="municipio">Municipio</Label>
                                <Input
                                    id="municipio"
                                    placeholder="Madrid"
                                    value={formData.municipio}
                                    onChange={e => setFormData({ ...formData, municipio: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="provincia">Provincia</Label>
                                <Input
                                    id="provincia"
                                    placeholder="Madrid"
                                    value={formData.provincia}
                                    onChange={e => setFormData({ ...formData, provincia: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Status Section */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <h3 className="text-xs uppercase tracking-widest text-[#135bec] font-bold mb-4">
                            Estado y Seguimiento
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Origen</Label>
                                <Select value={formData.origen} onValueChange={val => setFormData({ ...formData, origen: val as Contact['origen'] })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ORIGENES_CONTACTO.map(origen => (
                                            <SelectItem key={origen.value} value={origen.value}>{origen.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Estado</Label>
                                <Select value={formData.estado} onValueChange={val => setFormData({ ...formData, estado: val as Contact['estado'] })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ESTADOS_BACKOFFICE.map(estado => (
                                            <SelectItem key={estado.value} value={estado.value}>{estado.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notas">Notas</Label>
                            <Textarea
                                id="notas"
                                placeholder="Notas adicionales sobre el contacto..."
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
