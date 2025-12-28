"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Star, Check } from "lucide-react"
import { cn } from "@/lib/utils"

const PRIORITIES = [
    {
        value: 'urgente',
        label: 'URGENTE / Lead Caliente',
        description: 'Cliente muy interesado, cerrar esta semana',
        color: 'bg-red-500',
        textColor: 'text-red-400',
        borderColor: 'border-red-500/30',
        bgColor: 'bg-red-500/10',
    },
    {
        value: 'alta',
        label: 'ALTA / Lead Tibio',
        description: 'Interesado, seguimiento en 2-3 días',
        color: 'bg-orange-500',
        textColor: 'text-orange-400',
        borderColor: 'border-orange-500/30',
        bgColor: 'bg-orange-500/10',
    },
    {
        value: 'media',
        label: 'MEDIA / En evaluación',
        description: 'Comparando opciones, seguimiento semanal',
        color: 'bg-yellow-500',
        textColor: 'text-yellow-400',
        borderColor: 'border-yellow-500/30',
        bgColor: 'bg-yellow-500/10',
    },
    {
        value: 'baja',
        label: 'BAJA / Lead Frío',
        description: 'Poco interés, seguimiento mensual',
        color: 'bg-green-500',
        textColor: 'text-green-400',
        borderColor: 'border-green-500/30',
        bgColor: 'bg-green-500/10',
    },
    {
        value: null,
        label: 'SIN PRIORIDAD',
        description: 'Quitar prioridad actual',
        color: 'bg-gray-500',
        textColor: 'text-gray-400',
        borderColor: 'border-gray-500/30',
        bgColor: 'bg-gray-500/10',
    },
]

interface SetPriorityModalProps {
    open: boolean
    onClose: () => void
    currentPriority: string | null
    onSave: (priority: string | null) => void
}

export function SetPriorityModal({
    open,
    onClose,
    currentPriority,
    onSave
}: SetPriorityModalProps) {
    const handleSelect = (priority: string | null) => {
        onSave(priority)
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md glass border-white/[0.06] p-0">
                <DialogHeader className="p-6 pb-4 border-b border-white/[0.04]">
                    <DialogTitle className="flex items-center gap-2 text-white/90">
                        <Star className="h-5 w-5 text-primary" />
                        Establecer Prioridad
                    </DialogTitle>
                    <p className="text-xs text-white/40 mt-1">
                        Selecciona la prioridad de este contacto
                    </p>
                </DialogHeader>

                <div className="p-4 space-y-2">
                    {PRIORITIES.map((p) => {
                        const isSelected = p.value === currentPriority
                        return (
                            <button
                                key={p.value || 'none'}
                                onClick={() => handleSelect(p.value)}
                                className={cn(
                                    "w-full p-4 rounded-lg border text-left transition-all flex items-start gap-3",
                                    isSelected
                                        ? cn(p.borderColor, p.bgColor)
                                        : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
                                )}
                            >
                                <div className={cn("w-3 h-3 rounded-full mt-0.5 flex-shrink-0", p.color)} />
                                <div className="flex-1 min-w-0">
                                    <div className={cn("text-sm font-medium", p.textColor)}>
                                        {p.label}
                                    </div>
                                    <div className="text-xs text-white/40 mt-0.5">
                                        {p.description}
                                    </div>
                                </div>
                                {isSelected && (
                                    <Check className={cn("h-4 w-4 mt-0.5", p.textColor)} />
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/[0.04] flex justify-end">
                    <Button variant="outline" onClick={onClose} className="text-xs">
                        Cancelar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
