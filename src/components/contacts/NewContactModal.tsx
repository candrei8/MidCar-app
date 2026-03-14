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
    Phone,
    Mail,
    Globe,
    MessageCircle,
    UserCheck,
    ExternalLink,
    Users,
    Save,
    ArrowRight,
    UserPlus
} from "lucide-react"
import { ORIGENES_CONTACTO } from "@/lib/constants"
import { createContact } from "@/lib/supabase-service"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/toast"
import type { Contact } from "@/types"

interface NewContactModalProps {
    open: boolean
    onClose: () => void
    onContactCreated: (contact: Contact) => void
}

export function NewContactModal({ open, onClose, onContactCreated }: NewContactModalProps) {
    const { user, profile } = useAuth()
    const { addToast } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        nombre: "",
        apellidos: "",
        telefono: "",
        email: "",
        origen: "",
    })
    const [errors, setErrors] = useState<Record<string, string>>({})

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

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.telefono.trim()) {
            newErrors.telefono = "El teléfono es obligatorio"
        } else if (!/^[\d\s+()-]+$/.test(formData.telefono)) {
            newErrors.telefono = "Formato de teléfono inválido"
        }

        // Email es opcional, pero si se proporciona debe ser válido
        if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Formato de email inválido"
        }

        if (!formData.origen) {
            newErrors.origen = "Selecciona el origen"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSave = async (continueEditing: boolean) => {
        if (!validateForm()) return

        setIsLoading(true)

        try {
            // Obtener nombre del creador
            const creatorName = profile
                ? `${profile.nombre} ${profile.apellidos}`.trim()
                : user?.email?.split('@')[0] || 'Usuario'

            const now = new Date().toISOString()
            const contactData = {
                nombre: formData.nombre || undefined,
                apellidos: formData.apellidos || undefined,
                telefono: formData.telefono,
                email: formData.email || '',
                origen: formData.origen as Contact['origen'],
                estado: 'pendiente' as Contact['estado'],
                vehiculos_interes: [] as string[],
                preferencias_comunicacion: [] as string[],
                acepta_marketing: false,
                consentimiento_rgpd: true,
                fecha_registro: now,
                created_at: now,
                updated_at: now,
                created_by: user?.id || undefined,
                created_by_name: creatorName,
            }

            // Guardar en Supabase
            const newContact = await createContact(contactData)

            if (newContact) {
                // Notificar actualización de datos
                window.dispatchEvent(new CustomEvent('midcar-data-updated', { detail: { type: 'contacts' } }))
                addToast('Contacto creado correctamente', 'success')

                // Reset form
                setFormData({
                    nombre: "",
                    apellidos: "",
                    telefono: "",
                    email: "",
                    origen: "",
                })
                setErrors({})

                if (continueEditing) {
                    onContactCreated(newContact)
                } else {
                    onClose()
                }
            } else {
                throw new Error('No se pudo crear el contacto')
            }
        } catch (error) {
            console.error('Error creating contact:', error)
            addToast('Error al crear el contacto', 'error')
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = () => {
        setFormData({
            nombre: "",
            apellidos: "",
            telefono: "",
            email: "",
            origen: "",
        })
        setErrors({})
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden">
                {/* Header */}
                <DialogHeader className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-slate-100">
                    <DialogTitle className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-[#135bec]" />
                        Nuevo Contacto
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 text-sm">
                        Registra los datos básicos del contacto.
                    </DialogDescription>
                </DialogHeader>

                {/* Form */}
                <div className="px-5 sm:px-6 py-5 sm:py-6 space-y-5">
                    {/* Nombre y Apellidos */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="nombre" className="text-sm font-medium text-slate-700">
                                Nombre <span className="text-slate-400 font-normal">(opcional)</span>
                            </Label>
                            <Input
                                id="nombre"
                                placeholder="Juan"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                className="h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="apellidos" className="text-sm font-medium text-slate-700">
                                Apellidos <span className="text-slate-400 font-normal">(opcional)</span>
                            </Label>
                            <Input
                                id="apellidos"
                                placeholder="Garcia"
                                value={formData.apellidos}
                                onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                                className="h-11"
                            />
                        </div>
                    </div>

                    {/* Telefono */}
                    <div className="space-y-2">
                        <Label htmlFor="telefono" className="text-sm font-medium text-slate-700">
                            Telefono <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                id="telefono"
                                placeholder="+34 612 345 678"
                                value={formData.telefono}
                                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                className={`pl-10 h-11 ${errors.telefono ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                            />
                        </div>
                        {errors.telefono && (
                            <p className="text-xs text-red-500">{errors.telefono}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                            Email <span className="text-slate-400 font-normal">(opcional)</span>
                        </Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="cliente@email.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className={`pl-10 h-11 ${errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                            />
                        </div>
                        {errors.email && (
                            <p className="text-xs text-red-500">{errors.email}</p>
                        )}
                    </div>

                    {/* Origen */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                            Origen <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={formData.origen}
                            onValueChange={(value) => setFormData({ ...formData, origen: value })}
                        >
                            <SelectTrigger className={`h-11 ${errors.origen ? "border-red-500 focus:ring-red-500" : ""}`}>
                                <SelectValue placeholder="¿Cómo nos contactó?" />
                            </SelectTrigger>
                            <SelectContent>
                                {ORIGENES_CONTACTO.map(origen => (
                                    <SelectItem key={origen.value} value={origen.value}>
                                        <div className="flex items-center gap-2">
                                            {getOrigenIcon(origen.value)}
                                            {origen.label}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.origen && (
                            <p className="text-xs text-red-500">{errors.origen}</p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 sm:px-6 py-4 bg-slate-50 border-t border-slate-100">
                    {/* Mobile: stack buttons */}
                    <div className="flex flex-col sm:hidden gap-2">
                        <Button
                            onClick={() => handleSave(true)}
                            disabled={isLoading}
                            className="w-full h-11 bg-[#135bec] hover:bg-blue-700 text-white gap-2"
                        >
                            {isLoading ? "Guardando..." : "Guardar y completar"}
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handleSave(false)}
                            disabled={isLoading}
                            className="w-full h-11 gap-2"
                        >
                            <Save className="h-4 w-4" />
                            Solo guardar
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={handleClose}
                            className="w-full h-11"
                        >
                            Cancelar
                        </Button>
                    </div>

                    {/* Desktop: horizontal buttons */}
                    <div className="hidden sm:flex justify-end gap-3">
                        <Button
                            variant="ghost"
                            onClick={handleClose}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handleSave(false)}
                            disabled={isLoading}
                            className="gap-2"
                        >
                            <Save className="h-4 w-4" />
                            Guardar
                        </Button>
                        <Button
                            onClick={() => handleSave(true)}
                            disabled={isLoading}
                            className="bg-[#135bec] hover:bg-blue-700 text-white gap-2"
                        >
                            {isLoading ? "Guardando..." : "Guardar y completar"}
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
