"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
    X,
    Wrench,
} from "lucide-react"
import { MARCAS, COMBUSTIBLES, TRANSMISIONES, CARROCERIAS, ETIQUETAS_DGT, EQUIPAMIENTO_VEHICULO } from "@/lib/constants"
import { formatCurrency, cn } from "@/lib/utils"
import { getVehicleById, updateVehicle } from "@/lib/supabase-service"
import type { Vehicle } from "@/types"

interface QuickEditFormProps {
    vehicleId: string
    onSave: (vehicle: Vehicle) => void
    onCancel: () => void
}

// Mobile-optimized collapsible section
function Section({
    title,
    icon: Icon,
    children,
    defaultOpen = true,
    badge,
}: {
    title: string
    icon: React.ComponentType<{ className?: string }>
    children: React.ReactNode
    defaultOpen?: boolean
    badge?: string | number
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 active:bg-gray-50 dark:active:bg-gray-800/50 transition-colors touch-manipulation"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground text-base">{title}</span>
                    {badge !== undefined && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            {badge}
                        </span>
                    )}
                </div>
                <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                    isOpen ? "bg-primary/10" : "bg-gray-100 dark:bg-gray-800"
                )}>
                    {isOpen ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                    ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                </div>
            </button>
            <div className={cn(
                "overflow-hidden transition-all duration-300",
                isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
            )}>
                <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                    {children}
                </div>
            </div>
        </div>
    )
}

// Mobile-optimized form field
function FormField({
    label,
    children,
    className,
}: {
    label: string
    children: React.ReactNode
    className?: string
}) {
    return (
        <div className={cn("space-y-2", className)}>
            <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</Label>
            {children}
        </div>
    )
}

