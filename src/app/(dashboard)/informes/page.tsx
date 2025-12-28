"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Download,
    FileSpreadsheet,
    ShoppingCart,
    TrendingUp,
    TrendingDown,
    Car,
    Calendar,
    Euro,
    BarChart3,
    Printer,
} from "lucide-react"
import { mockVehicles } from "@/lib/mock-data"
import { formatCurrency, formatDate } from "@/lib/utils"
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

// Mock sales data (in a real app, this would come from the database)
const mockSales = [
    {
        id: '1',
        vehiculo_id: '1',
        fecha_venta: '2024-10-15',
        precio_venta: 24900,
        cliente: 'Carlos García',
        vendedor: 'María López',
        forma_pago: 'Financiación',
    },
    {
        id: '2',
        vehiculo_id: '2',
        fecha_venta: '2024-11-20',
        precio_venta: 32500,
        cliente: 'Ana Martínez',
        vendedor: 'Pedro Sánchez',
        forma_pago: 'Contado',
    },
    {
        id: '3',
        vehiculo_id: '3',
        fecha_venta: '2024-12-05',
        precio_venta: 45900,
        cliente: 'Luis Fernández',
        vendedor: 'María López',
        forma_pago: 'Financiación',
    },
]

// Mock purchases data
const mockPurchases = mockVehicles.map(v => ({
    id: v.id,
    fecha_compra: v.fecha_entrada_stock,
    vehiculo: v,
    precio_compra: v.precio_compra,
    gastos: v.gastos_compra,
    reparaciones: v.coste_reparaciones,
    proveedor: 'Proveedor Demo',
}))

type Period = 'q1' | 'q2' | 'q3' | 'q4' | 'year' | 'custom'

const getCurrentQuarter = (): Period => {
    const month = new Date().getMonth()
    if (month < 3) return 'q1'
    if (month < 6) return 'q2'
    if (month < 9) return 'q3'
    return 'q4'
}

const getQuarterDates = (quarter: Period, year: number) => {
    switch (quarter) {
        case 'q1': return { start: new Date(year, 0, 1), end: new Date(year, 2, 31) }
        case 'q2': return { start: new Date(year, 3, 1), end: new Date(year, 5, 30) }
        case 'q3': return { start: new Date(year, 6, 1), end: new Date(year, 8, 30) }
        case 'q4': return { start: new Date(year, 9, 1), end: new Date(year, 11, 31) }
        case 'year': return { start: new Date(year, 0, 1), end: new Date(year, 11, 31) }
        default: return { start: new Date(year, 0, 1), end: new Date(year, 11, 31) }
    }
}

