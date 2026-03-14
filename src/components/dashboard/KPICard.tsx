"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn, formatCurrency, formatNumber, formatPercentage } from "@/lib/utils"
import type { KPI } from "@/types"

interface KPICardProps {
    kpi: KPI
    className?: string
}

export function KPICard({ kpi, className }: KPICardProps) {
    const formatValue = (value: number, format?: string) => {
        switch (format) {
            case 'currency':
                return formatCurrency(value)
            case 'percentage':
                return `${value.toFixed(1)}%`
            default:
                return formatNumber(value)
        }
    }

    const TrendIcon = kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : Minus

    return (
        <Card className={cn("card-premium hover:border-surface-400", className)}>
            <CardContent className="p-6">
                <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                        {kpi.label}
                    </span>
                    <div className="flex items-end justify-between">
                        <span className="text-4xl font-bold text-foreground tracking-tight animate-count">
                            {formatValue(kpi.value, kpi.format)}
                        </span>
                        <div className={cn(
                            "flex items-center gap-1 text-sm font-medium",
                            kpi.trend === 'up' && "text-success",
                            kpi.trend === 'down' && "text-danger",
                            kpi.trend === 'neutral' && "text-muted-foreground"
                        )}>
                            <TrendIcon className="h-4 w-4" />
                            <span>{formatPercentage(kpi.changePercent)}</span>
                        </div>
                    </div>
                    <span className="text-xs text-muted">
                        vs. período anterior
                    </span>
                </div>
            </CardContent>
        </Card>
    )
}
