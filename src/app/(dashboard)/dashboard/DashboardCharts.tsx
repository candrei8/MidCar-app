"use client"

import Link from "next/link"
import { formatCurrency, cn } from "@/lib/utils"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts'

const BRAND_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6']

interface DashboardChartsProps {
    chartData: {
        salesOverTime: { date: string; ingresos: number; ventas: number }[]
        leadsOverTime: { date: string; leads: number }[]
    }
    sales: {
        ingresosReales: number
        tendenciaMensual: number
    }
    stock: {
        disponible: number
        reservado: number
    }
    brands: {
        marca: string
        cantidad: number
        porcentaje: number
    }[]
}

export default function DashboardCharts({ chartData, sales, stock, brands }: DashboardChartsProps) {
    return (
        <>
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
        </>
    )
}
