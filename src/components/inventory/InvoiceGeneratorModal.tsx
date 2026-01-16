"use client"

import { useState, useMemo, useEffect } from "react"
import { formatCurrency } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import type { Vehicle, EmpresaVendedora, TipoDocumentoIdentidad, TipoCliente } from "@/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import jsPDF from "jspdf"
import {
    getEmpresasActivas,
    initDefaultEmpresas,
} from "@/lib/empresas"
import {
    createInvoice,
    generateInvoiceNumber,
    getContracts,
    type ContractDB,
} from "@/lib/supabase-service"
import {
    TIPOS_DOCUMENTO,
    TIPOS_CLIENTE,
    FORMAS_PAGO,
    TIPOS_IVA,
} from "@/lib/constants"

// Format date
const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

interface InvoiceGeneratorModalProps {
    vehicle: Vehicle
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function InvoiceGeneratorModal({ vehicle, open, onOpenChange, onSuccess }: InvoiceGeneratorModalProps) {
    const { user, profile } = useAuth()

    // Empresas
    const [empresas, setEmpresas] = useState<EmpresaVendedora[]>([])
    const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>('')

    // Contratos existentes para este vehículo
    const [contratos, setContratos] = useState<ContractDB[]>([])
    const [selectedContratoId, setSelectedContratoId] = useState<string>('')

    // Datos fiscales del cliente (simplificados)
    const [tipoCliente, setTipoCliente] = useState<TipoCliente>('particular')
    const [tipoDocumento, setTipoDocumento] = useState<TipoDocumentoIdentidad>('DNI')
    const [clienteNombre, setClienteNombre] = useState('')
    const [clienteNif, setClienteNif] = useState('')
    const [clienteDireccion, setClienteDireccion] = useState('')

    // Datos de la factura
    const [fechaFactura, setFechaFactura] = useState(new Date().toISOString().split('T')[0])
    const [fechaVencimiento, setFechaVencimiento] = useState('')
    const [concepto, setConcepto] = useState(`Venta de vehículo ${vehicle.marca} ${vehicle.modelo} - ${vehicle.matricula}`)

    // Importes
    const [baseImponible, setBaseImponible] = useState<number>(vehicle.precio_venta)
    const [descuento, setDescuento] = useState<number>(0)
    const [ivaPorcentaje, setIvaPorcentaje] = useState<number>(21)

    // Pago
    const [formaPago, setFormaPago] = useState('transferencia')
    const [iban, setIban] = useState('')
    const [notas, setNotas] = useState('')

    // Cálculos
    const baseConDescuento = useMemo(() => baseImponible - descuento, [baseImponible, descuento])
    const ivaImporte = useMemo(() => (baseConDescuento * ivaPorcentaje) / 100, [baseConDescuento, ivaPorcentaje])
    const totalFactura = useMemo(() => baseConDescuento + ivaImporte, [baseConDescuento, ivaImporte])

    // Empresa seleccionada
    const empresaSeleccionada = useMemo(() => {
        if (!selectedEmpresaId) return null
        return empresas.find(e => e.id === selectedEmpresaId) || null
    }, [selectedEmpresaId, empresas])

    // Load on mount
    useEffect(() => {
        const loadData = async () => {
            await initDefaultEmpresas()
            const [empList, allContracts] = await Promise.all([
                getEmpresasActivas(),
                getContracts()
            ])
            setEmpresas(empList)
            if (empList.length > 0) {
                setSelectedEmpresaId(empList[0].id)
            }

            // Filtrar contratos del vehículo
            const vehicleContracts = allContracts.filter(c => c.vehiculo_id === vehicle.id)
            setContratos(vehicleContracts)
        }
        loadData()
    }, [vehicle.id])

    // Update when vehicle changes
    useEffect(() => {
        setBaseImponible(vehicle.precio_venta)
        setConcepto(`Venta de vehículo ${vehicle.marca} ${vehicle.modelo} - ${vehicle.matricula}`)
    }, [vehicle])

    // Auto-rellenar desde contrato seleccionado
    useEffect(() => {
        if (!selectedContratoId) return
        const contrato = contratos.find(c => c.id === selectedContratoId)
        if (contrato && contrato.comprador_nombre) {
            setClienteNombre(`${contrato.comprador_nombre} ${contrato.comprador_apellidos || ''}`.trim())
            setClienteNif(contrato.comprador_documento || '')
            setClienteDireccion(
                [contrato.comprador_direccion, contrato.comprador_cp, contrato.comprador_localidad]
                    .filter(Boolean).join(', ')
            )
            setTipoCliente((contrato.comprador_tipo as TipoCliente) || 'particular')
            if (contrato.precio_venta) {
                setBaseImponible(contrato.precio_venta)
            }
        }
    }, [selectedContratoId, contratos])

    // Set default vencimiento (30 días)
    useEffect(() => {
        if (!fechaVencimiento && fechaFactura) {
            const venc = new Date(fechaFactura)
            venc.setDate(venc.getDate() + 30)
            setFechaVencimiento(venc.toISOString().split('T')[0])
        }
    }, [fechaFactura])

    // Validación
    const validateForm = (): boolean => {
        if (!clienteNombre || !clienteNif) {
            alert('Por favor, complete los datos fiscales del cliente (nombre y NIF/CIF)')
            return false
        }
        if (!selectedEmpresaId) {
            alert('Por favor, seleccione una empresa emisora')
            return false
        }
        if (baseImponible <= 0) {
            alert('Por favor, introduzca un importe válido')
            return false
        }
        return true
    }

    // Generar PDF
    const generatePDF = async () => {
        if (!validateForm() || !empresaSeleccionada) return

        try {
            // Generate invoice number from Supabase
            const invoiceNumber = await generateInvoiceNumber()
            const doc = new jsPDF()
            const pageWidth = doc.internal.pageSize.getWidth()
            const margin = 20
            let y = 20

            const addText = (text: string, x: number, yPos: number, options?: any) => {
                doc.text(text, x, yPos, options)
            }

            // ===== CABECERA EMPRESA =====
            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(0)
            addText(empresaSeleccionada.razon_social, margin, y)
            y += 5
            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(80)
            addText(`CIF: ${empresaSeleccionada.cif}`, margin, y)
            y += 4
            addText(`${empresaSeleccionada.direccion}`, margin, y)
            y += 4
            addText(`${empresaSeleccionada.codigo_postal} ${empresaSeleccionada.localidad} (${empresaSeleccionada.provincia})`, margin, y)
            y += 4
            addText(`Tel: ${empresaSeleccionada.telefono} | ${empresaSeleccionada.email}`, margin, y)

            // ===== TÍTULO FACTURA =====
            y += 15
            doc.setFontSize(22)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(19, 91, 236)
            addText('FACTURA', pageWidth - margin, y, { align: 'right' })

            y += 8
            doc.setFontSize(10)
            doc.setTextColor(60)
            doc.setFont('helvetica', 'normal')
            addText(`Nº: ${invoiceNumber}`, pageWidth - margin, y, { align: 'right' })
            y += 5
            addText(`Fecha: ${formatDate(fechaFactura)}`, pageWidth - margin, y, { align: 'right' })
            y += 5
            addText(`Vencimiento: ${formatDate(fechaVencimiento)}`, pageWidth - margin, y, { align: 'right' })

            // ===== LÍNEA SEPARADORA =====
            y += 8
            doc.setDrawColor(200)
            doc.line(margin, y, pageWidth - margin, y)

            // ===== DATOS CLIENTE =====
            y += 10
            doc.setFontSize(9)
            doc.setTextColor(100)
            addText('FACTURAR A:', margin, y)
            y += 6
            doc.setFontSize(11)
            doc.setTextColor(0)
            doc.setFont('helvetica', 'bold')
            addText(clienteNombre, margin, y)
            y += 5
            doc.setFont('helvetica', 'normal')
            addText(`${tipoDocumento}: ${clienteNif}`, margin, y)
            y += 5
            if (clienteDireccion) {
                addText(clienteDireccion, margin, y)
                y += 5
            }

            // ===== DATOS VEHÍCULO =====
            y += 8
            doc.setFontSize(9)
            doc.setTextColor(100)
            addText('DATOS DEL VEHÍCULO:', margin, y)
            y += 6
            doc.setFontSize(10)
            doc.setTextColor(0)
            addText(`${vehicle.marca} ${vehicle.modelo} ${vehicle.version || ''}`, margin, y)
            y += 5
            addText(`Matrícula: ${vehicle.matricula} | Bastidor: ${vehicle.vin}`, margin, y)
            y += 5
            addText(`Km: ${vehicle.kilometraje.toLocaleString('es-ES')} | Año: ${vehicle.año_matriculacion}`, margin, y)

            // ===== LÍNEA SEPARADORA =====
            y += 10
            doc.line(margin, y, pageWidth - margin, y)

            // ===== CONCEPTO =====
            y += 10
            doc.setFillColor(245, 247, 250)
            doc.rect(margin, y - 5, pageWidth - 2 * margin, 10, 'F')
            doc.setFontSize(9)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(60)
            addText('CONCEPTO', margin + 5, y)
            addText('IMPORTE', pageWidth - margin - 5, y, { align: 'right' })

            y += 12
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(10)
            doc.setTextColor(0)
            addText(concepto, margin + 5, y)
            addText(formatCurrency(baseImponible), pageWidth - margin - 5, y, { align: 'right' })

            // Descuento si aplica
            if (descuento > 0) {
                y += 8
                doc.setTextColor(220, 38, 38)
                addText('Descuento', margin + 5, y)
                addText(`-${formatCurrency(descuento)}`, pageWidth - margin - 5, y, { align: 'right' })
            }

            // ===== RESUMEN FISCAL =====
            y += 15
            doc.setDrawColor(220)
            doc.line(pageWidth - 90, y, pageWidth - margin, y)

            y += 8
            doc.setFontSize(10)
            doc.setTextColor(80)
            addText('Base imponible:', pageWidth - 90, y)
            doc.setTextColor(0)
            addText(formatCurrency(baseConDescuento), pageWidth - margin - 5, y, { align: 'right' })

            y += 7
            doc.setTextColor(80)
            addText(`IVA (${ivaPorcentaje}%):`, pageWidth - 90, y)
            doc.setTextColor(0)
            addText(formatCurrency(ivaImporte), pageWidth - margin - 5, y, { align: 'right' })

            y += 3
            doc.line(pageWidth - 90, y, pageWidth - margin, y)

            y += 10
            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            addText('TOTAL:', pageWidth - 90, y)
            doc.setTextColor(19, 91, 236)
            addText(formatCurrency(totalFactura), pageWidth - margin - 5, y, { align: 'right' })

            // ===== FORMA DE PAGO =====
            y += 20
            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(100)
            addText('FORMA DE PAGO:', margin, y)
            y += 5
            doc.setTextColor(0)
            doc.setFontSize(10)
            const formaLabel = FORMAS_PAGO.find(f => f.value === formaPago)?.label || formaPago
            addText(formaLabel, margin, y)

            if (formaPago === 'transferencia' && iban) {
                y += 5
                doc.setFontSize(9)
                doc.setTextColor(80)
                addText(`IBAN: ${iban}`, margin, y)
            }

            // ===== OBSERVACIONES =====
            if (notas) {
                y += 15
                doc.setFontSize(9)
                doc.setTextColor(100)
                addText('OBSERVACIONES:', margin, y)
                y += 5
                doc.setTextColor(60)
                const splitNotas = doc.splitTextToSize(notas, pageWidth - 2 * margin)
                doc.text(splitNotas, margin, y)
            }

            // ===== PIE DE PÁGINA =====
            const footerY = doc.internal.pageSize.getHeight() - 15
            doc.setFontSize(8)
            doc.setTextColor(150)
            addText(`${empresaSeleccionada.razon_social} - CIF: ${empresaSeleccionada.cif}`, pageWidth / 2, footerY, { align: 'center' })

            // Guardar PDF
            doc.save(`Factura_${invoiceNumber}_${vehicle.matricula}.pdf`)

            // Get creator name
            const creatorName = profile ? `${profile.nombre} ${profile.apellidos}`.trim() : user?.email?.split('@')[0] || 'Usuario'

            // Guardar en Supabase (flat structure)
            const invoiceData = {
                numero_factura: invoiceNumber,
                fecha_factura: fechaFactura,
                empresa_id: selectedEmpresaId,
                empresa_nombre: empresaSeleccionada.nombre_comercial,
                empresa_cif: empresaSeleccionada.cif,
                empresa_direccion: `${empresaSeleccionada.direccion}, ${empresaSeleccionada.codigo_postal} ${empresaSeleccionada.localidad}`,
                vehiculo_id: vehicle.id,
                vehiculo_descripcion: `${vehicle.marca} ${vehicle.modelo} - ${vehicle.matricula}`,
                contrato_id: selectedContratoId || undefined,
                cliente_tipo: tipoCliente,
                cliente_nombre: clienteNombre,
                cliente_apellidos: '',
                cliente_documento_tipo: tipoDocumento,
                cliente_documento: clienteNif,
                cliente_direccion: clienteDireccion,
                cliente_cp: '',
                cliente_localidad: '',
                cliente_provincia: '',
                base_imponible: baseImponible,
                descuento: descuento,
                tipo_iva: ivaPorcentaje,
                iva: ivaImporte,
                total: totalFactura,
                forma_pago: formaPago,
                estado: 'pendiente' as const,
                fecha_vencimiento: fechaVencimiento || undefined,
                notas: notas || undefined,
                created_by: user?.id,
                created_by_name: creatorName,
            }

            const savedInvoice = await createInvoice(invoiceData)

            if (savedInvoice) {
                // Notify data update
                window.dispatchEvent(new CustomEvent('midcar-data-updated', { detail: { type: 'invoices' } }))
                alert('Factura generada correctamente')
                onSuccess?.()
                onOpenChange(false)
            } else {
                throw new Error('No se pudo guardar la factura')
            }
        } catch (error) {
            console.error('Error generating invoice:', error)
            alert('Error al guardar la factura en la base de datos')
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                <DialogHeader className="pb-2">
                    <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <span className="material-symbols-outlined text-[#135bec] text-[20px] sm:text-[24px]">receipt_long</span>
                        Generar Factura
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3 sm:space-y-4">
                    {/* Resumen Vehículo */}
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-50 rounded-xl">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-slate-200 overflow-hidden shrink-0">
                            {vehicle.imagen_principal ? (
                                <img
                                    src={vehicle.imagen_principal}
                                    alt={vehicle.marca}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                    <span className="material-symbols-outlined text-slate-400 text-[18px] sm:text-[24px]">directions_car</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 truncate text-sm sm:text-base">
                                {vehicle.marca} {vehicle.modelo}
                            </p>
                            <p className="text-[10px] sm:text-xs text-slate-500 truncate">{vehicle.matricula}</p>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-sm sm:text-lg font-bold text-[#135bec]">
                                {formatCurrency(totalFactura)}
                            </p>
                            <p className="text-[9px] sm:text-[10px] text-slate-400">Total IVA incl.</p>
                        </div>
                    </div>

                    {/* Empresa Emisora */}
                    <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-100">
                        <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#135bec] mb-2 sm:mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[14px] sm:text-[16px]">business</span>
                            Empresa Emisora
                        </h3>
                        <Select value={selectedEmpresaId} onValueChange={setSelectedEmpresaId}>
                            <SelectTrigger className="h-9 sm:h-10 text-sm">
                                <SelectValue placeholder="Seleccionar empresa" />
                            </SelectTrigger>
                            <SelectContent>
                                {empresas.map(emp => (
                                    <SelectItem key={emp.id} value={emp.id}>
                                        {emp.nombre_comercial}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Vincular a Contrato (opcional) */}
                    {contratos.length > 0 && (
                        <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-100">
                            <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#135bec] mb-2 sm:mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[14px] sm:text-[16px]">link</span>
                                Vincular a Contrato
                            </h3>
                            <Select value={selectedContratoId} onValueChange={setSelectedContratoId}>
                                <SelectTrigger className="h-9 sm:h-10 text-sm">
                                    <SelectValue placeholder="Seleccionar contrato..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Sin vincular</SelectItem>
                                    {contratos.map(c => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.numero_contrato} - {c.comprador_nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-1.5 sm:mt-2">
                                Auto-rellena los datos del cliente
                            </p>
                        </div>
                    )}

                    {/* Datos Fiscales del Cliente */}
                    <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-100">
                        <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#135bec] mb-2 sm:mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[14px] sm:text-[16px]">person</span>
                            Datos del Cliente
                        </h3>
                        <div className="space-y-2 sm:space-y-3">
                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                <Select value={tipoCliente} onValueChange={(v) => setTipoCliente(v as TipoCliente)}>
                                    <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TIPOS_CLIENTE.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={tipoDocumento} onValueChange={(v) => setTipoDocumento(v as TipoDocumentoIdentidad)}>
                                    <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TIPOS_DOCUMENTO.map(t => (
                                            <SelectItem key={t.value} value={t.value.toUpperCase()}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Input
                                placeholder="Nombre o Razón Social *"
                                value={clienteNombre}
                                onChange={(e) => setClienteNombre(e.target.value)}
                                className="h-9 sm:h-10 text-sm"
                            />
                            <Input
                                placeholder={`${tipoDocumento} *`}
                                value={clienteNif}
                                onChange={(e) => setClienteNif(e.target.value)}
                                className="h-9 sm:h-10 text-sm"
                            />
                            <Input
                                placeholder="Dirección fiscal"
                                value={clienteDireccion}
                                onChange={(e) => setClienteDireccion(e.target.value)}
                                className="h-9 sm:h-10 text-sm"
                            />
                        </div>
                    </div>

                    {/* Datos Factura */}
                    <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-100">
                        <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#135bec] mb-2 sm:mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[14px] sm:text-[16px]">calendar_month</span>
                            Datos de la Factura
                        </h3>
                        <div className="space-y-2 sm:space-y-3">
                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                <div className="space-y-1">
                                    <Label className="text-[10px] sm:text-xs text-slate-500">Fecha Emisión</Label>
                                    <Input
                                        type="date"
                                        value={fechaFactura}
                                        onChange={(e) => setFechaFactura(e.target.value)}
                                        className="h-9 sm:h-10 text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] sm:text-xs text-slate-500">Vencimiento</Label>
                                    <Input
                                        type="date"
                                        value={fechaVencimiento}
                                        onChange={(e) => setFechaVencimiento(e.target.value)}
                                        className="h-9 sm:h-10 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] sm:text-xs text-slate-500">Concepto</Label>
                                <Input
                                    value={concepto}
                                    onChange={(e) => setConcepto(e.target.value)}
                                    className="h-9 sm:h-10 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Desglose Económico */}
                    <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-100">
                        <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#135bec] mb-2 sm:mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[14px] sm:text-[16px]">euro</span>
                            Desglose Económico
                        </h3>
                        <div className="space-y-2 sm:space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                                <div className="space-y-1">
                                    <Label className="text-[10px] sm:text-xs text-slate-500">Base Imponible</Label>
                                    <Input
                                        type="number"
                                        value={baseImponible || ''}
                                        onChange={(e) => setBaseImponible(parseFloat(e.target.value) || 0)}
                                        className="h-9 sm:h-10 text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] sm:text-xs text-slate-500">Descuento</Label>
                                    <Input
                                        type="number"
                                        value={descuento || ''}
                                        onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                                        className="h-9 sm:h-10 text-sm"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="space-y-1 col-span-2 sm:col-span-1">
                                    <Label className="text-[10px] sm:text-xs text-slate-500">IVA</Label>
                                    <Select
                                        value={String(ivaPorcentaje)}
                                        onValueChange={(v) => setIvaPorcentaje(parseInt(v))}
                                    >
                                        <SelectTrigger className="h-9 sm:h-10 text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TIPOS_IVA.map(t => (
                                                <SelectItem key={t.value} value={String(t.value)}>{t.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="p-2 sm:p-3 bg-slate-50 rounded-lg space-y-1.5 sm:space-y-2">
                                <div className="flex justify-between text-xs sm:text-sm">
                                    <span className="text-slate-600">Base imponible:</span>
                                    <span>{formatCurrency(baseImponible)}</span>
                                </div>
                                {descuento > 0 && (
                                    <div className="flex justify-between text-xs sm:text-sm text-red-600">
                                        <span>Descuento:</span>
                                        <span>-{formatCurrency(descuento)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-xs sm:text-sm">
                                    <span className="text-slate-600">IVA ({ivaPorcentaje}%):</span>
                                    <span>{formatCurrency(ivaImporte)}</span>
                                </div>
                                <div className="border-t pt-1.5 sm:pt-2 flex justify-between font-bold text-sm sm:text-lg">
                                    <span>TOTAL:</span>
                                    <span className="text-[#135bec]">{formatCurrency(totalFactura)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Forma de Pago */}
                    <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-100">
                        <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#135bec] mb-2 sm:mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[14px] sm:text-[16px]">payments</span>
                            Forma de Pago
                        </h3>
                        <div className="space-y-2 sm:space-y-3">
                            <Select value={formaPago} onValueChange={setFormaPago}>
                                <SelectTrigger className="h-9 sm:h-10 text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {FORMAS_PAGO.map(f => (
                                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {formaPago === 'transferencia' && (
                                <div className="space-y-1">
                                    <Label className="text-[10px] sm:text-xs text-slate-500">IBAN</Label>
                                    <Input
                                        placeholder="ES00 0000 0000 0000 0000 0000"
                                        value={iban}
                                        onChange={(e) => setIban(e.target.value)}
                                        className="h-9 sm:h-10 font-mono text-xs sm:text-sm"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Observaciones */}
                    <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-100">
                        <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#135bec] mb-2 sm:mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[14px] sm:text-[16px]">edit_note</span>
                            Observaciones (opcional)
                        </h3>
                        <Textarea
                            value={notas}
                            onChange={(e) => setNotas(e.target.value)}
                            placeholder="Notas adicionales..."
                            className="min-h-[50px] sm:min-h-[60px] text-sm"
                        />
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                        <Button
                            onClick={generatePDF}
                            className="order-1 sm:order-2 flex-1 bg-[#135bec] hover:bg-blue-700 h-10 sm:h-11 text-sm"
                        >
                            <span className="material-symbols-outlined mr-2 text-[16px] sm:text-[18px]">picture_as_pdf</span>
                            Generar Factura
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="order-2 sm:order-1 flex-1 h-9 sm:h-11 text-sm"
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
