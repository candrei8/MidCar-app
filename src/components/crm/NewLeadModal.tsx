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
    X,
    Sparkles
} from "lucide-react"
import { ESTADOS_LEAD, PRIORIDADES_LEAD, MARCAS } from "@/lib/constants"
import { cn } from "@/lib/utils"

interface NewLeadModalProps {
    open: boolean
    onClose: () => void
}

export function NewLeadModal({ open, onClose }: NewLeadModalProps) {
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
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setIsLoading(false)
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] bg-[#0a0a0a] border-white/10 text-white p-0 overflow-hidden gap-0">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
                
                <DialogHeader className="px-8 pt-8 pb-6 border-b border-white/5 relative z-10">
                    <DialogTitle className="text-2xl font-light tracking-wide flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Nuevo Lead
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground/60">
                        Introduce los detalles del cliente potencial y su vehículo de interés.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-8 space-y-8 relative z-10">
                    {/* Contact Info Section */}
                    <div className="space-y-4">
                        <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-2 mb-4">
                            <User className="h-3 w-3" />
                            Datos del Cliente
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nombre" className="text-xs text-white/60">Nombre</Label>
                                <Input 
                                    id="nombre" 
                                    placeholder="Juan" 
                                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                                    value={formData.nombre}
                                    onChange={e => setFormData({...formData, nombre: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="apellidos" className="text-xs text-white/60">Apellidos</Label>
                                <Input 
                                    id="apellidos" 
                                    placeholder="Pérez" 
                                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                                    value={formData.apellidos}
                                    onChange={e => setFormData({...formData, apellidos: e.target.value})}
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs text-white/60">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                                    <Input 
                                        id="email" 
                                        type="email" 
                                        placeholder="cliente@ejemplo.com" 
                                        className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="telefono" className="text-xs text-white/60">Teléfono</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                                    <Input 
                                        id="telefono" 
                                        type="tel" 
                                        placeholder="+34 600 000 000" 
                                        className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                                        value={formData.telefono}
                                        onChange={e => setFormData({...formData, telefono: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Vehicle Interest Section */}
                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-2 mb-4">
                            <Car className="h-3 w-3" />
                            Interés y Estado
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-white/60">Marca de Interés</Label>
                                <Select value={formData.marca} onValueChange={val => setFormData({...formData, marca: val})}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-primary/20">
                                        <SelectValue placeholder="Seleccionar marca" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1a1a1a] border-white/10 text-white max-h-[200px]">
                                        {MARCAS.map(marca => (
                                            <SelectItem key={marca} value={marca}>{marca}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="modelo" className="text-xs text-white/60">Modelo (Opcional)</Label>
                                <Input 
                                    id="modelo" 
                                    placeholder="Ej: Serie 3" 
                                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                                    value={formData.modelo}
                                    onChange={e => setFormData({...formData, modelo: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-white/60">Estado Inicial</Label>
                                <Select value={formData.estado} onValueChange={val => setFormData({...formData, estado: val})}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-primary/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                                        {ESTADOS_LEAD.map(estado => (
                                            <SelectItem key={estado.value} value={estado.value}>{estado.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-white/60">Prioridad</Label>
                                <Select value={formData.prioridad} onValueChange={val => setFormData({...formData, prioridad: val})}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-primary/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                                        {PRIORIDADES_LEAD.map(p => (
                                            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                        <Button 
                            variant="ghost" 
                            type="button" 
                            onClick={onClose}
                            className="text-muted-foreground hover:text-white hover:bg-white/5"
                        >
                            Cancelar
                        </Button>
                        <Button 
                            type="submit" 
                            className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[120px]"
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
