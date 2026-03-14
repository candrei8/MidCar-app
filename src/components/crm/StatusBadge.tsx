
import { cn } from "@/lib/utils"

// Map specific styles for a better look
const statusStyles: Record<string, string> = {
    nuevo: "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20",
    contactado: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20",
    visita_agendada: "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20",
    prueba_conduccion: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20",
    propuesta_enviada: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20",
    negociacion: "bg-pink-500/10 text-pink-400 border-pink-500/20 hover:bg-pink-500/20",
    vendido: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20",
    perdido: "bg-slate-500/10 text-slate-400 border-slate-500/20 hover:bg-slate-500/20",
}

const priorityStyles: Record<string, string> = {
    baja: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    media: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    alta: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    urgente: "bg-red-500/10 text-red-400 border-red-500/20",
}

interface StatusBadgeProps {
    status: string
    type?: 'status' | 'priority'
    className?: string
    label?: string
}

export function StatusBadge({ status, type = 'status', className, label }: StatusBadgeProps) {
    const styles = type === 'status' ? statusStyles : priorityStyles
    const style = styles[status as keyof typeof styles] || "bg-gray-500/10 text-gray-400 border-gray-500/20"

    // Use provided label or format status
    const displayLabel = label || status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())

    return (
        <div className={cn(
            "inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-medium border transition-colors duration-200 whitespace-nowrap",
            style,
            className
        )}>
             {displayLabel}
        </div>
    )
}
