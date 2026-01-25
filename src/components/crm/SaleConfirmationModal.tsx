"use client"

import { useState, useMemo } from "react"
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency, cn } from "@/lib/utils"
import type { Lead, Vehicle } from "@/types"

// Helper para verificar si una URL de imagen es válida (excluye Azure CDN que no existe)
const isValidImageUrl = (url: string | null | undefined): boolean => {
    if (!url) return false
    return !url.includes('midcar.azureedge.net')
}

interface SaleConfirmationModalProps {
    open: boolean
    onClose: () => void
    onConfirm: (saleData: SaleData) => void
    lead: Lead
    vehicle: Vehicle
}

export interface SaleData {
    leadId: string
    vehicleId: string
    clienteId: string
    precioVentaFinal: number
    descuento: number
    formaPago: 'contado' | 'financiacion' | 'leasing' | 'renting'
    entradaInicial?: number
    cuotasMensuales?: number
    entidadFinanciera?: string
    fechaEntrega: string
    garantiaExtendida: boolean
    garantiaMeses: number
    gastosAdicionales: number
    descripcionGastos?: string
    notas?: string
}

export function SaleConfirmationModal({
    open,
    onClose,
    onConfirm,
    lead,
    vehicle
}: SaleConfirmationModalProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form state
    const [precioVentaFinal, setPrecioVentaFinal] = useState(vehicle.precio_venta.toString())
    const [descuento, setDescuento] = useState("0")
    const [formaPago, setFormaPago] = useState<SaleData['formaPago']>('contado')
    const [entradaInicial, setEntradaInicial] = useState("")
    const [cuotasMensuales, setCuotasMensuales] = useState("48")
    const [entidadFinanciera, setEntidadFinanciera] = useState("")
    const [fechaEntrega, setFechaEntrega] = useState(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    )
    const [garantiaExtendida, setGarantiaExtendida] = useState(false)
    const [garantiaMeses, setGarantiaMeses] = useState("12")
    const [gastosAdicionales, setGastosAdicionales] = useState("0")
    const [descripcionGastos, setDescripcionGastos] = useState("")
    const [notas, setNotas] = useState("")

    // Calculations
    const financials = useMemo(() => {
        const precio = parseFloat(precioVentaFinal) || 0
        const desc = parseFloat(descuento) || 0
        const gastos = parseFloat(gastosAdicionales) || 0
        const precioFinal = precio - desc + gastos

        const costeVehiculo = vehicle.precio_compra + vehicle.gastos_compra + vehicle.coste_reparaciones
        const margen = precioFinal - costeVehiculo
        const margenPorcentaje = precioFinal > 0 ? (margen / precioFinal) * 100 : 0

        // Financiación
        const entrada = parseFloat(entradaInicial) || 0
        const cuotas = parseInt(cuotasMensuales) || 48
        const importeFinanciar = precioFinal - entrada
        const cuotaEstimada = cuotas > 0 ? importeFinanciar / cuotas : 0

        return {
            precioFinal,
            margen,
            margenPorcentaje,
            importeFinanciar,
            cuotaEstimada
        }
    }, [precioVentaFinal, descuento, gastosAdicionales, vehicle, entradaInicial, cuotasMensuales])

    const handleSubmit = async () => {
        setIsSubmitting(true)

        const saleData: SaleData = {
            leadId: lead.id,
            vehicleId: vehicle.id,
            clienteId: lead.cliente?.id || '',
            precioVentaFinal: financials.precioFinal,
            descuento: parseFloat(descuento) || 0,
            formaPago,
            entradaInicial: parseFloat(entradaInicial) || undefined,
            cuotasMensuales: formaPago !== 'contado' ? parseInt(cuotasMensuales) : undefined,
            entidadFinanciera: formaPago !== 'contado' ? entidadFinanciera : undefined,
            fechaEntrega,
            garantiaExtendida,
            garantiaMeses: parseInt(garantiaMeses),
            gastosAdicionales: parseFloat(gastosAdicionales) || 0,
            descripcionGastos,
            notas
        }

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))

        onConfirm(saleData)
        setIsSubmitting(false)
    }

    const resetAndClose = () => {
        setStep(1)
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={resetAndClose}>
            <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-hidden p-0 bg-white dark:bg-[#1c1c1e] rounded-2xl">
                <DialogTitle className="sr-only">Confirmar Venta</DialogTitle>

                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between bg-gradient-to-r from-green-500 to-emerald-600 p-4 text-white">
                    <button
                        onClick={resetAndClose}
                        className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                    >
                        <span className="material-symbols-outlined text-2xl">close</span>
                    </button>
                    <div className="text-center">
                        <h2 className="text-lg font-bold">Cerrar Venta</h2>
                        <p className="text-sm text-white/80">Paso {step} de 3</p>
                    </div>
                    <div className="w-10" />
                </div>

                {/* Progress Bar */}
                <div className="flex gap-1 px-4 py-2 bg-gray-50 dark:bg-gray-900/50">
                    {[1, 2, 3].map(s => (
                        <div
                            key={s}
                            className={cn(
                                "h-1 flex-1 rounded-full transition-all",
                                s <= step ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
                            )}
                        />
                    ))}
                </div>

                <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-5">
                    {/* Vehicle & Client Summary */}
                    <div className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl mb-5">
                        <div
                            className="w-16 h-12 rounded-lg bg-cover bg-center bg-gray-200 shrink-0"
                            style={{ backgroundImage: isValidImageUrl(vehicle.imagen_principal) ? `url(${vehicle.imagen_principal})` : 'none' }}
                        />
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate">{vehicle.marca} {vehicle.modelo}</p>
                            <p className="text-xs text-gray-500">{vehicle.matricula}</p>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="font-bold text-green-600">{formatCurrency(vehicle.precio_venta)}</p>
                            <p className="text-xs text-gray-500">PVP</p>
                        </div>
                    </div>

                    {/* Step 1: Pricing */}
                    {step === 1 && (
                        <div className="space-y-5">
                            <div>
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-green-500">payments</span>
                                    Precio de Venta
                                </h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Precio Venta (€)</Label>
                                        <Input
                                            type="number"
                                            value={precioVentaFinal}
                                            onChange={(e) => setPrecioVentaFinal(e.target.value)}
                                            className="text-lg font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Descuento (€)</Label>
                                        <Input
                                            type="number"
                                            value={descuento}
                                            onChange={(e) => setDescuento(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Gastos Adicionales (€)</Label>
                                        <Input
                                            type="number"
                                            value={gastosAdicionales}
                                            onChange={(e) => setGastosAdicionales(e.target.value)}
                                            placeholder="Ej: gestoría, transporte..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Descripción Gastos</Label>
                                        <Input
                                            value={descripcionGastos}
                                            onChange={(e) => setDescripcionGastos(e.target.value)}
                                            placeholder="Opcional"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Financial Summary */}
                            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-gray-600 dark:text-gray-400">Precio Final</span>
                                    <span className="text-2xl font-bold text-green-600">
                                        {formatCurrency(financials.precioFinal)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Margen Bruto</span>
                                    <span className={cn(
                                        "font-bold",
                                        financials.margen >= 0 ? "text-green-600" : "text-red-600"
                                    )}>
                                        {formatCurrency(financials.margen)} ({financials.margenPorcentaje.toFixed(1)}%)
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Payment Method */}
                    {step === 2 && (
                        <div className="space-y-5">
                            <div>
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-green-500">account_balance</span>
                                    Forma de Pago
                                </h3>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    {[
                                        { value: 'contado', label: 'Contado', icon: 'payments' },
                                        { value: 'financiacion', label: 'Financiación', icon: 'credit_card' },
                                        { value: 'leasing', label: 'Leasing', icon: 'request_quote' },
                                        { value: 'renting', label: 'Renting', icon: 'time_auto' },
                                    ].map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => setFormaPago(option.value as SaleData['formaPago'])}
                                            className={cn(
                                                "flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                                                formaPago === option.value
                                                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                                            )}
                                        >
                                            <span className={cn(
                                                "material-symbols-outlined",
                                                formaPago === option.value ? "text-green-500" : "text-gray-400"
                                            )}>
                                                {option.icon}
                                            </span>
                                            <span className={cn(
                                                "font-medium",
                                                formaPago === option.value ? "text-green-700 dark:text-green-400" : ""
                                            )}>
                                                {option.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {formaPago !== 'contado' && (
                                    <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                        <h4 className="font-medium text-blue-800 dark:text-blue-300 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-sm">info</span>
                                            Detalles de Financiación
                                        </h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label>Entrada Inicial (€)</Label>
                                                <Input
                                                    type="number"
                                                    value={entradaInicial}
                                                    onChange={(e) => setEntradaInicial(e.target.value)}
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Nº Cuotas</Label>
                                                <Select value={cuotasMensuales} onValueChange={setCuotasMensuales}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {[12, 24, 36, 48, 60, 72, 84].map(n => (
                                                            <SelectItem key={n} value={n.toString()}>{n} meses</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2 col-span-2">
                                                <Label>Entidad Financiera</Label>
                                                <Select value={entidadFinanciera} onValueChange={setEntidadFinanciera}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccionar" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="santander">Santander Consumer</SelectItem>
                                                        <SelectItem value="cetelem">Cetelem</SelectItem>
                                                        <SelectItem value="bbva">BBVA</SelectItem>
                                                        <SelectItem value="caixabank">CaixaBank</SelectItem>
                                                        <SelectItem value="sabadell">Sabadell</SelectItem>
                                                        <SelectItem value="otro">Otro</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Cuota estimada */}
                                        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Importe a financiar</span>
                                                <span className="font-bold">{formatCurrency(financials.importeFinanciar)}</span>
                                            </div>
                                            <div className="flex justify-between items-center mt-1">
                                                <span className="text-sm text-gray-600">Cuota estimada (sin int.)</span>
                                                <span className="font-bold text-blue-600">{formatCurrency(financials.cuotaEstimada)}/mes</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Delivery & Warranty */}
                    {step === 3 && (
                        <div className="space-y-5">
                            <div>
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-green-500">local_shipping</span>
                                    Entrega y Garantía
                                </h3>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Fecha de Entrega</Label>
                                        <Input
                                            type="date"
                                            value={fechaEntrega}
                                            onChange={(e) => setFechaEntrega(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Garantía</Label>
                                        <Select value={garantiaMeses} onValueChange={setGarantiaMeses}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="6">6 meses</SelectItem>
                                                <SelectItem value="12">12 meses (estándar)</SelectItem>
                                                <SelectItem value="24">24 meses</SelectItem>
                                                <SelectItem value="36">36 meses</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                                        <input
                                            type="checkbox"
                                            id="garantiaExtendida"
                                            checked={garantiaExtendida}
                                            onChange={(e) => setGarantiaExtendida(e.target.checked)}
                                            className="w-5 h-5 rounded border-purple-300 text-purple-500 focus:ring-purple-500"
                                        />
                                        <label htmlFor="garantiaExtendida" className="flex-1 cursor-pointer">
                                            <span className="font-medium text-purple-800 dark:text-purple-300">Garantía Extendida Premium</span>
                                            <span className="block text-sm text-purple-600 dark:text-purple-400">Incluye asistencia en carretera 24h</span>
                                        </label>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Notas de la venta</Label>
                                        <Textarea
                                            value={notas}
                                            onChange={(e) => setNotas(e.target.value)}
                                            placeholder="Observaciones, acuerdos especiales..."
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Final Summary */}
                            <div className="p-4 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border border-green-300 dark:border-green-700">
                                <h4 className="font-bold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined">receipt_long</span>
                                    Resumen de la Venta
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Cliente</span>
                                        <span className="font-medium">{lead.cliente?.nombre} {lead.cliente?.apellidos}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Vehículo</span>
                                        <span className="font-medium">{vehicle.marca} {vehicle.modelo}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Forma de Pago</span>
                                        <span className="font-medium capitalize">{formaPago}</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-green-300 dark:border-green-600">
                                        <span className="font-bold text-green-800 dark:text-green-300">TOTAL</span>
                                        <span className="font-bold text-xl text-green-600">{formatCurrency(financials.precioFinal)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Navigation */}
                <div className="sticky bottom-0 flex gap-3 p-4 bg-white dark:bg-[#1c1c1e] border-t border-gray-200 dark:border-gray-800">
                    {step > 1 && (
                        <button
                            onClick={() => setStep((step - 1) as 1 | 2 | 3)}
                            className="flex-1 py-3 rounded-xl font-bold border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            Anterior
                        </button>
                    )}

                    {step < 3 ? (
                        <button
                            onClick={() => setStep((step + 1) as 2 | 3)}
                            className="flex-1 py-3 rounded-xl font-bold bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/30 transition-all flex items-center justify-center gap-2"
                        >
                            Siguiente
                            <span className="material-symbols-outlined text-xl">arrow_forward</span>
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex-1 py-3 rounded-xl font-bold bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-xl">check_circle</span>
                                    Confirmar Venta
                                </>
                            )}
                        </button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
