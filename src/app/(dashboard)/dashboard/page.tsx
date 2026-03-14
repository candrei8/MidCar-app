"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { getDashboardData } from "@/lib/dashboard-service"
import { formatCurrency, formatRelativeTime, cn } from "@/lib/utils"
import { VINScannerModal } from "@/components/inventory/VINScannerModal"
import { useFilteredData } from "@/hooks/useFilteredData"

// Lazy load recharts — heavy library, defer until charts are visible
const DashboardCharts = dynamic(() => import('./DashboardCharts'), {
    ssr: false,
    loading: () => <div className="h-[180px] bg-slate-50 rounded-2xl animate-pulse" />,
})

// Helper function to format trend percentage
function formatTrend(value: number): { text: string; isPositive: boolean } {
    const isPositive = value >= 0
    return {
        text: `${isPositive ? '+' : ''}${value.toFixed(1)}%`,
        isPositive
    }
}

// Helper para obtener imagen válida (excluye URLs de Azure CDN que no existen)
function getValidImageUrl(url: string | null | undefined): string {
    if (!url) {
        return '/placeholder-car.svg'
    }
    return url
}

// Local type definitions for dashboard
interface CriticalAlert {
    id: string
    tipo: string
    severidad: 'danger' | 'warning' | 'info'
    titulo: string
    descripcion: string
    enlace: string
}

interface ActivityItem {
    id: string
    titulo: string
    descripcion: string
    fecha: string
    icono: string
    color: string
    enlace?: string
}


