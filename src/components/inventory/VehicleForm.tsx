"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { PhotoUploader, UploadedFile } from "@/components/inventory/PhotoUploader";
import { DocumentUploader, UploadedDocument } from "@/components/inventory/DocumentUploader";
import {
    Car,
    Settings,
    DollarSign,
    Upload,
    Check,
    AlertCircle,
    FileText,
    Save,
} from "lucide-react"
import { MARCAS, COMBUSTIBLES, TRANSMISIONES, CARROCERIAS, ETIQUETAS_DGT, TIPOS_DOCUMENTO_VEHICULO, EQUIPAMIENTO_VEHICULO } from "@/lib/constants"
import { formatCurrency } from "@/lib/utils"

export interface VehicleFormData {
    // Step 1: Basic Data
    marca: string
    modelo: string
    version: string
    matricula: string
    vin: string
    año_matriculacion: string
    año_fabricacion: string
    kilometraje: string
    combustible: string
    transmision: string
    estado: string

    // Step 2: Specifications
    tipo_carroceria: string
    num_puertas: string
    num_plazas: string
    potencia_cv: string
    cilindrada: string
    etiqueta_dgt: string
    color_exterior: string
    color_interior: string
    num_propietarios: string
    primera_mano: boolean
    es_nacional: boolean

    // Step 3: Pricing
    precio_compra: string
    gastos_compra: string
    coste_reparaciones: string
    precio_venta: string
    descuento: string
    garantia_meses: string

    // Step 4: Images & Description
    descripcion: string
    destacado: boolean
    en_oferta: boolean
    fotos: UploadedFile[]
    foto_principal: string | null

    // Step 5: Documents
    documentos: UploadedDocument[]

    // Equipment (array of equipment IDs)
    equipamiento: string[]
}

export const initialFormData: VehicleFormData = {
    marca: "",
    modelo: "",
    version: "",
    matricula: "",
    vin: "",
    año_matriculacion: "",
    año_fabricacion: "",
    kilometraje: "",
    combustible: "",
    transmision: "",
    estado: "disponible",

    tipo_carroceria: "",
    num_puertas: "5",
    num_plazas: "5",
    potencia_cv: "",
    cilindrada: "",
    etiqueta_dgt: "",
    color_exterior: "",
    color_interior: "",
    num_propietarios: "1",
    primera_mano: true,
    es_nacional: true,

    precio_compra: "",
    gastos_compra: "0",
    coste_reparaciones: "0",
    precio_venta: "",
    descuento: "0",
    garantia_meses: "12",

    descripcion: "",
    destacado: false,
    en_oferta: false,
    fotos: [],
    foto_principal: null,

    documentos: [],

    equipamiento: [],
}

interface VehicleFormProps {
    initialData?: Partial<VehicleFormData>
    onSubmit: (data: VehicleFormData) => void
    isSubmitting?: boolean
    onCancel?: () => void
}

