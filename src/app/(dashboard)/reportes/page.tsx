"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    BarChart3,
    TrendingUp,
    Car,
    Users,
    DollarSign,
    Download,
    Calendar,
    FileText,
    ArrowUp,
    ArrowDown
} from "lucide-react"
import { mockVehicles, mockLeads, mockUsers, mockSalesChartData } from "@/lib/mock-data"
import { formatCurrency, cn } from "@/lib/utils"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts"

export default function ReportesPage() {
    // Calculate report data
    const totalVentas = 11
    const ingresosMes = 385000
    const margenPromedio = 15.2
    const ticketMedio = 35000

    // Ventas por marca
    const ventasPorMarca = [
        { marca: 'BMW', ventas: 3, ingresos: 125000 },
        { marca: 'Audi', ventas: 2, ingresos: 58000 },
        { marca: 'Volkswagen', ventas: 3, ingresos: 72000 },
        { marca: 'Mercedes', ventas: 2, ingresos: 78000 },
        { marca: 'Toyota', ventas: 1, ingresos: 27000 },
    ]

    // Rendimiento vendedores
    const rendimientoVendedores = [
        { id: '2', nombre: 'María López', ventas: 6, leads: 18, conversion: 33.3 },
        { id: '3', nombre: 'Juan Martínez', ventas: 5, leads: 22, conversion: 22.7 },
    ]

    // Lead sources
    const salesByOrigin = [
        { name: 'Web', value: 47, color: '#dc2626' },
        { name: 'Directo', value: 25, color: '#f59e0b' },
        { name: 'Visita', value: 18, color: '#10b981' },
        { name: 'Teléfono', value: 10, color: '#3b82f6' },
    ]

    return (
        <div className="space-y-6 animate-in">
            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Reportes y Análisis</h1>
                    <p className="text-muted-foreground">
                        Analítica de ventas, inventario y rendimiento
                    </p>
                </div>
                <div className="flex gap-2">
                    <Select defaultValue="mes">
                        <SelectTrigger className="w-[140px]">
                            <Calendar className="h-4 w-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="semana">Esta semana</SelectItem>
                            <SelectItem value="mes">Este mes</SelectItem>
                            <SelectItem value="trimestre">Este trimestre</SelectItem>
                            <SelectItem value="año">Este año</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        Exportar PDF
                    </Button>
                </div>
            </div>

            {/* Sales KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="card-premium p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Car className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{totalVentas}</p>
                            <p className="text-xs text-muted-foreground">Vehículos vendidos</p>
                        </div>
                    </div>
                </Card>
                <Card className="card-premium p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-success" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{formatCurrency(ingresosMes)}</p>
                            <p className="text-xs text-muted-foreground">Ingresos</p>
                        </div>
                    </div>
                </Card>
                <Card className="card-premium p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-warning" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{margenPromedio}%</p>
                            <p className="text-xs text-muted-foreground">Margen promedio</p>
                        </div>
                    </div>
                </Card>
                <Card className="card-premium p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                            <BarChart3 className="h-5 w-5 text-info" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{formatCurrency(ticketMedio)}</p>
                            <p className="text-xs text-muted-foreground">Ticket medio</p>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales by Brand */}
                <Card className="card-premium">
                    <CardHeader>
                        <CardTitle className="text-base font-medium">Ventas por Marca</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={ventasPorMarca} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" horizontal={false} />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                                    <YAxis type="category" dataKey="marca" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} width={100} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1a1a1a',
                                            border: '1px solid #2a2a2a',
                                            borderRadius: '8px'
                                        }}
                                        formatter={(value: number, name: string) => [value, name === 'ventas' ? 'Ventas' : 'Ingresos']}
                                    />
                                    <Bar dataKey="ventas" fill="#dc2626" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Lead Sources */}
                <Card className="card-premium">
                    <CardHeader>
                        <CardTitle className="text-base font-medium">Origen de Leads</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-8">
                            <div className="h-[200px] w-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={origenLeads}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {origenLeads.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex-1 space-y-3">
                                {origenLeads.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="text-sm text-foreground">{item.name}</span>
                                        </div>
                                        <span className="text-sm font-semibold text-foreground">{item.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Vendor Performance */}
            <Card className="card-premium">
                <CardHeader>
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        Rendimiento de Vendedores
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {rendimientoVendedores.map((vendedor, index) => (
                            <div key={vendedor.id} className="flex items-center gap-4 p-4 bg-surface-100 rounded-lg">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-white",
                                    index === 0 ? "bg-yellow-500" : "bg-muted"
                                )}>
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-foreground">{vendedor.nombre}</p>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span>{vendedor.ventas} ventas</span>
                                        <span>•</span>
                                        <span>{vendedor.leads} leads</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-foreground">{vendedor.conversion}%</p>
                                    <p className="text-xs text-muted-foreground">Conversión</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Inventory Rotation */}
            <Card className="card-premium">
                <CardHeader>
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Car className="h-4 w-4 text-primary" />
                        Rotación de Inventario
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-6 bg-surface-100 rounded-lg">
                            <p className="text-4xl font-bold text-foreground">38</p>
                            <p className="text-sm text-muted-foreground mt-1">Días promedio en stock</p>
                        </div>
                        <div className="text-center p-6 bg-surface-100 rounded-lg">
                            <p className="text-4xl font-bold text-warning">2</p>
                            <p className="text-sm text-muted-foreground mt-1">Vehículos +60 días</p>
                        </div>
                        <div className="text-center p-6 bg-surface-100 rounded-lg">
                            <p className="text-4xl font-bold text-foreground">{formatCurrency(mockVehicles.reduce((acc, v) => acc + v.precio_venta, 0))}</p>
                            <p className="text-sm text-muted-foreground mt-1">Valor inmovilizado</p>
                        </div>
                    </div>

                    {/* Vehicles at risk */}
                    <div className="mt-6">
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">Vehículos con más tiempo en stock</h4>
                        <div className="space-y-2">
                            {mockVehicles
                                .sort((a, b) => b.dias_en_stock - a.dias_en_stock)
                                .slice(0, 3)
                                .map(vehicle => (
                                    <div key={vehicle.id} className="flex items-center justify-between p-3 bg-surface-200 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-12 h-8 rounded bg-cover bg-center"
                                                style={{ backgroundImage: `url(${vehicle.imagen_principal})` }}
                                            />
                                            <div>
                                                <p className="font-medium text-foreground">{vehicle.marca} {vehicle.modelo}</p>
                                                <p className="text-xs text-muted-foreground">{formatCurrency(vehicle.precio_venta)}</p>
                                            </div>
                                        </div>
                                        <Badge variant={vehicle.dias_en_stock > 60 ? 'danger' : vehicle.dias_en_stock > 30 ? 'warning' : 'secondary'}>
                                            {vehicle.dias_en_stock} días
                                        </Badge>
                                    </div>
                                ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Report Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                    { title: 'Informe de Ventas', desc: 'Resumen completo de ventas del período', icon: BarChart3 },
                    { title: 'Análisis de Leads', desc: 'Conversión y origen de leads', icon: Users },
                    { title: 'Rotación Inventario', desc: 'Tiempo de venta por vehículo', icon: Car },
                    { title: 'Rendimiento Vendedores', desc: 'Comparativa del equipo comercial', icon: TrendingUp },
                    { title: 'Análisis Financiero', desc: 'Márgenes y rentabilidad', icon: DollarSign },
                    { title: 'Reporte Personalizado', desc: 'Crea tu propio informe', icon: FileText },
                ].map((report, index) => (
                    <Card key={index} className="card-premium hover:border-primary/50 cursor-pointer transition-colors">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="h-10 w-10 rounded-lg bg-surface-300 flex items-center justify-center">
                                    <report.icon className="h-5 w-5 text-foreground" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-foreground">{report.title}</p>
                                    <p className="text-sm text-muted-foreground">{report.desc}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