export default function DashboardPage() {
    const router = useRouter()
    const [vinScannerOpen, setVinScannerOpen] = useState(false)

    // getDashboardData is synchronous — call directly, no useEffect needed
    const data = useMemo(() => getDashboardData(), [])

    // Obtener datos filtrados por usuario (Mi Vista / Visión Completa)
    const { stats: filteredStats, isFullView } = useFilteredData()

    // Métricas de leads desde stats (count-only queries — sin cargar todos los leads)
    const filteredLeadMetrics = useMemo(() => {
        return {
            total: filteredStats.totalLeads,
            nuevos: filteredStats.leadsNuevos,
            enProceso: filteredStats.leadsContactados + filteredStats.leadsVisita + filteredStats.leadsPrueba + filteredStats.leadsPropuesta + filteredStats.leadsNegociacion,
            vendidos: filteredStats.leadsVendidos,
            perdidos: filteredStats.leadsPerdidos,
            tasaConversion: filteredStats.tasaConversion,
            valorPipeline: filteredStats.valorPipeline,
            leadsUrgentes: 0, // requeriría cargar datos completos
            accionesPendientes: 0, // requeriría cargar datos completos
        }
    }, [filteredStats])

    // Listen for VIN scanner open event
    useEffect(() => {
        const handleOpenVINScanner = () => setVinScannerOpen(true)
        window.addEventListener('open-vin-scanner', handleOpenVINScanner)
        return () => window.removeEventListener('open-vin-scanner', handleOpenVINScanner)
    }, [])

    const handleVINDetected = (vin: string) => {
        router.push(`/inventario/nuevo?vin=${vin}`)
    }

    // AHORA USAMOS MÉTRICAS REALES DE filteredStats EN LUGAR DE CEROS
    const stock = {
        total: filteredStats.totalVehicles,
        disponible: filteredStats.vehiclesDisponible,
        reservado: filteredStats.vehiclesReservado,
        vendido: filteredStats.vehiclesVendido,
        enTaller: filteredStats.vehiclesTaller,
        valorStock: filteredStats.valorStock,
        inversionStock: filteredStats.inversionStock,
        margenPotencial: filteredStats.margenPotencial,
        margenPorcentaje: filteredStats.margenPorcentaje,
    }
    const sales = {
        vehiculosVendidos: filteredStats.vehiclesVendido,
        ingresosReales: filteredStats.ventasIngreso,
        margenBrutoReal: filteredStats.margenRealizado,
        margenPorcentaje: filteredStats.margenVentasPorcentaje,
        ticketMedio: filteredStats.vehiclesVendido > 0 ? filteredStats.ventasIngreso / filteredStats.vehiclesVendido : 0,
        ventasUltimos30Dias: filteredStats.vehiclesVendido, // TODO: filtrar por fecha
        tendenciaMensual: 0, // TODO: calcular tendencia
    }
    const performance = {
        diasPromedioStock: filteredStats.diasPromedioStock,
        vehiculosEnRiesgo: filteredStats.vehiculosMuchosDiasStock,
        vehiculosNuevos7Dias: 0, // TODO: calcular desde fecha_alta
        rotacionMensual: 0, // TODO: calcular
    }

    // GENERAR ALERTAS REALES desde los datos
    const realAlerts: CriticalAlert[] = []

    // Alertas ITV Vencida (crítico)
    if (filteredStats.vehiculosITVVencida.length > 0) {
        realAlerts.push({
            id: 'itv-vencida',
            tipo: 'itv',
            severidad: 'danger',
            titulo: `${filteredStats.vehiculosITVVencida.length} vehículo(s) con ITV vencida`,
            descripcion: filteredStats.vehiculosITVVencida.slice(0, 3).map(v => `${v.marca} ${v.modelo} (${v.matricula})`).join(', '),
            enlace: '/inventario'
        })
    }

    // Alertas ITV Próxima (warning)
    if (filteredStats.vehiculosITVProxima.length > 0) {
        realAlerts.push({
            id: 'itv-proxima',
            tipo: 'itv',
            severidad: 'warning',
            titulo: `${filteredStats.vehiculosITVProxima.length} vehículo(s) con ITV próxima a vencer`,
            descripcion: 'Vencen en los próximos 30 días',
            enlace: '/inventario'
        })
    }

    // Alertas Stock Estancado (warning)
    if (filteredStats.vehiculosMuchosDiasStock.length > 0) {
        realAlerts.push({
            id: 'stock-estancado',
            tipo: 'stock',
            severidad: 'warning',
            titulo: `${filteredStats.vehiculosMuchosDiasStock.length} vehículo(s) +90 días en stock`,
            descripcion: 'Considera ajustar precios o promocionar',
            enlace: '/inventario'
        })
    }

    const brands = isFullView ? data.brands : []
    const activity = isFullView ? data.activity : []
    const alerts = realAlerts // USAMOS ALERTAS REALES
    const chartData = isFullView ? data.chartData : { salesOverTime: [], leadsOverTime: [] }

    // Usar métricas de leads filtradas por usuario
    const leads = filteredLeadMetrics

    return (
        <>
            <VINScannerModal
                open={vinScannerOpen}
                onClose={() => setVinScannerOpen(false)}
                onVINDetected={handleVINDetected}
            />
            <div className="flex flex-col gap-5 pb-8 bg-[#f8fafc] min-h-screen">
                {/* Header */}
                <div className="px-4 pt-4 pb-2">
                    <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-sm text-slate-500">Resumen del negocio en tiempo real</p>
                </div>

                {/* Alerts Section */}
                {alerts.length > 0 && (
                    <div className="px-4">
                        <div className="flex flex-col gap-2">
                            {alerts.map(alert => (
                                <AlertCard key={alert.id} alert={alert} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Main KPI Grid */}
                <section className="px-4">
                    <h2 className="text-lg font-bold text-slate-900 mb-3">Métricas Clave</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Revenue KPI */}
                        <KPICard
                            label="Ingresos"
                            value={formatCurrency(sales.ingresosReales)}
                            subvalue={`${sales.vehiculosVendidos} ventas`}
                            trend={formatTrend(sales.tendenciaMensual)}
                            icon="attach_money"
                            iconBg="bg-green-100"
                            iconColor="text-green-700"
                            href="/crm"
                        />

                        {/* Margin KPI */}
                        <KPICard
                            label="Margen Bruto"
                            value={formatCurrency(sales.margenBrutoReal)}
                            subvalue={`${sales.margenPorcentaje.toFixed(1)}% margen`}
                            trend={{ text: sales.margenPorcentaje >= 15 ? 'Saludable' : 'Bajo', isPositive: sales.margenPorcentaje >= 15 }}
                            icon="trending_up"
                            iconBg="bg-emerald-100"
                            iconColor="text-emerald-700"
                            href="/inventario"
                        />

                        {/* Stock Value KPI */}
                        <KPICard
                            label="Valor Stock"
                            value={formatCurrency(stock.valorStock)}
                            subvalue={`${stock.disponible + stock.reservado} vehículos`}
                            trend={{ text: `+${formatCurrency(stock.margenPotencial)} potencial`, isPositive: true }}
                            icon="inventory_2"
                            iconBg="bg-blue-100"
                            iconColor="text-blue-700"
                            href="/inventario"
                        />

                        {/* Pipeline KPI */}
                        <KPICard
                            label="Pipeline"
                            value={formatCurrency(leads.valorPipeline)}
                            subvalue={`${leads.enProceso} leads activos`}
                            trend={{ text: `${leads.tasaConversion.toFixed(1)}% conversión`, isPositive: leads.tasaConversion >= 20 }}
                            icon="trending_up"
                            iconBg="bg-purple-100"
                            iconColor="text-purple-700"
                            href="/crm"
                        />
                    </div>
                </section>

                {/* Secondary KPIs */}
                <section className="px-4">
                    <div className="grid grid-cols-3 gap-3">
                        <MiniKPI
                            label="Días Prom. Stock"
                            value={`${performance.diasPromedioStock}`}
                            subtext="días"
                            trend={performance.diasPromedioStock <= 45 ? 'good' : performance.diasPromedioStock <= 60 ? 'warning' : 'bad'}
                        />
                        <MiniKPI
                            label="Leads Nuevos"
                            value={`${leads.nuevos}`}
                            subtext="esta semana"
                            trend="good"
                        />
                        <MiniKPI
                            label="En Riesgo"
                            value={`${performance.vehiculosEnRiesgo.length}`}
                            subtext="+60 días"
                            trend={performance.vehiculosEnRiesgo.length === 0 ? 'good' : performance.vehiculosEnRiesgo.length <= 2 ? 'warning' : 'bad'}
                        />
                    </div>
                </section>

                {/* Charts — lazy loaded to keep initial render fast */}
                <DashboardCharts
                    chartData={chartData}
                    sales={sales}
                    stock={stock}
                    brands={brands}
                />

                {/* Quick Actions */}
                <section className="px-4">
                    <h2 className="text-lg font-bold text-slate-900 mb-3">Acciones Rápidas</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <QuickActionCard
                            icon="add"
                            label="Añadir Coche"
                            sublabel="Nuevo vehículo"
                            color="blue"
                            href="/inventario/nuevo"
                        />
                        <QuickActionCard
                            icon="person_add"
                            label="Nuevo Lead"
                            sublabel={`${leads.accionesPendientes} pendientes`}
                            color="green"
                            href="/crm"
                        />
                        <QuickActionCard
                            icon="shield"
                            label="Seguros"
                            sublabel="Gestionar pólizas"
                            color="purple"
                            href="/seguro"
                        />
                        <button
                            onClick={() => setVinScannerOpen(true)}
                            className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-orange-200 transition-[box-shadow,border-color] group text-left"
                        >
                            <div className="size-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-all">
                                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>qr_code_scanner</span>
                            </div>
                            <div>
                                <p className="text-slate-900 text-sm font-bold">Escanear VIN</p>
                                <p className="text-slate-500 text-xs">Leer bastidor</p>
                            </div>
                        </button>
                    </div>
                </section>

                {/* Vehicles at Risk */}
                {performance.vehiculosEnRiesgo.length > 0 && (
                    <section className="px-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-amber-600">warning</span>
                                <h3 className="font-bold text-amber-900">Vehículos en Riesgo</h3>
                                <span className="text-sm text-amber-700 ml-auto">+60 días en stock</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                {performance.vehiculosEnRiesgo.slice(0, 3).map(vehicle => (
                                    <Link
                                        key={vehicle.id}
                                        href={`/inventario/${vehicle.id}`}
                                        className="flex items-center gap-3 p-3 bg-white rounded-xl border border-amber-100 hover:border-amber-300 transition-colors"
                                    >
                                        <img
                                            src={getValidImageUrl(vehicle.imagen_principal)}
                                            alt={`${vehicle.marca} ${vehicle.modelo}`}
                                            className="w-16 h-12 object-cover rounded-lg"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-900 truncate">
                                                {vehicle.marca} {vehicle.modelo}
                                            </p>
                                            <p className="text-xs text-slate-500">{formatCurrency(vehicle.precio_venta)}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                                                {vehicle.dias_en_stock} días
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Activity Feed */}
                <section className="px-4">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-lg font-bold text-slate-900">Actividad Reciente</h2>
                        <Link href="/crm" className="text-blue-600 text-sm font-bold hover:underline">Ver Todo</Link>
                    </div>
                    <div className="flex flex-col gap-3">
                        {activity.slice(0, 5).map((item) => (
                            <ActivityCard key={item.id} item={item} />
                        ))}
                    </div>
                </section>


            </div>
        </>
    )
}

// ============================================================================
// COMPONENTS
// ============================================================================

function KPICard({
    label,
    value,
    subvalue,
    trend,
    icon,
    iconBg,
    iconColor,
    href
}: {
    label: string
    value: string
    subvalue: string
    trend: { text: string; isPositive: boolean }
    icon: string
    iconBg: string
    iconColor: string
    href: string
}) {
    return (
        <Link
            href={href}
            className="flex flex-col gap-2 rounded-2xl p-4 bg-white border border-slate-200 shadow-sm cursor-pointer hover:shadow-md hover:border-slate-300 transition-[box-shadow,border-color] active:scale-[0.98]"
        >
            <div className="flex items-center gap-2">
                <div className={cn("p-2 rounded-lg", iconBg, iconColor)}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{icon}</span>
                </div>
                <p className="text-slate-500 text-sm font-medium">{label}</p>
            </div>
            <p className="text-slate-900 text-xl font-bold tracking-tight">{value}</p>
            <div className="flex items-center justify-between">
                <p className="text-slate-400 text-xs">{subvalue}</p>
                <p className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full",
                    trend.isPositive ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50"
                )}>
                    {trend.text}
                </p>
            </div>
        </Link>
    )
}

function MiniKPI({
    label,
    value,
    subtext,
    trend
}: {
    label: string
    value: string
    subtext: string
    trend: 'good' | 'warning' | 'bad'
}) {
    const trendColors = {
        good: 'text-green-600',
        warning: 'text-amber-600',
        bad: 'text-red-600'
    }

    return (
        <div className="flex flex-col items-center gap-1 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500 font-medium text-center">{label}</p>
            <p className={cn("text-2xl font-bold", trendColors[trend])}>{value}</p>
            <p className="text-xs text-slate-400">{subtext}</p>
        </div>
    )
}

function AlertCard({ alert }: { alert: CriticalAlert }) {
    const severityStyles = {
        danger: 'bg-red-50 border-red-200 text-red-800',
        warning: 'bg-amber-50 border-amber-200 text-amber-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800'
    }

    const icons: Record<string, string> = {
        stock_aging: 'schedule',
        lead_pending: 'notifications_active',
        low_stock: 'inventory_2',
        high_margin: 'trending_up',
        itv_expiring: 'verified'
    }

    return (
        <Link
            href={alert.enlace}
            className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-shadow hover:shadow-sm",
                severityStyles[alert.severidad]
            )}
        >
            <span className="material-symbols-outlined text-xl">{icons[alert.tipo]}</span>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{alert.titulo}</p>
                <p className="text-xs opacity-80 truncate">{alert.descripcion}</p>
            </div>
            <span className="material-symbols-outlined text-lg opacity-60">chevron_right</span>
        </Link>
    )
}

function QuickActionCard({
    icon,
    label,
    sublabel,
    color,
    href
}: {
    icon: string
    label: string
    sublabel: string
    color: 'blue' | 'green' | 'purple' | 'orange'
    href: string
}) {
    const colorStyles = {
        blue: { bg: 'bg-blue-100', text: 'text-blue-600', hover: 'hover:border-blue-200 group-hover:bg-blue-500' },
        green: { bg: 'bg-green-100', text: 'text-green-600', hover: 'hover:border-green-200 group-hover:bg-green-500' },
        purple: { bg: 'bg-purple-100', text: 'text-purple-600', hover: 'hover:border-purple-200 group-hover:bg-purple-500' },
        orange: { bg: 'bg-orange-100', text: 'text-orange-600', hover: 'hover:border-orange-200 group-hover:bg-orange-500' }
    }

    const styles = colorStyles[color]

    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-[box-shadow,border-color] group",
                styles.hover
            )}
        >
            <div className={cn(
                "size-12 rounded-xl flex items-center justify-center transition-all group-hover:text-white",
                styles.bg,
                styles.text
            )}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>{icon}</span>
            </div>
            <div>
                <p className="text-slate-900 text-sm font-bold">{label}</p>
                <p className="text-slate-500 text-xs">{sublabel}</p>
            </div>
        </Link>
    )
}

function ActivityCard({ item }: { item: ActivityItem }) {
    const colorStyles: Record<string, string> = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        purple: 'bg-purple-100 text-purple-600',
        orange: 'bg-orange-100 text-orange-600'
    }

    return (
        <Link
            href={item.enlace || '#'}
            className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-[box-shadow,border-color]"
        >
            <div className={cn(
                "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full",
                colorStyles[item.color] || 'bg-slate-100 text-slate-600'
            )}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{item.icono}</span>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-slate-900 text-sm font-semibold truncate">{item.titulo}</p>
                <p className="text-slate-500 text-xs mt-0.5 truncate">{item.descripcion}</p>
                <p className="text-slate-400 text-[10px] mt-1.5 font-medium">
                    {formatRelativeTime(item.fecha)}
                </p>
            </div>
        </Link>
    )
}
