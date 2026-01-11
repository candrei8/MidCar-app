import * as XLSX from 'xlsx'
import { InsurancePolicyType, INSURANCE_COMPANIES } from '@/types'

// Parsed policy data from document
export interface ParsedPolicyData {
    numeroPoliza?: string
    companiaAseguradora?: string
    tipoPoliza?: InsurancePolicyType
    matricula?: string
    fechaAlta?: string
    fechaVencimiento?: string
    primaAnual?: number
    franquicia?: number
    tomadorNombre?: string
    tomadorNif?: string
    // Raw extracted text for reference
    rawText?: string
}

// Column name mappings for different Excel formats
const COLUMN_MAPPINGS: Record<string, keyof ParsedPolicyData> = {
    // Número de póliza
    'numero_poliza': 'numeroPoliza',
    'numeropoliza': 'numeroPoliza',
    'nº poliza': 'numeroPoliza',
    'nº póliza': 'numeroPoliza',
    'n poliza': 'numeroPoliza',
    'poliza': 'numeroPoliza',
    'póliza': 'numeroPoliza',
    'policy_number': 'numeroPoliza',
    'policy number': 'numeroPoliza',
    'ref': 'numeroPoliza',
    'referencia': 'numeroPoliza',
    
    // Compañía
    'compania': 'companiaAseguradora',
    'compañia': 'companiaAseguradora',
    'aseguradora': 'companiaAseguradora',
    'company': 'companiaAseguradora',
    'insurance_company': 'companiaAseguradora',
    
    // Matrícula
    'matricula': 'matricula',
    'matrícula': 'matricula',
    'plate': 'matricula',
    'license_plate': 'matricula',
    'license plate': 'matricula',
    'registration': 'matricula',
    
    // Fechas
    'fecha_alta': 'fechaAlta',
    'fechaalta': 'fechaAlta',
    'fecha alta': 'fechaAlta',
    'fecha inicio': 'fechaAlta',
    'fechainicio': 'fechaAlta',
    'start_date': 'fechaAlta',
    'start date': 'fechaAlta',
    'inicio': 'fechaAlta',
    'efecto': 'fechaAlta',
    'fecha efecto': 'fechaAlta',
    
    'fecha_vencimiento': 'fechaVencimiento',
    'fechavencimiento': 'fechaVencimiento',
    'fecha vencimiento': 'fechaVencimiento',
    'vencimiento': 'fechaVencimiento',
    'end_date': 'fechaVencimiento',
    'end date': 'fechaVencimiento',
    'expiry': 'fechaVencimiento',
    'expiry_date': 'fechaVencimiento',
    'caducidad': 'fechaVencimiento',
    
    // Prima
    'prima': 'primaAnual',
    'prima_anual': 'primaAnual',
    'primaanual': 'primaAnual',
    'prima anual': 'primaAnual',
    'premium': 'primaAnual',
    'annual_premium': 'primaAnual',
    'importe': 'primaAnual',
    'coste': 'primaAnual',
    
    // Franquicia
    'franquicia': 'franquicia',
    'deductible': 'franquicia',
    
    // Tomador
    'tomador': 'tomadorNombre',
    'tomador_nombre': 'tomadorNombre',
    'policyholder': 'tomadorNombre',
    'holder': 'tomadorNombre',
    'nombre': 'tomadorNombre',
    
    'nif': 'tomadorNif',
    'cif': 'tomadorNif',
    'tomador_nif': 'tomadorNif',
    'nif_cif': 'tomadorNif',
}

// Policy type mappings
const POLICY_TYPE_MAPPINGS: Record<string, InsurancePolicyType> = {
    'terceros': 'terceros_basico',
    'terceros basico': 'terceros_basico',
    'terceros básico': 'terceros_basico',
    'basic': 'terceros_basico',
    'terceros ampliado': 'terceros_ampliado',
    'terceros +': 'terceros_ampliado',
    'extended': 'terceros_ampliado',
    'todo riesgo': 'todo_riesgo_sin_franquicia',
    'todoriesgo': 'todo_riesgo_sin_franquicia',
    'all risk': 'todo_riesgo_sin_franquicia',
    'comprehensive': 'todo_riesgo_sin_franquicia',
    'todo riesgo franquicia': 'todo_riesgo_franquicia',
    'todo riesgo con franquicia': 'todo_riesgo_franquicia',
    'tr franquicia': 'todo_riesgo_franquicia',
    'tr sin franquicia': 'todo_riesgo_sin_franquicia',
}

