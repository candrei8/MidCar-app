"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    getDashboardData,
    type DashboardData,
    type CriticalAlert,
    type ActivityItem,
    formatTrend
} from "@/lib/dashboard-service"
import { formatCurrency, formatRelativeTime, cn } from "@/lib/utils"
import { VINScannerModal } from "@/components/inventory/VINScannerModal"
import { useFilteredData } from "@/hooks/useFilteredData"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    PieChart,
    Pie
} from 'recharts'

export default function DashboardPage() {
    const router = useRouter()
    const [vinScannerOpen, setVinScannerOpen] = useState(false)
    const [data, setData] = useState<DashboardData | null>(null)

    // Obtener datos filtrados por usuario (Mi Vista / Visión Completa)
    const { leads: userFilteredLeads, stats: filteredStats, isFullView } = useFilteredData()

    // Load dashboard data
    useEffect(() => {
        const dashboardData = getDashboardData()
        setData(dashboardData)
    }, [])

    // Recalcular métricas de leads basándose en datos filtrados
    const filteredLeadMetrics = useMemo(() => {
        const nuevos = userFilteredLeads.filter(l => l.estado === 'nuevo')
        const enProceso = userFilteredLeads.filter(l =>
            !['nuevo', 'vendido', 'perdido'].includes(l.estado)
        )
        const vendidos = userFilteredLeads.filter(l => l.estado === 'vendido')
        const perdidos = userFilteredLeads.filter(l => l.estado === 'perdido')

        const tasaConversion = userFilteredLeads.length > 0
            ? (vendidos.length / userFilteredLeads.length) * 100
            : 0

        const leadsActivos = userFilteredLeads.filter(l =>
            l.estado !== 'vendido' && l.estado !== 'perdido'
        )
        const valorPipeline = leadsActivos.reduce((sum, l) => {
            const vehiclePrice = l.vehiculo?.precio_venta || 0
            return sum + (vehiclePrice * (l.probabilidad / 100))
        }, 0)

        const leadsUrgentes = userFilteredLeads.filter(l =>
            l.estado !== 'vendido' &&
            l.estado !== 'perdido' &&
            (l.prioridad === 'urgente' || l.prioridad === 'alta')
        ).length

        const today = new Date()
        today.setHours(23, 59, 59, 999)
        const accionesPendientes = userFilteredLeads.filter(l =>
            l.fecha_proxima_accion &&
            new Date(l.fecha_proxima_accion) <= today &&
            l.estado !== 'vendido' &&
            l.estado !== 'perdido'
        ).length

        return {
            total: userFilteredLeads.length,
            nuevos: nuevos.length,
            enProceso: enProceso.length,
            vendidos: vendidos.length,
            perdidos: perdidos.length,
            tasaConversion,
            valorPipeline,
            leadsUrgentes,
            accionesPendientes
        }
    }, [userFilteredLeads])

    // Listen for VIN scanner open event
    useEffect(() => {
        const handleOpenVINScanner = () => setVinScannerOpen(true)
        window.addEventListener('open-vin-scanner', handleOpenVINScanner)
        return () => window.removeEventListener('open-vin-scanner', handleOpenVINScanner)
    }, [])

    const handleVINDetected = (vin: string) => {
        router.push(`/inventario/nuevo?vin=${vin}`)
    }

    if (!data) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    // En Mi Vista: todo vacío. En Visión Completa: datos reales
    const emptyStockMetrics = {
        total: 0, disponible: 0, reservado: 0, vendido: 0, enTaller: 0,
        valorStock: 0, inversionStock: 0, margenPotencial: 0, margenPorcentaje: 0
    }
    const emptySalesMetrics = {
        vehiculosVendidos: 0, ingresosReales: 0, margenBrutoReal: 0,
        margenPorcentaje: 0, ticketMedio: 0, ventasUltimos30Dias: 0, tendenciaMensual: 0
    }
    const emptyPerformance = {
        diasPromedioStock: 0, vehiculosEnRiesgo: [], vehiculosNuevos7Dias: 0, rotacionMensual: 0
    }

    const stock = isFullView ? data.stock : emptyStockMetrics
    const sales = isFullView ? data.sales : emptySalesMetrics
    const performance = isFullView ? data.performance : emptyPerformance
    const brands = isFullView ? data.brands : []
    const activity = isFullView ? data.activity : []
    const alerts = isFullView ? data.alerts : []
    const chartData = isFullView ? data.chartData : { salesOverTime: [], leadsOverTime: [] }

    // Usar métricas de leads filtradas por usuario
    const leads = filteredLeadMetrics

    // Prepare chart colors
    const BRAND_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6']

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
                            onClick={() => router.push('/crm')}
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
                            onClick={() => router.push('/inventario')}
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
                            onClick={() => router.push('/inventario')}
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
                            onClick={() => router.push('/crm')}
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

                {/* Sales Performance Chart */}
                <section className="px-4">
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Rendimiento de Ventas</h3>
                                <p className="text-sm text-slate-500">Ingresos últimos meses</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-bold text-slate-900">{formatCurrency(sales.ingresosReales)}</p>
                                <p className={cn(
                                    "text-sm font-medium",
                                    sales.tendenciaMensual >= 0 ? "text-green-600" : "text-red-600"
                                )}>
                                    {sales.tendenciaMensual >= 0 ? '+' : ''}{sales.tendenciaMensual.toFixed(1)}% vs anterior
                                </p>
                            </div>
                        </div>
                        <div className="h-[180px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData.salesOverTime}>
                                    <defs>
                                        <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fill: '#64748b', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: '#64748b', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '12px',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }}
                                        formatter={(value: number) => [formatCurrency(value), 'Ingresos']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="ingresos"
                                        stroke="#3b82f6"
                                        strokeWidth={2.5}
                                        fill="url(#colorIngresos)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </section>

                {/* Stock Distribution */}
                <section className="px-4">
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Stock por Marca</h3>
                                <p className="text-sm text-slate-500">{stock.disponible + stock.reservado} vehículos activos</p>
                            </div>
                            <Link href="/inventario" className="text-blue-600 text-sm font-bold hover:underline">
                                Ver Todo
                            </Link>
                        </div>

                        <div className="flex gap-4">
                            {/* Pie Chart */}
                            <div className="w-32 h-32 shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={brands.slice(0, 6)}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={30}
                                            outerRadius={50}
                                            paddingAngle={2}
                                            dataKey="cantidad"
                                        >
                                            {brands.slice(0, 6).map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Brand List */}
                            <div className="flex-1 flex flex-col gap-2">
                                {brands.slice(0, 5).map((brand, index) => (
                                    <div key={brand.marca} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: BRAND_COLORS[index % BRAND_COLORS.length] }}
                                            />
                                            <span className="text-sm text-slate-700 font-medium">{brand.marca}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-slate-500">{brand.cantidad}</span>
                                            <span className="text-xs text-slate-400">({brand.porcentaje.toFixed(0)}%)</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

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
                            className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-orange-200 transition-all group text-left"
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
                                            src={vehicle.imagen_principal}
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
    onClick
}: {
    label: string
    value: string
    subvalue: string
    trend: { text: string; isPositive: boolean }
    icon: string
    iconBg: string
    iconColor: string
    onClick?: () => void
}) {
    return (
        <div
            onClick={onClick}
            className="flex flex-col gap-2 rounded-2xl p-4 bg-white border border-slate-200 shadow-sm cursor-pointer hover:shadow-md hover:border-slate-300 transition-all active:scale-[0.98]"
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
        </div>
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

    const icons = {
        stock_aging: 'schedule',
        lead_pending: 'notifications_active',
        low_stock: 'inventory_2',
        high_margin: 'trending_up'
    }

    return (
        <Link
            href={alert.enlace}
            className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm",
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
                "flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all group",
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
            className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
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
