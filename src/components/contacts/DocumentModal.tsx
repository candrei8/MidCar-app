"use client"

import { useState, useMemo } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    FileText,
    Bookmark,
    FileSignature,
    Receipt,
    Download,
    Send,
    Plus,
    Trash2,
    Car
} from "lucide-react"

// Helper para obtener imagen válida (excluye URLs de Azure CDN que no existen)
const getValidImageUrl = (url: string | null | undefined): string => {
    if (!url || url.includes('midcar.azureedge.net')) {
        return '/placeholder-car.svg'
    }
    return url
}
import { cn, formatCurrency } from "@/lib/utils"
import type { Contact, Vehicle } from "@/types"
import { useFilteredData } from "@/hooks/useFilteredData"
import { useToast } from "@/components/ui/toast"

type DocumentType = 'proforma' | 'senal' | 'contrato' | 'factura'

interface DocumentModalProps {
    open: boolean
    onClose: () => void
    type: DocumentType
    contact: Contact
    vehicle?: Vehicle | null
    onGenerate: (data: any) => void
}

const DOCUMENT_CONFIG = {
    proforma: {
        title: 'Generar Proforma',
        icon: FileText,
        numberPrefix: 'PRO',
        buttonLabel: 'Generar PDF',
    },
    senal: {
        title: 'Registrar Señal',
        icon: Bookmark,
        numberPrefix: 'SEN',
        buttonLabel: 'Registrar Señal',
    },
    contrato: {
        title: 'Generar Contrato',
        icon: FileSignature,
        numberPrefix: 'CON',
        buttonLabel: 'Generar PDF',
    },
    factura: {
        title: 'Generar Factura',
        icon: Receipt,
        numberPrefix: 'FAC',
        buttonLabel: 'Generar PDF',
    },
}

interface LineItem {
    id: string
    concepto: string
    cantidad: number
    precio: number
}

