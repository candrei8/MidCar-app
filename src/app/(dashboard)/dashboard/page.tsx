"use client"

import { Suspense, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { DashboardSkeleton, DashboardView } from "@/components/dashboard/DashboardView"
import { useFilteredData } from "@/hooks/useFilteredData"
import { useDashboardData } from "@/hooks/useDashboardData"
import { getRangoPeriodo, isPeriodo, type Periodo } from "@/lib/dashboard-metrics"

export default function DashboardPage() {
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <Dashboard />
        </Suspense>
    )
}

function Dashboard() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // El periodo vive en la URL para que se pueda compartir y sobreviva al recargar
    const periodoParam = searchParams.get('periodo')
    const periodo: Periodo = isPeriodo(periodoParam) ? periodoParam : 'mes'
    const setPeriodo = (p: Periodo) => {
        const params = new URLSearchParams(searchParams.toString())
        if (p === 'mes') params.delete('periodo')
        else params.set('periodo', p)
        const qs = params.toString()
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    }

    // "Hoy" se fija al montar para que los cálculos no cambien entre renders
    const [now] = useState(() => new Date())
    const rango = useMemo(() => getRangoPeriodo(periodo, now), [periodo, now])

    const { vehicles, isLoading, error: vehiclesError, refreshData } = useFilteredData()
    const { extras, contactosPeriodo, error: extrasError, reload } = useDashboardData(rango)

    if (isLoading && vehicles.length === 0) return <DashboardSkeleton />

    return (
        <DashboardView
            now={now}
            periodo={periodo}
            onPeriodoChange={setPeriodo}
            vehicles={vehicles}
            extras={extras}
            contactosPeriodo={contactosPeriodo}
            error={vehiclesError || extrasError}
            onRetry={() => { refreshData(); reload() }}
        />
    )
}
