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
import { UserPlus, Search, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { mockUsers } from "@/lib/mock-data"
import { useToast } from "@/components/ui/toast"

interface AssignCommercialModalProps {
    open: boolean
    onClose: () => void
    currentCommercialId: string | null
    onSave: (commercialId: string, motivo: string, notificar: boolean) => void
}

export function AssignCommercialModal({
    open,
    onClose,
    currentCommercialId,
    onSave
}: AssignCommercialModalProps) {
    const { addToast } = useToast()
    const [selectedId, setSelectedId] = useState(currentCommercialId || '')
    const [searchQuery, setSearchQuery] = useState('')
    const [motivo, setMotivo] = useState('')
    const [notificar, setNotificar] = useState(true)

    const commercials = mockUsers.filter(u => u.rol === 'vendedor' || u.rol === 'admin')

    const filteredCommercials = commercials.filter(c =>
        `${c.nombre} ${c.apellidos}`.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleSave = () => {
        if (!selectedId) {
            addToast('Selecciona un comercial', 'warning')
            return
        }

        onSave(selectedId, motivo, notificar)
        onClose()

        // Reset
        setMotivo('')
        setNotificar(true)
    }

    // Mock active contacts count
    const getActiveContacts = (userId: string) => {
        return Math.floor(Math.random() * 20) + 1
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md glass border-white/[0.06] p-0">
                <DialogHeader className="p-6 pb-4 border-b border-white/[0.04]">
                    <DialogTitle className="flex items-center gap-2 text-white/90">
                        <UserPlus className="h-5 w-5 text-primary" />
                        Asignar Comercial
                    </DialogTitle>
                    {currentCommercialId && (
                        <p className="text-xs text-white/40 mt-1">
                            Comercial actual: {commercials.find(c => c.id === currentCommercialId)?.nombre || 'Sin asignar'}
                        </p>
                    )}
                </DialogHeader>

                <div className="p-6 space-y-4">
                    {/* Búsqueda */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar comercial..."
                            className="pl-9 bg-white/[0.02] border-white/[0.06] text-white/80 placeholder:text-white/20"
                        />
                    </div>

                    {/* Lista de comerciales */}
                    <div className="space-y-1 max-h-[200px] overflow-y-auto">
                        {filteredCommercials.map(c => {
                            const isSelected = c.id === selectedId
                            const isCurrent = c.id === currentCommercialId
                            const activeContacts = getActiveContacts(c.id)

                            return (
                                <button
                                    key={c.id}
                                    onClick={() => setSelectedId(c.id)}
                                    className={cn(
                                        "w-full p-3 rounded-lg border text-left transition-all flex items-center gap-3",
                                        isSelected
                                            ? "border-primary/50 bg-primary/10"
                                            : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
                                    )}
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-xs font-medium text-primary">
                                        {c.nombre[0]}{c.apellidos[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-white/80">
                                            {c.nombre} {c.apellidos}
                                        </div>
                                        <div className="text-[10px] text-white/40">
                                            {activeContacts} contactos activos
                                        </div>
                                    </div>
                                    {isCurrent && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/50">
                                            Actual
                                        </span>
                                    )}
                                    {isSelected && (
                                        <Check className="h-4 w-4 text-primary" />
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    {/* Motivo */}
                    <div className="space-y-2">
                        <Label className="text-xs text-white/50">Motivo del cambio (opcional)</Label>
                        <Input
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            placeholder="Ej: Reasignación por zona geográfica"
                            className="bg-white/[0.02] border-white/[0.06] text-white/80 placeholder:text-white/20"
                        />
                    </div>

                    {/* Notificar */}
                    <div className="flex items-center space-x-2 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                        <Checkbox
                            id="notificar"
                            checked={notificar}
                            onCheckedChange={(c) => setNotificar(c as boolean)}
                        />
                        <Label htmlFor="notificar" className="text-xs text-white/70 cursor-pointer">
                            Notificar al nuevo comercial por email
                        </Label>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/[0.04] flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} className="text-xs">
                        Cancelar
                    </Button>
                    <button onClick={handleSave} className="btn-luxury text-xs flex items-center gap-2">
                        <UserPlus className="h-3.5 w-3.5" />
                        Asignar
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
