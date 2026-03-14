"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from "recharts"

interface LeadsChartProps {
    data: Array<{ date: string; leads: number }>
}

export function LeadsChart({ data }: LeadsChartProps) {
    return (
        <Card className="card-premium">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Leads últimos 30 días</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6b7280', fontSize: 11 }}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6b7280', fontSize: 11 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1a1a1a',
                                    border: '1px solid #2a2a2a',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                                }}
                                labelStyle={{ color: '#e5e7eb' }}
                                itemStyle={{ color: '#dc2626' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="leads"
                                stroke="#dc2626"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, fill: '#dc2626' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}

interface SalesChartProps {
    data: Array<{ date: string; ventas: number; ingresos: number }>
}

export function SalesChart({ data }: SalesChartProps) {
    return (
        <Card className="card-premium">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Ventas últimos 30 días</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6b7280', fontSize: 11 }}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6b7280', fontSize: 11 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1a1a1a',
                                    border: '1px solid #2a2a2a',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                                }}
                                labelStyle={{ color: '#e5e7eb' }}
                                formatter={(value: number, name: string) => {
                                    if (name === 'ingresos') return [`${(value / 1000).toFixed(0)}K €`, 'Ingresos']
                                    return [value, 'Ventas']
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="ventas"
                                stroke="#dc2626"
                                strokeWidth={2}
                                fill="url(#salesGradient)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