export default function InformesPage() {
    const [period, setPeriod] = useState<Period>(getCurrentQuarter())
    const [year, setYear] = useState(new Date().getFullYear())

    const dateRange = useMemo(() => getQuarterDates(period, year), [period, year])

    // Filter data by period
    const filteredPurchases = useMemo(() => {
        return mockPurchases.filter(p => {
            const date = new Date(p.fecha_compra)
            return date >= dateRange.start && date <= dateRange.end
        })
    }, [dateRange])

    const filteredSales = useMemo(() => {
        return mockSales.filter(s => {
            const date = new Date(s.fecha_venta)
            return date >= dateRange.start && date <= dateRange.end
        })
    }, [dateRange])

    // Calculate totals
    const stats = useMemo(() => {
        const totalCompras = filteredPurchases.reduce((acc, p) => acc + p.precio_compra + p.gastos + p.reparaciones, 0)
        const totalVentas = filteredSales.reduce((acc, s) => acc + s.precio_venta, 0)

        // Calculate margin (simplified)
        const margenTotal = filteredSales.reduce((acc, s) => {
            const vehicle = mockVehicles.find(v => v.id === s.vehiculo_id)
            if (!vehicle) return acc
            const coste = vehicle.precio_compra + vehicle.gastos_compra + vehicle.coste_reparaciones
            return acc + (s.precio_venta - coste)
        }, 0)

        return {
            numCompras: filteredPurchases.length,
            totalCompras,
            numVentas: filteredSales.length,
            totalVentas,
            margenTotal,
            margenPorcentaje: totalVentas > 0 ? (margenTotal / totalVentas) * 100 : 0,
        }
    }, [filteredPurchases, filteredSales])

    const getPeriodLabel = () => {
        switch (period) {
            case 'q1': return `1º Trimestre ${year}`
            case 'q2': return `2º Trimestre ${year}`
            case 'q3': return `3º Trimestre ${year}`
            case 'q4': return `4º Trimestre ${year}`
            case 'year': return `Año ${year}`
            default: return `Personalizado`
        }
    }

    const exportToExcel = (type: 'purchases' | 'sales') => {
        let data: object[]
        let filename: string

        if (type === 'purchases') {
            data = filteredPurchases.map(p => ({
                'Fecha': formatDate(p.fecha_compra),
                'Marca': p.vehiculo.marca,
                'Modelo': p.vehiculo.modelo,
                'Versión': p.vehiculo.version,
                'Matrícula': p.vehiculo.matricula,
                'Precio Compra': p.precio_compra,
                'Gastos': p.gastos,
                'Reparaciones': p.reparaciones,
                'Total': p.precio_compra + p.gastos + p.reparaciones,
                'Proveedor': p.proveedor,
            }))
            filename = `compras_${period}_${year}.xlsx`
        } else {
            data = filteredSales.map(s => {
                const vehicle = mockVehicles.find(v => v.id === s.vehiculo_id)
                const coste = vehicle ? vehicle.precio_compra + vehicle.gastos_compra + vehicle.coste_reparaciones : 0
                return {
                    'Fecha': formatDate(s.fecha_venta),
                    'Marca': vehicle?.marca || '',
                    'Modelo': vehicle?.modelo || '',
                    'Matrícula': vehicle?.matricula || '',
                    'Precio Venta': s.precio_venta,
                    'Coste Total': coste,
                    'Margen': s.precio_venta - coste,
                    'Cliente': s.cliente,
                    'Vendedor': s.vendedor,
                    'Forma Pago': s.forma_pago,
                }
            })
            filename = `ventas_${period}_${year}.xlsx`
        }

        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, type === 'purchases' ? 'Compras' : 'Ventas')
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        saveAs(blob, filename)
    }

    return (
        <div className="space-y-6 animate-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Informes</h1>
                    <p className="text-muted-foreground">
                        Listados de compras y ventas de vehículos
                    </p>
                </div>
                <div className="flex gap-2">
                    <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                        <SelectTrigger className="w-[180px]">
                            <Calendar className="h-4 w-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="q1">1º Trimestre</SelectItem>
                            <SelectItem value="q2">2º Trimestre</SelectItem>
                            <SelectItem value="q3">3º Trimestre</SelectItem>
                            <SelectItem value="q4">4º Trimestre</SelectItem>
                            <SelectItem value="year">Año completo</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                        <SelectTrigger className="w-[100px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="2024">2024</SelectItem>
                            <SelectItem value="2023">2023</SelectItem>
                            <SelectItem value="2022">2022</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="card-premium p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <ShoppingCart className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{stats.numCompras}</p>
                            <p className="text-xs text-muted-foreground">Compras</p>
                        </div>
                    </div>
                </Card>
                <Card className="card-premium p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-danger/10 flex items-center justify-center">
                            <TrendingDown className="h-5 w-5 text-danger" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalCompras)}</p>
                            <p className="text-xs text-muted-foreground">Inversión</p>
                        </div>
                    </div>
                </Card>
                <Card className="card-premium p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                            <Euro className="h-5 w-5 text-success" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalVentas)}</p>
                            <p className="text-xs text-muted-foreground">{stats.numVentas} ventas</p>
                        </div>
                    </div>
                </Card>
                <Card className="card-premium p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-warning" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.margenTotal)}</p>
                            <p className="text-xs text-muted-foreground">Margen ({stats.margenPorcentaje.toFixed(1)}%)</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="purchases" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="purchases" className="gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        Compras ({filteredPurchases.length})
                    </TabsTrigger>
                    <TabsTrigger value="sales" className="gap-2">
                        <Euro className="h-4 w-4" />
                        Ventas ({filteredSales.length})
                    </TabsTrigger>
                    <TabsTrigger value="summary" className="gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Resumen
                    </TabsTrigger>
                </TabsList>

                {/* Purchases Tab */}
                <TabsContent value="purchases">
                    <Card className="card-premium">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-base font-medium">
                                Compras - {getPeriodLabel()}
                            </CardTitle>
                            <Button variant="outline" size="sm" onClick={() => exportToExcel('purchases')} className="gap-2">
                                <FileSpreadsheet className="h-4 w-4" />
                                Exportar Excel
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Vehículo</TableHead>
                                        <TableHead>Matrícula</TableHead>
                                        <TableHead className="text-right">Precio</TableHead>
                                        <TableHead className="text-right">Gastos</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead>Proveedor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPurchases.map((purchase) => (
                                        <TableRow key={purchase.id}>
                                            <TableCell>{formatDate(purchase.fecha_compra)}</TableCell>
                                            <TableCell>
                                                <span className="font-medium">
                                                    {purchase.vehiculo.marca} {purchase.vehiculo.modelo}
                                                </span>
                                            </TableCell>
                                            <TableCell className="font-mono">{purchase.vehiculo.matricula}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(purchase.precio_compra)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(purchase.gastos + purchase.reparaciones)}</TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(purchase.precio_compra + purchase.gastos + purchase.reparaciones)}
                                            </TableCell>
                                            <TableCell>{purchase.proveedor}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {filteredPurchases.length === 0 && (
                                <div className="p-12 text-center">
                                    <Car className="h-12 w-12 mx-auto text-muted mb-4" />
                                    <p className="text-muted-foreground">No hay compras en este período</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Sales Tab */}
                <TabsContent value="sales">
                    <Card className="card-premium">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-base font-medium">
                                Ventas - {getPeriodLabel()}
                            </CardTitle>
                            <Button variant="outline" size="sm" onClick={() => exportToExcel('sales')} className="gap-2">
                                <FileSpreadsheet className="h-4 w-4" />
                                Exportar Excel
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Vehículo</TableHead>
                                        <TableHead className="text-right">Precio Venta</TableHead>
                                        <TableHead className="text-right">Margen</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Vendedor</TableHead>
                                        <TableHead>Pago</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSales.map((sale) => {
                                        const vehicle = mockVehicles.find(v => v.id === sale.vehiculo_id)
                                        const coste = vehicle ? vehicle.precio_compra + vehicle.gastos_compra + vehicle.coste_reparaciones : 0
                                        const margen = sale.precio_venta - coste
                                        return (
                                            <TableRow key={sale.id}>
                                                <TableCell>{formatDate(sale.fecha_venta)}</TableCell>
                                                <TableCell>
                                                    <span className="font-medium">
                                                        {vehicle?.marca} {vehicle?.modelo}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">{formatCurrency(sale.precio_venta)}</TableCell>
                                                <TableCell className="text-right">
                                                    <span className={margen >= 0 ? "text-success font-medium" : "text-danger"}>
                                                        {formatCurrency(margen)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>{sale.cliente}</TableCell>
                                                <TableCell>{sale.vendedor}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">{sale.forma_pago}</Badge>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                            {filteredSales.length === 0 && (
                                <div className="p-12 text-center">
                                    <Euro className="h-12 w-12 mx-auto text-muted mb-4" />
                                    <p className="text-muted-foreground">No hay ventas en este período</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Summary Tab */}
                <TabsContent value="summary">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="card-premium">
                            <CardHeader>
                                <CardTitle className="text-base font-medium flex items-center gap-2">
                                    <ShoppingCart className="h-4 w-4 text-primary" />
                                    Resumen de Compras
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-muted-foreground">Número de compras</span>
                                    <span className="font-bold text-lg">{stats.numCompras}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-muted-foreground">Inversión total</span>
                                    <span className="font-bold text-lg">{formatCurrency(stats.totalCompras)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-muted-foreground">Media por vehículo</span>
                                    <span className="font-bold text-lg">
                                        {stats.numCompras > 0 ? formatCurrency(stats.totalCompras / stats.numCompras) : '-'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="card-premium">
                            <CardHeader>
                                <CardTitle className="text-base font-medium flex items-center gap-2">
                                    <Euro className="h-4 w-4 text-success" />
                                    Resumen de Ventas
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-muted-foreground">Número de ventas</span>
                                    <span className="font-bold text-lg">{stats.numVentas}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-muted-foreground">Facturación total</span>
                                    <span className="font-bold text-lg text-success">{formatCurrency(stats.totalVentas)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-muted-foreground">Margen total</span>
                                    <span className="font-bold text-lg text-success">{formatCurrency(stats.margenTotal)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-muted-foreground">Margen medio</span>
                                    <span className="font-bold text-lg">{stats.margenPorcentaje.toFixed(1)}%</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
