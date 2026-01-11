"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Car,
    Settings,
    DollarSign,
    Save,
    AlertCircle,
    RotateCcw,
    ChevronDown,
    ChevronUp,
    Check,
} from "lucide-react"
import { MARCAS, COMBUSTIBLES, TRANSMISIONES, CARROCERIAS, ETIQUETAS_DGT, EQUIPAMIENTO_VEHICULO } from "@/lib/constants"
import { formatCurrency, cn } from "@/lib/utils"
import { mockVehicles } from "@/lib/mock-data"
import type { Vehicle } from "@/types"

interface QuickEditFormProps {
    vehicleId: string
    onSave: (vehicle: Vehicle) => void
    onCancel: () => void
}

// Collapsible section component
function Section({
    title,
    icon: Icon,
    children,
    defaultOpen = true
}: {
    title: string
    icon: React.ComponentType<{ className?: string }>
    children: React.ReactNode
    defaultOpen?: boolean
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-foreground">{title}</span>
                </div>
                {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
            </button>
            {isOpen && (
                <div className="p-4 pt-0 border-t border-gray-100 dark:border-gray-800">
                    {children}
                </div>
            )}
        </div>
    )
}

export function QuickEditForm({ vehicleId, onSave, onCancel }: QuickEditFormProps) {
    const originalVehicle = useMemo(() =>
        mockVehicles.find(v => v.id === vehicleId),
        [vehicleId]
    )

    const [formData, setFormData] = useState<Vehicle | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [showSaveSuccess, setShowSaveSuccess] = useState(false)

    // Initialize form with vehicle data
    useEffect(() => {
        if (originalVehicle) {
            setFormData({ ...originalVehicle })
        }
    }, [originalVehicle])

    // Check if form has changes
    const hasChanges = useMemo(() => {
        if (!formData || !originalVehicle) return false
        return JSON.stringify(formData) !== JSON.stringify(originalVehicle)
    }, [formData, originalVehicle])

    // Update a field
    const updateField = useCallback(<K extends keyof Vehicle>(field: K, value: Vehicle[K]) => {
        setFormData(prev => prev ? { ...prev, [field]: value } : null)
    }, [])

    // Toggle equipment
    const toggleEquipment = useCallback((equipmentId: string) => {
        setFormData(prev => {
            if (!prev) return null
            const current = prev.equipamiento || []
            if (current.includes(equipmentId)) {
                return { ...prev, equipamiento: current.filter(id => id !== equipmentId) }
            } else {
                return { ...prev, equipamiento: [...current, equipmentId] }
            }
        })
    }, [])

    // Reset form to original
    const handleReset = useCallback(() => {
        if (originalVehicle) {
            setFormData({ ...originalVehicle })
        }
    }, [originalVehicle])

    // Save changes
    const handleSave = useCallback(async () => {
        if (!formData) return

        setIsSaving(true)

        // Find and update the vehicle in mock data
        const vehicleIndex = mockVehicles.findIndex(v => v.id === vehicleId)
        if (vehicleIndex !== -1) {
            // Update the mock data directly (in production this would be an API call)
            Object.assign(mockVehicles[vehicleIndex], formData)
        }

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))

        setIsSaving(false)
        setShowSaveSuccess(true)

        // Hide success message after 2 seconds
        setTimeout(() => setShowSaveSuccess(false), 2000)

        onSave(formData)
    }, [formData, vehicleId, onSave])

    // Calculate financials
    const financials = useMemo(() => {
        if (!formData) return { costeTotal: 0, precioFinal: 0, margen: 0, margenPorcentaje: 0 }

        const costeTotal = formData.precio_compra + formData.gastos_compra + formData.coste_reparaciones
        const precioFinal = formData.precio_venta - formData.descuento
        const margen = precioFinal - costeTotal
        const margenPorcentaje = precioFinal > 0 ? (margen / precioFinal) * 100 : 0

        return { costeTotal, precioFinal, margen, margenPorcentaje }
    }, [formData])

    if (!formData || !originalVehicle) {
        return <div className="p-8 text-center">Cargando...</div>
    }

    return (
        <div className="space-y-4">
            {/* Floating Save Bar */}
            <div className={cn(
                "fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 transform",
                hasChanges ? "translate-y-0" : "translate-y-full"
            )}>
                <div className="bg-white dark:bg-surface-dark border-t border-gray-200 dark:border-gray-700 shadow-lg">
                    <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Tienes cambios sin guardar
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleReset}
                                className="gap-2"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Descartar
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="gap-2 bg-primary hover:bg-primary/90"
                            >
                                <Save className="h-4 w-4" />
                                {isSaving ? 'Guardando...' : 'Guardar cambios'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Toast */}
            {showSaveSuccess && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        <span className="text-sm font-medium">Cambios guardados correctamente</span>
                    </div>
                </div>
            )}

            {/* Datos Básicos */}
            <Section title="Datos Básicos" icon={Car}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                    <div className="space-y-2">
                        <Label>Marca</Label>
                        <Select value={formData.marca} onValueChange={(v) => updateField('marca', v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {MARCAS.map(marca => (
                                    <SelectItem key={marca} value={marca}>{marca}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Modelo</Label>
                        <Input
                            value={formData.modelo}
                            onChange={(e) => updateField('modelo', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Versión</Label>
                        <Input
                            value={formData.version}
                            onChange={(e) => updateField('version', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Matrícula</Label>
                        <Input
                            value={formData.matricula}
                            onChange={(e) => updateField('matricula', e.target.value.toUpperCase())}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>VIN</Label>
                        <Input
                            value={formData.vin}
                            maxLength={17}
                            onChange={(e) => updateField('vin', e.target.value.toUpperCase())}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Año Matriculación</Label>
                        <Input
                            type="number"
                            value={formData.año_matriculacion}
                            onChange={(e) => updateField('año_matriculacion', parseInt(e.target.value) || 0)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Kilómetros</Label>
                        <Input
                            type="number"
                            value={formData.kilometraje}
                            onChange={(e) => updateField('kilometraje', parseInt(e.target.value) || 0)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Combustible</Label>
                        <Select value={formData.combustible} onValueChange={(v) => updateField('combustible', v as Vehicle['combustible'])}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {COMBUSTIBLES.map(c => (
                                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Transmisión</Label>
                        <Select value={formData.transmision} onValueChange={(v) => updateField('transmision', v as Vehicle['transmision'])}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {TRANSMISIONES.map(t => (
                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Estado</Label>
                        <Select value={formData.estado} onValueChange={(v) => updateField('estado', v as Vehicle['estado'])}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="disponible">Disponible</SelectItem>
                                <SelectItem value="reservado">Reservado</SelectItem>
                                <SelectItem value="vendido">Vendido</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </Section>

            {/* Especificaciones */}
            <Section title="Especificaciones Técnicas" icon={Settings} defaultOpen={false}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                    <div className="space-y-2">
                        <Label>Tipo Carrocería</Label>
                        <Select value={formData.tipo_carroceria} onValueChange={(v) => updateField('tipo_carroceria', v as Vehicle['tipo_carroceria'])}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {CARROCERIAS.map(c => (
                                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Nº Puertas</Label>
                        <Select value={formData.num_puertas.toString()} onValueChange={(v) => updateField('num_puertas', parseInt(v))}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[2, 3, 4, 5].map(n => (
                                    <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Nº Plazas</Label>
                        <Select value={formData.num_plazas.toString()} onValueChange={(v) => updateField('num_plazas', parseInt(v))}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[2, 4, 5, 7, 9].map(n => (
                                    <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Potencia (CV)</Label>
                        <Input
                            type="number"
                            value={formData.potencia_cv}
                            onChange={(e) => updateField('potencia_cv', parseInt(e.target.value) || 0)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Cilindrada (cc)</Label>
                        <Input
                            type="number"
                            value={formData.cilindrada}
                            onChange={(e) => updateField('cilindrada', parseInt(e.target.value) || 0)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Etiqueta DGT</Label>
                        <Select value={formData.etiqueta_dgt} onValueChange={(v) => updateField('etiqueta_dgt', v as Vehicle['etiqueta_dgt'])}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ETIQUETAS_DGT.map(e => (
                                    <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Color Exterior</Label>
                        <Input
                            value={formData.color_exterior}
                            onChange={(e) => updateField('color_exterior', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Color Interior</Label>
                        <Input
                            value={formData.color_interior}
                            onChange={(e) => updateField('color_interior', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Nº Propietarios</Label>
                        <Input
                            type="number"
                            min={1}
                            value={formData.num_propietarios}
                            onChange={(e) => updateField('num_propietarios', parseInt(e.target.value) || 1)}
                        />
                    </div>
                </div>
                <div className="flex gap-6 pt-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="primera_mano"
                            checked={formData.primera_mano}
                            onCheckedChange={(c) => updateField('primera_mano', c as boolean)}
                        />
                        <Label htmlFor="primera_mano">Primera mano</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="es_nacional"
                            checked={formData.es_nacional}
                            onCheckedChange={(c) => updateField('es_nacional', c as boolean)}
                        />
                        <Label htmlFor="es_nacional">Nacional</Label>
                    </div>
                </div>

                {/* Equipment */}
                <div className="pt-6 border-t border-gray-100 dark:border-gray-800 mt-4">
                    <h4 className="font-medium text-foreground mb-4">Equipamiento</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        {Object.entries(EQUIPAMIENTO_VEHICULO).map(([categoryKey, category]) => (
                            <div key={categoryKey} className="space-y-3">
                                <h5 className="text-sm font-medium text-primary">{category.label}</h5>
                                <div className="space-y-2">
                                    {category.items.map((item) => (
                                        <div key={item.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`edit-${item.id}`}
                                                checked={(formData.equipamiento || []).includes(item.id)}
                                                onCheckedChange={() => toggleEquipment(item.id)}
                                            />
                                            <Label htmlFor={`edit-${item.id}`} className="text-xs cursor-pointer">{item.label}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                        {(formData.equipamiento || []).length} elementos seleccionados
                    </p>
                </div>
            </Section>

            {/* Precios */}
            <Section title="Precios y Costes" icon={DollarSign}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                    <div className="space-y-2">
                        <Label>Precio de Compra</Label>
                        <Input
                            type="number"
                            value={formData.precio_compra}
                            onChange={(e) => updateField('precio_compra', parseFloat(e.target.value) || 0)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Gastos de Compra</Label>
                        <Input
                            type="number"
                            value={formData.gastos_compra}
                            onChange={(e) => updateField('gastos_compra', parseFloat(e.target.value) || 0)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Coste Reparaciones</Label>
                        <Input
                            type="number"
                            value={formData.coste_reparaciones}
                            onChange={(e) => updateField('coste_reparaciones', parseFloat(e.target.value) || 0)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Precio de Venta</Label>
                        <Input
                            type="number"
                            value={formData.precio_venta}
                            onChange={(e) => updateField('precio_venta', parseFloat(e.target.value) || 0)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Descuento</Label>
                        <Input
                            type="number"
                            value={formData.descuento}
                            onChange={(e) => updateField('descuento', parseFloat(e.target.value) || 0)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Garantía (meses)</Label>
                        <Select value={formData.garantia_meses.toString()} onValueChange={(v) => updateField('garantia_meses', parseInt(v))}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[6, 12, 24, 36].map(m => (
                                    <SelectItem key={m} value={m.toString()}>{m} meses</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Financial Summary */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-3 mt-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Coste total (compra + gastos + reparaciones)</span>
                        <span>{formatCurrency(financials.costeTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Precio venta final</span>
                        <span>{formatCurrency(financials.precioFinal)}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t border-gray-200 dark:border-gray-700">
                        <span>Margen bruto</span>
                        <span className={financials.margen >= 0 ? "text-green-600" : "text-red-600"}>
                            {formatCurrency(financials.margen)} ({financials.margenPorcentaje.toFixed(1)}%)
                        </span>
                    </div>
                    {financials.margen < 0 && (
                        <div className="flex items-center gap-2 text-xs text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            El precio de venta es inferior al coste total
                        </div>
                    )}
                </div>

                {/* Visibility options */}
                <div className="flex gap-6 pt-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="destacado"
                            checked={formData.destacado}
                            onCheckedChange={(c) => updateField('destacado', c as boolean)}
                        />
                        <Label htmlFor="destacado">Vehículo destacado</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="en_oferta"
                            checked={formData.en_oferta}
                            onCheckedChange={(c) => updateField('en_oferta', c as boolean)}
                        />
                        <Label htmlFor="en_oferta">En oferta</Label>
                    </div>
                </div>
            </Section>

            {/* Bottom padding for floating bar */}
            <div className="h-20" />
        </div>
    )
}