export function DocumentModal({
    open,
    onClose,
    type,
    contact,
    vehicle: initialVehicle,
    onGenerate
}: DocumentModalProps) {
    const { addToast } = useToast()
    const { vehicles: allVehicles } = useFilteredData()
    const config = DOCUMENT_CONFIG[type]
    const Icon = config.icon

    const [vehicleId, setVehicleId] = useState(initialVehicle?.id || '')
    const [notas, setNotas] = useState('')
    const [lineItems, setLineItems] = useState<LineItem[]>([])

    // For señal
    const [importeSenal, setImporteSenal] = useState('500')
    const [metodoPago, setMetodoPago] = useState('tarjeta')
    const [plazoReserva, setPlazoReserva] = useState('7')

    // For factura
    const [estadoPago, setEstadoPago] = useState('pendiente')

    const vehicle = useMemo(() => {
        return allVehicles.find(v => v.id === vehicleId) || initialVehicle
    }, [vehicleId, initialVehicle, allVehicles])

    const documentNumber = useMemo(() => {
        const year = new Date().getFullYear()
        const num = Math.floor(Math.random() * 1000).toString().padStart(4, '0')
        return `${config.numberPrefix}-${year}-${num}`
    }, [config.numberPrefix])

    // Calculate totals
    const precioVehiculo = vehicle?.precio_venta || 0
    const descuento = vehicle?.descuento || 0
    const baseImponible = precioVehiculo - descuento + lineItems.reduce((acc, item) => acc + (item.cantidad * item.precio), 0)
    const iva = baseImponible * 0.21
    const total = baseImponible + iva

    const addLineItem = () => {
        setLineItems([
            ...lineItems,
            { id: `item-${Date.now()}`, concepto: '', cantidad: 1, precio: 0 }
        ])
    }

    const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
        setLineItems(lineItems.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ))
    }

    const removeLineItem = (id: string) => {
        setLineItems(lineItems.filter(item => item.id !== id))
    }

    const handleGenerate = () => {
        const data = {
            tipo: type,
            numero: documentNumber,
            fecha: new Date().toISOString(),
            contacto: contact,
            vehiculo: vehicle,
            lineItems,
            totales: { baseImponible, iva, total },
            notas,
            ...(type === 'senal' && { importeSenal: parseFloat(importeSenal), metodoPago, plazoReserva: parseInt(plazoReserva) }),
            ...(type === 'factura' && { estadoPago }),
        }

        onGenerate(data)
        addToast(`${config.title.replace('Generar ', '')} generado: ${documentNumber}`, 'success')
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden glass border-white/[0.06] p-0">
                <DialogHeader className="p-6 pb-4 border-b border-white/[0.04]">
                    <DialogTitle className="flex items-center gap-2 text-white/90">
                        <Icon className="h-5 w-5 text-primary" />
                        {config.title}
                    </DialogTitle>
                    <p className="text-xs text-white/40 mt-1">
                        Nº {documentNumber} • {new Date().toLocaleDateString('es-ES')}
                    </p>
                </DialogHeader>

                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    {/* Cliente */}
                    <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Datos del Cliente</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-white/40 text-xs">Nombre:</span>
                                <p className="text-white/80">{contact.nombre} {contact.apellidos}</p>
                            </div>
                            <div>
                                <span className="text-white/40 text-xs">NIF/NIE:</span>
                                <p className="text-white/80">{(contact as any).dni || 'No especificado'}</p>
                            </div>
                            <div>
                                <span className="text-white/40 text-xs">Email:</span>
                                <p className="text-white/80">{contact.email}</p>
                            </div>
                            <div>
                                <span className="text-white/40 text-xs">Teléfono:</span>
                                <p className="text-white/80">{contact.telefono}</p>
                            </div>
                        </div>
                    </div>

                    {/* Vehículo */}
                    <div className="space-y-2">
                        <Label className="text-xs text-white/50">Vehículo</Label>
                        <Select value={vehicleId} onValueChange={setVehicleId}>
                            <SelectTrigger className="bg-white/[0.02] border-white/[0.06] text-white/80">
                                <SelectValue placeholder="Seleccionar vehículo" />
                            </SelectTrigger>
                            <SelectContent className="glass border-white/[0.06] max-h-[200px]">
                                {allVehicles.filter(v => v.estado !== 'vendido').map(v => (
                                    <SelectItem key={v.id} value={v.id}>
                                        <div className="flex items-center gap-2">
                                            <Car className="h-3.5 w-3.5 text-white/40" />
                                            {v.marca} {v.modelo} - {v.matricula}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {vehicle && (
                            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-3">
                                <div
                                    className="w-16 h-12 rounded bg-cover bg-center flex-shrink-0"
                                    style={{ backgroundImage: `url(${getValidImageUrl(vehicle.imagen_principal)})` }}
                                />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-white/80">{vehicle.marca} {vehicle.modelo}</p>
                                    <p className="text-xs text-white/40">{vehicle.version} • {vehicle.matricula}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-primary">{formatCurrency(vehicle.precio_venta - vehicle.descuento)}</p>
                                    {vehicle.descuento > 0 && (
                                        <p className="text-xs text-white/40 line-through">{formatCurrency(vehicle.precio_venta)}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tipo-specific fields */}
                    {type === 'senal' && (
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-white/50">Importe señal *</Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        value={importeSenal}
                                        onChange={(e) => setImporteSenal(e.target.value)}
                                        className="pr-8 bg-white/[0.02] border-white/[0.06] text-white/80"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">€</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-white/50">Método pago</Label>
                                <Select value={metodoPago} onValueChange={setMetodoPago}>
                                    <SelectTrigger className="bg-white/[0.02] border-white/[0.06] text-white/80">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="glass border-white/[0.06]">
                                        <SelectItem value="efectivo">Efectivo</SelectItem>
                                        <SelectItem value="tarjeta">Tarjeta</SelectItem>
                                        <SelectItem value="transferencia">Transferencia</SelectItem>
                                        <SelectItem value="bizum">Bizum</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-white/50">Plazo reserva</Label>
                                <Select value={plazoReserva} onValueChange={setPlazoReserva}>
                                    <SelectTrigger className="bg-white/[0.02] border-white/[0.06] text-white/80">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="glass border-white/[0.06]">
                                        <SelectItem value="3">3 días</SelectItem>
                                        <SelectItem value="7">7 días</SelectItem>
                                        <SelectItem value="15">15 días</SelectItem>
                                        <SelectItem value="30">30 días</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {/* Line Items (proforma, contrato, factura) */}
                    {type !== 'senal' && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs text-white/50">Conceptos adicionales</Label>
                                <button onClick={addLineItem} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
                                    <Plus className="h-3 w-3" />
                                    Añadir concepto
                                </button>
                            </div>

                            {lineItems.map(item => (
                                <div key={item.id} className="flex gap-2 items-start">
                                    <Input
                                        value={item.concepto}
                                        onChange={(e) => updateLineItem(item.id, 'concepto', e.target.value)}
                                        placeholder="Concepto"
                                        className="flex-1 h-8 text-xs bg-white/[0.02] border-white/[0.06] text-white/80"
                                    />
                                    <Input
                                        type="number"
                                        value={item.cantidad}
                                        onChange={(e) => updateLineItem(item.id, 'cantidad', parseInt(e.target.value) || 1)}
                                        className="w-16 h-8 text-xs bg-white/[0.02] border-white/[0.06] text-white/80"
                                    />
                                    <Input
                                        type="number"
                                        value={item.precio}
                                        onChange={(e) => updateLineItem(item.id, 'precio', parseFloat(e.target.value) || 0)}
                                        placeholder="€"
                                        className="w-24 h-8 text-xs bg-white/[0.02] border-white/[0.06] text-white/80"
                                    />
                                    <button onClick={() => removeLineItem(item.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Totales */}
                    <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-white/50">
                                <span>Precio vehículo</span>
                                <span>{formatCurrency(precioVehiculo - descuento)}</span>
                            </div>
                            {lineItems.map(item => (
                                <div key={item.id} className="flex justify-between text-white/50">
                                    <span>{item.concepto || 'Concepto'}</span>
                                    <span>{formatCurrency(item.cantidad * item.precio)}</span>
                                </div>
                            ))}
                            <div className="border-t border-white/[0.06] pt-2 flex justify-between text-white/60">
                                <span>Base imponible</span>
                                <span>{formatCurrency(baseImponible)}</span>
                            </div>
                            <div className="flex justify-between text-white/50">
                                <span>IVA (21%)</span>
                                <span>{formatCurrency(iva)}</span>
                            </div>
                            <div className="border-t border-white/[0.06] pt-2 flex justify-between text-lg font-bold text-white">
                                <span>TOTAL</span>
                                <span className="text-primary">{formatCurrency(total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Estado pago (factura) */}
                    {type === 'factura' && (
                        <div className="space-y-2">
                            <Label className="text-xs text-white/50">Estado del pago</Label>
                            <div className="flex gap-2">
                                {['pendiente', 'pagada', 'parcial'].map(estado => (
                                    <button
                                        key={estado}
                                        onClick={() => setEstadoPago(estado)}
                                        className={cn(
                                            "flex-1 py-2 rounded-lg border text-xs font-medium transition-all capitalize",
                                            estadoPago === estado
                                                ? "border-primary bg-primary/10 text-primary"
                                                : "border-white/[0.06] bg-white/[0.02] text-white/50 hover:bg-white/[0.04]"
                                        )}
                                    >
                                        {estado === 'parcial' ? 'Parcialmente pagada' : estado}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notas */}
                    <div className="space-y-2">
                        <Label className="text-xs text-white/50">Notas / Observaciones</Label>
                        <Textarea
                            value={notas}
                            onChange={(e) => setNotas(e.target.value)}
                            placeholder="Observaciones adicionales..."
                            className="min-h-[60px] bg-white/[0.02] border-white/[0.06] text-white/80 placeholder:text-white/20"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/[0.04] flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} className="text-xs">
                        Cancelar
                    </Button>
                    <button onClick={handleGenerate} className="btn-luxury text-xs flex items-center gap-2">
                        <Download className="h-3.5 w-3.5" />
                        {config.buttonLabel}
                    </button>
                    {(type === 'proforma' || type === 'factura') && (
                        <button className="btn-ghost-luxury text-xs flex items-center gap-2">
                            <Send className="h-3.5 w-3.5" />
                            Enviar por email
                        </button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
