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
import { Checkbox } from "@/components/ui/checkbox"
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
} from "lucide-react"
import { ORIGENES_CONTACTO } from "@/lib/constants"
import type { Contact } from "@/types"

interface NewContactModalProps {
    open: boolean
    onClose: () => void
    onContactCreated: (contact: Contact) => void
}

export function NewContactModal({ open, onClose, onContactCreated }: NewContactModalProps) {
    const [formData, setFormData] = useState({
        telefono: "",
        email: "",
        origen: "",
        consentimiento_rgpd: false,
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

        if (!formData.email.trim()) {
            newErrors.email = "El email es obligatorio"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Formato de email inválido"
        }

        if (!formData.origen) {
            newErrors.origen = "Selecciona el origen del contacto"
        }

        if (!formData.consentimiento_rgpd) {
            newErrors.consentimiento_rgpd = "Es necesario el consentimiento RGPD"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSave = (continueEditing: boolean) => {
        if (!validateForm()) return

        const newContact: Contact = {
            id: `c${Date.now()}`,
            telefono: formData.telefono,
            email: formData.email,
            origen: formData.origen as Contact['origen'],
            estado: 'nuevo',
            vehiculos_interes: [],
            preferencias_comunicacion: [],
            acepta_marketing: false,
            consentimiento_rgpd: formData.consentimiento_rgpd,
            fecha_registro: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }

        // Reset form
        setFormData({
            telefono: "",
            email: "",
            origen: "",
            consentimiento_rgpd: false,
        })
        setErrors({})

        if (continueEditing) {
            onContactCreated(newContact)
        } else {
            onClose()
        }
    }

    const handleClose = () => {
        setFormData({
            telefono: "",
            email: "",
            origen: "",
            consentimiento_rgpd: false,
        })
        setErrors({})
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Nuevo Contacto
                    </DialogTitle>
                    <DialogDescription>
                        Registra un nuevo contacto con los datos básicos. Podrás completar la información más adelante.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-4">
                    {/* Teléfono */}
                    <div className="space-y-2">
                        <Label htmlFor="telefono" className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Teléfono <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="telefono"
                            placeholder="+34 612 345 678"
                            value={formData.telefono}
                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                            className={errors.telefono ? "border-destructive" : ""}
                        />
                        {errors.telefono && (
                            <p className="text-xs text-destructive">{errors.telefono}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="cliente@email.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className={errors.email ? "border-destructive" : ""}
                        />
                        {errors.email && (
                            <p className="text-xs text-destructive">{errors.email}</p>
                        )}
                    </div>

                    {/* Origen */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            ¿Cómo nos ha contactado? <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={formData.origen}
                            onValueChange={(value) => setFormData({ ...formData, origen: value })}
                        >
                            <SelectTrigger className={errors.origen ? "border-destructive" : ""}>
                                <SelectValue placeholder="Selecciona el origen" />
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
                            <p className="text-xs text-destructive">{errors.origen}</p>
                        )}
                    </div>

                    {/* Consentimiento RGPD */}
                    <div className="flex items-start space-x-3 pt-2">
                        <Checkbox
                            id="rgpd"
                            checked={formData.consentimiento_rgpd}
                            onCheckedChange={(checked) =>
                                setFormData({ ...formData, consentimiento_rgpd: checked as boolean })
                            }
                            className={errors.consentimiento_rgpd ? "border-destructive" : ""}
                        />
                        <div className="grid gap-1.5 leading-none">
                            <Label
                                htmlFor="rgpd"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Consentimiento RGPD <span className="text-destructive">*</span>
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                El cliente consiente el tratamiento de sus datos personales
                            </p>
                        </div>
                    </div>
                    {errors.consentimiento_rgpd && (
                        <p className="text-xs text-destructive">{errors.consentimiento_rgpd}</p>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={handleClose}>
                        Cancelar
                    </Button>
                    <Button variant="outline" onClick={() => handleSave(false)} className="gap-2">
                        <Save className="h-4 w-4" />
                        Guardar
                    </Button>
                    <Button onClick={() => handleSave(true)} className="gap-2">
                        Guardar y completar datos
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