export function VehicleForm({ initialData, onSubmit, isSubmitting = false, onCancel }: VehicleFormProps) {
    const [step, setStep] = useState(1)
    const [formData, setFormData] = useState<VehicleFormData>(initialFormData)
    const [errors, setErrors] = useState<Partial<Record<keyof VehicleFormData, string>>>({})

    const totalSteps = 5

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }))
        }
    }, [initialData])

    const updateField = (field: keyof VehicleFormData, value: string | boolean | UploadedFile[] | UploadedDocument[] | string[] | null) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        // Clear error when field is updated
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }))
        }
    }

    // Toggle equipment item
    const toggleEquipment = (equipmentId: string) => {
        setFormData(prev => {
            const current = prev.equipamiento || []
            if (current.includes(equipmentId)) {
                return { ...prev, equipamiento: current.filter(id => id !== equipmentId) }
            } else {
                return { ...prev, equipamiento: [...current, equipmentId] }
            }
        })
    }

    // Calculate margins
    const financials = useMemo(() => {
        const precioCompra = parseFloat(formData.precio_compra) || 0
        const gastos = parseFloat(formData.gastos_compra) || 0
        const reparaciones = parseFloat(formData.coste_reparaciones) || 0
        const precioVenta = parseFloat(formData.precio_venta) || 0
        const descuento = parseFloat(formData.descuento) || 0

        const precioFinal = precioVenta - descuento
        const costeTotal = precioCompra + gastos + reparaciones
        const margen = precioFinal - costeTotal
        const margenPorcentaje = precioFinal > 0 ? (margen / precioFinal) * 100 : 0

        return { costeTotal, precioFinal, margen, margenPorcentaje }
    }, [formData.precio_compra, formData.gastos_compra, formData.coste_reparaciones, formData.precio_venta, formData.descuento])

    const validateStep = (stepNum: number): boolean => {
        const newErrors: Partial<Record<keyof VehicleFormData, string>> = {}

        if (stepNum === 1) {
            if (!formData.marca) newErrors.marca = "La marca es obligatoria"
            if (!formData.modelo) newErrors.modelo = "El modelo es obligatorio"
            if (!formData.matricula) newErrors.matricula = "La matrícula es obligatoria"
            if (!formData.año_matriculacion) newErrors.año_matriculacion = "El año es obligatorio"
            if (!formData.kilometraje) newErrors.kilometraje = "Los kilómetros son obligatorios"
            if (!formData.combustible) newErrors.combustible = "El combustible es obligatorio"
            if (!formData.transmision) newErrors.transmision = "La transmisión es obligatoria"
        }

        if (stepNum === 3) {
            if (!formData.precio_compra) newErrors.precio_compra = "El precio de compra es obligatorio"
            if (!formData.precio_venta) newErrors.precio_venta = "El precio de venta es obligatorio"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleNext = () => {
        if (validateStep(step)) {
            setStep(prev => Math.min(prev + 1, totalSteps))
        }
    }

    const handleBack = () => {
        setStep(prev => Math.max(prev - 1, 1))
    }

    const handleSubmit = () => {
        // Validate all steps
        let hasErrors = false
        for (let i = 1; i <= totalSteps; i++) {
            if (!validateStep(i)) {
                hasErrors = true
                setStep(i) // Go to the first step with errors
                break
            }
        }

        if (hasErrors) return

        onSubmit(formData)
    }

    const getStepStatus = (stepNum: number) => {
        if (step > stepNum) return 'completed'
        if (step === stepNum) return 'current'
        return 'pending'
    }

    return (
        <div className="space-y-6 animate-in">
            {/* Progress Steps - Mobile Optimized */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between overflow-x-auto no-scrollbar gap-1">
                    {[
                        { num: 1, label: 'Datos', icon: Car },
                        { num: 2, label: 'Specs', icon: Settings },
                        { num: 3, label: 'Precio', icon: DollarSign },
                        { num: 4, label: 'Fotos', icon: Upload },
                        { num: 5, label: 'Docs', icon: FileText },
                    ].map((s, index) => {
                        const status = getStepStatus(s.num)
                        return (
                            <div key={s.num} className="flex items-center flex-1 min-w-0">
                                <button
                                    onClick={() => setStep(s.num)}
                                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all w-full min-w-[50px] ${status === 'current'
                                        ? 'bg-[#135bec] text-white shadow-lg shadow-blue-500/30'
                                        : status === 'completed'
                                            ? 'bg-green-50 text-green-600 border border-green-200'
                                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                        }`}
                                >
                                    {status === 'completed' ? (
                                        <Check className="h-5 w-5" />
                                    ) : (
                                        <s.icon className="h-5 w-5" />
                                    )}
                                    <span className="text-[10px] font-semibold leading-none truncate w-full text-center">
                                        {s.label}
                                    </span>
                                </button>
                                {index < 4 && (
                                    <div className={`w-3 h-0.5 mx-0.5 flex-shrink-0 ${status === 'completed' ? 'bg-green-400' : 'bg-slate-200'}`} />
                                )}
                            </div>
                        )
                    })}
                </div>
                {/* Step counter for mobile */}
                <div className="mt-2 text-center">
                    <span className="text-xs font-medium text-slate-500">
                        Paso {step} de {totalSteps}
                    </span>
                </div>
            </div>


            {/* Step 1: Basic Data */}
            {step === 1 && (
                <Card className="card-premium">
                    <CardHeader>
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <Car className="h-4 w-4 text-primary" />
                            Datos Básicos del Vehículo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="marca">Marca <span className="text-destructive">*</span></Label>
                                <Select value={formData.marca} onValueChange={(v) => updateField('marca', v)}>
                                    <SelectTrigger className={errors.marca ? "border-destructive" : ""}>
                                        <SelectValue placeholder="Seleccionar marca" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MARCAS.map(marca => (
                                            <SelectItem key={marca} value={marca}>{marca}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.marca && <p className="text-xs text-destructive">{errors.marca}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="modelo">Modelo <span className="text-destructive">*</span></Label>
                                <Input
                                    id="modelo"
                                    placeholder="Ej: Serie 3"
                                    value={formData.modelo}
                                    onChange={(e) => updateField('modelo', e.target.value)}
                                    className={errors.modelo ? "border-destructive" : ""}
                                />
                                {errors.modelo && <p className="text-xs text-destructive">{errors.modelo}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="version">Versión</Label>
                                <Input
                                    id="version"
                                    placeholder="Ej: 320d xDrive M Sport"
                                    value={formData.version}
                                    onChange={(e) => updateField('version', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="matricula">Matrícula <span className="text-destructive">*</span></Label>
                                <Input
                                    id="matricula"
                                    placeholder="Ej: 1234 ABC"
                                    value={formData.matricula}
                                    onChange={(e) => updateField('matricula', e.target.value.toUpperCase())}
                                    className={errors.matricula ? "border-destructive" : ""}
                                />
                                {errors.matricula && <p className="text-xs text-destructive">{errors.matricula}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vin">VIN</Label>
                                <Input
                                    id="vin"
                                    placeholder="17 caracteres"
                                    maxLength={17}
                                    value={formData.vin}
                                    onChange={(e) => updateField('vin', e.target.value.toUpperCase())}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="año">Año Matriculación <span className="text-destructive">*</span></Label>
                                <Input
                                    id="año"
                                    type="number"
                                    min="1990"
                                    max="2025"
                                    placeholder="2023"
                                    value={formData.año_matriculacion}
                                    onChange={(e) => updateField('año_matriculacion', e.target.value)}
                                    className={errors.año_matriculacion ? "border-destructive" : ""}
                                />
                                {errors.año_matriculacion && <p className="text-xs text-destructive">{errors.año_matriculacion}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="km">Kilómetros <span className="text-destructive">*</span></Label>
                                <Input
                                    id="km"
                                    type="number"
                                    min="0"
                                    placeholder="50000"
                                    value={formData.kilometraje}
                                    onChange={(e) => updateField('kilometraje', e.target.value)}
                                    className={errors.kilometraje ? "border-destructive" : ""}
                                />
                                {errors.kilometraje && <p className="text-xs text-destructive">{errors.kilometraje}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="combustible">Combustible <span className="text-destructive">*</span></Label>
                                <Select value={formData.combustible} onValueChange={(v) => updateField('combustible', v)}>
                                    <SelectTrigger className={errors.combustible ? "border-destructive" : ""}>
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {COMBUSTIBLES.map(c => (
                                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.combustible && <p className="text-xs text-destructive">{errors.combustible}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="transmision">Transmisión <span className="text-destructive">*</span></Label>
                                <Select value={formData.transmision} onValueChange={(v) => updateField('transmision', v)}>
                                    <SelectTrigger className={errors.transmision ? "border-destructive" : ""}>
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TRANSMISIONES.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.transmision && <p className="text-xs text-destructive">{errors.transmision}</p>}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button onClick={handleNext}>
                                Siguiente
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 2: Specifications */}
            {step === 2 && (
                <Card className="card-premium">
                    <CardHeader>
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <Settings className="h-4 w-4 text-primary" />
                            Especificaciones Técnicas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="carroceria">Tipo Carrocería</Label>
                                <Select value={formData.tipo_carroceria} onValueChange={(v) => updateField('tipo_carroceria', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CARROCERIAS.map(c => (
                                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="puertas">Nº Puertas</Label>
                                <Select value={formData.num_puertas} onValueChange={(v) => updateField('num_puertas', v)}>
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
                                <Label htmlFor="plazas">Nº Plazas</Label>
                                <Select value={formData.num_plazas} onValueChange={(v) => updateField('num_plazas', v)}>
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
                                <Label htmlFor="potencia">Potencia (CV)</Label>
                                <Input
                                    id="potencia"
                                    type="number"
                                    placeholder="150"
                                    value={formData.potencia_cv}
                                    onChange={(e) => updateField('potencia_cv', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cilindrada">Cilindrada (cc)</Label>
                                <Input
                                    id="cilindrada"
                                    type="number"
                                    placeholder="1995"
                                    value={formData.cilindrada}
                                    onChange={(e) => updateField('cilindrada', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="etiqueta">Etiqueta DGT</Label>
                                <Select value={formData.etiqueta_dgt} onValueChange={(v) => updateField('etiqueta_dgt', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ETIQUETAS_DGT.map(e => (
                                            <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="colorExterior">Color Exterior</Label>
                                <Input
                                    id="colorExterior"
                                    placeholder="Negro Metalizado"
                                    value={formData.color_exterior}
                                    onChange={(e) => updateField('color_exterior', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="colorInterior">Color Interior</Label>
                                <Input
                                    id="colorInterior"
                                    placeholder="Cuero Negro"
                                    value={formData.color_interior}
                                    onChange={(e) => updateField('color_interior', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="propietarios">Nº Propietarios</Label>
                                <Input
                                    id="propietarios"
                                    type="number"
                                    min="1"
                                    placeholder="1"
                                    value={formData.num_propietarios}
                                    onChange={(e) => updateField('num_propietarios', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-6">
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

                        {/* Equipment Section */}
                        <div className="space-y-4 pt-4 border-t border-card-border">
                            <h4 className="font-medium text-foreground">Equipamiento del Vehículo</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                                {Object.entries(EQUIPAMIENTO_VEHICULO).map(([categoryKey, category]) => (
                                    <div key={categoryKey} className="space-y-3">
                                        <h5 className="text-sm font-medium text-primary">{category.label}</h5>
                                        <div className="space-y-2">
                                            {category.items.map((item) => (
                                                <div key={item.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={item.id}
                                                        checked={(formData.equipamiento || []).includes(item.id)}
                                                        onCheckedChange={() => toggleEquipment(item.id)}
                                                    />
                                                    <Label htmlFor={item.id} className="text-xs cursor-pointer">{item.label}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {(formData.equipamiento || []).length} elementos seleccionados
                            </p>
                        </div>

                        <div className="flex justify-between">
                            <Button variant="outline" onClick={handleBack}>
                                Anterior
                            </Button>
                            <Button onClick={handleNext}>
                                Siguiente
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 3: Pricing */}
            {step === 3 && (
                <Card className="card-premium">
                    <CardHeader>
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-primary" />
                            Precios y Costes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="precioCompra">Precio de Compra <span className="text-destructive">*</span></Label>
                                <Input
                                    id="precioCompra"
                                    type="number"
                                    placeholder="20000"
                                    value={formData.precio_compra}
                                    onChange={(e) => updateField('precio_compra', e.target.value)}
                                    className={errors.precio_compra ? "border-destructive" : ""}
                                />
                                {errors.precio_compra && <p className="text-xs text-destructive">{errors.precio_compra}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gastosCompra">Gastos de Compra</Label>
                                <Input
                                    id="gastosCompra"
                                    type="number"
                                    placeholder="500"
                                    value={formData.gastos_compra}
                                    onChange={(e) => updateField('gastos_compra', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="costeReparaciones">Coste Reparaciones</Label>
                                <Input
                                    id="costeReparaciones"
                                    type="number"
                                    placeholder="0"
                                    value={formData.coste_reparaciones}
                                    onChange={(e) => updateField('coste_reparaciones', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="precioVenta">Precio de Venta <span className="text-destructive">*</span></Label>
                                <Input
                                    id="precioVenta"
                                    type="number"
                                    placeholder="25000"
                                    value={formData.precio_venta}
                                    onChange={(e) => updateField('precio_venta', e.target.value)}
                                    className={errors.precio_venta ? "border-destructive" : ""}
                                />
                                {errors.precio_venta && <p className="text-xs text-destructive">{errors.precio_venta}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="descuento">Descuento</Label>
                                <Input
                                    id="descuento"
                                    type="number"
                                    placeholder="0"
                                    value={formData.descuento}
                                    onChange={(e) => updateField('descuento', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="garantia">Garantía (meses)</Label>
                                <Select value={formData.garantia_meses} onValueChange={(v) => updateField('garantia_meses', v)}>
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
                        <div className="p-4 bg-surface-100 rounded-lg space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Precio compra + gastos + reparaciones</span>
                                <span>{formatCurrency(financials.costeTotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Precio venta final</span>
                                <span>{formatCurrency(financials.precioFinal)}</span>
                            </div>
                            <div className="flex justify-between font-semibold pt-2 border-t border-card-border">
                                <span>Margen bruto estimado</span>
                                <span className={financials.margen >= 0 ? "text-success" : "text-danger"}>
                                    {formatCurrency(financials.margen)} ({financials.margenPorcentaje.toFixed(1)}%)
                                </span>
                            </div>
                            {financials.margen < 0 && (
                                <div className="flex items-center gap-2 text-xs text-danger">
                                    <AlertCircle className="h-4 w-4" />
                                    El precio de venta es inferior al coste total
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between">
                            <Button variant="outline" onClick={handleBack}>
                                Anterior
                            </Button>
                            <Button onClick={handleNext}>
                                Siguiente
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 4: Images */}
            {step === 4 && (
                <Card className="card-premium">
                    <CardHeader>
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <Upload className="h-4 w-4 text-primary" />
                            Imágenes y Descripción
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <PhotoUploader
                            onFilesChange={(files) => updateField('fotos', files)}
                            onPrincipalChange={(id) => updateField('foto_principal', id)}
                        />

                        <div className="space-y-2">
                            <Label htmlFor="descripcion">Descripción (web)</Label>
                            <Textarea
                                id="descripcion"
                                placeholder="Descripción del vehículo para la web..."
                                className="min-h-[100px]"
                                value={formData.descripcion}
                                onChange={(e) => updateField('descripcion', e.target.value)}
                            />
                        </div>

                        <div className="flex gap-6">
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

                        <div className="flex justify-between">
                            <Button variant="outline" onClick={handleBack}>
                                Anterior
                            </Button>
                            <Button onClick={handleNext}>
                                Siguiente
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 5: Documents */}
            {step === 5 && (
                <Card className="card-premium">
                    <CardHeader>
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            Documentación
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <DocumentUploader
                            onDocumentsChange={(docs) => updateField('documentos', docs)}
                        />

                        <div className="flex justify-between">
                            <Button variant="outline" onClick={handleBack}>
                                Anterior
                            </Button>
                            <Button onClick={handleSubmit} disabled={isSubmitting}>
                                <div className="flex items-center gap-2">
                                    <Save className="h-4 w-4" />
                                    {isSubmitting ? 'Guardando...' : 'Guardar Vehículo'}
                                </div>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
