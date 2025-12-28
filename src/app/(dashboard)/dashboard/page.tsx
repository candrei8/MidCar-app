"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { KPICard, Gauge, LeadsChart, SalesChart } from "@/components/dashboard"
import {
    mockKPIs,
    mockLeadsChartData,
    mockSalesChartData,
    mockLeads,
    mockVehicles
} from "@/lib/mock-data"
import { formatRelativeTime, formatCurrency } from "@/lib/utils"
import {
    ArrowRight,
    Car,
    Users,
    TrendingUp,
    Clock,
    AlertTriangle,
    FileSpreadsheet,
    Shield,
    Contact,
    Plus,
    QrCode,
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
    // Calculate gauge values
    const ventasMes = mockVehicles.filter(v => v.estado === 'vendido').length
    const objetivoVentas = 15
    const progresoObjetivo = (ventasMes / objetivoVentas) * 100

    const leadsConversion = 23.4

    // Get recent leads
    const recentLeads = mockLeads
        .filter(lead => lead.estado !== 'vendido' && lead.estado !== 'perdido')
        .slice(0, 4)

    // Get vehicles with alerts (>60 days in stock or in taller)
    const alertVehicles = mockVehicles.filter(
        v => v.dias_en_stock > 60 || v.estado === 'taller'
    )

    return (
        <div className="space-y-6 animate-in">
            {/* Page header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground">
                    Resumen de actividad y métricas clave de MidCar
                </p>
            </div>

            {/* Quick Access */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <Link href="/inventario/nuevo">
                    <Card className="card-premium p-4 hover:bg-surface-200 transition-colors cursor-pointer group">
                        <div className="flex flex-col items-center gap-2 text-center">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <Plus className="h-5 w-5 text-primary" />
                            </div>
                            <span className="text-sm font-medium">Nuevo Vehículo</span>
                        </div>
                    </Card>
                </Link>
                <Link href="/contactos">
                    <Card className="card-premium p-4 hover:bg-surface-200 transition-colors cursor-pointer group">
                        <div className="flex flex-col items-center gap-2 text-center">
                            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition-colors">
                                <Contact className="h-5 w-5 text-success" />
                            </div>
                            <span className="text-sm font-medium">Contactos</span>
                        </div>
                    </Card>
                </Link>
                <Link href="/informes">
                    <Card className="card-premium p-4 hover:bg-surface-200 transition-colors cursor-pointer group">
                        <div className="flex flex-col items-center gap-2 text-center">
                            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center group-hover:bg-warning/20 transition-colors">
                                <FileSpreadsheet className="h-5 w-5 text-warning" />
                            </div>
                            <span className="text-sm font-medium">Informes</span>
                        </div>
                    </Card>
                </Link>
                <Link href="/seguro">
                    <Card className="card-premium p-4 hover:bg-surface-200 transition-colors cursor-pointer group">
                        <div className="flex flex-col items-center gap-2 text-center">
                            <div className="h-10 w-10 rounded-lg bg-danger/10 flex items-center justify-center group-hover:bg-danger/20 transition-colors">
                                <Shield className="h-5 w-5 text-danger" />
                            </div>
                            <span className="text-sm font-medium">Control Seguro</span>
                        </div>
                    </Card>
                </Link>
                <Link href="/crm">
                    <Card className="card-premium p-4 hover:bg-surface-200 transition-colors cursor-pointer group">
                        <div className="flex flex-col items-center gap-2 text-center">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <Users className="h-5 w-5 text-primary" />
                            </div>
                            <span className="text-sm font-medium">CRM</span>
                        </div>
                    </Card>
                </Link>
                <Link href="/inventario">
                    <Card className="card-premium p-4 hover:bg-surface-200 transition-colors cursor-pointer group">
                        <div className="flex flex-col items-center gap-2 text-center">
                            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition-colors">
                                <Car className="h-5 w-5 text-success" />
                            </div>
                            <span className="text-sm font-medium">Inventario</span>
                        </div>
                    </Card>
                </Link>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {mockKPIs.map((kpi, index) => (
                    <KPICard key={index} kpi={kpi} />
                ))}
            </div>

            {/* Gauges */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="card-premium">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            Objetivo Ventas Mensual
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center py-6">
                        <Gauge
                            value={progresoObjetivo}
                            label={`${ventasMes} de ${objetivoVentas} vehículos`}
                            sublabel="Objetivo mensual de ventas"
                            size="lg"
                        />
                    </CardContent>
                </Card>

                <Card className="card-premium">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            Tasa Conversión Lead → Venta
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center py-6">
                        <Gauge
                            value={leadsConversion}
                            label="Conversión general"
                            sublabel="De todos los canales"
                            size="lg"
                            showTarget
                            targetValue={25}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LeadsChart data={mockLeadsChartData} />
                <SalesChart data={mockSalesChartData} />
            </div>

            {/* Recent Activity and Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Leads */}
                <Card className="card-premium">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            Leads Recientes
                        </CardTitle>
                        <Link href="/crm">
                            <Button variant="ghost" size="sm" className="text-primary">
                                Ver todos <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-card-border">
                            {recentLeads.map((lead) => (
                                <div
                                    key={lead.id}
                                    className="flex items-center justify-between p-4 hover:bg-card-hover transition-colors"
                                >
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-foreground">
                                                {lead.cliente?.nombre} {lead.cliente?.apellidos}
                                            </span>
                                            <Badge variant={lead.estado as 'nuevo' | 'contactado'}>
                                                {lead.estado.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Car className="h-3 w-3" />
                                            <span>{lead.vehiculo?.marca} {lead.vehiculo?.modelo}</span>
                                            <span>•</span>
                                            <Clock className="h-3 w-3" />
                                            <span>{formatRelativeTime(lead.fecha_creacion)}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant={lead.prioridad as 'alta' | 'media' | 'baja' | 'urgente'}>
                                            {lead.prioridad}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Alerts */}
                <Card className="card-premium">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-warning" />
                            Alertas de Stock
                        </CardTitle>
                        <Link href="/inventario">
                            <Button variant="ghost" size="sm" className="text-primary">
                                Ver inventario <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-card-border">
                            {alertVehicles.length > 0 ? (
                                alertVehicles.map((vehicle) => (
                                    <div
                                        key={vehicle.id}
                                        className="flex items-center justify-between p-4 hover:bg-card-hover transition-colors"
                                    >
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium text-foreground">
                                                {vehicle.marca} {vehicle.modelo}
                                            </span>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <span>{vehicle.matricula}</span>
                                                <span>•</span>
                                                <span>{formatCurrency(vehicle.precio_venta)}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {vehicle.dias_en_stock > 60 && (
                                                <Badge variant="warning" className="mb-1">
                                                    {vehicle.dias_en_stock} días en stock
                                                </Badge>
                                            )}
                                            {vehicle.estado === 'taller' && (
                                                <Badge variant="danger">
                                                    En taller
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    <p>No hay alertas activas</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Stats Footer */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="card-premium p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                            <Car className="h-5 w-5 text-success" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">
                                {mockVehicles.filter(v => v.estado === 'disponible').length}
                            </p>
                            <p className="text-xs text-muted-foreground">Disponibles</p>
                        </div>
                    </div>
                </Card>
                <Card className="card-premium p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                            <Car className="h-5 w-5 text-warning" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">
                                {mockVehicles.filter(v => v.estado === 'reservado').length}
                            </p>
                            <p className="text-xs text-muted-foreground">Reservados</p>
                        </div>
                    </div>
                </Card>
                <Card className="card-premium p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-danger/10 flex items-center justify-center">
                            <Car className="h-5 w-5 text-danger" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">
                                {mockVehicles.filter(v => v.estado === 'taller').length}
                            </p>
                            <p className="text-xs text-muted-foreground">En taller</p>
                        </div>
                    </div>
                </Card>
                <Card className="card-premium p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">
                                {mockLeads.filter(l => l.estado !== 'vendido' && l.estado !== 'perdido').length}
                            </p>
                            <p className="text-xs text-muted-foreground">Leads activos</p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}
