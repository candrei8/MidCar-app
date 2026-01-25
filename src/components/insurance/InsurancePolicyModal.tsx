"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Car,
    Shield,
    Calendar,
    Euro,
    User,
    FileText,
    Upload,
    X
} from "lucide-react"

// Helper para obtener imagen válida (excluye URLs de Azure CDN que no existen)
const getValidImageUrl = (url: string | null | undefined): string => {
    if (!url || url.includes('midcar.azureedge.net')) {
        return '/placeholder-car.svg'
    }
    return url
}

import {
    PolizaSeguro,
    Vehicle,
    INSURANCE_COMPANIES,
    POLICY_TYPES,
    InsurancePolicyType,
    InsuranceCoverages
} from "@/types"
import { defaultCoverages, COVERAGE_LABELS } from "@/lib/mock-insurance"
import { cn } from "@/lib/utils"

interface InsurancePolicyModalProps {
    open: boolean
    onClose: () => void
    vehicle: Vehicle
    existingPolicy?: PolizaSeguro | null
    onSave: (policy: Partial<PolizaSeguro>) => void
}

export function InsurancePolicyModal({
    open,
    onClose,
    vehicle,
    existingPolicy,
    onSave,
}: InsurancePolicyModalProps) {
    const isEditing = !!existingPolicy

    // Form state
    const [companiaAseguradora, setCompaniaAseguradora] = useState(existingPolicy?.companiaAseguradora || '')
    const [numeroPoliza, setNumeroPoliza] = useState(existingPolicy?.numeroPoliza || '')
    const [tipoPoliza, setTipoPoliza] = useState<InsurancePolicyType | ''>(existingPolicy?.tipoPoliza || '')
    const [fechaAlta, setFechaAlta] = useState(existingPolicy?.fechaAlta || '')
    const [fechaVencimiento, setFechaVencimiento] = useState(existingPolicy?.fechaVencimiento || '')
    const [primaAnual, setPrimaAnual] = useState(existingPolicy?.primaAnual?.toString() || '')
    const [franquicia, setFranquicia] = useState(existingPolicy?.franquicia?.toString() || '')
    const [tomadorNombre, setTomadorNombre] = useState(existingPolicy?.tomadorNombre || 'MidCar Concesionario S.L.')
    const [tomadorNif, setTomadorNif] = useState(existingPolicy?.tomadorNif || 'B12345678')
    const [coberturas, setCoberturas] = useState<InsuranceCoverages>(existingPolicy?.coberturas || defaultCoverages)

    // Reset form when modal opens/closes
    useEffect(() => {
        if (open && existingPolicy) {
            setCompaniaAseguradora(existingPolicy.companiaAseguradora)
            setNumeroPoliza(existingPolicy.numeroPoliza)
            setTipoPoliza(existingPolicy.tipoPoliza)
            setFechaAlta(existingPolicy.fechaAlta)
            setFechaVencimiento(existingPolicy.fechaVencimiento)
            setPrimaAnual(existingPolicy.primaAnual.toString())
            setFranquicia(existingPolicy.franquicia?.toString() || '')
            setTomadorNombre(existingPolicy.tomadorNombre)
            setTomadorNif(existingPolicy.tomadorNif)
            setCoberturas(existingPolicy.coberturas)
        } else if (open && !existingPolicy) {
            // Reset to defaults
            setCompaniaAseguradora('')
            setNumeroPoliza('')
            setTipoPoliza('')
            setFechaAlta(new Date().toISOString().split('T')[0])
            setFechaVencimiento('')
            setPrimaAnual('')
            setFranquicia('')
            setTomadorNombre('MidCar Concesionario S.L.')
            setTomadorNif('B12345678')
            setCoberturas(defaultCoverages)
        }
    }, [open, existingPolicy])

    const handleCoverageChange = (key: keyof InsuranceCoverages, checked: boolean) => {
        setCoberturas(prev => ({ ...prev, [key]: checked }))
    }

    const handleSubmit = () => {
        const policy: Partial<PolizaSeguro> = {
            id: existingPolicy?.id || `ins-${Date.now()}`,
            vehiculoId: vehicle.id,
            companiaAseguradora,
            numeroPoliza,
            tipoPoliza: tipoPoliza as InsurancePolicyType,
            fechaAlta,
            fechaVencimiento,
            primaAnual: parseFloat(primaAnual) || 0,
            franquicia: franquicia ? parseFloat(franquicia) : undefined,
            tomadorNombre,
            tomadorNif,
            coberturas,
            documentos: existingPolicy?.documentos || {},
        }
        onSave(policy)
        onClose()
    }

    const isValid = companiaAseguradora && numeroPoliza && tipoPoliza && fechaAlta && fechaVencimiento && tomadorNombre && tomadorNif

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass border-white/[0.06]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-white/90">
                        <Shield className="h-5 w-5 text-primary" />
                        {isEditing ? 'Editar Póliza de Seguro' : 'Nueva Póliza de Seguro'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Vehicle Info (readonly) */}
                    <div className="card-luxury p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-16 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${getValidImageUrl(vehicle.imagen_principal)})` }} />
                            <div>
                                <p className="text-sm font-medium text-white/80">{vehicle.marca} {vehicle.modelo}</p>
                                <div className="flex items-center gap-3 text-xs text-white/40">
                                    <span>Matrícula: <span className="font-mono text-white/60">{vehicle.matricula}</span></span>
                                    <span>VIN: <span className="font-mono text-white/60">{vehicle.vin}</span></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Policy Data */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5" />
                            Datos de la Póliza
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-white/50">Compañía Aseguradora *</Label>
                                <Select value={companiaAseguradora} onValueChange={setCompaniaAseguradora}>
                                    <SelectTrigger className="h-9 text-xs bg-black/40 border-white/[0.06]">
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent className="glass border-white/[0.06]">
                                        {INSURANCE_COMPANIES.map(company => (
                                            <SelectItem key={company} value={company} className="text-xs">
                                                {company}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-white/50">Número de Póliza *</Label>
                                <Input
                                    value={numeroPoliza}
                                    onChange={(e) => setNumeroPoliza(e.target.value)}
                                    placeholder="POL-2024-XXXXXX"
                                    className="h-9 text-xs bg-black/40 border-white/[0.06]"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-white/50">Tipo de Póliza *</Label>
                                <Select value={tipoPoliza} onValueChange={(v) => setTipoPoliza(v as InsurancePolicyType)}>
                                    <SelectTrigger className="h-9 text-xs bg-black/40 border-white/[0.06]">
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent className="glass border-white/[0.06]">
                                        {POLICY_TYPES.map(type => (
                                            <SelectItem key={type.value} value={type.value} className="text-xs">
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-white/50">Prima Anual (€)</Label>
                                <Input
                                    type="number"
                                    value={primaAnual}
                                    onChange={(e) => setPrimaAnual(e.target.value)}
                                    placeholder="0.00"
                                    className="h-9 text-xs bg-black/40 border-white/[0.06]"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-white/50">Fecha Alta Póliza *</Label>
                                <Input
                                    type="date"
                                    value={fechaAlta}
                                    onChange={(e) => setFechaAlta(e.target.value)}
                                    className="h-9 text-xs bg-black/40 border-white/[0.06]"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-white/50">Fecha Vencimiento *</Label>
                                <Input
                                    type="date"
                                    value={fechaVencimiento}
                                    onChange={(e) => setFechaVencimiento(e.target.value)}
                                    className="h-9 text-xs bg-black/40 border-white/[0.06]"
                                />
                            </div>

                            {tipoPoliza?.includes('franquicia') && (
                                <div className="space-y-2">
                                    <Label className="text-xs text-white/50">Franquicia (€)</Label>
                                    <Input
                                        type="number"
                                        value={franquicia}
                                        onChange={(e) => setFranquicia(e.target.value)}
                                        placeholder="0.00"
                                        className="h-9 text-xs bg-black/40 border-white/[0.06]"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Policy Holder */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 flex items-center gap-2">
                            <User className="h-3.5 w-3.5" />
                            Tomador del Seguro
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-white/50">Nombre/Razón Social *</Label>
                                <Input
                                    value={tomadorNombre}
                                    onChange={(e) => setTomadorNombre(e.target.value)}
                                    className="h-9 text-xs bg-black/40 border-white/[0.06]"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-white/50">NIF/CIF *</Label>
                                <Input
                                    value={tomadorNif}
                                    onChange={(e) => setTomadorNif(e.target.value)}
                                    placeholder="B12345678"
                                    className="h-9 text-xs bg-black/40 border-white/[0.06]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Coverages */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 flex items-center gap-2">
                            <Shield className="h-3.5 w-3.5" />
                            Coberturas Incluidas
                        </h3>

                        <div className="grid grid-cols-2 gap-3">
                            {Object.entries(COVERAGE_LABELS).map(([key, label]) => (
                                <div key={key} className="flex items-center gap-2">
                                    <Checkbox
                                        id={key}
                                        checked={coberturas[key as keyof InsuranceCoverages]}
                                        onCheckedChange={(checked) => handleCoverageChange(key as keyof InsuranceCoverages, !!checked)}
                                        className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                    />
                                    <Label htmlFor={key} className="text-xs text-white/60 cursor-pointer">
                                        {label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Documents Upload (UI only) */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 flex items-center gap-2">
                            <Upload className="h-3.5 w-3.5" />
                            Documentación
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="border border-dashed border-white/10 rounded-lg p-4 text-center cursor-pointer hover:border-white/20 transition-colors">
                                <Upload className="h-6 w-6 mx-auto text-white/30 mb-2" />
                                <p className="text-xs text-white/40">Subir Póliza (PDF)</p>
                            </div>
                            <div className="border border-dashed border-white/10 rounded-lg p-4 text-center cursor-pointer hover:border-white/20 transition-colors">
                                <Upload className="h-6 w-6 mx-auto text-white/30 mb-2" />
                                <p className="text-xs text-white/40">Subir Recibo (PDF)</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t border-white/[0.04]">
                    <Button variant="ghost" onClick={onClose} className="text-xs text-white/50 hover:text-white/70">
                        Cancelar
                    </Button>
                    <button
                        onClick={() => handleSubmit()}
                        disabled={!isValid}
                        className="btn-ghost-luxury text-xs disabled:opacity-40"
                    >
                        Guardar Borrador
                    </button>
                    <button
                        onClick={() => handleSubmit()}
                        disabled={!isValid}
                        className="btn-luxury text-xs disabled:opacity-40"
                    >
                        Activar Póliza
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