// Normalize column name for matching
function normalizeColumnName(name: string): string {
    return name.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')
}

// Parse date from various formats
function parseDate(value: any): string | undefined {
    if (!value) return undefined
    
    // If already a Date object (from xlsx)
    if (value instanceof Date) {
        return value.toISOString().split('T')[0]
    }
    
    // If string
    if (typeof value === 'string') {
        // Try ISO format
        const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
        if (isoMatch) return value.substring(0, 10)
        
        // Try DD/MM/YYYY or DD-MM-YYYY
        const euMatch = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
        if (euMatch) {
            const [, day, month, year] = euMatch
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        }
        
        // Try MM/DD/YYYY
        const usMatch = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
        if (usMatch) {
            const [, month, day, year] = usMatch
            // Assume EU format if day > 12
            if (parseInt(day) > 12) {
                return `${year}-${day.padStart(2, '0')}-${month.padStart(2, '0')}`
            }
        }
    }
    
    // If number (Excel serial date)
    if (typeof value === 'number') {
        const date = new Date((value - 25569) * 86400 * 1000)
        return date.toISOString().split('T')[0]
    }
    
    return undefined
}

// Parse number from various formats
function parseNumber(value: any): number | undefined {
    if (value === null || value === undefined || value === '') return undefined
    
    if (typeof value === 'number') return value
    
    if (typeof value === 'string') {
        // Remove currency symbols and spaces
        const cleaned = value.replace(/[€$\s]/g, '').replace(',', '.')
        const num = parseFloat(cleaned)
        return isNaN(num) ? undefined : num
    }
    
    return undefined
}

// Match company name to known companies
function matchCompany(value: string): string | undefined {
    if (!value) return undefined
    
    const normalized = value.toLowerCase().trim()
    
    for (const company of INSURANCE_COMPANIES) {
        if (normalized.includes(company.toLowerCase())) {
            return company
        }
    }
    
    // Partial matches
    if (normalized.includes('axa')) return 'AXA'
    if (normalized.includes('mapfre')) return 'Mapfre'
    if (normalized.includes('allianz')) return 'Allianz'
    if (normalized.includes('zurich')) return 'Zurich'
    if (normalized.includes('generali')) return 'Generali'
    if (normalized.includes('mutua')) return 'Mutua Madrileña'
    if (normalized.includes('linea') || normalized.includes('línea')) return 'Línea Directa'
    if (normalized.includes('pelayo')) return 'Pelayo'
    if (normalized.includes('reale')) return 'Reale'
    
    return value
}

// Match policy type
function matchPolicyType(value: string): InsurancePolicyType | undefined {
    if (!value) return undefined
    
    const normalized = value.toLowerCase().trim()
    
    for (const [key, type] of Object.entries(POLICY_TYPE_MAPPINGS)) {
        if (normalized.includes(key)) {
            return type
        }
    }
    
    return undefined
}

// Normalize matrícula
function normalizeMatricula(value: string): string {
    if (!value) return ''
    return value.toUpperCase().replace(/[\s\-\.]/g, '')
}

/**
 * Parse Excel/CSV file and extract policy data
 */
export async function parseExcelPolicyFile(file: File): Promise<ParsedPolicyData[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        
        reader.onload = (e) => {
            try {
                const data = e.target?.result
                const workbook = XLSX.read(data, { type: 'array', cellDates: true })
                
                // Get first sheet
                const sheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[sheetName]
                
                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
                
                if (jsonData.length === 0) {
                    resolve([])
                    return
                }
                
                // Get column headers and create mapping
                const firstRow = jsonData[0] as Record<string, any>
                const columnMap: Record<string, keyof ParsedPolicyData> = {}
                
                for (const colName of Object.keys(firstRow)) {
                    const normalized = normalizeColumnName(colName)
                    
                    // Check direct mapping
                    if (COLUMN_MAPPINGS[colName.toLowerCase()]) {
                        columnMap[colName] = COLUMN_MAPPINGS[colName.toLowerCase()]
                    } else {
                        // Try normalized matching
                        for (const [key, field] of Object.entries(COLUMN_MAPPINGS)) {
                            if (normalizeColumnName(key) === normalized) {
                                columnMap[colName] = field
                                break
                            }
                        }
                    }
                }
                
                // Parse each row
                const policies: ParsedPolicyData[] = jsonData.map((row: any) => {
                    const policy: ParsedPolicyData = {}
                    
                    for (const [colName, value] of Object.entries(row)) {
                        const field = columnMap[colName]
                        if (!field) continue
                        
                        switch (field) {
                            case 'fechaAlta':
                            case 'fechaVencimiento':
                                const date = parseDate(value)
                                if (date) policy[field] = date
                                break
                            case 'primaAnual':
                            case 'franquicia':
                                const num = parseNumber(value)
                                if (num !== undefined) policy[field] = num
                                break
                            case 'companiaAseguradora':
                                const company = matchCompany(String(value))
                                if (company) policy.companiaAseguradora = company
                                break
                            case 'tipoPoliza':
                                const policyType = matchPolicyType(String(value))
                                if (policyType) policy.tipoPoliza = policyType
                                break
                            case 'matricula':
                                policy.matricula = normalizeMatricula(String(value))
                                break
                            default:
                                if (value) policy[field] = String(value).trim()
                        }
                    }
                    
                    return policy
                })
                
                // Filter out empty policies
                resolve(policies.filter(p => p.numeroPoliza || p.matricula))
                
            } catch (error) {
                reject(error)
            }
        }
        
        reader.onerror = () => reject(new Error('Error reading file'))
        reader.readAsArrayBuffer(file)
    })
}

