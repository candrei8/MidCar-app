/**
 * insuranceFileParser.ts
 * 
 * Robust parsing service for insurance policy files.
 * Supports: Excel (.xlsx, .xls), CSV (.csv)
 * 
 * For PDFs: Currently not supported for automatic parsing in browser.
 * PDFs would require OCR or server-side processing.
 * We log a message and return empty, allowing manual entry.
 */

import * as XLSX from 'xlsx'
import { ParsedPolicy } from '@/components/insurance/ImportPreviewModal'
import type { Vehicle } from '@/types'

// Normalize license plates for matching
export const normalizeMatricula = (mat: string): string => {
    if (!mat) return ''
    return String(mat).toUpperCase().replace(/[\s\-\.]/g, '').trim()
}

// Common column name mappings (Spanish & English)
const COLUMN_MAPPINGS: Record<string, string[]> = {
    matricula: ['matricula', 'matrícula', 'plate', 'license_plate', 'license plate', 'registro', 'vehiculo_matricula', 'placa'],
    numeroPoliza: ['poliza', 'póliza', 'numero_poliza', 'nº poliza', 'policy_number', 'policy', 'n_poliza', 'num_poliza', 'npoliza', 'no poliza'],
    tipoPoliza: ['tipo', 'tipo_poliza', 'type', 'policy_type', 'cobertura', 'coverage', 'modalidad'],
    fechaAlta: ['fecha_alta', 'fecha alta', 'alta', 'start_date', 'inicio', 'fecha_inicio', 'vigencia_desde', 'desde'],
    fechaVencimiento: ['fecha_vencimiento', 'vencimiento', 'expiry', 'expiry_date', 'end_date', 'fin', 'fecha_fin', 'vigencia_hasta', 'hasta', 'caducidad', 'vence'],
    prima: ['prima', 'prima_anual', 'cost', 'premium', 'amount', 'importe', 'precio', 'coste'],
    marcaModelo: ['marca', 'modelo', 'marca_modelo', 'vehicle', 'vehiculo', 'vehículo', 'coche', 'car'],
    aseguradora: ['aseguradora', 'compania', 'compañia', 'insurance_company', 'company', 'proveedor'],
}

// Find matching column name in row keys
function findColumnKey(rowKeys: string[], targetField: string): string | null {
    const normalizedKeys = rowKeys.map(k => k.toLowerCase().trim().replace(/[^\w\s]/g, ''))
    const mappings = COLUMN_MAPPINGS[targetField] || []

    for (const mapping of mappings) {
        const idx = normalizedKeys.findIndex(k => k.includes(mapping) || mapping.includes(k))
        if (idx >= 0) return rowKeys[idx]
    }

    // Also check exact match
    const exactIdx = normalizedKeys.findIndex(k => k === targetField.toLowerCase())
    if (exactIdx >= 0) return rowKeys[exactIdx]

    return null
}

// Parse date from various formats
function parseDate(value: any): string | null {
    if (!value) return null

    // If it's already a Date object (Excel dates)
    if (value instanceof Date) {
        return value.toISOString().split('T')[0]
    }

    const str = String(value).trim()
    if (!str) return null

    // Try common date formats
    // DD/MM/YYYY or DD-MM-YYYY
    const euMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
    if (euMatch) {
        const [, day, month, year] = euMatch
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }

    // YYYY-MM-DD (ISO)
    const isoMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/)
    if (isoMatch) {
        const [, year, month, day] = isoMatch
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }

    // Try native Date parsing
    const parsed = new Date(str)
    if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0]
    }

    return null
}

// Parse number
function parseNumber(value: any): number | undefined {
    if (value === null || value === undefined || value === '') return undefined
    const num = parseFloat(String(value).replace(',', '.').replace(/[€$\s]/g, ''))
    return isNaN(num) ? undefined : num
}

export interface ParseResult {
    success: boolean
    policies: ParsedPolicy[]
    errors: string[]
    fileType: 'excel' | 'csv' | 'pdf' | 'unknown'
    matchedCount: number
    unmatchedCount: number
}

/**
 * Main parser function
 * @param file - The file to parse
 * @param vehicles - Array of vehicles to match against (from Supabase)
 */