// Equipment category with collapsible items
function EquipmentCategory({
    label,
    items,
    selected,
    onToggle,
}: {
    label: string
    items: readonly { readonly id: string; readonly label: string }[]
    selected: string[]
    onToggle: (id: string) => void
}) {
    const [isExpanded, setIsExpanded] = useState(false)
    const selectedCount = items.filter(item => selected.includes(item.id)).length

    return (
        <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 active:bg-gray-100 dark:active:bg-gray-800 touch-manipulation"
            >
                <span className="font-medium text-sm text-foreground">{label}</span>
                <div className="flex items-center gap-2">
                    {selectedCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-primary text-white text-xs font-medium">
                            {selectedCount}
                        </span>
                    )}
                    <ChevronDown className={cn(
                        "h-4 w-4 text-gray-400 transition-transform",
                        isExpanded && "rotate-180"
                    )} />
                </div>
            </button>
            {isExpanded && (
                <div className="p-3 space-y-2 bg-white dark:bg-surface-dark">
                    {items.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onToggle(item.id)}
                            className={cn(
                                "w-full flex items-center gap-3 p-3 rounded-lg transition-colors touch-manipulation",
                                selected.includes(item.id)
                                    ? "bg-primary/10 border-2 border-primary"
                                    : "bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent"
                            )}
                        >
                            <div className={cn(
                                "w-5 h-5 rounded flex items-center justify-center flex-shrink-0",
                                selected.includes(item.id)
                                    ? "bg-primary"
                                    : "bg-gray-200 dark:bg-gray-700"
                            )}>
                                {selected.includes(item.id) && (
                                    <Check className="h-3 w-3 text-white" />
                                )}
                            </div>
                            <span className={cn(
                                "text-sm text-left",
                                selected.includes(item.id) ? "font-medium text-primary" : "text-foreground"
                            )}>
                                {item.label}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export function QuickEditForm({ vehicleId, onSave, onCancel }: QuickEditFormProps) {
    const [originalVehicle, setOriginalVehicle] = useState<Vehicle | null>(null)
    const [formData, setFormData] = useState<Vehicle | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [showSaveSuccess, setShowSaveSuccess] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    // Load vehicle from Supabase
    useEffect(() => {
        const loadVehicle = async () => {
            setIsLoading(true)
            const vehicle = await getVehicleById(vehicleId)
            if (vehicle) {
                setOriginalVehicle(vehicle)
                setFormData({ ...vehicle })
            }
            setIsLoading(false)
        }
        loadVehicle()
    }, [vehicleId])

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

        try {
            const updatedVehicle = await updateVehicle(vehicleId, formData)

            if (updatedVehicle) {
                window.dispatchEvent(new CustomEvent('midcar-data-updated', { detail: { type: 'vehicles' } }))
                setOriginalVehicle(updatedVehicle)
                setShowSaveSuccess(true)
                setTimeout(() => {
                    setShowSaveSuccess(false)
                    onSave(updatedVehicle)
                }, 1500)
            } else {
                console.error('Failed to update vehicle')
            }
        } catch (error) {
            console.error('Error updating vehicle:', error)
        }

        setIsSaving(false)
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

    // Equipment count
    const equipmentCount = useMemo(() => {
        return (formData?.equipamiento || []).length
    }, [formData?.equipamiento])

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-3 border-primary border-t-transparent mb-4" />
                <p className="text-muted-foreground font-medium">Cargando vehículo...</p>
            </div>
        )
    }

    if (!formData || !originalVehicle) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <p className="text-muted-foreground font-medium">No se pudo cargar el vehículo</p>
                <Button variant="outline" onClick={onCancel} className="mt-4">
                    Volver
                </Button>
            </div>
        )
    }

    return (
        <div className="pb-40">
            {/* Mobile Header - Fixed */}
            <div className="sticky top-0 z-40 -mx-4 px-4 py-3 bg-background/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 lg:hidden">
                <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-foreground truncate">
                            {formData.marca} {formData.modelo}
                        </h2>
                        <p className="text-sm text-muted-foreground">{formData.matricula}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onCancel}
                            className="h-10 w-10"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={!hasChanges || isSaving}
                            className={cn(
                                "h-10 px-4 gap-2 font-semibold transition-all",
                                hasChanges ? "bg-primary" : "bg-gray-300 dark:bg-gray-700"
                            )}
                        >
                            {isSaving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                    Guardando
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Guardar
                                </>
                            )}
                        </Button>
                    </div>
                </div>
                {hasChanges && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        Tienes cambios sin guardar
                    </div>
                )}
            </div>

            {/* Success Toast */}
            {showSaveSuccess && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4">
                    <div className="bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                            <Check className="h-5 w-5" />
                        </div>
                        <span className="font-medium">¡Cambios guardados!</span>
                    </div>
                </div>
            )}

            {/* Form Content */}
            <div className="space-y-4 pt-4">
                {/* Datos Básicos */}
                <Section title="Datos Básicos" icon={Car}>
                    <div className="space-y-4">
                        <FormField label="Marca">
                            <Select value={formData.marca} onValueChange={(v) => updateField('marca', v)}>
                                <SelectTrigger className="h-12 text-base">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {MARCAS.map(marca => (
                                        <SelectItem key={marca} value={marca} className="py-3">{marca}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>

                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Modelo">
                                <Input
                                    value={formData.modelo}
                                    onChange={(e) => updateField('modelo', e.target.value)}
                                    className="h-12 text-base"
                                />
                            </FormField>
                            <FormField label="Versión">
                                <Input
                                    value={formData.version}
                                    onChange={(e) => updateField('version', e.target.value)}
                                    className="h-12 text-base"
                                />
                            </FormField>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Matrícula">
                                <Input
                                    value={formData.matricula}
                                    onChange={(e) => updateField('matricula', e.target.value.toUpperCase())}
                                    className="h-12 text-base font-mono"
                                />
                            </FormField>
                            <FormField label="Año">
                                <Input
                                    type="number"
                                    inputMode="numeric"
                                    value={formData.año_matriculacion}
                                    onChange={(e) => updateField('año_matriculacion', parseInt(e.target.value) || 0)}
                                    className="h-12 text-base"
                                />
                            </FormField>
                        </div>

                        <FormField label="VIN">
                            <Input
                                value={formData.vin}
                                maxLength={17}
                                onChange={(e) => updateField('vin', e.target.value.toUpperCase())}
                                className="h-12 text-base font-mono"
                                placeholder="17 caracteres"
                            />
                        </FormField>

                        <FormField label="Kilómetros">
                            <div className="relative">
                                <Input
                                    type="number"
                                    inputMode="numeric"
                                    value={formData.kilometraje}
                                    onChange={(e) => updateField('kilometraje', parseInt(e.target.value) || 0)}
                                    className="h-12 text-base pr-12"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                    km
                                </span>
                            </div>
                        </FormField>

                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Combustible">
                                <Select value={formData.combustible} onValueChange={(v) => updateField('combustible', v as Vehicle['combustible'])}>
                                    <SelectTrigger className="h-12 text-base">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {COMBUSTIBLES.map(c => (
                                            <SelectItem key={c.value} value={c.value} className="py-3">{c.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormField>
                            <FormField label="Transmisión">
                                <Select value={formData.transmision} onValueChange={(v) => updateField('transmision', v as Vehicle['transmision'])}>
                                    <SelectTrigger className="h-12 text-base">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TRANSMISIONES.map(t => (
                                            <SelectItem key={t.value} value={t.value} className="py-3">{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormField>
                        </div>

                        <FormField label="Estado">
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { value: 'disponible', label: 'Disponible', color: 'bg-green-500' },
                                    { value: 'reservado', label: 'Reservado', color: 'bg-amber-500' },
                                    { value: 'vendido', label: 'Vendido', color: 'bg-red-500' },
                                ].map((estado) => (
                                    <button
                                        key={estado.value}
                                        onClick={() => updateField('estado', estado.value as Vehicle['estado'])}
                                        className={cn(
                                            "h-12 rounded-xl font-medium text-sm transition-all touch-manipulation flex items-center justify-center gap-2",
                                            formData.estado === estado.value
                                                ? "bg-primary text-white shadow-lg scale-[1.02]"
                                                : "bg-gray-100 dark:bg-gray-800 text-foreground"
                                        )}
                                    >
                                        <div className={cn("w-2 h-2 rounded-full", estado.color)} />
                                        {estado.label}
                                    </button>
                                ))}
                            </div>
                        </FormField>
                    </div>
                </Section>

                {/* Especificaciones */}
                <Section title="Especificaciones" icon={Settings} defaultOpen={false}>
                    <div className="space-y-4">
                        <FormField label="Tipo Carrocería">
                            <Select value={formData.tipo_carroceria} onValueChange={(v) => updateField('tipo_carroceria', v as Vehicle['tipo_carroceria'])}>
                                <SelectTrigger className="h-12 text-base">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CARROCERIAS.map(c => (
                                        <SelectItem key={c.value} value={c.value} className="py-3">{c.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>

                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Puertas">
                                <Select value={formData.num_puertas.toString()} onValueChange={(v) => updateField('num_puertas', parseInt(v))}>
                                    <SelectTrigger className="h-12 text-base">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[2, 3, 4, 5].map(n => (
                                            <SelectItem key={n} value={n.toString()} className="py-3">{n} puertas</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormField>
                            <FormField label="Plazas">
                                <Select value={formData.num_plazas.toString()} onValueChange={(v) => updateField('num_plazas', parseInt(v))}>
                                    <SelectTrigger className="h-12 text-base">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[2, 4, 5, 7, 9].map(n => (
                                            <SelectItem key={n} value={n.toString()} className="py-3">{n} plazas</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormField>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Potencia">
                                <div className="relative">
                                    <Input
                                        type="number"
                                        inputMode="numeric"
                                        value={formData.potencia_cv}
                                        onChange={(e) => updateField('potencia_cv', parseInt(e.target.value) || 0)}
                                        className="h-12 text-base pr-10"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                        CV
                                    </span>
                                </div>
                            </FormField>
                            <FormField label="Cilindrada">
                                <div className="relative">
                                    <Input
                                        type="number"
                                        inputMode="numeric"
                                        value={formData.cilindrada}
                                        onChange={(e) => updateField('cilindrada', parseInt(e.target.value) || 0)}
                                        className="h-12 text-base pr-10"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                        cc
                                    </span>
                                </div>
                            </FormField>
                        </div>

                        <FormField label="Etiqueta DGT">
                            <Select value={formData.etiqueta_dgt} onValueChange={(v) => updateField('etiqueta_dgt', v as Vehicle['etiqueta_dgt'])}>
                                <SelectTrigger className="h-12 text-base">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ETIQUETAS_DGT.map(e => (
                                        <SelectItem key={e.value} value={e.value} className="py-3">{e.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>

                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Color Exterior">
                                <Input
                                    value={formData.color_exterior}
                                    onChange={(e) => updateField('color_exterior', e.target.value)}
                                    className="h-12 text-base"
                                />
                            </FormField>
                            <FormField label="Color Interior">
                                <Input
                                    value={formData.color_interior}
                                    onChange={(e) => updateField('color_interior', e.target.value)}
                                    className="h-12 text-base"
                                />
                            </FormField>
                        </div>

                        <FormField label="Propietarios anteriores">
                            <Input
                                type="number"
                                inputMode="numeric"
                                min={1}
                                value={formData.num_propietarios}
                                onChange={(e) => updateField('num_propietarios', parseInt(e.target.value) || 1)}
                                className="h-12 text-base"
                            />
                        </FormField>

                        {/* Toggle buttons for booleans */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => updateField('primera_mano', !formData.primera_mano)}
                                className={cn(
                                    "h-14 rounded-xl font-medium text-sm transition-all touch-manipulation flex items-center justify-center gap-2 border-2",
                                    formData.primera_mano
                                        ? "bg-primary/10 border-primary text-primary"
                                        : "bg-gray-50 dark:bg-gray-800/50 border-transparent text-foreground"
                                )}
                            >
                                {formData.primera_mano && <Check className="h-4 w-4" />}
                                Primera mano
                            </button>
                            <button
                                onClick={() => updateField('es_nacional', !formData.es_nacional)}
                                className={cn(
                                    "h-14 rounded-xl font-medium text-sm transition-all touch-manipulation flex items-center justify-center gap-2 border-2",
                                    formData.es_nacional
                                        ? "bg-primary/10 border-primary text-primary"
                                        : "bg-gray-50 dark:bg-gray-800/50 border-transparent text-foreground"
                                )}
                            >
                                {formData.es_nacional && <Check className="h-4 w-4" />}
                                Nacional
                            </button>
                        </div>
                    </div>
                </Section>

                {/* Equipamiento */}
                <Section title="Equipamiento" icon={Wrench} defaultOpen={false} badge={equipmentCount}>
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Selecciona el equipamiento del vehículo
                        </p>
                        {Object.entries(EQUIPAMIENTO_VEHICULO).map(([categoryKey, category]) => (
                            <EquipmentCategory
                                key={categoryKey}
                                label={category.label}
                                items={category.items}
                                selected={formData.equipamiento || []}
                                onToggle={toggleEquipment}
                            />
                        ))}
                    </div>
                </Section>

                {/* Precios */}
                <Section title="Precios y Costes" icon={DollarSign}>
                    <div className="space-y-4">
                        {/* Financial Summary Card - At top for quick visibility */}
                        <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800 rounded-xl space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Coste total</span>
                                <span className="font-medium">{formatCurrency(financials.costeTotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Precio venta final</span>
                                <span className="font-medium">{formatCurrency(financials.precioFinal)}</span>
                            </div>
                            <div className="h-px bg-gray-200 dark:bg-gray-700" />
                            <div className="flex justify-between items-center">
                                <span className="font-semibold">Margen bruto</span>
                                <div className="text-right">
                                    <span className={cn(
                                        "text-lg font-bold",
                                        financials.margen >= 0 ? "text-green-600" : "text-red-600"
                                    )}>
                                        {formatCurrency(financials.margen)}
                                    </span>
                                    <span className={cn(
                                        "ml-2 text-sm",
                                        financials.margen >= 0 ? "text-green-600" : "text-red-600"
                                    )}>
                                        ({financials.margenPorcentaje.toFixed(1)}%)
                                    </span>
                                </div>
                            </div>
                            {financials.margen < 0 && (
                                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    Precio inferior al coste total
                                </div>
                            )}
                        </div>

                        <FormField label="Precio de Compra">
                            <div className="relative">
                                <Input
                                    type="number"
                                    inputMode="decimal"
                                    value={formData.precio_compra}
                                    onChange={(e) => updateField('precio_compra', parseFloat(e.target.value) || 0)}
                                    className="h-12 text-base pr-8"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                    €
                                </span>
                            </div>
                        </FormField>

                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Gastos">
                                <div className="relative">
                                    <Input
                                        type="number"
                                        inputMode="decimal"
                                        value={formData.gastos_compra}
                                        onChange={(e) => updateField('gastos_compra', parseFloat(e.target.value) || 0)}
                                        className="h-12 text-base pr-8"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                        €
                                    </span>
                                </div>
                            </FormField>
                            <FormField label="Reparaciones">
                                <div className="relative">
                                    <Input
                                        type="number"
                                        inputMode="decimal"
                                        value={formData.coste_reparaciones}
                                        onChange={(e) => updateField('coste_reparaciones', parseFloat(e.target.value) || 0)}
                                        className="h-12 text-base pr-8"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                        €
                                    </span>
                                </div>
                            </FormField>
                        </div>

                        <FormField label="Precio de Venta">
                            <div className="relative">
                                <Input
                                    type="number"
                                    inputMode="decimal"
                                    value={formData.precio_venta}
                                    onChange={(e) => updateField('precio_venta', parseFloat(e.target.value) || 0)}
                                    className="h-12 text-base text-lg font-semibold pr-8"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                    €
                                </span>
                            </div>
                        </FormField>

                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Descuento">
                                <div className="relative">
                                    <Input
                                        type="number"
                                        inputMode="decimal"
                                        value={formData.descuento}
                                        onChange={(e) => updateField('descuento', parseFloat(e.target.value) || 0)}
                                        className="h-12 text-base pr-8"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                        €
                                    </span>
                                </div>
                            </FormField>
                            <FormField label="Garantía">
                                <Select value={formData.garantia_meses.toString()} onValueChange={(v) => updateField('garantia_meses', parseInt(v))}>
                                    <SelectTrigger className="h-12 text-base">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[6, 12, 24, 36].map(m => (
                                            <SelectItem key={m} value={m.toString()} className="py-3">{m} meses</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormField>
                        </div>

                        {/* Visibility toggles */}
                        <div className="pt-2">
                            <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 block">
                                Opciones de visibilidad
                            </Label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => updateField('destacado', !formData.destacado)}
                                    className={cn(
                                        "h-14 rounded-xl font-medium text-sm transition-all touch-manipulation flex items-center justify-center gap-2 border-2",
                                        formData.destacado
                                            ? "bg-amber-50 dark:bg-amber-900/20 border-amber-400 text-amber-700 dark:text-amber-400"
                                            : "bg-gray-50 dark:bg-gray-800/50 border-transparent text-foreground"
                                    )}
                                >
                                    <span className="material-symbols-outlined text-xl">star</span>
                                    Destacado
                                </button>
                                <button
                                    onClick={() => updateField('en_oferta', !formData.en_oferta)}
                                    className={cn(
                                        "h-14 rounded-xl font-medium text-sm transition-all touch-manipulation flex items-center justify-center gap-2 border-2",
                                        formData.en_oferta
                                            ? "bg-red-50 dark:bg-red-900/20 border-red-400 text-red-700 dark:text-red-400"
                                            : "bg-gray-50 dark:bg-gray-800/50 border-transparent text-foreground"
                                    )}
                                >
                                    <span className="material-symbols-outlined text-xl">local_offer</span>
                                    En oferta
                                </button>
                            </div>
                        </div>
                    </div>
                </Section>
            </div>

            {/* Bottom Action Bar - Mobile Only */}
            <div className={cn(
                "fixed left-0 right-0 z-40 transition-all duration-300 transform lg:hidden",
                "bottom-16", // Above BottomNav
                hasChanges ? "translate-y-0" : "translate-y-full"
            )}>
                <div className="bg-white dark:bg-surface-dark border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
                    <div className="px-4 py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                                Cambios sin guardar
                            </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleReset}
                                className="h-10 px-3"
                            >
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="h-10 px-5 gap-2 bg-primary hover:bg-primary/90 font-semibold"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Guardar
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop floating bar */}
            <div className={cn(
                "fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 transform hidden lg:block",
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
        </div>
    )
}
