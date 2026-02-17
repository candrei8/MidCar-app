"use client"

import { useState, useMemo, useEffect } from "react"
import { formatCurrency, cn } from "@/lib/utils"
import { useFilteredData } from "@/hooks/useFilteredData"
import { useAuth } from "@/lib/auth-context"
import type { Vehicle, PersonData, EmpresaVendedora, Invoice, InvoiceStatus, TipoDocumentoIdentidad, TipoCliente } from "@/types"
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
    getInvoices,
    createInvoice,
    deleteInvoice,
    generateInvoiceNumber,
    type InvoiceDB,
} from "@/lib/supabase-service"
import {
    PROVINCIAS,
    TIPOS_DOCUMENTO,
    TIPOS_CLIENTE,
    ESTADOS_FACTURA,
    FORMAS_PAGO,
    TIPOS_IVA,
} from "@/lib/constants"

// Format date for display
const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function FacturacionPage() {
    const { user, profile } = useAuth()
    const { vehicles: allVehicles, contacts } = useFilteredData()

    // Mobile view state
    const [mobileStep, setMobileStep] = useState<'list' | 'form'>('list')

    // Saved invoices from Supabase
    const [savedInvoices, setSavedInvoices] = useState<InvoiceDB[]>([])
    const [showHistory, setShowHistory] = useState(false)
    const [isLoadingInvoices, setIsLoadingInvoices] = useState(false)

    // Preview modal
    const [showPreview, setShowPreview] = useState(false)

    // Estado
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)

    // Empresas vendedoras
    const [empresas, setEmpresas] = useState<EmpresaVendedora[]>([])
    const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>('')

    // Cliente
    const [tipoCliente, setTipoCliente] = useState<TipoCliente>('particular')
    const [tipoDocumento, setTipoDocumento] = useState<TipoDocumentoIdentidad>('DNI')
    const [cliente, setCliente] = useState<PersonData>({
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

    // Factura
    const [fechaFactura, setFechaFactura] = useState(new Date().toISOString().split('T')[0])
    const [fechaVencimiento, setFechaVencimiento] = useState('')
    const [concepto, setConcepto] = useState('Venta de vehiculo')
    const [baseImponible, setBaseImponible] = useState<number>(0)
    const [ivaPorcentaje, setIvaPorcentaje] = useState<number>(21)
    const [estadoFactura, setEstadoFactura] = useState<InvoiceStatus>('pendiente')
    const [formaPago, setFormaPago] = useState('contado')
    const [fechaPago, setFechaPago] = useState('')
    const [notas, setNotas] = useState('')
    const [clausulasAdicionales, setClausulasAdicionales] = useState('')
    const [aplicaIva, setAplicaIva] = useState(true)

    // Calculos - manejar IVA opcional (value -1 = sin IVA)
    const ivaEfectivo = useMemo(() => aplicaIva && ivaPorcentaje >= 0 ? ivaPorcentaje : 0, [aplicaIva, ivaPorcentaje])
    const ivaImporte = useMemo(() => (baseImponible * ivaEfectivo) / 100, [baseImponible, ivaEfectivo])
    const totalFactura = useMemo(() => baseImponible + ivaImporte, [baseImponible, ivaImporte])

    // Empresa seleccionada
    const empresaSeleccionada = useMemo(() => {
        if (!selectedEmpresaId) return null
        return empresas.find(e => e.id === selectedEmpresaId) || null
    }, [selectedEmpresaId, empresas])

    // Load on mount
    useEffect(() => {
        const loadData = async () => {
            setIsLoadingInvoices(true)
            try {
                await initDefaultEmpresas()
                const [invoices, empList] = await Promise.all([
                    getInvoices(),
                    getEmpresasActivas()
                ])
                setSavedInvoices(invoices)
                setEmpresas(empList)
                if (empList.length > 0) {
                    setSelectedEmpresaId(empList[0].id)
                }
            } catch (error) {
                console.error('Error loading data:', error)
            } finally {
                setIsLoadingInvoices(false)
            }
        }
        loadData()
    }, [])

    // Vehiculos vendidos (allVehicles ya incluye mock + user vehicles)
    const vehiculosVendidos = useMemo(() => {
        const vendidos = allVehicles.filter(v => v.estado === 'vendido')
        if (!searchQuery) return vendidos

        const query = searchQuery.toLowerCase()
        return vendidos.filter(v =>
            v.marca.toLowerCase().includes(query) ||
            v.modelo.toLowerCase().includes(query) ||
            v.matricula.toLowerCase().includes(query)
        )
    }, [allVehicles, searchQuery])

    // Cuando se selecciona un vehiculo
    const handleSelectVehicle = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle)
        setBaseImponible(vehicle.precio_venta)
        setConcepto(`Venta de vehiculo ${vehicle.marca} ${vehicle.modelo} - ${vehicle.matricula}`)
        setMobileStep('form')
    }

    // Validacion
    const validateForm = (): boolean => {
        if (!cliente.nombre || !cliente.dni_nie) {
            alert('Por favor, complete los datos del cliente (nombre y documento)')
            return false
        }
        if (!selectedVehicle) {
            alert('Por favor, seleccione un vehiculo')
            return false
        }
        if (!selectedEmpresaId) {
            alert('Por favor, seleccione una empresa vendedora')
            return false
        }
        if (baseImponible <= 0) {
            alert('Por favor, introduzca un importe valido')
            return false
        }
        return true
    }

    // Generar PDF
    const generatePDF = async () => {
        if (!validateForm() || !selectedVehicle || !empresaSeleccionada) return

        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.getWidth()
        const margin = 20
        let y = 20

        // Helper
        const addText = (text: string, x: number, yPos: number, options?: any) => {
            doc.text(text, x, yPos, options)
        }

        // Encabezado
        doc.setFontSize(10)
        doc.setTextColor(100)
        addText(empresaSeleccionada.razon_social, margin, y)
        y += 5
        addText(`CIF: ${empresaSeleccionada.cif}`, margin, y)
        y += 5
        addText(`${empresaSeleccionada.direccion}, ${empresaSeleccionada.codigo_postal} ${empresaSeleccionada.localidad}`, margin, y)
        y += 5
        addText(`Tel: ${empresaSeleccionada.telefono} | Email: ${empresaSeleccionada.email}`, margin, y)

        // Titulo
        y += 15
        doc.setFontSize(24)
        doc.setTextColor(19, 91, 236) // #135bec
        addText('FACTURA', pageWidth / 2, y, { align: 'center' })

        // Numero y fecha
        y += 10
        doc.setFontSize(12)
        doc.setTextColor(0)
        const tempInvoiceNum = `FAC-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`
        addText(`N Factura: ${tempInvoiceNum}`, pageWidth - margin, y, { align: 'right' })
        y += 6
        addText(`Fecha: ${formatDate(fechaFactura)}`, pageWidth - margin, y, { align: 'right' })
        if (fechaVencimiento) {
            y += 6
            addText(`Vencimiento: ${formatDate(fechaVencimiento)}`, pageWidth - margin, y, { align: 'right' })
        }

        // Linea separadora
        y += 10
        doc.setDrawColor(200)
        doc.line(margin, y, pageWidth - margin, y)

        // Datos cliente
        y += 10
        doc.setFontSize(10)
        doc.setTextColor(100)
        addText('DATOS DEL CLIENTE', margin, y)
        y += 6
        doc.setTextColor(0)
        doc.setFontSize(11)
        addText(`${cliente.nombre} ${cliente.apellidos}`, margin, y)
        y += 5
        addText(`${tipoDocumento}: ${cliente.dni_nie}`, margin, y)
        y += 5
        if (cliente.direccion) {
            addText(`${cliente.direccion}, ${cliente.codigo_postal} ${cliente.municipio}`, margin, y)
            y += 5
        }

        // Datos vehiculo
        y += 10
        doc.setFontSize(10)
        doc.setTextColor(100)
        addText('DATOS DEL VEHICULO', margin, y)
        y += 6
        doc.setTextColor(0)
        doc.setFontSize(11)
        addText(`${selectedVehicle.marca} ${selectedVehicle.modelo}`, margin, y)
        y += 5
        addText(`Matricula: ${selectedVehicle.matricula}`, margin, y)
        y += 5
        addText(`Bastidor: ${selectedVehicle.vin}`, margin, y)
        y += 5
        addText(`Km: ${selectedVehicle.kilometraje.toLocaleString('es-ES')}`, margin, y)

        // Linea separadora
        y += 10
        doc.setDrawColor(200)
        doc.line(margin, y, pageWidth - margin, y)

        // Concepto y desglose
        y += 10
        doc.setFontSize(10)
        doc.setTextColor(100)
        addText('CONCEPTO', margin, y)
        y += 6
        doc.setTextColor(0)
        doc.setFontSize(11)
        addText(concepto, margin, y)

        // Tabla de importes
        y += 15
        doc.setFillColor(245, 245, 245)
        doc.rect(margin, y - 5, pageWidth - 2 * margin, 8, 'F')
        doc.setFontSize(10)
        addText('Descripcion', margin + 5, y)
        addText('Importe', pageWidth - margin - 30, y, { align: 'right' })

        y += 10
        doc.setFontSize(11)
        addText('Base imponible', margin + 5, y)
        addText(formatCurrency(baseImponible), pageWidth - margin - 5, y, { align: 'right' })

        y += 8
        if (aplicaIva && ivaPorcentaje >= 0) {
            addText(`IVA (${ivaPorcentaje}%)`, margin + 5, y)
            addText(formatCurrency(ivaImporte), pageWidth - margin - 5, y, { align: 'right' })
        } else {
            doc.setTextColor(100)
            addText('IVA no aplicable', margin + 5, y)
            addText('-', pageWidth - margin - 5, y, { align: 'right' })
            doc.setTextColor(0)
        }

        // Linea
        y += 5
        doc.line(pageWidth - 80, y, pageWidth - margin, y)

        // Total
        y += 10
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        addText('TOTAL', pageWidth - 80, y)
        addText(formatCurrency(totalFactura), pageWidth - margin - 5, y, { align: 'right' })

        // Forma de pago
        y += 20
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(100)
        addText('FORMA DE PAGO', margin, y)
        y += 6
        doc.setTextColor(0)
        doc.setFontSize(11)
        addText(formaPago.charAt(0).toUpperCase() + formaPago.slice(1), margin, y)

        // Clausulas adicionales
        if (clausulasAdicionales) {
            y += 15
            doc.setFontSize(10)
            doc.setTextColor(100)
            addText('CLAUSULAS Y CONDICIONES ADICIONALES', margin, y)
            y += 6
            doc.setTextColor(0)
            doc.setFontSize(10)
            const splitClausulas = doc.splitTextToSize(clausulasAdicionales, pageWidth - 2 * margin)
            doc.text(splitClausulas, margin, y)
            y += splitClausulas.length * 4
        }

        // Notas
        if (notas) {
            y += 15
            doc.setFontSize(10)
            doc.setTextColor(100)
            addText('OBSERVACIONES', margin, y)
            y += 6
            doc.setTextColor(0)
            doc.setFontSize(10)
            const splitNotas = doc.splitTextToSize(notas, pageWidth - 2 * margin)
            doc.text(splitNotas, margin, y)
        }

        // Pie de pagina
        const footerY = doc.internal.pageSize.getHeight() - 20
        doc.setFontSize(8)
        doc.setTextColor(150)
        addText(`${empresaSeleccionada.razon_social} - CIF: ${empresaSeleccionada.cif}`, pageWidth / 2, footerY, { align: 'center' })

        // Guardar PDF
        doc.save(`Factura_${selectedVehicle.matricula}_${fechaFactura}.pdf`)

        // Guardar en Supabase
        try {
            const creatorName = profile ? `${profile.nombre} ${profile.apellidos}`.trim() : user?.email?.split('@')[0] || 'Usuario'
            const numeroFactura = await generateInvoiceNumber()

            const invoiceData = {
                numero_factura: numeroFactura,
                fecha_factura: fechaFactura,
                empresa_id: selectedEmpresaId,
                empresa_nombre: empresaSeleccionada.nombre_comercial,
                empresa_cif: empresaSeleccionada.cif,
                empresa_direccion: `${empresaSeleccionada.direccion}, ${empresaSeleccionada.codigo_postal} ${empresaSeleccionada.localidad}`,
                vehiculo_id: selectedVehicle.id,
                vehiculo_descripcion: `${selectedVehicle.marca} ${selectedVehicle.modelo} - ${selectedVehicle.matricula}`,
                cliente_tipo: tipoCliente,
                cliente_nombre: cliente.nombre,
                cliente_apellidos: cliente.apellidos,
                cliente_documento_tipo: tipoDocumento,
                cliente_documento: cliente.dni_nie,
                cliente_direccion: cliente.direccion,
                cliente_cp: cliente.codigo_postal,
                cliente_localidad: cliente.municipio,
                cliente_provincia: cliente.provincia,
                base_imponible: baseImponible,
                tipo_iva: ivaPorcentaje,
                iva: ivaImporte,
                total: totalFactura,
                forma_pago: formaPago,
                estado: estadoFactura,
                fecha_vencimiento: fechaVencimiento || undefined,
                fecha_pago: fechaPago || undefined,
                notas: notas || undefined,
                created_by: user?.id,
                created_by_name: creatorName,
            }

            const savedInvoice = await createInvoice(invoiceData)

            if (savedInvoice) {
                setSavedInvoices(prev => [savedInvoice, ...prev])
                alert('Factura generada correctamente')
            }
        } catch (error) {
            console.error('Error saving invoice:', error)
            alert('Error al guardar la factura en la base de datos')
        }
    }

    // Limpiar formulario
    const handleClear = () => {
        setSelectedVehicle(null)
        setCliente({
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
        setBaseImponible(0)
        setConcepto('Venta de vehiculo')
        setNotas('')
        setClausulasAdicionales('')
        setIvaPorcentaje(21)
        setAplicaIva(true)
        setMobileStep('list')
    }

    return (
        <div className="min-h-screen bg-[#f6f6f8]">
            {/* Desktop Layout */}
            <div className="hidden lg:flex h-[calc(100vh-4rem)]">
                {/* Left Column - Vehicle List */}
                <div className="w-[320px] border-r border-slate-200 bg-white flex flex-col">
                    <div className="p-4 border-b border-slate-100">
                        <h2 className="text-lg font-bold text-slate-800 mb-3">Vehiculos Vendidos</h2>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                                search
                            </span>
                            <Input
                                type="text"
                                placeholder="Buscar vehiculo..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {vehiculosVendidos.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                <span className="material-symbols-outlined text-[48px] text-slate-300 mb-2">
                                    inventory_2
                                </span>
                                <p className="text-sm text-slate-500">No hay vehiculos vendidos</p>
                            </div>
                        ) : (
                            vehiculosVendidos.map(vehicle => (
                                <button
                                    key={vehicle.id}
                                    onClick={() => handleSelectVehicle(vehicle)}
                                    className={cn(
                                        "w-full text-left p-3 rounded-lg mb-2 transition-all",
                                        selectedVehicle?.id === vehicle.id
                                            ? "bg-[#135bec]/10 border-2 border-[#135bec]"
                                            : "bg-slate-50 hover:bg-slate-100 border-2 border-transparent"
                                    )}
                                >
                                    <div className="font-medium text-slate-800">
                                        {vehicle.marca} {vehicle.modelo}
                                    </div>
                                    <div className="text-sm text-slate-500">{vehicle.matricula}</div>
                                    <div className="text-sm font-semibold text-[#135bec] mt-1">
                                        {formatCurrency(vehicle.precio_venta)}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Column - Form */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">Facturacion</h1>
                                <p className="text-sm text-slate-500">Genera facturas para los vehiculos vendidos</p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowHistory(true)}
                                >
                                    <span className="material-symbols-outlined mr-2 text-[18px]">history</span>
                                    Historial
                                </Button>
                            </div>
                        </div>

                        {!selectedVehicle ? (
                            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                                <span className="material-symbols-outlined text-[64px] text-slate-300 mb-4">
                                    receipt_long
                                </span>
                                <h3 className="text-lg font-semibold text-slate-600 mb-2">
                                    Selecciona un vehiculo
                                </h3>
                                <p className="text-sm text-slate-400">
                                    Elige un vehiculo vendido de la lista para generar su factura
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-6">
                                {/* Left Form Column */}
                                <div className="space-y-4">
                                    {/* Empresa Vendedora */}
                                    <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#135bec] mb-3 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[16px]">business</span>
                                            Empresa Emisora
                                        </h3>
                                        <div className="space-y-3">
                                            <Select value={selectedEmpresaId} onValueChange={setSelectedEmpresaId}>
                                                <SelectTrigger>
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
                                            {empresaSeleccionada && (
                                                <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                                                    <p className="font-medium text-slate-700">{empresaSeleccionada.razon_social}</p>
                                                    <p className="text-slate-500">CIF: {empresaSeleccionada.cif}</p>
                                                    <p className="text-slate-500">{empresaSeleccionada.direccion}, {empresaSeleccionada.codigo_postal} {empresaSeleccionada.localidad}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Datos Factura */}
                                    <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#135bec] mb-3 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[16px]">receipt</span>
                                            Datos de la Factura
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs text-slate-500">Fecha Factura</Label>
                                                    <Input
                                                        type="date"
                                                        value={fechaFactura}
                                                        onChange={(e) => setFechaFactura(e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs text-slate-500">Fecha Vencimiento</Label>
                                                    <Input
                                                        type="date"
                                                        value={fechaVencimiento}
                                                        onChange={(e) => setFechaVencimiento(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-slate-500">Concepto</Label>
                                                <Input
                                                    value={concepto}
                                                    onChange={(e) => setConcepto(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cliente */}
                                    <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#135bec] mb-3 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[16px]">person</span>
                                            Datos del Cliente
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <Select value={tipoCliente} onValueChange={(v) => setTipoCliente(v as TipoCliente)}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {TIPOS_CLIENTE.map(t => (
                                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Select value={tipoDocumento} onValueChange={(v) => setTipoDocumento(v as TipoDocumentoIdentidad)}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {TIPOS_DOCUMENTO.map(t => (
                                                            <SelectItem key={t.value} value={t.value.toUpperCase()}>{t.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <Input
                                                    placeholder="Nombre *"
                                                    value={cliente.nombre}
                                                    onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })}
                                                />
                                                <Input
                                                    placeholder="Apellidos"
                                                    value={cliente.apellidos}
                                                    onChange={(e) => setCliente({ ...cliente, apellidos: e.target.value })}
                                                />
                                            </div>
                                            <Input
                                                placeholder={`${tipoDocumento} *`}
                                                value={cliente.dni_nie}
                                                onChange={(e) => setCliente({ ...cliente, dni_nie: e.target.value })}
                                            />
                                            <Input
                                                placeholder="Direccion"
                                                value={cliente.direccion}
                                                onChange={(e) => setCliente({ ...cliente, direccion: e.target.value })}
                                            />
                                            <div className="grid grid-cols-3 gap-3">
                                                <Input
                                                    placeholder="CP"
                                                    value={cliente.codigo_postal}
                                                    onChange={(e) => setCliente({ ...cliente, codigo_postal: e.target.value })}
                                                />
                                                <Input
                                                    placeholder="Municipio"
                                                    value={cliente.municipio}
                                                    onChange={(e) => setCliente({ ...cliente, municipio: e.target.value })}
                                                    className="col-span-2"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Form Column */}
                                <div className="space-y-4">
                                    {/* Vehiculo Info */}
                                    <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#135bec] mb-3 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[16px]">directions_car</span>
                                            Vehiculo
                                        </h3>
                                        <div className="p-3 bg-slate-50 rounded-lg">
                                            <p className="font-bold text-slate-800">{selectedVehicle.marca} {selectedVehicle.modelo}</p>
                                            <p className="text-sm text-slate-600">Matricula: {selectedVehicle.matricula}</p>
                                            <p className="text-sm text-slate-600">Bastidor: {selectedVehicle.vin}</p>
                                            <p className="text-sm text-slate-600">Km: {selectedVehicle.kilometraje.toLocaleString('es-ES')}</p>
                                        </div>
                                    </div>

                                    {/* Importes */}
                                    <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#135bec] mb-3 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[16px]">euro</span>
                                            Desglose Economico
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs text-slate-500">Base Imponible</Label>
                                                    <Input
                                                        type="number"
                                                        value={baseImponible || ''}
                                                        onChange={(e) => setBaseImponible(parseFloat(e.target.value) || 0)}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs text-slate-500">IVA</Label>
                                                    <Select
                                                        value={String(ivaPorcentaje)}
                                                        onValueChange={(v) => {
                                                            const val = parseInt(v)
                                                            setIvaPorcentaje(val)
                                                            setAplicaIva(val >= 0)
                                                        }}
                                                    >
                                                        <SelectTrigger>
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
                                            <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-600">Base imponible:</span>
                                                    <span>{formatCurrency(baseImponible)}</span>
                                                </div>
                                                {aplicaIva && ivaPorcentaje >= 0 ? (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-600">IVA ({ivaPorcentaje}%):</span>
                                                        <span>{formatCurrency(ivaImporte)}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-500 italic">Sin IVA aplicable</span>
                                                        <span className="text-slate-500">-</span>
                                                    </div>
                                                )}
                                                <div className="border-t pt-2 flex justify-between font-bold">
                                                    <span>TOTAL:</span>
                                                    <span className="text-[#135bec]">{formatCurrency(totalFactura)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Estado y Pago */}
                                    <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#135bec] mb-3 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[16px]">payments</span>
                                            Estado y Pago
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs text-slate-500">Estado</Label>
                                                    <Select value={estadoFactura} onValueChange={(v) => setEstadoFactura(v as InvoiceStatus)}>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {ESTADOS_FACTURA.map(e => (
                                                                <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs text-slate-500">Forma de Pago</Label>
                                                    <Select value={formaPago} onValueChange={setFormaPago}>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {FORMAS_PAGO.map(f => (
                                                                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            {estadoFactura === 'pagada' && (
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs text-slate-500">Fecha de Pago</Label>
                                                    <Input
                                                        type="date"
                                                        value={fechaPago}
                                                        onChange={(e) => setFechaPago(e.target.value)}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Clausulas Adicionales */}
                                    <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#135bec] mb-3 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[16px]">gavel</span>
                                            Clausulas y Añadidos
                                        </h3>
                                        <Textarea
                                            value={clausulasAdicionales}
                                            onChange={(e) => setClausulasAdicionales(e.target.value)}
                                            placeholder="Clausulas adicionales, condiciones especiales, acuerdos personalizados..."
                                            className="min-h-[100px]"
                                        />
                                        <p className="text-xs text-slate-400 mt-2">
                                            Incluye aqui cualquier clausula especial, condicion adicional o informacion personalizada para el comprador.
                                        </p>
                                    </div>

                                    {/* Notas */}
                                    <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#135bec] mb-3 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[16px]">edit_note</span>
                                            Observaciones
                                        </h3>
                                        <Textarea
                                            value={notas}
                                            onChange={(e) => setNotas(e.target.value)}
                                            placeholder="Notas adicionales..."
                                            className="min-h-[80px]"
                                        />
                                    </div>

                                    {/* Botones */}
                                    <div className="flex gap-3">
                                        <Button variant="outline" onClick={handleClear} className="flex-1">
                                            <span className="material-symbols-outlined mr-2 text-[18px]">delete</span>
                                            Limpiar
                                        </Button>
                                        <Button onClick={generatePDF} className="flex-1 bg-[#135bec] hover:bg-blue-700">
                                            <span className="material-symbols-outlined mr-2 text-[18px]">picture_as_pdf</span>
                                            Generar Factura
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Layout */}
            <div className="lg:hidden">
                {/* Header */}
                <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold text-slate-900">Facturacion</h1>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowHistory(true)}
                            >
                                <span className="material-symbols-outlined text-[18px]">history</span>
                            </Button>
                        </div>
                    </div>
                </header>

                <div className="p-4 pb-24">
                    {/* STEP 1: Vehicle List */}
                    {mobileStep === 'list' && (
                        <div className="space-y-4">
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    search
                                </span>
                                <Input
                                    type="text"
                                    placeholder="Buscar vehiculo vendido..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            {vehiculosVendidos.length === 0 ? (
                                <div className="bg-white rounded-xl p-8 text-center">
                                    <span className="material-symbols-outlined text-[48px] text-slate-300 mb-2">
                                        inventory_2
                                    </span>
                                    <p className="text-slate-500">No hay vehiculos vendidos</p>
                                </div>
                            ) : (
                                vehiculosVendidos.map(vehicle => (
                                    <button
                                        key={vehicle.id}
                                        onClick={() => handleSelectVehicle(vehicle)}
                                        className="w-full bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-left"
                                    >
                                        <div className="font-bold text-slate-800">
                                            {vehicle.marca} {vehicle.modelo}
                                        </div>
                                        <div className="text-sm text-slate-500">{vehicle.matricula}</div>
                                        <div className="text-lg font-bold text-[#135bec] mt-2">
                                            {formatCurrency(vehicle.precio_venta)}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}

                    {/* STEP 2: Form */}
                    {mobileStep === 'form' && selectedVehicle && (
                        <div className="space-y-4">
                            {/* Back button */}
                            <button
                                onClick={() => setMobileStep('list')}
                                className="flex items-center gap-1 text-[#135bec] font-medium"
                            >
                                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                                Volver a la lista
                            </button>

                            {/* Vehicle Summary */}
                            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-lg bg-[#135bec]/10 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[#135bec]">directions_car</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">{selectedVehicle.marca} {selectedVehicle.modelo}</p>
                                        <p className="text-sm text-slate-500">{selectedVehicle.matricula}</p>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <p className="text-lg font-bold text-[#135bec]">{formatCurrency(selectedVehicle.precio_venta)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Empresa */}
                            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[#135bec] mb-3">
                                    Empresa Emisora
                                </h3>
                                <Select value={selectedEmpresaId} onValueChange={setSelectedEmpresaId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {empresas.map(emp => (
                                            <SelectItem key={emp.id} value={emp.id}>{emp.nombre_comercial}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Cliente */}
                            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[#135bec] mb-3">
                                    Cliente
                                </h3>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input
                                            placeholder="Nombre *"
                                            value={cliente.nombre}
                                            onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })}
                                        />
                                        <Input
                                            placeholder="Apellidos"
                                            value={cliente.apellidos}
                                            onChange={(e) => setCliente({ ...cliente, apellidos: e.target.value })}
                                        />
                                    </div>
                                    <Input
                                        placeholder="DNI/NIF *"
                                        value={cliente.dni_nie}
                                        onChange={(e) => setCliente({ ...cliente, dni_nie: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Importes */}
                            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[#135bec] mb-3">
                                    Importes
                                </h3>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-slate-500">Base Imponible</Label>
                                            <Input
                                                type="number"
                                                value={baseImponible || ''}
                                                onChange={(e) => setBaseImponible(parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-slate-500">IVA</Label>
                                            <Select
                                                value={String(ivaPorcentaje)}
                                                onValueChange={(v) => setIvaPorcentaje(parseInt(v))}
                                            >
                                                <SelectTrigger>
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
                                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                        <span className="font-medium text-green-700">TOTAL</span>
                                        <span className="text-xl font-bold text-green-700">{formatCurrency(totalFactura)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Botones */}
                            <div className="flex gap-3 pt-4">
                                <Button variant="outline" onClick={handleClear} className="flex-1">
                                    Cancelar
                                </Button>
                                <Button onClick={generatePDF} className="flex-1 bg-[#135bec] hover:bg-blue-700">
                                    <span className="material-symbols-outlined mr-2 text-[18px]">picture_as_pdf</span>
                                    Generar PDF
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* History Modal */}
            <Dialog open={showHistory} onOpenChange={setShowHistory}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#135bec]">history</span>
                            Historial de Facturas
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        {savedInvoices.length === 0 ? (
                            <p className="text-center text-slate-500 py-8">No hay facturas guardadas</p>
                        ) : (
                            savedInvoices.map(invoice => (
                                <div key={invoice.id} className="p-4 bg-slate-50 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-slate-800">{invoice.numero_factura}</p>
                                            <p className="text-sm text-slate-500">{formatDate(invoice.fecha_factura)}</p>
                                            <p className="text-sm text-slate-600 mt-1">{invoice.cliente_nombre} {invoice.cliente_apellidos}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-[#135bec]">{formatCurrency(invoice.total)}</p>
                                            <span className={cn(
                                                "text-xs px-2 py-0.5 rounded-full",
                                                invoice.estado === 'pagada' ? "bg-green-100 text-green-700" :
                                                invoice.estado === 'pendiente' ? "bg-amber-100 text-amber-700" :
                                                invoice.estado === 'anulada' ? "bg-red-100 text-red-700" :
                                                "bg-blue-100 text-blue-700"
                                            )}>
                                                {invoice.estado.charAt(0).toUpperCase() + invoice.estado.slice(1)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