/**
 * Extract text content from a PDF file
 * This is a basic extraction - for more accurate results, consider using pdf.js
 */
export async function extractPdfText(file: File): Promise<string> {
    // For now, return empty string - PDF parsing would require additional library
    // The user can manually enter data or we can integrate pdf.js later
    console.log('PDF text extraction not yet implemented for:', file.name)
    return ''
}

/**
 * Try to extract policy data from PDF text
 */
export function parsePolicyFromText(text: string): ParsedPolicyData {
    const policy: ParsedPolicyData = { rawText: text }
    
    // Try to find policy number patterns
    const policyNumberPatterns = [
        /(?:póliza|poliza|nº|ref)[:\s]*([A-Z0-9\-\/]+)/i,
        /([A-Z]{2,4}[\-\/]?\d{4,}[\-\/]?\d{0,6})/i,
    ]
    
    for (const pattern of policyNumberPatterns) {
        const match = text.match(pattern)
        if (match) {
            policy.numeroPoliza = match[1]
            break
        }
    }
    
    // Try to find matrícula
    const matriculaPattern = /(?:matrícula|matricula)[:\s]*([A-Z0-9\s]+)/i
    const matriculaMatch = text.match(matriculaPattern)
    if (matriculaMatch) {
        policy.matricula = normalizeMatricula(matriculaMatch[1])
    } else {
        // Try Spanish plate format
        const platePattern = /\b(\d{4}[A-Z]{3})\b/
        const plateMatch = text.match(platePattern)
        if (plateMatch) {
            policy.matricula = plateMatch[1]
        }
    }
    
    // Try to find dates
    const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/g
    const dates = text.match(datePattern)
    if (dates && dates.length >= 2) {
        policy.fechaAlta = parseDate(dates[0])
        policy.fechaVencimiento = parseDate(dates[1])
    }
    
    // Try to find prima/amount
    const amountPattern = /(?:prima|importe|total)[:\s]*([0-9.,]+)\s*(?:€|EUR)?/i
    const amountMatch = text.match(amountPattern)
    if (amountMatch) {
        policy.primaAnual = parseNumber(amountMatch[1])
    }
    
    // Try to find company
    for (const company of INSURANCE_COMPANIES) {
        if (text.toLowerCase().includes(company.toLowerCase())) {
            policy.companiaAseguradora = company
            break
        }
    }
    
    return policy
}

/**
 * Auto-fill form data from uploaded file
 */
export async function parseInsuranceDocument(file: File): Promise<ParsedPolicyData | null> {
    const fileType = file.type
    const fileName = file.name.toLowerCase()
    
    try {
        // Excel/CSV files
        if (
            fileType.includes('spreadsheet') ||
            fileType.includes('excel') ||
            fileType.includes('csv') ||
            fileName.endsWith('.xlsx') ||
            fileName.endsWith('.xls') ||
            fileName.endsWith('.csv')
        ) {
            const policies = await parseExcelPolicyFile(file)
            // Return first policy found (for single policy upload)
            return policies[0] || null
        }
        
        // PDF files
        if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
            const text = await extractPdfText(file)
            if (text) {
                return parsePolicyFromText(text)
            }
            // Return empty object - user will fill manually
            return {}
        }
        
        // Image files - no parsing, user enters manually
        if (fileType.startsWith('image/')) {
            return {}
        }
        
        return null
    } catch (error) {
        console.error('Error parsing insurance document:', error)
        return null
    }
}