export async function parseInsuranceFile(file: File, vehicles: Vehicle[] = []): Promise<ParseResult> {
    const fileName = file.name.toLowerCase()
    const errors: string[] = []

    // Determine file type
    let fileType: ParseResult['fileType'] = 'unknown'
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        fileType = 'excel'
    } else if (fileName.endsWith('.csv')) {
        fileType = 'csv'
    } else if (fileName.endsWith('.pdf')) {
        fileType = 'pdf'
    }

    // PDF not supported for auto-parsing
    if (fileType === 'pdf') {
        return {
            success: false,
            policies: [],
            errors: ['Los archivos PDF requieren procesamiento manual o OCR. Por favor, usa un archivo Excel o CSV, o introduce los datos manualmente.'],
            fileType,
            matchedCount: 0,
            unmatchedCount: 0
        }
    }

    if (fileType === 'unknown') {
        return {
            success: false,
            policies: [],
            errors: [`Tipo de archivo no soportado: ${file.name}. Usa .xlsx, .xls, o .csv`],
            fileType,
            matchedCount: 0,
            unmatchedCount: 0
        }
    }

    try {
        const data = await file.arrayBuffer()
        const workbook = XLSX.read(data, {
            cellDates: true,
            dateNF: 'dd/mm/yyyy',
            raw: false
        })

        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

        if (jsonData.length === 0) {
            return {
                success: false,
                policies: [],
                errors: ['El archivo está vacío o no contiene datos válidos.'],
                fileType,
                matchedCount: 0,
                unmatchedCount: 0
            }
        }

        // Get column keys from first row
        const firstRow = jsonData[0] as Record<string, any>
        const rowKeys = Object.keys(firstRow)

        // Find column mappings
        const matriculaKey = findColumnKey(rowKeys, 'matricula')
        const polizaKey = findColumnKey(rowKeys, 'numeroPoliza')
        const tipoKey = findColumnKey(rowKeys, 'tipoPoliza')
        const altaKey = findColumnKey(rowKeys, 'fechaAlta')
        const vencimientoKey = findColumnKey(rowKeys, 'fechaVencimiento')
        const primaKey = findColumnKey(rowKeys, 'prima')
        const marcaKey = findColumnKey(rowKeys, 'marcaModelo')

        if (!matriculaKey) {
            errors.push('No se encontró columna de matrícula. Asegúrate de que el archivo tenga una columna "Matrícula".')
        }

        const policies: ParsedPolicy[] = []
        let matchedCount = 0
        let unmatchedCount = 0

        jsonData.forEach((row: any, idx: number) => {
            const matriculaRaw = matriculaKey ? row[matriculaKey] : null
            const matricula = normalizeMatricula(matriculaRaw)

            if (!matricula) {
                errors.push(`Fila ${idx + 2}: Matrícula vacía o inválida`)
                return
            }

            // Check if vehicle exists in stock
            const vehicleMatch = vehicles.find(v => normalizeMatricula(v.matricula) === matricula)
            if (vehicleMatch) {
                matchedCount++
            } else {
                unmatchedCount++
            }

            const policy: ParsedPolicy = {
                numeroPoliza: polizaKey ? String(row[polizaKey] || `AUTO-${Date.now()}-${idx}`) : `AUTO-${Date.now()}-${idx}`,
                matricula: matricula,
                marcaModelo: marcaKey ? String(row[marcaKey] || '') : undefined,
                fechaAlta: altaKey ? parseDate(row[altaKey]) : null,
                fechaVencimiento: vencimientoKey ? parseDate(row[vencimientoKey]) : null,
                tipoPoliza: tipoKey ? String(row[tipoKey] || 'Todo Riesgo') : 'Todo Riesgo',
                prima: primaKey ? parseNumber(row[primaKey]) : undefined
            }

            policies.push(policy)
        })

        return {
            success: policies.length > 0,
            policies,
            errors,
            fileType,
            matchedCount,
            unmatchedCount
        }

    } catch (error) {
        console.error('Error parsing file:', error)
        return {
            success: false,
            policies: [],
            errors: [`Error al procesar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`],
            fileType,
            matchedCount: 0,
            unmatchedCount: 0
        }
    }
}

/**
 * Match parsed policies with vehicles in stock
 * @param policies - Parsed policies from the file
 * @param vehicles - Array of vehicles to match against (from Supabase)
 */
export function matchPoliciesWithVehicles(policies: ParsedPolicy[], vehicles: Vehicle[] = []) {
    const matched: Array<{
        policy: ParsedPolicy
        vehicleId: string
        vehicleName: string
        matricula: string
    }> = []

    const unmatched: ParsedPolicy[] = []

    policies.forEach(policy => {
        const vehicle = vehicles.find(
            v => normalizeMatricula(v.matricula) === policy.matricula && v.estado !== 'vendido'
        )

        if (vehicle) {
            matched.push({
                policy,
                vehicleId: vehicle.id,
                vehicleName: `${vehicle.marca} ${vehicle.modelo}`,
                matricula: vehicle.matricula
            })
        } else {
            unmatched.push(policy)
        }
    })

    // Find vehicles without a policy in this import
    const importedMatriculas = new Set(policies.map(p => p.matricula))
    const vehiclesWithoutPolicy = vehicles
        .filter(v => v.estado !== 'vendido' && !importedMatriculas.has(normalizeMatricula(v.matricula)))
        .map(v => v.matricula)

    return {
        matched,
        unmatched,
        vehiclesWithoutPolicy
    }
}
