/**
 * Export Utilities
 * Funciones para exportar datos a PDF y Excel
 */

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import type { Vehicle, Lead, Contact } from '@/types'
import { formatCurrency } from './utils'

// ============================================================================
// PDF EXPORTS
// ============================================================================

interface PDFExportOptions {
    title: string
    subtitle?: string
    filename: string
    orientation?: 'portrait' | 'landscape'
}

/**
 * Exportar vehículos a PDF
 */
export function exportVehiclesToPDF(vehicles: Vehicle[], options: PDFExportOptions) {
    const doc = new jsPDF({
        orientation: options.orientation || 'landscape',
        unit: 'mm',
        format: 'a4'
    })

    // Header
    doc.setFontSize(20)
    doc.setTextColor(19, 91, 236) // #135bec
    doc.text(options.title, 14, 20)

    if (options.subtitle) {
        doc.setFontSize(12)
        doc.setTextColor(100)
        doc.text(options.subtitle, 14, 28)
    }

    doc.setFontSize(10)
    doc.setTextColor(150)
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`, 14, 35)

    // Table data
    const tableData = vehicles.map(v => [
        v.matricula || '-',
        `${v.marca} ${v.modelo}`,
        v.version || '-',
        v.año_matriculacion?.toString() || '-',
        `${v.kilometraje?.toLocaleString('es-ES') || 0} km`,
        v.combustible || '-',
        formatCurrency(v.precio_venta || 0),
        v.estado || '-'
    ])

    autoTable(doc, {
        startY: 42,
        head: [['Matrícula', 'Vehículo', 'Versión', 'Año', 'Km', 'Combustible', 'Precio', 'Estado']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: [19, 91, 236],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 9
        },
        bodyStyles: {
            fontSize: 8
        },
        alternateRowStyles: {
            fillColor: [245, 247, 250]
        },
        columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 45 },
            6: { halign: 'right' },
            7: { halign: 'center' }
        }
    })

    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text(
            `Página ${i} de ${pageCount} - MidCar`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        )
    }

    doc.save(`${options.filename}.pdf`)
}

/**
 * Exportar leads a PDF
 */
export function exportLeadsToPDF(leads: Lead[], options: PDFExportOptions) {
    const doc = new jsPDF({
        orientation: options.orientation || 'landscape',
        unit: 'mm',
        format: 'a4'
    })

    // Header
    doc.setFontSize(20)
    doc.setTextColor(19, 91, 236)
    doc.text(options.title, 14, 20)

    if (options.subtitle) {
        doc.setFontSize(12)
        doc.setTextColor(100)
        doc.text(options.subtitle, 14, 28)
    }

    doc.setFontSize(10)
    doc.setTextColor(150)
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`, 14, 35)

    // Table data
    const tableData = leads.map(l => [
        l.cliente ? `${l.cliente.nombre} ${l.cliente.apellidos}` : '-',
        l.cliente?.telefono || '-',
        l.cliente?.email || '-',
        l.estado || '-',
        l.prioridad || '-',
        `${l.probabilidad || 0}%`,
        formatCurrency(l.presupuesto_cliente || 0),
        new Date(l.fecha_creacion).toLocaleDateString('es-ES')
    ])

    autoTable(doc, {
        startY: 42,
        head: [['Cliente', 'Teléfono', 'Email', 'Estado', 'Prioridad', 'Prob.', 'Presupuesto', 'Fecha']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: [19, 91, 236],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 9
        },
        bodyStyles: {
            fontSize: 8
        },
        alternateRowStyles: {
            fillColor: [245, 247, 250]
        }
    })

    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text(
            `Página ${i} de ${pageCount} - MidCar`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        )
    }

    doc.save(`${options.filename}.pdf`)
}

/**
 * Exportar contactos a PDF
 */
export function exportContactsToPDF(contacts: Contact[], options: PDFExportOptions) {
    const doc = new jsPDF({
        orientation: options.orientation || 'landscape',
        unit: 'mm',
        format: 'a4'
    })

    // Header
    doc.setFontSize(20)
    doc.setTextColor(19, 91, 236)
    doc.text(options.title, 14, 20)

    if (options.subtitle) {
        doc.setFontSize(12)
        doc.setTextColor(100)
        doc.text(options.subtitle, 14, 28)
    }

    doc.setFontSize(10)
    doc.setTextColor(150)
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`, 14, 35)

    // Table data
    const tableData = contacts.map(c => [
        c.nombre ? `${c.nombre} ${c.apellidos || ''}` : '-',
        c.telefono || '-',
        c.email || '-',
        c.origen || '-',
        c.estado || '-',
        new Date(c.fecha_registro).toLocaleDateString('es-ES')
    ])

    autoTable(doc, {
        startY: 42,
        head: [['Nombre', 'Teléfono', 'Email', 'Origen', 'Estado', 'Fecha Registro']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: [19, 91, 236],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 9
        },
        bodyStyles: {
            fontSize: 8
        },
        alternateRowStyles: {
            fillColor: [245, 247, 250]
        }
    })

    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text(
            `Página ${i} de ${pageCount} - MidCar`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        )
    }

    doc.save(`${options.filename}.pdf`)
}

/**
 * Exportar reporte genérico a PDF
 */
export function exportReportToPDF(
    data: { label: string; value: string | number }[],
    tableData: (string | number)[][],
    tableHeaders: string[],
    options: PDFExportOptions
) {
    const doc = new jsPDF({
        orientation: options.orientation || 'portrait',
        unit: 'mm',
        format: 'a4'
    })

    // Header
    doc.setFontSize(22)
    doc.setTextColor(19, 91, 236)
    doc.text(options.title, 14, 22)

    if (options.subtitle) {
        doc.setFontSize(12)
        doc.setTextColor(100)
        doc.text(options.subtitle, 14, 30)
    }

    doc.setFontSize(10)
    doc.setTextColor(150)
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`, 14, 38)

    // KPI Summary
    let yPos = 50
    doc.setFontSize(14)
    doc.setTextColor(50)
    doc.text('Resumen', 14, yPos)
    yPos += 8

    data.forEach((item, index) => {
        doc.setFontSize(10)
        doc.setTextColor(100)
        doc.text(item.label + ':', 14, yPos + (index * 7))
        doc.setTextColor(30)
        doc.setFont('helvetica', 'bold')
        doc.text(String(item.value), 70, yPos + (index * 7))
        doc.setFont('helvetica', 'normal')
    })

    // Table if provided
    if (tableData.length > 0 && tableHeaders.length > 0) {
        autoTable(doc, {
            startY: yPos + (data.length * 7) + 15,
            head: [tableHeaders],
            body: tableData,
            theme: 'striped',
            headStyles: {
                fillColor: [19, 91, 236],
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 9
            },
            bodyStyles: {
                fontSize: 8
            },
            alternateRowStyles: {
                fillColor: [245, 247, 250]
            }
        })
    }

    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text(
            `Página ${i} de ${pageCount} - MidCar`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        )
    }

    doc.save(`${options.filename}.pdf`)
}

