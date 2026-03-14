import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
    {
        variants: {
            variant: {
                default: "bg-primary/20 text-primary",
                secondary: "bg-surface-400 text-foreground",
                success: "bg-success/20 text-success",
                warning: "bg-warning/20 text-warning",
                danger: "bg-danger/20 text-danger",
                info: "bg-info/20 text-info",
                outline: "border border-current text-current",

                // Lead states
                nuevo: "bg-primary/20 text-primary",
                contactado: "bg-warning/20 text-warning",
                visita_agendada: "bg-info/20 text-info",
                prueba_conduccion: "bg-purple-500/20 text-purple-400",
                propuesta_enviada: "bg-cyan-500/20 text-cyan-400",
                negociacion: "bg-fuchsia-500/20 text-fuchsia-400",
                vendido: "bg-success/20 text-success",
                perdido: "bg-muted/30 text-muted-foreground",

                // Priority
                baja: "bg-muted/30 text-muted-foreground",
                media: "bg-info/20 text-info",
                alta: "bg-warning/20 text-warning",
                urgente: "bg-danger/20 text-danger",

                // Vehicle states
                disponible: "bg-success/20 text-success",
                reservado: "bg-warning/20 text-warning",
                taller: "bg-danger/20 text-danger",
                vehiculo_baja: "bg-muted/30 text-muted-foreground",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
