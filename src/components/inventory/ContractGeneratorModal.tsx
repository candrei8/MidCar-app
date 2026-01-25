"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { formatCurrency, cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import type { Vehicle, PersonData, EmpresaVendedora, TipoDocumentoIdentidad, TipoCliente, ContractWarranty, ContractEconomics } from "@/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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

// Helper para verificar si una URL de imagen es válida (excluye Azure CDN que no existe)
const isValidImageUrl = (url: string | null | undefined): boolean => {
    if (!url) return false
    return !url.includes('midcar.azureedge.net')
}

import {
    createContract,
    generateContractNumber,
} from "@/lib/supabase-service"
import {
    PROVINCIAS,
    TIPOS_DOCUMENTO,
    TIPOS_CLIENTE,
} from "@/lib/constants"

// Format date for display
const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

interface ContractGeneratorModalProps {
    vehicle: Vehicle
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function ContractGeneratorModal({ vehicle, open, onOpenChange, onSuccess }: ContractGeneratorModalProps) {
    const { user, profile } = useAuth()

    // Empresas vendedoras
    const [empresas, setEmpresas] = useState<EmpresaVendedora[]>([])
    const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>('')

    // Formulario del comprador
    const [tipoCliente, setTipoCliente] = useState<TipoCliente>('particular')
    const [tipoDocumento, setTipoDocumento] = useState<TipoDocumentoIdentidad>('DNI')
    const [comprador, setComprador] = useState<PersonData>({
        nombre: '',
        apellidos: '',
        dni_nie: '',
        direccion: '',
        codigo_postal: '',
        municipio: '',
        provincia: '',
        telefono: '',
        email: '',
    })

    // Datos economicos
    const [economico, setEconomico] = useState<Partial<ContractEconomics>>({
        precio_venta: vehicle.precio_venta,
        iva_porcentaje: 21,
        iva_importe: 0,
        precio_total: 0,
        forma_pago: 'contado',
    })

    // Garantia
    const [garantia, setGarantia] = useState<ContractWarranty>({
        tiene_garantia: true,
        meses_garantia: vehicle.garantia_meses || 12,
        tipo_garantia: 'legal',
    })

    // Documentacion
    const [documentacion, setDocumentacion] = useState({
        tiene_permiso_circulacion: true,
        tiene_ficha_tecnica: true,
        tiene_itv_vigente: true,
        tiene_justificante_pago_impuesto: true,
    })

    // Fecha y lugar
    const [fechaContrato, setFechaContrato] = useState(new Date().toISOString().split('T')[0])
    const [lugarFirma, setLugarFirma] = useState('Madrid')
    const [clausulasAdicionales, setClausulasAdicionales] = useState('')
    const [reserva, setReserva] = useState<number>(0)

    // Empresa seleccionada
    const empresaSeleccionada = useMemo(() => {
        if (!selectedEmpresaId) return null
        return empresas.find(e => e.id === selectedEmpresaId) || null
    }, [selectedEmpresaId, empresas])

    // Calcular total a pagar
    const totalPago = useMemo(() => {
        return (economico.precio_venta || 0) - reserva
    }, [economico.precio_venta, reserva])

    // Load empresas on mount
    useEffect(() => {
        const loadEmpresas = async () => {
            await initDefaultEmpresas()
            const empList = await getEmpresasActivas()
            setEmpresas(empList)
            if (empList.length > 0) {
                setSelectedEmpresaId(empList[0].id)
            }
        }
        loadEmpresas()
    }, [])

    // Update price when vehicle changes
    useEffect(() => {
        setEconomico(prev => ({
            ...prev,
            precio_venta: vehicle.precio_venta,
        }))
    }, [vehicle])

    // Calcular IVA y total
    useEffect(() => {
        const precio = economico.precio_venta || 0
        const ivaPct = economico.iva_porcentaje || 0
        const ivaImporte = (precio * ivaPct) / 100
        const total = precio + ivaImporte

        setEconomico(prev => ({
            ...prev,
            iva_importe: ivaImporte,
            precio_total: total,
        }))
    }, [economico.precio_venta, economico.iva_porcentaje])

    // Generate PDF
    const generatePDF = useCallback((numeroContrato: string) => {
        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.getWidth()
        const margin = 20
        let y = 20

        const addText = (text: string, x: number, yPos: number, options: any = {}) => {
            doc.text(text, x, yPos, options)
        }

        // Header
        doc.setFontSize(18)
        doc.setFont('helvetica', 'bold')
        addText('CONTRATO DE COMPRAVENTA DE VEHICULO', pageWidth / 2, y, { align: 'center' })

        y += 15
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        addText(`Numero de Contrato: ${numeroContrato}`, pageWidth / 2, y, { align: 'center' })

        y += 10
        addText(`En ${lugarFirma}, a ${formatDate(fechaContrato)}`, pageWidth / 2, y, { align: 'center' })

        y += 10
        doc.setDrawColor(200)
        doc.line(margin, y, pageWidth - margin, y)

        // REUNIDOS
        y += 15
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        addText('REUNIDOS', margin, y)

        // Vendedor
        y += 10
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        addText('DE UNA PARTE (VENDEDOR):', margin, y)
        doc.setFont('helvetica', 'normal')
        y += 6
        const emp = empresaSeleccionada
        addText(`${emp?.razon_social || emp?.nombre_comercial || 'Empresa no seleccionada'}`, margin, y)
        y += 5
        addText(`CIF: ${emp?.cif || ''}`, margin, y)
        y += 5
        addText(`Domicilio: ${emp?.direccion || ''}, ${emp?.codigo_postal || ''} ${emp?.localidad || ''} (${emp?.provincia || ''})`, margin, y)

        // Comprador
        y += 12
        doc.setFont('helvetica', 'bold')
        addText('DE OTRA PARTE (COMPRADOR):', margin, y)
        doc.setFont('helvetica', 'normal')
        y += 6
        addText(`D/Da. ${comprador.nombre} ${comprador.apellidos}`, margin, y)
        y += 5
        addText(`${tipoDocumento}: ${comprador.dni_nie}`, margin, y)
        y += 5
        addText(`Domicilio: ${comprador.direccion}, ${comprador.codigo_postal} ${comprador.municipio} (${comprador.provincia})`, margin, y)
        y += 5
        addText(`Telefono: ${comprador.telefono} - Email: ${comprador.email}`, margin, y)

        y += 10
        doc.line(margin, y, pageWidth - margin, y)

        // DATOS DEL VEHICULO
        y += 15
        doc.setFont('helvetica', 'bold')
        addText('DATOS DEL VEHICULO', margin, y)

        y += 8
        doc.setFont('helvetica', 'normal')
        const vehiculoData = [
            ['Marca/Modelo:', `${vehicle.marca} ${vehicle.modelo} ${vehicle.version || ''}`],
            ['Matricula:', vehicle.matricula],
            ['Bastidor (VIN):', vehicle.vin],
            ['Fecha 1a Matriculacion:', String(vehicle.año_matriculacion)],
            ['Kilometraje:', `${vehicle.kilometraje.toLocaleString()} km`],
            ['Combustible:', vehicle.combustible.charAt(0).toUpperCase() + vehicle.combustible.slice(1)],
            ['Color:', vehicle.color_exterior],
        ]

        vehiculoData.forEach(([label, value]) => {
            doc.setFont('helvetica', 'bold')
            addText(label, margin, y)
            doc.setFont('helvetica', 'normal')
            addText(value, margin + 45, y)
            y += 5
        })

        // CONDICIONES ECONOMICAS
        y += 8
        doc.setFont('helvetica', 'bold')
        addText('CONDICIONES ECONOMICAS', margin, y)

        y += 8
        doc.setFont('helvetica', 'normal')
        addText(`Precio de venta (sin IVA): ${formatCurrency(economico.precio_venta || 0)}`, margin, y)
        y += 5
        addText(`IVA (${economico.iva_porcentaje}%): ${formatCurrency(economico.iva_importe || 0)}`, margin, y)
        y += 5
        doc.setFont('helvetica', 'bold')
        addText(`PRECIO TOTAL: ${formatCurrency(economico.precio_total || 0)}`, margin, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        addText(`Forma de pago: ${economico.forma_pago?.charAt(0).toUpperCase()}${economico.forma_pago?.slice(1)}`, margin, y)

        // GARANTIA
        y += 12
        doc.setFont('helvetica', 'bold')
        addText('GARANTIA', margin, y)

        y += 8
        doc.setFont('helvetica', 'normal')
        if (garantia.tiene_garantia) {
            addText(`El vehiculo cuenta con garantia de ${garantia.meses_garantia} meses (${garantia.tipo_garantia}).`, margin, y)
        } else {
            addText('El vehiculo se vende sin garantia.', margin, y)
        }

        // DOCUMENTACION
        y += 12
        doc.setFont('helvetica', 'bold')
        addText('DOCUMENTACION ENTREGADA', margin, y)

        y += 8
        doc.setFont('helvetica', 'normal')
        const docs = []
        if (documentacion.tiene_permiso_circulacion) docs.push('Permiso de Circulacion')
        if (documentacion.tiene_ficha_tecnica) docs.push('Ficha Tecnica')
        if (documentacion.tiene_itv_vigente) docs.push('ITV Vigente')
        if (documentacion.tiene_justificante_pago_impuesto) docs.push('Justificante Pago Impuesto')
        addText(docs.join(', '), margin, y)

        // CLAUSULAS
        y += 15
        doc.setFont('helvetica', 'bold')
        addText('CLAUSULAS', margin, y)

        y += 8
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')

        const clausulas = [
            'PRIMERA.- El vendedor transmite al comprador la plena propiedad del vehiculo descrito.',
            'SEGUNDA.- El comprador declara conocer el estado actual del vehiculo.',
            'TERCERA.- El vendedor garantiza ser el legitimo propietario del vehiculo y que este se encuentra libre de cargas.',
            'CUARTA.- Los gastos de transferencia seran por cuenta del comprador.',
            'QUINTA.- El comprador asume la responsabilidad del vehiculo desde la firma del presente contrato.',
        ]

        clausulas.forEach((clausula) => {
            const lines = doc.splitTextToSize(clausula, pageWidth - 2 * margin)
            if (y + lines.length * 4 > 270) {
                doc.addPage()
                y = 20
            }
            doc.text(lines, margin, y)
            y += lines.length * 4 + 3
        })

        // Clausulas adicionales
        if (clausulasAdicionales) {
            y += 5
            doc.setFont('helvetica', 'bold')
            addText('CLAUSULAS ADICIONALES', margin, y)
            y += 6
            doc.setFont('helvetica', 'normal')
            const lines = doc.splitTextToSize(clausulasAdicionales, pageWidth - 2 * margin)
            doc.text(lines, margin, y)
            y += lines.length * 4 + 3
        }

        // FIRMAS
        y = Math.max(y + 20, 240)
        if (y > 260) {
            doc.addPage()
            y = 40
        }

        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        addText('EL VENDEDOR', margin + 20, y, { align: 'center' })
        addText('EL COMPRADOR', pageWidth - margin - 20, y, { align: 'center' })

        y += 25
        doc.line(margin, y, margin + 60, y)
        doc.line(pageWidth - margin - 60, y, pageWidth - margin, y)

        y += 5
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        addText(empresaSeleccionada?.nombre_comercial || 'Vendedor', margin + 30, y, { align: 'center' })
        addText(`${comprador.nombre} ${comprador.apellidos}`, pageWidth - margin - 30, y, { align: 'center' })

        return doc
    }, [vehicle, comprador, economico, garantia, documentacion, fechaContrato, lugarFirma, empresaSeleccionada, tipoDocumento, clausulasAdicionales])

    // Handle generate
    const handleGenerarContrato = async () => {
        // Permitir generar sin datos obligatorios - se pueden rellenar después
        try {
            // Generate contract number from Supabase
            const numeroContrato = await generateContractNumber()

            // Generate and save PDF
            const doc = generatePDF(numeroContrato)
            doc.save(`Contrato_${vehicle.matricula}_${comprador.apellidos || 'comprador'}.pdf`)

            // Get creator name
            const creatorName = profile ? `${profile.nombre} ${profile.apellidos}`.trim() : user?.email?.split('@')[0] || 'Usuario'

            // Save contract to Supabase (flat structure aligned with DB schema)
            const contractData = {
                numero_contrato: numeroContrato,
                estado: 'firmado' as const,
                empresa_id: empresaSeleccionada?.id,
                empresa_nombre: empresaSeleccionada?.nombre_comercial || '',
                empresa_cif: empresaSeleccionada?.cif || '',
                empresa_direccion: empresaSeleccionada ? `${empresaSeleccionada.direccion}, ${empresaSeleccionada.codigo_postal} ${empresaSeleccionada.localidad}` : '',
                comprador_tipo: tipoCliente,
                comprador_nombre: comprador.nombre,
                comprador_apellidos: comprador.apellidos,
                comprador_documento_tipo: tipoDocumento,
                comprador_documento: comprador.dni_nie,
                comprador_direccion: comprador.direccion,
                comprador_cp: comprador.codigo_postal,
                comprador_localidad: comprador.municipio,
                comprador_provincia: comprador.provincia,
                comprador_telefono: comprador.telefono,
                comprador_email: comprador.email,
                vehiculo_id: vehicle.id,
                vehiculo_matricula: vehicle.matricula,
                vehiculo_vin: vehicle.vin,
                vehiculo_marca: vehicle.marca,
                vehiculo_modelo: vehicle.modelo,
                vehiculo_km: vehicle.kilometraje,
                vehiculo_precio: vehicle.precio_venta || 0,
                precio_venta: economico.precio_venta || 0,
                forma_pago: economico.forma_pago || 'contado',
                entrega_inicial: 0,
                financiado: 0,
                garantia_meses: garantia.tiene_garantia ? garantia.meses_garantia : 0,
                garantia_km: garantia.tiene_garantia ? undefined : undefined,
                garantia_tipo: garantia.tiene_garantia ? garantia.tipo_garantia : undefined,
                fecha_firma: fechaContrato,
                notas: clausulasAdicionales || undefined,
                created_by: user?.id,
                created_by_name: creatorName,
            }

            const savedContract = await createContract(contractData)

            if (savedContract) {
                // Notify data update
                window.dispatchEvent(new CustomEvent('midcar-data-updated', { detail: { type: 'contracts' } }))
                alert('Contrato generado correctamente')
                onSuccess?.()
                onOpenChange(false)
            } else {
                throw new Error('No se pudo guardar el contrato')
            }
        } catch (error) {
            console.error('Error generating contract:', error)
            alert('Error al guardar el contrato en la base de datos')
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-[700px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                <DialogHeader className="pb-2">
                    <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <span className="material-symbols-outlined text-[#135bec] text-[20px] sm:text-[24px]">description</span>
                        Generar Contrato
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3 sm:space-y-4">
                    {/* Vehicle Summary */}
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-50 rounded-xl">
                        <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-lg bg-slate-200 overflow-hidden shrink-0">
                            {isValidImageUrl(vehicle.imagen_principal) ? (
                                <img
                                    src={vehicle.imagen_principal!}
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
                                {formatCurrency(economico.precio_total || 0)}
                            </p>
                            <p className="text-[9px] sm:text-[10px] text-slate-400">IVA incl.</p>
                        </div>
                    </div>

                    {/* Empresa Vendedora */}
                    <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-100">
                        <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#135bec] mb-2 sm:mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[14px] sm:text-[16px]">business</span>
                            Empresa Vendedora
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

                    {/* Datos del Comprador */}
                    <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-100">
                        <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#135bec] mb-2 sm:mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[14px] sm:text-[16px]">person</span>
                            Datos del Comprador
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                <Input
                                    placeholder="Nombre *"
                                    value={comprador.nombre}
                                    onChange={(e) => setComprador({ ...comprador, nombre: e.target.value })}
                                    className="h-9 sm:h-10 text-sm"
                                />
                                <Input
                                    placeholder="Apellidos"
                                    value={comprador.apellidos}
                                    onChange={(e) => setComprador({ ...comprador, apellidos: e.target.value })}
                                    className="h-9 sm:h-10 text-sm"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                <Input
                                    placeholder={`${tipoDocumento} *`}
                                    value={comprador.dni_nie}
                                    onChange={(e) => setComprador({ ...comprador, dni_nie: e.target.value })}
                                    className="h-9 sm:h-10 text-sm"
                                />
                                <Input
                                    placeholder="Teléfono"
                                    value={comprador.telefono}
                                    onChange={(e) => setComprador({ ...comprador, telefono: e.target.value })}
                                    className="h-9 sm:h-10 text-sm"
                                />
                            </div>
                            <Input
                                placeholder="Email"
                                type="email"
                                value={comprador.email}
                                onChange={(e) => setComprador({ ...comprador, email: e.target.value })}
                                className="h-9 sm:h-10 text-sm"
                            />
                            <Input
                                placeholder="Dirección"
                                value={comprador.direccion}
                                onChange={(e) => setComprador({ ...comprador, direccion: e.target.value })}
                                className="h-9 sm:h-10 text-sm"
                            />
                            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                <Input
                                    placeholder="CP"
                                    value={comprador.codigo_postal}
                                    onChange={(e) => setComprador({ ...comprador, codigo_postal: e.target.value })}
                                    className="h-9 sm:h-10 text-sm"
                                />
                                <Input
                                    placeholder="Municipio"
                                    value={comprador.municipio}
                                    onChange={(e) => setComprador({ ...comprador, municipio: e.target.value })}
                                    className="h-9 sm:h-10 col-span-2 text-sm"
                                />
                            </div>
                            <Select
                                value={comprador.provincia}
                                onValueChange={(value) => setComprador({ ...comprador, provincia: value })}
                            >
                                <SelectTrigger className="h-9 sm:h-10 text-sm">
                                    <SelectValue placeholder="Provincia" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PROVINCIAS.map(prov => (
                                        <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Condiciones Economicas */}
                    <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-100">
                        <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#135bec] mb-2 sm:mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[14px] sm:text-[16px]">euro</span>
                            Condiciones Económicas
                        </h3>
                        <div className="space-y-2 sm:space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                                <div className="space-y-1">
                                    <Label className="text-[10px] sm:text-xs text-slate-500">Precio (sin IVA)</Label>
                                    <Input
                                        type="number"
                                        value={economico.precio_venta || ''}
                                        onChange={(e) => setEconomico({ ...economico, precio_venta: parseFloat(e.target.value) || 0 })}
                                        className="h-9 sm:h-10 text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] sm:text-xs text-slate-500">IVA</Label>
                                    <Select
                                        value={String(economico.iva_porcentaje)}
                                        onValueChange={(value) => setEconomico({ ...economico, iva_porcentaje: parseInt(value) })}
                                    >
                                        <SelectTrigger className="h-9 sm:h-10 text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="21">21%</SelectItem>
                                            <SelectItem value="10">10%</SelectItem>
                                            <SelectItem value="4">4%</SelectItem>
                                            <SelectItem value="0">0%</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1 col-span-2 sm:col-span-1">
                                    <Label className="text-[10px] sm:text-xs text-slate-500">Forma de Pago</Label>
                                    <Select
                                        value={economico.forma_pago}
                                        onValueChange={(value: any) => setEconomico({ ...economico, forma_pago: value })}
                                    >
                                        <SelectTrigger className="h-9 sm:h-10 text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="contado">Contado</SelectItem>
                                            <SelectItem value="transferencia">Transferencia</SelectItem>
                                            <SelectItem value="financiacion">Financiación</SelectItem>
                                            <SelectItem value="mixto">Mixto</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-2 sm:p-3 bg-green-50 rounded-lg">
                                <span className="font-medium text-green-700 text-xs sm:text-sm">TOTAL (IVA incl.)</span>
                                <span className="text-base sm:text-xl font-bold text-green-700">
                                    {formatCurrency(economico.precio_total || 0)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Garantia y Fecha */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-100">
                            <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#135bec] mb-2 sm:mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[14px] sm:text-[16px]">shield</span>
                                Garantía
                            </h3>
                            <div className="space-y-2 sm:space-y-3">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="tiene_garantia"
                                        checked={garantia.tiene_garantia}
                                        onCheckedChange={(checked) => setGarantia({ ...garantia, tiene_garantia: checked as boolean })}
                                    />
                                    <Label htmlFor="tiene_garantia" className="text-xs sm:text-sm">Incluye garantía</Label>
                                </div>
                                {garantia.tiene_garantia && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <Select
                                            value={String(garantia.meses_garantia)}
                                            onValueChange={(value) => setGarantia({ ...garantia, meses_garantia: parseInt(value) })}
                                        >
                                            <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="6">6 meses</SelectItem>
                                                <SelectItem value="12">12 meses</SelectItem>
                                                <SelectItem value="24">24 meses</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select
                                            value={garantia.tipo_garantia}
                                            onValueChange={(value: any) => setGarantia({ ...garantia, tipo_garantia: value })}
                                        >
                                            <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="legal">Legal</SelectItem>
                                                <SelectItem value="comercial">Comercial</SelectItem>
                                                <SelectItem value="extendida">Extendida</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-100">
                            <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#135bec] mb-2 sm:mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[14px] sm:text-[16px]">calendar_month</span>
                                Fecha y Lugar
                            </h3>
                            <div className="space-y-2">
                                <Input
                                    type="date"
                                    value={fechaContrato}
                                    onChange={(e) => setFechaContrato(e.target.value)}
                                    className="h-8 sm:h-9 text-sm"
                                />
                                <Input
                                    placeholder="Lugar de firma"
                                    value={lugarFirma}
                                    onChange={(e) => setLugarFirma(e.target.value)}
                                    className="h-8 sm:h-9 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Clausulas Adicionales */}
                    <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-100">
                        <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#135bec] mb-2 sm:mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[14px] sm:text-[16px]">edit_note</span>
                            Cláusulas Adicionales (opcional)
                        </h3>
                        <Textarea
                            value={clausulasAdicionales}
                            onChange={(e) => setClausulasAdicionales(e.target.value)}
                            placeholder="Condiciones especiales..."
                            className="min-h-[60px] sm:min-h-[80px] text-sm"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                        <Button
                            onClick={handleGenerarContrato}
                            className="order-1 sm:order-2 flex-1 bg-[#135bec] hover:bg-blue-700 h-10 sm:h-11 text-sm"
                        >
                            <span className="material-symbols-outlined mr-2 text-[16px] sm:text-[18px]">download</span>
                            Generar Contrato
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