// ============================================================================
// EXCEL EXPORTS
// ============================================================================

interface ExcelExportOptions {
    filename: string
    sheetName?: string
}

/**
 * Exportar vehículos a Excel
 */
export function exportVehiclesToExcel(vehicles: Vehicle[], options: ExcelExportOptions) {
    const data = vehicles.map(v => ({
        'Matrícula': v.matricula || '',
        'Marca': v.marca || '',
        'Modelo': v.modelo || '',
        'Versión': v.version || '',
        'Año': v.año_matriculacion || '',
        'Kilometraje': v.kilometraje || 0,
        'Combustible': v.combustible || '',
        'Transmisión': v.transmision || '',
        'Color': v.color_exterior || '',
        'Precio Compra': v.precio_compra || 0,
        'Precio Venta': v.precio_venta || 0,
        'Margen': v.margen_bruto || 0,
        'Estado': v.estado || '',
        'Días en Stock': v.dias_en_stock || 0,
        'VIN': v.vin || ''
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, options.sheetName || 'Inventario')

    // Auto-width columns
    const colWidths = Object.keys(data[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
    }))
    ws['!cols'] = colWidths

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, `${options.filename}.xlsx`)
}

/**
 * Exportar leads a Excel
 */
export function exportLeadsToExcel(leads: Lead[], options: ExcelExportOptions) {
    const data = leads.map(l => ({
        'Nombre': l.cliente ? `${l.cliente.nombre} ${l.cliente.apellidos}` : '',
        'Teléfono': l.cliente?.telefono || '',
        'Email': l.cliente?.email || '',
        'Estado': l.estado || '',
        'Prioridad': l.prioridad || '',
        'Probabilidad': `${l.probabilidad || 0}%`,
        'Presupuesto': l.presupuesto_cliente || 0,
        'Tipo Interés': l.tipo_interes || '',
        'Forma Pago': l.forma_pago || '',
        'Fecha Creación': l.fecha_creacion ? new Date(l.fecha_creacion).toLocaleDateString('es-ES') : '',
        'Última Interacción': l.ultima_interaccion ? new Date(l.ultima_interaccion).toLocaleDateString('es-ES') : '',
        'Notas': l.notas || ''
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, options.sheetName || 'Leads')

    const colWidths = Object.keys(data[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
    }))
    ws['!cols'] = colWidths

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, `${options.filename}.xlsx`)
}

/**
 * Exportar contactos a Excel
 */
export function exportContactsToExcel(contacts: Contact[], options: ExcelExportOptions) {
    const data = contacts.map(c => ({
        'Nombre': c.nombre || '',
        'Apellidos': c.apellidos || '',
        'Teléfono': c.telefono || '',
        'Email': c.email || '',
        'DNI/CIF': c.dni_cif || '',
        'Origen': c.origen || '',
        'Estado': c.estado || '',
        'Dirección': c.direccion || '',
        'Código Postal': c.codigo_postal || '',
        'Municipio': c.municipio || '',
        'Provincia': c.provincia || '',
        'Fecha Registro': c.fecha_registro ? new Date(c.fecha_registro).toLocaleDateString('es-ES') : '',
        'Acepta Marketing': c.acepta_marketing ? 'Sí' : 'No',
        'RGPD': c.consentimiento_rgpd ? 'Sí' : 'No'
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, options.sheetName || 'Contactos')

    const colWidths = Object.keys(data[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
    }))
    ws['!cols'] = colWidths

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, `${options.filename}.xlsx`)
}

/**
 * Exportar datos genéricos a Excel
 */
export function exportToExcel(
    data: Record<string, unknown>[],
    options: ExcelExportOptions
) {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, options.sheetName || 'Datos')

    if (data.length > 0) {
        const colWidths = Object.keys(data[0]).map(key => ({
            wch: Math.max(key.length, 15)
        }))
        ws['!cols'] = colWidths
    }

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, `${options.filename}.xlsx`)
}

// ============================================================================
// CSV EXPORTS
// ============================================================================

/**
 * Exportar datos a CSV
 */
export function exportToCSV(
    data: Record<string, unknown>[],
    filename: string
) {
    const ws = XLSX.utils.json_to_sheet(data)
    const csv = XLSX.utils.sheet_to_csv(ws)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    saveAs(blob, `${filename}.csv`)
}
